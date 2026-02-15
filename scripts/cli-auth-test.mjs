#!/usr/bin/env node
/**
 * Test script for CLI auth flow.
 * 1. Starts a local server on a random port
 * 2. Opens the browser to {BASE_URL}/cli-auth?port=PORT
 * 3. When the site redirects back with ?token=..., captures the token
 * 4. Prints the token and optionally tests GET /api/auth/me
 *
 * Usage:
 *   node scripts/cli-auth-test.mjs
 *   BASE_URL=https://your-app.netlify.app node scripts/cli-auth-test.mjs
 *
 * Or with npm:
 *   npm run cli:auth
 */

import http from "http";
import { exec } from "child_process";

const BASE_URL = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1`);
  const token = url.searchParams.get("token");

  if (token) {
    console.log("\n✅ Token received. You can close the browser tab.\n");
    console.log("Token (store this securely, use as Authorization: Bearer <token>):");
    console.log(token);
    console.log("");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <!DOCTYPE html>
      <html><body style="font-family:sans-serif;padding:2rem;background:#121212;color:#e0e0e0;">
        <h1 style="color:#2dcc8c;">CLI authorized</h1>
        <p>You can close this window and return to the terminal.</p>
      </body></html>
    `);

    setTimeout(() => {
      server.close();
      testApiWithToken(token);
      process.exit(0);
    }, 500);
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Waiting for redirect from CodeMintAI...");
  }
});

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const authUrl = `${BASE_URL}/cli-auth?port=${port}`;

  console.log("CodeMintAI — CLI auth test\n");
  console.log("1. Opening browser to:", authUrl);
  console.log("2. Log in (if needed), then click \"Generate token and authorize CLI\"");
  console.log("3. This script will capture the token and test the API.\n");

  const open =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${open} "${authUrl}"`, (err) => {
    if (err) {
      console.log("Could not open browser. Visit this URL manually:\n", authUrl);
    }
  });
});

function testApiWithToken(token) {
  const url = new URL("/api/auth/me", BASE_URL);
  const opts = { headers: { Authorization: `Bearer ${token}` } };

  fetch(url.toString(), opts)
    .then((r) => r.json())
    .then((data) => {
      if (data?.user) {
        console.log("API test (GET /api/auth/me):", data.user.email);
      } else {
        console.log("API test: unexpected response", data);
      }
    })
    .catch((e) => console.log("API test failed:", e.message));
}
