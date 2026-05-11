import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTimeMachineScenarios() {
  return useQuery({
    queryKey: ['timeMachine', 'scenarios'],
    queryFn: async () => {
      const { data } = await apiClient.get('/time-machine/scenarios');
      return data.scenarios as any[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useTimeMachineScenario(slug: string | undefined) {
  return useQuery({
    queryKey: ['timeMachine', 'scenario', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/time-machine/scenarios/${slug}`);
      return data.scenario;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTimeMachineStepContext(slug: string | undefined, year: number | undefined) {
  return useQuery({
    queryKey: ['timeMachine', 'step', slug, year],
    queryFn: async () => {
      const { data } = await apiClient.get(`/time-machine/scenarios/${slug}/step/${year}`);
      return data;
    },
    enabled: !!slug && !!year,
    staleTime: 30 * 60 * 1000,
  });
}

export function useTimeMachineUserSessions() {
  return useQuery({
    queryKey: ['timeMachine', 'sessions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/time-machine/sessions');
      return data.sessions as any[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useTimeMachineSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['timeMachine', 'session', sessionId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/time-machine/sessions/${sessionId}`);
      return data.session;
    },
    enabled: !!sessionId,
    staleTime: 0,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateTimeMachineSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scenarioSlug: string) => {
      const { data } = await apiClient.post('/time-machine/sessions', { scenarioSlug });
      return data.session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeMachine', 'sessions'] });
    },
  });
}

export function useSubmitTimeMachineStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      stepIndex,
      allocation,
      note,
    }: {
      sessionId: string;
      stepIndex: number;
      allocation: Record<string, number>;
      note: string;
    }) => {
      const { data } = await apiClient.put(`/time-machine/sessions/${sessionId}/step`, {
        stepIndex,
        allocation,
        note,
      });
      return data.session;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['timeMachine', 'session', variables.sessionId] });
    },
  });
}

export function useRequestKofiFeedback() {
  return useMutation({
    mutationFn: async ({ sessionId, stepIndex }: { sessionId: string; stepIndex: number }) => {
      const { data } = await apiClient.post(`/time-machine/sessions/${sessionId}/kofi`, { stepIndex });
      return data.feedback as string;
    },
  });
}

export function useRequestKofiRecap() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await apiClient.post(`/time-machine/sessions/${sessionId}/kofi-recap`, {});
      return data.recap as string;
    },
  });
}

export function useImportTimeMachineToSandbox() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await apiClient.post(`/time-machine/sessions/${sessionId}/import-to-sandbox`);
      return data as { imported: string[]; portfolioId: string };
    },
  });
}
