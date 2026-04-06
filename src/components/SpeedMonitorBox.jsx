"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CloseRounded,
  MinimizeRounded,
  OpenInFullRounded,
  RefreshRounded,
  SpeedRounded,
  VolumeOffRounded,
  VolumeUpRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import { getColors, fonts } from "../app/utils/theme";

const DEFAULT_LOOKUP_INTERVAL_MS = 12000;
const FAST_LOOKUP_INTERVAL_MS = 6500;
const RAPID_LOOKUP_INTERVAL_MS = 3500;
const DEFAULT_LOOKUP_MOVE_THRESHOLD_M = 80;
const FAST_LOOKUP_MOVE_THRESHOLD_M = 45;
const BASE_OVERSPEED_TOLERANCE_KMH = 8;
const LOW_SPEED_ZONE_TOLERANCE_KMH = 5;
const HIGHWAY_TOLERANCE_KMH = 12;
const BEEP_COOLDOWN_MS = 9000;

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

function isValidCoords(coords) {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    Number.isFinite(coords[0]) &&
    Number.isFinite(coords[1])
  );
}

function toSpeedLabel(speedKmh) {
  if (!Number.isFinite(speedKmh)) {
    return "--";
  }
  return `${Math.round(Math.max(speedKmh, 0))} km/h`;
}

function sourceLabel(source) {
  if (source === "gps") {
    return "GPS";
  }
  if (source === "derived") {
    return "GPS-derived";
  }
  if (source === "simulation") {
    return "Simulation";
  }
  return "Unavailable";
}

export default function SpeedMonitorBox({
  autoStart = true,
  isDark = true,
  currentSpeedKmh = null,
  speedSource = "unknown",
  currentCoords = null,
  locationPermission = "prompt",
  locationError = "",
}) {
  const T = useMemo(() => getColors(isDark), [isDark]);

  const [visible, setVisible] = useState(Boolean(autoStart));
  const [collapsed, setCollapsed] = useState(false);
  const [softAlertEnabled, setSoftAlertEnabled] = useState(true);
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitError, setLimitError] = useState("");
  const [limitData, setLimitData] = useState(null);

  const inFlightRef = useRef(false);
  const lastLookupRef = useRef({ coords: null, at: 0 });
  const lastBeepAtRef = useRef(0);
  const audioContextRef = useRef(null);
  const lookupIntervalRef = useRef(DEFAULT_LOOKUP_INTERVAL_MS);
  const lookupMoveThresholdRef = useRef(DEFAULT_LOOKUP_MOVE_THRESHOLD_M);

  const normalizedSpeedKmh = Number.isFinite(currentSpeedKmh)
    ? Math.max(0, currentSpeedKmh)
    : null;
  const maxSpeedKmh = Number.isFinite(limitData?.maxSpeedKmh)
    ? Math.max(0, limitData.maxSpeedKmh)
    : null;

  const overspeedByKmh =
    normalizedSpeedKmh != null && maxSpeedKmh != null
      ? normalizedSpeedKmh - maxSpeedKmh
      : null;

  const overspeedToleranceKmh = useMemo(() => {
    if (!Number.isFinite(maxSpeedKmh)) {
      return BASE_OVERSPEED_TOLERANCE_KMH;
    }
    if (maxSpeedKmh <= 40) {
      return LOW_SPEED_ZONE_TOLERANCE_KMH;
    }
    if (maxSpeedKmh >= 90) {
      return HIGHWAY_TOLERANCE_KMH;
    }
    return BASE_OVERSPEED_TOLERANCE_KMH;
  }, [maxSpeedKmh]);

  const isOverspeed =
    overspeedByKmh != null && overspeedByKmh > overspeedToleranceKmh;

  const lookupIntervalMs = useMemo(() => {
    if (isOverspeed) {
      return RAPID_LOOKUP_INTERVAL_MS;
    }
    if (!Number.isFinite(normalizedSpeedKmh)) {
      return DEFAULT_LOOKUP_INTERVAL_MS;
    }
    if (normalizedSpeedKmh >= 70) {
      return FAST_LOOKUP_INTERVAL_MS;
    }
    return DEFAULT_LOOKUP_INTERVAL_MS;
  }, [isOverspeed, normalizedSpeedKmh]);

  const lookupMoveThresholdM = useMemo(() => {
    if (!Number.isFinite(normalizedSpeedKmh)) {
      return DEFAULT_LOOKUP_MOVE_THRESHOLD_M;
    }
    if (normalizedSpeedKmh >= 80) {
      return FAST_LOOKUP_MOVE_THRESHOLD_M;
    }
    return DEFAULT_LOOKUP_MOVE_THRESHOLD_M;
  }, [normalizedSpeedKmh]);

  useEffect(() => {
    lookupIntervalRef.current = lookupIntervalMs;
    lookupMoveThresholdRef.current = lookupMoveThresholdM;
  }, [lookupIntervalMs, lookupMoveThresholdM]);

  const hasCoords = isValidCoords(currentCoords);

  const playSoftBeep = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(790, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.27);
    } catch {
      // Ignore audio failures silently.
    }
  }, []);

  const fetchSpeedLimit = useCallback(
    async (coords, force = false) => {
      if (!isValidCoords(coords) || inFlightRef.current) {
        return;
      }

      const [lat, lng] = coords;
      const now = Date.now();
      const previous = lastLookupRef.current;

      if (!force && isValidCoords(previous.coords)) {
        const movedMeters = haversineMeters(previous.coords, coords);
        const stale = now - previous.at >= lookupIntervalRef.current;
        if (movedMeters < lookupMoveThresholdRef.current && !stale) {
          return;
        }
      }

      inFlightRef.current = true;
      lastLookupRef.current = { coords: [lat, lng], at: now };
      setLimitLoading(true);

      try {
        const response = await fetch(
          `/api/speed/limit?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
            lng
          )}`,
          { cache: "no-store" }
        );
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Speed limit lookup failed");
        }

        setLimitData({
          maxSpeedKmh: Number.isFinite(payload.maxSpeedKmh)
            ? payload.maxSpeedKmh
            : null,
          roadName: payload.roadName || "",
          source: payload.source || "tomtom",
          cacheHit: Boolean(payload.cacheHit),
          updatedAt: payload.updatedAt || new Date().toISOString(),
          unknownReason: payload.unknownReason || "",
        });
        setLimitError("");
      } catch (error) {
        setLimitError(error.message || "Unable to fetch speed-limit data");
      } finally {
        setLimitLoading(false);
        inFlightRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    if (autoStart) {
      setVisible(true);
    }
  }, [autoStart]);

  useEffect(() => {
    if (!visible || !hasCoords) {
      return;
    }
    void fetchSpeedLimit(currentCoords);
  }, [visible, hasCoords, currentCoords, fetchSpeedLimit]);

  useEffect(() => {
    if (!visible || !hasCoords) {
      return;
    }

    const id = setInterval(() => {
      void fetchSpeedLimit(currentCoords);
    }, lookupIntervalMs);

    return () => clearInterval(id);
  }, [visible, hasCoords, currentCoords, fetchSpeedLimit, lookupIntervalMs]);

  useEffect(() => {
    if (!visible || !isOverspeed || !softAlertEnabled) {
      return;
    }

    const now = Date.now();
    if (now - lastBeepAtRef.current < BEEP_COOLDOWN_MS) {
      return;
    }

    lastBeepAtRef.current = now;
    void playSoftBeep();
  }, [visible, isOverspeed, softAlertEnabled, playSoftBeep]);

  const speedText = toSpeedLabel(normalizedSpeedKmh);
  const limitText = toSpeedLabel(maxSpeedKmh);
  const roadName = limitData?.roadName || "Current road";
  const speedSourceText = sourceLabel(speedSource);
  const positionSx = {
    right: 16,
    top: { xs: "auto", md: 116 },
    bottom: { xs: 210, md: "auto" },
  };

  if (!visible) {
    return (
      <IconButton
        onClick={() => setVisible(true)}
        aria-label="Open speed monitor"
        sx={{
          position: "absolute",
          ...positionSx,
          zIndex: 1190,
          width: 46,
          height: 46,
          borderRadius: "12px",
          bgcolor: T.navyLight,
          border: `1px solid ${T.navyBorder}`,
          color: isOverspeed ? T.rose : T.cyan,
          boxShadow: isDark
            ? "0 8px 24px rgba(2,6,23,0.45)"
            : "0 8px 24px rgba(15,23,42,0.15)",
          "&:hover": {
            bgcolor: isDark ? "#121c33" : "#f0f9ff",
            borderColor: isOverspeed ? T.rose : T.cyan,
            transform: "translateY(-1px)",
          },
        }}
      >
        <SpeedRounded sx={{ fontSize: 22 }} />
      </IconButton>
    );
  }

  return (
    <Box
      sx={{
        position: "absolute",
        ...positionSx,
        zIndex: 1190,
        width: { xs: "min(92vw, 330px)", md: 330 },
        borderRadius: "14px",
        bgcolor: T.navyLight,
        border: `1px solid ${isOverspeed ? `${T.rose}66` : T.navyBorder}`,
        boxShadow: isDark
          ? "0 18px 44px rgba(2,6,23,0.55)"
          : "0 18px 44px rgba(15,23,42,0.18)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: collapsed ? "none" : `1px solid ${T.navyBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isOverspeed
            ? "linear-gradient(135deg, rgba(244,63,94,0.16), rgba(249,115,22,0.12))"
            : isDark
            ? "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(59,130,246,0.08))"
            : "linear-gradient(135deg, rgba(8,145,178,0.14), rgba(37,99,235,0.1))",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <SpeedRounded sx={{ fontSize: 16, color: isOverspeed ? T.rose : T.cyan }} />
          <Typography
            sx={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: "0.8rem",
              color: T.textPrimary,
            }}
          >
            Speed Monitor
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.25} alignItems="center">
          <Tooltip title={softAlertEnabled ? "Mute alert beep" : "Enable alert beep"}>
            <IconButton
              size="small"
              onClick={() => setSoftAlertEnabled((prev) => !prev)}
              sx={{ color: T.textMuted }}
            >
              {softAlertEnabled ? (
                <VolumeUpRounded sx={{ fontSize: 15 }} />
              ) : (
                <VolumeOffRounded sx={{ fontSize: 15 }} />
              )}
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={() => setCollapsed((prev) => !prev)}
            sx={{ color: T.textMuted }}
          >
            {collapsed ? (
              <OpenInFullRounded sx={{ fontSize: 15 }} />
            ) : (
              <MinimizeRounded sx={{ fontSize: 15 }} />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setVisible(false)}
            sx={{ color: T.textMuted }}
          >
            <CloseRounded sx={{ fontSize: 15 }} />
          </IconButton>
        </Stack>
      </Box>

      {collapsed ? (
        <Box sx={{ px: 1.5, py: 1.1, display: "flex", alignItems: "center", gap: 0.8 }}>
          <Chip
            size="small"
            label={`Speed ${speedText}`}
            color={isOverspeed ? "error" : "default"}
            sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700 }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`Limit ${limitText}`}
            sx={{
              height: 22,
              fontSize: "0.68rem",
              borderColor: T.navyBorder,
              color: T.textSub,
            }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`${Math.round(lookupIntervalMs / 1000)}s`}
            sx={{
              height: 22,
              fontSize: "0.68rem",
              borderColor: T.navyBorder,
              color: T.textSub,
            }}
          />
        </Box>
      ) : (
        <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.1 }}>
          <Stack direction="row" spacing={1}>
            <Box
              sx={{
                flex: 1,
                borderRadius: "10px",
                p: 1.1,
                border: `1px solid ${T.navyBorder}`,
                background: isDark ? "#090f1f" : "#f8fafc",
              }}
            >
              <Typography sx={{ fontSize: "0.64rem", color: T.textMuted, fontFamily: fonts.body }}>
                Current speed
              </Typography>
              <Typography
                sx={{
                  mt: 0.1,
                  fontSize: "1.05rem",
                  color: isOverspeed ? T.rose : T.textPrimary,
                  fontWeight: 700,
                  fontFamily: fonts.display,
                }}
              >
                {speedText}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                borderRadius: "10px",
                p: 1.1,
                border: `1px solid ${T.navyBorder}`,
                background: isDark ? "#090f1f" : "#f8fafc",
              }}
            >
              <Typography sx={{ fontSize: "0.64rem", color: T.textMuted, fontFamily: fonts.body }}>
                Road max
              </Typography>
              <Typography
                sx={{
                  mt: 0.1,
                  fontSize: "1.05rem",
                  color: T.textPrimary,
                  fontWeight: 700,
                  fontFamily: fonts.display,
                }}
              >
                {limitLoading && maxSpeedKmh == null ? "..." : limitText}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.8} flexWrap="wrap">
            <Chip
              size="small"
              variant="outlined"
              label={`Source: ${speedSourceText}`}
              sx={{ borderColor: T.navyBorder, color: T.textSub, fontSize: "0.66rem", height: 22 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={hasCoords ? "Location: live" : "Location: unavailable"}
              color={hasCoords ? "success" : "default"}
              sx={{ fontSize: "0.66rem", height: 22 }}
            />
            {limitData?.cacheHit ? (
              <Chip
                size="small"
                variant="outlined"
                label="Limit: cached"
                sx={{ borderColor: T.navyBorder, color: T.textSub, fontSize: "0.66rem", height: 22 }}
              />
            ) : null}
            <Chip
              size="small"
              variant="outlined"
              label={`Refresh: ${Math.round(lookupIntervalMs / 1000)}s`}
              sx={{ borderColor: T.navyBorder, color: T.textSub, fontSize: "0.66rem", height: 22 }}
            />
          </Stack>

          <Typography sx={{ fontSize: "0.7rem", color: T.textSub, fontFamily: fonts.body }}>
            {roadName}
          </Typography>

          {locationPermission === "denied" ? (
            <Alert
              severity="warning"
              sx={{
                py: 0.2,
                "& .MuiAlert-message": {
                  fontFamily: fonts.body,
                  fontSize: "0.72rem",
                },
              }}
            >
              GPS permission denied. Using simulated route speed.
            </Alert>
          ) : null}

          {locationPermission === "unsupported" ? (
            <Alert
              severity="warning"
              sx={{
                py: 0.2,
                "& .MuiAlert-message": {
                  fontFamily: fonts.body,
                  fontSize: "0.72rem",
                },
              }}
            >
              Browser geolocation unsupported. Simulation fallback active.
            </Alert>
          ) : null}

          {locationError && locationPermission !== "denied" ? (
            <Alert
              severity="error"
              sx={{
                py: 0.2,
                "& .MuiAlert-message": {
                  fontFamily: fonts.body,
                  fontSize: "0.72rem",
                },
              }}
            >
              {locationError}
            </Alert>
          ) : null}

          {limitError ? (
            <Alert
              severity="error"
              sx={{
                py: 0.2,
                "& .MuiAlert-message": {
                  fontFamily: fonts.body,
                  fontSize: "0.72rem",
                },
              }}
            >
              {limitError}
            </Alert>
          ) : null}

          {limitData?.unknownReason ? (
            <Alert
              severity="info"
              sx={{
                py: 0.2,
                "& .MuiAlert-message": {
                  fontFamily: fonts.body,
                  fontSize: "0.72rem",
                },
              }}
            >
              {limitData.unknownReason}
            </Alert>
          ) : null}

          {isOverspeed ? (
            <Alert
              severity="warning"
              icon={<WarningAmberRounded />}
              sx={{
                py: 0.2,
                border: `1px solid ${T.rose}55`,
                "& .MuiAlert-message": {
                  fontFamily: fonts.body,
                  fontSize: "0.72rem",
                },
              }}
            >
              Overspeed by {Math.round(overspeedByKmh)} km/h (buffer +{Math.round(overspeedToleranceKmh)}). Please slow down.
            </Alert>
          ) : null}

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                if (hasCoords) {
                  void fetchSpeedLimit(currentCoords, true);
                }
              }}
              startIcon={
                limitLoading ? <CircularProgress size={14} /> : <RefreshRounded sx={{ fontSize: 15 }} />
              }
              disabled={limitLoading || !hasCoords}
              sx={{
                textTransform: "none",
                borderColor: T.navyBorder,
                color: T.textSub,
                fontFamily: fonts.body,
                fontWeight: 600,
                "&:hover": {
                  borderColor: T.cyan,
                  color: T.cyan,
                  background: isDark
                    ? "rgba(34,211,238,0.08)"
                    : "rgba(8,145,178,0.08)",
                },
              }}
            >
              Refresh limit now
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
