"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  PAINEL_COOKIE,
  painelPassword,
  passwordMatches,
  sessionToken,
} from "@/lib/painel-auth";

export async function login(formData: FormData) {
  const password = painelPassword();
  const attempt = String(formData.get("senha") ?? "");
  if (!password || !passwordMatches(attempt, password)) redirect("/painel?erro=1");

  (await cookies()).set(PAINEL_COOKIE, sessionToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/painel",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/painel");
}

export async function logout() {
  (await cookies()).delete({ name: PAINEL_COOKIE, path: "/painel" });
  redirect("/painel");
}
