import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Period } from '@/lib/types'

export type Project = {
  id: string
  name: string
  colorIndex: number
}

export type EntryRow = {
  projectId: string
  date: string
  hours: number
}

export type Entries = Record<string, Record<string, number>>


function entriesQueryKey(period: Period) {
  return ['timesheet', 'entries', period.year, period.month, period.half]
}

function rowsToEntries(rows: EntryRow[]): Entries {
  const out: Entries = {}
  for (const row of rows) {
    const d = new Date(row.date + 'T00:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!out[key]) out[key] = {}
    out[key][row.projectId] = row.hours
  }
  return out
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['timesheet', 'projects'],
    queryFn: () => api.get('/timesheet/projects').then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useTimesheetEntries(period: Period) {
  return useQuery<Entries>({
    queryKey: entriesQueryKey(period),
    queryFn: () =>
      api
        .get('/timesheet/entries', {
          params: { year: period.year, month: period.month, half: period.half },
        })
        .then((r) => rowsToEntries(r.data)),
    staleTime: 60_000,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { name: string; colorIndex: number }) =>
      api.post('/timesheet/projects', vars).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', 'projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => api.delete(`/timesheet/projects/${projectId}`),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['timesheet', 'projects'] })
      const previous = queryClient.getQueryData<Project[]>(['timesheet', 'projects'])
      queryClient.setQueryData<Project[]>(['timesheet', 'projects'], (old) =>
        (old ?? []).filter((p) => p.id !== projectId)
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['timesheet', 'projects'], context.previous)
      }
    },
  })
}

export function useUpsertEntry(period: Period) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { projectId: string; date: string; hours: number }) => api.put('/timesheet/entries', vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entriesQueryKey(period) })
    },
  })
}
