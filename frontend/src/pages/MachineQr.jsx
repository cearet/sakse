import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { machineCode } from "../format";
import Qr from "../components/Qr";

// Stands in for the QR sticker physically attached to a machine. In a real
// deployment this would be printed and stuck on the machine; here you can pull
// it up on screen to scan when starting or collecting a wash.
export default function MachineQr() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);

  useEffect(() => {
    let active = true;
    api("/api/laundromats")
      .then((all) => {
        if (!active) return;
        let match = null;
        for (const p of all) {
          const m = p.machines.find((x) => x.id === id);
          if (m) {
            match = { ...m, place: p.name };
            break;
          }
        }
        setMachine(match);
      })
      .catch(() => {
        if (active) setMachine(null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-8 text-center">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          {machine?.place || "Sakse"}
        </p>
        <p className="mb-5 text-xl font-extrabold text-slate-900">{machine?.label || "Machine"}</p>
        <Qr text={machineCode(id)} size={240} className="mx-auto" />
        <p className="mt-5 text-sm text-slate-500">Scan to start or collect your wash</p>
      </div>
      <Link to="/" className="mt-6 text-sm font-semibold text-slate-400">
        ‹ Back
      </Link>
    </div>
  );
}
