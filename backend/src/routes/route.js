import { Router } from "express";

const router = Router();

const OSRM = "https://router.project-osrm.org";

// Turn an OSRM step into a plain-English instruction.
function instruction(step) {
  const name = step.name && step.name.trim() ? step.name : "the road";
  const m = step.maneuver || {};
  const mod = m.modifier ? ` ${m.modifier}` : "";
  switch (m.type) {
    case "depart": return `Head out on ${name}`;
    case "arrive": return "Arrive at your destination";
    case "turn": return `Turn${mod} onto ${name}`;
    case "new name": return `Continue onto ${name}`;
    case "merge": return `Merge${mod} onto ${name}`;
    case "on ramp": return `Take the ramp${mod} onto ${name}`;
    case "off ramp": return `Take the exit${mod} toward ${name}`;
    case "fork": return `Keep${mod} at the fork onto ${name}`;
    case "roundabout":
    case "rotary": return `Take the roundabout onto ${name}`;
    case "continue": return `Continue${mod} on ${name}`;
    default: return `${m.type || "Continue"}${mod} onto ${name}`;
  }
}

// GET /api/route?fromLat=&fromLng=&toLat=&toLng=
// Proxies OSRM (free OpenStreetMap routing) server-side and returns a route
// the frontend can draw: distance, duration, geometry, and turn-by-turn steps.
router.get("/", async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  const nums = [fromLat, fromLng, toLat, toLng].map(Number);
  if (nums.some((n) => !Number.isFinite(n))) {
    return res.status(400).json({ error: "fromLat, fromLng, toLat, toLng are required" });
  }
  const [flat, flng, tlat, tlng] = nums;

  try {
    const url =
      `${OSRM}/route/v1/driving/${flng},${flat};${tlng},${tlat}` +
      `?overview=full&geometries=geojson&steps=true`;
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const data = await r.json();
    if (data.code !== "Ok" || !data.routes?.length) {
      return res.status(502).json({ error: "No route found" });
    }
    const route = data.routes[0];
    // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const steps = (route.legs[0]?.steps || []).map((s) => ({
      text: instruction(s),
      distance: s.distance,
    }));
    res.json({ distance: route.distance, duration: route.duration, coordinates, steps });
  } catch {
    res.status(502).json({ error: "Routing service unavailable" });
  }
});

export default router;
