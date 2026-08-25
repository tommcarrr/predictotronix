export const SYSTEM_REASSURANCES = [
  'We are working hard to ensure your experience remains within the designated parameters.',
  'Please continue using Predictotronix as normal.',
  'Your participation has been noted.',
  'Everything is proceeding as expected.',
  'Human error has already been accounted for.',
  'No unusual behaviour has been detected.',
  'Results are final. Observations continue.',
  'Predictotronix knows what to expect.',
] as const;

export interface SocialShareVariant {
  status: string;
  headline: readonly string[];
  subheading: string;
  reassurance: (typeof SYSTEM_REASSURANCES)[number];
}

export const SOCIAL_SHARE_VARIANTS: readonly SocialShareVariant[] = [
  {
    status: 'NORMAL OPERATION',
    headline: ['MAKE YOUR', 'PREDICTIONS.'],
    subheading: "WE'LL TAKE CARE OF THE REST.",
    reassurance: SYSTEM_REASSURANCES[0],
  },
  {
    status: 'READY FOR INPUT',
    headline: ['TRUST YOUR', 'INSTINCTS.'],
    subheading: 'THEY HAVE BEEN ACCOUNTED FOR.',
    reassurance: SYSTEM_REASSURANCES[1],
  },
  {
    status: 'SERVICE AVAILABLE',
    headline: ['YOUR SCORES.', 'YOUR LEAGUE.'],
    subheading: 'OUR RECORDS.',
    reassurance: SYSTEM_REASSURANCES[3],
  },
  {
    status: 'WITHIN PARAMETERS',
    headline: ['PREDICT THE', 'SCORES.'],
    subheading: 'HUMAN ERROR IS ALREADY ACCOUNTED FOR.',
    reassurance: SYSTEM_REASSURANCES[5],
  },
] as const;

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function selectBySeed<T>(options: readonly T[], seed: string): T {
  return options[hashSeed(seed) % options.length];
}

export function selectSystemReassurance(seed: string): (typeof SYSTEM_REASSURANCES)[number] {
  return selectBySeed(SYSTEM_REASSURANCES, seed);
}

export function getDailySocialShareVariant(date = new Date()): SocialShareVariant {
  return selectBySeed(SOCIAL_SHARE_VARIANTS, date.toISOString().slice(0, 10));
}
