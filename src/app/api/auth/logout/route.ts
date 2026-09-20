import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { appUrl } from "@/lib/env";

/**
 * Logout endpoint used by plain HTML forms (no client JS required).
 * Server-side session revocation – never a client-side-only sign-out.
 */
export async function POST() {
  await destroySession();
  return NextResponse.redirect(`${appUrl}/`, { status: 303 });
}

export async function GET() {
  await destroySession();
  return NextResponse.redirect(`${appUrl}/`, { status: 303 });
}
