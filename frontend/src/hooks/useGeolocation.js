import { useEffect, useState } from "react";

// Asks the browser for the user's location once.
// Returns { coords: {lat, lng} | null, error }.
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { coords, error };
}
