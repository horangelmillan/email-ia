export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version?: string;
}

export interface ReadinessStatus {
  status: 'ok' | 'error';
  timestamp: string;
  checks: Record<string, 'ok' | 'error'>;
}

export function getHealth(): HealthStatus {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

export function getReadiness(checks: Record<string, 'ok' | 'error'> = {}): ReadinessStatus {
  const hasError = Object.values(checks).some((v) => v === 'error');
  return {
    status: hasError ? 'error' : 'ok',
    timestamp: new Date().toISOString(),
    checks,
  };
}
