import { useState } from 'react';
import { Star, CheckCircle, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSubmitScenarioFeedback } from '../../hooks/useTimeMachine';

interface Props {
  sessionId: string;
  scenarioTitle: string;
}

const TAGS = [
  'Très instructif',
  'Difficile mais enrichissant',
  'Trop facile',
  'Trop complexe',
  'Données réalistes',
  'Simba utile',
  'Interface claire',
  'Trop long',
];

export default function ScenarioFeedback({ sessionId, scenarioTitle }: Props) {
  const mutation = useSubmitScenarioFeedback();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [useful, setUseful] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit() {
    if (rating === 0) return;
    try {
      await mutation.mutateAsync({
        sessionId,
        rating,
        useful: useful ?? true,
        tags: selectedTags,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch { }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="font-bold text-emerald-800">Merci pour votre retour !</p>
          <p className="text-sm text-emerald-600 mt-0.5">Votre avis nous aide à améliorer la Time Machine.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
        <h2 className="text-sm font-bold text-gray-900">Votre avis sur ce scénario</h2>
      </div>

      {/* Star rating */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-600">Note globale</p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  n <= (hovered || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-bold text-gray-500">
              {['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent !'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Useful yes/no */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-600">Ce scénario vous a-t-il été utile ?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setUseful(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              useful === true
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            Oui, très utile
          </button>
          <button
            onClick={() => setUseful(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              useful === false
                ? 'bg-red-50 border-red-300 text-red-600'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            Pas vraiment
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-600">Ce qui décrit le mieux votre expérience <span className="font-normal text-gray-400">(plusieurs choix)</span></p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                selectedTags.includes(tag)
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-200 hover:bg-amber-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Optional comment */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
          Un commentaire ? <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Ce qui m'a le plus aidé, ce qui pourrait être amélioré..."
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 placeholder-gray-300 text-gray-700"
        />
        {comment.length > 0 && (
          <p className="text-[10px] text-gray-400 text-right">{comment.length}/500</p>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || mutation.isPending}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm"
      >
        {mutation.isPending ? 'Envoi…' : 'Envoyer mon avis'}
      </button>

      {mutation.isError && (
        <p className="text-xs text-red-500 text-center">Erreur lors de l'envoi. Réessayez.</p>
      )}
    </div>
  );
}
