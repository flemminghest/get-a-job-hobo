const { isIP } = require("node:net");

const requestWindows = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_RESPONSE_CHARS = 150_000;

function clientKey(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
    || String(req.socket && req.socket.remoteAddress || "unknown");
}

function allowedTarget(raw) {
  let target;
  try { target = new URL(String(raw || "")); } catch (_) { return null; }
  if (!["http:", "https:"].includes(target.protocol) || target.username || target.password) return null;
  if (target.port && !["80", "443"].includes(target.port)) return null;
  const host = target.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")
      || host.endsWith(".internal") || host.endsWith(".onion") || isIP(host)) return null;
  return target;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const key = clientKey(req), now = Date.now(), window = requestWindows.get(key);
  if (!window || now - window.startedAt >= WINDOW_MS) requestWindows.set(key, { startedAt: now, count: 1 });
  else {
    window.count += 1;
    if (window.count > MAX_REQUESTS_PER_WINDOW) return res.status(429).json({ error: "For mange hentninger. Prøv igen om lidt." });
  }

  const target = allowedTarget(req.query && req.query.url);
  if (!target) return res.status(400).json({ error: "Indsæt en gyldig offentlig HTTP/HTTPS-job-URL." });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const readerUrl = "https://r.jina.ai/" + target.href;
    const response = await fetch(readerUrl, {
      headers: { Accept: "text/plain", "X-Return-Format": "markdown" },
      signal: controller.signal
    });
    if (!response.ok) return res.status(502).json({ error: "Originalopslaget kunne ikke hentes fra teksttjenesten." });
    const text = (await response.text()).slice(0, MAX_RESPONSE_CHARS);
    if (text.length < 250) return res.status(502).json({ error: "Kilden returnerede ikke nok tekst til en forsvarlig vurdering." });
    return res.status(200).json({ content: text, sourceUrl: target.href, provider: "Jina Reader" });
  } catch (error) {
    const message = error && error.name === "AbortError"
      ? "Hentning af jobopslaget tog for lang tid."
      : "Jobopslaget kunne ikke hentes lige nu.";
    return res.status(502).json({ error: message });
  } finally {
    clearTimeout(timer);
  }
};
