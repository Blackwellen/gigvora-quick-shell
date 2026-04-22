import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

/* ══════════════════════════════════════════════
   Cross-Linking & Overlay Navigation Provider
   ══════════════════════════════════════════════
   Manages a navigation stack so users can drill
   into linked entities from any overlay without
   losing context. Supports:
   - entity preview stack (breadcrumb trail)
   - follow-through actions from overlays
   - compare mode toggling
   - pop-out window management
   - media viewer state
   ══════════════════════════════════════════════ */

export type OverlayEntityType =
  | 'person' | 'company' | 'gig' | 'service' | 'job' | 'project'
  | 'event' | 'group' | 'order' | 'dispute' | 'ticket' | 'creator'
  | 'proposal' | 'lead' | 'candidate' | 'account';

export interface OverlayEntity {
  id: string;
  type: OverlayEntityType;
  title: string;
  subtitle?: string;
  avatar?: string;
  status?: string;
  statusColor?: 'healthy' | 'caution' | 'blocked' | 'premium' | 'live' | 'pending';
  detailPath?: string;
  meta?: Record<string, string>;
  tags?: string[];
  description?: string;
  verified?: boolean;
  location?: string;
  rating?: number;
  linkedEntities?: Array<{ id: string; type: OverlayEntityType; label: string }>;
}

export interface FollowThroughAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  type: 'navigate' | 'modal' | 'wizard' | 'popout';
  target?: string;
  data?: Record<string, unknown>;
}

interface PopoutState {
  id: string;
  entity?: OverlayEntity;
  title: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface MediaViewerState {
  items: Array<{
    id: string;
    type: 'image' | 'video' | 'document' | 'podcast' | 'webinar';
    src: string;
    title?: string;
    description?: string;
    duration?: string;
    thumbnail?: string;
  }>;
  initialIndex: number;
}

interface OverlayContextValue {
  // Entity preview stack
  previewStack: OverlayEntity[];
  pushPreview: (entity: OverlayEntity) => void;
  popPreview: () => void;
  clearPreviewStack: () => void;
  currentPreview: OverlayEntity | null;

  // Compare mode
  compareItems: OverlayEntity[];
  toggleCompareItem: (entity: OverlayEntity) => void;
  clearCompare: () => void;
  isCompareOpen: boolean;
  setCompareOpen: (open: boolean) => void;

  // Pop-out windows
  popouts: PopoutState[];
  openPopout: (popout: PopoutState) => void;
  closePopout: (id: string) => void;

  // Media viewer
  mediaViewer: MediaViewerState | null;
  openMediaViewer: (state: MediaViewerState) => void;
  closeMediaViewer: () => void;

  // Follow-through
  executeFollowThrough: (action: FollowThroughAction) => void;
  onFollowThrough?: (action: FollowThroughAction) => void;
  setFollowThroughHandler: (handler: (action: FollowThroughAction) => void) => void;

  // Quick actions
  openEntityPreview: (entity: OverlayEntity) => void;
  navigateToEntity: (entity: OverlayEntity) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export const useOverlayContext = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlayContext must be used within OverlayProvider');
  return ctx;
};

export const useOverlayContextSafe = () => useContext(OverlayContext);

interface OverlayProviderProps {
  children: React.ReactNode;
  onNavigate?: (path: string) => void;
}

export const OverlayProvider: React.FC<OverlayProviderProps> = ({ children, onNavigate }) => {
  const [previewStack, setPreviewStack] = useState<OverlayEntity[]>([]);
  const [compareItems, setCompareItems] = useState<OverlayEntity[]>([]);
  const [isCompareOpen, setCompareOpen] = useState(false);
  const [popouts, setPopouts] = useState<PopoutState[]>([]);
  const [mediaViewer, setMediaViewer] = useState<MediaViewerState | null>(null);
  const followThroughRef = useRef<((action: FollowThroughAction) => void) | null>(null);

  const pushPreview = useCallback((entity: OverlayEntity) => {
    setPreviewStack(prev => [...prev, entity]);
  }, []);

  const popPreview = useCallback(() => {
    setPreviewStack(prev => prev.slice(0, -1));
  }, []);

  const clearPreviewStack = useCallback(() => setPreviewStack([]), []);

  const toggleCompareItem = useCallback((entity: OverlayEntity) => {
    setCompareItems(prev =>
      prev.find(e => e.id === entity.id)
        ? prev.filter(e => e.id !== entity.id)
        : prev.length < 4 ? [...prev, entity] : prev
    );
  }, []);

  const clearCompare = useCallback(() => { setCompareItems([]); setCompareOpen(false); }, []);

  const openPopout = useCallback((popout: PopoutState) => {
    setPopouts(prev => [...prev.filter(p => p.id !== popout.id), popout]);
  }, []);

  const closePopout = useCallback((id: string) => {
    setPopouts(prev => prev.filter(p => p.id !== id));
  }, []);

  const openMediaViewer = useCallback((state: MediaViewerState) => setMediaViewer(state), []);
  const closeMediaViewer = useCallback(() => setMediaViewer(null), []);

  const executeFollowThrough = useCallback((action: FollowThroughAction) => {
    if (action.type === 'navigate' && action.target) {
      onNavigate?.(action.target);
    }
    followThroughRef.current?.(action);
  }, [onNavigate]);

  const setFollowThroughHandler = useCallback((handler: (action: FollowThroughAction) => void) => {
    followThroughRef.current = handler;
  }, []);

  const openEntityPreview = useCallback((entity: OverlayEntity) => {
    pushPreview(entity);
  }, [pushPreview]);

  const navigateToEntity = useCallback((entity: OverlayEntity) => {
    if (entity.detailPath) {
      onNavigate?.(entity.detailPath);
      clearPreviewStack();
    }
  }, [onNavigate, clearPreviewStack]);

  const currentPreview = previewStack.length > 0 ? previewStack[previewStack.length - 1] : null;

  return (
    <OverlayContext.Provider value={{
      previewStack, pushPreview, popPreview, clearPreviewStack, currentPreview,
      compareItems, toggleCompareItem, clearCompare, isCompareOpen, setCompareOpen,
      popouts, openPopout, closePopout,
      mediaViewer, openMediaViewer, closeMediaViewer,
      executeFollowThrough, setFollowThroughHandler,
      openEntityPreview, navigateToEntity,
    }}>
      {children}
    </OverlayContext.Provider>
  );
};
