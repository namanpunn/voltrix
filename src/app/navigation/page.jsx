// ─── app/navigation/page.jsx ──────────────────────────────────────────────────
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { TrafficRounded } from "@mui/icons-material";
import Sidebar      from "../../components/Sidebar";
import MapView      from "../../components/MapView";
import CameraView   from "../../components/CameraView";
import RerouteAlert from "../../components/RerouteAlert";
import { useRoute }     from "../hooks/useRoute";
import { useRerouting } from "../hooks/useRerouting";

export default function NavigationPage() {
  const [source,      setSource]      = useState("");
  const [destination, setDestination] = useState("");
  const [showCamera,  setShowCamera]  = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const mapRef = useRef(null);
  const lastRouteRef = useRef(null); // cache last route data for traffic toggle

  // ── Route state ──────────────────────────────────────────────────────────
  const {
    loading, error, setError,
    primaryRoute, alternateRoute, showSplit,
    calculatePrimary, calculateAlternate,
    clearAlternate, clearAll,
    setPrimaryRoute,
  } = useRoute();

  // ── Rerouting state ──────────────────────────────────────────────────────
  const {
    rerouteStatus, rerouteHistory, roadblocks,
    currentPos, distFromRoute,
    startMonitoring, stopMonitoring,
    recalculate, simulateOffRoute,
    reportRoadblock, removeRoadblock,
    dismissReroute,
  } = useRerouting({
    primaryRoute,
    onRerouted: ({ route, fromCoords }) => {
      // Draw the new rerouted line on the primary map in a different color
      if (!primaryRoute) return;
      mapRef.current?.drawPrimary({
        coordinates: route.coordinates,
        fromCoords,
        toCoords: primaryRoute.toCoords,
      });
      // Update primaryRoute state with new route data
      setPrimaryRoute(prev => prev ? {
        ...prev,
        coordinates: route.coordinates,
        distance:    route.distance,
        duration:    route.duration,
        fromCoords,
      } : prev);
    },
    onStatusChange: (status) => {
      // Could add analytics here later
    },
  });

  // Start monitoring when primary route is ready
  useEffect(() => {
    if (primaryRoute) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    return () => stopMonitoring();
  }, [primaryRoute?.fromText]); // only re-run when a new route is set

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleGetRoute = useCallback(async () => {
    if (!source.trim() || !destination.trim()) {
      setError("Please enter both source and destination.");
      return;
    }
    mapRef.current?.clearAll();
    const result = await calculatePrimary(source, destination);
    if (!result) return;
    const { from, to, route } = result;
    const labels = { from: source, to: destination };
    lastRouteRef.current = { from, to, route, labels };
    if (showTraffic && route.trafficSegments?.length) {
      mapRef.current?.drawPrimaryTraffic({ trafficSegments: route.trafficSegments, fromCoords: from, toCoords: to, labels });
    } else {
      mapRef.current?.drawPrimary({ coordinates: route.coordinates, fromCoords: from, toCoords: to, labels });
    }
  }, [source, destination, calculatePrimary, setError, showTraffic]);

  const handleCompareAlternate = useCallback(async (viaText) => {
    const result = await calculateAlternate(viaText);
    if (!result || !primaryRoute) return;
    // drawAlternate buffers the draw if the alternate map hasn't mounted yet
    mapRef.current?.drawAlternate({
      coordinates: result.coordinates,
      fromCoords: primaryRoute.fromCoords,
      toCoords: primaryRoute.toCoords,
      labels: { from: source, to: destination },
    });
  }, [calculateAlternate, primaryRoute]);

  const handleClearAlternate = useCallback(() => {
    clearAlternate();
    mapRef.current?.clearAlternate();
  }, [clearAlternate]);

  // ── Choose route from split view ─────────────────────────────────────────
  const handleChoosePrimary = useCallback(() => {
    // Keep primary as is, close split
    clearAlternate();
    mapRef.current?.clearAlternate();
  }, [clearAlternate]);

  const handleChooseAlternate = useCallback(() => {
    if (!alternateRoute || !primaryRoute) return;
    // Replace primary with alternate route data
    const newCoords = alternateRoute.coordinates;
    const from = primaryRoute.fromCoords;
    const to = primaryRoute.toCoords;
    const labels = { from: source, to: destination };
    // Update state
    setPrimaryRoute(prev => prev ? {
      ...prev,
      coordinates: newCoords,
      distance: alternateRoute.distance,
      duration: alternateRoute.duration,
      rawDistance: alternateRoute.rawDistance,
      rawDuration: alternateRoute.rawDuration,
      trafficSegments: alternateRoute.trafficSegments,
    } : prev);
    lastRouteRef.current = {
      from, to, labels,
      route: { coordinates: newCoords, distance: alternateRoute.distance, duration: alternateRoute.duration, trafficSegments: alternateRoute.trafficSegments },
    };
    // Close split and redraw primary
    clearAlternate();
    mapRef.current?.clearAlternate();
    if (showTraffic && alternateRoute.trafficSegments?.length) {
      mapRef.current?.drawPrimaryTraffic({ trafficSegments: alternateRoute.trafficSegments, fromCoords: from, toCoords: to, labels });
    } else {
      mapRef.current?.drawPrimary({ coordinates: newCoords, fromCoords: from, toCoords: to, labels });
    }
  }, [alternateRoute, primaryRoute, source, destination, clearAlternate, setPrimaryRoute, showTraffic]);

  const handleClear = useCallback(() => {
    clearAll();
    stopMonitoring();
    mapRef.current?.clearAll();
    setSource("");
    setDestination("");
  }, [clearAll, stopMonitoring]);

  const handleSwap = useCallback(() => {
    const newSrc = destination;
    const newDst = source;
    setSource(newSrc);
    setDestination(newDst);
    // Auto-recalculate if a route already exists
    if (primaryRoute && newSrc.trim() && newDst.trim()) {
      mapRef.current?.clearAll();
      calculatePrimary(newSrc, newDst).then((result) => {
        if (!result) return;
        lastRouteRef.current = { from: result.from, to: result.to, route: result.route, labels: { from: newSrc, to: newDst } };
        mapRef.current?.drawPrimary({ coordinates: result.route.coordinates, fromCoords: result.from, toCoords: result.to, labels: { from: newSrc, to: newDst } });
      });
    }
  }, [source, destination, primaryRoute, calculatePrimary]);

  const handleRecalculate = useCallback((reason = "manual") => {
    recalculate(reason);
  }, [recalculate]);

  // ── Traffic toggle — re-draw current route with/without traffic colors ──
  const handleToggleTraffic = useCallback(() => {
    setShowTraffic(prev => {
      const next = !prev;
      const d = lastRouteRef.current;
      if (d) {
        const labels = d.labels || {};
        if (next && d.route.trafficSegments?.length) {
          mapRef.current?.drawPrimaryTraffic({ trafficSegments: d.route.trafficSegments, fromCoords: d.from, toCoords: d.to, labels });
        } else {
          mapRef.current?.drawPrimary({ coordinates: d.route.coordinates, fromCoords: d.from, toCoords: d.to, labels });
        }
      }
      return next;
    });
  }, []);

  return (
    <Box sx={{
      display: "flex", height: "100vh",
      overflow: "hidden", bgcolor: "#0a0f1e",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Sidebar
        source={source}           setSource={setSource}
        destination={destination} setDestination={setDestination}
        onGetRoute={handleGetRoute}
        onSwap={handleSwap}
        onClear={handleClear}
        onCompareAlternate={handleCompareAlternate}
        onClearAlternate={handleClearAlternate}
        onStartAR={() => setShowCamera(true)}
        // Step 4 props
        rerouteStatus={rerouteStatus}
        rerouteHistory={rerouteHistory}
        roadblocks={roadblocks}
        distFromRoute={distFromRoute}
        onReportRoadblock={reportRoadblock}
        onRemoveRoadblock={removeRoadblock}
        onSimulateOffRoute={simulateOffRoute}
        onRecalculate={handleRecalculate}
        // base
        loading={loading}
        error={error}
        primaryRoute={primaryRoute}
        alternateRoute={alternateRoute}
        showSplit={showSplit}
      />

      {/* Map with RerouteAlert overlay */}
      <Box sx={{ flex: 1, position: "relative" }}>
        <MapView ref={mapRef} showSplit={showSplit} loading={loading} showTraffic={showTraffic} onChoosePrimary={handleChoosePrimary} onChooseAlternate={handleChooseAlternate} />

        {/* Traffic toggle button — always visible */}
        <Tooltip title={showTraffic ? "Hide real-time traffic" : "Show real-time traffic"} placement="left">
          <IconButton
            onClick={handleToggleTraffic}
            sx={{
              position: "absolute", top: 16, right: 16, zIndex: 1000,
              width: 42, height: 42,
              bgcolor: showTraffic ? "rgba(34,197,94,0.22)" : "rgba(10,15,30,0.92)",
              border: showTraffic ? "1.5px solid rgba(34,197,94,0.5)" : "1.5px solid #1e2d45",
              backdropFilter: "blur(12px)",
              borderRadius: "12px",
              color: showTraffic ? "#22c55e" : "#94a3b8",
              boxShadow: showTraffic
                ? "0 0 16px rgba(34,197,94,0.25), 0 4px 12px rgba(0,0,0,0.3)"
                : "0 4px 20px rgba(0,0,0,0.4)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: showTraffic ? "rgba(34,197,94,0.3)" : "rgba(34,211,238,0.15)",
                color: showTraffic ? "#22c55e" : "#22d3ee",
                borderColor: showTraffic ? "rgba(34,197,94,0.6)" : "rgba(34,211,238,0.4)",
                transform: "scale(1.05)",
              },
            }}
          >
            <TrafficRounded sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* Step 4 — floating reroute alert on the map */}
        <RerouteAlert
          status={rerouteStatus}
          distFromRoute={distFromRoute}
          lastReroute={rerouteHistory[0]}
          onRecalculate={() => recalculate("off_route")}
          onDismiss={dismissReroute}
        />
      </Box>

      {showCamera && (
        <CameraView
          routeCoords={primaryRoute?.coordinates}
          routeInfo={primaryRoute}
          onClose={() => setShowCamera(false)}
        />
      )}
    </Box>
  );
}