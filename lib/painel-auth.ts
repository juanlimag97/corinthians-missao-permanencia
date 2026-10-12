import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const PAINEL_COOKIE = "painel";

export const painelPassword = () => process.env.PAINEL_SENHA || null;

/** O cookie guarda um HMAC da senha, nunca a senha em si. */
export function sessionToken(password: string) {
  return createHmac("sha256", password).update("missao-permanencia-painel").digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const passwordMatches = (attempt: string, password: string) =>
  safeEqual(sessionToken(attempt), sessionToken(password));

export async function isLoggedIn() {
  const password = painelPassword();
  if (!password) return false;
  const token = (await cookies()).get(PAINEL_COOKIE)?.value;
  return token ? safeEqual(token, sessionToken(password)) : false;
}
