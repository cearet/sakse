import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";

// Full-screen camera QR scanner. Streams the back camera, decodes frames with
// jsQR, and calls onSuccess(code) once it reads a code equal to `expect`.
// A manual-entry fallback is provided for demos where a camera isn't available.
export default function QrScanner({ expect, title = "Scan QR code", hint, onSuccess, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const doneRef = useRef(false);
  const [camError, setCamError] = useState("");
  const [wrong, setWrong] = useState(false);
  const [manual, setManual] = useState("");

  function finish(code) {
    if (doneRef.current) return;
    doneRef.current = true;
    stop();
    onSuccess(code);
  }

  function stop() {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        tick();
      } catch {
        setCamError("Camera unavailable. Enter the code below instead.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(img.data, img.width, img.height);
        if (found?.data) {
          const value = found.data.trim();
          if (value === expect) return finish(value);
          setWrong(true); // scanned something, but not this machine
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      active = false;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expect]);

  function submitManual(e) {
    e.preventDefault();
    if (manual.trim() === expect) finish(manual.trim());
    else setWrong(true);
  }

  return createPortal(
    <div className="absolute inset-0 z-[3000] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between px-5 pb-3 pt-6">
        <h2 className="text-lg font-bold">{title}</h2>
        <button onClick={onClose} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold active:scale-95">
          Cancel
        </button>
      </div>

      <div className="relative mx-auto mt-2 aspect-square w-[80%] max-w-xs overflow-hidden rounded-3xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {/* Viewfinder frame */}
        <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/80" />
      </div>

      <p className="mt-5 px-8 text-center text-sm text-white/70">
        {camError || hint || "Point your camera at the QR sticker on the machine."}
      </p>
      {wrong && !camError && (
        <p className="mt-2 px-8 text-center text-sm font-semibold text-rose-300">
          That's not this machine's code — scan the right one.
        </p>
      )}

      {/* Manual fallback (handy for on-screen demos) */}
      <form onSubmit={submitManual} className="mt-auto flex gap-2 p-5">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Or paste the machine code"
          className="min-w-0 flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none"
        />
        <button className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white active:scale-95">
          Use
        </button>
      </form>
    </div>,
    document.getElementById("root")
  );
}
