const ROUTING_BASE_URL = "https://api.tomtom.com/routing/1/calculateRoute";
const CACHE_TTL_MS = Number(process.env.SPEED_LIMIT_CACHE_TTL_MS || 2 * 60 * 1000);
const ERROR_CACHE_TTL_MS = Number(process.env.SPEED_LIMIT_ERROR_CACHE_TTL_MS || 15 * 1000);
const REQUEST_TIMEOUT_MS = Number(process.env.SPEED_LIMIT_REQUEST_TIMEOUT_MS || 3500);
const CACHE_COORD_DECIMALS = Number(process.env.SPEED_LIMIT_CACHE_COORD_DECIMALS || 4);

const GLOBAL_CACHE_KEY = "__voltrixSpeedLimitCache";

function getTomTomApiKey() {
  return (
    process.env.TOMTOM_API_KEY ||
    process.env.NEXT_PUBLIC_TOMTOM_API_KEY ||
    ""
  );
}

function getState() {
  if (!globalThis[GLOBAL_CACHE_KEY]) {
    globalThis[GLOBAL_CACHE_KEY] = {
      cache: new Map(),
    };
  }
  return globalThis[GLOBAL_CACHE_KEY];
}

function roundCoord(value) {
  return Number(Number(value).toFixed(CACHE_COORD_DECIMALS));
}

function getCacheKey(lat, lng) {
  return `${roundCoord(lat)},${roundCoord(lng)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function parseSpeedValue(value) {
  if (Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const match = value.match(/(\d+(?:\.\d+)?)/);
    if (!match) {
      return null;
    }
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  return null;
}

function collectSpeedLimitValues(node, output = []) {
  if (!node || typeof node !== "object") {
    return output;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectSpeedLimitValues(item, output);
    }
    return output;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.toLowerCase().includes("speedlimit")) {
      const parsed = parseSpeedValue(value);
      if (parsed != null) {
        output.push(parsed);
      }
    }

    if (value && typeof value === "object") {
      collectSpeedLimitValues(value, output);
    }
  }

  return output;
}

function extractSpeedLimit(route) {
  const sections = Array.isArray(route?.sections) ? route.sections : [];
  const speedSections = sections
    .filter((section) =>
      String(section?.sectionType || "").toLowerCase().includes("speed")
    )
    .sort((a, b) => (a?.startPointIndex || 0) - (b?.startPointIndex || 0));

  for (const section of speedSections) {
    const directCandidates = [
      section?.maxSpeedLimitInKmh,
      section?.speedLimitInKmh,
      section?.effectiveSpeedLimitInKmh,
      section?.maximumSpeedLimitInKmh,
      section?.speedLimitKmh,
      section?.speedLimit,
      section?.maxSpeedLimit,
    ];

    for (const candidate of directCandidates) {
      const parsed = parseSpeedValue(candidate);
      if (parsed != null) {
        return parsed;
      }
    }

    const nestedCandidates = collectSpeedLimitValues(section);
    if (nestedCandidates.length > 0) {
      return nestedCandidates[0];
    }
  }

  const fallbackCandidates = collectSpeedLimitValues(route);
  if (fallbackCandidates.length > 0) {
    return fallbackCandidates[0];
  }

  return null;
}

function extractRoadName(route) {
  const instructions = Array.isArray(route?.guidance?.instructions)
    ? route.guidance.instructions
    : [];

  for (const instruction of instructions) {
    const street = instruction?.street;
    if (typeof street === "string" && street.trim()) {
      return street.trim();
    }
  }

  const summaryName = route?.summary?.name;
  if (typeof summaryName === "string" && summaryName.trim()) {
    return summaryName.trim();
  }

  return "";
}

async function fetchTomTomSpeedLimit(lat, lng, apiKey) {
  const nearbyLng = Number((lng + 0.0018).toFixed(6));
  const routePath = `${lat},${lng}:${lat},${nearbyLng}`;

  const params = new URLSearchParams({
    key: apiKey,
    traffic: "false",
    travelMode: "car",
    routeType: "fastest",
    instructionsType: "text",
    language: "en-US",
  });
  params.append("sectionType", "speedLimit");
  params.append("sectionType", "travelMode");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${ROUTING_BASE_URL}/${routePath}/json?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`TomTom request failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    const route = payload?.routes?.[0];

    if (!route) {
      throw new Error("TomTom route response missing speed-limit data");
    }

    return {
      maxSpeedKmh: extractSpeedLimit(route),
      roadName: extractRoadName(route),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getSpeedLimitForPoint(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates for speed-limit lookup");
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new Error("Coordinates out of range");
  }

  const state = getState();
  const cacheKey = getCacheKey(lat, lng);
  const now = Date.now();

  const cached = state.cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return {
      ...cached.data,
      cacheHit: true,
    };
  }

  const apiKey = getTomTomApiKey();
  if (!apiKey) {
    const result = {
      maxSpeedKmh: null,
      roadName: "",
      source: "tomtom",
      cacheHit: false,
      updatedAt: nowIso(),
      unknownReason:
        "TomTom API key is missing. Set TOMTOM_API_KEY or NEXT_PUBLIC_TOMTOM_API_KEY.",
    };

    state.cache.set(cacheKey, {
      expiresAt: now + ERROR_CACHE_TTL_MS,
      data: result,
    });

    return result;
  }

  try {
    const lookup = await fetchTomTomSpeedLimit(lat, lng, apiKey);
    const result = {
      maxSpeedKmh: lookup.maxSpeedKmh,
      roadName: lookup.roadName,
      source: "tomtom",
      cacheHit: false,
      updatedAt: nowIso(),
      unknownReason:
        lookup.maxSpeedKmh == null
          ? "Speed limit data is unavailable for this road segment."
          : "",
    };

    state.cache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      data: result,
    });

    return result;
  } catch (error) {
    const result = {
      maxSpeedKmh: null,
      roadName: "",
      source: "tomtom",
      cacheHit: false,
      updatedAt: nowIso(),
      unknownReason: error.message || "Speed-limit lookup failed.",
    };

    state.cache.set(cacheKey, {
      expiresAt: now + ERROR_CACHE_TTL_MS,
      data: result,
    });

    return result;
  }
}

export function clearSpeedLimitCache() {
  const state = getState();
  state.cache.clear();
}
