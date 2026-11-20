export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const livekitUrl =
    process.env.LIVEKIT_URL ||
    process.env.VITE_LIVEKIT_URL ||
    process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey =
    process.env.LIVEKIT_API_KEY ||
    process.env.VITE_LIVEKIT_API_KEY;
  const apiSecret =
    process.env.LIVEKIT_API_SECRET ||
    process.env.VITE_LIVEKIT_API_SECRET;

  const isConfigured = Boolean(livekitUrl && apiKey && apiSecret);

  return res.status(200).json({
    status: 'ok',
    livekitConfigured: isConfigured,
    serverUrl: livekitUrl ? livekitUrl.replace(/:\/\/.*@/, '://***@') : null,
    timestamp: new Date().toISOString(),
  });
}
