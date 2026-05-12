import { Check } from 'lucide-react';

interface Props {
  years: number[];
  currentStep: number;
}

export default function StepProgress({ years, currentStep }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      {years.map((year, idx) => {
        const done = idx < currentStep;
        const active = idx === currentStep;

        return (
          <div key={year} className="flex items-center gap-1.5">
            {idx > 0 && (
              <div className="w-5 h-px relative">
                <div className="absolute inset-0 bg-gray-200 rounded-full" />
                {done && <div className="absolute inset-0 bg-amber-400 rounded-full" />}
              </div>
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all duration-300 ${
                  done
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : active
                    ? 'bg-white border-amber-500 text-amber-600 shadow-md shadow-amber-200'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${
                active ? 'text-amber-600' : done ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {year}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
