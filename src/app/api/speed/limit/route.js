import { NextResponse } from "next/server";
import { getSpeedLimitForPoint } from "@/server/speedLimitService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCoord(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function GET(request) {
  const url = new URL(request.url);
  const lat = parseCoord(url.searchParams.get("lat"));
  const lng = parseCoord(url.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { ok: false, error: "Query params lat and lng are required numbers." },
      { status: 400 }
    );
  }

  try {
    const result = await getSpeedLimitForPoint(lat, lng);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        maxSpeedKmh: null,
        roadName: "",
        source: "tomtom",
        cacheHit: false,
        updatedAt: new Date().toISOString(),
        unknownReason: error.message || "Speed-limit lookup failed.",
      },
      { status: 500 }
    );
  }
}
