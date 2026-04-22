/**
 * Domain 29 React hooks — interview planning workbench.
 *
 * Wraps the SDK with TanStack Query, subscribes to Socket.IO `interview.*`,
 * `scorecard.*`, `calibration.*`, `panel.*` events, and provides
 * deterministic fallbacks so the workbench never goes blank.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createInterviewPlanningClient,
  type Interview, type InterviewListFilters,
  type PanelListFilters, type PanelTemplate,
  type Scorecard, type ScorecardStatus,
} from '@gigvora/sdk/interview-planning';
import { realtime, useRealtimeEvent } from '@/lib/realtime/socket';

const client = createInterviewPlanningClient(fetch);

const EMPTY_INTERVIEWS = { items: [] as Interview[], total: 0, page: 1, pageSize: 20 };
const EMPTY_PANELS = { items: [] as PanelTemplate[], total: 0, page: 1, pageSize: 20 };
const EMPTY_SCORECARDS = { items: [] as Scorecard[] };

const KEY = ['interview-planning'];

function useInvalidateOnEvents(events: string[]) {
  const qc = useQueryClient();
  events.forEach((e) => useRealtimeEvent(e, () => qc.invalidateQueries({ queryKey: KEY })));
}

// -------- Panels --------
export function usePanels(filters: PanelListFilters) {
  useInvalidateOnEvents(['panel.created', 'panel.updated', 'panel.status']);
  return useQuery({
    queryKey: [...KEY, 'panels', filters],
    queryFn: () => client.listPanels(filters).catch(() => EMPTY_PANELS),
    staleTime: 30_000,
  });
}
export function usePanel(id: string | undefined) {
  return useQuery({ queryKey: [...KEY, 'panel', id], queryFn: () => client.panelDetail(id!), enabled: !!id });
}
export function useCreatePanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.createPanel>[0]) => client.createPanel(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useUpdatePanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; expectedVersion: number; patch: any }) =>
      client.updatePanel(p.id, p.expectedVersion, p.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useSetPanelStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; status: 'draft' | 'published' | 'archived' }) =>
      client.setPanelStatus(p.id, p.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// -------- Interviews --------
export function useInterviews(filters: InterviewListFilters) {
  useInvalidateOnEvents([
    'interview.created', 'interview.updated', 'interview.transitioned',
    'interview.rescheduled', 'interviewer.responded',
  ]);
  return useQuery({
    queryKey: [...KEY, 'interviews', filters],
    queryFn: () => client.listInterviews(filters).catch(() => EMPTY_INTERVIEWS),
    staleTime: 30_000,
  });
}
export function useInterview(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'interview', id],
    queryFn: () => client.interviewDetail(id!),
    enabled: !!id,
  });
}
export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { payload: any; idempotencyKey?: string }) =>
      client.createInterview(p.payload, p.idempotencyKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; expectedVersion: number; patch: any }) =>
      client.updateInterview(p.id, p.expectedVersion, p.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useTransitionInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; next: any; reason?: string }) =>
      client.transitionInterview(p.id, p.next, p.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useReschedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; startAt: string; idempotencyKey: string; reason?: string }) =>
      client.reschedule(p.id, { startAt: p.startAt, idempotencyKey: p.idempotencyKey, reason: p.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; response: 'accepted' | 'declined' | 'tentative' }) =>
      client.rsvp(p.id, p.response),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// -------- Scorecards --------
export function useScorecards(filters: { interviewId?: string; candidateId?: string; interviewerId?: string; status?: ScorecardStatus[] }) {
  useInvalidateOnEvents(['scorecard.drafted', 'scorecard.submitted', 'scorecard.withdrawn']);
  return useQuery({
    queryKey: [...KEY, 'scorecards', filters],
    queryFn: () => client.listScorecards(filters).catch(() => EMPTY_SCORECARDS),
    staleTime: 15_000,
  });
}
export function useScorecard(id: string | undefined) {
  return useQuery({ queryKey: [...KEY, 'scorecard', id], queryFn: () => client.scorecardDetail(id!), enabled: !!id });
}
export function useDraftScorecard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; expectedVersion: number; patch: any }) =>
      client.draftScorecard(p.id, { expectedVersion: p.expectedVersion, ...p.patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useSubmitScorecard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; payload: any; idempotencyKey: string }) =>
      client.submitScorecard(p.id, { ...p.payload, idempotencyKey: p.idempotencyKey }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useWithdrawScorecard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.withdrawScorecard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// -------- Calibrations --------
export function useCalibrations(filters: { candidateId?: string; jobId?: string; status?: 'open' | 'decided' }) {
  useInvalidateOnEvents(['calibration.opened', 'calibration.decided']);
  return useQuery({
    queryKey: [...KEY, 'calibrations', filters],
    queryFn: () => client.listCalibrations(filters).catch(() => ({ items: [] })),
    staleTime: 30_000,
  });
}
export function useCalibration(id: string | undefined) {
  return useQuery({ queryKey: [...KEY, 'calibration', id], queryFn: () => client.calibrationDetail(id!), enabled: !!id });
}
export function useOpenCalibration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.openCalibration>[0]) => client.openCalibration(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useDecideCalibration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; body: Parameters<typeof client.decideCalibration>[1] }) =>
      client.decideCalibration(p.id, p.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// -------- Dashboard --------
export function useInterviewWorkbenchDashboard() {
  return useQuery({
    queryKey: [...KEY, 'dashboard'],
    queryFn: () => client.dashboard().catch(() => ({})),
    refetchInterval: 60_000,
  });
}

export function useInterviewPlanningRealtime(identityId: string | undefined, tenantId = 'tenant-demo') {
  useEffect(() => {
    if (identityId) realtime.connect(identityId);
    realtime.joinRoom?.(`tenant:${tenantId}:interviews`);
    return () => { realtime.leaveRoom?.(`tenant:${tenantId}:interviews`); };
  }, [identityId, tenantId]);
}
