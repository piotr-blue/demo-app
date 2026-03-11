### Agent Guidelines

**Purpose**: Ensure every contribution is type-safe and lint-clean.

- **TypeScript**: All code must pass TypeScript type checking without errors.
- **ESLint**: All code must pass ESLint with no lint errors.

Before marking a task as complete, run your TypeScript type-check and ESLint linting locally and fix any reported issues.

Example commands (adjust to the workspace):

- `tsc`
- `eslint .`

Execute tests to confirm no regression.

Work iteratively, make small commits with conventional commits format.

Adhere to:
- demo-app/.cursor/rules/blue-ts-dsl-version-a-final-corrections.mdc
- demo-app/.cursor/rules/blue-ts-dsl-version-a-final-corrections.mdc-testing.mdc