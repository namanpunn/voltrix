# 🗺️ Voltrix

**Voltrix** is an intelligent navigation and routing application built with Next.js that provides real-time route planning, traffic monitoring, and dynamic rerouting capabilities.

## ✨ Features

- **Interactive Map Interface** - Powered by Leaflet for smooth map interactions
- **Smart Route Planning** - Input origin and destination with intelligent autocomplete
- **Alternate Route Suggestions** - View and compare multiple route options
- **Real-Time Traffic Monitoring** - Traffic panel with live updates
- **Dynamic Rerouting** - Automatic alerts and suggestions for better routes
- **Camera Views** - Integrated camera feeds along routes
- **Responsive Design** - Material-UI components with custom theming
- **Split-Screen Layout** - Optimized sidebar and map view interface

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voltrix.git
cd voltrix
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🏗️ Project Structure

```
voltrix/
├── src/
│   ├── app/
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useRerouting.js
│   │   │   └── useRoute.js
│   │   ├── navigation/         # Navigation pages
│   │   ├── utils/              # Utility functions
│   │   │   ├── mapHelpers.js
│   │   │   └── theme.js
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Home page
│   │   └── globals.css         # Global styles
│   └── components/
│       ├── AlternateRouteInput.jsx
│       ├── CameraView.jsx
│       ├── Hero-Page.jsx
│       ├── MapView.jsx
│       ├── PlaceAutocomplete.jsx
│       ├── RerouteAlert.jsx
│       ├── RouteInfoCard.jsx
│       ├── RouteInputForm.jsx
│       ├── Sidebar.jsx
│       ├── SplitScreen.jsx
│       └── TrafficPanel.jsx
├── public/                     # Static assets
├── package.json
└── README.md
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.1.5](https://nextjs.org/) - React framework with App Router
- **UI Library**: [React 19.2.3](https://react.dev/)
- **Component Library**: [Material-UI (MUI) 7.3.9](https://mui.com/)
- **Mapping**: [Leaflet 1.9.4](https://leafletjs.com/) + [React-Leaflet 5.0.0](https://react-leaflet.js.org/)
- **Styling**: [Emotion](https://emotion.sh/) - CSS-in-JS library
- **Code Quality**: ESLint with Next.js configuration

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🎨 Key Components

### MapView
Interactive map component using Leaflet for displaying routes and traffic data.

### PlaceAutocomplete
Smart autocomplete component for location search with suggestions.

### RouteInputForm
Form component for entering origin and destination points.

### TrafficPanel
Real-time traffic information display with updates.

### RerouteAlert
Dynamic alert system for suggesting route changes based on traffic conditions.

### CameraView
Integration of traffic camera feeds along routes.

## 🔧 Configuration

The project uses:
- `next.config.mjs` - Next.js configuration
- `eslint.config.mjs` - ESLint rules
- `jsconfig.json` - JavaScript configuration for paths and imports

## 📝 Development

The application uses Next.js App Router with the following structure:
- `app/page.js` - Main entry point (auto-updates on edit)
- Custom hooks in `app/hooks/` for route and rerouting logic
- Reusable components in `src/components/`
- Map utilities and theming in `app/utils/`

## 🚀 Deployment

### Deploy on Vercel

The easiest way to deploy Voltrix is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Push your code to a Git repository
2. Import your repository to Vercel
3. Vercel will automatically detect Next.js and configure the build

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
