// src/components/onboarding/ProfessionPhoneStep.tsx
import { useState } from 'react';
import { Briefcase, Phone, ChevronRight, ChevronLeft } from 'lucide-react';

interface ProfessionPhoneStepProps {
    profession?: string;
    phoneNumber?: string;
    onNext: (profession: string, phoneNumber: string) => void;
    onBack?: () => void;
    showBackButton?: boolean;
}

const PROFESSIONS = [
    { value: 'private_sector', label: 'Salarié du secteur privé' },
    { value: 'civil_servant', label: 'Fonctionnaire / Agent de l\'État' },
    { value: 'entrepreneur', label: 'Entrepreneur / Chef d\'entreprise' },
    { value: 'merchant', label: 'Commerçant' },
    { value: 'liberal_profession', label: 'Profession Libérale (Médecin, Avocat, Expert-comptable, etc.)' },
    { value: 'banking_finance', label: 'Cadre de la Banque / Finance' },
    { value: 'retired', label: 'Retraité' },
    { value: 'unemployed', label: 'Sans emploi / En recherche d\'activité' },
    { value: 'other', label: 'Autre' },
];

const COUNTRIES = [
    // Afrique de l'Ouest (UEMOA + voisins)
    { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
    { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
    { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯' },
    { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
    { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
    { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
    { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
    { code: 'GW', name: 'Guinée-Bissau', dialCode: '+245', flag: '🇬🇼' },
    { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳' },
    { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
    { code: 'MR', name: 'Mauritanie', dialCode: '+222', flag: '🇲🇷' },
    { code: 'GM', name: 'Gambie', dialCode: '+220', flag: '🇬🇲' },
    { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱' },
    { code: 'LR', name: 'Libéria', dialCode: '+231', flag: '🇱🇷' },
    { code: 'CV', name: 'Cap-Vert', dialCode: '+238', flag: '🇨🇻' },
    // Afrique Centrale
    { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
    { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬' },
    { code: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩' },
    { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
    { code: 'CF', name: 'Centrafrique', dialCode: '+236', flag: '🇨🇫' },
    { code: 'TD', name: 'Tchad', dialCode: '+235', flag: '🇹🇩' },
    { code: 'GQ', name: 'Guinée Équatoriale', dialCode: '+240', flag: '🇬🇶' },
    { code: 'ST', name: 'São Tomé-et-Príncipe', dialCode: '+239', flag: '🇸🇹' },
    // Afrique de l'Est
    { code: 'ET', name: 'Éthiopie', dialCode: '+251', flag: '🇪🇹' },
    { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
    { code: 'TZ', name: 'Tanzanie', dialCode: '+255', flag: '🇹🇿' },
    { code: 'UG', name: 'Ouganda', dialCode: '+256', flag: '🇺🇬' },
    { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
    { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮' },
    { code: 'SO', name: 'Somalie', dialCode: '+252', flag: '🇸🇴' },
    { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯' },
    { code: 'ER', name: 'Érythrée', dialCode: '+291', flag: '🇪🇷' },
    { code: 'SD', name: 'Soudan', dialCode: '+249', flag: '🇸🇩' },
    { code: 'SS', name: 'Soudan du Sud', dialCode: '+211', flag: '🇸🇸' },
    // Afrique du Nord
    { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
    { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
    { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
    { code: 'LY', name: 'Libye', dialCode: '+218', flag: '🇱🇾' },
    { code: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬' },
    // Afrique Australe
    { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦' },
    { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿' },
    { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼' },
    { code: 'ZM', name: 'Zambie', dialCode: '+260', flag: '🇿🇲' },
    { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼' },
    { code: 'NA', name: 'Namibie', dialCode: '+264', flag: '🇳🇦' },
    { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴' },
    { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
    { code: 'MU', name: 'Maurice', dialCode: '+230', flag: '🇲🇺' },
    { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨' },
    { code: 'KM', name: 'Comores', dialCode: '+269', flag: '🇰🇲' },
    // Europe
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
    { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
    { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
    { code: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨' },
    { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
    { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
    { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
    { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
    { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
    { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
    { code: 'SE', name: 'Suède', dialCode: '+46', flag: '🇸🇪' },
    { code: 'NO', name: 'Norvège', dialCode: '+47', flag: '🇳🇴' },
    { code: 'DK', name: 'Danemark', dialCode: '+45', flag: '🇩🇰' },
    { code: 'FI', name: 'Finlande', dialCode: '+358', flag: '🇫🇮' },
    { code: 'PL', name: 'Pologne', dialCode: '+48', flag: '🇵🇱' },
    { code: 'RO', name: 'Roumanie', dialCode: '+40', flag: '🇷🇴' },
    { code: 'GR', name: 'Grèce', dialCode: '+30', flag: '🇬🇷' },
    { code: 'AT', name: 'Autriche', dialCode: '+43', flag: '🇦🇹' },
    { code: 'HU', name: 'Hongrie', dialCode: '+36', flag: '🇭🇺' },
    { code: 'CZ', name: 'Tchéquie', dialCode: '+420', flag: '🇨🇿' },
    { code: 'RU', name: 'Russie', dialCode: '+7', flag: '🇷🇺' },
    { code: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷' },
    // Amériques
    { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
    { code: 'AR', name: 'Argentine', dialCode: '+54', flag: '🇦🇷' },
    { code: 'CO', name: 'Colombie', dialCode: '+57', flag: '🇨🇴' },
    { code: 'CL', name: 'Chili', dialCode: '+56', flag: '🇨🇱' },
    { code: 'PE', name: 'Pérou', dialCode: '+51', flag: '🇵🇪' },
    { code: 'HT', name: 'Haïti', dialCode: '+509', flag: '🇭🇹' },
    // Asie & Océanie
    { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' },
    { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳' },
    { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' },
    { code: 'KR', name: 'Corée du Sud', dialCode: '+82', flag: '🇰🇷' },
    { code: 'AE', name: 'Émirats Arabes Unis', dialCode: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦' },
    { code: 'AU', name: 'Australie', dialCode: '+61', flag: '🇦🇺' },
];

export default function ProfessionPhoneStep({ profession, phoneNumber, onNext, onBack, showBackButton = true }: ProfessionPhoneStepProps) {
    const [selectedProfession, setSelectedProfession] = useState(profession || '');
    const [otherProfession, setOtherProfession] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Côte d'Ivoire par défaut
    const [phone, setPhone] = useState(phoneNumber?.replace(/^\+\d+/, '') || '');
    const [errors, setErrors] = useState({ profession: '', phone: '' });

    const handleNext = () => {
        const newErrors = { profession: '', phone: '' };

        // Validation profession
        if (!selectedProfession) {
            newErrors.profession = 'Veuillez sélectionner votre profession';
        } else if (selectedProfession === 'other' && !otherProfession.trim()) {
            newErrors.profession = 'Veuillez préciser votre profession';
        }

        // Validation téléphone (optionnel, mais si fourni doit être valide)
        const cleanPhone = phone.replace(/\s/g, '');
        if (cleanPhone) {
            // Seulement valider si un numéro est fourni
            if (cleanPhone.length < 8 || cleanPhone.length > 15) {
                newErrors.phone = 'Numéro invalide (8-15 chiffres)';
            } else if (!/^\d+$/.test(cleanPhone)) {
                newErrors.phone = 'Le numéro ne doit contenir que des chiffres';
            }
        }

        setErrors(newErrors);

        if (!newErrors.profession && !newErrors.phone) {
            const finalProfession = selectedProfession === 'other' ? otherProfession : selectedProfession;
            const finalPhone = cleanPhone ? `${selectedCountry.dialCode}${cleanPhone}` : '';
            onNext(finalProfession, finalPhone);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Informations professionnelles
                </h2>
                <p className="text-gray-600">
                    Ces informations nous aident à mieux personnaliser votre expérience
                </p>
            </div>

            {/* Profession */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quelle est votre profession ? *
                </label>
                <select
                    value={selectedProfession}
                    onChange={(e) => {
                        setSelectedProfession(e.target.value);
                        setErrors({ ...errors, profession: '' });
                    }}
                    className={`w-full px-4 py-3 border ${errors.profession ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                    <option value="">Sélectionnez votre profession</option>
                    {PROFESSIONS.map((prof) => (
                        <option key={prof.value} value={prof.value}>
                            {prof.label}
                        </option>
                    ))}
                </select>
                {errors.profession && (
                    <p className="mt-1 text-sm text-red-600">{errors.profession}</p>
                )}
            </div>

            {/* Autre profession (si "Autre" sélectionné) */}
            {selectedProfession === 'other' && (
                <div className="animate-fadeIn">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Précisez votre profession *
                    </label>
                    <input
                        type="text"
                        value={otherProfession}
                        onChange={(e) => {
                            setOtherProfession(e.target.value);
                            setErrors({ ...errors, profession: '' });
                        }}
                        placeholder="Ex: Consultant, Artiste, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={100}
                    />
                </div>
            )}

            {/* Téléphone */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone (optionnel)
                </label>

                {/* Pays */}
                <div className="mb-3">
                    <select
                        value={selectedCountry.code}
                        onChange={(e) => {
                            const country = COUNTRIES.find(c => c.code === e.target.value);
                            if (country) setSelectedCountry(country);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {COUNTRIES.map((country) => (
                            <option key={country.code} value={country.code}>
                                {country.flag} {country.name} ({country.dialCode})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Numéro */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-gray-600 font-medium">{selectedCountry.dialCode}</span>
                    </div>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                            // Autoriser seulement les chiffres et espaces
                            const value = e.target.value.replace(/[^\d\s]/g, '');
                            setPhone(value);
                            setErrors({ ...errors, phone: '' });
                        }}
                        placeholder="XX XX XX XX XX"
                        className={`w-full pl-28 pr-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'
                            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        maxLength={15}
                    />
                </div>
                {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    Votre numéro ne sera pas partagé publiquement
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                {showBackButton && onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Retour
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleNext}
                    className={`${showBackButton ? 'flex-1' : 'w-full'} px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium flex items-center justify-center gap-2 transition-all`}
                >
                    Continuer
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
