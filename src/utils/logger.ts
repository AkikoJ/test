const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const currentLevel: Level =
  (process.env.LOG_LEVEL as Level) || 'info';

function log(level: Level, message: string, data?: unknown) {
  if (LEVELS[level] < LEVELS[currentLevel]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data !== undefined ? { data } : {}),
  };

  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
};
