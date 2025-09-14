import { TaxFormData, ScheduleA, Form8283SectionA, Form8283SectionB } from './types';

export class TaxFormPDFGenerator {
  private formData: TaxFormData;

  constructor(formData: TaxFormData) {
    this.formData = formData;
  }

  /**
   * Generate Schedule A PDF content
   */
  public generateScheduleA(): string {
    const scheduleA = this.formData.scheduleA;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Schedule A (Form 1040) - DRAFT</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.2;
            margin: 0;
            padding: 20px;
            background: white;
        }
        .form-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .form-title {
            font-size: 16px;
            margin-bottom: 5px;
        }
        .form-subtitle {
            font-size: 12px;
            color: #666;
        }
        .draft-stamp {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #ff0000;
            color: white;
            padding: 5px 10px;
            font-weight: bold;
            transform: rotate(15deg);
            border: 2px solid #000;
        }
        .form-section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
        }
        .form-line {
            display: flex;
            margin-bottom: 5px;
            align-items: center;
        }
        .line-number {
            width: 30px;
            font-weight: bold;
        }
        .line-description {
            flex: 1;
            margin-right: 10px;
        }
        .line-amount {
            width: 100px;
            text-align: right;
            border-bottom: 1px solid #000;
            padding-right: 5px;
        }
        .total-line {
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 10px;
        }
        .personal-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
        }
        .info-field {
            display: flex;
            align-items: center;
        }
        .info-label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 80px;
        }
        .info-value {
            border-bottom: 1px solid #000;
            flex: 1;
            padding-right: 5px;
        }
        @media print {
            .draft-stamp {
                position: fixed;
            }
        }
    </style>
</head>
<body>
    <div class="draft-stamp">DRAFT - REVIEW REQUIRED</div>
    
    <div class="form-header">
        <div class="form-title">Schedule A (Form 1040)</div>
        <div class="form-subtitle">Itemized Deductions</div>
        <div class="form-subtitle">Department of the Treasury - Internal Revenue Service</div>
    </div>

    <div class="personal-info">
        <div class="info-field">
            <div class="info-label">Name:</div>
            <div class="info-value">${scheduleA.name}</div>
        </div>
        <div class="info-field">
            <div class="info-label">SSN:</div>
            <div class="info-value">${scheduleA.ssn}</div>
        </div>
        <div class="info-field">
            <div class="info-label">Address:</div>
            <div class="info-value">${scheduleA.address}</div>
        </div>
        <div class="info-field">
            <div class="info-label">City, State, ZIP:</div>
            <div class="info-value">${scheduleA.city}, ${scheduleA.state} ${scheduleA.zip}</div>
        </div>
    </div>

    <div class="form-section">
        <div class="section-title">Part I - Medical and Dental Expenses</div>
        <div class="form-line">
            <div class="line-number">1</div>
            <div class="line-description">Medical and dental expenses (see instructions)</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">2</div>
            <div class="line-description">Enter amount from Form 1040, line 11</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">3</div>
            <div class="line-description">Multiply line 2 by 7.5% (0.075)</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">4</div>
            <div class="line-description">Subtract line 3 from line 1. If line 3 is more than line 1, enter -0-</div>
            <div class="line-amount">$0.00</div>
        </div>
    </div>

    <div class="form-section">
        <div class="section-title">Part II - Taxes You Paid</div>
        <div class="form-line">
            <div class="line-number">5a</div>
            <div class="line-description">State and local income taxes</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">5b</div>
            <div class="line-description">State and local general sales taxes</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">6</div>
            <div class="line-description">Real estate taxes</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">7</div>
            <div class="line-description">Personal property taxes</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">8</div>
            <div class="line-description">Other taxes. List type and amount</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line total-line">
            <div class="line-number">9</div>
            <div class="line-description">Add lines 5a, 5b, 6, 7, and 8</div>
            <div class="line-amount">$0.00</div>
        </div>
    </div>

    <div class="form-section">
        <div class="section-title">Part III - Interest You Paid</div>
        <div class="form-line">
            <div class="line-number">10</div>
            <div class="line-description">Home mortgage interest and points reported to you on Form 1098</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">11</div>
            <div class="line-description">Home mortgage interest not reported to you on Form 1098</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">12</div>
            <div class="line-description">Points not reported to you on Form 1098</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">13</div>
            <div class="line-description">Mortgage insurance premiums</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line">
            <div class="line-number">14</div>
            <div class="line-description">Investment interest</div>
            <div class="line-amount">$0.00</div>
        </div>
        <div class="form-line total-line">
            <div class="line-number">15</div>
            <div class="line-description">Add lines 10, 11, 12, 13, and 14</div>
            <div class="line-amount">$0.00</div>
        </div>
    </div>

    <div class="form-section">
        <div class="section-title">Part IV - Gifts to Charity</div>
        <div class="form-line">
            <div class="line-number">11</div>
            <div class="line-description">Gifts by cash or check</div>
            <div class="line-amount">$${(scheduleA.cashContributions / 100).toFixed(2)}</div>
        </div>
        <div class="form-line">
            <div class="line-number">12</div>
            <div class="line-description">Other than by cash or check</div>
            <div class="line-amount">$${(scheduleA.nonCashContributions / 100).toFixed(2)}</div>
        </div>
        <div class="form-line total-line">
            <div class="line-number">13</div>
            <div class="line-description">Gifts to charity. Add lines 11 and 12</div>
            <div class="line-amount">$${(scheduleA.totalCharitableContributions / 100).toFixed(2)}</div>
        </div>
    </div>

    <div class="form-section">
        <div class="section-title">Part V - Other Itemized Deductions</div>
        <div class="form-line">
            <div class="line-number">16</div>
            <div class="line-description">Other itemized deductions (see instructions)</div>
            <div class="line-amount">$${(scheduleA.otherDeductions / 100).toFixed(2)}</div>
        </div>
        <div class="form-line total-line">
            <div class="line-number">17</div>
            <div class="line-description">Total itemized deductions. Add lines 4, 9, 15, and 16</div>
            <div class="line-amount">$${(scheduleA.totalItemizedDeductions / 100).toFixed(2)}</div>
        </div>
    </div>

    <div style="margin-top: 30px; font-size: 10px; color: #666;">
        <p><strong>Important:</strong> This is a DRAFT form generated by GiftFlow. Please review all information carefully before filing your tax return. Consult with a tax professional if you have questions.</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate Form 8283 Section A PDF content
   */
  public generateForm8283SectionA(): string {
    if (!this.formData.form8283SectionA || this.formData.form8283SectionA.length === 0) {
      return '';
    }

    const sections = this.formData.form8283SectionA;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Form 8283 - DRAFT</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            margin: 0;
            padding: 20px;
            background: white;
        }
        .form-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .draft-stamp {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #ff0000;
            color: white;
            padding: 5px 10px;
            font-weight: bold;
            transform: rotate(15deg);
            border: 2px solid #000;
        }
        .form-section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
        }
        .form-line {
            display: flex;
            margin-bottom: 5px;
            align-items: center;
        }
        .line-number {
            width: 30px;
            font-weight: bold;
        }
        .line-description {
            flex: 1;
            margin-right: 10px;
        }
        .line-amount {
            width: 100px;
            text-align: right;
            border-bottom: 1px solid #000;
            padding-right: 5px;
        }
        .line-text {
            width: 200px;
            border-bottom: 1px solid #000;
            padding-right: 5px;
        }
        .donation-entry {
            border: 1px solid #ccc;
            padding: 10px;
            margin-bottom: 15px;
            background: #f9f9f9;
        }
        .donation-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        @media print {
            .draft-stamp {
                position: fixed;
            }
        }
    </style>
</head>
<body>
    <div class="draft-stamp">DRAFT - REVIEW REQUIRED</div>
    
    <div class="form-header">
        <div>Form 8283</div>
        <div>Noncash Charitable Contributions</div>
        <div>Department of the Treasury - Internal Revenue Service</div>
    </div>

    ${sections.map((section, index) => `
    <div class="donation-entry">
        <div class="donation-title">Donation ${index + 1}: ${section.propertyDescription}</div>
        
        <div class="form-section">
            <div class="section-title">Part I - Information on Donated Property</div>
            <div class="form-line">
                <div class="line-number">1a</div>
                <div class="line-description">Description of property</div>
                <div class="line-text">${section.propertyDescription}</div>
            </div>
            <div class="form-line">
                <div class="line-number">1b</div>
                <div class="line-description">Date of contribution</div>
                <div class="line-text">${section.dateOfContribution}</div>
            </div>
            <div class="form-line">
                <div class="line-number">1c</div>
                <div class="line-description">Fair market value</div>
                <div class="line-amount">$${(section.fairMarketValue / 100).toFixed(2)}</div>
            </div>
            <div class="form-line">
                <div class="line-number">2</div>
                <div class="line-description">How property was acquired</div>
                <div class="line-text">${section.howPropertyWasAcquired}</div>
            </div>
            <div class="form-line">
                <div class="line-number">3</div>
                <div class="line-description">Date of acquisition</div>
                <div class="line-text">${section.dateOfAcquisition}</div>
            </div>
            <div class="form-line">
                <div class="line-number">4</div>
                <div class="line-description">Cost or adjusted basis</div>
                <div class="line-amount">$${(section.costOrAdjustedBasis / 100).toFixed(2)}</div>
            </div>
        </div>

        <div class="form-section">
            <div class="section-title">Part II - Donee Information</div>
            <div class="form-line">
                <div class="line-number">5a</div>
                <div class="line-description">Name of donee organization</div>
                <div class="line-text">${section.doneeName}</div>
            </div>
            <div class="form-line">
                <div class="line-number">5b</div>
                <div class="line-description">Address</div>
                <div class="line-text">${section.doneeAddress}</div>
            </div>
            <div class="form-line">
                <div class="line-number">5c</div>
                <div class="line-description">City, state, ZIP</div>
                <div class="line-text">${section.doneeCity}, ${section.doneeState} ${section.doneeZip}</div>
            </div>
            <div class="form-line">
                <div class="line-number">5d</div>
                <div class="line-description">EIN</div>
                <div class="line-text">${section.doneeEIN}</div>
            </div>
        </div>

        ${section.requiresAppraisal ? `
        <div class="form-section">
            <div class="section-title">Part III - Appraisal Information</div>
            <div class="form-line">
                <div class="line-number">6a</div>
                <div class="line-description">Appraised value</div>
                <div class="line-amount">$${((section.appraisedValue || 0) / 100).toFixed(2)}</div>
            </div>
            <div class="form-line">
                <div class="line-number">6b</div>
                <div class="line-description">Date of appraisal</div>
                <div class="line-text">${section.appraisalDate || ''}</div>
            </div>
            <div class="form-line">
                <div class="line-number">7a</div>
                <div class="line-description">Name of appraiser</div>
                <div class="line-text">${section.appraiserName || ''}</div>
            </div>
            <div class="form-line">
                <div class="line-number">7b</div>
                <div class="line-description">Address of appraiser</div>
                <div class="line-text">${section.appraiserAddress || ''}</div>
            </div>
            <div class="form-line">
                <div class="line-number">7c</div>
                <div class="line-description">City, state, ZIP</div>
                <div class="line-text">${section.appraiserCity || ''}, ${section.appraiserState || ''} ${section.appraiserZip || ''}</div>
            </div>
            <div class="form-line">
                <div class="line-number">7d</div>
                <div class="line-description">EIN of appraiser</div>
                <div class="line-text">${section.appraiserEIN || ''}</div>
            </div>
        </div>
        ` : ''}

        <div class="form-section">
            <div class="section-title">Part IV - Donee Acknowledgment</div>
            <div class="form-line">
                <div class="line-number">8</div>
                <div class="line-description">Donee acknowledgment (signature required)</div>
                <div class="line-text">${section.doneeSignature || '[SIGNATURE REQUIRED]'}</div>
            </div>
            <div class="form-line">
                <div class="line-number">9</div>
                <div class="line-description">Title</div>
                <div class="line-text">${section.doneeTitle || ''}</div>
            </div>
            <div class="form-line">
                <div class="line-number">10</div>
                <div class="line-description">Date</div>
                <div class="line-text">${section.doneeDate || ''}</div>
            </div>
        </div>
    </div>
    `).join('')}

    <div style="margin-top: 30px; font-size: 10px; color: #666;">
        <p><strong>Important:</strong> This is a DRAFT form generated by GiftFlow. Please review all information carefully before filing your tax return. Consult with a tax professional if you have questions.</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate Form 8283 Section B PDF content
   */
  public generateForm8283SectionB(): string {
    if (!this.formData.form8283SectionB || this.formData.form8283SectionB.length === 0) {
      return '';
    }

    const sections = this.formData.form8283SectionB;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Form 8283 Section B - DRAFT</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            margin: 0;
            padding: 20px;
            background: white;
        }
        .form-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .draft-stamp {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #ff0000;
            color: white;
            padding: 5px 10px;
            font-weight: bold;
            transform: rotate(15deg);
            border: 2px solid #000;
        }
        .form-section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
        }
        .form-line {
            display: flex;
            margin-bottom: 5px;
            align-items: center;
        }
        .line-number {
            width: 30px;
            font-weight: bold;
        }
        .line-description {
            flex: 1;
            margin-right: 10px;
        }
        .line-amount {
            width: 100px;
            text-align: right;
            border-bottom: 1px solid #000;
            padding-right: 5px;
        }
        .line-text {
            width: 200px;
            border-bottom: 1px solid #000;
            padding-right: 5px;
        }
        .donation-entry {
            border: 1px solid #ccc;
            padding: 10px;
            margin-bottom: 15px;
            background: #f9f9f9;
        }
        .donation-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .required-field {
            color: #ff0000;
            font-weight: bold;
        }
        @media print {
            .draft-stamp {
                position: fixed;
            }
        }
    </style>
</head>
<body>
    <div class="draft-stamp">DRAFT - REVIEW REQUIRED</div>
    
    <div class="form-header">
        <div>Form 8283 - Section B</div>
        <div>Noncash Charitable Contributions (Over $5,000)</div>
        <div>Department of the Treasury - Internal Revenue Service</div>
    </div>

    ${sections.map((section, index) => `
    <div class="donation-entry">
        <div class="donation-title">High-Value Donation ${index + 1}: ${section.propertyDescription}</div>
        
        <div class="form-section">
            <div class="section-title">Part I - Information on Donated Property</div>
            <div class="form-line">
                <div class="line-number">1a</div>
                <div class="line-description">Description of property</div>
                <div class="line-text">${section.propertyDescription}</div>
            </div>
            <div class="form-line">
                <div class="line-number">1b</div>
                <div class="line-description">Date of contribution</div>
                <div class="line-text">${section.dateOfContribution}</div>
            </div>
            <div class="form-line">
                <div class="line-number">1c</div>
                <div class="line-description">Fair market value</div>
                <div class="line-amount">$${(section.fairMarketValue / 100).toFixed(2)}</div>
            </div>
            <div class="form-line">
                <div class="line-number">2</div>
                <div class="line-description">How property was acquired</div>
                <div class="line-text">${section.howPropertyWasAcquired}</div>
            </div>
            <div class="form-line">
                <div class="line-number">3</div>
                <div class="line-description">Date of acquisition</div>
                <div class="line-text">${section.dateOfAcquisition}</div>
            </div>
            <div class="form-line">
                <div class="line-number">4</div>
                <div class="line-description">Cost or adjusted basis</div>
                <div class="line-amount">$${(section.costOrAdjustedBasis / 100).toFixed(2)}</div>
            </div>
        </div>

        <div class="form-section">
            <div class="section-title">Part II - Donee Information</div>
            <div class="form-line">
                <div class="line-number">5a</div>
                <div class="line-description">Name of donee organization</div>
                <div class="line-text">${section.doneeName}</div>
            </div>
            <div class="form-line">
                <div class="line-number">5b</div>
                <div class="line-description">Address</div>
                <div class="line-text">${section.doneeAddress}</div>
            </div>
            <div class="form-line">
                <div class="line-number">5c</div>
                <div class="line-description">City, state, ZIP</div>
                <div class="line-text">${section.doneeCity}, ${section.doneeState} ${section.doneeZip}</div>
            </div>
            <div class="form-line">
                <div class="line-number">5d</div>
                <div class="line-description">EIN</div>
                <div class="line-text">${section.doneeEIN}</div>
            </div>
        </div>

        <div class="form-section">
            <div class="section-title">Part III - Appraisal Information <span class="required-field">(REQUIRED)</span></div>
            <div class="form-line">
                <div class="line-number">6a</div>
                <div class="line-description">Appraised value</div>
                <div class="line-amount">$${(section.appraisedValue / 100).toFixed(2)}</div>
            </div>
            <div class="form-line">
                <div class="line-number">6b</div>
                <div class="line-description">Date of appraisal</div>
                <div class="line-text">${section.appraisalDate}</div>
            </div>
            <div class="form-line">
                <div class="line-number">7a</div>
                <div class="line-description">Name of appraiser</div>
                <div class="line-text">${section.appraiserName}</div>
            </div>
            <div class="form-line">
                <div class="line-number">7b</div>
                <div class="line-description">Address of appraiser</div>
                <div class="line-text">${section.appraiserAddress}</div>
            </div>
            <div class="form-line">
                <div class="line-number">7c</div>
                <div class="line-description">City, state, ZIP</div>
                <div class="line-text">${section.appraiserCity}, ${section.appraiserState} ${section.appraiserZip}</div>
            </div>
            <div class="form-line">
                <div class="line-number">7d</div>
                <div class="line-description">EIN of appraiser</div>
                <div class="line-text">${section.appraiserEIN}</div>
            </div>
        </div>

        <div class="form-section">
            <div class="section-title">Part IV - Donee Acknowledgment <span class="required-field">(REQUIRED)</span></div>
            <div class="form-line">
                <div class="line-number">8</div>
                <div class="line-description">Donee acknowledgment (signature required)</div>
                <div class="line-text">${section.doneeSignature || '[SIGNATURE REQUIRED]'}</div>
            </div>
            <div class="form-line">
                <div class="line-number">9</div>
                <div class="line-description">Title</div>
                <div class="line-text">${section.doneeTitle}</div>
            </div>
            <div class="form-line">
                <div class="line-number">10</div>
                <div class="line-description">Date</div>
                <div class="line-text">${section.doneeDate}</div>
            </div>
        </div>
    </div>
    `).join('')}

    <div style="margin-top: 30px; font-size: 10px; color: #666;">
        <p><strong>Important:</strong> This is a DRAFT form generated by GiftFlow. Please review all information carefully before filing your tax return. Consult with a tax professional if you have questions.</p>
        <p><strong>Note:</strong> Section B requires a qualified appraisal and donee acknowledgment. Ensure all required signatures are obtained before filing.</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate all tax forms as HTML
   */
  public generateAllForms(): { scheduleA: string; form8283SectionA: string; form8283SectionB: string } {
    return {
      scheduleA: this.generateScheduleA(),
      form8283SectionA: this.generateForm8283SectionA(),
      form8283SectionB: this.generateForm8283SectionB()
    };
  }
}
