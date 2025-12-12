import { useState } from 'react';
import { Refrigerator, LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-sky-100 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-white">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-cyan-500 to-sky-600 rounded-2xl p-4 mb-4 shadow-lg">
            <Refrigerator className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-gray-900 text-center mb-2">Frigorifero & Dispensa</h1>
          <p className="text-gray-600 text-center">Gestisci i tuoi prodotti facilmente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 mb-2">
              Username o ID Utente
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Inserisci il tuo username"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Accedi
          </button>
        </form>

        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-sky-50 rounded-xl border border-cyan-200">
          <p className="text-cyan-800 text-center">
            I dati vengono sincronizzati sul cloud
          </p>
        </div>
      </div>
    </div>
  );
}