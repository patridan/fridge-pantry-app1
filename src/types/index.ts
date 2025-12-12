export type StorageType = "frigo" | "dispensa";

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  storageType: StorageType;
  image?: string; // Base64 encoded image or URL
  barcode?: string; // Barcode number if scanned
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  completed: boolean;
  addedAt: string;
}