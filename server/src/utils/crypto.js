// server/src/utils/crypto.js

import crypto from "node:crypto";

const DEFAULT_HASH_ALGORITHM = "sha256";

const hash = (
  value,
  algorithm = DEFAULT_HASH_ALGORITHM
) => {
  if (
    value === undefined ||
    value === null
  ) {
    throw new TypeError(
      "Value is required for hashing"
    );
  }

  return crypto
    .createHash(algorithm)
    .update(String(value), "utf8")
    .digest("hex");
};

const hashBuffer = (
  buffer,
  algorithm = DEFAULT_HASH_ALGORITHM
) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError(
      "A Buffer is required"
    );
  }

  return crypto
    .createHash(algorithm)
    .update(buffer)
    .digest("hex");
};

const hmac = (
  value,
  secret,
  algorithm = DEFAULT_HASH_ALGORITHM
) => {
  if (!secret) {
    throw new TypeError(
      "HMAC secret is required"
    );
  }

  return crypto
    .createHmac(algorithm, secret)
    .update(String(value), "utf8")
    .digest("hex");
};

const generateRandomBytes = (
  size = 32
) => {
  if (
    !Number.isInteger(size) ||
    size <= 0
  ) {
    throw new TypeError(
      "Random byte size must be a positive integer"
    );
  }

  return crypto.randomBytes(size);
};

const generateRandomHex = (
  size = 32
) => {
  return generateRandomBytes(size).toString(
    "hex"
  );
};

const generateRandomToken = (
  size = 32
) => {
  return generateRandomHex(size);
};

const generateUUID = () => {
  return crypto.randomUUID();
};

const generateOTP = (
  length = 6
) => {
  if (
    !Number.isInteger(length) ||
    length < 4 ||
    length > 12
  ) {
    throw new TypeError(
      "OTP length must be between 4 and 12"
    );
  }

  const minimum = 10 ** (length - 1);
  const maximum = 10 ** length - 1;

  const randomNumber =
    crypto.randomInt(
      minimum,
      maximum + 1
    );

  return String(randomNumber);
};

const generateNumericCode = (
  length = 6
) => {
  return generateOTP(length);
};

const timingSafeEqual = (
  first,
  second
) => {
  if (
    first === undefined ||
    first === null ||
    second === undefined ||
    second === null
  ) {
    return false;
  }

  const firstBuffer = Buffer.from(
    String(first),
    "utf8"
  );

  const secondBuffer = Buffer.from(
    String(second),
    "utf8"
  );

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    firstBuffer,
    secondBuffer
  );
};

const encrypt = (
  plaintext,
  key,
  algorithm = "aes-256-gcm"
) => {
  if (!key) {
    throw new TypeError(
      "Encryption key is required"
    );
  }

  const keyBuffer = Buffer.isBuffer(key)
    ? key
    : Buffer.from(key, "hex");

  if (keyBuffer.length !== 32) {
    throw new TypeError(
      "AES-256-GCM key must be exactly 32 bytes"
    );
  }

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    algorithm,
    keyBuffer,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(
      String(plaintext),
      "utf8"
    ),
    cipher.final(),
  ]);

  const authTag =
    cipher.getAuthTag();

  return {
    algorithm,
    iv: iv.toString("hex"),
    content: encrypted.toString(
      "hex"
    ),
    authTag: authTag.toString(
      "hex"
    ),
  };
};

const decrypt = (
  payload,
  key,
  algorithm = "aes-256-gcm"
) => {
  if (!key) {
    throw new TypeError(
      "Decryption key is required"
    );
  }

  if (
    !payload ||
    !payload.iv ||
    !payload.content ||
    !payload.authTag
  ) {
    throw new TypeError(
      "Invalid encrypted payload"
    );
  }

  const keyBuffer = Buffer.isBuffer(key)
    ? key
    : Buffer.from(key, "hex");

  if (keyBuffer.length !== 32) {
    throw new TypeError(
      "AES-256-GCM key must be exactly 32 bytes"
    );
  }

  const decipher =
    crypto.createDecipheriv(
      algorithm,
      keyBuffer,
      Buffer.from(payload.iv, "hex")
    );

  decipher.setAuthTag(
    Buffer.from(
      payload.authTag,
      "hex"
    )
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        Buffer.from(
          payload.content,
          "hex"
        )
      ),
      decipher.final(),
    ]);

  return decrypted.toString("utf8");
};

const createPasswordResetToken = () => {
  return generateRandomToken(32);
};

const createEmailVerificationToken = () => {
  return generateRandomToken(32);
};

const createRefreshTokenSecret = () => {
  return generateRandomToken(64);
};

const createSessionToken = () => {
  return generateRandomToken(64);
};

const normalizeSecret = (
  secret
) => {
  if (
    secret === undefined ||
    secret === null
  ) {
    throw new TypeError(
      "Secret is required"
    );
  }

  return Buffer.from(
    String(secret),
    "utf8"
  );
};

export {
  hash,
  hashBuffer,
  hmac,
  generateRandomBytes,
  generateRandomHex,
  generateRandomToken,
  generateUUID,
  generateOTP,
  generateNumericCode,
  timingSafeEqual,
  encrypt,
  decrypt,
  createPasswordResetToken,
  createEmailVerificationToken,
  createRefreshTokenSecret,
  createSessionToken,
  normalizeSecret,
};

export default {
  hash,
  hashBuffer,
  hmac,
  generateRandomBytes,
  generateRandomHex,
  generateRandomToken,
  generateUUID,
  generateOTP,
  generateNumericCode,
  timingSafeEqual,
  encrypt,
  decrypt,
  createPasswordResetToken,
  createEmailVerificationToken,
  createRefreshTokenSecret,
  createSessionToken,
  normalizeSecret,
};
