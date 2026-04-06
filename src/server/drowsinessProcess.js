import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";

const SERVICE_HOST = process.env.DROWSINESS_HOST || "127.0.0.1";
const SERVICE_PORT = Number(process.env.DROWSINESS_PORT || 5001);
const SERVICE_URL = `http://${SERVICE_HOST}:${SERVICE_PORT}`;
const ROOT_SCRIPT_PATH = path.join(process.cwd(), "service.py");
const LEGACY_SCRIPT_PATH = path.join(process.cwd(), "DrowsinessAlertSystem", "service.py");
const LOG_TAIL_LIMIT = 160;

const GLOBAL_STATE_KEY = "__voltrixDrowsinessProcessState";

function getState() {
  if (!globalThis[GLOBAL_STATE_KEY]) {
    globalThis[GLOBAL_STATE_KEY] = {
      process: null,
      startedAt: null,
      logTail: [],
      lastError: "",
      stopping: false,
      pythonCommand: null,
      pythonArgs: [],
    };
  }
  return globalThis[GLOBAL_STATE_KEY];
}

function appendLog(prefix, chunk) {
  const state = getState();
  const lines = String(chunk)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const stamp = new Date().toISOString();
    state.logTail.push(`[${stamp}] ${prefix}${line}`);
  }

  if (state.logTail.length > LOG_TAIL_LIMIT) {
    state.logTail = state.logTail.slice(-LOG_TAIL_LIMIT);
  }
}

function isProcessAlive(proc) {
  return Boolean(proc && proc.exitCode == null && !proc.killed);
}

function canRun(command, args = []) {
  try {
    const result = spawnSync(command, [...args, "--version"], {
      stdio: "ignore",
      windowsHide: true,
      shell: false,
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

function resolvePythonRunner() {
  const customPythonPath = process.env.DROWSINESS_PYTHON_PATH;
  if (customPythonPath) {
    return { command: customPythonPath, args: [] };
  }

  const candidates = process.platform === "win32"
    ? [
        { command: "python", args: [] },
        { command: "py", args: ["-3"] },
        { command: "python3", args: [] },
      ]
    : [
        { command: "python3", args: [] },
        { command: "python", args: [] },
      ];

  for (const candidate of candidates) {
    if (canRun(candidate.command, candidate.args)) {
      return candidate;
    }
  }

  return null;
}

function resolveServiceScriptPath() {
  if (fs.existsSync(ROOT_SCRIPT_PATH)) {
    return ROOT_SCRIPT_PATH;
  }
  if (fs.existsSync(LEGACY_SCRIPT_PATH)) {
    return LEGACY_SCRIPT_PATH;
  }
  return ROOT_SCRIPT_PATH;
}

async function fetchJsonWithTimeout(url, timeoutMs = 1500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function getDrowsinessServiceUrl() {
  return SERVICE_URL;
}

export async function startDrowsinessService() {
  const state = getState();
  const scriptPath = resolveServiceScriptPath();

  if (isProcessAlive(state.process)) {
    return {
      running: true,
      alreadyRunning: true,
      pid: state.process.pid,
      serviceUrl: SERVICE_URL,
    };
  }

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Drowsiness service script not found at ${scriptPath}`);
  }

  const runner = resolvePythonRunner();
  if (!runner) {
    throw new Error(
      "Python runtime not found. Install Python or set DROWSINESS_PYTHON_PATH in .env.local"
    );
  }

  const child = spawn(runner.command, [...runner.args, scriptPath], {
    cwd: process.cwd(),
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DROWSINESS_HOST: SERVICE_HOST,
      DROWSINESS_PORT: String(SERVICE_PORT),
    },
  });

  child.stdout?.on("data", (chunk) => appendLog("OUT: ", chunk));
  child.stderr?.on("data", (chunk) => appendLog("ERR: ", chunk));

  child.on("error", (err) => {
    state.lastError = `Python process error: ${err.message}`;
    appendLog("ERR: ", state.lastError);
  });

  child.on("exit", (code, signal) => {
    const wasStopping = state.stopping;
    state.stopping = false;
    const endReason = `Python service exited (code=${code}, signal=${signal || "none"})`;
    appendLog("OUT: ", endReason);
    state.process = null;
    if (!wasStopping && code && code !== 0) {
      state.lastError = endReason;
    }
  });

  state.process = child;
  state.startedAt = Date.now();
  state.lastError = "";
  state.stopping = false;
  state.pythonCommand = runner.command;
  state.pythonArgs = runner.args;

  appendLog("OUT: ", `Started Python drowsiness service on ${SERVICE_URL}`);

  return {
    running: true,
    alreadyRunning: false,
    pid: child.pid,
    serviceUrl: SERVICE_URL,
  };
}

export async function getDrowsinessStatus() {
  const state = getState();
  const running = isProcessAlive(state.process);
  let serviceStatus = null;
  let reachable = false;

  if (running) {
    try {
      serviceStatus = await fetchJsonWithTimeout(`${SERVICE_URL}/status`, 1500);
      reachable = true;
      if (serviceStatus?.error) {
        state.lastError = serviceStatus.error;
      }
    } catch (err) {
      state.lastError = `Service unreachable: ${err.message}`;
    }
  }

  return {
    running,
    pid: running ? state.process.pid : null,
    processReady: reachable,
    startedAt: state.startedAt,
    serviceUrl: SERVICE_URL,
    serviceStatus,
    lastError: state.lastError,
    logTail: state.logTail.slice(-40),
    pythonCommand: state.pythonCommand,
  };
}

export async function stopDrowsinessService() {
  const state = getState();
  const proc = state.process;
  if (!isProcessAlive(proc)) {
    state.process = null;
    state.stopping = false;
    state.lastError = "";
    return { running: false, stopped: true };
  }

  state.stopping = true;
  state.lastError = "";

  try {
    await fetch(`${SERVICE_URL}/stop`, { method: "POST", cache: "no-store" });
  } catch {
    // Best effort: process termination below is authoritative.
  }

  if (process.platform === "win32") {
    try {
      spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } catch {
      proc.kill();
    }
  } else {
    proc.kill("SIGTERM");
  }

  state.process = null;
  appendLog("OUT: ", "Stopped Python drowsiness service");

  return { running: false, stopped: true };
}
