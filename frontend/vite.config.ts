import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { AccessToken } from 'livekit-server-sdk';
import fs from 'fs';
import path from 'path';

// Helper to find env values from multiple potential .env files
function getEnvValue(key: string, rootDir: string): string | undefined {
  if (process.env[key]) return process.env[key];

  const envFiles = [
    path.resolve(rootDir, '.env.local'),
    path.resolve(rootDir, '.env'),
    path.resolve(rootDir, '../.env.local'),
    path.resolve(rootDir, '../.env'),
  ];

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const match = content.match(new RegExp(`^${key}\\s*=\\s*["']?([^"'\\r\\n]+)["']?`, 'm'));
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  return undefined;
}

export default defineConfig(({ mode }) => {
  const rootDir = process.cwd();
  loadEnv(mode, rootDir, '');

  return {
    plugins: [
      react(),
      {
        name: 'livekit-token-server',
        configureServer(server) {
          // Token endpoint
          server.middlewares.use('/api/token', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.end();
              return;
            }

            try {
              const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
              const studentName = url.searchParams.get('name') || 'Student';
              const roomParam = url.searchParams.get('room') || `iris_${Date.now()}`;

              const livekitUrl = getEnvValue('LIVEKIT_URL', rootDir);
              const apiKey = getEnvValue('LIVEKIT_API_KEY', rootDir);
              const apiSecret = getEnvValue('LIVEKIT_API_SECRET', rootDir);

              if (!livekitUrl || !apiKey || !apiSecret) {
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    configured: false,
                    demoMode: true,
                    message:
                      'LiveKit credentials not configured in .env.local. Running in Interactive Demo Mode.',
                  })
                );
                return;
              }

              const identity = `student_${Math.random().toString(36).slice(2, 9)}`;
              const token = new AccessToken(apiKey, apiSecret, {
                identity,
                name: studentName,
                ttl: 3600, // 1 hour
              });

              token.addGrant({
                roomJoin: true,
                room: roomParam,
                canPublish: true,
                canSubscribe: true,
                canPublishData: true,
              });

              const jwt = await token.toJwt();

              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  configured: true,
                  serverUrl: livekitUrl,
                  token: jwt,
                  roomName: roomParam,
                  identity,
                  participantName: studentName,
                })
              );
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('Error issuing LiveKit token:', msg);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'TOKEN_GENERATION_FAILED', details: msg }));
            }
          });

          // Health endpoint
          server.middlewares.use('/api/health', (_req, res) => {
            const livekitUrl = getEnvValue('LIVEKIT_URL', rootDir);
            const apiKey = getEnvValue('LIVEKIT_API_KEY', rootDir);
            const apiSecret = getEnvValue('LIVEKIT_API_SECRET', rootDir);
            const isConfigured = Boolean(livekitUrl && apiKey && apiSecret);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                status: 'ok',
                livekitConfigured: isConfigured,
                serverUrl: livekitUrl ? livekitUrl.replace(/:\/\/.*@/, '://***@') : null,
              })
            );
          });
        },
      },
    ],
    server: {
      port: 5173,
      host: true,
    },
  };
});
