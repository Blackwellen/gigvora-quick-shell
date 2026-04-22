/**
 * Group 4 — Enterprise frontend state contract.
 *
 * Every list/detail surface that talks to the backend renders one of four
 * states. Centralising them here makes the Playwright QA matrix possible:
 * each route is asserted to render *one* of these slots, never an infinite
 * spinner or blank canvas. Used by the 10 hardened domain pages.
 *
 *   <DataState
 *     status="loading" | "empty" | "error" | "ready"
 *     loading={<Skeleton />}
 *     empty={<Empty title="No items" />}
 *     error={<Err onRetry={refetch} />}
 *   >
 *     {data && <List items={data} />}
 *   </DataState>
 *
 * Each branch carries `data-state` so Playwright can `getByTestId('data-state-*')`
 * without relying on text content.
 */
import type { ReactNode } from 'react';

export type DataStatus = 'loading' | 'empty' | 'error' | 'ready';

interface DataStateProps {
  status: DataStatus;
  loading?: ReactNode;
  empty?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
}

const DEFAULT_LOADING = (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="flex items-center justify-center py-16 text-sm text-muted-foreground"
  >
    Loading…
  </div>
);

const DEFAULT_EMPTY = (
  <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
    Nothing to show yet.
  </div>
);

const DEFAULT_ERROR = (
  <div
    role="alert"
    className="flex flex-col items-center justify-center py-16 text-sm text-destructive"
  >
    Something went wrong. Please try again.
  </div>
);

export function DataState({
  status,
  loading = DEFAULT_LOADING,
  empty = DEFAULT_EMPTY,
  error = DEFAULT_ERROR,
  children,
}: DataStateProps) {
  if (status === 'loading') {
    return <div data-testid="data-state-loading">{loading}</div>;
  }
  if (status === 'error') {
    return <div data-testid="data-state-error">{error}</div>;
  }
  if (status === 'empty') {
    return <div data-testid="data-state-empty">{empty}</div>;
  }
  return <div data-testid="data-state-ready">{children}</div>;
}

/** Helper: derive a `DataStatus` from a TanStack Query (or similar) result. */
export function deriveStatus(args: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
}): DataStatus {
  if (args.isLoading) return 'loading';
  if (args.isError) return 'error';
  if (args.isEmpty) return 'empty';
  return 'ready';
}
