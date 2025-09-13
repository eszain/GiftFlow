import { verifyWishEligibility, analyzeDocuments, VerificationContext } from './rules';
import { ocrService, generateDocumentHash, detectDocumentType } from '../ocr/tesseract';
import { prisma } from '../prisma';

export interface WishVerificationInput {
  wishId: string;
  type: 'PREVERIFIED' | 'CUSTOM';
  title: string;
  description: string;
  category: string;
  documents?: Array<{
    url: string;
    type: string;
  }>;
  vendorLinks?: string[];
}

export interface VerificationPipelineResult {
  result: 'eligible' | 'reject' | 'review';
  reasons: string[];
  policyRefs: string[];
  confidence: number;
  processedDocuments: Array<{
    url: string;
    type: string;
    ocrText: string;
    hash: string;
  }>;
}

// Main verification pipeline
export async function runVerificationPipeline(input: WishVerificationInput): Promise<VerificationPipelineResult> {
  const processedDocuments: Array<{
    url: string;
    type: string;
    ocrText: string;
    hash: string;
  }> = [];

  // For pre-verified wishes, skip document processing
  if (input.type === 'PREVERIFIED') {
    return {
      result: 'eligible',
      reasons: ['Pre-verified category - automatically eligible'],
      policyRefs: ['Pre-verified tax-deductible categories'],
      confidence: 1.0,
      processedDocuments: [],
    };
  }

  // Process documents for custom wishes
  let documentAnalysis = {
    category: input.category,
    vendorInfo: {},
    confidence: 0,
  };

  if (input.documents && input.documents.length > 0) {
    for (const doc of input.documents) {
      try {
        // Extract text using OCR
        const ocrText = await ocrService.extractText(doc.url);
        
        // Generate hash for duplicate detection
        const hash = generateDocumentHash(ocrText);
        
        // Detect document type
        const detectedType = detectDocumentType(ocrText);
        
        processedDocuments.push({
          url: doc.url,
          type: detectedType,
          ocrText,
          hash,
        });

        // Check for duplicate documents
        const existingDoc = await prisma.wishDocument.findFirst({
          where: { hash },
        });

        if (existingDoc) {
          return {
            result: 'reject',
            reasons: ['Duplicate document detected'],
            policyRefs: ['Anti-fraud policy'],
            confidence: 0.9,
            processedDocuments,
          };
        }

      } catch (error) {
        console.error('Document processing failed:', error);
        // Continue with other documents
      }
    }

    // Analyze all documents together
    documentAnalysis = analyzeDocuments(
      processedDocuments.map(doc => ({
        type: doc.type,
        content: doc.ocrText,
      }))
    );
  }

  // Create verification context
  const context: VerificationContext = {
    category: documentAnalysis.category || input.category,
    vendorInfo: documentAnalysis.vendorInfo,
    description: input.description,
    documents: processedDocuments.map(doc => ({
      type: doc.type,
      content: doc.ocrText,
    })),
  };

  // Run verification rules
  const verificationResult = verifyWishEligibility(context);

  return {
    ...verificationResult,
    processedDocuments,
  };
}

// Save verification results to database
export async function saveVerificationResults(
  wishId: string,
  result: VerificationPipelineResult
): Promise<void> {
  // Update wish with verification decision
  await prisma.wish.update({
    where: { id: wishId },
    data: {
      status: result.result === 'eligible' ? 'ELIGIBLE' : 
              result.result === 'reject' ? 'REJECTED' : 'UNDER_REVIEW',
      verificationDecision: {
        result: result.result,
        reasons: result.reasons,
        policyRefs: result.policyRefs,
        confidence: result.confidence,
      },
    },
  });

  // Save processed documents
  if (result.processedDocuments.length > 0) {
    await prisma.wishDocument.createMany({
      data: result.processedDocuments.map(doc => ({
        wishId,
        url: doc.url,
        docType: doc.type as any,
        ocrText: doc.ocrText,
        hash: doc.hash,
      })),
    });
  }

  // Log audit trail
  await prisma.auditLog.create({
    data: {
      actorUserId: 'system', // System-generated verification
      entityType: 'wish',
      entityId: wishId,
      action: 'verify',
      details: {
        result: result.result,
        confidence: result.confidence,
        documentCount: result.processedDocuments.length,
      },
    },
  });
}

// Batch verification for multiple wishes
export async function batchVerifyWishes(wishIds: string[]): Promise<void> {
  for (const wishId of wishIds) {
    try {
      const wish = await prisma.wish.findUnique({
        where: { id: wishId },
        include: { documents: true },
      });

      if (!wish) continue;

      const input: WishVerificationInput = {
        wishId: wish.id,
        type: wish.type,
        title: wish.title,
        description: wish.description,
        category: wish.tags[0] || 'general',
        documents: wish.documents.map(doc => ({
          url: doc.url,
          type: doc.docType,
        })),
      };

      const result = await runVerificationPipeline(input);
      await saveVerificationResults(wishId, result);

    } catch (error) {
      console.error(`Verification failed for wish ${wishId}:`, error);
    }
  }
}
