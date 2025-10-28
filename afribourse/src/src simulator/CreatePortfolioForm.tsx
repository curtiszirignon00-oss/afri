import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PiggyBank, Briefcase } from 'lucide-react';

type CreatePortfolioFormProps = {
  onPortfolioCreated: () => void; // Une fonction pour rafraîchir le dashboard après la création
};

export default function CreatePortfolioForm({ onPortfolioCreated }: CreatePortfolioFormProps) {
  const [selectedBalance, setSelectedBalance] = useState<number>(1000000); // Solde par défaut
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balances = [
    { amount: 10000, label: "Découverte", icon: <PiggyBank className="w-8 h-8 text-blue-500" /> },
    { amount: 10000000, label: "Pro", icon: <Briefcase className="w-8 h-8 text-indigo-500" /> },
  ];

  const handleCreatePortfolio = async () => {
    try {
      setLoading(true);
      setError(null);

      // On récupère l'ID de l'utilisateur actuellement connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié.");

      // On insère le nouveau portefeuille dans la base de données
      const { error: insertError } = await supabase.from('portfolios').insert({
        user_id: user.id,
        name: `Portefeuille de ${user.email?.split('@')[0] || 'l\'investisseur'}`, // Nom par défaut
        initial_balance: selectedBalance,
        cash_balance: selectedBalance, // Au début, les liquidités sont égales au solde initial
      });

      if (insertError) throw insertError;

      // Si tout s'est bien passé, on appelle la fonction pour rafraîchir le dashboard
      onPortfolioCreated();

    } catch (err: any) {
      setError(err.message);
      console.error("Erreur lors de la création du portefeuille:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Créez votre portefeuille virtuel</h2>
      <p className="mb-8 text-gray-600">Choisissez votre capital de départ pour commencer à simuler vos investissements.</p>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {balances.map(balance => (
          <button
            key={balance.amount}
            onClick={() => setSelectedBalance(balance.amount)}
            className={`p-6 border-2 rounded-lg transition-all ${selectedBalance === balance.amount ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'}`}
          >
            {balance.icon}
            <p className="font-bold text-xl mt-2 text-gray-800">
              {balance.amount.toLocaleString('fr-FR')} XOF
            </p>
            <p className="text-sm text-gray-500">{balance.label}</p>
          </button>
        ))}
      </div>

      <button 
        onClick={handleCreatePortfolio}
        disabled={loading}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Création en cours...' : 'Commencer la simulation'}
      </button>

      {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
    </div>
  );
}