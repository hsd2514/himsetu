"use client";
import { useEffect, useId, useRef, useState } from "react";

/** Browsers only expose the camera on https:// (or localhost). */
export function cameraSupported() {
  return typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * Back-camera QR reader. Calls `onScan` once with the decoded text, then shuts the
 * camera off. Uses the phone's native barcode detector when it has one.
 */
export function QrScanner({ onScan, onError }) {
  const id = "qr-" + useId().replace(/[^\w-]/g, "");
  const [starting, setStarting] = useState(true);
  const cb = useRef({ onScan, onError });
  cb.current = { onScan, onError };

  useEffect(() => {
    let cancelled = false;
    let done = false;
    let scanner = null;
    let started = null;

    const stop = () => started?.then(() => scanner.isScanning && scanner.stop()).catch(() => {});

    import("html5-qrcode").then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
      if (cancelled) return;
      scanner = new Html5Qrcode(id, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
      started = scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: (w, h) => ({ width: Math.min(w, h) * 0.7, height: Math.min(w, h) * 0.7 }) },
        (text) => {
          if (done) return; // the decoder fires on every frame until stopped
          done = true;
          navigator.vibrate?.(80);
          stop();
          cb.current.onScan(text);
        },
        () => {}
      );
      started.then(
        () => !cancelled && setStarting(false),
        (e) => {
          if (cancelled) return;
          const denied = /permission|notallowed/i.test(String(e?.name ?? e));
          cb.current.onError(denied ? "Camera permission was denied. Allow it in the browser, or type the label." : `Camera unavailable: ${e?.message ?? e}. Type the label instead.`);
        }
      );
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [id]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-navy-950">
      <div id={id} className="min-h-64" />
      {starting && <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">Starting camera…</div>}
    </div>
  );
}
