import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken } from "@/lib/adminSession";

export async function POST(request: Request) {
  const { code } = await request.json().catch(() => ({ code: "" }));
  const adminCode = process.env.ADMIN_ACCESS_CODE;

  if (!adminCode) {
    return NextResponse.json({ message: "ADMIN_ACCESS_CODE가 아직 설정되지 않았어요." }, { status: 500 });
  }

  if (code !== adminCode) {
    return NextResponse.json({ message: "관리자 코드가 맞지 않아요." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: createAdminToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });

  return response;
}
