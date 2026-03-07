// ─── app/navigation/page.jsx ──────────────────────────────────────────────────
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
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
  const mapRef = useRef(null);

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
    mapRef.current?.drawPrimary({ coordinates: route.coordinates, fromCoords: from, toCoords: to });
  }, [source, destination, calculatePrimary, setError]);

  const handleCompareAlternate = useCallback(async (viaText) => {
    const result = await calculateAlternate(viaText);
    if (!result || !primaryRoute) return;
    // drawAlternate buffers the draw if the alternate map hasn't mounted yet
    mapRef.current?.drawAlternate({
      coordinates: result.coordinates,
      fromCoords: primaryRoute.fromCoords,
      toCoords: primaryRoute.toCoords,
    });
  }, [calculateAlternate, primaryRoute]);

  const handleClearAlternate = useCallback(() => {
    clearAlternate();
    mapRef.current?.clearAlternate();
  }, [clearAlternate]);

  const handleClear = useCallback(() => {
    clearAll();
    stopMonitoring();
    mapRef.current?.clearAll();
    setSource("");
    setDestination("");
  }, [clearAll, stopMonitoring]);

  const handleSwap = useCallback(() => {
    setSource(destination);
    setDestination(source);
  }, [source, destination]);

  const handleRecalculate = useCallback((reason = "manual") => {
    recalculate(reason);
  }, [recalculate]);

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
        <MapView ref={mapRef} showSplit={showSplit} loading={loading} />

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