import type {
  ResolvedStatusMessage,
  StatusTemplate,
  StatusTemplateBundle,
} from "@/lib/workspace/types";
import {
  docLookup,
  formatMoney,
  pluralize,
  stringifyTemplateValue,
} from "@/lib/document/status-templates/format";

type Token =
  | { type: "eof"; value: "" }
  | { type: "operator"; value: string }
  | { type: "paren"; value: "(" | ")" }
  | { type: "comma"; value: "," }
  | { type: "number"; value: string }
  | { type: "string"; value: string }
  | { type: "identifier"; value: string }
  | { type: "boolean"; value: "true" | "false" }
  | { type: "null"; value: "null" };

type ExpressionNode =
  | { kind: "literal"; value: unknown }
  | { kind: "unary"; operator: "!"; argument: ExpressionNode }
  | {
      kind: "binary";
      operator: "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||";
      left: ExpressionNode;
      right: ExpressionNode;
    }
  | { kind: "call"; name: "doc" | "money" | "plural"; args: ExpressionNode[] };

interface EvaluationContext {
  document: unknown;
  currencyCode: string | null;
}

const OPERATOR_ORDER = ["===", "!==", ">=", "<=", "&&", "||", ">", "<", "!"] as const;

function createStatusId(): string {
  return `status_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (!char) {
      break;
    }

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      index += 1;
      continue;
    }

    if (char === ",") {
      tokens.push({ type: "comma", value: "," });
      index += 1;
      continue;
    }

    if (char === "'" || char === '"') {
      const quote = char;
      index += 1;
      let value = "";
      while (index < expression.length) {
        const current = expression[index];
        if (current === "\\") {
          const escaped = expression[index + 1];
          if (!escaped) {
            throw new Error("Unterminated string literal.");
          }
          if (escaped === "n") {
            value += "\n";
          } else if (escaped === "t") {
            value += "\t";
          } else {
            value += escaped;
          }
          index += 2;
          continue;
        }
        if (current === quote) {
          index += 1;
          break;
        }
        value += current;
        index += 1;
      }
      tokens.push({ type: "string", value });
      continue;
    }

    const matchedOperator = OPERATOR_ORDER.find((operator) =>
      expression.slice(index).startsWith(operator)
    );
    if (matchedOperator) {
      tokens.push({ type: "operator", value: matchedOperator });
      index += matchedOperator.length;
      continue;
    }

    if (/[0-9]/.test(char)) {
      let end = index + 1;
      while (end < expression.length && /[0-9.]/.test(expression[end] ?? "")) {
        end += 1;
      }
      const value = expression.slice(index, end);
      if (!/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
        throw new Error(`Unsupported number literal: ${value}`);
      }
      tokens.push({ type: "number", value });
      index = end;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let end = index + 1;
      while (end < expression.length && /[A-Za-z0-9_]/.test(expression[end] ?? "")) {
        end += 1;
      }
      const value = expression.slice(index, end);
      if (value === "true" || value === "false") {
        tokens.push({ type: "boolean", value });
      } else if (value === "null") {
        tokens.push({ type: "null", value: "null" });
      } else {
        tokens.push({ type: "identifier", value });
      }
      index = end;
      continue;
    }

    throw new Error(`Unsupported token near: ${expression.slice(index, index + 12)}`);
  }

  tokens.push({ type: "eof", value: "" });
  return tokens;
}

class Parser {
  private readonly tokens: Token[];

  private position = 0;

  constructor(expression: string) {
    this.tokens = tokenize(expression);
  }

  parse(): ExpressionNode {
    const node = this.parseLogicalOr();
    this.expect("eof");
    return node;
  }

  private current(): Token {
    return this.tokens[this.position] ?? { type: "eof", value: "" };
  }

  private match(type: Token["type"], value?: string): Token | null {
    const token = this.current();
    if (token.type !== type) {
      return null;
    }
    if (value !== undefined && token.value !== value) {
      return null;
    }
    this.position += 1;
    return token;
  }

  private expect(type: Token["type"], value?: string): Token {
    const token = this.match(type, value);
    if (!token) {
      throw new Error(`Expected ${value ?? type}, found ${this.current().type}`);
    }
    return token;
  }

  private parseLogicalOr(): ExpressionNode {
    let node = this.parseLogicalAnd();
    while (this.match("operator", "||")) {
      node = {
        kind: "binary",
        operator: "||",
        left: node,
        right: this.parseLogicalAnd(),
      };
    }
    return node;
  }

  private parseLogicalAnd(): ExpressionNode {
    let node = this.parseEquality();
    while (this.match("operator", "&&")) {
      node = {
        kind: "binary",
        operator: "&&",
        left: node,
        right: this.parseEquality(),
      };
    }
    return node;
  }

  private parseEquality(): ExpressionNode {
    let node = this.parseComparison();
    for (;;) {
      if (this.match("operator", "===")) {
        node = {
          kind: "binary",
          operator: "===",
          left: node,
          right: this.parseComparison(),
        };
        continue;
      }
      if (this.match("operator", "!==")) {
        node = {
          kind: "binary",
          operator: "!==",
          left: node,
          right: this.parseComparison(),
        };
        continue;
      }
      return node;
    }
  }

  private parseComparison(): ExpressionNode {
    let node = this.parseUnary();
    for (;;) {
      if (this.match("operator", ">")) {
        node = {
          kind: "binary",
          operator: ">",
          left: node,
          right: this.parseUnary(),
        };
        continue;
      }
      if (this.match("operator", ">=")) {
        node = {
          kind: "binary",
          operator: ">=",
          left: node,
          right: this.parseUnary(),
        };
        continue;
      }
      if (this.match("operator", "<")) {
        node = {
          kind: "binary",
          operator: "<",
          left: node,
          right: this.parseUnary(),
        };
        continue;
      }
      if (this.match("operator", "<=")) {
        node = {
          kind: "binary",
          operator: "<=",
          left: node,
          right: this.parseUnary(),
        };
        continue;
      }
      return node;
    }
  }

  private parseUnary(): ExpressionNode {
    if (this.match("operator", "!")) {
      return { kind: "unary", operator: "!", argument: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionNode {
    const number = this.match("number");
    if (number) {
      return { kind: "literal", value: Number(number.value) };
    }
    const string = this.match("string");
    if (string) {
      return { kind: "literal", value: string.value };
    }
    const booleanToken = this.match("boolean");
    if (booleanToken) {
      return { kind: "literal", value: booleanToken.value === "true" };
    }
    if (this.match("null")) {
      return { kind: "literal", value: null };
    }
    if (this.match("paren", "(")) {
      const expression = this.parseLogicalOr();
      this.expect("paren", ")");
      return expression;
    }

    const identifier = this.match("identifier");
    if (identifier) {
      const functionName = identifier.value as "doc" | "money" | "plural";
      if (!this.match("paren", "(")) {
        throw new Error(`Unsupported identifier: ${identifier.value}`);
      }
      const args: ExpressionNode[] = [];
      if (!this.match("paren", ")")) {
        do {
          args.push(this.parseLogicalOr());
        } while (this.match("comma"));
        this.expect("paren", ")");
      }
      if (!["doc", "money", "plural"].includes(functionName)) {
        throw new Error(`Unsupported function: ${identifier.value}`);
      }
      return { kind: "call", name: functionName, args };
    }

    throw new Error(`Unexpected token: ${this.current().type}`);
  }
}

function evaluateExpressionNode(node: ExpressionNode, context: EvaluationContext): unknown {
  if (node.kind === "literal") {
    return node.value;
  }
  if (node.kind === "unary") {
    return !Boolean(evaluateExpressionNode(node.argument, context));
  }
  if (node.kind === "binary") {
    if (node.operator === "&&") {
      return (
        Boolean(evaluateExpressionNode(node.left, context)) &&
        Boolean(evaluateExpressionNode(node.right, context))
      );
    }
    if (node.operator === "||") {
      return (
        Boolean(evaluateExpressionNode(node.left, context)) ||
        Boolean(evaluateExpressionNode(node.right, context))
      );
    }

    const left = evaluateExpressionNode(node.left, context);
    const right = evaluateExpressionNode(node.right, context);
    switch (node.operator) {
      case "===":
        return left === right;
      case "!==":
        return left !== right;
      case ">":
        return Number(left) > Number(right);
      case ">=":
        return Number(left) >= Number(right);
      case "<":
        return Number(left) < Number(right);
      case "<=":
        return Number(left) <= Number(right);
      default:
        return false;
    }
  }

  if (node.kind === "call") {
    const args = node.args.map((arg) => evaluateExpressionNode(arg, context));
    if (node.name === "doc") {
      const path = args[0];
      if (typeof path !== "string") {
        throw new Error("doc(path) requires a string path.");
      }
      return docLookup(context.document, path);
    }
    if (node.name === "money") {
      return formatMoney(args[0], context.currencyCode);
    }
    if (node.name === "plural") {
      return pluralize(args[0], args[1], args[2]);
    }
  }

  throw new Error("Unsupported expression node.");
}

export function evaluateStatusExpression(
  expression: string,
  context: { document: unknown; currencyCode: string | null }
): unknown {
  const parser = new Parser(expression);
  const ast = parser.parse();
  return evaluateExpressionNode(ast, context);
}

export function interpolateTemplateText(
  templateText: string,
  context: { document: unknown; currencyCode: string | null }
): string {
  return templateText.replace(/{{\s*([^}]+)\s*}}/g, (_whole, expression: string) =>
    stringifyTemplateValue(evaluateStatusExpression(expression, context))
  );
}

export function sameResolvedStatus(
  left: ResolvedStatusMessage | null,
  right: ResolvedStatusMessage
): boolean {
  if (!left) {
    return false;
  }
  return left.viewer === right.viewer && left.title === right.title && left.body === right.body;
}

function resolveTemplate(
  templates: StatusTemplate[],
  context: { document: unknown; currencyCode: string | null }
): StatusTemplate {
  for (const template of templates) {
    const matched = Boolean(evaluateStatusExpression(template.when, context));
    if (matched) {
      return template;
    }
  }
  throw new Error("No status template matched.");
}

export function resolveStatusMessage(params: {
  bundle: StatusTemplateBundle;
  viewer: string;
  document: unknown;
  currencyCode: string | null;
  sourceSnapshotId: string | null;
  previous: ResolvedStatusMessage | null;
}): {
  resolved: ResolvedStatusMessage;
  changed: boolean;
} {
  const context = {
    document: params.document,
    currencyCode: params.currencyCode,
  };
  const matchedTemplate = resolveTemplate(params.bundle.templates, context);
  const resolved: ResolvedStatusMessage = {
    id: createStatusId(),
    viewer: params.viewer,
    title: interpolateTemplateText(matchedTemplate.title, context),
    body: interpolateTemplateText(matchedTemplate.body, context),
    matchedWhen: matchedTemplate.when,
    sourceSnapshotId: params.sourceSnapshotId,
    createdAt: new Date().toISOString(),
  };
  return {
    resolved,
    changed: !sameResolvedStatus(params.previous, resolved),
  };
}

