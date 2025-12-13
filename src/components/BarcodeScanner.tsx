import { useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import jsQR from 'jsqr';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          onScan(code.data);
        } else {
          setError('Impossibile leggere il codice a barre. Riprova.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span>Scansiona Codice a Barre</span>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors" aria-label="Chiudi">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          Seleziona foto
        </button>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}
