import {
  CashDonation,
  NonCashDonation,
  Donation,
  TaxFormSummary,
  MissingDocumentation,
  ScheduleA,
  Form8283SectionA,
  Form8283SectionB,
  TaxFormData,
  IRS_RULES
} from './types';

export class TaxFormCalculator {
  private donations: Donation[];
  private taxYear: number;

  constructor(donations: Donation[], taxYear: number) {
    this.donations = donations;
    this.taxYear = taxYear;
  }

  /**
   * Normalize EIN format to XX-XXXXXXX
   */
  private normalizeEIN(ein: string | undefined): string {
    if (!ein || ein.trim() === '') return '';
    
    // Remove all non-digits
    const digits = ein.replace(/\D/g, '');
    
    // Must be exactly 9 digits
    if (digits.length !== 9) return ein;
    
    // Format as XX-XXXXXXX
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  /**
   * Calculate tax form summary with all IRS requirements
   */
  public calculateSummary(): TaxFormSummary {
    const cashDonations = this.donations.filter((d): d is CashDonation => 'amount' in d);
    const nonCashDonations = this.donations.filter((d): d is NonCashDonation => 'fairMarketValue' in d);

    // Calculate totals
    const totalCashDonations = cashDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalNonCashDonations = nonCashDonations.reduce((sum, d) => sum + d.fairMarketValue, 0);
    const totalDonations = totalCashDonations + totalNonCashDonations;

    // Calculate qualified vs non-qualified donations
    const qualifiedCash = cashDonations
      .filter(d => d.isIRSQualified)
      .reduce((sum, d) => sum + d.amount, 0);
    const qualifiedNonCash = nonCashDonations
      .filter(d => d.isIRSQualified)
      .reduce((sum, d) => sum + d.fairMarketValue, 0);
    const qualifiedDonations = qualifiedCash + qualifiedNonCash;
    const nonQualifiedDonations = totalDonations - qualifiedDonations;

    // Check Form 8283 requirements
    const requiresForm8283SectionA = nonCashDonations.some(d => d.fairMarketValue > IRS_RULES.NON_CASH_FORM_8283_THRESHOLD);
    const requiresForm8283SectionB = nonCashDonations.some(d => d.fairMarketValue > IRS_RULES.NON_CASH_APPRAISAL_THRESHOLD);
    const requiresForm8283 = requiresForm8283SectionA || requiresForm8283SectionB;

    // Check for missing documentation
    const missingAcknowledgment = this.checkMissingAcknowledgments(cashDonations);
    const missingAppraisal = this.checkMissingAppraisals(nonCashDonations);
    const missingForm8283 = this.checkMissingForm8283(nonCashDonations);

    return {
      // Schedule A totals
      cashContributions: qualifiedCash,
      nonCashContributions: qualifiedNonCash,
      totalCharitableContributions: qualifiedDonations,
      
      // Form 8283 requirements
      requiresForm8283,
      requiresForm8283SectionA,
      requiresForm8283SectionB,
      
      // Documentation requirements
      missingAcknowledgment,
      missingAppraisal,
      missingForm8283,
      
      // Year and totals
      taxYear: this.taxYear,
      totalDonations,
      totalCashDonations,
      totalNonCashDonations,
      qualifiedDonations,
      nonQualifiedDonations
    };
  }

  /**
   * Generate Schedule A form data
   */
  public generateScheduleA(personalInfo: TaxFormData['personalInfo']): ScheduleA {
    const summary = this.calculateSummary();
    
    return {
      name: personalInfo.name,
      ssn: personalInfo.ssn,
      address: personalInfo.address,
      city: personalInfo.city,
      state: personalInfo.state,
      zip: personalInfo.zip,
      
      cashContributions: summary.cashContributions,
      nonCashContributions: summary.nonCashContributions,
      totalCharitableContributions: summary.totalCharitableContributions,
      
      otherDeductions: 0, // Placeholder for future expansion
      totalItemizedDeductions: summary.totalCharitableContributions,
      
      taxYear: this.taxYear
    };
  }

  /**
   * Generate Form 8283 Section A entries (non-cash gifts > $500)
   */
  public generateForm8283SectionA(): Form8283SectionA[] {
    const nonCashDonations = this.donations.filter((d): d is NonCashDonation => 
      'fairMarketValue' in d && d.fairMarketValue > IRS_RULES.NON_CASH_FORM_8283_THRESHOLD
    );

    return nonCashDonations.map(donation => ({
      propertyDescription: donation.description,
      dateOfContribution: donation.date,
      fairMarketValue: donation.fairMarketValue,
      howPropertyWasAcquired: donation.methodOfAcquisition || 'other',
      dateOfAcquisition: donation.acquisitionDate || '',
      costOrAdjustedBasis: donation.acquisitionCost || 0,
      
      doneeName: donation.charityName,
      doneeAddress: '', // Would need to be provided or looked up
      doneeCity: '',
      doneeState: '',
      doneeZip: '',
      doneeEIN: this.normalizeEIN(donation.charityEIN),
      
      requiresAppraisal: donation.fairMarketValue > IRS_RULES.NON_CASH_APPRAISAL_THRESHOLD,
      appraisedValue: donation.appraisalValue,
      appraisalDate: donation.appraisalDate,
      appraiserName: '',
      appraiserAddress: '',
      appraiserCity: '',
      appraiserState: '',
      appraiserZip: '',
      appraiserEIN: '',
      
      doneeAcknowledgment: false, // Would need to be provided
      doneeSignature: '',
      doneeTitle: '',
      doneeDate: ''
    }));
  }

  /**
   * Generate Form 8283 Section B entries (non-cash gifts > $5,000)
   */
  public generateForm8283SectionB(): Form8283SectionB[] {
    const nonCashDonations = this.donations.filter((d): d is NonCashDonation => 
      'fairMarketValue' in d && d.fairMarketValue > IRS_RULES.NON_CASH_APPRAISAL_THRESHOLD
    );

    return nonCashDonations.map(donation => ({
      propertyDescription: donation.description,
      dateOfContribution: donation.date,
      fairMarketValue: donation.fairMarketValue,
      howPropertyWasAcquired: donation.methodOfAcquisition || 'other',
      dateOfAcquisition: donation.acquisitionDate || '',
      costOrAdjustedBasis: donation.acquisitionCost || 0,
      
      doneeName: donation.charityName,
      doneeAddress: '', // Would need to be provided or looked up
      doneeCity: '',
      doneeState: '',
      doneeZip: '',
      doneeEIN: this.normalizeEIN(donation.charityEIN),
      
      appraisedValue: donation.appraisalValue || donation.fairMarketValue,
      appraisalDate: donation.appraisalDate || '',
      appraiserName: '',
      appraiserAddress: '',
      appraiserCity: '',
      appraiserState: '',
      appraiserZip: '',
      appraiserEIN: '',
      
      doneeSignature: '',
      doneeTitle: '',
      doneeDate: ''
    }));
  }

  /**
   * Generate complete tax form data
   */
  public generateTaxFormData(personalInfo: TaxFormData['personalInfo']): TaxFormData {
    const summary = this.calculateSummary();
    const scheduleA = this.generateScheduleA(personalInfo);
    const form8283SectionA = summary.requiresForm8283SectionA ? this.generateForm8283SectionA() : undefined;
    const form8283SectionB = summary.requiresForm8283SectionB ? this.generateForm8283SectionB() : undefined;

    return {
      summary,
      scheduleA,
      form8283SectionA,
      form8283SectionB,
      personalInfo
    };
  }

  /**
   * Check for missing acknowledgments for cash donations ≥ $250
   */
  private checkMissingAcknowledgments(cashDonations: CashDonation[]): MissingDocumentation[] {
    return cashDonations
      .filter(donation => 
        donation.amount >= IRS_RULES.CASH_ACKNOWLEDGMENT_THRESHOLD && 
        !donation.hasAcknowledgment
      )
      .map(donation => ({
        donationId: donation.id,
        charityName: donation.charityName,
        amount: donation.amount,
        issue: `Cash donation of $${(donation.amount / 100).toFixed(2)} missing acknowledgment`,
        requiredAction: 'Obtain written acknowledgment from charity',
        deadline: 'Before filing tax return'
      }));
  }

  /**
   * Check for missing appraisals for non-cash donations > $5,000
   */
  private checkMissingAppraisals(nonCashDonations: NonCashDonation[]): MissingDocumentation[] {
    return nonCashDonations
      .filter(donation => 
        donation.fairMarketValue > IRS_RULES.NON_CASH_APPRAISAL_THRESHOLD && 
        !donation.hasAppraisal
      )
      .map(donation => ({
        donationId: donation.id,
        charityName: donation.charityName,
        amount: donation.fairMarketValue,
        issue: `Non-cash donation of $${(donation.fairMarketValue / 100).toFixed(2)} missing appraisal`,
        requiredAction: 'Obtain qualified appraisal from certified appraiser',
        deadline: 'Before filing tax return'
      }));
  }

  /**
   * Check for missing Form 8283 requirements
   */
  private checkMissingForm8283(nonCashDonations: NonCashDonation[]): MissingDocumentation[] {
    const missing: MissingDocumentation[] = [];
    
    nonCashDonations.forEach(donation => {
      if (donation.fairMarketValue > IRS_RULES.NON_CASH_FORM_8283_THRESHOLD) {
        missing.push({
          donationId: donation.id,
          charityName: donation.charityName,
          amount: donation.fairMarketValue,
          issue: `Non-cash donation of $${(donation.fairMarketValue / 100).toFixed(2)} requires Form 8283`,
          requiredAction: 'Complete Form 8283 Section A',
          deadline: 'Attach to tax return'
        });
      }
      
      if (donation.fairMarketValue > IRS_RULES.NON_CASH_APPRAISAL_THRESHOLD) {
        missing.push({
          donationId: donation.id,
          charityName: donation.charityName,
          amount: donation.fairMarketValue,
          issue: `Non-cash donation of $${(donation.fairMarketValue / 100).toFixed(2)} requires Form 8283 Section B`,
          requiredAction: 'Complete Form 8283 Section B with appraisal and charity signature',
          deadline: 'Attach to tax return'
        });
      }
    });
    
    return missing;
  }

  /**
   * Validate donation data against IRS requirements
   */
  public validateDonations(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    this.donations.forEach((donation, index) => {
      // EIN validation - more flexible format and optional for non-IRS qualified donations
      if (donation.charityEIN && donation.charityEIN.trim() !== '') {
        // Allow various EIN formats: XX-XXXXXXX, XXXXXXXXX, XX-XXXXXXX, etc.
        const einPattern = /^\d{2}-?\d{7}$/;
        if (!einPattern.test(donation.charityEIN.replace(/\s/g, ''))) {
          errors.push(`Donation ${index + 1}: Invalid EIN format. Use format XX-XXXXXXX or XXXXXXXXX`);
        }
      } else if (donation.isIRSQualified) {
        // EIN is required for IRS qualified donations
        errors.push(`Donation ${index + 1}: EIN is required for IRS qualified donations`);
      }
      
      if (!donation.date || !donation.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`Donation ${index + 1}: Invalid date format. Use YYYY-MM-DD`);
      }
      
      const amount = 'amount' in donation ? donation.amount : donation.fairMarketValue;
      if (amount <= 0) {
        errors.push(`Donation ${index + 1}: Amount must be greater than $0.01`);
      }
      
      // Check for future dates
      if (new Date(donation.date) > new Date()) {
        errors.push(`Donation ${index + 1}: Date cannot be in the future`);
      }
      
      // Check for dates too far in the past (more than 7 years)
      const sevenYearsAgo = new Date();
      sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
      if (new Date(donation.date) < sevenYearsAgo) {
        errors.push(`Donation ${index + 1}: Date is too far in the past (more than 7 years)`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get recommendations for optimizing deductions
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const summary = this.calculateSummary();
    
    // Check if itemizing is worth it
    const standardDeduction = IRS_RULES.STANDARD_DEDUCTION[this.taxYear as keyof typeof IRS_RULES.STANDARD_DEDUCTION] || IRS_RULES.STANDARD_DEDUCTION[2024];
    
    if (summary.totalCharitableContributions < standardDeduction) {
      recommendations.push(`Consider the standard deduction ($${(standardDeduction / 100).toFixed(2)}) instead of itemizing charitable contributions`);
    }
    
    // Check for missing acknowledgments
    if (summary.missingAcknowledgment.length > 0) {
      recommendations.push(`Obtain acknowledgments for ${summary.missingAcknowledgment.length} donations to maximize deductions`);
    }
    
    // Check for missing appraisals
    if (summary.missingAppraisal.length > 0) {
      recommendations.push(`Obtain appraisals for ${summary.missingAppraisal.length} high-value donations to support deductions`);
    }
    
    // Check for non-qualified donations
    if (summary.nonQualifiedDonations > 0) {
      recommendations.push(`Verify that non-qualified donations ($${(summary.nonQualifiedDonations / 100).toFixed(2)}) are properly documented`);
    }
    
    return recommendations;
  }
}
