# Web_Excel — Vercel + NeonDB

Branch: `feat/vercel-neon-manual-save` (main unchanged).

## Neon setup
Run `neon/schema.sql` in the Neon SQL Editor. Single JSONB workbook in `workbooks`, id `primary`.

## Vercel settings
- Production Branch: `feat/vercel-neon-manual-save`
- Framework: Other; root: repository root
- Environment variables (Production):
  - `DATABASE_URL`: Neon PostgreSQL connection string
  - `APP_PASSWORD`: exactly **four numeric digits**, for example `1234` **only as an example, do not use it**
- Redeploy Production after setting/changing environment variables.
- Secrets remain server-side. Do not enter them in GitHub code or client-exposed Vercel variables.

## Operation
1. Open website. No login prompt.
2. Browser requests `GET /api/workbook` **once** on page start, without PIN. On success, data replaces the browser draft; on 404, empty/default local workbook is used.
3. Request has an **8-second browser timeout**; it is a deadline, **not a guarantee** of cloud response speed. When unavailable, LocalStorage draft stays visible but DB save is disabled until a successful reload. A server request might continue after a client timeout; check the DB before retrying a timed-out save.
4. For manual save, type a 4-digit PIN into the top toolbar and click `DB 저장` (or Ctrl+S). `PUT /api/workbook` verifies `APP_PASSWORD` on the server.
5. LocalStorage continues updating as a local temporary draft; it does not trigger DB writes.
6. Stored version is checked: conflicting newer writes return HTTP 409. Refresh to load the latest cloud data before editing again. **A refresh overwrites any unsaved local draft when DB load succeeds.**

## Security limitations
- **GET is public**: anyone who knows the deployed URL can read the stored spreadsheet. A write-only 4-digit PIN does **not** protect confidential laboratory data from readers.
- Four-digit PIN has only 10,000 combinations and the implementation does not provide a durable rate limiter. For private/sensitive content, enable **Vercel Deployment Protection** or an authentication layer for reads, and strong authentication/rate limiting for writes.
- Use HTTPS, restrict URL sharing, and keep regular DB backups.

## Notes
- Initial DB load is once per page launch, not recurring polling. Data is only persisted to Neon when manually saved.
- Formula engine and workbook UI remain in the existing HTML file.
- Schema creation is manual. This repository change alone does not provision or connect NeonDB.
- The former JSON-file import/export buttons are not part of this branch. For existing PC JSON data, a separate migration path is required.
