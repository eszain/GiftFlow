'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Calculator, Download, AlertTriangle, CheckCircle, Plus, Trash2, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { CashDonation, NonCashDonation, TaxFormData } from '@/lib/tax-forms/types';

export default function TaxFormsPage() {
  const [donations, setDonations] = useState<(CashDonation | NonCashDonation)[]>([]);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxFormData, setTaxFormData] = useState<TaxFormData | null>(null);
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [editingDonation, setEditingDonation] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CashDonation | NonCashDonation>>({});

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Sample data for demonstration
  useEffect(() => {
    setDonations([
      {
        id: '1',
        date: '2024-03-15',
        charityName: 'American Red Cross',
        charityEIN: '13-5562300',
        amount: 5000, // $50.00
        isIRSQualified: true,
        hasAcknowledgment: true,
        acknowledgmentDate: '2024-03-20',
        description: 'Emergency relief fund'
      },
      {
        id: '2',
        date: '2024-06-20',
        charityName: 'Local Food Bank',
        charityEIN: '12-3456789',
        description: 'Used clothing and household items',
        fairMarketValue: 15000, // $150.00
        isIRSQualified: true,
        hasAppraisal: false,
        acquisitionDate: '2020-01-01',
        acquisitionCost: 20000, // $200.00
        methodOfAcquisition: 'purchase'
      },
      {
        id: '3',
        date: '2024-11-25',
        charityName: 'Personal GoFundMe',
        charityEIN: '',
        amount: 2500, // $25.00
        isIRSQualified: false,
        hasAcknowledgment: false,
        description: 'Support for local family'
      }
    ]);
  }, []);

  const generateTaxForms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tax-forms/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donations,
          taxYear,
          personalInfo
        }),
      });

      const result = await response.json();

      if (!result.success) {
        const errorMessage = result.errors?.join('\n') || result.message || 'Failed to generate tax forms';
        throw new Error(errorMessage);
      }

      setTaxFormData(result.data);
    } catch (err) {
      console.error('Error generating tax forms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadScheduleA = () => {
    if (!taxFormData) return;
    
    // Create a proper Schedule A form that looks like the real IRS form
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Schedule A (Form 1040) - ${taxFormData.personalInfo.name}</title>
        <style>
          @page { 
            size: 8.5in 11in; 
            margin: 0.5in; 
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt; 
            line-height: 1.2; 
            margin: 0; 
            padding: 0;
            color: #000;
          }
          .form-container {
            width: 100%;
            max-width: 8in;
            margin: 0 auto;
            background: white;
          }
          .form-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .form-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .form-subtitle {
            font-size: 10pt;
            margin-bottom: 5px;
          }
          .form-year {
            font-size: 12pt;
            font-weight: bold;
          }
          .form-section {
            margin: 15px 0;
            border: 1px solid #000;
            padding: 10px;
          }
          .section-title {
            font-weight: bold;
            font-size: 11pt;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          .form-line {
            display: flex;
            margin: 3px 0;
            align-items: center;
          }
          .line-number {
            width: 30px;
            font-weight: bold;
            text-align: right;
            margin-right: 10px;
          }
          .line-description {
            flex: 1;
            margin-right: 10px;
          }
          .line-amount {
            width: 120px;
            text-align: right;
            border-bottom: 1px solid #000;
            padding: 2px 5px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
          }
          .line-total {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
          }
          .taxpayer-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 9pt;
          }
          .info-block {
            flex: 1;
            margin-right: 20px;
          }
          .info-label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .info-value {
            border-bottom: 1px solid #000;
            padding: 2px 5px;
            min-height: 20px;
          }
          .draft-stamp {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48pt;
            font-weight: bold;
            color: rgba(255, 0, 0, 0.3);
            z-index: 1000;
            pointer-events: none;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1001;
          }
          @media print {
            .print-button { display: none; }
            .draft-stamp { display: block; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
        <div class="draft-stamp">DRAFT</div>
        
        <div class="form-container">
          <div class="form-header">
            <div class="form-title">Schedule A (Form 1040)</div>
            <div class="form-subtitle">Department of the Treasury - Internal Revenue Service</div>
            <div class="form-subtitle">Itemized Deductions</div>
            <div class="form-year">${taxFormData.taxYear}</div>
          </div>
          
          <div class="taxpayer-info">
            <div class="info-block">
              <div class="info-label">Name(s) shown on return</div>
              <div class="info-value">${taxFormData.personalInfo.name}</div>
            </div>
            <div class="info-block">
              <div class="info-label">Your social security number</div>
              <div class="info-value">${taxFormData.personalInfo.ssn}</div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Medical and Dental Expenses</div>
            <div class="form-line">
              <div class="line-number">1</div>
              <div class="line-description">Medical and dental expenses (see instructions)</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">2</div>
              <div class="line-description">Enter amount from Form 1040, line 11</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">3</div>
              <div class="line-description">Multiply line 2 by 7.5% (0.075)</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">4</div>
              <div class="line-description">Subtract line 3 from line 1. If line 3 is more than line 1, enter -0-</div>
              <div class="line-amount">0.00</div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Taxes You Paid</div>
            <div class="form-line">
              <div class="line-number">5a</div>
              <div class="line-description">State and local income taxes</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">5b</div>
              <div class="line-description">State and local general sales taxes</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">5c</div>
              <div class="line-description">Add lines 5a and 5b</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">6</div>
              <div class="line-description">Real estate taxes</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">7</div>
              <div class="line-description">Personal property taxes</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">8</div>
              <div class="line-description">Other taxes. List type and amount</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line line-total">
              <div class="line-number">9</div>
              <div class="line-description">Add lines 5c, 6, 7, and 8</div>
              <div class="line-amount">0.00</div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Interest You Paid</div>
            <div class="form-line">
              <div class="line-number">10</div>
              <div class="line-description">Home mortgage interest and points reported on Form 1098</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">11</div>
              <div class="line-description">Home mortgage interest not reported on Form 1098</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">12</div>
              <div class="line-description">Points not reported on Form 1098</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">13</div>
              <div class="line-description">Mortgage insurance premiums</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">14</div>
              <div class="line-description">Investment interest. Attach Form 4952 if required</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line line-total">
              <div class="line-number">15</div>
              <div class="line-description">Add lines 10 through 14</div>
              <div class="line-amount">0.00</div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Gifts to Charity</div>
            <div class="form-line">
              <div class="line-number">16</div>
              <div class="line-description">Gifts by cash or check. If you made any gift of $250 or more, see instructions</div>
              <div class="line-amount">$${(taxFormData.summary.cashContributions / 100).toFixed(2)}</div>
            </div>
            <div class="form-line">
              <div class="line-number">17</div>
              <div class="line-description">Other than by cash or check. If any single gift was $250 or more, you must attach Form 8283</div>
              <div class="line-amount">$${(taxFormData.summary.nonCashContributions / 100).toFixed(2)}</div>
            </div>
            <div class="form-line">
              <div class="line-number">18</div>
              <div class="line-description">Carryover from prior year, if any</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line line-total">
              <div class="line-number">19</div>
              <div class="line-description">Add lines 16, 17, and 18</div>
              <div class="line-amount">$${(taxFormData.summary.totalCharitableContributions / 100).toFixed(2)}</div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Casualty and Theft Losses</div>
            <div class="form-line">
              <div class="line-number">20</div>
              <div class="line-description">Casualty or theft loss(es). Attach Form 4684</div>
              <div class="line-amount">0.00</div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Other Itemized Deductions</div>
            <div class="form-line">
              <div class="line-number">21</div>
              <div class="line-description">Other expenses from Schedule A, line 16</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line">
              <div class="line-number">22</div>
              <div class="line-description">Other expenses from Schedule A, line 17</div>
              <div class="line-amount">0.00</div>
            </div>
            <div class="form-line line-total">
              <div class="line-number">23</div>
              <div class="line-description">Add lines 21 and 22</div>
              <div class="line-amount">0.00</div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Total Itemized Deductions</div>
            <div class="form-line line-total">
              <div class="line-number">24</div>
              <div class="line-description">Add lines 4, 9, 15, 19, 20, and 23</div>
              <div class="line-amount">$${(taxFormData.summary.totalCharitableContributions / 100).toFixed(2)}</div>
            </div>
          </div>
          
          <div style="margin-top: 30px; font-size: 8pt; color: #666;">
            <p><strong>Note:</strong> This is a draft form generated by GiftFlow. Please review all information and consult with a tax professional before filing with the IRS.</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Schedule-A-${taxFormData.personalInfo.name.replace(/\s+/g, '-')}-${taxFormData.taxYear}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadForm8283SectionA = () => {
    if (!taxFormData || !taxFormData.form8283SectionA) return;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Form 8283 - ${taxFormData.personalInfo.name}</title>
        <style>
          @page { 
            size: 8.5in 11in; 
            margin: 0.5in; 
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt; 
            line-height: 1.2; 
            margin: 0; 
            padding: 0;
            color: #000;
          }
          .form-container {
            width: 100%;
            max-width: 8in;
            margin: 0 auto;
            background: white;
          }
          .form-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .form-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .form-subtitle {
            font-size: 10pt;
            margin-bottom: 5px;
          }
          .form-year {
            font-size: 12pt;
            font-weight: bold;
          }
          .taxpayer-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 9pt;
          }
          .info-block {
            flex: 1;
            margin-right: 20px;
          }
          .info-label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .info-value {
            border-bottom: 1px solid #000;
            padding: 2px 5px;
            min-height: 20px;
          }
          .form-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 9pt;
          }
          .form-table th,
          .form-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            vertical-align: top;
          }
          .form-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .form-table .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          .draft-stamp {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48pt;
            font-weight: bold;
            color: rgba(255, 0, 0, 0.3);
            z-index: 1000;
            pointer-events: none;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1001;
          }
          @media print {
            .print-button { display: none; }
            .draft-stamp { display: block; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
        <div class="draft-stamp">DRAFT</div>
        
        <div class="form-container">
          <div class="form-header">
            <div class="form-title">Form 8283</div>
            <div class="form-subtitle">Department of the Treasury - Internal Revenue Service</div>
            <div class="form-subtitle">Noncash Charitable Contributions</div>
            <div class="form-year">${taxFormData.taxYear}</div>
          </div>
          
          <div class="taxpayer-info">
            <div class="info-block">
              <div class="info-label">Name(s) shown on return</div>
              <div class="info-value">${taxFormData.personalInfo.name}</div>
            </div>
            <div class="info-block">
              <div class="info-label">Your social security number</div>
              <div class="info-value">${taxFormData.personalInfo.ssn}</div>
            </div>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="font-size: 11pt; margin-bottom: 10px;">Section A - Noncash Charitable Contributions (Over $500)</h3>
            <p style="font-size: 9pt; margin-bottom: 15px;">Complete this section for each item (or group of similar items) for which you claimed a deduction of more than $500 but not more than $5,000.</p>
            
            <table class="form-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Property Description</th>
                  <th style="width: 12%;">Date of Contribution</th>
                  <th style="width: 15%;">Fair Market Value</th>
                  <th style="width: 20%;">Donee Name</th>
                  <th style="width: 15%;">Donee EIN</th>
                  <th style="width: 13%;">How Property Was Acquired</th>
                </tr>
              </thead>
              <tbody>
                ${taxFormData.form8283SectionA.map((item, index) => `
                  <tr>
                    <td>${item.propertyDescription}</td>
                    <td>${item.dateOfContribution}</td>
                    <td class="amount">$${(item.fairMarketValue / 100).toFixed(2)}</td>
                    <td>${item.doneeName}</td>
                    <td>${item.doneeEIN}</td>
                    <td>${item.howPropertyWasAcquired}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 30px; font-size: 8pt; color: #666;">
            <p><strong>Note:</strong> This is a draft form generated by GiftFlow. Please review all information and consult with a tax professional before filing with the IRS.</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Form-8283-Section-A-${taxFormData.personalInfo.name.replace(/\s+/g, '-')}-${taxFormData.taxYear}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadForm8283SectionB = () => {
    if (!taxFormData || !taxFormData.form8283SectionB) return;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Form 8283 - ${taxFormData.personalInfo.name}</title>
        <style>
          @page { 
            size: 8.5in 11in; 
            margin: 0.5in; 
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt; 
            line-height: 1.2; 
            margin: 0; 
            padding: 0;
            color: #000;
          }
          .form-container {
            width: 100%;
            max-width: 8in;
            margin: 0 auto;
            background: white;
          }
          .form-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .form-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .form-subtitle {
            font-size: 10pt;
            margin-bottom: 5px;
          }
          .form-year {
            font-size: 12pt;
            font-weight: bold;
          }
          .taxpayer-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 9pt;
          }
          .info-block {
            flex: 1;
            margin-right: 20px;
          }
          .info-label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .info-value {
            border-bottom: 1px solid #000;
            padding: 2px 5px;
            min-height: 20px;
          }
          .form-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 9pt;
          }
          .form-table th,
          .form-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            vertical-align: top;
          }
          .form-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .form-table .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          .draft-stamp {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48pt;
            font-weight: bold;
            color: rgba(255, 0, 0, 0.3);
            z-index: 1000;
            pointer-events: none;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1001;
          }
          @media print {
            .print-button { display: none; }
            .draft-stamp { display: block; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
        <div class="draft-stamp">DRAFT</div>
        
        <div class="form-container">
          <div class="form-header">
            <div class="form-title">Form 8283</div>
            <div class="form-subtitle">Department of the Treasury - Internal Revenue Service</div>
            <div class="form-subtitle">Noncash Charitable Contributions</div>
            <div class="form-year">${taxFormData.taxYear}</div>
          </div>
          
          <div class="taxpayer-info">
            <div class="info-block">
              <div class="info-label">Name(s) shown on return</div>
              <div class="info-value">${taxFormData.personalInfo.name}</div>
            </div>
            <div class="info-block">
              <div class="info-label">Your social security number</div>
              <div class="info-value">${taxFormData.personalInfo.ssn}</div>
            </div>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="font-size: 11pt; margin-bottom: 10px;">Section B - Noncash Charitable Contributions (Over $5,000)</h3>
            <p style="font-size: 9pt; margin-bottom: 15px;">Complete this section for each item (or group of similar items) for which you claimed a deduction of more than $5,000. You must attach a qualified appraisal.</p>
            
            <table class="form-table">
              <thead>
                <tr>
                  <th style="width: 20%;">Property Description</th>
                  <th style="width: 10%;">Date of Contribution</th>
                  <th style="width: 12%;">Fair Market Value</th>
                  <th style="width: 12%;">Appraised Value</th>
                  <th style="width: 15%;">Donee Name</th>
                  <th style="width: 12%;">Donee EIN</th>
                  <th style="width: 19%;">Appraiser Information</th>
                </tr>
              </thead>
              <tbody>
                ${taxFormData.form8283SectionB.map((item, index) => `
                  <tr>
                    <td>${item.propertyDescription}</td>
                    <td>${item.dateOfContribution}</td>
                    <td class="amount">$${(item.fairMarketValue / 100).toFixed(2)}</td>
                    <td class="amount">$${(item.appraisedValue / 100).toFixed(2)}</td>
                    <td>${item.doneeName}</td>
                    <td>${item.doneeEIN}</td>
                    <td>${item.appraiserName || 'See attached appraisal'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 30px; font-size: 8pt; color: #666;">
            <p><strong>Note:</strong> This is a draft form generated by GiftFlow. Please review all information and consult with a tax professional before filing with the IRS.</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Form-8283-Section-B-${taxFormData.personalInfo.name.replace(/\s+/g, '-')}-${taxFormData.taxYear}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addDonation = (donation: CashDonation | NonCashDonation) => {
    setDonations(prev => [...prev, donation]);
    setShowAddDonation(false);
  };

  const updateDonation = (id: string, updatedDonation: CashDonation | NonCashDonation) => {
    setDonations(prev => prev.map(d => d.id === id ? updatedDonation : d));
    setEditingDonation(null);
    setShowEditModal(false);
    setEditFormData({});
  };

  const handleEditClick = (donation: CashDonation | NonCashDonation) => {
    setEditingDonation(donation.id);
    setEditFormData(donation);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDonation && editFormData) {
      const updatedDonation = { ...editFormData, id: editingDonation } as CashDonation | NonCashDonation;
      updateDonation(editingDonation, updatedDonation);
    }
  };

  const deleteDonation = (id: string) => {
    setDonations(prev => prev.filter(d => d.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isCashDonation = (donation: CashDonation | NonCashDonation): donation is CashDonation => {
    return 'amount' in donation;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tax Form Preparation</h1>
              <p className="mt-2 text-gray-600">Prepare draft tax forms for your charitable donations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tax Year Selector */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tax Year</h2>
              <p className="text-sm text-gray-600">Select the tax year for your forms</p>
            </div>
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value))}
              className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SSN</label>
              <input
                type="text"
                value={personalInfo.ssn}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, ssn: e.target.value }))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="XXX-XX-XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={personalInfo.address}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={personalInfo.city}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, city: e.target.value }))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={personalInfo.state}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, state: e.target.value }))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                value={personalInfo.zip}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, zip: e.target.value }))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="ZIP code"
              />
            </div>
          </div>
        </div>

        {/* Donations List */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Donations</h2>
            <button
              onClick={() => setShowAddDonation(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Donation
            </button>
          </div>

          {donations.length > 0 ? (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{donation.charityName}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          donation.isIRSQualified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {donation.isIRSQualified ? 'Qualified' : 'Non-Qualified'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isCashDonation(donation) ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {isCashDonation(donation) ? 'Cash' : 'Non-Cash'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Date:</strong> {formatDate(donation.date)}</p>
                        <p><strong>Amount:</strong> {formatCurrency(isCashDonation(donation) ? donation.amount : donation.fairMarketValue)}</p>
                        {donation.charityEIN && <p><strong>EIN:</strong> {donation.charityEIN}</p>}
                        {donation.description && <p><strong>Description:</strong> {donation.description}</p>}
                        {isCashDonation(donation) && (
                          <p><strong>Acknowledgment:</strong> {donation.hasAcknowledgment ? '✓ Received' : '✗ Missing'}</p>
                        )}
                        {!isCashDonation(donation) && (
                          <p><strong>Appraisal:</strong> {donation.hasAppraisal ? '✓ Received' : '✗ Missing'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(donation)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteDonation(donation.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No donations added</h3>
              <p className="mt-1 text-sm text-gray-500">Add your charitable donations to generate tax forms.</p>
            </div>
          )}
        </div>

        {/* Generate Forms Button */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generate Tax Forms</h3>
              <p className="text-sm text-gray-600">
                Generate draft Schedule A and Form 8283 based on your donations
              </p>
            </div>
            <button
              onClick={generateTaxForms}
              disabled={loading || donations.length === 0 || !personalInfo.name || !personalInfo.ssn}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Generate Forms
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tax Form Results */}
        {taxFormData && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Form Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(taxFormData.summary.cashContributions)}
                  </div>
                  <div className="text-sm text-gray-600">Cash Contributions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(taxFormData.summary.nonCashContributions)}
                  </div>
                  <div className="text-sm text-gray-600">Non-Cash Contributions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(taxFormData.summary.totalCharitableContributions)}
                  </div>
                  <div className="text-sm text-gray-600">Total Deductible</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {taxFormData.summary.donationCount}
                  </div>
                  <div className="text-sm text-gray-600">Total Donations</div>
                </div>
              </div>
            </div>

            {/* Form Requirements */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Requirements</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Schedule A (Form 1040) - Required for itemized deductions</span>
                </div>
                {taxFormData.summary.requiresForm8283SectionA && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span>Form 8283 Section A - Required for non-cash donations over $500</span>
                  </div>
                )}
                {taxFormData.summary.requiresForm8283SectionB && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                    <span>Form 8283 Section B - Required for non-cash donations over $5,000</span>
                  </div>
                )}
              </div>
            </div>

            {/* Missing Documentation */}
            {(taxFormData.summary.missingAcknowledgment.length > 0 || 
              taxFormData.summary.missingAppraisal.length > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">Missing Documentation</h3>
                <div className="space-y-2">
                  {taxFormData.summary.missingAcknowledgment.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">{item.issue}</p>
                        <p className="text-xs text-yellow-700">{item.requiredAction}</p>
                      </div>
                    </div>
                  ))}
                  {taxFormData.summary.missingAppraisal.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">{item.issue}</p>
                        <p className="text-xs text-yellow-700">{item.requiredAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Forms */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Draft Forms</h3>
              <div className="flex space-x-4">
                <button 
                  onClick={downloadScheduleA}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Schedule A (HTML)
                </button>
                {taxFormData.summary.requiresForm8283SectionA && (
                  <button 
                    onClick={downloadForm8283SectionA}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Form 8283 Section A (HTML)
                  </button>
                )}
                {taxFormData.summary.requiresForm8283SectionB && (
                  <button 
                    onClick={downloadForm8283SectionB}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Form 8283 Section B (HTML)
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Forms are downloaded as HTML files that can be opened in any browser and printed to PDF.
              </p>
            </div>
          </div>
        )}

        {/* Edit Donation Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleEditSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Edit Donation</h3>
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Charity Name</label>
                          <input
                            type="text"
                            value={editFormData.charityName || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, charityName: e.target.value }))}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            EIN {editFormData.isIRSQualified && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={editFormData.charityEIN || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, charityEIN: e.target.value }))}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="XX-XXXXXXX or XXXXXXXXX"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {editFormData.isIRSQualified 
                              ? 'Required for IRS qualified donations. Format: XX-XXXXXXX or XXXXXXXXX'
                              : 'Optional for non-IRS qualified donations'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={editFormData.date || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={isCashDonation(editFormData) ? (editFormData.amount || 0) / 100 : (editFormData as NonCashDonation).fairMarketValue ? ((editFormData as NonCashDonation).fairMarketValue || 0) / 100 : 0}
                            onChange={(e) => {
                              const amount = Math.round(parseFloat(e.target.value || '0') * 100);
                              if (isCashDonation(editFormData)) {
                                setEditFormData(prev => ({ ...prev, amount }));
                              } else {
                                setEditFormData(prev => ({ ...prev, fairMarketValue: amount }));
                              }
                            }}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={editFormData.description || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.isIRSQualified || false}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, isIRSQualified: e.target.checked }))}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">IRS Qualified</span>
                          </label>
                        </div>
                      </div>

                      {isCashDonation(editFormData) ? (
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.hasAcknowledgment || false}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, hasAcknowledgment: e.target.checked }))}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">Has Acknowledgment</span>
                          </label>
                          {editFormData.hasAcknowledgment && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledgment Date</label>
                              <input
                                type="date"
                                value={editFormData.acknowledgmentDate || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, acknowledgmentDate: e.target.value }))}
                                className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(editFormData as NonCashDonation).hasAppraisal || false}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, hasAppraisal: e.target.checked }))}
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Has Appraisal</span>
                            </label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                              <input
                                type="date"
                                value={(editFormData as NonCashDonation).acquisitionDate || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={((editFormData as NonCashDonation).acquisitionCost || 0) / 100}
                                onChange={(e) => {
                                  const cost = Math.round(parseFloat(e.target.value || '0') * 100);
                                  setEditFormData(prev => ({ ...prev, acquisitionCost: cost }));
                                }}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Method of Acquisition</label>
                              <select
                                value={(editFormData as NonCashDonation).methodOfAcquisition || 'other'}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, methodOfAcquisition: e.target.value as any }))}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              >
                                <option value="purchase">Purchase</option>
                                <option value="gift">Gift</option>
                                <option value="inheritance">Inheritance</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Update Donation
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
