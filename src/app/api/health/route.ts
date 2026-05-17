import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    environment: process.env.APP_ENV ?? "local",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
}
