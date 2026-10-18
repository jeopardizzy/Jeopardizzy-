import { useMemo } from "react";
import qrcode from "qrcode-generator";

/** A QR code drawn as SVG on the device; nothing is fetched. */
export default function QrCode({ text, label, size = 200 }: { text: string; label: string; size?: number }) {
  const { count, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { count: n, path: d };
  }, [text]);
  const quiet = 2;
  const box = count + quiet * 2;
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${box} ${box}`}
      shapeRendering="crispEdges"
      className="rounded-xl bg-white"
    >
      <rect x={-quiet} y={-quiet} width={box} height={box} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
