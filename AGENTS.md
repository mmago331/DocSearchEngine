# Repository Guidelines

- Use npm workspaces when running scripts. Prefer commands like `npm run <script> --workspace backend` or `--workspace frontend` instead of changing directories.
- Keep the root `README.md` and any relevant package READMEs up to date whenever you change setup steps, environment variables, or developer workflows.
- Document new environment variables in the "Environment variables" table in the root README.
- TypeScript code should match the existing style (two-space indentation, named exports where practical, and no default exports for utility modules).
- When you add or modify backend functionality, run `npm run typecheck --workspace backend`. For frontend changes, run `npm run build --workspace frontend` before submission when feasible.
