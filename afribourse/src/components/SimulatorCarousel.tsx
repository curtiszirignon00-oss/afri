import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shield, TrendingUp, BarChart2, Zap, BookOpen, Target } from 'lucide-react';

const IMAGES = Array.from({ length: 10 }, (_, i) => `/images/simulator/${i + 1}.jpg`);

const VALUE_PROPS: { icon: React.ReactNode; label: string; desc: string }[] = [
  {
    icon: <Shield className="w-5 h-5 text-indigo-500" />,
    label: '1 000 000 FCFA virtuel',
    desc: 'Zéro risque de perte — simule comme un vrai investisseur',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
    label: '47 actions BRVM en temps réel',
    desc: 'Données officielles, mises à jour en continu',
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-blue-500" />,
    label: 'Suivi de performance',
    desc: 'Mesure tes gains et pertes comme un professionnel',
  },
  {
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    label: 'Passage au réel en 1 clic',
    desc: 'Passe à l\'investissement réel quand tu es prêt',
  },
  {
    icon: <BookOpen className="w-5 h-5 text-purple-500" />,
    label: 'Stratégie sur données réelles',
    desc: 'Construis et teste ta stratégie sur le marché réel',
  },
  {
    icon: <Target className="w-5 h-5 text-rose-500" />,
    label: 'Portefeuille diversifié',
    desc: 'Répartis ton allocation sur tous les secteurs BRVM',
  },
];

export default function SimulatorCarousel() {
  const [current, setCurrent] = useState(0);
  const [vpIndex, setVpIndex] = useState(0);
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

  useEffect(() => {
    const id = setInterval(() => setVpIndex(i => (i + 2) % VALUE_PROPS.length), 600_000);
    return () => clearInterval(id);
  }, []);

  const vp = [VALUE_PROPS[vpIndex % VALUE_PROPS.length], VALUE_PROPS[(vpIndex + 1) % VALUE_PROPS.length]];

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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
      {/* Label section */}
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-100">
          <BarChart2 className="w-3.5 h-3.5" />
          Simulateur BRVM
        </span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 overflow-hidden">
        <div className="grid md:grid-cols-2">

          {/* — Texte + VPs — */}
          <div className="flex flex-col justify-center p-8 md:p-10 order-2 md:order-1 border-t md:border-t-0 md:border-r border-slate-100">

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
              De la théorie à la pratique.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                Sans risque.
              </span>
            </h2>

            <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-8">
              Ton portefeuille simulé fonctionne avec les données officielles de la BRVM.
              Construis ta stratégie, mesure tes performances, et passe à l'investissement
              réel quand tu es prêt.
            </p>

            {/* 2 VPs rotatifs */}
            <div className="flex flex-col gap-3">
              {vp.map((v, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 transition-all"
                >
                  <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{v.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* — Carrousel — */}
          <div className="relative order-1 md:order-2" style={{ minHeight: 300 }}>
            {/* Gradient overlay top pour douceur */}
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/30 to-transparent z-10 pointer-events-none" />

            <div
              className={`relative h-full min-h-[280px] md:min-h-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              {IMAGES.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`Simulateur BRVM — écran ${i + 1}`}
                  draggable={false}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                />
              ))}

              {/* Flèches */}
              <button
                aria-label="Image précédente"
                onClick={() => manualNav(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-700 rounded-full p-1.5 shadow-md transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                aria-label="Image suivante"
                onClick={() => manualNav(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-700 rounded-full p-1.5 shadow-md transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Overlay bottom gradient + dots */}
              <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                {IMAGES.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Aller à l'image ${i + 1}`}
                    onClick={() => { setCurrent(i); resetAuto(); }}
                    className={`rounded-full transition-all duration-200 cursor-pointer ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
