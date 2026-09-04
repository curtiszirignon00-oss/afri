import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shield, TrendingUp, BarChart2, Zap, BookOpen, Target } from 'lucide-react';

const IMAGES = [1,2,3,4,5,6,8,9,10].map(n => `/images/simulator/${n}.jpg`);

const VALUE_PROPS: { icon: React.ReactNode; label: string; desc: string }[] = [
  {
    icon: <Shield className="w-5 h-5 text-brand-navy" />,
    label: '1 000 000 FCFA virtuel',
    desc: 'Zéro risque de perte — simule comme un vrai investisseur',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-brand-navy" />,
    label: '47 actions BRVM en temps réel',
    desc: 'Données officielles, mises à jour en continu',
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-brand-navy" />,
    label: 'Suivi de performance',
    desc: 'Mesure tes gains et pertes comme un professionnel',
  },
  {
    icon: <Zap className="w-5 h-5 text-brand-navy" />,
    label: 'Passage au réel en 1 clic',
    desc: "Passe à l'investissement réel quand tu es prêt",
  },
  {
    icon: <BookOpen className="w-5 h-5 text-brand-navy" />,
    label: 'Stratégie sur données réelles',
    desc: 'Construis et teste ta stratégie sur le marché réel',
  },
  {
    icon: <Target className="w-5 h-5 text-brand-navy" />,
    label: 'Portefeuille diversifié',
    desc: 'Répartis ton allocation sur tous les secteurs BRVM',
  },
];

export default function SimulatorCarousel() {
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = (dir: 1 | -1) => setCurrent(c => (c + dir + IMAGES.length) % IMAGES.length);

  const resetAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => setCurrent(c => (c + 1) % IMAGES.length), 3000);
  };

  useEffect(() => {
    resetAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    if (autoRef.current) clearInterval(autoRef.current);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    resetAuto();
  };
  const manualNav = (dir: 1 | -1) => { go(dir); resetAuto(); };

  // Ecrans precedent et suivant, ouverts en eventail de part et d'autre du
  // telephone comme des cartes tenues en main : ils montrent d'ou vient et ou
  // va le carrousel, et donnent de la profondeur a la scene.
  const prevImage = IMAGES[(current - 1 + IMAGES.length) % IMAGES.length];
  const nextImage = IMAGES[(current + 1) % IMAGES.length];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
      {/* Label */}
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center gap-2 bg-brand-navy/10 text-brand-navy text-xs font-bold px-3 py-1.5 rounded-full">
          Simulateur BRVM
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-ink-200/40 overflow-hidden">
        <div className="grid md:grid-cols-2 items-stretch">

          {/* — Texte + VPs — */}
          <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12 order-2 md:order-1 border-t md:border-t-0 md:border-r border-gray-100">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
              De la théorie à la pratique.<br />
              <span className="text-brand-orange">Sans risque.</span>
            </h2>

            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8">
              Ton portefeuille simulé fonctionne avec les données officielles de la BRVM.
              Construis ta stratégie, mesure tes performances, et passe à l'investissement
              réel quand tu es prêt.
            </p>

            {/* Les six promesses, toutes visibles. Elles defilaient deux par
                deux : le visiteur devait attendre pour lire les suivantes, et
                celles hors ecran ne comptaient pour rien. */}
            <div className="grid sm:grid-cols-2 gap-3">
              {VALUE_PROPS.map(v => (
                <div
                  key={v.label}
                  className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5"
                >
                  <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 shrink-0">
                    {v.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{v.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* — Scene telephone — */}
          <div className="relative order-1 md:order-2 flex items-center justify-center py-12 px-8 overflow-hidden bg-gradient-to-br from-ink-50 via-white to-ink-100">
            {/* Halos de fond, deux nuances du bleu du logo. */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 72% 18%, rgba(27,78,125,0.16) 0%, transparent 55%), radial-gradient(circle at 20% 85%, rgba(18,57,94,0.14) 0%, transparent 55%)' }}
            />
            {/* Trame, reprise du hero et du bloc simulateur sombre. */}
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(#12395E 1px, transparent 1px), linear-gradient(90deg, #12395E 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            />

            <div className="relative">
              {/* Eventail : une carte penchee a gauche, une a droite, pivotant
                  depuis le bas comme des cartes tenues en main. Le point de
                  rotation en bas evite qu'elles s'ecartent du telephone en
                  s'inclinant. Purement decoratif — aria-hidden, non cliquable. */}
              <div
                aria-hidden="true"
                className="absolute bottom-12 -left-20 w-[150px] rounded-[26px] overflow-hidden border-4 border-white shadow-2xl shadow-ink-900/25 opacity-80 hidden lg:block pointer-events-none z-0 transition-transform duration-500"
                style={{ aspectRatio: '9 / 19', transform: 'rotate(-14deg)', transformOrigin: 'bottom center' }}
              >
                <img src={prevImage} alt="" className="w-full h-full object-cover" />
                {/* Voile : les cartes laterales restent en retrait du telephone. */}
                <div className="absolute inset-0 bg-ink-950/15" />
              </div>
              <div
                aria-hidden="true"
                className="absolute bottom-12 -right-20 w-[150px] rounded-[26px] overflow-hidden border-4 border-white shadow-2xl shadow-ink-900/25 opacity-80 hidden lg:block pointer-events-none z-0 transition-transform duration-500"
                style={{ aspectRatio: '9 / 19', transform: 'rotate(14deg)', transformOrigin: 'bottom center' }}
              >
                <img src={nextImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-ink-950/15" />
              </div>

              {/* Cadre téléphone */}
              <div
                className="relative w-[230px] rounded-[38px] border-[7px] border-ink-900 bg-ink-900 shadow-2xl shadow-ink-900/30 z-10"
                style={{ aspectRatio: '9 / 19' }}
              >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[72px] h-[18px] bg-ink-900 rounded-b-2xl z-20" />

                {/* Écran — zone carrousel */}
                <div
                  className={`relative w-full h-full overflow-hidden rounded-[32px] bg-ink-950 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  onPointerDown={onPointerDown}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                >
                  {IMAGES.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt={`Simulateur AfriBourse — écran ${i + 1}`}
                      draggable={false}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 select-none ${
                        i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    />
                  ))}

                  {/* Overlay bottom + dots */}
                  <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none" />
                  <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20">
                    {IMAGES.map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Aller à l'écran ${i + 1}`}
                        onClick={() => { setCurrent(i); resetAuto(); }}
                        className={`rounded-full transition-all duration-200 cursor-pointer ${
                          i === current ? 'w-3.5 h-1 bg-white' : 'w-1 h-1 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Indicateur home */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-ink-600 rounded-full" />
              </div>

              {/* Flèches sous le téléphone */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  aria-label="Image précédente"
                  onClick={() => manualNav(-1)}
                  className="bg-white border border-gray-200 hover:border-brand-navy/25 hover:text-brand-navy text-gray-600 rounded-full p-2 shadow-sm transition-colors duration-150 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-gray-400 tabular-nums w-12 text-center">
                  {current + 1} / {IMAGES.length}
                </span>
                <button
                  aria-label="Image suivante"
                  onClick={() => manualNav(1)}
                  className="bg-white border border-gray-200 hover:border-brand-navy/25 hover:text-brand-navy text-gray-600 rounded-full p-2 shadow-sm transition-colors duration-150 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
