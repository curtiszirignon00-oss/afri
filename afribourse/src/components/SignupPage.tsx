// src/components/SignupPage.tsx - VERSION MIGRÉE
import { useState, useRef, useEffect } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle, User as UserIcon, Phone, ChevronDown } from 'lucide-react';
import { Button, Input, Card } from './ui';
import { API_BASE_URL, authFetch } from '../config/api';
import { useNavigate } from 'react-router-dom';
import OAuthButtons from './auth/OAuthButtons';
import { trackSignUp } from '../lib/amplitude';
import { metaPixel } from '../utils/metaPixel';

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  // Afrique de l'Ouest - UEMOA (priorité AfriBourse)
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'BJ', name: 'Bénin', dial: '+229', flag: '🇧🇯' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { code: 'GN', name: 'Guinée', dial: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinée-Bissau', dial: '+245', flag: '🇬🇼' },
  // Afrique Centrale - CEMAC
  { code: 'CM', name: 'Cameroun', dial: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'RD Congo', dial: '+243', flag: '🇨🇩' },
  { code: 'TD', name: 'Tchad', dial: '+235', flag: '🇹🇩' },
  { code: 'CF', name: 'Centrafrique', dial: '+236', flag: '🇨🇫' },
  { code: 'GQ', name: 'Guinée Équatoriale', dial: '+240', flag: '🇬🇶' },
  // Reste de l'Afrique
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'LR', name: 'Libéria', dial: '+231', flag: '🇱🇷' },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱' },
  { code: 'MR', name: 'Mauritanie', dial: '+222', flag: '🇲🇷' },
  { code: 'GM', name: 'Gambie', dial: '+220', flag: '🇬🇲' },
  { code: 'CV', name: 'Cap-Vert', dial: '+238', flag: '🇨🇻' },
  { code: 'MA', name: 'Maroc', dial: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', dial: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', dial: '+216', flag: '🇹🇳' },
  { code: 'LY', name: 'Libye', dial: '+218', flag: '🇱🇾' },
  { code: 'EG', name: 'Égypte', dial: '+20', flag: '🇪🇬' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzanie', dial: '+255', flag: '🇹🇿' },
  { code: 'UG', name: 'Ouganda', dial: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { code: 'ET', name: 'Éthiopie', dial: '+251', flag: '🇪🇹' },
  { code: 'ZA', name: 'Afrique du Sud', dial: '+27', flag: '🇿🇦' },
  { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
  { code: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿' },
  { code: 'MG', name: 'Madagascar', dial: '+261', flag: '🇲🇬' },
  { code: 'MU', name: 'Maurice', dial: '+230', flag: '🇲🇺' },
  { code: 'SC', name: 'Seychelles', dial: '+248', flag: '🇸🇨' },
  // International
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', dial: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dial: '+41', flag: '🇨🇭' },
  { code: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'ES', name: 'Espagne', dial: '+34', flag: '🇪🇸' },
  { code: 'DE', name: 'Allemagne', dial: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Royaume-Uni', dial: '+44', flag: '🇬🇧' },
  { code: 'IT', name: 'Italie', dial: '+39', flag: '🇮🇹' },
  { code: 'US', name: 'États-Unis', dial: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
];

function PhoneInput({
  value,
  dialCode,
  onChange,
  onDialChange,
  disabled,
}: {
  value: string;
  dialCode: string;
  onChange: (v: string) => void;
  onDialChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0];

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search)
      )
    : COUNTRIES;

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Numéro de téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
      </label>
      <div className="flex gap-2">
        {/* Sélecteur indicatif */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-gray-600">{selected.dial}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un pays..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <ul className="max-h-52 overflow-y-auto py-1">
                {filtered.length === 0 && (
                  <li className="px-4 py-2 text-sm text-gray-400">Aucun résultat</li>
                )}
                {filtered.map(c => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => { onDialChange(c.dial); setOpen(false); setSearch(''); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-indigo-50 text-left transition-colors ${c.dial === dialCode ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-gray-700'}`}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-gray-400 text-xs">{c.dial}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Champ numéro */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="tel"
            value={value}
            onChange={e => onChange(e.target.value.replace(/[^\d\s\-()]/g, ''))}
            placeholder="07 00 00 00 00"
            disabled={disabled}
            className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

const passwordRules = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule minimum', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un caractère spécial minimum (!@#$%...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {passwordRules.map((rule) => {
        const valid = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-2 text-xs font-medium transition-colors ${valid ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${valid ? 'bg-green-500' : 'bg-red-400'}`} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneDialCode, setPhoneDialCode] = useState('+225');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordValid = passwordRules.every((r) => r.test(password));

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!name || !lastname) {
      setError('Veuillez entrer votre prénom et nom.');
      setLoading(false);
      return;
    }

    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les conditions requises.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          lastname,
          email,
          password,
          telephone: phoneNumber.trim() ? `${phoneDialCode}${phoneNumber.replace(/[\s\-()]/g, '')}` : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Erreur lors de l'inscription");
      }

      setSuccess(true);
      trackSignUp('email');
      metaPixel.completeRegistration();

      setTimeout(() => {
        navigate('/verifier-email', { state: { email } });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-md">
            <img
              src="/images/logo_afribourse.png"
              alt="AfriBourse Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Commencez votre aventure d'investissement</p>
        </div>

        <Card>
          <form onSubmit={handleSignup} className="space-y-6" translate="no">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                disabled={loading}
                required
              />

              <Input
                type="text"
                label="Nom"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="Dupont"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                disabled={loading}
                required
              />
            </div>

            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              disabled={loading}
              required
            />

            <PhoneInput
              value={phoneNumber}
              dialCode={phoneDialCode}
              onChange={setPhoneNumber}
              onDialChange={setPhoneDialCode}
              disabled={loading}
            />

            <div>
              <Input
                type="password"
                label="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                disabled={loading}
                required
              />
              <PasswordStrengthIndicator password={password} />
            </div>

            <Input
              type="password"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              helperText="Saisissez à nouveau votre mot de passe"
              disabled={loading}
              required
            />

            {/* Messages d'erreur et succès */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">Compte créé avec succès ! Redirection...</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={loading || !passwordValid}
              className="w-full"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
          </form>

          {/* OAuth Social Login */}
          <div className="mt-2">
            <OAuthButtons mode="register" />
          </div>

          {/* Lien vers connexion */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-600 font-semibold hover:underline"
              disabled={loading}
            >
              Se connecter
            </button>
          </div>
        </Card>

        {/* Retour à l'accueil */}
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/')} disabled={loading}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
