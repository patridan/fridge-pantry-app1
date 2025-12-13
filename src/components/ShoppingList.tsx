import { useState } from 'react';
import { Plus, X, Check, Trash2 } from 'lucide-react';
import { ShoppingItem } from '../types';

interface ShoppingListProps {
  items: ShoppingItem[];
  onAdd: (name: string, quantity?: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export function ShoppingList({ items, onAdd, onToggle, onDelete }: ShoppingListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  const handleAdd = () => {
    if (newItemName.trim()) {
      onAdd(newItemName.trim(), newItemQuantity.trim() || undefined);
      setNewItemName('');
      setNewItemQuantity('');
      setIsAdding(false);
    }
  };

  const handleDeleteWithConfirm = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      onDelete(id);
    }
  };

  const activeItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-amber-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-amber-900">Lista della Spesa</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-lg transition-colors"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-amber-200">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome prodotto"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Quantità (opzionale)"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition-colors"
            >
              Aggiungi
            </button>
          </div>
        </div>
      )}

      {/* Active Items */}
      {activeItems.length > 0 && (
        <div className="space-y-2 mb-4">
          {activeItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-amber-100 hover:shadow-md transition-shadow group"
            >
              <button
                onClick={() => onToggle(item.id, true)}
                className="flex-shrink-0 w-6 h-6 border-2 border-amber-400 rounded-full hover:bg-amber-100 transition-colors"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900">{item.name}</p>
                {item.quantity && (
                  <p className="text-gray-500">{item.quantity}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteWithConfirm(item.id)}
                className="flex-shrink-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className="pt-4 border-t-2 border-amber-200">
          <p className="text-amber-700 mb-3">Completati</p>
          <div className="space-y-2">
            {completedItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-amber-100/50 rounded-xl border border-amber-200 group"
              >
                <button
                  onClick={() => onToggle(item.id, false)}
                  className="flex-shrink-0 w-6 h-6 bg-green-500 border-2 border-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4 text-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 line-through">{item.name}</p>
                  {item.quantity && (
                    <p className="text-gray-400 line-through">{item.quantity}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteWithConfirm(item.id)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 opacity-100 transition-opacity"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-amber-600">Nessun prodotto da acquistare</p>
          <p className="text-amber-500 mt-1">Clicca + per aggiungere</p>
        </div>
      )}
    </div>
  );
}
