// Netlify relay for 十九直播 auth + keys
// No secrets here. Only forwards to Cloudflare Pages/Worker.
// Usage: https://<your-site>.netlify.app/.netlify/functions/relay?path=/api/card_check
// Or via redirect in netlify.toml: /api/* -> /.netlify/functions/relay?path=/api/:splat

const TARGET = "https://dycast-website.pages.dev";

export default async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";
  // Keep other query params
  const qs = new URLSearchParams(url.searchParams);
  qs.delete("path");
  const qsStr = qs.toString();
  const targetUrl = TARGET + path + (qsStr ? "?" + qsStr : "");

  // Forward method, headers (except host), body
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  const res = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    redirect: "follow",
  });

  const resHeaders = new Headers(res.headers);
  // Remove hop-by-hop
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: res.status,
    headers: resHeaders,
  });
};

export const config = {
  path: "/.netlify/functions/relay",
};
