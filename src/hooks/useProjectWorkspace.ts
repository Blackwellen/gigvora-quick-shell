/**
 * Convenience hook — given a projectId from the URL, resolve the active
 * workspace (first non-cancelled returned by the PWH list endpoint) and
 * expose its detail + mutation hooks. Used by project pages to share a
 * single source of truth.
 */
import { useMemo } from 'react';
import {
  useWorkspaces, useWorkspaceDetail, pwhApiConfigured,
  useTransitionMilestone, useSubmitDeliverable, useReviewDeliverable,
  useStartHandover, useHoldWorkspace, useCancelWorkspace, useCloseWorkspace,
  useKickoffWorkspace, useCompleteChecklistItem,
  type Workspace,
} from '@/lib/api/projectWorkspaces';

export function useProjectWorkspace(projectId?: string) {
  const apiOn = pwhApiConfigured();
  const list = useWorkspaces(projectId ? { projectId } : {});
  const workspaceId = useMemo(() => {
    return list.data?.find((w) => w.status !== 'cancelled')?.id ?? list.data?.[0]?.id;
  }, [list.data]);
  const detail = useWorkspaceDetail(workspaceId);
  const workspace: Workspace | undefined = detail.data ?? list.data?.[0];

  const mutations = {
    kickoff: useKickoffWorkspace(workspaceId ?? ''),
    transitionMilestone: useTransitionMilestone(workspaceId ?? ''),
    submitDeliverable: useSubmitDeliverable(workspaceId ?? ''),
    reviewDeliverable: useReviewDeliverable(workspaceId ?? ''),
    completeChecklistItem: useCompleteChecklistItem(workspaceId ?? ''),
    startHandover: useStartHandover(workspaceId ?? ''),
    hold: useHoldWorkspace(workspaceId ?? ''),
    cancel: useCancelWorkspace(workspaceId ?? ''),
    close: useCloseWorkspace(workspaceId ?? ''),
  };

  return {
    apiOn,
    workspaceId,
    workspace,
    isLoading: list.isLoading || detail.isLoading,
    isFetching: list.isFetching || detail.isFetching,
    error: (list.error ?? detail.error) as Error | undefined,
    mutations,
  };
}
