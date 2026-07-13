import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Puts a few partner laundromats (with machines) into the database so the
// map has something to show. Safe to run repeatedly — it clears and re-inserts.
async function main() {
  // Wipe existing laundromat data (dev only). Order matters: children first.
  await prisma.reservation.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.laundromat.deleteMany();

  // Stable slug ids (instead of random cuids) so machine QR codes stay the same
  // across reseeds — makes testing/demoing predictable, e.g. SAKSE-MACHINE:spin-1.
  const places = [
    { id: "cleanwash", slug: "clean", name: "CleanWash Siam", address: "Siam Square, Bangkok", lat: 13.7455, lng: 100.534, machines: 4 },
    { id: "bubble", slug: "bubble", name: "BubbleLaundry Asok", address: "Asok, Bangkok", lat: 13.7376, lng: 100.5602, machines: 3 },
    { id: "spincity", slug: "spin", name: "SpinCity Ari", address: "Ari, Bangkok", lat: 13.7797, lng: 100.5449, machines: 5 },
  ];

  for (const p of places) {
    await prisma.laundromat.create({
      data: {
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        machines: {
          create: Array.from({ length: p.machines }, (_, i) => ({
            id: `${p.slug}-${i + 1}`, // e.g. spin-1
            label: `Machine ${i + 1}`,
            // Kept modest so the demo (TIME_UNIT_MS=1000) is quick to watch.
            cycleMinutes: 20,
          })),
        },
      },
    });
  }

  const count = await prisma.laundromat.count();
  console.log(`Seeded ${count} laundromats with machines.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
