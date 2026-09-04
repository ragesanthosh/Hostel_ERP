import { Check } from 'lucide-react';

export default function StepProgress({ steps, currentStep }) {
  return (
    <div className="mb-8 overflow-x-auto pb-2">
      <div className="flex min-w-max items-center gap-0">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-medium transition-all ${
                    isComplete
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isCurrent
                        ? 'border-primary-600 bg-primary-600 text-white shadow-md shadow-primary-600/25'
                        : 'border-slate-200 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={`mt-2 max-w-[80px] text-center text-xs font-medium ${
                    isCurrent ? 'text-primary-700 dark:text-primary-400' : isComplete ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-2 mb-6 h-0.5 w-8 sm:w-16 ${isComplete ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
