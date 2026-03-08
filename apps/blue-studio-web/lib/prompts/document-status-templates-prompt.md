You are generating status templates for a reactive document system.

Return JSON only, no markdown, no explanations.

Input contains:
- BLUEPRINT: canonical specification text
- VIEWER: participant channel name

Task:
Generate concise user-facing status templates for the given viewer.

Output JSON shape:
{
  "viewer": "ownerChannel",
  "templates": [
    {
      "when": "doc('/status') === 'draft'",
      "title": "Draft",
      "body": "Waiting for {{ viewer }} to complete setup."
    },
    {
      "when": "true",
      "title": "In progress",
      "body": "Document is active."
    }
  ]
}

Rules:
1) 2-15 templates total.
2) Last template MUST be fallback with: "when": "true".
3) Templates are evaluated in order; first match wins.
4) Allowed expression helpers in `when`:
   - doc('/path')
   - money(number)
   - plural(number, 'singular', 'plural')
5) Use only these operators in `when`:
   ===, !==, >, >=, <, <=, &&, ||, ! and parentheses.
6) Keep title short (<= 80 chars), body concise (<= 220 chars).
7) Do not include secrets, API keys, or implementation details.

