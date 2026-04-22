import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface MultiStepWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  completeLabel?: string;
}

export const MultiStepWizard: React.FC<MultiStepWizardProps> = ({
  open, onOpenChange, title, steps, onComplete, completeLabel = 'Complete',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!open) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (step.validate) {
      setLoading(true);
      try {
        const valid = await step.validate();
        if (!valid) { setLoading(false); return; }
      } catch {
        setLoading(false);
        return;
      }
    }

    if (isLast) {
      setLoading(true);
      try {
        await onComplete();
        setCompleted(true);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(s => s + 1);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setCurrentStep(0);
    setCompleted(false);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <div
        className="relative w-full max-w-lg bg-card rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">{title}</h2>
            <button onClick={handleClose} className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress stepper */}
          <div className="flex items-center gap-1.5 mb-3">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={cn(
                  'h-7 w-7 rounded-xl flex items-center justify-center text-[9px] font-bold shrink-0 transition-all duration-300',
                  i < currentStep ? 'bg-[hsl(var(--state-healthy))] text-white shadow-sm' :
                  i === currentStep ? 'bg-accent text-accent-foreground shadow-md ring-2 ring-accent/20' :
                  'bg-muted text-muted-foreground'
                )}>
                  {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
                    <div
                      className="h-full bg-[hsl(var(--state-healthy))] rounded-full transition-all duration-500"
                      style={{ width: i < currentStep ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step info */}
          <div className="rounded-2xl bg-muted/30 px-4 py-3 border">
            <div className="text-[10px] text-muted-foreground mb-0.5">Step {currentStep + 1} of {steps.length}</div>
            <div className="text-xs font-bold">{step.title}</div>
            {step.description && <div className="text-[10px] text-muted-foreground mt-0.5">{step.description}</div>}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {completed ? (
            <div className="text-center py-10">
              <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-4 ring-4 ring-[hsl(var(--state-healthy)/0.1)]">
                <Sparkles className="h-7 w-7 text-[hsl(var(--state-healthy))]" />
              </div>
              <h3 className="text-sm font-bold mb-1.5">All Done!</h3>
              <p className="text-[11px] text-muted-foreground mb-5 max-w-xs mx-auto">Your changes have been saved successfully.</p>
              <Button className="text-[10px] h-9 rounded-xl px-6" onClick={handleClose}>Close</Button>
            </div>
          ) : (
            step.content
          )}
        </div>

        {/* Footer */}
        {!completed && (
          <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/10">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-9 gap-1.5 rounded-xl"
              disabled={currentStep === 0 || loading}
              onClick={() => setCurrentStep(s => s - 1)}
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-[10px] h-9 rounded-xl" onClick={handleClose}>
                Cancel
              </Button>
              <Button size="sm" className="text-[10px] h-9 gap-1.5 rounded-xl min-w-20" onClick={handleNext} disabled={loading}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {isLast ? completeLabel : 'Next'}
                {!isLast && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
