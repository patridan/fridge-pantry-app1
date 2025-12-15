import React, { useEffect, useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

interface Props {
  onScan: (text: string) => void;
}

export const BarcodeScannerComponentWrapper: React.FC<Props> = ({ onScan }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay minimo per assicurarsi che il div sia montato e visibile
    const id = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;

  return (
    <BarcodeScannerComponent
      width={300}
      height={300}
      onUpdate={(err, result) => {
        if (result) onScan(result.getText());
      }}
    />
  );
};
