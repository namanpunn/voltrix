// ─── useRoute.js ──────────────────────────────────────────────────────────────
// Custom hook encapsulating all geocoding + routing API calls

import { useState, useRef, useCallback } from "react";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OSRM      = "https://router.project-osrm.org/route/v1/driving";

// ── Geocode a place name → [lat, lng] — India biased ─────────────────────────
export async function geocodePlace(query) {
  const params = new URLSearchParams({
    format: "json", q: query, limit: "1",
    countrycodes: "in", viewbox: "68.1,6.5,97.4,35.7", bounded: "0",
  });
  const res  = await fetch(`${NOMINATIM}/search?${params}`, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  if (!data.length) throw new Error(`Place not found: "${query}"`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// ── Fetch autocomplete suggestions — India biased ────────────────────────────
export async function fetchSuggestions(query) {
  if (!query || query.trim().length < 3) return [];

  // India bounding box: SW(6.5, 68.1) → NE(35.7, 97.4)
  const params = new URLSearchParams({
    format:       "json",
    q:            query,
    limit:        "7",
    addressdetails:"1",
    countrycodes: "in",                          // restrict to India
    viewbox:      "68.1,6.5,97.4,35.7",         // India bounding box (lon_min,lat_min,lon_max,lat_max)
    bounded:      "0",                           // 0 = prefer viewbox but don't hard-restrict
    "accept-language": "en",
  });

  const res  = await fetch(`${NOMINATIM}/search?${params}`, {
    headers: { "Accept-Language": "en" },
  });
  const data = await res.json();

  return data.map((item) => {
    // Build a short readable name: "Place Name, City" instead of full address
    const parts     = item.display_name.split(",").map((s) => s.trim());
    const shortName = parts[0];
    const city      = parts.find((p, i) => i > 0 && i < 4 && p.length > 1) || "";
    const subtitle  = city ? `${shortName}, ${city}` : shortName;

    return {
      label:     item.display_name,
      shortName: subtitle,
      plainName: shortName,                      // used when selecting
      coords:    [parseFloat(item.lat), parseFloat(item.lon)],
      type:      item.type || item.class,
      placeId:   item.place_id,
    };
  });
}

// ── Get driving route between two [lat,lng] pairs ─────────────────────────────
export async function fetchRoute(from, to, viaCoords = null) {
  const waypoints = viaCoords
    ? `${from[1]},${from[0]};${viaCoords[1]},${viaCoords[0]};${to[1]},${to[0]}`
    : `${from[1]},${from[0]};${to[1]},${to[0]}`;

  const res  = await fetch(`${OSRM}/${waypoints}?overview=full&geometries=geojson`);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Route not found");

  const route = data.routes[0];
  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance:    (route.distance / 1000).toFixed(1),
    duration:    Math.round(route.duration / 60),
    rawDistance: route.distance,
    rawDuration: route.duration,
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