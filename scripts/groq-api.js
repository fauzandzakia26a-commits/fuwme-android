"use strict";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_REQUESTS_PER_MINUTE = 20;
const REQUEST_WINDOW_MS = 60_000;
const requestsByAddress = new Map();
const DEFAULT_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(data));
}

function isRateLimited(request) {
  const now = Date.now();
  const address = request.socket.remoteAddress || "unknown";
  const recent = (requestsByAddress.get(address) || []).filter(
    (timestamp) => now - timestamp < REQUEST_WINDOW_MS
  );
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    requestsByAddress.set(address, recent);
    return true;
  }
  recent.push(now);
  requestsByAddress.set(address, recent);
  if (requestsByAddress.size > 1000) {
    for (const [key, timestamps] of requestsByAddress) {
      if (!timestamps.some((timestamp) => now - timestamp < REQUEST_WINDOW_MS)) {
        requestsByAddress.delete(key);
      }
    }
  }
  return false;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let oversized = false;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      if (oversized) return;
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        oversized = true;
        reject(Object.assign(new Error("Request body is too large."), { status: 413 }));
      }
    });
    request.on("end", () => {
      if (oversized) return;
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { status: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function validChatBody(body) {
  return body && Array.isArray(body.messages) &&
    body.messages.length > 0 && body.messages.length <= 20 &&
    body.messages.every((message) =>
      message &&
      ["system", "user", "assistant"].includes(message.role) &&
      typeof message.content === "string" &&
      message.content.length <= 12_000
    ) &&
    body.messages.reduce((total, message) => total + message.content.length, 0) <= 32_000;
}

function getGroqUrl() {
  const url = new URL(process.env.GROQ_API_URL || DEFAULT_GROQ_URL);
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(isLoopback && url.protocol === "http:")) {
    throw new Error("GROQ_API_URL must use HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("GROQ_API_URL must not contain credentials, query, or fragment.");
  }
  return url;
}

function makeGroqBody(route, body) {
  const messages = route === "chat"
    ? body.messages
    : [
        {
          role: "system",
          content: "Ikuti instruksi dan kembalikan hanya satu objek JSON yang valid.",
        },
        { role: "user", content: body.prompt },
      ];
  return {
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages,
    stream: false,
    ...(route === "generate"
      ? { response_format: { type: "json_object" }, temperature: 0.1 }
      : {}),
  };
}

async function handleGroqRequest(request, response, route) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  if (isRateLimited(request)) {
    sendJson(response, 429, { error: "Terlalu banyak permintaan. Silakan coba lagi sebentar." });
    return;
  }
  if (!process.env.GROQ_API_KEY) {
    sendJson(response, 503, { error: "GROQ_API_KEY belum dikonfigurasi di server." });
    return;
  }

  let url;
  try {
    url = getGroqUrl();
  } catch (error) {
    console.error("Konfigurasi endpoint Groq tidak valid:", error.message);
    sendJson(response, 500, { error: "Konfigurasi layanan AI di server tidak valid." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const validBody = route === "chat"
      ? validChatBody(body)
      : body &&
        typeof body.prompt === "string" &&
        body.prompt.length > 0 &&
        body.prompt.length <= 12_000 &&
        body.format === "json";
    if (!validBody) {
      sendJson(response, 400, { error: "Format permintaan AI tidak valid." });
      return;
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(makeGroqBody(route, body)),
      signal: AbortSignal.timeout(60_000),
    });
    if (!upstream.ok) {
      console.error(`Groq returned HTTP ${upstream.status}.`);
      sendJson(response, upstream.status === 429 ? 429 : 502, {
        error: upstream.status === 429
          ? "Kuota AI sedang penuh. Coba kembali beberapa saat lagi."
          : "Layanan AI gagal memproses permintaan. Periksa konfigurasi Groq di server.",
      });
      return;
    }

    const result = await upstream.json();
    const content = result?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      console.error("Groq returned a response without message content.");
      sendJson(response, 502, { error: "Respons dari layanan AI tidak valid." });
      return;
    }
    sendJson(response, 200, route === "chat"
      ? { message: { content } }
      : { response: content });
  } catch (error) {
    if (response.writableEnded || response.destroyed) return;
    if (error.status) {
      sendJson(response, error.status, { error: error.message });
      return;
    }
    console.error("Groq request failed:", error);
    sendJson(response, 502, {
      error: error.name === "TimeoutError"
        ? "Layanan AI terlalu lama merespons. Coba lagi."
        : "Tidak dapat terhubung ke layanan Groq.",
    });
  }
}

function handleGroqApi(request, response, pathname) {
  const route = pathname === "/api/ai/chat"
    ? "chat"
    : pathname === "/api/ai/generate"
      ? "generate"
      : null;
  if (!route) return false;
  handleGroqRequest(request, response, route);
  return true;
}

module.exports = { handleGroqApi };
