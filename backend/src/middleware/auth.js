import crypto from "node:crypto";
import { env } from "../config/env.js";
import { ROLES } from "../core/constants.js";

const JWT_ALG = "HS256";

function base64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}

function parseBase64urlJson(input) {
  try {
    return JSON.parse(Buffer.from(input, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function signRaw(raw) {
  return crypto.createHmac("sha256", env.authSecret).update(raw).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function issueAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    name: user.name,
    role: user.role,
    department: user.department || "غير محدد",
    iat: now,
    exp: now + env.authAccessTtlSec,
    iss: env.authIssuer,
  };

  const headerPart = base64urlJson({ alg: JWT_ALG, typ: "JWT" });
  const payloadPart = base64urlJson(payload);
  const raw = `${headerPart}.${payloadPart}`;
  const signature = signRaw(raw);

  return `${raw}.${signature}`;
}

export function verifyAccessToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signature] = parts;
  const header = parseBase64urlJson(headerPart);
  const payload = parseBase64urlJson(payloadPart);
  if (!header || !payload) return null;

  if (header.alg !== JWT_ALG || header.typ !== "JWT") return null;

  const expected = signRaw(`${headerPart}.${payloadPart}`);
  if (!safeEqual(signature, expected)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now) return null;
  if (payload.iss !== env.authIssuer) return null;
  if (!payload.role || !ROLES[payload.role]) return null;

  return {
    id: payload.sub,
    name: payload.name,
    role: payload.role,
    department: payload.department || "غير محدد",
  };
}

export function authOptional(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  req.user = token ? verifyAccessToken(token) : null;
  next();
}

export function authRequired(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });
    return next();
  });
}
