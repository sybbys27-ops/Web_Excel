# Web_Excel Vercel + NeonDB deployment

## Branch
`feat/vercel-neon-manual-save` — the original `main` remains unchanged.

## 1. Neon
Create a Neon PostgreSQL database. Run `neon/schema.sql` once in Neon SQL Editor. A single `workbooks` row (`id='primary'`) stores the **entire workbook** in JSONB. This is a single shared workbook, not per-user workbooks.

## 2. Vercel
Import the GitHub repository into Vercel and select branch `feat/vercel-neon-manual-save` for deployment (or deploy this branch as Preview). Framework preset: **Other**, root directory: repository root. Do not select a build command. Add server-side environment variables:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `APP_PASSWORD`: a **strong** password (not a 4-digit PIN for public deployment)

Set variables for the desired Vercel environment (Preview and/or Production), then deploy/redeploy. Never put DATABASE_URL or APP_PASSWORD in HTML, GitHub, or variables prefixed `VITE_`/`NEXT_PUBLIC_`.

## 3. Usage
- `DB 저장` / Ctrl+S: manually PUT the workbook to NeonDB.
- `DB 불러오기`: manually GET the workbook from NeonDB, replacing the current workbook after confirmation.
- Password is prompted for once per page session and held only in JS memory; refresh clears it.
- Existing LocalStorage auto-backup remains a **local draft**, not a DB commit.
- Before modifying an **existing** saved database on a newly opened page, use `DB 불러오기` first. Saves are version-checked and stale versions return HTTP 409, preventing overwrites by another device.
- Existing JSON files are **not** imported through the new DB load button. To migrate prior local data, open the old original HTML once, restore JSON there, then copy its LocalStorage workbook to the new deployment via a deliberate migration step, or add a separate local JSON import later.
- Each newly deployed browser starts from a blank/default workbook until DB 불러오기.
- Only a single logical workbook is stored. Consider Neon backups and stronger user/session authentication if sharing publicly.

## Notes
This migration intentionally preserves the spreadsheet formula engine and styling. The API does not create the database table automatically. Test DB save/load and multi-device conflict before promoting to production.
