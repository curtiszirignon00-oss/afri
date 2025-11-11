// src/components/ProfilePage.tsx - VERSION AMÉLIORÉE
import { useState, useEffect } from 'react';
import { User, Target, ArrowRight, Calendar, BookOpen, TrendingUp, Megaphone, Star } from 'lucide-react';
import { useUserProfile, useUpdateProfile } from '../hooks/useApi';
import { Button, Input, Card, LoadingSpinner, ErrorMessage } from './ui';

type ProfilePageProps = {
  onNavigate: (page: string) => void;
};

const countries = ['Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo', 'Autre'];
const goalOptions = ['Apprendre les bases', 'Préparer ma retraite/un projet', 'Générer un revenu complémentaire', 'Suivre l\'actualité', 'Curiosité'];

// <-- AJOUT: Nouvelles options pour les questions supplémentaires
const topicInterests = [
  'Analyse Fondamentale (PER, ROE)',
  'Analyse Technique (Graphiques)',
  'Stratégies de Dividendes',
  'Obligations',
  'Actualités Économiques',
  'Fiscalité des investissements'
];

const discoveryChannels = [
  'Recommandation',
  'Réseaux sociaux (LinkedIn, FB...)',
  'Recherche Google',
  'Publicité',
  'Média en ligne'
];

const keyFeatures = [
  'La qualité des formations',
  'La précision du simulateur',
  'Les données de marché en temps réel',
  'Les analyses d\'experts'
];

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  // ✅ React Query hooks
  const { data: profile, isLoading, error, refetch } = useUserProfile();
  const updateProfile = useUpdateProfile();

  // Debug logs
  useEffect(() => {
    console.log('👤 [PROFILE] Loading state:', isLoading);
    console.log('👤 [PROFILE] Error:', error);
    console.log('👤 [PROFILE] Profile data:', profile);
  }, [isLoading, error, profile]);

  // Form state - Questions existantes
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // <-- AJOUT: Numéro de téléphone
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hasInvested, setHasInvested] = useState<string>('');
  const [knowledgeLevel, setKnowledgeLevel] = useState('');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [profileType, setProfileType] = useState('');

  // <-- AJOUT: États pour les nouvelles questions
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]); // Choix multiples
  const [discoveryChannel, setDiscoveryChannel] = useState(''); // Choix unique
  const [keyFeature, setKeyFeature] = useState(''); // Choix unique

  // ✅ Charger les données du profil
  useEffect(() => {
    if (profile) {
      setFirstName(profile.name || '');
      setLastName(profile.lastname || '');
      setPhoneNumber((profile as any).telephone || (profile as any).phone_number || ''); // <-- AJOUT
      setCountry(profile.country || '');
      setBirthDate(profile.birth_date ? profile.birth_date.split('T')[0] : '');
      setHasInvested(profile.has_invested === true ? 'Oui' : profile.has_invested === false ? 'Non' : '');
      setKnowledgeLevel(profile.experience_level || '');
      setMainGoals(profile.main_goals || []);
      setMonthlyAmount(profile.monthly_amount || '');
      setProfileType(profile.profile_type || '');

      // <-- AJOUT: Charger les nouvelles données si elles existent
      setSelectedTopics((profile as any).topic_interests || []);
      setDiscoveryChannel((profile as any).discovery_channel || '');
      setKeyFeature((profile as any).key_feature || '');
    }
  }, [profile]);

  const toggleGoal = (goal: string) => {
    setMainGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  // <-- AJOUT: Fonction pour gérer les sujets d'intérêt (choix multiples)
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  // ✅ Sauvegarder avec React Query mutation
  async function handleSave() {
    try {
      // <-- CORRECTION: Inclure les nouvelles données dans la sauvegarde
      await updateProfile.mutateAsync({
        name: firstName || null,
        lastname: lastName || null,
        telephone: phoneNumber || null, // <-- AJOUT
        country: country || null,
        birth_date: birthDate || null,
        has_invested: hasInvested === 'Oui' ? true : hasInvested === 'Non' ? false : null,
        experience_level: knowledgeLevel || null,
        main_goals: mainGoals.length > 0 ? mainGoals : null,
        monthly_amount: monthlyAmount || null,
        profile_type: profileType || null,
        // <-- AJOUT: Nouvelles données à sauvegarder
        topic_interests: selectedTopics.length > 0 ? selectedTopics : null,
        discovery_channel: discoveryChannel || null,
        key_feature: keyFeature || null,
      } as any);
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
    console.error('❌ [PROFILE] Error rendering:', error);
    return (
      <ErrorMessage
        fullScreen
        message={`Impossible de charger votre profil: ${(error as any)?.message || 'Erreur inconnue'}`}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="flex justify-end mb-6">
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
          
          {/* 1. Personal Info */}
          <Card>
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Informations Personnelles</h2>
            </div>
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
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

              {/* <-- AJOUT: Numéro de téléphone */}
              <Input
                type="tel"
                label="Numéro de téléphone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+225 XX XX XX XX XX"
              />

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

          {/* 2. Investor Profile */}
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
                <div className="flex flex-col sm:flex-row gap-4">
                  {['Oui', 'Non'].map(o => (
                    <label key={o} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasInvested"
                        value={o}
                        checked={hasInvested === o}
                        onChange={(e) => setHasInvested(e.target.value)}
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
                  Votre niveau de connaissance en investissement ?
                </legend>
                <div className="flex flex-col sm:flex-row gap-4">
                  {['Débutant', 'Intermédiaire', 'Avancé'].map(o => (
                    <label key={o} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="knowledgeLevel"
                        value={o}
                        checked={knowledgeLevel === o}
                        onChange={(e) => setKnowledgeLevel(e.target.value)}
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
                  Quels sont vos objectifs principaux ? <span className="text-xs text-gray-500">(Choix multiples)</span>
                </legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  {goalOptions.map(goal => (
                    <label 
                      key={goal} 
                      className={`flex items-start space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        mainGoals.includes(goal) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={mainGoals.includes(goal)}
                        onChange={() => toggleGoal(goal)}
                        className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Monthly Amount */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Combien envisagez-vous d'investir mensuellement ?
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
                      <span className="text-sm">{o}</span>
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
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>

          {/* <-- NOUVEAU: 3. Préférences d'Apprentissage */}
          <Card>
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Préférences d'Apprentissage</h2>
            </div>
            <div className="space-y-6">
              
              {/* <-- AJOUT: Question 1 - Sujets d'Intérêt */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Quels sujets spécifiques vous intéressent le plus ? <span className="text-xs text-gray-500">(Choix multiples)</span>
                </legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  {topicInterests.map(topic => (
                    <label 
                      key={topic} 
                      className={`flex items-start space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTopics.includes(topic) 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic)}
                        onChange={() => toggleTopic(topic)}
                        className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <span className="text-sm">{topic}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>

          {/* <-- NOUVEAU: 4. Feedback & Amélioration */}
          <Card>
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Feedback & Amélioration</h2>
            </div>
            <div className="space-y-6">
              
              {/* <-- AJOUT: Question 2 - Canal de Découverte */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Comment avez-vous découvert AfriBourse ?
                </legend>
                <div className="space-y-2">
                  {discoveryChannels.map(channel => (
                    <label 
                      key={channel} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        discoveryChannel === channel 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="discoveryChannel"
                        value={channel}
                        checked={discoveryChannel === channel}
                        onChange={(e) => setDiscoveryChannel(e.target.value)}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm">{channel}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* <-- AJOUT: Question 3 - Fonctionnalité Clé */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-2">
                  Quelle est la fonctionnalité la plus importante pour vous ?
                </legend>
                <div className="space-y-2">
                  {keyFeatures.map(feature => (
                    <label 
                      key={feature} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        keyFeature === feature 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="keyFeature"
                        value={feature}
                        checked={keyFeature === feature}
                        onChange={(e) => setKeyFeature(e.target.value)}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm flex items-center">
                        {feature === 'La qualité des formations' && <BookOpen className="w-4 h-4 mr-2 text-gray-500" />}
                        {feature === 'La précision du simulateur' && <Target className="w-4 h-4 mr-2 text-gray-500" />}
                        {feature === 'Les données de marché en temps réel' && <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />}
                        {feature === 'Les analyses d\'experts' && <Star className="w-4 h-4 mr-2 text-gray-500" />}
                        {feature}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 text-center">
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