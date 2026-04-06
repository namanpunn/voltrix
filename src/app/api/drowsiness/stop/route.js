import { NextResponse } from "next/server";
import { stopDrowsinessService } from "@/server/drowsinessProcess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await stopDrowsinessService();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to stop drowsiness service" },
      { status: 500 }
    );
  }
}
