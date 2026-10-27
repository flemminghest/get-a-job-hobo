const windows = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 24;
const MAX_COMPANY_LENGTH = 140;

function send(res, status, body) {
  res.status(status).json(body);
}

function clientKey(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
    || String(req.socket && req.socket.remoteAddress || "unknown");
}

function rateLimited(req) {
  const key = clientKey(req);
  const now = Date.now();
  const current = windows.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
}

function stripMarkup(html) {
  return decodeEntities(String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}

function numericRating(value) {
  const number = Number(String(value == null ? "" : value).trim().replace(",", "."));
  return Number.isFinite(number) && number >= 0 && number <= 5 ? number : null;
}

function walkJson(value, callback) {
  if (!value || typeof value !== "object") return;
  callback(value);
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, callback);
    return;
  }
  for (const child of Object.values(value)) walkJson(child, callback);
}

function findJsonLdRating(html) {
  const ratingCandidates = [];
  const countCandidates = [];
  const blocks = String(html || "").match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const block of blocks) {
    const raw = block.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(decodeEntities(raw));
      walkJson(parsed, object => {
        const aggregate = object.aggregateRating || object.AggregateRating;
        if (aggregate && typeof aggregate === "object") {
          const rating = numericRating(aggregate.ratingValue || aggregate.rating || aggregate.value);
          if (rating !== null) ratingCandidates.push(rating);
          const count = aggregate.reviewCount || aggregate.ratingCount || aggregate.count;
          if (count != null && /^\d[\d.,\s]*$/.test(String(count))) countCandidates.push(String(count));
        }
        const ownRating = object.ratingValue || object.rating;
        if (ownRating != null && !aggregate) {
          const rating = numericRating(ownRating);
          if (rating !== null) ratingCandidates.push(rating);
        }
      });
    } catch (_) {
      // A malformed or non-JSON-LD block is ignored; the visible text parser is used next.
    }
  }
  return {
    rating: ratingCandidates.length ? ratingCandidates[0] : null,
    count: countCandidates.length ? countCandidates[0] : null
  };
}

function parseJobindexEvaluation(html) {
  const source = String(html || "");
  const text = stripMarkup(source);
  const jsonLd = findJsonLdRating(source);
  let rating = jsonLd.rating;
  let ratingLabel = rating !== null ? rating.toLocaleString("da-DK", { maximumFractionDigits: 1 }) + "/5" : "";
  let count = jsonLd.count || "";

  const ratingPatterns = [
    /(?:samlet vurdering|gennemsnitlig vurdering|arbejdspladsvurdering|rating|bedømmelse|vurdering)\D{0,45}([1-5](?:[,.]\d)?)\s*(?:\/\s*5|af\s*5|ud af\s*5)\b/i,
    /\b([1-5](?:[,.]\d)?)\s*(?:\/\s*5|af\s*5|ud af\s*5)\b/i
  ];
  if (rating === null) {
    for (const pattern of ratingPatterns) {
      const match = text.match(pattern);
      if (!match) continue;
      const candidate = numericRating(match[1]);
      if (candidate !== null) {
        rating = candidate;
        ratingLabel = candidate.toLocaleString("da-DK", { maximumFractionDigits: 1 }) + "/5";
        break;
      }
    }
  }

  const countMatch =
    text.match(/\b([\d.,]{1,10})\s+evalueringer\b/i) ||
    text.match(/\b([\d.,]{1,10})\s+(?:anmeldelser|vurderinger|reviews|ratings)\b/i) ||
    text.match(/\b(?:evalueringer|anmeldelser|vurderinger)\s*\(\s*([\d.,]{1,10})\s*\)/i);
  if (!count && countMatch) count = countMatch[1].replace(/[.,](?=\d{3}(?:\D|$))/g, "").replace(/\s/g, "");

  // Only use literal star characters when Jobindex exposes them in its returned HTML/text.
  if (rating === null) {
    const starMatch = text.match(/[★⭐☆]{5}/);
    if (starMatch) {
      const row = starMatch[0];
      const filled = (row.match(/[★⭐]/g) || []).length;
      if (filled > 0) {
        ratingLabel = row;
        rating = filled;
      }
    }
  }

  return {
    rating,
    ratingLabel,
    ratingCount: count,
    hasRating: rating !== null || !!ratingLabel,
    hasEvaluations: !!count,
    pageTitle: (source.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
      ? stripMarkup((source.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]).slice(0, 300)
      : "",
    textSample: text.slice(0, 2200)
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
  res.setHeader("Vary", "Accept");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { ok: false, status: "method_not_allowed" });
  }
  if (rateLimited(req)) {
    return send(res, 429, { ok: false, status: "rate_limited", message: "Prøv igen om lidt." });
  }

  const company = String(req.query && req.query.company || "").replace(/\s+/g, " ").trim().slice(0, MAX_COMPANY_LENGTH);
  if (company.length < 2) {
    return send(res, 400, { ok: false, status: "invalid_company", message: "Virksomhedsnavn mangler." });
  }
  if (/[\u0000-\u001f<>]/.test(company)) {
    return send(res, 400, { ok: false, status: "invalid_company", message: "Virksomhedsnavnet indeholder ugyldige tegn." });
  }

  const sourceUrl = "https://www.jobindex.dk/virksomhedsoversigt/resultat?company="
    + encodeURIComponent(company).replace(/%20/g, "+") + "&evaluate_tab=0";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(sourceUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "da-DK,da;q=0.9,en;q=0.7",
        "User-Agent": "Get-A-Job-Hobo/1.0 (Jobindex employee-evaluation lookup)"
      }
    });
    if (!response.ok) {
      return send(res, 502, {
        ok: false,
        status: "upstream_http_error",
        upstreamStatus: response.status,
        company,
        sourceUrl,
        message: "Jobindex returnerede HTTP " + response.status + ". Der vises ingen gættet tilfredshedsscore."
      });
    }

    const html = await response.text();
    if (/captcha|verify you are human|access denied|robot check|security challenge/i.test(html.slice(0, 50_000))) {
      return send(res, 502, {
        ok: false,
        status: "upstream_blocked",
        company,
        sourceUrl,
        message: "Jobindex kunne ikke læses automatisk. Den direkte kilde kan stadig åbnes manuelt."
      });
    }

    const extracted = parseJobindexEvaluation(html);
    const ok = extracted.hasRating || extracted.hasEvaluations;
    return send(res, 200, {
      ok,
      status: ok ? "found" : "no_public_evaluation_data",
      company,
      source: "Jobindex",
      sourceUrl,
      rating: extracted.rating,
      ratingLabel: extracted.ratingLabel,
      ratingCount: extracted.ratingCount,
      pageTitle: extracted.pageTitle,
      message: ok
        ? "Oplysningerne er hentet fra Jobindex."
        : "Jobindex-siden blev hentet, men der kunne ikke udtrækkes en pålidelig score eller et antal evalueringer. Der er ikke gættet et resultat."
    });
  } catch (error) {
    const timeoutError = error && error.name === "AbortError";
    return send(res, 502, {
      ok: false,
      status: timeoutError ? "upstream_timeout" : "upstream_unavailable",
      company,
      sourceUrl,
      message: timeoutError
        ? "Jobindex svarede ikke inden for tidsgrænsen."
        : "Jobindex kunne ikke hentes fra serveren.",
    });
  } finally {
    clearTimeout(timeout);
  }
};
