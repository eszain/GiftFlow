
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TaxFormCalculator } from '@/lib/tax-forms/calculator';
import { CashDonation, NonCashDonation, TaxFormData } from '@/lib/tax-forms/types';

export interface TaxFormRequest {
  donations: (CashDonation | NonCashDonation)[];
  taxYear: number;
  personalInfo: {
    name: string;
    ssn: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface TaxFormResponse {
  success: boolean;
  data?: TaxFormData;
  errors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

// POST /api/tax-forms/generate - Generate tax forms for charitable donations
export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: TaxFormRequest = await request.json();
    const { donations, taxYear, personalInfo } = body;

    // Validate required fields
    if (!donations || !Array.isArray(donations) || donations.length === 0) {
      return NextResponse.json({
        success: false,
        errors: ['Donations array is required and cannot be empty']
      }, { status: 400 });
    }

    if (!taxYear || taxYear < 2020 || taxYear > new Date().getFullYear()) {
      return NextResponse.json({
        success: false,
        errors: ['Valid tax year is required']
      }, { status: 400 });
    }

    if (!personalInfo || !personalInfo.name || !personalInfo.ssn) {
      return NextResponse.json({
        success: false,
        errors: ['Personal information (name and SSN) is required']
      }, { status: 400 });
    }

    // Create tax form calculator
    const calculator = new TaxFormCalculator(donations, taxYear);

    // Validate donations
    const validation = calculator.validateDonations();
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        errors: validation.errors,
        message: 'Please fix the validation errors before generating tax forms'
      }, { status: 400 });
    }

    // Generate tax form data
    const taxFormData = calculator.generateTaxFormData(personalInfo);
    
    // Get optimization recommendations
    const recommendations = calculator.getOptimizationRecommendations();

    // Generate warnings for missing documentation
    const warnings: string[] = [];
    const summary = taxFormData.summary;

    if (summary.missingAcknowledgment.length > 0) {
      warnings.push(`${summary.missingAcknowledgment.length} donations missing required acknowledgments`);
    }

    if (summary.missingAppraisal.length > 0) {
      warnings.push(`${summary.missingAppraisal.length} donations missing required appraisals`);
    }

    if (summary.missingForm8283.length > 0) {
      warnings.push(`${summary.missingForm8283.length} donations require Form 8283`);
    }

    return NextResponse.json({
      success: true,
      data: taxFormData,
      warnings: warnings.length > 0 ? warnings : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    });

  } catch (error) {
    console.error('Error generating tax forms:', error);
    return NextResponse.json({
      success: false,
      errors: ['Failed to generate tax forms']
    }, { status: 500 });
  }
}

// GET /api/tax-forms/generate - Get tax form requirements and rules
export async function GET(request: NextRequest) {
  try {
    // Authenticate user with Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return tax form requirements and rules
    return NextResponse.json({
      success: true,
      data: {
        requirements: {
          cashDonations: {
            acknowledgmentThreshold: 250, // $250
            description: 'Cash donations of $250 or more require written acknowledgment from charity'
          },
          nonCashDonations: {
            form8283Threshold: 500, // $500
            appraisalThreshold: 5000, // $5,000
            description: 'Non-cash donations over $500 require Form 8283, over $5,000 require appraisal'
          }
        },
        forms: {
          scheduleA: {
            name: 'Schedule A (Form 1040)',
            description: 'Itemized Deductions - Charitable Contributions',
            lines: {
              line11: 'Cash contributions to qualified organizations',
              line12: 'Non-cash contributions to qualified organizations',
              line13: 'Total charitable contributions'
            }
          },
          form8283: {
            name: 'Form 8283',
            description: 'Noncash Charitable Contributions',
            sections: {
              sectionA: 'For non-cash contributions over $500',
              sectionB: 'For non-cash contributions over $5,000 (requires appraisal)'
            }
          }
        },
        currentYear: new Date().getFullYear(),
        supportedYears: [2020, 2021, 2022, 2023, 2024]
      }
    });

  } catch (error) {
    console.error('Error fetching tax form requirements:', error);
    return NextResponse.json({
      success: false,
      errors: ['Failed to fetch tax form requirements']
    }, { status: 500 });
  }
}
