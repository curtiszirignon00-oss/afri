import { useState, useEffect } from 'react';
import { User, Target, ArrowRight, Calendar, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
// import { supabase } from '../lib/supabase'; // <-- REMOVE Supabase
import toast from 'react-hot-toast';

// --- Type Definitions (Reflect backend data structure) ---
type UserProfileData = {
    // Fields from User model (from /api/users/me)
    id: string;
    email: string;
    name: string | null; // This is 'first_name' essentially
    lastname: string | null; // This is 'last_name'
    // Fields from UserProfile model (nested or flattened by backend)
    first_name?: string | null; // Might be redundant if 'name' is used
    last_name?: string | null; // Might be redundant if 'lastname' is used
    country: string | null;
    birth_date: string | null; // Date comes as ISO string
    has_invested: boolean | null; // Use boolean
    experience_level: string | null; // Use correct field name from schema
    main_goals: string[] | null;
    monthly_amount: string | null;
    profile_type: string | null;
    // Add phone_number, avatar_url etc. if used
};
// --- End Types ---


type ProfilePageProps = {
  onNavigate: (page: string) => void;
};

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if needed

const countries = [ 'Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo', 'Autre' ];
const goalOptions = [ 'Apprendre les bases', 'Préparer ma retraite/un projet', 'Générer un revenu complémentaire', 'Suivre l\'actualité', 'Curiosité' ];

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  // State for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState(''); // Store as YYYY-MM-DD string
  const [hasInvested, setHasInvested] = useState<string>(''); // Store as 'Oui'/'Non' string for radio buttons
  const [knowledgeLevel, setKnowledgeLevel] = useState('');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [profileType, setProfileType] = useState('');

  // Component states
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- UPDATED useEffect to load profile ---
  useEffect(() => {
    async function loadProfile() {
        setLoading(true);
        setError(null);
      try {
        // Fetch user and profile data from /api/users/me
        const response = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });

        if (response.status === 401) {
            toast.error("Veuillez vous reconnecter pour voir votre profil.");
            onNavigate('login');
            return;
        }
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: Impossible de charger le profil.`);
        }

        const data: UserProfileData = await response.json();

        // Update state based on fetched data
        setFirstName(data.name || data.first_name || ''); // Use 'name' or 'first_name'
        setLastName(data.lastname || data.last_name || ''); // Use 'lastname' or 'last_name'
        setCountry(data.country || '');
        // Format date from ISO string to YYYY-MM-DD for the input type="date"
        setBirthDate(data.birth_date ? data.birth_date.split('T')[0] : '');
        // Convert boolean back to string for radio buttons
        setHasInvested(data.has_invested === true ? 'Oui' : data.has_invested === false ? 'Non' : '');
        setKnowledgeLevel(data.experience_level || ''); // Use correct field name
        setMainGoals(data.main_goals || []);
        setMonthlyAmount(data.monthly_amount || '');
        setProfileType(data.profile_type || '');

      } catch (err: any) {
        console.error("Erreur de chargement du profil:", err);
        setError(err.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [onNavigate]); // Added onNavigate dependency
  // --- END UPDATED useEffect ---


  const toggleGoal = (goal: string) => {
    setMainGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  // --- UPDATED handleSave function ---
  async function handleSave() {
    setSaving(true);
    setError(null);
    const toastId = toast.loading('Sauvegarde en cours...');
    try {
        // Prepare data matching backend expectations
        const profileUpdateData = {
            // Send 'name' and 'lastname' OR 'first_name' and 'last_name'
            // depending on what your UserProfile model uses
            name: firstName || null, // Or use first_name
            lastname: lastName || null, // Or use last_name
            first_name: firstName || null, // Example if UserProfile uses these
            last_name: lastName || null, // Example if UserProfile uses these
            country: country || null,
            birth_date: birthDate || null, // Send YYYY-MM-DD string
            // Send 'Oui'/'Non' string, backend service will convert
            has_invested: hasInvested || null, 
            experience_level: knowledgeLevel || null, // Use correct field name
            main_goals: mainGoals.length > 0 ? mainGoals : null,
            monthly_amount: monthlyAmount || null,
            profile_type: profileType || null,
        };

      // Call the backend update endpoint
      const response = await fetch(`${API_BASE_URL}/users/me/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send auth cookie
        body: JSON.stringify(profileUpdateData),
      });

      const result = await response.json();

      if (!response.ok) {
          throw new Error(result.message || 'Erreur lors de la sauvegarde');
      }

      toast.success("Profil sauvegardé avec succès !", { id: toastId });
      setTimeout(() => {
        onNavigate('dashboard'); // Navigate back after success
      }, 1000);

    } catch (error: any) {
        console.error("Erreur sauvegarde profil:", error);
        toast.error(`Erreur : ${error.message}`, { id: toastId });
        setError(error.message); // Show error inline
    } finally {
        setSaving(false); // Ensure button is re-enabled
    }
  }
  // --- END UPDATED handleSave function ---


  // --- Loading/Error States ---
  if (loading) { /* ... loading spinner ... */ }
  // You might want a specific error display here too
  if (error && !loading) { /* ... error display ... */ }
  // --- End States ---


  // --- JSX (Ensure input names/values match state variables) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="flex justify-end mb-6"><button onClick={() => onNavigate('dashboard')} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 group"><span>Retour Dashboard</span><ArrowRight className="w-4 h-4" /></button></div>
        
        {/* Header */}
        <div className="text-center mb-12"><h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Mon Profil</h1><p className="text-lg text-gray-600 max-w-2xl mx-auto">Complétez ou mettez à jour vos informations pour une expérience personnalisée.</p></div>
        
        {/* Form Sections */}
        <div className="space-y-8">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4"><div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-blue-600" /></div><h2 className="text-xl font-bold text-gray-900">Informations Personnelles</h2></div>
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div><label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label><input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Votre prénom" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/></div>
                <div><label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label><input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Votre nom" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/></div>
              </div>
              <div><label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-1.5">Pays de résidence</label><select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"><option value="">Sélectionnez votre pays</option>{countries.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label htmlFor="birthDate" className="block text-sm font-semibold text-gray-700 mb-1.5">Date de naissance</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" /><input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/></div></div>
            </div>
          </div>

          {/* Investor Profile */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4"><div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><Target className="w-5 h-5 text-green-600" /></div><h2 className="text-xl font-bold text-gray-900">Profil d'Investisseur</h2></div>
            <div className="space-y-6">
              {/* Has Invested */}
              <fieldset><legend className="block text-sm font-semibold text-gray-700 mb-2">Avez-vous déjà investi ?</legend><div className="flex gap-4">{['Oui', 'Non'].map(o => <label key={o} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="hasInvested" value={o} checked={hasInvested === o} onChange={e => setHasInvested(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500"/><span>{o}</span></label>)}</div></fieldset>
              {/* Knowledge Level */}
              <fieldset><legend className="block text-sm font-semibold text-gray-700 mb-2">Quel est votre niveau de connaissance en investissement ?</legend><div className="flex flex-col sm:flex-row gap-4">{['Débutant', 'Intermédiaire', 'Avancé'].map(o => <label key={o} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="knowledgeLevel" value={o} checked={knowledgeLevel === o} onChange={e => setKnowledgeLevel(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500"/><span>{o}</span></label>)}</div></fieldset>
              {/* Main Goals */}
              <fieldset><legend className="block text-sm font-semibold text-gray-700 mb-2">Quels sont vos principaux objectifs en utilisant AfriBourse ? (Plusieurs choix possibles)</legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{goalOptions.map(g => <label key={g} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={mainGoals.includes(g)} onChange={() => toggleGoal(g)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/><span>{g}</span></label>)}</div></fieldset>
              {/* Monthly Amount */}
              <fieldset><legend className="block text-sm font-semibold text-gray-700 mb-2">Quel montant envisagez-vous d'investir mensuellement ?</legend><div className="flex flex-col sm:flex-row gap-4">{['Moins de 50 000 FCFA', '50k - 250k FCFA', '+250k FCFA', 'Pas encore décidé'].map(o => <label key={o} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="monthlyAmount" value={o} checked={monthlyAmount === o} onChange={e => setMonthlyAmount(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500"/><span>{o}</span></label>)}</div></fieldset>
              {/* Profile Type */}
              <fieldset><legend className="block text-sm font-semibold text-gray-700 mb-2">Quel est votre profil professionnel principal ?</legend><div className="flex flex-col sm:flex-row gap-4">{['Salarié(e)', 'Entrepreneur / Indépendant(e)', 'Étudiant(e)', 'Autre'].map(o => <label key={o} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="profileType" value={o} checked={profileType === o} onChange={e => setProfileType(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500"/><span>{o}</span></label>)}</div></fieldset>
            </div>
          </div>
        </div>

        {/* Save Button & Error */}
        <div className="mt-8 text-center">
            {error && (
                 <div className="mb-4 inline-block bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                   <AlertTriangle className="w-4 h-4 inline mr-1 align-text-bottom"/> {error}
                 </div>
            )}
            <div>
                <button onClick={handleSave} disabled={saving || loading} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}