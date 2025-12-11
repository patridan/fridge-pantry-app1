import { useState, useRef, useEffect } from 'react';
import { X, Camera, Barcode, Calendar, Upload, Image as ImageIcon } from 'lucide-react';
import { Product, StorageType } from '../types';
import { BarcodeScanner } from './BarcodeScanner';

interface AddProductModalProps {
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id'>) => void;
}

const categories = [
  'Latticini',
  'Mozzarella',
  'Provola',
  'Insaccati',
  'Carne',
  'Pesce',
  'Frutta',
  'Verdura',
  'Bevande',
  'Pasta e Riso',
  'Pane e Cereali',
  'Condimenti',
  'Dolci/Brioches',
  'Zucchero',
  'Surgelati',
  'Altro'
];

const units = ['pz', 'kg', 'g', 'l', 'ml', 'confezioni'];

export function AddProductModal({ onClose, onAdd }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: categories[0],
    quantity: 1,
    unit: 'pz',
    expiryDate: '',
    storageType: 'frigo' as StorageType,
    image: '',
    barcode: '',
  });
  
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [dateInputMode, setDateInputMode] = useState<'picker' | 'manual'>('picker');
  const [manualDate, setManualDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.expiryDate) {
      onAdd(formData);
      onClose();
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData({ ...formData, barcode, name: formData.name || `Prodotto ${barcode}` });
    setShowBarcodeScanner(false);
  };

  const handleImageCapture = (imageData: string) => {
    setFormData({ ...formData, image: imageData });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Impossibile accedere alla fotocamera. Verifica i permessi.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        handleImageCapture(imageData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const formatManualDate = (input: string) => {
    // Remove non-numeric characters
    const numbers = input.replace(/\D/g, '');
    
    // Format as DD/MM/YYYY
    let formatted = '';
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2);
      if (numbers.length > 2) {
        formatted += '/' + numbers.substring(2, 4);
      }
      if (numbers.length > 4) {
        formatted += '/' + numbers.substring(4, 8);
      }
    }
    
    return formatted;
  };

  const handleManualDateChange = (value: string) => {
    const formatted = formatManualDate(value);
    setManualDate(formatted);
    
    // Convert DD/MM/YYYY to YYYY-MM-DD for the date input
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split('/');
      const isoDate = `${year}-${month}-${day}`;
      // Validate date
      const date = new Date(isoDate);
      if (!isNaN(date.getTime())) {
        setFormData({ ...formData, expiryDate: isoDate });
      }
    }
  };

  return (
    <>
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
      
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="bg-gray-900 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Camera className="w-5 h-5" />
              <span>Scatta Foto</span>
            </div>
            <button
              onClick={stopCamera}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="bg-gray-900 px-4 py-6 flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Camera className="w-8 h-8 text-gray-900" />
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-gray-900">Aggiungi Prodotto</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Barcode Scanner */}
            <div>
              <label className="block text-gray-700 mb-2">
                Scansiona Codice a Barre
              </label>
              <button
                type="button"
                onClick={() => setShowBarcodeScanner(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600"
              >
                <Barcode className="w-5 h-5" />
                <span>Scansiona Codice a Barre</span>
              </button>
              {formData.barcode && (
                <div className="mt-2 text-sm text-gray-600">
                  Codice: {formData.barcode}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 mb-2">
                Foto Prodotto
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600"
                >
                  <Upload className="w-5 h-5" />
                  <span>Carica</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600"
                >
                  <Camera className="w-5 h-5" />
                  <span>Scatta</span>
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              {formData.image && (
                <div className="mt-3 relative">
                  <img
                    src={formData.image}
                    alt="Anteprima prodotto"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Nome Prodotto *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="es. Latte fresco"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Storage Type */}
            <div>
              <label className="block text-gray-700 mb-2">
                Posizione *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('storageType', 'frigo')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.storageType === 'frigo'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">❄️</div>
                  <div>Frigorifero</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('storageType', 'dispensa')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.storageType === 'dispensa'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📦</div>
                  <div>Dispensa</div>
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-gray-700 mb-2">
                  Quantità *
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-gray-700 mb-2">
                  Unità *
                </label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-gray-700 mb-2">
                Data di Scadenza *
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDateInputMode('picker')}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    dateInputMode === 'picker'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendario</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDateInputMode('manual')}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    dateInputMode === 'manual'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>Digita</span>
                </button>
              </div>
              
              {dateInputMode === 'picker' ? (
                <input
                  type="date"
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={manualDate}
                  onChange={(e) => handleManualDateChange(e.target.value)}
                  placeholder="GG/MM/AAAA (es. 25/12/2024)"
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Aggiungi
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
