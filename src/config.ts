/**
 * Base URL of the Moshui backend — the Express server in /server, deployed as a
 * Render Web Service.
 *
 * ▶ After deploying, swap the string below for your Render URL, e.g.
 *   "https://moshui-server.onrender.com".
 *
 * For local development, run the server (`npm start` in /server) and set
 * VITE_API_BASE_URL=http://localhost:8787 — that env var overrides this constant.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://moshui-server.onrender.com";
