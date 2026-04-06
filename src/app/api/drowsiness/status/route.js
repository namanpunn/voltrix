import { NextResponse } from "next/server";
import { getDrowsinessStatus } from "@/server/drowsinessProcess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getDrowsinessStatus();
    return NextResponse.json({ ok: true, ...status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        running: false,
        error: error.message || "Unable to read drowsiness status",
      },
      { status: 500 }
    );
  }
}
