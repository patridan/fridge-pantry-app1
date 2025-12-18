import { Barcode, Calendar, Upload, X } from "lucide-react";
import React, { useRef, useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { Product, StorageType } from "../types";

interface AddProductModalProps {
  onClose: () => void;
  onAdd: (product: Omit<Product, "id">) => void;
}

const categories = [
  "Latticini","Mozzarella","Provola","Insaccati","Carne","Pesce",
  "Frutta","Verdura","Bevande","Pasta e Riso","Pane e Cereali",
  "Condimenti","Dolci/Brioches","Zucchero","Surgelati","Altro"
];

const units = ["pz","kg","g","l","ml","confezioni"];

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

  const [manualDate, setManualDate] = useState("");
  const [dateInputMode, setDateInputMode] = useState<"picker" | "manual">("picker");
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string | number) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  // -------------------------------
  // FETCH OPEN FOOD FACTS
  // -------------------------------
  const fetchProductByBarcode = async (barcode: string) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const json = await response.json();
      if (json?.status === 1 && json.product) {
        const p = json.product;
        handleChange("name", p.product_name || "");
        handleChange("category", p.categories_tags?.[0]?.replace("en:", "") || categories[0]);
        handleChange("image", p.image_front_url || "");
      }
    } catch (e) {
      console.error("Errore OpenFoodFacts:", e);
    }
  };

  // -------------------------------
  // SCANNER QR
  // -------------------------------
  const handleScan = (result: any) => {
    if (result) {
      const barcode = result.getText();
      handleChange("barcode", barcode);
      fetchProductByBarcode(barcode);
      setShowScanner(false);
    }
  };

  const handleError = (err: any) => {
    if (err.name && err.name !== "NotFoundException2") console.error("Errore scanner:", err);
  };

  // -------------------------------
  // FILE UPLOAD 
  // -------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => handleChange("image", reader.result as string);
    reader.readAsDataURL(file);
  };

  // -------------------------------
  // DATA MANUALE
  // -------------------------------
  const handleManualDateChange = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    let formatted = numbers;
    if (numbers.length > 2) formatted = numbers.substring(0, 2) + "/" + numbers.substring(2, 4);
    if (numbers.length > 4) formatted += "/" + numbers.substring(4, 8);
    setManualDate(formatted);
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split("/");
      const iso = `${year}-${month}-${day}`;
      if (!isNaN(new Date(iso).getTime())) handleChange("expiryDate", iso);
    }
  };

  // -------------------------------
  // SUBMIT
  // -------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.expiryDate) {
      onAdd(formData);
      onClose();
    } else {
      alert("Compila tutti i campi obbligatori!");
    }
  };

  return (
    <>
      {/* SCANNER QR */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md aspect-[4/3] bg-black rounded-xl overflow-hidden">
            <BarcodeScannerComponent
              width={400}
              height={300}
              onUpdate={(err, result) => result ? handleScan(result) : handleError(err)}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-cyan-500 rounded-xl w-2/3 h-2/3" />
            </div>
            <div className="absolute top-2 w-full text-center text-white font-semibold pointer-events-none">
              Inquadra il prodotto
            </div>
          </div>
          <button
            onClick={() => setShowScanner(false)}
            className="mt-4 px-6 py-3 bg-red-500 rounded-full text-white font-semibold shadow-lg"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* FORM MODAL */}
      {!showScanner && (
        <div className="fixed inset-0 bg-black/50 flex justify-center p-4 z-40 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full h-[80vh] overflow-hidden border-2 border-cyan-100 flex flex-col mt-10 mb-10">
            <div className="sticky top-0 bg-cyan-600 px-4 py-3 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-white text-lg font-semibold">Aggiungi Prodotto</h2>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="w-5 h-5"/>
              </button>
            </div>
              <form
                onSubmit={handleSubmit}
                className="p-3 flex-1 overflow-y-auto overscroll-contain"
              >
              
              {/* Barcode */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm">Scansiona Codice a Barre</label>
                <button type="button" onClick={() => setShowScanner(true)}
                  className="w-full px-3 py-2 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-sm">
                  <Barcode className="w-4 h-4"/> Scansiona
                </button>
                {formData.barcode && <div className="mt-1 text-xs text-cyan-600">Codice: {formData.barcode}</div>}
              </div>

              {/* Foto */}
            <div>
              <label className="block text-gray-700 mb-1 text-sm">
                Foto Prodotto
              </label>

              <div className="grid grid-cols-1 gap-2">
                {/* Solo Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 border-2 border-dashed rounded-xl flex items-center justify-center gap-1 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Carica immagine
                </button>

                {/* Preview */}
                {formData.image && (
                  <div className="relative">
                    <img
                      src={formData.image}
                      alt="Anteprima prodotto"
                      className="w-full h-40 object-cover rounded-xl border border-gray-200"
                    />

                    <button
                      type="button"
                      onClick={() => handleChange("image", "")}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

              {/* Nome */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm">Nome Prodotto *</label>
                <input type="text" value={formData.name} onChange={e => handleChange("name", e.target.value)}
                  placeholder="es. Latte fresco"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" required/>
              </div>

              {/* Storage */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm">Posizione *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => handleChange("storageType","frigo")}
                    className={`p-2 rounded-xl border-2 text-sm ${formData.storageType==="frigo"?"border-cyan-500 bg-cyan-50":"border-gray-200 bg-white"}`}>
                    ❄️ Frigorifero
                  </button>
                  <button type="button" onClick={() => handleChange("storageType","dispensa")}
                    className={`p-2 rounded-xl border-2 text-sm ${formData.storageType==="dispensa"?"border-amber-500 bg-amber-50":"border-gray-200 bg-white"}`}>
                    📦 Dispensa
                  </button>
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm">Categoria *</label>
                <select value={formData.category} onChange={e=>handleChange("category",e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm">
                  {categories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Quantità */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 mb-1 text-sm">Quantità *</label>
                  <input type="number" min={0} step={0.1} value={formData.quantity}
                    onChange={e=>handleChange("quantity",parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"/>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 text-sm">Unità *</label>
                  <select value={formData.unit} onChange={e=>handleChange("unit",e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm">
                    {units.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Data Scadenza */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm">Data di Scadenza *</label>
                <div className="flex gap-2 mb-1">
                  <button type="button" onClick={()=>setDateInputMode("picker")}
                    className={`flex-1 p-2 rounded-xl border-2 text-sm ${dateInputMode==="picker"?"border-cyan-500 bg-cyan-50":"border-gray-200 bg-white"}`}>
                    <Calendar className="w-4 h-4 inline"/> Calendario
                  </button>
                  <button type="button" onClick={()=>setDateInputMode("manual")}
                    className={`flex-1 p-2 rounded-xl border-2 text-sm ${dateInputMode==="manual"?"border-cyan-500 bg-cyan-50":"border-gray-200 bg-white"}`}>
                    Digita
                  </button>
                </div>
                {dateInputMode==="picker" ? (
                  <input type="date" value={formData.expiryDate} onChange={e=>handleChange("expiryDate", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"/>
                ) : (
                  <input type="text" value={manualDate} onChange={e=>handleManualDateChange(e.target.value)}
                    placeholder="GG/MM/AAAA" maxLength={10} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"/>
                )}
              </div>

              {/* Pulsanti */}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="flex-1 p-2 border-2 border-gray-300 rounded-xl text-sm">Annulla</button>
                <button type="submit" className="flex-1 p-2 bg-cyan-600 text-white rounded-xl text-sm">Aggiungi</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}