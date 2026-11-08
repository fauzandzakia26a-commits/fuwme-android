"use strict";

const CACHE_NAME = "fuwme-shell-v11";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./manifest.webmanifest",
  "./assets/images/favicon.ico",
  "./assets/images/favicon-64.png",
  "./assets/images/favicon-192.png",
  "./assets/images/favicon.svg",
  "./assets/images/fuwme-cat-transparent.png",
  "./assets/images/footer-pixel-mascot.png",
  "./assets/images/kaisar-mascot.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("fuwme-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.mode === "navigate") return caches.match("./index.html");
        throw new Error(`Offline resource unavailable: ${new URL(request.url).pathname}`);
      });
    })
  );
});
