import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dr_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const raw = process.env.INVITE_CODES ?? "";
  const validCodes = raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (validCodes.length === 0) {
    return NextResponse.json({ error: "Access not configured" }, { status: 503 });
  }

  if (!validCodes.includes(code.trim().toUpperCase())) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "granted", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
