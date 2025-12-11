import { Trash2, Minus, Plus, Calendar, Package } from 'lucide-react';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  onDelete: (id: string) => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}

export function ProductList({ products, onDelete, onUpdateQuantity }: ProductListProps) {
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return 'text-red-600 bg-red-50';
    if (days <= 3) return 'text-orange-600 bg-orange-50';
    if (days <= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getExpiryText = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return 'Scaduto';
    if (days === 0) return 'Scade oggi';
    if (days === 1) return 'Scade domani';
    return `${days} giorni`;
  };

  const sortedProducts = [...products].sort((a, b) => {
    const daysA = getDaysUntilExpiry(a.expiryDate);
    const daysB = getDaysUntilExpiry(b.expiryDate);
    return daysA - daysB;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedProducts.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          {/* Product Image */}
          {product.image && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover"
              />
            </div>
          )}
          
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-gray-900 mb-1">{product.name}</h3>
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-4 h-4" />
                <span className="text-sm">{product.category}</span>
              </div>
              {product.barcode && (
                <div className="text-xs text-gray-500 mt-1">
                  Codice: {product.barcode}
                </div>
              )}
            </div>
            <button
              onClick={() => onDelete(product.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Elimina prodotto"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Storage Type Badge */}
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                product.storageType === 'frigo' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {product.storageType === 'frigo' ? '❄️ Frigorifero' : '📦 Dispensa'}
              </span>
            </div>

            {/* Expiry Date */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getExpiryColor(product.expiryDate)}`}>
              <Calendar className="w-4 h-4" />
              <div className="flex-1">
                <p className="text-sm">{getExpiryText(product.expiryDate)}</p>
                <p className="text-xs opacity-75">
                  {new Date(product.expiryDate).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <button
                onClick={() => onUpdateQuantity(product.id, Math.max(0, product.quantity - 1))}
                className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg transition-colors disabled:opacity-50"
                disabled={product.quantity <= 0}
                aria-label="Diminuisci quantità"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-gray-900">{product.quantity}</p>
                <p className="text-gray-500 text-xs">{product.unit}</p>
              </div>
              <button
                onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
                className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg transition-colors"
                aria-label="Aumenta quantità"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}