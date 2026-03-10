<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0f1e,50:22d3ee,100:6366f1&height=220&section=header&text=SmartRoute&fontSize=72&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Vision%20Navigation%20System&descSize=18&descAlignY=55&descColor=94a3b8" width="100%" />

<br/>

<!-- Badges Row -->
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![MUI](https://img.shields.io/badge/MUI-7.3-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License](https://img.shields.io/badge/License-MIT-22d3ee?style=for-the-badge)](LICENSE)

<br/>

<!-- Typing SVG -->
<a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=22&duration=3500&pause=800&color=22D3EE&center=true&vCenter=true&multiline=true&repeat=true&random=false&width=620&height=80&lines=AI-Powered+Route+Comparison+%F0%9F%9A%80;Real-Time+Rerouting+%26+Traffic+Intelligence+%F0%9F%9B%A3%EF%B8%8F;Open+Source+%7C+No+API+Keys+Required+%E2%9C%A8" alt="Typing SVG" /></a>

<br/><br/>

> **SmartRoute** is an intelligent navigation system built as a Final Year Project at **K.R. Mangalam University**.
> It delivers **real-time route planning**, **smart alternate route comparison**, **live rerouting**,
> and **traffic-aware navigation** — all powered by open-source APIs with **zero API keys**.

<br/>

---

</div>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->

## ⚡ Feature Highlights

<table>
<tr>
<td width="50%">

### 🧭 Smart Route Planning
Enter any source & destination — geocoded via **OpenStreetMap Nominatim** with autocomplete, recent places, and distance-based sorting. Routes calculated by **OSRM** in real-time.

</td>
<td width="50%">

### 🔀 Alternate Route Comparison
Ask _"What if I go via X?"_ — get a second route instantly, compare them side-by-side, and let the **Verdict Banner** tell you which one saves time.

</td>
</tr>
<tr>
<td width="50%">

### 🚦 Traffic-Aware Visualization
Every route segment colored by speed:
- 🟢 **> 60 km/h** — Free flow
- 🟡 **30–60 km/h** — Moderate
- 🟠 **15–30 km/h** — Slow
- 🔴 **< 15 km/h** — Congested

</td>
<td width="50%">

### 🔄 Live Rerouting Engine
Detects when you're **> 80m off-route**, auto-recalculates from your current position. Supports **roadblock reporting** — report a block, and the system finds an instant detour.

</td>
</tr>
<tr>
<td width="50%">

### 🌗 Dark & Light Theme
Full dual-theme system with localStorage persistence. Every component — map tiles, cards, borders, icons — adapts seamlessly.

</td>
<td width="50%">

### 📱 Mobile-First Design
Desktop gets a sleek **sidebar**. Mobile gets a **draggable bottom sheet** with 3 snap positions (peek / mid / full). Touch + mouse gesture support.

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     SmartRoute App                       │
├─────────────┬─────────────────────┬─────────────────────┤
│  Contexts   │       Hooks         │     Components      │
├─────────────┼─────────────────────┼─────────────────────┤
│ ThemeCtx    │ useRoute            │ Hero-Page           │
│ LocationCtx │  ├─ geocodePlace()  │ MapView (Leaflet)   │
│             │  ├─ fetchRoute()    │ Sidebar             │
│             │  └─ trafficSegments │ MobileBottomSheet   │
│             │                     │ PlaceAutocomplete   │
│             │ useRerouting        │ RouteInfoCard       │
│             │  ├─ offRouteDetect  │ VerdictBanner       │
│             │  ├─ roadblockMgmt   │ AlternateRouteInput │
│             │  └─ autoRecalculate │ RerouteAlert        │
│             │                     │ TrafficPanel        │
├─────────────┴─────────────────────┴─────────────────────┤
│                    External APIs                         │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Nominatim   │  │   OSRM    │  │  CartoDB Tiles   │  │
│  │  (Geocoding) │  │ (Routing) │  │  (Map Basemap)   │  │
│  └──────────────┘  └───────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
src/
├── app/
│   ├── layout.js                 # Root layout + providers
│   ├── page.js                   # Landing → HeroPage
│   ├── globals.css               # Global styles + animations
│   ├── navigation/
│   │   └── page.jsx              # Core app: Map + Sidebar
│   ├── context/
│   │   ├── ThemeContext.jsx       # 🌗 Dark/Light mode
│   │   └── LocationContext.jsx    # 📍 User geolocation
│   ├── hooks/
│   │   ├── useRoute.js           # 🧭 Geocoding + OSRM routing
│   │   └── useRerouting.js       # 🔄 Off-route detection + reroute
│   └── utils/
│       ├── theme.js              # 🎨 Color tokens + fonts
│       └── mapHelpers.js         # 🗺️ Map utilities
│
└── components/
    ├── Hero-Page.jsx             # ✨ Animated landing page
    ├── MapView.jsx               # 🗺️ Leaflet dual-map system
    ├── Sidebar.jsx               # 📋 Desktop route panel
    ├── MobileBottomSheet.jsx     # 📱 Draggable mobile sheet
    ├── PlaceAutocomplete.jsx     # 🔍 Search with autocomplete
    ├── RouteInfoCard.jsx         # 📊 Route metrics display
    ├── VerdictBanner.jsx         # ⚖️ Route comparison verdict
    ├── AlternateRouteInput.jsx   # 🔀 "What if via X?" input
    ├── RerouteAlert.jsx          # 🚨 Status toast animations
    ├── TrafficPanel.jsx          # 🚦 Roadblocks + history
    └── SplitScreen.jsx           # 🖥️ Split view (planned)
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|:---:|:---:|:---:|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js_16-000?style=flat-square&logo=next.js) | App Router, SSR, File-based routing |
| **UI Library** | ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) | Component architecture |
| **Components** | ![MUI](https://img.shields.io/badge/MUI_7-007FFF?style=flat-square&logo=mui&logoColor=white) | Material Design system |
| **Styling** | ![Emotion](https://img.shields.io/badge/Emotion-D36AC2?style=flat-square) | CSS-in-JS with theme tokens |
| **Maps** | ![Leaflet](https://img.shields.io/badge/Leaflet_1.9-199900?style=flat-square&logo=leaflet) | Interactive map rendering |
| **Geocoding** | ![OSM](https://img.shields.io/badge/Nominatim-7EBC6F?style=flat-square&logo=openstreetmap&logoColor=white) | Place search & autocomplete |
| **Routing** | ![OSRM](https://img.shields.io/badge/OSRM-2C3E50?style=flat-square) | Driving directions + traffic |
| **Tiles** | ![CartoDB](https://img.shields.io/badge/CartoDB-F05A28?style=flat-square) | Dark & light basemaps |
| **Fonts** | ![Google Fonts](https://img.shields.io/badge/Google_Fonts-4285F4?style=flat-square&logo=google&logoColor=white) | Space Grotesk + DM Sans |

</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** / **yarn** / **pnpm**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/smartroute.git
cd smartroute

# Install dependencies
npm install

# Start development server
npm run dev
```

**That's it.** No API keys needed. Open [http://localhost:3000](http://localhost:3000) and start navigating.

### Optional: Traffic Tiles

To enable real-time TomTom traffic overlay, create a `.env.local`:

```env
NEXT_PUBLIC_TOMTOM_API_KEY=your_tomtom_key_here
```

---

## 🎯 How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User enters │     │   Nominatim  │     │     OSRM     │
│  "India Gate"│────▶│   Geocoding  │────▶│   Routing    │
│              │     │  → [lat,lng] │     │ → polyline   │
└──────────────┘     └──────────────┘     │ → distance   │
                                          │ → duration   │
                                          │ → traffic    │
                                          └──────┬───────┘
                                                 │
                     ┌──────────────┐            │
                     │   Leaflet    │◀───────────┘
                     │  Map Render  │
                     │ • Route line │
                     │ • Traffic    │
                     │ • Markers    │
                     └──────────────┘
```

### Route Comparison Flow

```
Primary Route ──────────────────┐
                                ├──▶ VerdictBanner
Alternate Route (via X) ───────┘    ├─ 🟢 "Via X saves 5 min"
                                    ├─ 🔵 "Current route is faster"
                                    └─ 🟡 "Both take same time"
```

### Rerouting Engine

```
GPS Position ──▶ Distance Check ──▶ > 80m off route?
                                        │
                                   ┌────┴────┐
                                   │  YES    │  NO
                                   ▼         ▼
                             Auto Reroute   Continue
                             from current   monitoring
                             position       (every 3s)
```

---

## 🎨 UI Showcase

### Color System

```
Dark Mode                          Light Mode
─────────                          ──────────
Background   #0a0f1e               Background   #f8fafc
Card         #111827               Card         #ffffff
Border       #1e2d45               Border       #e2e8f0
Cyan         #22d3ee               Cyan         #0891b2
Green        #22c55e               Green        #16a34a
Purple       #a78bfa               Purple       #7c3aed
Rose         #f43f5e               Rose         #e11d48
Text Primary #f1f5f9               Text Primary #0f172a
```

### Animations

| Animation | Where | Effect |
|:---------:|:-----:|:------:|
| `fadeInUp` | Hero cards | Slide up + fade in |
| `pulseGlow` | CTA buttons | Breathing glow |
| `shimmer` | Hero section | Light sweep |
| `float` | Decorative icons | Gentle hover |
| Pulsing aura | Map markers | Expanding ring |
| Slide-down | Reroute alerts | Smooth entry |
| Fade cycle | Sidebar placeholder | Rotating example routes |

---

## 📋 Available Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint checks |

---

## 🧪 Demo Flow

> Perfect walkthrough for presentations:

1. **Landing Page** → Click "Start Navigating"
2. **Enter Source** → _Connaught Place, Delhi_
3. **Enter Destination** → _India Gate, Delhi_
4. **Click "Get Route"** → See route plotted on map
5. **Add Alternate** → _"What if I go via Mandi House?"_
6. **Compare** → Verdict Banner shows winner
7. **Toggle Theme** → Dark ↔ Light switch
8. **Report Roadblock** → Watch auto-reroute
9. **Mobile View** → Resize to see bottom sheet

---

## 🤝 Team

<div align="center">

**K.R. Mangalam University — Final Year Project**

Built with 💙 using open-source technologies

</div>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0f1e,50:22d3ee,100:6366f1&height=120&section=footer" width="100%" />

**⭐ Star this repo if you found it useful!**

</div>

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Other Platforms

Voltrix can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Digital Ocean
- Railway
- Render

## 📚 Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [React Documentation](https://react.dev/) - Learn React fundamentals
- [Material-UI Documentation](https://mui.com/material-ui/getting-started/) - Explore MUI components
- [Leaflet Documentation](https://leafletjs.com/reference.html) - Map library API reference
- [React-Leaflet Documentation](https://react-leaflet.js.org/) - React wrapper for Leaflet

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

Built with ❤️ using Next.js and React
