// ─── hooks/useRerouting.js ────────────────────────────────────────────────────
// Handles off-route detection, auto-recalculation, and roadblock reporting

import { useState, useRef, useCallback, useEffect } from "react";
import { fetchRoute, geocodePlace } from "./useRoute";

// ── Constants ─────────────────────────────────────────────────────────────────
const OFF_ROUTE_THRESHOLD_M = 80;   // metres before we consider user off-route
const RECHECK_INTERVAL_MS   = 3000; // how often we check position vs route
const MIN_REROUTE_INTERVAL  = 8000; // don't reroute more than once per 8s

// ── Haversine distance in metres ──────────────────────────────────────────────
function distanceBetween(a, b) {
  const R    = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
    Math.cos((b[0] * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// ── Minimum distance from a point to a polyline segment ──────────────────────
function distanceToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return distanceBetween(p, a);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return distanceBetween(p, [a[0] + t * dx, a[1] + t * dy]);
}

// ── Minimum distance from point to entire route polyline ─────────────────────
export function distanceToRoute(point, routeCoords) {
  let min = Infinity;
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const d = distanceToSegment(point, routeCoords[i], routeCoords[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

// ── Find the closest point index on the route ─────────────────────────────────
export function closestRouteIndex(position, routeCoords) {
  let minDist = Infinity, idx = 0;
  routeCoords.forEach((pt, i) => {
    const d = distanceBetween(position, pt);
    if (d < minDist) { minDist = d; idx = i; }
  });
  return idx;
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useRerouting({ primaryRoute, onRerouted, onStatusChange }) {
  const [rerouteStatus,  setRerouteStatus]  = useState("idle");
  // idle | off_route | recalculating | rerouted | blocked
  const [rerouteHistory, setRerouteHistory] = useState([]);  // past reroutes
  const [roadblocks,     setRoadblocks]     = useState([]);  // user-reported blocks
  const [currentPos,     setCurrentPos]     = useState(null);
  const [distFromRoute,  setDistFromRoute]  = useState(0);

  const lastRerouteRef  = useRef(0);
  const simulPosRef     = useRef(null);  // simulated GPS index
  const timerRef        = useRef(null);
  const offRouteCountRef= useRef(0);     // consecutive off-route checks before alerting

  // ── Simulate position moving along route (same as CameraView) ───────────────
  useEffect(() => {
    if (!primaryRoute?.coordinates?.length) {
      simulPosRef.current = null;
      return;
    }
    simulPosRef.current = 0;
  }, [primaryRoute]);

  // ── Advance simulated position ────────────────────────────────────────────
  const advanceSimulatedPos = useCallback(() => {
    if (!primaryRoute?.coordinates) return null;
    const coords = primaryRoute.coordinates;
    const idx    = simulPosRef.current ?? 0;
    const next   = Math.min(idx + 4, coords.length - 1);
    simulPosRef.current = next;
    return coords[next];
  }, [primaryRoute]);

  // ── Trigger a simulated off-route deviation ────────────────────────────────
  const simulateOffRoute = useCallback(() => {
    if (!primaryRoute?.coordinates) return;
    const midIdx  = Math.floor(primaryRoute.coordinates.length / 2);
    const midPt   = primaryRoute.coordinates[midIdx];
    // Offset by ~200m north-east
    const offPt   = [midPt[0] + 0.002, midPt[1] + 0.002];
    setCurrentPos(offPt);
    setDistFromRoute(220);
    offRouteCountRef.current = 3; // immediately trigger
    setRerouteStatus("off_route");
    onStatusChange?.("off_route");
  }, [primaryRoute, onStatusChange]);

  // ── Check position vs route ────────────────────────────────────────────────
  const checkPosition = useCallback(() => {
    if (!primaryRoute?.coordinates) return;

    const pos  = advanceSimulatedPos();
    if (!pos) return;

    setCurrentPos(pos);
    const dist = distanceToRoute(pos, primaryRoute.coordinates);
    setDistFromRoute(Math.round(dist));

    if (dist > OFF_ROUTE_THRESHOLD_M) {
      offRouteCountRef.current += 1;
      if (offRouteCountRef.current >= 2) {
        setRerouteStatus("off_route");
        onStatusChange?.("off_route");
      }
    } else {
      offRouteCountRef.current = 0;
      if (rerouteStatus === "off_route") {
        setRerouteStatus("idle");
        onStatusChange?.("idle");
      }
    }
  }, [primaryRoute, advanceSimulatedPos, rerouteStatus, onStatusChange]);

  // ── Start / stop position monitoring ─────────────────────────────────────
  const startMonitoring = useCallback(() => {
    clearInterval(timerRef.current);
    offRouteCountRef.current = 0;
    setRerouteStatus("idle");
    timerRef.current = setInterval(checkPosition, RECHECK_INTERVAL_MS);
  }, [checkPosition]);

  const stopMonitoring = useCallback(() => {
    clearInterval(timerRef.current);
    setRerouteStatus("idle");
    setCurrentPos(null);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Auto-recalculate when off-route ───────────────────────────────────────
  const recalculate = useCallback(async (reason = "off_route") => {
    if (!primaryRoute || !currentPos) return;
    const now = Date.now();
    if (now - lastRerouteRef.current < MIN_REROUTE_INTERVAL) return;
    lastRerouteRef.current = now;

    setRerouteStatus("recalculating");
    onStatusChange?.("recalculating");

    try {
      // Build exclusion waypoints from roadblocks
      let viaCoords = null;
      if (roadblocks.length > 0) {
        // use the first non-blocked nearby waypoint as via
        const safeOffset = [currentPos[0] + 0.001, currentPos[1] + 0.001];
        viaCoords = safeOffset;
      }

      const newRoute = await fetchRoute(
        currentPos,
        primaryRoute.toCoords,
        viaCoords
      );

      const entry = {
        id:        Date.now(),
        reason,
        timestamp: new Date().toLocaleTimeString(),
        fromPos:   currentPos,
        oldDist:   primaryRoute.distance,
        newDist:   newRoute.distance,
        oldDuration: primaryRoute.duration,
        newDuration: newRoute.duration,
      };

      setRerouteHistory(prev => [entry, ...prev].slice(0, 5));
      setRerouteStatus("rerouted");
      onStatusChange?.("rerouted");
      onRerouted?.({ route: newRoute, fromCoords: currentPos, entry });

      // Reset to idle after a moment
      setTimeout(() => {
        setRerouteStatus("idle");
        onStatusChange?.("idle");
        offRouteCountRef.current = 0;
      }, 4000);

    } catch (err) {
      setRerouteStatus("idle");
    }
  }, [primaryRoute, currentPos, roadblocks, onRerouted, onStatusChange]);

  // ── Report a roadblock at a location ─────────────────────────────────────
  const reportRoadblock = useCallback(async (locationText) => {
    try {
      const coords = await geocodePlace(locationText);
      const block  = {
        id:        Date.now(),
        location:  locationText,
        coords,
        timestamp: new Date().toLocaleTimeString(),
        active:    true,
      };
      setRoadblocks(prev => [block, ...prev].slice(0, 3));
      setRerouteStatus("blocked");
      onStatusChange?.("blocked");

      // Auto recalculate around the block
      await recalculate("roadblock");
      return block;
    } catch (_) {
      return null;
    }
  }, [recalculate, onStatusChange]);

  const removeRoadblock = useCallback((id) => {
    setRoadblocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const dismissReroute = useCallback(() => {
    setRerouteStatus("idle");
    offRouteCountRef.current = 0;
  }, []);

  return {
    rerouteStatus,
    rerouteHistory,
    roadblocks,
    currentPos,
    distFromRoute,
    startMonitoring,
    stopMonitoring,
    recalculate,
    simulateOffRoute,
    reportRoadblock,
    removeRoadblock,
    dismissReroute,
  };
}