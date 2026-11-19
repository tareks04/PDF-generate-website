/**
 * Smart Page Library image relay for Cloudflare Workers.
 *
 * Required Worker variable:
 *   ALLOWED_DOMAINS = comma-separated hostnames, e.g.
 *       ai-data.udvash-unmesh.com,cdn.example.org
 *
 * Optional Worker variable:
 *   ALLOWED_ORIGINS = comma-separated exact browser origins.
 *       Defaults to https://tareks04.github.io
 *
 * Deploy this file as the Worker entry point. This is NOT an open proxy:
 * only hosts in ALLOWED_DOMAINS and origins in ALLOWED_ORIGINS are accepted.
 */
const MAX_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 12000;
const MAX_REDIRECTS = 4;
const DEFAULT_ORIGINS = ["https://tareks04.github.io"];

function csv(value, fallback = []) {
  const values = String(value || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  return values.length ? values : fallback;
}

function cors(origin, env) {
  const allowed = csv(env.ALLOWED_ORIGINS, DEFAULT_ORIGINS);
  const headers = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (origin && allowed.includes(origin.toLowerCase())) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

function allowedHost(hostname, env) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  // Reject local names and literal IP addresses. The domain allowlist below is
  // still mandatory; never configure broad public suffixes such as "com".
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.startsWith("[") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ||
    host.includes(":")
  ) return false;

  const allowed = csv(env.ALLOWED_DOMAINS);
  return allowed.some(domain => host === domain || host.endsWith("." + domain));
}

function validateTarget(raw, env) {
  let target;
  try {
    target = new URL(raw);
  } catch {
    throw new Error("Invalid image URL");
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS image URLs are supported");
  }
  if (target.username || target.password) {
    throw new Error("URLs containing credentials are not allowed");
  }
  if (!allowedHost(target.hostname, env)) {
    throw new Error("Image host is not in ALLOWED_DOMAINS");
  }
  target.hash = "";
  return target;
}

async function fetchImage(startUrl, env) {
  let target = validateTarget(startUrl, env);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort("Upstream timeout"), TIMEOUT_MS);
    let upstream;
    try {
      upstream = await fetch(target.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "Accept": "image/jpeg,image/*;q=0.8",
          "User-Agent": "SmartPageLibrary-Relay/1.0",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(upstream.status)) {
      const location = upstream.headers.get("Location");
      if (!location) return { error: "Upstream redirect has no Location header", status: 502 };
      if (redirects === MAX_REDIRECTS) return { error: "Too many upstream redirects", status: 502 };
      target = validateTarget(new URL(location, target).toString(), env);
      continue;
    }

    if (!upstream.ok) {
      return { error: "Upstream HTTP " + upstream.status, status: upstream.status };
    }

    const contentType = (upstream.headers.get("Content-Type") || "").toLowerCase();
    if (contentType.includes("text/html") || contentType.includes("application/json") || contentType.startsWith("text/")) {
      return { error: "Upstream returned text/HTML instead of an image", status: 422 };
    }

    const length = Number(upstream.headers.get("Content-Length") || 0);
    if (length > MAX_BYTES) return { error: "Image exceeds 25 MB limit", status: 413 };
    if (!upstream.body) return { error: "Empty upstream response", status: 422 };

    const reader = upstream.body.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BYTES) {
          await reader.cancel();
          return { error: "Image exceeds 25 MB limit", status: 413 };
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // The web app and Android app both validate JPEG magic bytes.
    if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
      return { error: "Response is not a valid JPEG (missing FF D8 FF)", status: 422 };
    }
    return { bytes, status: 200 };
  }
  return { error: "Upstream redirect limit reached", status: 502 };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = csv(env.ALLOWED_ORIGINS, DEFAULT_ORIGINS);
    const headers = cors(origin, env);

    if (origin && !allowedOrigins.includes(origin.toLowerCase())) {
      return json({ error: "Browser origin is not allowed" }, 403, headers);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "GET") {
      return json({ error: "Only GET and OPTIONS are supported" }, 405, headers);
    }

    const requestUrl = new URL(request.url);
    if (requestUrl.pathname === "/health") {
      return json({ ok: true, service: "Smart Page Library image relay" }, 200, headers);
    }
    if (requestUrl.pathname !== "/" && requestUrl.pathname !== "") {
      return json({ error: "Not found" }, 404, headers);
    }

    const target = requestUrl.searchParams.get("url");
    if (!target) return json({ error: "Missing url query parameter" }, 400, headers);

    try {
      const result = await fetchImage(target, env);
      if (result.error) return json({ error: result.error }, result.status, headers);
      return new Response(result.bytes, {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": "image/jpeg",
          "Content-Length": String(result.bytes.byteLength),
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Relay failure";
      const status = message === "Image host is not in ALLOWED_DOMAINS" ? 403 : 400;
      return json({ error: message }, status, headers);
    }
  },
};
