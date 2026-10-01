import { Temporal as TemporalPolyfill } from '@js-temporal/polyfill';

const g = globalThis as Record<string, unknown>;
if (typeof g.Temporal === 'undefined') {
  g.Temporal = TemporalPolyfill;
}

export {};