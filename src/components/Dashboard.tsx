import { useState, useEffect } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { ProductList } from './ProductList';
import { AddProductModal } from './AddProductModal';
import { Product, StorageType } from '../types';
import * as api from '../utils/api';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

export function Dashboard({ username, onLogout }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StorageType | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load products from server
    loadProducts();
  }, [username]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProducts = await api.getProducts(username);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Errore nel caricamento dei prodotti. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct: Product = {
        ...product,
        id: Date.now().toString(),
      };
      await api.addProduct(username, newProduct);
      setProducts([...products, newProduct]);
    } catch (err) {
      console.error('Failed to add product:', err);
      alert('Errore nell\'aggiunta del prodotto. Riprova.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(username, id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Errore nell\'eliminazione del prodotto. Riprova.');
    }
  };

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    try {
      await api.updateProductQuantity(username, id, newQuantity);
      setProducts(products.map(p => 
        p.id === id ? { ...p, quantity: newQuantity } : p
      ));
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert('Errore nell\'aggiornamento della quantità. Riprova.');
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.storageType === selectedCategory);

  const fridgeCount = products.filter(p => p.storageType === 'frigo').length;
  const pantryCount = products.filter(p => p.storageType === 'dispensa').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">Frigorifero & Dispensa</h1>
              <p className="text-gray-600 mt-1">Bentornato, {username}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Esci
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div 
                onClick={() => setSelectedCategory('all')}
                className={`bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all ${
                  selectedCategory === 'all' ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'
                }`}
              >
                <p className="text-gray-600 mb-1">Totale Prodotti</p>
                <p className="text-gray-900">{products.length}</p>
              </div>
              <div 
                onClick={() => setSelectedCategory('frigo')}
                className={`bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all ${
                  selectedCategory === 'frigo' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
              >
                <p className="text-gray-600 mb-1">In Frigorifero</p>
                <p className="text-blue-600">{fridgeCount}</p>
              </div>
              <div 
                onClick={() => setSelectedCategory('dispensa')}
                className={`bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all ${
                  selectedCategory === 'dispensa' ? 'ring-2 ring-amber-500' : 'hover:shadow-md'
                }`}
              >
                <p className="text-gray-600 mb-1">In Dispensa</p>
                <p className="text-amber-600">{pantryCount}</p>
              </div>
            </div>

            {/* Add Button */}
            <div className="mb-6">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Aggiungi Prodotto
              </button>
            </div>

            {/* Products List */}
            <ProductList
              products={filteredProducts}
              onDelete={handleDeleteProduct}
              onUpdateQuantity={handleUpdateQuantity}
            />

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {selectedCategory === 'all' 
                    ? 'Nessun prodotto ancora. Aggiungi il primo!' 
                    : `Nessun prodotto in ${selectedCategory === 'frigo' ? 'frigorifero' : 'dispensa'}`}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <AddProductModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddProduct}
        />
      )}
    </div>
  );
}