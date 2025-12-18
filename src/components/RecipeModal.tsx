// src/components/RecipeModal.tsx
import React, { useState } from 'react';
import { Utensils, Sparkles, X, Check } from 'lucide-react';
import { Product } from '../types';
import { getRecipeFromAI } from '../services/aiService';

interface RecipeModalProps {
  products: Product[];
  onClose: () => void;
}

export function RecipeModal({ products, onClose }: RecipeModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const names = products
        .filter(p => selectedIds.includes(p.id))
        .map(p => p.name);
      const result = await getRecipeFromAI(names);
      setRecipe(result);
    } catch (error) {
      alert("Errore nella generazione. Riprova!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-orange-100">
        
        {/* Header Arancione */}
        <div className="p-6 text-white flex justify-between items-center" style={{ backgroundColor: '#ea580c' }}>
          <div className="flex items-center gap-2">
            <Utensils className="w-6 h-6" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Chef AI</h2>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!recipe ? (
            <>
              <p className="text-gray-600 mb-4 font-bold">Cosa vuoi usare oggi?</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {products.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      style={{ 
                        backgroundColor: isSelected ? '#fff7ed' : '#f8fafc',
                        borderColor: isSelected ? '#ea580c' : '#e2e8f0',
                        color: isSelected ? '#ea580c' : '#64748b'
                      }}
                      className="px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-sm shadow-sm"
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="p-5 rounded-3xl border-2 border-orange-100 bg-orange-50/50">
                <h3 className="text-2xl font-black text-orange-700 leading-tight">{recipe.titolo}</h3>
                <div className="flex gap-4 mt-3 text-sm font-bold text-orange-600">
                  <span className="bg-white px-3 py-1 rounded-full shadow-sm">⏱ {recipe.tempo}</span>
                  <span className="bg-white px-3 py-1 rounded-full shadow-sm">📊 {recipe.difficolta}</span>
                </div>
              </div>
              <div className="p-2">
                <h4 className="font-black text-gray-800 mb-2 uppercase text-xs tracking-widest">Procedimento:</h4>
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{recipe.procedimento}</p>
              </div>
              <button 
                onClick={() => setRecipe(null)}
                className="text-orange-600 font-black text-xs uppercase underline w-full text-center py-4"
              >
                ← Prova con altri ingredienti
              </button>
            </div>
          )}
        </div>

        {/* Footer con tasto Genera Arancione */}
        {!recipe && (
          <div className="p-6 border-t bg-gray-50">
            <button
              onClick={handleGenerate}
              disabled={loading || selectedIds.length === 0}
              style={{ backgroundColor: '#ea580c' }}
              className="w-full text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg hover:brightness-110 disabled:opacity-30 disabled:grayscale"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sto pensando...
                </span>
              ) : (
                <><Sparkles className="w-5 h-5" /> GENERA RICETTA</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}