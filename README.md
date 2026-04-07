# Voltrix (SmartRoute)

Voltrix is a vision-assisted navigation web app built with Next.js.
It combines route planning, alternate route comparison, speed awareness, and driver alert monitoring in a single UI.

This README reflects the current implementation in the repository (April 2026).

## What Is Currently Working

1. Source/destination routing using Nominatim geocoding + OSRM driving routes.
2. Place autocomplete with recent search history (stored in localStorage).
3. Alternate "via" route comparison with split-map decision flow and verdict banner.
4. Dark/light theme toggle with persistence.
5. Mobile bottom-sheet workflow (peek/mid/full snap points).
6. Speed monitor overlay:
   - Current speed from geolocation (or derived/simulated fallback)
   - Road max-speed lookup via TomTom
   - Soft overspeed audio alert
7. Drowsiness monitor overlay (client-side MediaPipe face landmarks, camera-based).
8. Map traffic display:
   - Route segment speed coloring from OSRM step speeds
   - Optional TomTom traffic flow tile overlay

## Feature Status Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Core route planning | Active | Nominatim + OSRM |
| Alternate route compare | Active | Verdict and route replacement flow is active |
| Speed monitor | Active | Uses `/api/speed/limit` |
| Drowsiness monitor | Active | In-browser MediaPipe mode |
| Reroute alert banner | Wired with limited live triggers | State handling exists, but off-route/manual trigger controls are not fully exposed in the current UI |
| Roadblock panel UI | Present in code, not mounted | `TrafficPanel.jsx` exists but is not used in current navigation page |
| AR camera overlay | Present in code, not reachable | `CameraView.jsx` exists, but trigger is not currently exposed in sidebar/mobile UI |
| Python drowsiness backend routes | Legacy/optional | API routes exist, but default monitor does not depend on them |

## Tech Stack

- Next.js 16
- React 19
- MUI 7 + Emotion
- Leaflet + Carto tiles
- OpenStreetMap Nominatim (geocoding/autocomplete)
- OSRM (routing)
- TomTom (speed limit + traffic flow tiles)
- MediaPipe Tasks Vision (client-side face landmark detection)

## Project Structure

```text
src/
  app/
    api/
      drowsiness/
        start/route.js
        status/route.js
        stop/route.js
      speed/
        limit/route.js
    context/
      LocationContext.jsx
      ThemeContext.jsx
    hooks/
      useRoute.js
      useRerouting.js
    navigation/
      page.jsx
  components/
    MapView.jsx
    Sidebar.jsx
    MobileBottomSheet.jsx
    PlaceAutocomplete.jsx
    RouteInfoCard.jsx
    AlternateRouteInput.jsx
    VerdictBanner.jsx
    SpeedMonitorBox.jsx
    DrowsinessMonitorBox.jsx
    RerouteAlert.jsx
    CameraView.jsx
    TrafficPanel.jsx
```

## Quick Start

### Prerequisites

1. Node.js 18+
2. npm (recommended)

Note: Both `package-lock.json` and `yarn.lock` exist in this repo. Use one package manager consistently. Current setup is easiest with npm.

### Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Create `.env.local` in project root.

### Required for full experience

```dotenv
NEXT_PUBLIC_TOMTOM_API_KEY=your_tomtom_key
```

Why this key matters:
1. Client map traffic flow tile overlay uses `NEXT_PUBLIC_TOMTOM_API_KEY`.
2. Speed-limit API route can use this key (or fallback to `TOMTOM_API_KEY`).

### Optional speed service tuning

```dotenv
TOMTOM_API_KEY=your_server_side_key
SPEED_LIMIT_CACHE_TTL_MS=120000
SPEED_LIMIT_ERROR_CACHE_TTL_MS=15000
SPEED_LIMIT_REQUEST_TIMEOUT_MS=3500
SPEED_LIMIT_CACHE_COORD_DECIMALS=4
```

### Optional legacy drowsiness backend tuning

```dotenv
DROWSINESS_PYTHON_PATH=
DROWSINESS_HOST=127.0.0.1
DROWSINESS_PORT=5001
DROWSINESS_EAR_THRESHOLD=0.25
DROWSINESS_CONSEC_FRAMES=10
DROWSINESS_CAMERA_INDEX=0
```

## API Endpoints

### Active in current UI flow

- `GET /api/speed/limit?lat=<lat>&lng=<lng>`
  - Returns road speed-limit information (TomTom-backed, cached).

### Legacy/optional local backend endpoints

- `POST /api/drowsiness/start`
- `GET /api/drowsiness/status`
- `POST /api/drowsiness/stop`

These endpoints manage a local Python process (`service.py`).
Current default drowsiness widget in UI runs client-side MediaPipe and does not require these endpoints.

## Drowsiness Detection Modes

### Default mode (used now)

- Component: `DrowsinessMonitorBox.jsx`
- Runs in browser with MediaPipe face landmarks
- Uses webcam permission
- No Python required

### Legacy local mode (optional)

- Python Flask service from `service.py`
- Requires model file:
  - `models/shape_predictor_68_face_landmarks.dat`
- Install deps:

```bash
python -m pip install -r requirements-drowsiness.txt
```

Use this only if you want to test the legacy backend route handlers.

## Navigation Query Params

Navigation page supports monitor auto-start controls:

- `/navigation?drowsiness=0` -> do not auto-open drowsiness monitor
- `/navigation?speed=0` -> do not auto-open speed monitor

Default behavior (without params) auto-enables both monitors.

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```

## Current Constraints and Notes

1. Camera permission is required for drowsiness monitoring.
2. Geolocation permission improves speed monitor quality and location accuracy.
3. Autocomplete/routing is currently India-biased (Delhi NCR-focused viewbox in geocoding helper).
4. Route segment traffic colors are derived from OSRM step speed estimates, not live detector hardware.
5. If TomTom key is missing, speed monitor still renders but road max-speed may be unavailable.
6. `TrafficPanel.jsx` and `CameraView.jsx` are present but not fully wired into the active user flow.
7. Off-route/manual reroute controls are not exposed in the default navigation UI, so reroute alerts are not part of the main demo path.

## Troubleshooting

### Speed limit not showing

1. Verify `NEXT_PUBLIC_TOMTOM_API_KEY` in `.env.local`.
2. Restart dev server after changing env vars.
3. Check browser geolocation permission.

### Drowsiness monitor not starting

1. Allow camera permission.
2. Ensure browser supports `getUserMedia`.
3. If blocked, close other apps using webcam.

### Map traffic tile not appearing

1. Confirm TomTom key is valid.
2. Ensure network can reach TomTom tile APIs.

## Repository Notes

- No `LICENSE` file is currently present in this repository.
- If you want open-source licensing, add a license file and update this README accordingly.
