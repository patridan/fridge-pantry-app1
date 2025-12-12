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
      {sortedProducts.map((product) => {
        const isFridge = product.storageType === 'frigo';
        const cardBgClass = isFridge 
          ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200' 
          : 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200';
        
        return (
          <div
            key={product.id}
            className={`${cardBgClass} rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all`}
          >
            {/* Product Image */}
            {product.image && (
              <div className="mb-3 rounded-xl overflow-hidden shadow-md">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
            
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className={isFridge ? 'text-cyan-900' : 'text-amber-900'}>{product.name}</h3>
                <div className={`flex items-center gap-2 ${isFridge ? 'text-cyan-700' : 'text-amber-700'}`}>
                  <Package className="w-4 h-4" />
                  <span className="text-sm">{product.category}</span>
                </div>
                {product.barcode && (
                  <div className={`text-xs mt-1 ${isFridge ? 'text-cyan-600' : 'text-amber-600'}`}>
                    Codice: {product.barcode}
                  </div>
                )}
              </div>
              <button
                onClick={() => onDelete(product.id)}
                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                aria-label="Elimina prodotto"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Storage Type Badge */}
              <div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm shadow-sm ${
                  isFridge 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-amber-600 text-white'
                }`}>
                  {isFridge ? '❄️ Frigorifero' : '📦 Dispensa'}
                </span>
              </div>

              {/* Expiry Date */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm ${getExpiryColor(product.expiryDate)}`}>
                <Calendar className="w-4 h-4" />
                <div className="flex-1">
                  <p className="text-sm">{getExpiryText(product.expiryDate)}</p>
                  <p className="text-xs opacity-75">
                    {new Date(product.expiryDate).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className={`flex items-center justify-between rounded-xl p-3 shadow-sm ${
                isFridge ? 'bg-cyan-100/50' : 'bg-amber-100/50'
              }`}>
                <button
                  onClick={() => onUpdateQuantity(product.id, Math.max(0, product.quantity - 1))}
                  className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  disabled={product.quantity <= 0}
                  aria-label="Diminuisci quantità"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <p className={isFridge ? 'text-cyan-900' : 'text-amber-900'}>{product.quantity}</p>
                  <p className={`text-xs ${isFridge ? 'text-cyan-600' : 'text-amber-600'}`}>{product.unit}</p>
                </div>
                <button
                  onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
                  className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg transition-colors shadow-sm"
                  aria-label="Aumenta quantità"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}