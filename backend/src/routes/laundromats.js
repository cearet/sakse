import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// GET /api/laundromats?lat=..&lng=..
// Returns all partner locations with their machines. If lat/lng are given, uses
// PostGIS to compute the distance from that point and sorts nearest-first.
router.get("/", async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  let places;
  if (hasLocation) {
    // ST_Distance on geography gives metres. We build points from our stored
    // lat/lng columns and measure to the user's point.
    const rows = await prisma.$queryRaw`
      SELECT id, name, address, lat, lng,
             ST_Distance(
               ST_MakePoint(lng, lat)::geography,
               ST_MakePoint(${lng}, ${lat})::geography
             ) AS "distanceMeters"
      FROM "Laundromat"
      ORDER BY "distanceMeters" ASC
    `;
    // distanceMeters comes back as a string/number depending on driver — normalise.
    places = rows.map((r) => ({ ...r, distanceMeters: Number(r.distanceMeters) }));
  } else {
    places = await prisma.laundromat.findMany({ orderBy: { name: "asc" } });
  }

  // Attach machines to each place.
  const machines = await prisma.machine.findMany({ orderBy: { label: "asc" } });
  const byPlace = {};
  for (const m of machines) {
    (byPlace[m.laundromatId] ||= []).push(m);
  }
  const result = places.map((p) => ({ ...p, machines: byPlace[p.id] || [] }));

  res.json(result);
});

export default router;
