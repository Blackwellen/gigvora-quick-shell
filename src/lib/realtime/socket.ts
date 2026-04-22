/**
 * Centralised Socket.IO client with reconnect, exponential backoff, room helpers
 * and per-page lifecycle hooks. Used by inbox, calls, podcasts, webinars,
 * notifications, presence and any other realtime surface.
 *
 * Keeps a single singleton across the app — call useRealtime() from React.
 */
import { useEffect, useRef } from 'react';

type Listener = (payload: any) => void;

interface RealtimeClient {
  connect(identityId: string): Promise<void>;
  disconnect(): void;
  on(event: string, fn: Listener): () => void;
  emit(event: string, payload?: any): void;
  joinTopic(topic: string): void;
  joinEntity(entityType: string, entityId: string): void;
  /** Convenience aliases for room-style subscriptions used across hooks. */
  joinRoom(room: string): void;
  leaveRoom(room: string): void;
  status(): 'idle' | 'connecting' | 'open' | 'closed' | 'reconnecting';
}

let client: any = null;
let listeners = new Map<string, Set<Listener>>();
let status: RealtimeClient['status'] extends () => infer R ? R : never = 'idle';

async function loadIO() {
  // dynamic import so non-realtime pages stay lean
  const mod: any = await import('socket.io-client').catch(() => null);
  return mod?.io;
}

function notify(event: string, payload: any) { listeners.get(event)?.forEach((l) => l(payload)); }

export const realtime: RealtimeClient = {
  async connect(identityId) {
    if (client?.connected) return;
    status = 'connecting';
    const io = await loadIO();
    if (!io) { status = 'closed'; return; }
    const url = (import.meta as any).env?.VITE_REALTIME_URL ?? '/realtime';
    client = io(url, {
      transports: ['websocket'], reconnection: true,
      reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 15000,
      auth: { identityId }, query: { identityId },
    });
    client.on('connect', () => { status = 'open'; });
    client.on('reconnect_attempt', () => { status = 'reconnecting'; });
    client.on('disconnect', () => { status = 'closed'; });
    client.onAny((event: string, payload: any) => notify(event, payload));
  },
  disconnect() { try { client?.disconnect?.(); } catch {} status = 'closed'; client = null; listeners.clear(); },
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(fn);
    return () => listeners.get(event)?.delete(fn);
  },
  emit(event, payload) { client?.emit?.(event, payload); },
  joinTopic(topic) { client?.emit?.('subscribe.topic', { topic }); },
  joinEntity(entityType, entityId) { client?.emit?.('subscribe.entity', { entityType, entityId }); },
  joinRoom(room) { client?.emit?.('subscribe.topic', { topic: room }); },
  leaveRoom(room) { client?.emit?.('unsubscribe.topic', { topic: room }); },
  status: () => status,
};

/** React hook — subscribe to a single event for the lifetime of the component. */
export function useRealtimeEvent<T = any>(event: string, handler: (payload: T) => void) {
  const ref = useRef(handler); ref.current = handler;
  useEffect(() => realtime.on(event, (p) => ref.current(p)), [event]);
}
