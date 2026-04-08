import { useState } from "react";

const BASE_URL = import.meta.env.VITE_URL || "http://localhost:3000";

export default function useLocationDetector() {
  const [state, setState] = useState({
    phase: "idle",          // idle | detecting | geocoding | confirming | saving | done | error
    coords: null,           // { latitude, longitude }
    address: null,          // reverse-geocoded object
    error: null,
  });

  const reset = () => setState({ phase: "idle", coords: null, address: null, error: null });

  const detect = async () => {
    setState((s) => ({ ...s, phase: "detecting", error: null }));

    // 1. Get GPS coordinates
    let coords;
    try {
      coords = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => {
            const msgs = { 1: "Location permission denied", 2: "Location unavailable", 3: "Request timed out" };
            reject(new Error(msgs[err.code] || "Location error"));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", error: e.message }));
      return;
    }

    // 2. Reverse geocode
    setState((s) => ({ ...s, coords, phase: "geocoding" }));
    try {
      const res = await fetch(`${BASE_URL}/api/location/reverse-geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coords),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Geocode failed");
      setState((s) => ({ ...s, address: data.data, phase: "confirming" }));
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", error: e.message }));
    }
  };

  const save = async (isDefault = true) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setState((s) => ({ ...s, phase: "error", error: "User not authenticated" }));
      return;
    }

    setState((s) => ({ ...s, phase: "saving", error: null }));
    try {
      const res = await fetch(`${BASE_URL}/api/location/save-as-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...state.coords,
          isDefault,
          street: state.address.street || null,
          city: state.address.city || null,
          state: state.address.state || null,
          pincode: state.address.pincode || null,
          country: state.address.country || "India",
          full: state.address.full || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save address");
      setState((s) => ({ ...s, phase: "done" }));
      setTimeout(reset, 2500);
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", error: e.message }));
    }
  };

  return { ...state, detect, save, reset };
}