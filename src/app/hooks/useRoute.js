// ─── useRoute.js ──────────────────────────────────────────────────────────────
// Custom hook encapsulating all geocoding + routing API calls

import { useState, useRef, useCallback } from "react";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OSRM      = "https://router.project-osrm.org/route/v1/driving";

// ── Geocode a place name → [lat, lng] — India biased ─────────────────────────
export async function geocodePlace(query) {
  const params = new URLSearchParams({
    format: "json", q: query, limit: "1",
    countrycodes: "in", viewbox: "76.8,28.2,77.6,29.0", bounded: "1",
  });
  const res  = await fetch(`${NOMINATIM}/search?${params}`, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  if (!data.length) throw new Error(`Place not found: "${query}"`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// ── Haversine distance (km) between two [lat,lng] points ─────────────────────
function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// ── Fetch autocomplete suggestions — sorted by distance from user ────────────
export async function fetchSuggestions(query, userCoords = null) {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    format:       "json",
    q:            query,
    limit:        "7",
    addressdetails:"1",
    countrycodes: "in",                          // restrict to India
    viewbox:      "76.8,28.2,77.6,29.0",         // Delhi NCR bounding box
    bounded:      "1",                           // hard-restrict to viewbox
    "accept-language": "en",
  });

  const res  = await fetch(`${NOMINATIM}/search?${params}`, {
    headers: { "Accept-Language": "en" },
  });
  const data = await res.json();

  const results = data.map((item) => {
    const parts     = item.display_name.split(",").map((s) => s.trim());
    const shortName = parts[0];
    const city      = parts.find((p, i) => i > 0 && i < 4 && p.length > 1) || "";
    const subtitle  = city ? `${shortName}, ${city}` : shortName;
    const coords    = [parseFloat(item.lat), parseFloat(item.lon)];

    return {
      label:     item.display_name,
      shortName: subtitle,
      plainName: shortName,
      coords,
      type:      item.type || item.class,
      placeId:   item.place_id,
      dist:      userCoords ? haversineKm(userCoords, coords) : null,
    };
  });

  // Sort by distance from user (closest first) when location is available
  if (userCoords) {
    results.sort((a, b) => a.dist - b.dist);
  }

  return results;
}

// ── Get driving route between two [lat,lng] pairs ─────────────────────────────
export async function fetchRoute(from, to, viaCoords = null) {
  const waypoints = viaCoords
    ? `${from[1]},${from[0]};${viaCoords[1]},${viaCoords[0]};${to[1]},${to[0]}`
    : `${from[1]},${from[0]};${to[1]},${to[0]}`;

  const res  = await fetch(`${OSRM}/${waypoints}?overview=full&geometries=geojson&steps=true`);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Route not found");

  const route = data.routes[0];

  // Extract per-step traffic segments with speed data
  const trafficSegments = [];
  for (const leg of route.legs) {
    for (const step of leg.steps) {
      if (!step.geometry?.coordinates || step.geometry.coordinates.length < 2) continue;
      const speedKmh = step.duration > 0 ? (step.distance / step.duration) * 3.6 : 0;
      trafficSegments.push({
        coordinates: step.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        speed: Math.round(speedKmh),
        name: step.name || "",
      });
    }
  }

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance:    (route.distance / 1000).toFixed(1),
    duration:    Math.round(route.duration / 60),
    rawDistance: route.distance,
    rawDuration: route.duration,
    trafficSegments,
  };
}

// ── useRoute hook ─────────────────────────────────────────────────────────────
export function useRoute() {
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [primaryRoute,     setPrimaryRoute]     = useState(null);   // { coords, distance, duration, label }
  const [alternateRoute,   setAlternateRoute]   = useState(null);
  const [showSplit,        setShowSplit]        = useState(false);

  const abortRef = useRef(null);

  // ── Calculate primary route ──────────────────────────────────────────────
  const calculatePrimary = useCallback(async (srcText, dstText) => {
    setError("");
    setLoading(true);
    setAlternateRoute(null);
    setShowSplit(false);

    try {
      const [from, to] = await Promise.all([
        geocodePlace(srcText),
        geocodePlace(dstText),
      ]);
      const route = await fetchRoute(from, to);
      setPrimaryRoute({ ...route, fromCoords: from, toCoords: to, fromText: srcText, toText: dstText });
      return { from, to, route };
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Calculate alternate route via a custom road ──────────────────────────
  const calculateAlternate = useCallback(async (viaText) => {
    if (!primaryRoute) return;
    setError("");
    setLoading(true);

    try {
      const viaCoords = await geocodePlace(viaText);
      const route     = await fetchRoute(primaryRoute.fromCoords, primaryRoute.toCoords, viaCoords);
      setAlternateRoute({ ...route, viaText, viaCoords });
      setShowSplit(true);
      return route;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [primaryRoute]);

  const clearAlternate = useCallback(() => {
    setAlternateRoute(null);
    setShowSplit(false);
  }, []);

  const clearAll = useCallback(() => {
    setPrimaryRoute(null);
    setAlternateRoute(null);
    setShowSplit(false);
    setError("");
  }, []);

  return {
    loading, error, setError,
    primaryRoute, setPrimaryRoute,
    alternateRoute, showSplit,
    calculatePrimary, calculateAlternate,
    clearAlternate, clearAll,
  };
}