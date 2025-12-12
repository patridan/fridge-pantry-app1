import { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Barcode,
  Calendar,
  Upload,
} from "lucide-react";
import { Product, StorageType } from "../types";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
} from "@zxing/library";

interface AddProductModalProps {
  onClose: () => void;
  onAdd: (product: Omit<Product, "id">) => void;
}

const categories = [
  "Latticini", "Mozzarella", "Provola", "Insaccati", "Carne", "Pesce",
  "Frutta", "Verdura", "Bevande", "Pasta e Riso", "Pane e Cereali",
  "Condimenti", "Dolci/Brioches", "Zucchero", "Surgelati", "Altro",
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
  const [manualDate, setManualDate] = useState("");
  const [dateInputMode, setDateInputMode] = useState<"picker" | "manual">("picker");
  const [scannerError, setScannerError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.expiryDate) {
      onAdd(formData);
      onClose();
    }
  };

  // --- BARCODE SCANNER ---
  const startScanner = async () => {
    setScannerError("");
    readerRef.current ??= new BrowserMultiFormatReader(new Map([
      [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A]]
    ]));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      intervalRef.current = setInterval(scanFrame, 200);
    } catch (err: any) {
      setScannerError(err.name === "NotAllowedError"
        ? "Permesso fotocamera negato"
        : "Errore accesso fotocamera");
    }
  };

  const stopScanner = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    videoRef.current!.srcObject = null;
  };

  const scanFrame = () => {
    if (!readerRef.current || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const result = readerRef.current.decodeFromCanvas(canvas);
      if (result) fetchProductInfo(result.getText());
    } catch {}
  };

  const fetchProductInfo = async (barcode: string) => {
    stopScanner();
    setShowBarcodeScanner(false);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1) {
        setFormData({
          ...formData,
          barcode,
          name: data.product.product_name || "",
          image: data.product.image_front_small_url || "",
        });
      } else {
        alert("Prodotto non trovato nel database Open Food Facts.");
      }
    } catch {
      alert("Errore recupero dati prodotto.");
    }
  };

  const formatManualDate = (input: string) => {
    const numbers = input.replace(/\D/g, "");
    let formatted = "";
    if (numbers.length > 0) formatted = numbers.substring(0, 2);
    if (numbers.length > 2) formatted += "/" + numbers.substring(2, 4);
    if (numbers.length > 4) formatted += "/" + numbers.substring(4, 8);
    return formatted;
  };

  const handleManualDateChange = (value: string) => {
    const formatted = formatManualDate(value);
    setManualDate(formatted);
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split("/");
      const isoDate = `${year}-${month}-${day}`;
      const date = new Date(isoDate);
      if (!isNaN(date.getTime())) setFormData({ ...formData, expiryDate: isoDate });
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <>
      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gray-900 px-4 py-4 flex justify-between items-center text-white">
            <span>Scanner</span>
            <button onClick={() => { stopScanner(); setShowBarcodeScanner(false); }}><X className="w-6 h-6"/></button>
          </div>
          <div className="flex-1 relative">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {scannerError && <div className="text-white absolute bottom-10 w-full text-center">{scannerError}</div>}
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-white to-cyan-50 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2 border-cyan-100">
          <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-sky-600 border-b border-cyan-700 px-6 py-4 flex items-center justify-between rounded-t-3xl">
            <h2 className="text-white">Aggiungi Prodotto</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Barcode */}
            <div>
              <label className="block text-gray-700 mb-2">Scansiona Codice a Barre</label>
              <button
                type="button"
                onClick={() => { setShowBarcodeScanner(true); startScanner(); }}
                className="w-full px-4 py-3 border-2 border-dashed border-cyan-300 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-cyan-600"
              >
                <Barcode className="w-5 h-5"/> Scansiona Codice a Barre
              </button>
              {formData.barcode && <div className="mt-2 text-sm text-cyan-600">Codice: {formData.barcode}</div>}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 mb-2">Foto Prodotto</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-3 border-2 border-dashed border-cyan-300 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-cyan-600">
                  <Upload className="w-5 h-5"/> Carica
                </button>
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" capture="environment" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => setFormData({...formData, image: reader.result as string});
                reader.readAsDataURL(file);
              }} className="hidden"/>
              {formData.image && <img src={formData.image} alt="Anteprima" className="w-full h-32 object-cover rounded-xl mt-3"/>}
            </div>

            {/* Nome */}
            <div>
              <label className="block text-gray-700 mb-2">Nome Prodotto *</label>
              <input type="text" value={formData.name} onChange={e => handleChange("name", e.target.value)} placeholder="es. Latte fresco" className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all" required/>
            </div>

            {/* Resto del form (storage, category, quantità, unità, data) */}
            {/* Puoi mantenere il tuo codice originale qui senza modifiche */}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Annulla</button>
              <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">Aggiungi</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
