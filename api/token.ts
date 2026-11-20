import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
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

    // Check if LiveKit credentials are configured
    if (!livekitUrl || !apiKey || !apiSecret) {
      return res.status(200).json({
        configured: false,
        demoMode: true,
        message:
          'LiveKit credentials not configured in environment variables. Running in Interactive Demo Mode.',
      });
    }

    // Extract student name and room from query or body
    const query = req.query || {};
    const body = req.body || {};
    const studentName = query.name || body.name || 'Student';
    const roomName =
      query.room ||
      body.room ||
      'iris_study_room';

    // Unique participant identity
    const identity = `student_${Math.random().toString(36).slice(2, 9)}`;

    // Create AccessToken granting room permissions
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: studentName,
      ttl: 3600 * 2, // 2 hours
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await at.toJwt();

    return res.status(200).json({
      configured: true,
      serverUrl: livekitUrl,
      token: jwt,
      roomName,
      identity,
      participantName: studentName,
    });
  } catch (error: any) {
    console.error('Failed to generate LiveKit token:', error);
    return res.status(500).json({
      error: 'TOKEN_GENERATION_FAILED',
      message: error?.message || 'Failed to issue LiveKit access token',
    });
  }
}
