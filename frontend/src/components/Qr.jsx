import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Renders any text as a QR code image.
export default function Qr({ text, size = 220, className = "" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: "M" })
      .then((u) => active && setUrl(u))
      .catch(() => active && setUrl(""));
    return () => {
      active = false;
    };
  }, [text, size]);

  if (!url) return <div className="animate-pulse rounded-2xl bg-slate-100" style={{ width: size, height: size }} />;
  return <img src={url} alt="QR code" width={size} height={size} className={className} />;
}
