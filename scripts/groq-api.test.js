"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");
const { handleGroqApi } = require("./groq-api");

let groqServer;
let apiServer;
let groqUrl;
let apiUrl;
const received = [];

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server.address().port);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

before(async () => {
  groqServer = http.createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    received.push({
      path: request.url,
      authorization: request.headers.authorization,
      body: JSON.parse(body),
    });
    response.writeHead(200, { "Content-Type": "application/json" });
    const content = received.at(-1).body.response_format
      ? "{\"title\":\"Rapat\",\"date\":\"2026-11-08\",\"time\":\"09:00\"}"
      : "Halo dari Groq.";
    response.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
  groqUrl = `http://127.0.0.1:${await listen(groqServer)}/v1/chat/completions`;

  apiServer = http.createServer((request, response) => {
    const handled = handleGroqApi(request, response, new URL(request.url, "http://localhost").pathname);
    if (!handled) {
      response.writeHead(404);
      response.end();
    }
  });
  apiUrl = `http://127.0.0.1:${await listen(apiServer)}`;
});

after(async () => {
  delete process.env.GROQ_API_URL;
  delete process.env.GROQ_MODEL;
  delete process.env.GROQ_API_KEY;
  await Promise.all([close(apiServer), close(groqServer)]);
});

test("proxies chat and schedule parsing to Groq with the server API key", async () => {
  process.env.GROQ_API_URL = groqUrl;
  process.env.GROQ_MODEL = "test-model";
  process.env.GROQ_API_KEY = "server-only-gsk-test";

  const chatResponse = await fetch(`${apiUrl}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "Halo" }] }),
  });
  assert.equal(chatResponse.status, 200);
  assert.deepEqual(await chatResponse.json(), { message: { content: "Halo dari Groq." } });
  assert.equal(received[0].path, "/v1/chat/completions");
  assert.equal(received[0].body.model, "test-model");
  assert.equal(received[0].body.stream, false);
  assert.equal(received[0].authorization, "Bearer server-only-gsk-test");

  const generateResponse = await fetch(`${apiUrl}/api/ai/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format: "json", prompt: "Buat jadwal rapat besok jam 9" }),
  });
  assert.equal(generateResponse.status, 200);
  assert.match((await generateResponse.json()).response, /"title":"Rapat"/);
  assert.deepEqual(received[1].body.response_format, { type: "json_object" });
  assert.equal(received[1].body.temperature, 0.1);
});

test("rejects malformed, oversized, and non-POST requests", async () => {
  process.env.GROQ_API_URL = groqUrl;
  process.env.GROQ_API_KEY = "server-only-gsk-test";

  const getResponse = await fetch(`${apiUrl}/api/ai/chat`);
  assert.equal(getResponse.status, 405);

  const malformedResponse = await fetch(`${apiUrl}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "tool", content: "invalid" }] }),
  });
  assert.equal(malformedResponse.status, 400);

  const oversizedResponse = await fetch(`${apiUrl}/api/ai/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format: "json", prompt: "x".repeat(70_000) }),
  });
  assert.equal(oversizedResponse.status, 413);
});

test("reports a missing Groq secret without making an upstream request", async () => {
  delete process.env.GROQ_API_KEY;
  const response = await fetch(`${apiUrl}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "Halo" }] }),
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /GROQ_API_KEY/);
});
