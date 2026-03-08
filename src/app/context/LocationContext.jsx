"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LocationContext = createContext({ userCoords: null });

export function LocationProvider({ children }) {
  const [userCoords, setUserCoords] = useState(null); // [lat, lng]

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {},                                   // silently ignore denial
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return (
    <LocationContext.Provider value={{ userCoords }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
