import { Check } from 'lucide-react';

interface Props {
  years: number[];
  currentStep: number;
}

export default function StepProgress({ years, currentStep }: Props) {
  const progressPct = years.length > 1 ? (currentStep / (years.length - 1)) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      {years.map((year, idx) => {
        const done = idx < currentStep;
        const active = idx === currentStep;

        return (
          <div key={year} className="flex items-center gap-2">
            {idx > 0 && (
              <div className="w-6 h-px relative">
                <div className="absolute inset-0 bg-white/10 rounded-full" />
                {done && <div className="absolute inset-0 bg-amber-500 rounded-full" />}
              </div>
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all duration-300 ${
                  done
                    ? 'bg-amber-500 border-amber-500 text-slate-900'
                    : active
                    ? 'bg-slate-900 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/30'
                    : 'bg-white/5 border-white/15 text-slate-600'
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
              <span
                className={`text-[9px] font-semibold whitespace-nowrap ${
                  active ? 'text-amber-400' : done ? 'text-slate-500' : 'text-slate-700'
                }`}
              >
                {year}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
