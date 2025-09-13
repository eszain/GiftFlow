export type Signal = { label: string; weight?: number; proof?: string };

export type ResolveResult = {
  subjectType: 'charity' | 'personal';
  title?: string;
  org?: { name: string; ein?: string; subsection?: string; pub78_eligible?: boolean };
  deductible: boolean;
  signals: Signal[];
  cacheKey: string;
};
