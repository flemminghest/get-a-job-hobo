# AI-powered document and persona panel

The GitHub Pages site is static, so it cannot keep an OpenAI API key secret. The model endpoint in `api/panel-review.js` is designed to run as a Vercel Function, where the API key is stored as an environment variable.

## What this enables

When configured, the panel supports four material types: CV, job application, article and email (plus other material). The selected type changes the review criteria. Recruiter, Copywriter, CMO and CEO personas use the OpenAI Responses API to produce specific, evidence-based feedback appropriate to that material type. The same secure endpoint also generates three longer Danish cover-letter drafts based on your CV and the job posting. The drafts follow the tone of your uploaded sample: direct, personal, warm and slightly informal, use a contact name when explicitly found, use the company name when reliably identified, and always sign off with `Mange hilsner` and `//Jacob`. They are displayed in full-width cards stacked vertically. If no contact or company name is found, the system avoids inventing one. The model is instructed to quote the submitted material accurately, explain why each observation matters, prioritize improvements and avoid inventing facts. The existing rule-based assessment remains available if AI settings are not configured.

## One-time setup

1. Import this GitHub repository into a Vercel project at https://vercel.com/new.
2. In the Vercel project, open **Settings → Environment Variables** and add:
   - `OPENAI_API_KEY`: an OpenAI API key from your OpenAI API project.
   - `APP_ACCESS_CODE`: a long, unique passphrase that you choose. Do not commit this value to GitHub.
   - `FRONTEND_ORIGIN` (optional additional allowed origins, comma-separated): `https://flemminghest.github.io,https://get-a-job-hobo.vercel.app` — both production frontends are allowed by default, so this variable can also be left unset unless you need extra origins.
   - `OPENAI_MODEL` (optional): defaults to `gpt-6.1-sol`.
3. Redeploy the Vercel project after saving the environment variables.
4. Copy the Vercel project URL. Its endpoint is `https://YOUR-PROJECT.vercel.app/api/panel-review`.
5. Open the GitHub Pages site, go to **Spørg panelet**, and enter the full endpoint URL and the same `APP_ACCESS_CODE` in **AI-indstillinger**. Save the settings. They are stored in this browser's local storage and persist across tabs and browser restarts on the same browser/device. If you clear site data, use private browsing, or switch browser/device, you may need to enter them again.

The API key remains only in Vercel's server-side environment. The endpoint URL and access code are stored in this browser's local storage, not in the public Git repository or the app's CV/job backup. Anyone with access to this browser profile may be able to inspect local browser storage; do not use a shared or untrusted browser. Do not commit `OPENAI_API_KEY` or `APP_ACCESS_CODE` to Git.

## Privacy and cost

When AI mode is used, the selected material, its type, any optional context and selected persona names are sent to the Vercel endpoint and forwarded to the OpenAI API for the requested assessment. Do not include information you do not want to submit to those services. The model's observations and rewrites must be verified before using them.

OpenAI API usage is billed separately from a ChatGPT subscription. Set usage limits/alerts in the OpenAI Platform and rotate the API key if you suspect exposure.

The endpoint restricts browser origins, requires the access code, limits input size and applies a basic per-instance rate limit. The rate limiter is intentionally simple and is not a substitute for an account system if the app later becomes public or multi-user.

## Testing checklist

- Test with a CV that strongly matches a marketing role.
- Test the same CV against a clearly unrelated practical role, such as the tyre fitter example.
- Test one job application, article and email to confirm that the selected material type changes the criteria.
- Confirm that the model explains the mismatch using actual evidence or missing evidence, rather than keyword overlap alone.
- Confirm that direct quotes match the submitted CV.
- Test empty, very short and very long inputs, wrong access code, API quota errors and temporary model errors.
- Keep the existing deterministic, weighted job-match score separate from persona scores and explanations.
