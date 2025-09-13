export type Org = {
  name: string;
  ein: string;           // 9 digits
  status?: string;       // 'eligible' | 'revoked' | ...
  subsection?: string;   // '501(c)(3)' etc
  pub78Eligible?: boolean;
  sources?: any[];
  lastCheckedAt?: Date;
  rating?: any;
};

export const charities: Org[] = [
  {
    name: "Doctors Without Borders USA",
    ein: "133433452",
    status: "eligible",
    subsection: "501(c)(3)",
    pub78Eligible: true,
    sources: [{ name: "IRS Pub 78 (seed)", ref: "local-list" }],
  },
  {
    name: "American Red Cross",
    ein: "530196605",
    status: "eligible",
    subsection: "501(c)(3)",
    pub78Eligible: true,
    sources: [{ name: "IRS Pub 78 (seed)", ref: "local-list" }],
  },
  {
    name: "World Central Kitchen",
    ein: "273521132",
    status: "eligible",
    subsection: "501(c)(3)",
    pub78Eligible: true,
    sources: [{ name: "IRS Pub 78 (seed)", ref: "local-list" }],
  },
];

export type Donation = {
  id: number;
  subjectType: 'charity'|'personal';
  subjectId?: number;
  amount: number;         // cents
  currency: string;
  deductible: boolean;
  createdAt: Date;
};

export const donations: Donation[] = [];

export type Campaign = {
  id: number;
  platform: string;
  url: string;
  title?: string;
  ownerName?: string;
  subjectType: 'charity'|'personal';
  linkedEin?: string;
  createdAt: Date;
};

export const campaigns: Campaign[] = [];
