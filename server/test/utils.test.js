import test from "node:test";
import assert from "node:assert/strict";

import { distanceMeters, isValidCoordinate } from "../src/utils/geo.js";
import { pickFields, escapeRegex } from "../src/utils/crudHelpers.js";
import { hashCode } from "../src/controllers/qrSessionController.js";

test("distanceMeters is zero for the same point", () => {
  const point = { latitude: 12.9716, longitude: 77.5946 };
  assert.equal(Math.round(distanceMeters(point, point)), 0);
});

test("distanceMeters measures roughly 111 km per degree of latitude", () => {
  const meters = distanceMeters(
    { latitude: 0, longitude: 0 },
    { latitude: 1, longitude: 0 }
  );
  assert.ok(meters > 110000 && meters < 112500, `got ${meters}`);
});

test("a point 100 m away is inside a 150 m radius and 300 m is not", () => {
  const origin = { latitude: 12.9716, longitude: 77.5946 };
  // ~0.0009 degrees of latitude is about 100 m
  const near = { latitude: 12.9716 + 0.0009, longitude: 77.5946 };
  const far = { latitude: 12.9716 + 0.0027, longitude: 77.5946 };
  assert.ok(distanceMeters(origin, near) <= 150);
  assert.ok(distanceMeters(origin, far) > 150);
});

test("isValidCoordinate rejects out-of-range and non-numeric values", () => {
  assert.equal(isValidCoordinate(12.9, 77.5), true);
  assert.equal(isValidCoordinate(91, 0), false);
  assert.equal(isValidCoordinate(0, 181), false);
  assert.equal(isValidCoordinate(NaN, 0), false);
  assert.equal(isValidCoordinate(undefined, 0), false);
});

test("pickFields keeps only listed keys and never lets extras through", () => {
  const picked = pickFields(
    { title: "ID", instituteId: "evil", role: "super_admin" },
    ["title", "type"]
  );
  assert.deepEqual(picked, { title: "ID" });
});

test("pickFields turns empty strings into null so optional fields can be cleared", () => {
  assert.deepEqual(pickFields({ email: "" }, ["email"]), { email: null });
});

test("escapeRegex neutralises regex metacharacters", () => {
  const pattern = new RegExp(escapeRegex("a.b*(c)"));
  assert.ok(pattern.test("a.b*(c)"));
  assert.equal(pattern.test("aXb"), false);
});

test("hashCode ignores case and surrounding whitespace but separates codes", () => {
  assert.equal(hashCode(" abcd2345 "), hashCode("ABCD2345"));
  assert.notEqual(hashCode("ABCD2345"), hashCode("ABCD2346"));
  assert.equal(hashCode("ABCD2345").length, 64);
});
