import { useEffect, useRef, useState, ChangeEvent } from 'react';
// Importiamo da @zxing/library per poter specificare i formati (cruciale per l'affidabilità)
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'; 
import { X, Camera, Image } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLiveScanning, setIsLiveScanning] = useState(true); // Stato per distinguere tra live e file
  
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  // Funzione per interrompere lo streaming video e liberare le risorse
  const stopLiveScanner = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
        controlsRef.current = null;
      } catch (e) {
        console.error('Errore durante l\'arresto dello scanner:', e);
      }
    }
    // Assicurati che tutte le tracce video siano bloccate
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Funzione per gestire il caricamento dell'immagine dalla libreria
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
        setError("Selezione file annullata.");
        return;
    }

    // Se stiamo scansionando live, interrompiamo lo streaming
    if (isLiveScanning) {
        stopLiveScanner();
        setIsLiveScanning(false);
    }

    if (!readerRef.current) return;

    setError(''); 

    try {
        // Creazione di un elemento immagine per la decodifica
        const imageElement = document.createElement('img');
        imageElement.src = URL.createObjectURL(file);

        // Attesa che l'immagine sia completamente caricata nel DOM virtuale
        await new Promise<void>((resolve, reject) => {
            imageElement.onload = () => resolve();
            imageElement.onerror = () => reject(new Error('Errore nel caricamento immagine.'));
        });

        const barcodeText = await readerRef.current.decodeFromImageElement(imageElement);
        
        if (barcodeText) {
            onScan(barcodeText.getText());
        } else {
            setError("Nessun codice a barre trovato nell'immagine.");
        }
    } catch (err) {
        console.error('Errore durante la decodifica dell\'immagine:', err);
        setError("Impossibile leggere il codice a barre dall'immagine. Prova con una foto più nitida.");
    } finally {
        // Pulisci l'input file per consentire il ricaricamento dello stesso file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };
  
  // Funzione per riavviare la scansione live
  const startLiveScanner = async () => {
    setIsLiveScanning(true);
    setIsScanning(true);
    setError('');

    if (!videoRef.current || !readerRef.current) return;

    // Funzione interna per avviare la decodifica live
    const decode = async (deviceId: string | null = null, constraints: MediaStreamConstraints | undefined = undefined) => {
        stopLiveScanner();
        
        const controls = await readerRef.current!.decodeFromVideoDevice(
            deviceId,
            videoRef.current as HTMLVideoElement,
            (result) => {
                if (result) {
                    onScan(result.getText());
                }
            },
            constraints
        );
        controlsRef.current = controls;
    };

    try {
        // Tentativo 1: Fotocamera Posteriore (environment) con vincolo 'ideal'
        const environmentConstraints: MediaStreamConstraints = {
            video: { facingMode: { ideal: 'environment' } }, // Usiamo ideal
        };
        await decode(null, environmentConstraints);

    } catch (err: any) {
        // Tentativo 2: Fallback
        try {
            const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
            
            if (videoInputDevices.length === 0) {
                setError('Nessuna fotocamera disponibile');
                return;
            }

            const fallbackDeviceId = videoInputDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('rear')
            )?.deviceId || videoInputDevices[0].deviceId;
            
            await decode(fallbackDeviceId);

        } catch (fallbackErr: any) {
            // Gestione finale degli errori
            if (fallbackErr.name === 'NotAllowedError' || err.name === 'NotAllowedError') {
                setError('Permesso fotocamera negato. Consenti l\'accesso alla fotocamera nelle impostazioni del browser.');
            } else {
                setError('Impossibile avviare la fotocamera. Verifica i permessi.');
            }
        }
    }
  };


  useEffect(() => {
    // 1. Configurazione dei formati per migliorare l'affidabilità della scansione
    const hints = new Map();
    const allowedFormats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.UPC_A,
        BarcodeFormat.CODE_128,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        // Aggiungere altri formati se necessario
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, allowedFormats);
    
    // 2. Inizializza il lettore zxing con i suggerimenti
    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;
    
    startLiveScanner();

    // Funzione di pulizia (cleanup)
    return () => {
      stopLiveScanner();
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

      {/* Video/Image Preview Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-white text-center px-4">
            <p className="mb-4">{error}</p>
            <button
              onClick={error.includes('Permesso') ? onClose : startLiveScanner}
              className="px-6 py-2 bg-white text-black rounded-lg"
            >
              {error.includes('Permesso') ? 'Chiudi' : 'Riprova Scansione Live'}
            </button>
          </div>
        ) : (
          <>
            {/* L'elemento video è usato solo per la scansione live */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!isLiveScanning ? 'hidden' : ''}`}
              playsInline
            />
            
            {/* Overlay di scansione per la modalità live */}
            {isLiveScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-40 border-2 border-white rounded-lg shadow-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                    </div>
                </div>
            )}
            
            {/* Messaggio se non siamo in scansione live */}
            {!isLiveScanning && (
                <div className="text-white text-center px-4">
                    <p className="text-xl">Immagine Caricata</p>
                    <p className="text-sm text-gray-400">Riprova a caricare o avvia la scansione live.</p>
                </div>
            )}
          </>
        )}
      </div>

      {/* Footer/Controls */}
      <div className="bg-gray-900 px-4 py-4 text-center text-white flex justify-around items-center">
        {/* Istruzioni Live / Stato */}
        <p className="flex-1">
            {!error && isLiveScanning ? 'Posiziona il codice a barre nel riquadro' : 'Seleziona un file o riavvia la scansione live.'}
        </p>
        
        {/* Bottone per l'Input File (forza la selezione dalla libreria/galleria) */}
        <input
            type="file"
            accept="image/*"
            capture="user" // Aiuta a suggerire la galleria o la fotocamera frontale (che è meno probabile che venga usata per scattare codici a barre)
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
        />
        <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white text-gray-900 rounded-full hover:bg-gray-200 transition-colors shadow-lg ml-4"
            aria-label="Carica immagine"
        >
            <Image className="w-6 h-6" />
        </button>
        
        {/* Bottone per riattivare la Scansione Live */}
        {!isLiveScanning && !error && (
            <button
                onClick={startLiveScanner}
                 className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg ml-2"
                aria-label="Avvia scansione live"
 >
                 <Camera className="w-6 h-6" />
            </button>
        )}
      </div>
    </div>
  );
}