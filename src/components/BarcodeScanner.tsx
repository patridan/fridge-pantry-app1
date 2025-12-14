import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { useEffect } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 120 }, // rettangolare = barcode
        },
        (decodedText) => {
          scanner
            .stop()
            .then(() => onScan(decodedText.trim()))
            .catch(() => {});
        },
        () => {}
      )
      .catch((err) => {
        console.error("Errore avvio scanner:", err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[70] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-4 w-[90%] max-w-md">
        <div id="qr-reader" className="w-full aspect-[4/3]" />

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-3 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Chiudi Scanner
        </button>
      </div>
    </div>
  );
}
