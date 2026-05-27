import { Router } from 'express';
import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;

export const agoraRouter = Router();

agoraRouter.get('/token', (req, res) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channelName = req.query.channel as string;
  const uid = parseInt(req.query.uid as string) || 0;

  if (!appId || !appCertificate) {
    return res.status(500).json({ error: 'Agora credentials not configured' });
  }
  if (!channelName) {
    return res.status(400).json({ error: 'channel query param required' });
  }

  const expireTime = 3600; // 1 hour
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpireTime,
    privilegeExpireTime
  );

  res.json({ token, appId, channel: channelName, uid });
});
