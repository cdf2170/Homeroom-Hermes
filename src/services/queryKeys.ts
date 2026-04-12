export const qk = {
  agents: {
    all:      () => ['agents'] as const,
    detail:   (id: string) => ['agents', id] as const,
    runs:     (id: string) => ['agents', id, 'runs'] as const,
    activity: (id: string) => ['agents', id, 'activity'] as const,
  },
  runs: {
    all: () => ['runs', 'all'] as const,
  },
  audit: {
    all: () => ['audit'] as const,
  },
  health: {
    all: () => ['health'] as const,
  },
  settings: {
    all: () => ['settings'] as const,
  },
  trust: {
    findings: () => ['trust', 'findings'] as const,
  },
  credentials: {
    all: () => ['credentials'] as const,
  },
};
