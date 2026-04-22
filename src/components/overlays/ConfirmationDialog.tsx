import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Loader2, Undo2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'info';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  undoable?: boolean;
  onUndo?: () => void;
  confirmPhrase?: string;
  detail?: React.ReactNode;
}

const VARIANT_CONFIG: Record<ConfirmVariant, { icon: React.ElementType; iconColor: string; bgColor: string; ringColor: string }> = {
  default: { icon: CheckCircle2, iconColor: 'text-accent', bgColor: 'bg-accent/10', ringColor: 'ring-accent/20' },
  destructive: { icon: ShieldAlert, iconColor: 'text-destructive', bgColor: 'bg-destructive/10', ringColor: 'ring-destructive/20' },
  warning: { icon: AlertTriangle, iconColor: 'text-[hsl(var(--state-caution))]', bgColor: 'bg-[hsl(var(--state-caution)/0.1)]', ringColor: 'ring-[hsl(var(--state-caution)/0.2)]' },
  info: { icon: Info, iconColor: 'text-[hsl(var(--gigvora-blue))]', bgColor: 'bg-[hsl(var(--gigvora-blue)/0.1)]', ringColor: 'ring-[hsl(var(--gigvora-blue)/0.2)]' },
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open, onOpenChange, title, description, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', variant = 'default', onConfirm, onCancel,
  undoable, onUndo, confirmPhrase, detail,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [typed, setTyped] = useState('');
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  const phraseMatch = !confirmPhrase || typed === confirmPhrase;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      if (undoable) {
        setConfirmed(true);
      } else {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    setTyped('');
    onOpenChange(false);
    onCancel?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <div
        className="relative w-full max-w-md bg-card rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {confirmed ? (
          <div className="p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-4 ring-4 ring-[hsl(var(--state-healthy)/0.1)]">
              <CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))]" />
            </div>
            <h3 className="text-sm font-bold mb-1.5">Action Completed</h3>
            <p className="text-[11px] text-muted-foreground mb-5 max-w-xs mx-auto">{description}</p>
            <div className="flex items-center justify-center gap-2.5">
              {onUndo && (
                <Button variant="outline" size="sm" className="text-[10px] h-9 gap-1.5 rounded-xl" onClick={() => { onUndo(); handleClose(); }}>
                  <Undo2 className="h-3 w-3" /> Undo
                </Button>
              )}
              <Button size="sm" className="text-[10px] h-9 rounded-xl gap-1.5" onClick={handleClose}>
                Done <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4', cfg.bgColor, cfg.ringColor)}>
              <Icon className={cn('h-6 w-6', cfg.iconColor)} />
            </div>
            <h3 className="text-sm font-bold text-center mb-1.5">{title}</h3>
            <p className="text-[11px] text-muted-foreground text-center mb-4 max-w-xs mx-auto leading-relaxed">{description}</p>

            {detail && <div className="mb-4 rounded-2xl bg-muted/30 p-3.5 border text-xs">{detail}</div>}

            {confirmPhrase && (
              <div className="mb-5">
                <p className="text-[10px] text-muted-foreground mb-2">
                  Type <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded-lg">{confirmPhrase}</span> to confirm
                </p>
                <input
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  className="w-full h-10 rounded-xl border bg-muted/30 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono transition-all"
                  placeholder={confirmPhrase}
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" className="flex-1 text-[10px] h-10 rounded-xl" onClick={handleClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                size="sm"
                className="flex-1 text-[10px] h-10 rounded-xl gap-1.5"
                onClick={handleConfirm}
                disabled={loading || !phraseMatch}
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
