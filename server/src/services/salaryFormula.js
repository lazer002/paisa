// server/src/services/salaryFormula.js
//
// Safe evaluator for salary component formulas (no eval / Function).
//
// Grammar: numbers, variables (case-insensitive: BASIC, GROSS, CTC,
// WORKING_DAYS, PAID_DAYS, LOP_DAYS, HOURS_PER_DAY, or the code of an
// earlier component), + - * / %, parentheses, comparisons
// (< <= > >= == !=, true = 1), the ternary `cond ? a : b`, and the
// functions min, max, round, floor, ceil, abs.
// Example: "min(BASIC * 0.12, 1800)" or "GROSS > 21000 ? 0 : GROSS * 0.0075"

export const FORMULA_VARIABLES = [
  "BASIC",
  "GROSS",
  "CTC",
  "WORKING_DAYS",
  "PAID_DAYS",
  "LOP_DAYS",
  "HOURS_PER_DAY",
];

const FUNCTIONS = {
  MIN: (...a) => Math.min(...a),
  MAX: (...a) => Math.max(...a),
  ROUND: (x, digits = 0) => {
    const f = 10 ** digits;
    return Math.round(x * f) / f;
  },
  FLOOR: (x) => Math.floor(x),
  CEIL: (x) => Math.ceil(x),
  ABS: (x) => Math.abs(x),
};

const TOKEN = /\s*(?:(\d+(?:\.\d+)?|\.\d+)|([A-Za-z_][A-Za-z0-9_]*)|(<=|>=|==|!=|[-+*/%()<>?:,]))/y;

const tokenize = (source) => {
  const tokens = [];
  TOKEN.lastIndex = 0;
  const text = String(source ?? "");

  while (TOKEN.lastIndex < text.length) {
    if (/^\s*$/.test(text.slice(TOKEN.lastIndex))) break;
    const at = TOKEN.lastIndex;
    const m = TOKEN.exec(text);
    if (!m) throw new Error(`Unexpected character at position ${at + 1}`);
    if (m[1] !== undefined) tokens.push({ kind: "num", value: Number(m[1]) });
    else if (m[2] !== undefined) tokens.push({ kind: "id", value: m[2].toUpperCase() });
    else tokens.push({ kind: "op", value: m[3] });
  }

  return tokens;
};

/** Parse to a small AST. Throws Error with a readable message. */
export const parseFormula = (source) => {
  const tokens = tokenize(source);
  if (!tokens.length) throw new Error("Formula is empty");
  let i = 0;

  const peek = () => tokens[i];
  const isOp = (v) => peek()?.kind === "op" && peek().value === v;
  const expect = (v) => {
    if (!isOp(v)) throw new Error(`Expected "${v}"`);
    i += 1;
  };

  const ternary = () => {
    const cond = comparison();
    if (!isOp("?")) return cond;
    i += 1;
    const yes = ternary();
    expect(":");
    const no = ternary();
    return { t: "if", cond, yes, no };
  };

  const comparison = () => {
    let left = additive();
    while (["<", "<=", ">", ">=", "==", "!="].some(isOp)) {
      const op = tokens[i++].value;
      left = { t: "bin", op, left, right: additive() };
    }
    return left;
  };

  const additive = () => {
    let left = multiplicative();
    while (isOp("+") || isOp("-")) {
      const op = tokens[i++].value;
      left = { t: "bin", op, left, right: multiplicative() };
    }
    return left;
  };

  const multiplicative = () => {
    let left = unary();
    while (isOp("*") || isOp("/") || isOp("%")) {
      const op = tokens[i++].value;
      left = { t: "bin", op, left, right: unary() };
    }
    return left;
  };

  const unary = () => {
    if (isOp("-")) {
      i += 1;
      return { t: "neg", arg: unary() };
    }
    if (isOp("+")) {
      i += 1;
      return unary();
    }
    return primary();
  };

  const primary = () => {
    const tok = peek();
    if (!tok) throw new Error("Formula ends unexpectedly");

    if (tok.kind === "num") {
      i += 1;
      return { t: "num", value: tok.value };
    }

    if (tok.kind === "id") {
      i += 1;
      if (!isOp("(")) return { t: "var", name: tok.value };
      if (!FUNCTIONS[tok.value]) throw new Error(`Unknown function ${tok.value}`);
      i += 1;
      const args = [];
      if (!isOp(")")) {
        args.push(ternary());
        while (isOp(",")) {
          i += 1;
          args.push(ternary());
        }
      }
      expect(")");
      return { t: "call", name: tok.value, args };
    }

    if (isOp("(")) {
      i += 1;
      const inner = ternary();
      expect(")");
      return inner;
    }

    throw new Error(`Unexpected "${tok.value}"`);
  };

  const ast = ternary();
  if (i < tokens.length) throw new Error(`Unexpected "${tokens[i].value}"`);
  return ast;
};

/** Variable names a parsed formula reads. */
export const formulaVariables = (ast, out = new Set()) => {
  if (ast.t === "var") out.add(ast.name);
  for (const child of [ast.left, ast.right, ast.arg, ast.cond, ast.yes, ast.no, ...(ast.args ?? [])]) {
    if (child) formulaVariables(child, out);
  }
  return out;
};

const run = (ast, vars) => {
  switch (ast.t) {
    case "num":
      return ast.value;
    case "var":
      return Number(vars[ast.name]) || 0;
    case "neg":
      return -run(ast.arg, vars);
    case "if":
      return run(ast.cond, vars) ? run(ast.yes, vars) : run(ast.no, vars);
    case "call":
      return FUNCTIONS[ast.name](...ast.args.map((a) => run(a, vars)));
    default: {
      const a = run(ast.left, vars);
      const b = run(ast.right, vars);
      switch (ast.op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": return b === 0 ? 0 : a / b;
        case "%": return b === 0 ? 0 : a % b;
        case "<": return Number(a < b);
        case "<=": return Number(a <= b);
        case ">": return Number(a > b);
        case ">=": return Number(a >= b);
        case "==": return Number(a === b);
        default: return Number(a !== b);
      }
    }
  }
};

/**
 * Evaluate a formula. vars keys are upper-case; unknown variables read as 0.
 * Returns a finite number >= 0 (salary amounts can't be negative).
 */
export const evaluateFormula = (source, vars = {}) => {
  const value = run(parseFormula(source), vars);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

/**
 * Check a formula when a structure is saved: it must parse and may only read
 * the built-in variables or the codes of other components in the structure.
 * Returns an error message, or null when the formula is fine.
 */
export const validateFormula = (source, componentCodes = []) => {
  try {
    const allowed = new Set([...FORMULA_VARIABLES, ...componentCodes.map((c) => String(c).toUpperCase())]);
    const unknown = [...formulaVariables(parseFormula(source))].filter((v) => !allowed.has(v));
    return unknown.length ? `Unknown variable(s): ${unknown.join(", ")}` : null;
  } catch (error) {
    return error.message;
  }
};
