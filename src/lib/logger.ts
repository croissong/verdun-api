import pino from 'pino';
import path from 'path';

export const getLogger = (filename: string) => {
  const name = path.basename(filename);
  return pino({ name, base: null, useLevelLabels: true });
};
