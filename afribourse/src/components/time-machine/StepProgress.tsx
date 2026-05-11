import { Check } from 'lucide-react';

interface Props {
  years: number[];
  currentStep: number;
}

export default function StepProgress({ years, currentStep }: Props) {
  return (
    <div className="w-full px-2 py-4">
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full h-0.5 bg-gray-200" />
          <div
            className="absolute h-0.5 bg-blue-500 transition-all duration-500"
            style={{ width: `${(currentStep / (years.length - 1)) * 100}%` }}
          />
        </div>

        {years.map((year, idx) => {
          const done = idx < currentStep;
          const active = idx === currentStep;

          return (
            <div key={year} className="relative flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 z-10 ${
                  done
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : active
                    ? 'bg-white border-blue-500 text-blue-600 shadow-md'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : idx + 1}
              </div>

              {/* Year label */}
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  active ? 'text-blue-600' : done ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {year}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
