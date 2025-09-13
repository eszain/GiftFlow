// Tax verification rules engine
// Determines if a wish is tax-deductible based on category and vendor validation

export interface VerificationResult {
  result: 'eligible' | 'reject' | 'review';
  reasons: string[];
  policyRefs: string[];
  confidence: number; // 0-1
}

export interface VerificationContext {
  category: string;
  vendorInfo?: {
    name: string;
    type: string;
    npi?: string; // National Provider Identifier for medical
    ein?: string; // Employer Identification Number
    is501c3?: boolean;
  };
  amount?: number;
  description: string;
  documents: Array<{
    type: string;
    content: string;
  }>;
}

// Pre-verified categories that are automatically eligible
export const PREVERIFIED_CATEGORIES = {
  'medical-expenses': {
    eligible: true,
    requirements: ['Valid medical provider', 'Qualifying medical expense'],
    policyRef: 'IRC Section 213 - Medical and Dental Expenses',
  },
  'educational-materials': {
    eligible: true,
    requirements: ['Accredited educational institution', 'Qualifying educational expense'],
    policyRef: 'IRC Section 117 - Qualified Scholarships',
  },
  'housing-assistance': {
    eligible: true,
    requirements: ['501(c)(3) housing partner', 'Qualifying housing assistance'],
    policyRef: 'IRC Section 170 - Charitable Contributions',
  },
  'food-assistance': {
    eligible: true,
    requirements: ['Qualified food assistance program', '501(c)(3) organization'],
    policyRef: 'IRC Section 170 - Charitable Contributions',
  },
} as const;

// Denied categories that are never tax-deductible
export const DENIED_CATEGORIES = [
  'entertainment',
  'alcohol',
  'tobacco',
  'adult-goods',
  'luxury-items',
  'personal-expenses',
  'political-contributions',
] as const;

// Vendor validation rules
export const VENDOR_VALIDATION_RULES = {
  medical: {
    requiredFields: ['npi'],
    validation: (vendor: any) => {
      if (!vendor.npi || !/^\d{10}$/.test(vendor.npi)) {
        return { valid: false, reason: 'Invalid or missing NPI for medical provider' };
      }
      return { valid: true };
    },
  },
  educational: {
    requiredFields: ['ein'],
    validation: (vendor: any) => {
      if (!vendor.ein || !/^\d{2}-?\d{7}$/.test(vendor.ein)) {
        return { valid: false, reason: 'Invalid or missing EIN for educational institution' };
      }
      return { valid: true };
    },
  },
  '501c3': {
    requiredFields: ['ein', 'is501c3'],
    validation: (vendor: any) => {
      if (!vendor.is501c3) {
        return { valid: false, reason: 'Organization must be 501(c)(3) tax-exempt' };
      }
      if (!vendor.ein || !/^\d{2}-?\d{7}$/.test(vendor.ein)) {
        return { valid: false, reason: 'Invalid or missing EIN for 501(c)(3) organization' };
      }
      return { valid: true };
    },
  },
} as const;

// Main verification function
export function verifyWishEligibility(context: VerificationContext): VerificationResult {
  const reasons: string[] = [];
  const policyRefs: string[] = [];
  let confidence = 0;

  // Check for denied categories
  const deniedCategory = DENIED_CATEGORIES.find(cat => 
    context.description.toLowerCase().includes(cat) ||
    context.category.toLowerCase().includes(cat)
  );

  if (deniedCategory) {
    return {
      result: 'reject',
      reasons: [`Category "${deniedCategory}" is not tax-deductible`],
      policyRefs: ['IRC Section 162 - Trade or Business Expenses (exclusions)'],
      confidence: 1,
    };
  }

  // Check pre-verified categories
  const preVerifiedCategory = Object.keys(PREVERIFIED_CATEGORIES).find(cat =>
    context.category.toLowerCase().includes(cat)
  );

  if (preVerifiedCategory) {
    const categoryInfo = PREVERIFIED_CATEGORIES[preVerifiedCategory as keyof typeof PREVERIFIED_CATEGORIES];
    confidence += 0.7;
    policyRefs.push(categoryInfo.policyRef);

    // Validate vendor if provided
    if (context.vendorInfo) {
      const vendorType = getVendorType(context.vendorInfo);
      const validationRule = VENDOR_VALIDATION_RULES[vendorType as keyof typeof VENDOR_VALIDATION_RULES];
      
      if (validationRule) {
        const validation = validationRule.validation(context.vendorInfo);
        if (!validation.valid) {
          reasons.push(validation.reason);
          confidence -= 0.3;
        } else {
          confidence += 0.2;
        }
      }
    }

    if (confidence >= 0.8) {
      return {
        result: 'eligible',
        reasons: [`Pre-verified category: ${preVerifiedCategory}`],
        policyRefs,
        confidence,
      };
    }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /beer|alcohol|wine|spirits/i,
    /xbox|playstation|gaming|entertainment/i,
    /luxury|designer|expensive/i,
    /personal|private|individual/i,
  ];

  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(context.description)
  );

  if (hasSuspiciousPattern) {
    return {
      result: 'reject',
      reasons: ['Contains non-deductible items or personal expenses'],
      policyRefs: ['IRC Section 162 - Trade or Business Expenses (exclusions)'],
      confidence: 0.9,
    };
  }

  // If we reach here, it needs manual review
  return {
    result: 'review',
    reasons: ['Requires manual review for tax deductibility'],
    policyRefs: ['General tax deductibility guidelines'],
    confidence: 0.5,
  };
}

// Helper function to determine vendor type
function getVendorType(vendor: any): string {
  if (vendor.npi) return 'medical';
  if (vendor.is501c3) return '501c3';
  if (vendor.type?.includes('education') || vendor.type?.includes('school')) return 'educational';
  return 'general';
}

// Document analysis for additional context
export function analyzeDocuments(documents: Array<{ type: string; content: string }>): {
  category: string;
  vendorInfo: any;
  confidence: number;
} {
  let category = 'general';
  let vendorInfo: any = {};
  let confidence = 0;

  for (const doc of documents) {
    const content = doc.content.toLowerCase();
    
    // Medical document analysis
    if (doc.type === 'MEDICAL' || content.includes('medical') || content.includes('hospital')) {
      category = 'medical-expenses';
      confidence += 0.3;
      
      // Extract NPI if present
      const npiMatch = content.match(/\b\d{10}\b/);
      if (npiMatch) {
        vendorInfo.npi = npiMatch[0];
        confidence += 0.2;
      }
    }
    
    // Educational document analysis
    if (doc.type === 'ENROLLMENT' || content.includes('education') || content.includes('school')) {
      category = 'educational-materials';
      confidence += 0.3;
      
      // Extract EIN if present
      const einMatch = content.match(/\b\d{2}-?\d{7}\b/);
      if (einMatch) {
        vendorInfo.ein = einMatch[0];
        confidence += 0.2;
      }
    }
    
    // Invoice/estimate analysis
    if (doc.type === 'INVOICE' || doc.type === 'ESTIMATE') {
      confidence += 0.1;
      
      // Look for vendor information
      const vendorMatch = content.match(/(?:vendor|provider|company):\s*([^\n]+)/i);
      if (vendorMatch) {
        vendorInfo.name = vendorMatch[1].trim();
        confidence += 0.1;
      }
    }
  }

  return { category, vendorInfo, confidence };
}
