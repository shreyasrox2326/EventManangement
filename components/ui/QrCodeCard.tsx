"use client";

import { ReactNode, useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCodeCard({
  value,
  label,
  showValue = false,
  prefix
}: {
  value: string;
  label?: string;
  showValue?: boolean;
  prefix?: ReactNode;
}) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let isActive = true;

    QRCode.toDataURL(value, {
      margin: 1,
      width: 240
    }).then((nextUrl) => {
      if (isActive) {
        setDataUrl(nextUrl);
      }
    }).catch(() => {
      if (isActive) {
        setDataUrl("");
      }
    });

    return () => {
      isActive = false;
    };
  }, [value]);

  return (
    <div className="card" style={{ padding: 18, borderRadius: 18, display: "grid", gap: 12, justifyItems: "center" }}>
      {label && (
        <div
          className="eyebrow"
          style={{
            display: "grid",
            justifyItems: "center",
            gap: 8,
            width: "100%",
            textAlign: "center"
          }}
        >
          {prefix}
          <span style={{ width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}>{label}</span>
        </div>
      )}
      {dataUrl ? (
        <img src={dataUrl} alt="Ticket QR code" style={{ width: 220, height: 220, borderRadius: 16, background: "white", padding: 12 }} />
      ) : (
        <div className="muted">QR preview unavailable</div>
      )}
      {showValue && (
        <div
          style={{
            fontSize: "0.84rem",
            color: "var(--text-soft)",
            width: "100%",
            wordBreak: "break-word",
            textAlign: "center"
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
