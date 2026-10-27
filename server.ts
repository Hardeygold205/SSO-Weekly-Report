import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzypVMhN2uEtnXqR-Gjs0WrvYht6Xwr4y3RDaTUkDOO7n_UMwZsz44Q9WiZ14kCGQZG/exec';

function resolveAppsScriptUrl(): string {
  const envCandidates = [
    process.env.APPS_SCRIPT_URL,
    process.env.KOBO_APPS_SCRIPT_URL,
    process.env.SCRIPT_URL,
  ];

  for (const raw of envCandidates) {
    if (!raw) continue;
    // Strip surrounding whitespace and quotes if entered as "https://..."
    const cleaned = raw.trim().replace(/^['"]+|['"]+$/g, '').trim();
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      try {
        new URL(cleaned);
        return cleaned;
      } catch {
        // continue to next candidate or fallback
      }
    }
  }

  return DEFAULT_APPS_SCRIPT_URL;
}

function resolvePasscode(providedKey?: string): string {
  if (providedKey && providedKey.trim()) {
    return providedKey.trim();
  }
  if (process.env.APPS_SCRIPT_PASSCODE) return process.env.APPS_SCRIPT_PASSCODE.trim();
  if (process.env.APPS_SCRIPT_KEY) return process.env.APPS_SCRIPT_KEY.trim();
  if (process.env.PASSCODE) return process.env.PASSCODE.trim();
  if (process.env.APPS_SCRIPT_URL && !process.env.APPS_SCRIPT_URL.startsWith('http')) {
    return process.env.APPS_SCRIPT_URL.trim();
  }
  return 'EXAF001';
}

// Proxy endpoint for Kobo + Targets data from Google Apps Script Web App
app.get('/api/data', async (req, res) => {
  const queryKey = req.query.key as string;
  const refresh = req.query.refresh as string;
  const key = resolvePasscode(queryKey);

  const scriptUrl = resolveAppsScriptUrl();

  try {
    const targetUrl = new URL(scriptUrl);
    targetUrl.searchParams.set('key', key.trim());
    if (refresh === '1') {
      targetUrl.searchParams.set('refresh', '1');
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: `Remote server responded with HTTP status ${response.status}`,
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data from remote server';
    console.error('Error fetching data from Apps Script:', errorMsg);
    return res.status(500).json({
      ok: false,
      error: errorMsg,
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'operational', scriptUrlConfigured: resolveAppsScriptUrl() !== '' });
});

// Vite or Static assets
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
