import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, Move, Pin, PinOff, ExternalLink, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PopoutWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  footer?: React.ReactNode;
  onDetach?: () => void;
  className?: string;
}

export const PopoutWindow: React.FC<PopoutWindowProps> = ({
  open, onOpenChange, title, subtitle, icon, children,
  initialWidth = 480, initialHeight = 520,
  initialX, initialY, footer, onDetach, className,
}) => {
  const [maximized, setMaximized] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState({
    x: initialX ?? Math.max(100, window.innerWidth / 2 - initialWidth / 2),
    y: initialY ?? Math.max(80, window.innerHeight / 2 - initialHeight / 2),
  });
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  if (!open) return null;

  const startDrag = (e: React.MouseEvent) => {
    if (maximized) return;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setDragging(true);
  };

  return (
    <>
      {/* Optional backdrop when not pinned */}
      {!pinned && (
        <div className="fixed inset-0 z-[60] bg-background/30 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      )}
      <div
        className={cn(
          'fixed z-[65] flex flex-col bg-card border rounded-3xl shadow-elevated overflow-hidden transition-all',
          maximized && 'inset-4 !w-auto !h-auto',
          dragging && 'cursor-grabbing',
          !dragging && !maximized && 'cursor-default',
          className,
        )}
        style={maximized ? undefined : {
          left: pos.x, top: pos.y,
          width: size.w, height: size.h,
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 border-b bg-muted/20 select-none shrink-0"
          onMouseDown={startDrag}
        >
          {icon && <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">{icon}</div>}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">{title}</div>
            {subtitle && <div className="text-[9px] text-muted-foreground truncate">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={() => setPinned(!pinned)}>
              {pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={() => setMaximized(!maximized)}>
              {maximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            {onDetach && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={onDetach}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={() => onOpenChange(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t px-4 py-2.5 bg-muted/10 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};
