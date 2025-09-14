'use client';

import React from 'react';
import { DonationSummary, DonationTotals } from '@/app/api/donations/summary/route';

interface DonationSummaryTemplateProps {
  donations: DonationSummary[];
  totals: DonationTotals;
  year: number;
  donorName?: string;
  donorEmail?: string;
}

export default function DonationSummaryTemplate({
  donations,
  totals,
  year,
  donorName = 'Donor',
  donorEmail = ''
}: DonationSummaryTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="donation-summary-template">
      <style jsx>{`
        .donation-summary-template {
          font-family: 'Times New Roman', serif;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
          background: white;
          color: black;
          line-height: 1.4;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2rem;
          border-bottom: 2px solid #333;
          padding-bottom: 1rem;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .subtitle {
          font-size: 16px;
          color: #666;
        }
        
        .donor-info {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
        }
        
        .totals-section {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #e9ecef;
          border: 1px solid #ced4da;
        }
        
        .totals-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .total-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #ced4da;
        }
        
        .total-item:last-child {
          border-bottom: 2px solid #333;
          font-weight: bold;
          font-size: 18px;
        }
        
        .donations-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2rem;
        }
        
        .donations-table th,
        .donations-table td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        
        .donations-table th {
          background: #f8f9fa;
          font-weight: bold;
          text-align: center;
        }
        
        .donations-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .amount {
          text-align: right;
          font-weight: bold;
        }
        
        .deductible {
          text-align: center;
        }
        
        .deductible.yes {
          color: #28a745;
          font-weight: bold;
        }
        
        .deductible.no {
          color: #dc3545;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #333;
          font-size: 12px;
          color: #666;
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
          z-index: 1000;
        }
        
        .print-button:hover {
          background: #0056b3;
        }
        
        @media print {
          .print-button {
            display: none;
          }
          
          .donation-summary-template {
            margin: 0;
            padding: 0;
            max-width: none;
          }
          
          .donations-table {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <button 
        className="print-button" 
        onClick={() => window.print()}
      >
        🖨️ Print / Save as PDF
      </button>

      <div className="header">
        <h1 className="title">Donation Summary for Tax Filing</h1>
        <p className="subtitle">Tax Year {year}</p>
      </div>

      <div className="donor-info">
        <h3>Donor Information</h3>
        <p><strong>Name:</strong> {donorName}</p>
        {donorEmail && <p><strong>Email:</strong> {donorEmail}</p>}
        <p><strong>Tax Year:</strong> {year}</p>
        <p><strong>Generated:</strong> {new Date().toLocaleDateString('en-US')}</p>
      </div>

      <div className="totals-section">
        <h3>Donation Totals</h3>
        <div className="totals-grid">
          <div className="total-item">
            <span>Total Donations:</span>
            <span>{formatCurrency(totals.totalDonated)}</span>
          </div>
          <div className="total-item">
            <span>Tax-Deductible Amount:</span>
            <span className="deductible yes">{formatCurrency(totals.totalDeductible)}</span>
          </div>
          <div className="total-item">
            <span>Non-Deductible Amount:</span>
            <span className="deductible no">{formatCurrency(totals.totalNonDeductible)}</span>
          </div>
          <div className="total-item">
            <span>Number of Donations:</span>
            <span>{totals.donationCount}</span>
          </div>
        </div>
      </div>

      {donations.length > 0 ? (
        <div>
          <h3>Individual Donations</h3>
          <table className="donations-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Organization</th>
                <th>EIN</th>
                <th>Amount</th>
                <th>Deductible</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id}>
                  <td>{formatDate(donation.date)}</td>
                  <td>{donation.organizationName}</td>
                  <td>{donation.ein || 'N/A'}</td>
                  <td className="amount">{formatCurrency(donation.amountUSD)}</td>
                  <td className="deductible">
                    <span className={donation.deductible ? 'yes' : 'no'}>
                      {donation.deductible ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <a 
                      href={donation.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#007bff', textDecoration: 'underline' }}
                    >
                      View Receipt
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <h3>No Donations Found</h3>
          <p>No donations were found for the year {year}.</p>
        </div>
      )}

      <div className="footer">
        <p>
          <strong>Important Tax Information:</strong>
        </p>
        <ul>
          <li>This summary is for your records and tax preparation purposes.</li>
          <li>Only donations marked as "Tax-Deductible" may be claimed as charitable deductions.</li>
          <li>Keep copies of all receipts and acknowledgment letters from organizations.</li>
          <li>Consult with a tax professional for specific advice regarding your tax situation.</li>
          <li>For donations over $250, you must have a written acknowledgment from the charity.</li>
        </ul>
        <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
          Generated by GiftFlow on {new Date().toLocaleString('en-US')}
        </p>
      </div>
    </div>
  );
}
