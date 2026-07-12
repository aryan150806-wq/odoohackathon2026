# AssetFlow Security Rules (Always On)

## SQL Injection Prevention
- No raw SQL string concatenation, ever.
- Use Prisma's typed client for 100% of queries.
- If raw SQL is required (complex reporting), use `$queryRaw` with tagged template literals (Prisma auto-parameterizes these) or explicit `Prisma.sql` with bind parameters.
- Never use `$queryRawUnsafe` or `$executeRawUnsafe`.
- Validate and whitelist all sort/filter fields against a fixed enum — never pass client-supplied column names into ORDER BY.

## Authentication
- Hash passwords with bcrypt (cost ≥ 12). Never MD5/SHA1/plaintext.
- Short-lived JWT access token (15 min) + httpOnly, Secure, SameSite=Strict refresh cookie.
- No tokens in localStorage.
- Rate-limit login: 5 attempts / 15 min per email.
- Generic error messages ("Invalid email or password") — never reveal whether email exists.
- Forgot-password tokens: single-use, 1hr expiry, invalidate all sessions on reset.

## Authorization (RBAC)
- Role is set ONLY via Admin promotion flow. Strip any `role` field from signup/self-update requests.
- Re-derive caller's role from the verified JWT + DB lookup — never trust a role claim from request body.
- Enforce authorization at the service layer with guards, not just by hiding UI buttons.
- Department Heads/Asset Managers: verify department ownership server-side on every read/write.

## Input Validation
- Schema-validate every request body/query/params (class-validator + class-transformer in NestJS) before business logic.
- Sanitize user-supplied content rendered in UI to prevent stored XSS.
- File uploads: validate MIME type + magic bytes, enforce size limits (10MB max), store outside web root.

## Transport & Secrets
- CSRF protection on cookie-authenticated state-changing routes.
- No secrets in source control — env vars only.
- Principle of least privilege for DB user and object-storage credentials.

## Auditability
- Activity Log is append-only: no update/delete endpoints.
- Log security-relevant events: failed logins, role promotions, permission denials, audit closures.
