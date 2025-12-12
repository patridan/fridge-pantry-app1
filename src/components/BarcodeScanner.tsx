import { useEffect, useRef, useState, ChangeEvent } from "react";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";
import { X, Camera, Image } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState("");
  const [isLiveScanning, setIsLiveScanning] = useState(true);

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  // ---- STOP VIDEO FUNCTION ----
  const stopLiveScanner = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
        controlsRef.current = null;
      } catch {}
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ---- IPHONE FALLBACK: decode via canvas ----
  const decodeFrameManually = () => {
    if (!readerRef.current) return;

    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const result = readerRef.current.decodeFromCanvas(canvas);
      if (result) {
        onScan(result.getText());
      }
    } catch {}
  };

  // ---- HANDLE IMAGE UPLOAD ----
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopLiveScanner();
    setIsLiveScanning(false);

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    try {
      const result = await readerRef.current!.decodeFromImageElement(img);
      onScan(result.getText());
    } catch {
      setError("Impossibile leggere il codice dall’immagine.");
    }
  };

  // ---- START LIVE SCANNER ----
  const startLiveScanner = async () => {
    setError("");
    setIsLiveScanning(true);

    if (!readerRef.current) return;

    stopLiveScanner();

    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: "environment" },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // iPHONE FALLBACK: manual decoding
      const isIphone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isIphone) {
        const interval = setInterval(() => {
          if (!isLiveScanning) {
            clearInterval(interval);
            return;
          }
          decodeFrameManually();
        }, 200);

        return;
      }

      // NORMAL AUTO MODE
      const controls = await readerRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result) => {
          if (result) onScan(result.getText());
        }
      );

      controlsRef.current = controls;
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Permesso fotocamera negato. Abilitalo nelle impostazioni.");
      } else {
        setError("Impossibile avviare la fotocamera.");
      }
    }
  };

  // ---- INITIAL SETUP ----
  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
    ]);

    readerRef.current = new BrowserMultiFormatReader(hints);
    startLiveScanner();

    return () => stopLiveScanner();
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* HEADER */}
      <div className="bg-gray-900 px-4 py-4 flex justify-between items-center text-white">
        <div className="flex gap-2 items-center">
          <Camera className="w-5 h-5" />
          <span>Scanner</span>
        </div>
        <button onClick={onClose}>
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* VIDEO */}
      <div className="flex-1 flex items-center justify-center relative">
        {isLiveScanning && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
          />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="text-white text-center p-4">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="bg-gray-900 px-4 py-4 flex justify-around items-center text-white">
        {/* --- PULSANTE SCATTA FOTO --- */}
        <button
          onClick={startLiveScanner}
          className="p-3 bg-white text-black rounded-full shadow"
        >
          <Camera className="w-6 h-6" />
        </button>

        {/* --- PULSANTE CARICA DA GALLERIA --- */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-blue-500 rounded-full shadow"
        >
          <Image className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
