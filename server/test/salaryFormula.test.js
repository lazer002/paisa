import test from "node:test";
import assert from "node:assert/strict";

import { evaluateFormula, validateFormula } from "../src/services/salaryFormula.js";

test("arithmetic, precedence, functions and variables", () => {
  assert.equal(evaluateFormula("2 + 3 * 4"), 14);
  assert.equal(evaluateFormula("(2 + 3) * 4"), 20);
  assert.equal(evaluateFormula("min(basic * 0.12, 1800)", { BASIC: 20000 }), 1800);
  assert.equal(evaluateFormula("round(BASIC / 3, 2)", { BASIC: 100 }), 33.33);
  assert.equal(evaluateFormula("HRA * 0.1", { HRA: 5000 }), 500);
});

test("comparisons and the ternary", () => {
  const esi = "GROSS > 21000 ? 0 : GROSS * 0.0075";
  assert.equal(evaluateFormula(esi, { GROSS: 30000 }), 0);
  assert.equal(evaluateFormula(esi, { GROSS: 20000 }), 150);
});

test("never negative, never NaN; division by zero is 0", () => {
  assert.equal(evaluateFormula("10 - 50"), 0);
  assert.equal(evaluateFormula("BASIC / WORKING_DAYS", { BASIC: 100, WORKING_DAYS: 0 }), 0);
  assert.equal(evaluateFormula("MISSING * 2"), 0);
});

test("rejects code and bad syntax", () => {
  assert.throws(() => evaluateFormula("process.exit(1)"));
  assert.throws(() => evaluateFormula("constructor('x')()"));
  assert.throws(() => evaluateFormula("2 +"));
  assert.throws(() => evaluateFormula(""));
});

test("validateFormula checks variables against the structure's codes", () => {
  assert.equal(validateFormula("BASIC * 0.4"), null);
  assert.equal(validateFormula("hra * 0.1", ["HRA"]), null);
  assert.match(validateFormula("FOO * 2", ["HRA"]), /Unknown variable\(s\): FOO/);
  assert.match(validateFormula("BASIC *"), /ends unexpectedly/);
});
