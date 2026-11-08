import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  findUsersWithPushSubscriptions,
  addPushSubscriptionRepo,
  removePushSubscriptionRepo,
} from '../repositories/user.repository.js';
import { badRequest } from '../utils/error.util.js';

const VAPID_FILE_PATH = path.resolve(process.cwd(), '.vapid-keys.json');

const toBase64Url = (buf) =>
  Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = (str) => {
  const normalized = String(str || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
};

let cachedVapidKeys = null;

export const getVapidKeys = () => {
  if (cachedVapidKeys) return cachedVapidKeys;

  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    cachedVapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      subject: process.env.VAPID_SUBJECT || 'mailto:notifications@nexuspulse.local',
    };
    return cachedVapidKeys;
  }

  try {
    if (fs.existsSync(VAPID_FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(VAPID_FILE_PATH, 'utf8'));
      if (parsed?.publicKey && parsed?.privateKey) {
        cachedVapidKeys = {
          publicKey: parsed.publicKey,
          privateKey: parsed.privateKey,
          subject: parsed.subject || 'mailto:notifications@nexuspulse.local',
        };
        return cachedVapidKeys;
      }
    }
  } catch {
    // Generate fresh keys below if file cannot be read
  }

  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const publicKey = toBase64Url(ecdh.getPublicKey());
  const privateKey = toBase64Url(ecdh.getPrivateKey());
  const subject = 'mailto:notifications@nexuspulse.local';

  cachedVapidKeys = { publicKey, privateKey, subject };

  try {
    fs.writeFileSync(VAPID_FILE_PATH, JSON.stringify(cachedVapidKeys, null, 2), 'utf8');
  } catch {
    // Ignore write failure in read-only environments
  }

  return cachedVapidKeys;
};

const createVapidJwt = (endpoint, vapidKeys) => {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = toBase64Url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = toBase64Url(
    JSON.stringify({
      aud: audience,
      exp,
      sub: vapidKeys.subject,
    })
  );

  const unsignedToken = `${header}.${payload}`;

  const pubBytes = fromBase64Url(vapidKeys.publicKey);
  const x = toBase64Url(pubBytes.subarray(1, 33));
  const y = toBase64Url(pubBytes.subarray(33, 65));
  const d = vapidKeys.privateKey;

  const privateKeyObj = crypto.createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x,
      y,
      d,
    },
    format: 'jwk',
  });

  const signature = crypto.sign('SHA256', Buffer.from(unsignedToken), {
    key: privateKeyObj,
    dsaEncoding: 'ieee-p1363',
  });

  return `${unsignedToken}.${toBase64Url(signature)}`;
};

const hkdfSha256 = (ikm, salt, info, length) =>
  Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, length));

const encryptWebPushPayload = (payloadString, subscriptionKeys) => {
  const uaPublic = fromBase64Url(subscriptionKeys.p256dh);
  const authSecret = fromBase64Url(subscriptionKeys.auth);

  const asEcdh = crypto.createECDH('prime256v1');
  const asPublic = asEcdh.generateKeys();
  const sharedSecret = asEcdh.computeSecret(uaPublic);

  const salt = crypto.randomBytes(16);

  const keyInfo = Buffer.concat([
    Buffer.from('WebPush: info\0', 'ascii'),
    uaPublic,
    asPublic,
  ]);
  const ikm = hkdfSha256(sharedSecret, authSecret, keyInfo, 32);

  const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'ascii');
  const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'ascii');

  const cek = hkdfSha256(ikm, salt, cekInfo, 16);
  const nonce = hkdfSha256(ikm, salt, nonceInfo, 12);

  const paddedPayload = Buffer.concat([
    Buffer.from(payloadString, 'utf8'),
    Buffer.from([2]),
  ]);

  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([
    cipher.update(paddedPayload),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const rsBuf = Buffer.alloc(4);
  rsBuf.writeUInt32BE(4096, 0);
  const idLenBuf = Buffer.from([asPublic.length]);

  return Buffer.concat([salt, rsBuf, idLenBuf, asPublic, encrypted]);
};

export const subscribeUserPushService = async (userId, subscription) => {
  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    throw badRequest('Invalid push subscription payload');
  }

  await addPushSubscriptionRepo(userId, subscription);
  return { subscribed: true };
};

export const unsubscribeUserPushService = async (userId, endpoint) => {
  if (!endpoint) {
    throw badRequest('Subscription endpoint is required');
  }
  await removePushSubscriptionRepo(userId, endpoint);
  return { unsubscribed: true };
};

export const sendPushNotificationToUsers = async (userIds, payload) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return;

  try {
    const users = await findUsersWithPushSubscriptions(userIds);
    if (!users || users.length === 0) return;

    const vapidKeys = getVapidKeys();
    const payloadString = JSON.stringify(payload);
    const seenEndpoints = new Set();

    await Promise.allSettled(
      users.flatMap((u) =>
        (u.pushSubscriptions || []).map(async (sub) => {
          if (!sub?.endpoint || seenEndpoints.has(sub.endpoint)) return;
          seenEndpoints.add(sub.endpoint);

          try {
            const body = encryptWebPushPayload(payloadString, sub.keys);
            const jwt = createVapidJwt(sub.endpoint, vapidKeys);

            const res = await fetch(sub.endpoint, {
              method: 'POST',
              headers: {
                Authorization: `vapid t=${jwt}, k=${vapidKeys.publicKey}`,
                'Content-Encoding': 'aes128gcm',
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(body.length),
                TTL: '86400',
                Urgency: 'high',
              },
              body,
            });

            if (res.status === 404 || res.status === 410) {
              await removePushSubscriptionRepo(u._id, sub.endpoint);
            }
          } catch {
            // Ignore transient push delivery errors for individual endpoints
          }
        })
      )
    );
  } catch {
    // Non-blocking push notification dispatch
  }
};

