# Backend setup

## Configure

From `backend`, install dependencies and create `.env` from `.env.example` if
you do not already have one:

```powershell
pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Set a MySQL `DATABASE_URL`, a long random `AUTH_JWT_SECRET`, and your Groq
`LLM_API_KEY`. Keep credentials in `backend/.env`; do not commit it or expose
keys through frontend variables. The text, vision, and transcription model IDs
can be changed with `LLM_MODEL`, `LLM_VISION_MODEL`, and
`LLM_TRANSCRIPTION_MODEL`.

Create the MySQL database and a least-privilege application account using your
database administrator before setting `DATABASE_URL`. Grant the app account
access only to this application database.

## Explicit database setup

The application does not create tables, users, or demo records on startup. Run
each command deliberately from `backend`:

```powershell
python -m app.setup_database
python -m app.bootstrap_admin
python -m app.seed_demo
```

`seed_demo` is optional and only inserts clearly labeled synthetic ledger
transactions. It does not represent real accounts or move money.

## Start services

```powershell
uvicorn app.main:app --reload
```

From `Frontend`, install packages and start Next.js with `npm install` and
`npm run dev`. Set `NEXT_PUBLIC_API_URL` only when the backend is not at
`http://localhost:8000`.

Public registrations are pending until an administrator activates them.
Administrator-created accounts receive a one-time temporary password and must
change it at first sign-in. The first administrator is created only by the
explicit bootstrap command above.
