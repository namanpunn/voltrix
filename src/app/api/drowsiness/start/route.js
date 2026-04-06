import { NextResponse } from "next/server";
import {
  startDrowsinessService,
  getDrowsinessStatus,
} from "@/server/drowsinessProcess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntilReady(timeoutMs = 9000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await getDrowsinessStatus();
    if (status.processReady) {
      return status;
    }
    await sleep(500);
  }
  return getDrowsinessStatus();
}

export async function POST() {
  try {
    await startDrowsinessService();
    const status = await waitUntilReady();

    const error =
      status.serviceStatus?.error ||
      (!status.running ? status.lastError : "") ||
      "";

    return NextResponse.json(
      {
        ok: !error,
        running: status.running,
        processReady: status.processReady,
        serviceUrl: status.serviceUrl,
        serviceStatus: status.serviceStatus,
        error,
        logs: status.logTail,
      },
      { status: error ? 500 : 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to start drowsiness service" },
      { status: 500 }
    );
  }
}
