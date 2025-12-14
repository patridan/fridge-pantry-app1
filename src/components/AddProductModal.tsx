import {
  Barcode,
  Camera,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Product, StorageType } from "../types";
import { BarcodeScanner } from "./BarcodeScanner";

interface AddProductModalProps {
  onClose: () => void;
  onAdd: (product: Omit<Product, "id">) => void;
}

const categories = [
  "Latticini",
  "Mozzarella",
  "Provola",
  "Insaccati",
  "Carne",
  "Pesce",
  "Frutta",
  "Verdura",
  "Bevande",
  "Pasta e Riso",
  "Pane e Cereali",
  "Condimenti",
  "Dolci/Brioches",
  "Zucchero",
  "Surgelati",
  "Altro",
];

const units = ["pz", "kg", "g", "l", "ml", "confezioni"];

export function AddProductModal({ onClose, onAdd }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: categories[0],
    quantity: 1,
    unit: "pz",
    expiryDate: "",
    storageType: "frigo" as StorageType,
    image: "",
    barcode: "",
  });

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [dateInputMode, setDateInputMode] = useState<"picker" | "manual">("picker");
  const [manualDate, setManualDate] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.expiryDate) {
      onAdd(formData);
      onClose();
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /* ---------------- BARCODE ---------------- */

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);

    setFormData(prev => ({
      ...prev,
      barcode,
    }));

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await res.json();

      if (data.status === 1) {
        setFormData(prev => ({
          ...prev,
          name: data.product.product_name || barcode,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          name: prev.name || barcode,
        }));
      }
    } catch (err) {
      console.error("Errore OpenFoodFacts:", err);
    }
  };

  /* ---------------- IMMAGINE ---------------- */

  const handleImageCapture = (imageData: string) => {
    setFormData(prev => ({ ...prev, image: imageData }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleImageCapture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // 🔧 FIX OBBLIGATORIO
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch {
      alert("Impossibile accedere alla fotocamera.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    handleImageCapture(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  /* ---------------- DATA ---------------- */

  const formatManualDate = (value: string) => {
    const n = value.replace(/\D/g, "");
    let out = "";
    if (n.length > 0) out = n.slice(0, 2);
    if (n.length > 2) out += "/" + n.slice(2, 4);
    if (n.length > 4) out += "/" + n.slice(4, 8);
    return out;
  };

  const handleManualDateChange = (value: string) => {
    const formatted = formatManualDate(value);
    setManualDate(formatted);

    if (formatted.length === 10) {
      const [d, m, y] = formatted.split("/");
      const iso = `${y}-${m}-${d}`;
      const date = new Date(iso);
      if (!isNaN(date.getTime())) {
        setFormData(p => ({ ...p, expiryDate: iso }));
      }
    }
  };

  /* ===================== RENDER ===================== */

  return (
    <>
      {/* 🔧 SCANNER AL ROOT ASSOLUTO */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 z-[9999] bg-black">
          <BarcodeScanner
            onScan={handleBarcodeScanned}
            onClose={() => setShowBarcodeScanner(false)}
          />
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="bg-gray-900 px-4 py-4 flex justify-between text-white">
            <span>Scatta Foto</span>
            <button onClick={stopCamera}>
              <X />
            </button>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="flex-1 object-cover"
          />

          <div className="p-4 flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full"
            >
              <Camera />
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <button
              type="button"
              onClick={() => setShowBarcodeScanner(true)}
              className="w-full border-2 border-dashed p-3 rounded-xl flex justify-center gap-2"
            >
              <Barcode /> Scansiona Codice a Barre
            </button>

            {formData.barcode && (
              <p className="text-sm text-cyan-600">
                Codice: {formData.barcode}
              </p>
            )}

            <input
              type="text"
              placeholder="Nome prodotto"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />

            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleChange("expiryDate", e.target.value)}
              required
            />

            <div className="flex gap-3">
              <button type="button" onClick={onClose}>
                Annulla
              </button>
              <button type="submit">Aggiungi</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
