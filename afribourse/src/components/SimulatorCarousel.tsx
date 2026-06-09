import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Shield, BarChart2, Zap, BookOpen, Target } from 'lucide-react';

const IMAGES = Array.from({ length: 10 }, (_, i) => `/images/simulator/${i + 1}.jpg`);

const VALUE_PROPS: { icon: React.ReactNode; text: string }[] = [
  { icon: <Shield className="w-4 h-4 text-indigo-500 shrink-0" />, text: '1 000 000 FCFA de cash virtuel — zéro risque de perte' },
  { icon: <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />, text: 'Données officielles BRVM en temps réel sur 47 actions' },
  { icon: <BarChart2 className="w-4 h-4 text-blue-500 shrink-0" />, text: 'Mesure tes performances comme un investisseur professionnel' },
  { icon: <Zap className="w-4 h-4 text-amber-500 shrink-0" />, text: 'Passe à l\'investissement réel quand tu es prêt' },
  { icon: <BookOpen className="w-4 h-4 text-purple-500 shrink-0" />, text: 'Construis ta stratégie sur des données de marché réelles' },
  { icon: <Target className="w-4 h-4 text-rose-500 shrink-0" />, text: 'Suis tes gains et pertes sur chaque action BRVM' },
];

export default function SimulatorCarousel() {
  const [current, setCurrent] = useState(0);
  const [vpIndex, setVpIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = (dir: 1 | -1) => {
    setCurrent(c => (c + dir + IMAGES.length) % IMAGES.length);
  };

  const resetAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => setCurrent(c => (c + 1) % IMAGES.length), 3000);
  };

  useEffect(() => {
    resetAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  // VP rotation every 10 minutes (600 000 ms) — shows 2 consecutive items
  useEffect(() => {
    const id = setInterval(() => setVpIndex(i => (i + 2) % VALUE_PROPS.length), 600_000);
    return () => clearInterval(id);
  }, []);

  const vp = [VALUE_PROPS[vpIndex % VALUE_PROPS.length], VALUE_PROPS[(vpIndex + 1) % VALUE_PROPS.length]];

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStartX.current = e.clientX;
    if (autoRef.current) clearInterval(autoRef.current);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    resetAuto();
  };

  const manualNav = (dir: 1 | -1) => {
    go(dir);
    resetAuto();
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-2 gap-0">

          {/* — Texte gauche — */}
          <div className="flex flex-col justify-center p-8 md:p-12 order-2 md:order-1">
            <span className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full w-fit mb-5">
              <BarChart2 className="w-3.5 h-3.5" />
              Simulateur BRVM
            </span>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-4">
              De la théorie à la pratique.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Sans risque.</span>
            </h2>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
              Ton portefeuille simulé fonctionne avec les données officielles de la BRVM. Construis ta stratégie,
              mesure tes performances, et passe à l'investissement réel quand tu es prêt.
            </p>

            {/* 2 VPs rotatifs */}
            <div className="flex flex-col gap-3">
              {vp.map((v, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  {v.icon}
                  <span className="text-slate-200 text-sm leading-snug">{v.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* — Carrousel droit — */}
          <div className="relative order-1 md:order-2 select-none" style={{ minHeight: 320 }}>
            {/* Images */}
            <div
              className="relative overflow-hidden h-full min-h-[280px] md:min-h-full cursor-grab active:cursor-grabbing rounded-t-2xl md:rounded-none md:rounded-r-2xl"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              {IMAGES.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`Simulateur BRVM étape ${i + 1}`}
                  draggable={false}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                />
              ))}

              {/* Flèches */}
              <button
                onClick={() => manualNav(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => manualNav(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
              {IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); resetAuto(); }}
                  className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
