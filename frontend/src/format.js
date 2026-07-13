// Money is stored/handled in satang everywhere (฿1 = 100 satang).

// Just the numeric part, e.g. "250.00". Use with a separate ฿ element so the
// glyph never collides with the digits.
export function bahtNum(satang) {
  return ((satang ?? 0) / 100).toFixed(2);
}

// Inline string form with a normal space, e.g. for buttons and list rows.
export function baht(satang) {
  return "฿ " + bahtNum(satang);
}

// Format a distance in metres as a friendly string.
export function distance(meters) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Rough travel-time estimate (urban driving ~24 km/h incl. a road-winding
// factor). Good enough to label "~X min" without a routing service.
export function etaMinutes(meters) {
  if (meters == null) return null;
  return Math.max(1, Math.round((meters * 1.3) / 400));
}

// A maps deep-link for turn-by-turn navigation to a lat/lng.
export function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// The payload printed on a machine's QR sticker. Must match the backend's
// machineCode() so a scan validates. Scanning it starts or collects a wash.
export function machineCode(machineId) {
  return `SAKSE-MACHINE:${machineId}`;
}
