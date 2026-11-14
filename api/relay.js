// Vercel relay for 十九直播 auth + keys
// No secrets here. Only forwards to Cloudflare Pages/Worker.
const TARGET = "https://dycast-website.pages.dev";

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = req.query.path || "/";
  const qs = new URLSearchParams(url.searchParams);
  qs.delete("path");
  const qsStr = qs.toString();
  const targetUrl = TARGET + path + (qsStr ? "?" + qsStr : "");

  const headers = { ...req.headers };
  delete headers.host;
  delete headers["content-length"];

  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = req.body;
    // Vercel may parse JSON; stringify if object
    if (body && typeof body === "object" && !(body instanceof Buffer)) {
      body = JSON.stringify(body);
      if (!headers["content-type"]) headers["content-type"] = "application/json";
    }
  }

  const r = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    redirect: "follow",
  });

  const buf = Buffer.from(await r.arrayBuffer());
  res.status(r.status);
  r.headers.forEach((v, k) => {
    if (k.toLowerCase() === "content-encoding" || k.toLowerCase() === "content-length") return;
    res.setHeader(k, v);
  });
  res.send(buf);
}
