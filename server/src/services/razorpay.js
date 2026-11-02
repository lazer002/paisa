// server/src/services/razorpay.js
//
// Minimal Razorpay REST client (orders, payments, refunds) and signature
// checks. Amounts at this boundary are in rupees; Razorpay wants paise.

import crypto from "node:crypto";

import env from "../config/env.js";
import logger from "../config/logger.js";
import ApiError from "../utils/ApiError.js";

const API = "https://api.razorpay.com/v1";

export const isRazorpayConfigured = () =>
  Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

const toPaise = (amount) => Math.round(Number(amount) * 100);

const request = async (method, path, body) => {
  if (!isRazorpayConfigured()) {
    throw new ApiError("Online payments are not configured", 503, {
      code: "PAYMENTS_NOT_CONFIGURED",
    });
  }

  const auth = Buffer.from(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  let response;

  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    logger.warn("Razorpay unreachable", { path, error: error.message });

    throw new ApiError("The payment gateway is unreachable. Try again shortly", 502, {
      code: "PAYMENT_GATEWAY_UNREACHABLE",
    });
  }

  const data = await response.json().catch(() => ({}));

  // Wrong or revoked keys: tell the payer plainly, tell the operator why.
  if (response.status === 401) {
    logger.warn(
      "Razorpay rejected the API keys: check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in server/.env",
      { path }
    );

    throw new ApiError("Online payments are not set up correctly. Please contact the administrator", 502, {
      code: "PAYMENT_GATEWAY_AUTH_FAILED",
    });
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error?.description || "Payment gateway request failed",
      502,
      { code: "PAYMENT_GATEWAY_ERROR" }
    );
  }

  return data;
};

export const createOrder = ({ amount, currency = "INR", receipt, notes }) =>
  request("POST", "/orders", {
    amount: toPaise(amount),
    currency,
    receipt: String(receipt).slice(0, 40),
    notes,
  });

export const fetchPayment = (paymentId) =>
  request("GET", `/payments/${encodeURIComponent(paymentId)}`);

export const refundPayment = (paymentId, amount, notes) =>
  request("POST", `/payments/${encodeURIComponent(paymentId)}/refund`, {
    amount: toPaise(amount),
    notes,
  });

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

/** Checkout success handler signature: HMAC(order_id|payment_id, key secret). */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) =>
  Boolean(env.RAZORPAY_KEY_SECRET && orderId && paymentId && signature) &&
  safeEqual(
    crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex"),
    signature
  );

/** Webhook signature: HMAC(raw body, webhook secret). */
export const verifyWebhookSignature = (rawBody, signature) =>
  Boolean(env.RAZORPAY_WEBHOOK_SECRET && rawBody && signature) &&
  safeEqual(
    crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex"),
    signature
  );
