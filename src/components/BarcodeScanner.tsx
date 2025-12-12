import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
} from "@zxing/library";
import { X, Camera } from "lucide-react";

interface BarcodeScannerProps {
  onGotProductData: (data: any) => void;
  onClose: () => void;
}

export function BarcodeScanner({
  onGotProductData,
  onClose,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState("");
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      intervalRef.current = setInterval(scanFrame, 200);
    } catch (err: any) {
      setError(
        err.name === "NotAllowedError"
          ? "Permesso fotocamera negato"
          : "Errore fotocamera"
      );
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    videoRef.current!.srcObject = null;
  };

  const scanFrame = () => {
    if (!readerRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const result = readerRef.current!.decodeFromCanvas(canvas);
      if (result) fetchProductData(result.getText());
    } catch {}
  };

  const fetchProductData = async (barcode: string) => {
    stopCamera(); // ferma scanner
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const json = await res.json();
      onGotProductData(json);
    } catch (e) {
      setError("Errore recupero dati prodotto");
    }
  };

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
    ]);
    readerRef.current = new BrowserMultiFormatReader(hints);
    startCamera();

    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 px-4 py-4 flex justify-between items-center text-white">
        <div className="flex gap-2 items-center">
          <Camera className="w-5 h-5" />
          <span>Scanner</span>
        </div>
        <button onClick={onClose}>
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="text-white absolute bottom-10 w-full text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
