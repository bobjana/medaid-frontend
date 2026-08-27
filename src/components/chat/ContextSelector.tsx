'use client';

import type { ContextOptions } from '@/types';

interface ContextSelectorProps {
  options: ContextOptions;
  onSelect: (selection: string) => void;
}

export function ContextSelector({ options, onSelect }: ContextSelectorProps) {
  if (options.type === 'scheme_selection' && options.schemes) {
    return (
      <div className="mb-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Select a scheme
        </p>
        <div className="flex flex-wrap gap-2">
          {options.schemes.map((scheme) => (
            <button
              key={scheme.slug}
              type="button"
              onClick={() => onSelect(scheme.name)}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              {scheme.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (options.type === 'plan_selection' && options.plans) {
    return (
      <div className="mb-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Select a plan
        </p>
        <div className="flex flex-wrap gap-2">
          {options.plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.name)}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              {plan.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
