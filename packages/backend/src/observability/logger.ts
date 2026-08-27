import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

export interface LoggerConfig {
  level: string;
  enabled?: boolean;
}

export function createLogger(config: LoggerConfig, destination?: DestinationStream): Logger {
  if (config.enabled === false) {
    return pino({ level: 'silent', enabled: false } as unknown as LoggerOptions, destination);
  }
  const opts: LoggerOptions = {
    name: 'email-ia',
    level: config.level,
  };
  return pino(opts, destination);
}
