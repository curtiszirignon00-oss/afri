// src/components/ProfilePage.tsx - VERSION MIGRÉE
import { useState, useEffect } from 'react';
import { User, Target, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import { useUserProfile, useUpdateProfile } from '../hooks/useApi';
import { Button, Input, Card, LoadingSpinner, ErrorMessage } from './ui';

type ProfilePageProps = {
  onNavigate: (page: string) => void;
};

const countries = ['Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo', 'Autre'];
const goalOptions = ['Apprendre les bases', 'Préparer ma retraite/un projet', 'Générer un revenu complémentaire', 'Suivre l\'actualité', 'Curiosité'];

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  // ✅ React Query hooks
  const { data: profile, isLoading, error, refetch } = useUserProfile();
  const updateProfile = useUpdateProfile();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hasInvested, setHasInvested] = useState<string>('');
  const [knowledgeLevel, setKnowledgeLevel] = useState('');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [profileType, setProfileType] = useState('');

  // ✅ Charger les données du profil
  useEffect(() => {
    if (profile) {
      setFirstName(profile.name || '');
      setLastName(profile.lastname || '');
      setCountry(profile.country || '');
      setBirthDate(profile.birth_date ? profile.birth_date.split('T')[0] : '');
      setHasInvested(profile.has_invested === true ? 'Oui' : profile.has_invested === false ? 'Non' : '');
      setKnowledgeLevel(profile.experience_level || '');
      setMainGoals(profile.main_goals || []);
      setMonthlyAmount(profile.monthly_amount || '');
      setProfileType(profile.profile_type || '');
    }
  }, [profile]);

  const toggleGoal = (goal: string) => {
    setMainGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  // ✅ Sauvegarder avec React Query mutation
  async function handleSave() {
    try {
      await updateProfile.mutateAsync({
        name: firstName || null,
        lastname: lastName || null,
        country: country || null,
        birth_date: birthDate || null,
        has_invested: hasInvested === 'Oui' ? true : hasInvested === 'Non' ? false : null,
        experience_level: knowledgeLevel || null,
        main_goals: mainGoals.length > 0 ? mainGoals : null,
        monthly_amount: monthlyAmount || null,
        profile_type: profileType || null,
      });
      setTimeout(() => onNavigate('dashboard'), 1000);
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
    }
  }

  // ✅ Loading state
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Chargement du profil..." />;
  }

  // ✅ Error state
  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="Impossible de charger votre profil"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="flex justify-end mb-6">
          {/* ✅ Button remplace button manuel */}
          <Button variant="ghost" onClick={() => onNavigate('dashboard')}>
            Retour Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Mon Profil</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complétez ou mettez à jour vos informations pour une expérience personnalisée.
          </p>
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Personal Info */}
          {/* ✅ Card remplace div bg-white */}
          <Card>
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Informations Personnelles</h2>
            </div>
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                {/* ✅ Input remplace input manuel */}
                <Input
                  type="text"
                  label="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                />
                <Input
                  type="text"
                  label="Nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Pays de résidence
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionnez votre pays</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <Input
                type="date"
                label="Date de naissance"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                icon={<Calendar className="w-5 h-5 text-gray-400" />}
              />
            </div>
          </Card>

          {/* Investor Profile */}
          <Card>
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Profil d'Investisseur</h2>
            </div>
            <div className="space-y-6">
              {/* Has Invested */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Avez-vous déjà investi ?
                </legend>
                <div className="flex gap-4">
                  {['Oui', 'Non'].map(o => (
                    <label key={o} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasInvested"
                        value={o}
                        checked={hasInvested === o}
                        onChange={e => setHasInvested(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Knowledge Level */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Quel est votre niveau de connaissance en investissement ?
                </legend>
                <div className="flex flex-col sm:flex-row gap-4">
                  {['Débutant', 'Intermédiaire', 'Avancé'].map(o => (
                    <label key={o} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="knowledgeLevel"
                        value={o}
                        checked={knowledgeLevel === o}
                        onChange={e => setKnowledgeLevel(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Main Goals */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Quels sont vos principaux objectifs en utilisant AfriBourse ? (Plusieurs choix possibles)
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goalOptions.map(g => (
                    <label key={g} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mainGoals.includes(g)}
                        onChange={() => toggleGoal(g)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Monthly Amount */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Quel montant envisagez-vous d'investir mensuellement ?
                </legend>
                <div className="flex flex-col sm:flex-row gap-4">
                  {['Moins de 50 000 FCFA', '50k - 250k FCFA', '+250k FCFA', 'Pas encore décidé'].map(o => (
                    <label key={o} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="monthlyAmount"
                        value={o}
                        checked={monthlyAmount === o}
                        onChange={e => setMonthlyAmount(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Profile Type */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Quel est votre profil professionnel principal ?
                </legend>
                <div className="flex flex-col sm:flex-row gap-4">
                  {['Salarié(e)', 'Entrepreneur / Indépendant(e)', 'Étudiant(e)', 'Autre'].map(o => (
                    <label key={o} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="profileType"
                        value={o}
                        checked={profileType === o}
                        onChange={e => setProfileType(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 text-center">
          {/* ✅ Button remplace button manuel */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            isLoading={updateProfile.isPending}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </Button>
        </div>
      </div>
    </div>
  );
}