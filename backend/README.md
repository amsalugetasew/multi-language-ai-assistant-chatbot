# Backend setup

Install the backend dependencies, then create `backend/.env` from `.env.example`.
Set `LLM_API_KEY` to your Groq API key. The key is only read by the backend and
must not be placed in a `NEXT_PUBLIC_*` frontend variable.

The defaults select Groq with `openai/gpt-oss-20b`; you can change
`LLM_MODEL` to another model available to your Groq account. Start the API from
the `backend` directory with:

```powershell
uvicorn app.main:app --reload
```

Set `NEXT_PUBLIC_API_URL` in the frontend environment when the API is not
running at `http://localhost:8000`. The language selector loads supported
languages from the backend and includes an Auto-detect option.
