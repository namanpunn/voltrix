"use client";

import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";

const LocationContext = createContext({
  userCoords: null,
  locationPermission: "prompt",
  locationError: "",
  locationUpdatedAt: null,
  speedKmh: null,
  speedSource: "unknown",
  speedAccuracyM: null,
  headingDeg: null,
});

function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function parseRawSpeedKmh(speedMps) {
  if (!Number.isFinite(speedMps) || speedMps < 0) {
    return null;
  }
  const kmh = speedMps * 3.6;
  if (!Number.isFinite(kmh) || kmh > 220) {
    return null;
  }
  return kmh;
}

function deriveSpeedKmh(previousSample, nextCoords, nextAt) {
  if (!previousSample) {
    return null;
  }

  const dtSec = (nextAt - previousSample.at) / 1000;
  if (!Number.isFinite(dtSec) || dtSec < 0.5 || dtSec > 20) {
    return null;
  }

  const distM = haversineMeters(previousSample.coords, nextCoords);
  if (distM < 1.8) {
    return 0;
  }

  const kmh = (distM / dtSec) * 3.6;
  if (!Number.isFinite(kmh) || kmh < 0 || kmh > 220) {
    return null;
  }
  return kmh;
}

function formatPositionError(error) {
  if (!error) {
    return "";
  }
  if (error.code === 1) {
    return "Location permission denied.";
  }
  if (error.code === 2) {
    return "Unable to detect current position.";
  }
  if (error.code === 3) {
    return "Location request timed out.";
  }
  return error.message || "Location update failed.";
}

export function LocationProvider({ children }) {
  const [userCoords, setUserCoords] = useState(null); // [lat, lng]
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [locationError, setLocationError] = useState("");
  const [locationUpdatedAt, setLocationUpdatedAt] = useState(null);
  const [speedKmh, setSpeedKmh] = useState(null);
  const [speedSource, setSpeedSource] = useState("unknown");
  const [speedAccuracyM, setSpeedAccuracyM] = useState(null);
  const [headingDeg, setHeadingDeg] = useState(null);

  const watchIdRef = useRef(null);
  const prevSampleRef = useRef(null);
  const isGeolocationUnsupported =
    typeof navigator !== "undefined" && !navigator.geolocation;

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    let cancelled = false;
    let permissionStatus = null;

    const updateFromPosition = (position) => {
      if (cancelled) {
        return;
      }

      const nextCoords = [position.coords.latitude, position.coords.longitude];
      const nextAt = Number(position.timestamp) || Date.now();

      setUserCoords(nextCoords);
      setLocationUpdatedAt(nextAt);
      setLocationPermission("granted");
      setLocationError("");

      setSpeedAccuracyM(
        Number.isFinite(position.coords.accuracy)
          ? Math.round(position.coords.accuracy)
          : null
      );
      setHeadingDeg(
        Number.isFinite(position.coords.heading)
          ? Math.round(position.coords.heading)
          : null
      );

      const rawSpeed = parseRawSpeedKmh(position.coords.speed);
      const derivedSpeed = deriveSpeedKmh(prevSampleRef.current, nextCoords, nextAt);
      const nextSpeed = rawSpeed ?? derivedSpeed;

      if (Number.isFinite(nextSpeed)) {
        setSpeedKmh(Math.round(nextSpeed * 10) / 10);
        setSpeedSource(rawSpeed != null ? "gps" : "derived");
      } else {
        setSpeedKmh(null);
        setSpeedSource("unknown");
      }

      prevSampleRef.current = {
        coords: nextCoords,
        at: nextAt,
      };
    };

    const handlePositionError = (error) => {
      if (cancelled) {
        return;
      }
      if (error?.code === 1) {
        setLocationPermission("denied");
      }
      setLocationError(formatPositionError(error));
    };

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (cancelled) {
            return;
          }
          permissionStatus = status;
          setLocationPermission(status.state);
          status.onchange = () => {
            setLocationPermission(status.state);
          };
        })
        .catch(() => {
          // Older browsers may reject this query path.
        });
    }

    navigator.geolocation.getCurrentPosition(
      updateFromPosition,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 4000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      updateFromPosition,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 1500 }
    );

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    };
  }, []);

  const effectiveLocationPermission = isGeolocationUnsupported
    ? "unsupported"
    : locationPermission;
  const effectiveLocationError = isGeolocationUnsupported
    ? "Geolocation is not supported in this browser."
    : locationError;

  const value = useMemo(
    () => ({
      userCoords,
      locationPermission: effectiveLocationPermission,
      locationError: effectiveLocationError,
      locationUpdatedAt,
      speedKmh,
      speedSource,
      speedAccuracyM,
      headingDeg,
    }),
    [
      userCoords,
      effectiveLocationPermission,
      effectiveLocationError,
      locationUpdatedAt,
      speedKmh,
      speedSource,
      speedAccuracyM,
      headingDeg,
    ]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
