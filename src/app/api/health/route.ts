import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthPayload = {
  environment: string;
  status: "ok";
  timestamp: string;
  uptime: number;
};

function getHealthPayload(): HealthPayload {
  return {
    status: "ok",
    environment: process.env.APP_ENV ?? "local",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shouldRenderHtml(request?: Request) {
  const accept = request?.headers.get("accept") ?? "";
  const format = request ? new URL(request.url).searchParams.get("format") : "";

  if (format === "json") {
    return false;
  }

  return accept.includes("text/html") && !accept.includes("application/json");
}

const themeInitScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("portfolio-theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : systemTheme;

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

function renderHealthPage(payload: HealthPayload) {
  const timestamp = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/Paris",
  }).format(new Date(payload.timestamp));
  const uptimeLabel = `${payload.uptime} s`;

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Healthcheck | Portfolio technique</title>
    <script>${themeInitScript}</script>
    <style>
      :root {
        color-scheme: light;
        --background: #f8fcff;
        --foreground: #15202b;
        --muted: #536b78;
        --accent: #536b78;
        --accent-strong: #3f5968;
        --surface: rgba(255, 255, 255, 0.78);
        --glass-background: rgba(255, 255, 255, 0.2);
        --glass-background-strong: rgba(255, 255, 255, 0.3);
        --glass-border: rgba(83, 107, 120, 0.28);
        --glass-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        --border-soft: rgba(172, 203, 225, 0.48);
      }

      :root[data-theme="dark"] {
        color-scheme: dark;
        --background: #120b11;
        --foreground: #f9edf5;
        --muted: #dcb5d1;
        --accent: #f5cce8;
        --accent-strong: #ec9ded;
        --surface: rgba(29, 16, 28, 0.78);
        --glass-background: rgba(255, 255, 255, 0.08);
        --glass-background-strong: rgba(255, 255, 255, 0.12);
        --glass-border: rgba(245, 204, 232, 0.24);
        --glass-shadow: 0 4px 30px rgba(0, 0, 0, 0.24);
        --border-soft: rgba(245, 204, 232, 0.16);
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100dvh;
        margin: 0;
        border: 1px solid var(--glass-border);
        background:
          linear-gradient(90deg, var(--border-soft) 1px, transparent 1px),
          linear-gradient(0deg, var(--border-soft) 1px, transparent 1px),
          linear-gradient(180deg, var(--background), var(--surface));
        background-size: 72px 72px, 72px 72px, auto;
        color: var(--foreground);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
      }

      main {
        display: grid;
        min-height: 100dvh;
        place-items: center;
        padding: clamp(18px, 4vw, 48px);
      }

      .panel {
        width: min(100%, 980px);
        padding: clamp(22px, 4vw, 42px);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        background: var(--glass-background);
        box-shadow: var(--glass-shadow);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }

      .status {
        display: inline-flex;
        min-height: 34px;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        border: 1px solid rgba(15, 118, 110, 0.28);
        border-radius: 999px;
        background: rgba(45, 212, 191, 0.12);
        color: #0f766e;
        font-weight: 900;
        text-transform: uppercase;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #0f766e;
        box-shadow: 0 0 0 6px rgba(45, 212, 191, 0.14);
      }

      h1 {
        max-width: 760px;
        margin: 22px 0 0;
        font-size: clamp(2.7rem, 8vw, 6rem);
        line-height: 0.94;
      }

      .description {
        max-width: 680px;
        margin: 22px 0 0;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.7;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 32px;
      }

      .card {
        min-width: 0;
        min-height: 132px;
        padding: 18px;
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        background: var(--glass-background-strong);
      }

      .label {
        display: block;
        color: var(--muted);
        font-size: 0.82rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      .value {
        display: block;
        margin-top: 14px;
        overflow-wrap: anywhere;
        font-size: clamp(1.1rem, 2vw, 1.7rem);
        font-weight: 900;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 30px;
      }

      a {
        display: inline-flex;
        min-height: 42px;
        align-items: center;
        justify-content: center;
        padding: 0 14px;
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        background: var(--glass-background-strong);
        color: var(--foreground);
        font-weight: 850;
        text-decoration: none;
      }

      a:first-child {
        border-color: var(--accent);
        background: var(--accent);
        color: white;
      }

      @media (max-width: 860px) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 560px) {
        .grid {
          grid-template-columns: 1fr;
        }

        .actions,
        a {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel" aria-labelledby="health-title">
        <span class="status"><span class="dot" aria-hidden="true"></span>${escapeHtml(payload.status)}</span>
        <h1 id="health-title">Application disponible</h1>
        <p class="description">
          Cette route confirme que l'application repond correctement et reste exploitable pour les checks de preproduction, production et deploiement zero downtime.
        </p>

        <div class="grid" aria-label="Informations de sante applicative">
          <div class="card">
            <span class="label">Environnement</span>
            <span class="value">${escapeHtml(payload.environment)}</span>
          </div>
          <div class="card">
            <span class="label">Statut</span>
            <span class="value">${escapeHtml(payload.status)}</span>
          </div>
          <div class="card">
            <span class="label">Uptime</span>
            <span class="value">${escapeHtml(uptimeLabel)}</span>
          </div>
          <div class="card">
            <span class="label">Derniere verification</span>
            <span class="value">${escapeHtml(timestamp)}</span>
          </div>
        </div>

        <div class="actions">
          <a href="/admin">Dashboard admin</a>
          <a href="/api/health?format=json">Voir le JSON</a>
          <a href="/">Retour au site</a>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export function GET(request?: Request) {
  const payload = getHealthPayload();

  if (shouldRenderHtml(request)) {
    return new NextResponse(renderHealthPage(payload), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      },
      status: 200,
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
