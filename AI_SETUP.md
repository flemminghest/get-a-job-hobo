# AI-powered CV persona panel

The GitHub Pages site is static, so it cannot keep an OpenAI API key secret. The model endpoint in `api/panel-review.js` is designed to run as a Vercel Function, where the API key is stored as an environment variable.

## What this enables

When configured, the Recruiter, Copywriter, CMO and CEO personas use the OpenAI Responses API to produce specific, evidence-based feedback. The model is instructed to quote the submitted CV accurately, explain why each observation matters, prioritize improvements and avoid inventing facts. The existing rule-based assessment remains available if AI settings are not configured.

## One-time setup

1. Import this GitHub repository into a Vercel project at https://vercel.com/new.
2. In the Vercel project, open **Settings → Environment Variables** and add:
   - `OPENAI_API_KEY`: an OpenAI API key from your OpenAI API project.
   - `APP_ACCESS_CODE`: a long, unique passphrase that you choose. Do not commit this value to GitHub.
   - `FRONTEND_ORIGIN`: `https://flemminghest.github.io`
   - `OPENAI_MODEL` (optional): defaults to `gpt-6.1-sol`.
3. Redeploy the Vercel project after saving the environment variables.
4. Copy the Vercel project URL. Its endpoint is `https://YOUR-PROJECT.vercel.app/api/panel-review`.
5. Open the GitHub Pages site, go to **Spørg panelet**, and enter the full endpoint URL and the same `APP_ACCESS_CODE` in **AI-indstillinger**. Save for this browser session.

The API key remains only in Vercel's server-side environment. The access code is kept in the current browser session, not in the app's persistent backup or local data.

## Privacy and cost

When AI mode is used, the CV text, optional job-posting text and selected persona names are sent to the Vercel endpoint and forwarded to the OpenAI API for the requested assessment. Do not include information you do not want to submit to those services. The model's observations and rewrites must be verified before using them.

OpenAI API usage is billed separately from a ChatGPT subscription. Set usage limits/alerts in the OpenAI Platform and rotate the API key if you suspect exposure.

The endpoint restricts browser origins, requires the access code, limits input size and applies a basic per-instance rate limit. The rate limiter is intentionally simple and is not a substitute for an account system if the app later becomes public or multi-user.

## Testing checklist

- Test with a CV that strongly matches a marketing role.
- Test the same CV against a clearly unrelated practical role, such as the tyre fitter example.
- Confirm that the model explains the mismatch using actual evidence or missing evidence, rather than keyword overlap alone.
- Confirm that direct quotes match the submitted CV.
- Test empty, very short and very long inputs, wrong access code, API quota errors and temporary model errors.
- Keep the existing deterministic, weighted job-match score separate from persona scores and explanations.
