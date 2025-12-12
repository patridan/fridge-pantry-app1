import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanner = async () => {
      try {
        setIsScanning(true);
        setError('');
        
        // Get list of video devices using the correct API
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError('Nessuna fotocamera disponibile');
          return;
        }

        // Prefer back camera on mobile devices
        const selectedDeviceId = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        )?.deviceId || videoInputDevices[0].deviceId;

        if (videoRef.current) {
          const controls = await reader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                const barcodeText = result.getText();
                onScan(barcodeText);
              }
            }
          );
          controlsRef.current = controls;
        }
      } catch (err: any) {
        console.error('Error starting scanner:', err);
        if (err.name === 'NotAllowedError') {
          setError('Permesso fotocamera negato. Consenti l\'accesso alla fotocamera nelle impostazioni del browser.');
        } else if (err.name === 'NotFoundError') {
          setError('Nessuna fotocamera trovata sul dispositivo.');
        } else {
          setError('Impossibile avviare la fotocamera. Verifica i permessi.');
        }
      }
    };

    startScanner();

    return () => {
      // Stop the video stream when component unmounts
      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch (e) {
          console.error('Error stopping scanner:', e);
        }
      }
      
      // Stop all video tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span>Scansiona Codice a Barre</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-white text-center px-4">
            <p className="mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-black rounded-lg"
            >
              Chiudi
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 border-2 border-white rounded-lg shadow-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      {!error && (
        <div className="bg-gray-900 px-4 py-6 text-center text-white">
          <p>Posiziona il codice a barre nel riquadro</p>
        </div>
      )}
    </div>
  );
}