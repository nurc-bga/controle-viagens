import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { ENV } from "./_core/env";

export const PASSWORD_SESSION_COOKIE = "controle_viagens_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  return ENV.cookieSecret || "controle-viagens-local-secret";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [, salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createPasswordSession(userId: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function getUserIdFromPasswordSession(req: Request) {
  const token = req.cookies?.[PASSWORD_SESSION_COOKIE] as string | undefined;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userIdText, expiresAtText, signature] = parts;
  const userId = Number(userIdText);
  const expiresAt = Number(expiresAtText);
  if (!Number.isInteger(userId) || !Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;
  const payload = `${userId}.${expiresAt}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return userId;
}
