// Tax form data models and interfaces for charitable donations

export interface CashDonation {
  id: string;
  date: string; // YYYY-MM-DD format
  charityName: string;
  charityEIN: string;
  amount: number; // in cents
  isIRSQualified: boolean; // Pub 78 eligible
  hasAcknowledgment: boolean; // Required for gifts ≥ $250
  acknowledgmentDate?: string; // Date of acknowledgment letter
  description?: string; // Optional description
}

export interface NonCashDonation {
  id: string;
  date: string; // YYYY-MM-DD format
  charityName: string;
  charityEIN: string;
  description: string; // Description of donated property
  fairMarketValue: number; // in cents
  isIRSQualified: boolean; // Pub 78 eligible
  hasAppraisal: boolean; // Required for gifts > $5,000
  appraisalDate?: string; // Date of appraisal
  appraisalValue?: number; // Appraised value in cents
  acquisitionDate?: string; // When donor acquired the property
  acquisitionCost?: number; // Original cost basis in cents
  methodOfAcquisition?: 'purchase' | 'gift' | 'inheritance' | 'other';
}

export type Donation = CashDonation | NonCashDonation;

export interface TaxFormSummary {
  // Schedule A totals
  cashContributions: number; // Line 11
  nonCashContributions: number; // Line 12
  totalCharitableContributions: number; // Line 13
  
  // Form 8283 requirements
  requiresForm8283: boolean;
  requiresForm8283SectionA: boolean; // Non-cash gifts > $500
  requiresForm8283SectionB: boolean; // Non-cash gifts > $5,000
  
  // Documentation requirements
  missingAcknowledgment: MissingDocumentation[];
  missingAppraisal: MissingDocumentation[];
  missingForm8283: MissingDocumentation[];
  
  // Year and totals
  taxYear: number;
  totalDonations: number;
  totalCashDonations: number;
  totalNonCashDonations: number;
  qualifiedDonations: number; // Only IRS-qualified donations
  nonQualifiedDonations: number; // Non-qualified donations
}

export interface MissingDocumentation {
  donationId: string;
  charityName: string;
  amount: number;
  issue: string;
  requiredAction: string;
  deadline?: string; // If applicable
}

export interface ScheduleA {
  // Personal Information
  name: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  
  // Charitable Contributions
  cashContributions: number; // Line 11
  nonCashContributions: number; // Line 12
  totalCharitableContributions: number; // Line 13
  
  // Other deductions (placeholder for future expansion)
  otherDeductions: number; // Line 16
  totalItemizedDeductions: number; // Line 17
  
  // Tax year
  taxYear: number;
}

export interface Form8283SectionA {
  // Part I - Information on Donated Property
  propertyDescription: string;
  dateOfContribution: string;
  fairMarketValue: number;
  howPropertyWasAcquired: string;
  dateOfAcquisition: string;
  costOrAdjustedBasis: number;
  
  // Part II - Donee Information
  doneeName: string;
  doneeAddress: string;
  doneeCity: string;
  doneeState: string;
  doneeZip: string;
  doneeEIN: string;
  
  // Part III - Appraisal Information (if applicable)
  requiresAppraisal: boolean;
  appraisedValue?: number;
  appraisalDate?: string;
  appraiserName?: string;
  appraiserAddress?: string;
  appraiserCity?: string;
  appraiserState?: string;
  appraiserZip?: string;
  appraiserEIN?: string;
  
  // Part IV - Donee Acknowledgment
  doneeAcknowledgment: boolean;
  doneeSignature?: string;
  doneeTitle?: string;
  doneeDate?: string;
}

export interface Form8283SectionB {
  // Part I - Information on Donated Property
  propertyDescription: string;
  dateOfContribution: string;
  fairMarketValue: number;
  howPropertyWasAcquired: string;
  dateOfAcquisition: string;
  costOrAdjustedBasis: number;
  
  // Part II - Donee Information
  doneeName: string;
  doneeAddress: string;
  doneeCity: string;
  doneeState: string;
  doneeZip: string;
  doneeEIN: string;
  
  // Part III - Appraisal Information (REQUIRED for Section B)
  appraisedValue: number;
  appraisalDate: string;
  appraiserName: string;
  appraiserAddress: string;
  appraiserCity: string;
  appraiserState: string;
  appraiserZip: string;
  appraiserEIN: string;
  
  // Part IV - Donee Acknowledgment (REQUIRED for Section B)
  doneeSignature: string;
  doneeTitle: string;
  doneeDate: string;
}

export interface TaxFormData {
  summary: TaxFormSummary;
  scheduleA: ScheduleA;
  form8283SectionA?: Form8283SectionA[];
  form8283SectionB?: Form8283SectionB[];
  personalInfo: {
    name: string;
    ssn: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
}

// IRS Rules and Constants
export const IRS_RULES = {
  CASH_ACKNOWLEDGMENT_THRESHOLD: 25000, // $250.00 in cents
  NON_CASH_FORM_8283_THRESHOLD: 50000, // $500.00 in cents
  NON_CASH_APPRAISAL_THRESHOLD: 500000, // $5,000.00 in cents
  STANDARD_DEDUCTION: {
    2024: 14600, // $14,600 in cents
    2023: 13850, // $13,850 in cents
  }
} as const;

// Validation rules
export interface ValidationRule {
  field: string;
  required: boolean;
  minValue?: number;
  maxValue?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage: string;
}

export const TAX_FORM_VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'charityEIN',
    required: true,
    pattern: /^\d{2}-\d{7}$/,
    errorMessage: 'EIN must be in format XX-XXXXXXX'
  },
  {
    field: 'amount',
    required: true,
    minValue: 1,
    errorMessage: 'Amount must be greater than $0.01'
  },
  {
    field: 'date',
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    errorMessage: 'Date must be in YYYY-MM-DD format'
  }
];
