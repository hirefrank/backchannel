import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import settingsRoute from "./routes/settings";
import colleaguesRoute from "./routes/colleagues";
import candidatesRoute from "./routes/candidates";

const app = new Hono();

// Mount API routes
app.route("/", settingsRoute);
app.route("/", colleaguesRoute);
app.route("/", candidatesRoute);

// Serve static files from client/dist (relative to project root)
app.use("*", serveStatic({ root: "./client/dist" }));

// SPA fallback - serve index.html for client-side routing
app.get("*", serveStatic({ path: "./client/dist/index.html" }));

const preferredPort = parseInt(process.env.PORT || "3000");

async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    try {
      const server = Bun.serve({ port, fetch: () => new Response() });
      server.stop();
      return port;
    } catch {
      continue;
    }
  }
  throw new Error(`No available port found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

const port = await findAvailablePort(preferredPort);

if (port !== preferredPort) {
  console.log(`Port ${preferredPort} in use, using ${port}`);
}

console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 120, // 2 minutes for long-running scrape requests
};
