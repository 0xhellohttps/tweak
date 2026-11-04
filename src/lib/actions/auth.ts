"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
  requireUser,
} from "@/lib/auth";

export type AuthState = { error?: string };

const USERNAME_RE = /^[a-z0-9_]{2,24}$/;

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim() || username;
  const roles = formData.getAll("roles").map(String).filter(Boolean);

  if (!email.includes("@")) return { error: "Enter a real email." };
  if (!USERNAME_RE.test(username))
    return { error: "Username: 2-24 chars, lowercase letters, numbers, underscores." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing)
    return { error: existing.email === email ? "Email already registered." : "Username taken." };

  const user = await db.user.create({
    data: {
      email,
      username,
      displayName,
      passwordHash: await hashPassword(password),
      roles: roles.length ? roles.join(",") : "LISTENER",
    },
  });

  await createSession(user.id);
  redirect("/feed");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await db.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return { error: "Wrong credentials." };
  if (user.isSuspended) return { error: "This account is suspended." };

  await createSession(user.id);
  redirect("/feed");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireUser();
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== user.username) return;
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
