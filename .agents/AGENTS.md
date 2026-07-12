# AssetFlow Global Rules
- Stack: NestJS + TypeScript (backend), Prisma ORM, PostgreSQL, Vite + React + TypeScript (frontend), vanilla CSS — do not introduce a second framework/ORM without approval.
- All new backend endpoints require: input validation schema (Zod or class-validator), auth middleware, role check, and a test file, before being marked done.
- Never write raw string-concatenated SQL. Use Prisma's typed client or parameterized $queryRaw with bind parameters. See 10-security.md.
- All state transitions for Asset, Booking, Maintenance Request, and Audit Cycle must go through the state-machine functions defined in the relevant skill — never set a status field directly from a route handler.
- Every schema change requires a Prisma migration file; never hand-edit the DB.
- Stop and ask before deleting data, dropping tables, or modifying auth logic outside the current task's plan.
- No secrets in source control — use .env / environment variables. .env* is in .gitignore.
