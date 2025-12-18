import { LogOut, Plus, ShoppingCart, Utensils } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Product, ShoppingItem, StorageType } from '../types';
import * as api from '../utils/api';
import { AddProductModal } from './AddProductModal';
import { ProductList } from './ProductList';
import { ShoppingList } from './ShoppingList';
import { RecipeModal } from './RecipeModal';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

export function Dashboard({ username, onLogout }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StorageType | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    loadShoppingList();
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

  const loadShoppingList = async () => {
    try {
      const items = await api.getShoppingList(username);
      setShoppingItems(items);
    } catch (err) {
      console.error('Failed to load shopping list:', err);
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

  const handleAddShoppingItem = async (name: string, quantity?: string) => {
    try {
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name,
        quantity,
        completed: false,
        addedAt: new Date().toISOString(),
      };
      await api.addShoppingItem(username, newItem);
      setShoppingItems([...shoppingItems, newItem]);
    } catch (err) {
      console.error('Failed to add shopping item:', err);
      alert('Errore nell\'aggiunta dell\'articolo. Riprova.');
    }
  };

  const handleToggleShoppingItem = async (id: string, completed: boolean) => {
    try {
      await api.toggleShoppingItem(username, id, completed);
      setShoppingItems(shoppingItems.map(item => 
        item.id === id ? { ...item, completed } : item
      ));
    } catch (err) {
      console.error('Failed to toggle shopping item:', err);
      alert('Errore nell\'aggiornamento dell\'articolo. Riprova.');
    }
  };

  const handleDeleteShoppingItem = async (id: string) => {
    try {
      await api.deleteShoppingItem(username, id);
      setShoppingItems(shoppingItems.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete shopping item:', err);
      alert('Errore nell\'eliminazione dell\'articolo. Riprova.');
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.storageType === selectedCategory);

  const fridgeCount = products.filter(p => p.storageType === 'frigo').length;
  const pantryCount = products.filter(p => p.storageType === 'dispensa').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-600 to-sky-600 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-bold">Frigorifero & Dispensa</h1>
              <p className="text-cyan-100 text-sm">Bentornato, {username}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowShoppingList(!showShoppingList)}
                className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">Lista Spesa</span>
                {shoppingItems.filter(i => !i.completed).length > 0 && (
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs">
                    {shoppingItems.filter(i => !i.completed).length}
                  </span>
                )}
              </button>
              <button
                onClick={onLogout}
                className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Esci</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {showShoppingList && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <ShoppingList
              items={shoppingItems}
              onAdd={handleAddShoppingItem}
              onToggle={handleToggleShoppingItem}
              onDelete={handleDeleteShoppingItem}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div 
                onClick={() => setSelectedCategory('all')}
                className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg cursor-pointer transition-all border-2 ${
                  selectedCategory === 'all' ? 'ring-2 ring-cyan-500 border-cyan-400 shadow-cyan-200' : 'border-transparent hover:shadow-xl'
                }`}
              >
                <p className="text-gray-600 mb-1 text-sm font-medium">Totale Prodotti</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <div 
                onClick={() => setSelectedCategory('frigo')}
                className={`bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl shadow-lg cursor-pointer transition-all border-2 ${
                  selectedCategory === 'frigo' ? 'ring-2 ring-cyan-500 border-cyan-400 shadow-cyan-200' : 'border-cyan-200 hover:shadow-xl'
                }`}
              >
                <p className="text-cyan-700 mb-1 text-sm font-medium">In Frigorifero</p>
                <p className="text-2xl font-bold text-cyan-600">{fridgeCount}</p>
              </div>
              <div 
                onClick={() => setSelectedCategory('dispensa')}
                className={`bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl shadow-lg cursor-pointer transition-all border-2 ${
                  selectedCategory === 'dispensa' ? 'ring-2 ring-amber-500 border-amber-400 shadow-amber-200' : 'border-amber-200 hover:shadow-xl'
                }`}
              >
                <p className="text-amber-700 mb-1 text-sm font-medium">In Dispensa</p>
                <p className="text-2xl font-bold text-amber-600">{pantryCount}</p>
              </div>
            </div>

            {/* Pulsanti di Azione */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 bg-white border-2 border-cyan-600 text-cyan-700 hover:bg-cyan-50 px-6 py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 font-bold"
              >
                <Plus className="w-5 h-5" />
                Aggiungi Prodotto
              </button>
              
              <div className="relative flex-1 group">
                {/* Badge AI */}
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-3 py-1 rounded-full z-10 animate-bounce shadow-lg font-black border border-white uppercase">
                  AI Magic
                </span>
                
                {/* TASTO ARANCIONE FORZATO */}
                <button
                  onClick={() => setIsRecipeModalOpen(true)}
                  style={{ 
                    backgroundColor: '#ea580c', 
                    borderBottom: '4px solid #9a3412',
                    boxShadow: '0 10px 15px -3px rgba(234, 88, 12, 0.4)' 
                  }}
                  className="w-full text-white px-6 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 font-extrabold"
                >
                  <Utensils className="w-6 h-6 text-white" />
                  <span className="uppercase tracking-wider text-lg text-white">Cosa cucino oggi?</span>
                </button>
              </div>
            </div>

            <ProductList
              products={filteredProducts}
              onDelete={handleDeleteProduct}
              onUpdateQuantity={handleUpdateQuantity}
            />

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl">
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

      {isAddModalOpen && (
        <AddProductModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddProduct}
        />
      )}

      {isRecipeModalOpen && (
        <RecipeModal
          products={products}
          onClose={() => setIsRecipeModalOpen(false)}
        />
      )}
    </div>
  );
}