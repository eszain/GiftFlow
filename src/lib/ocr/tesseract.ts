import { createWorker } from 'tesseract.js';

// OCR service using Tesseract.js for document text extraction
export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
    return this.worker;
  }

  async extractText(imageUrl: string): Promise<string> {
    const worker = await this.initialize();
    
    try {
      const { data: { text } } = await worker.recognize(imageUrl);
      return text.trim();
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  async extractTextFromBuffer(buffer: Buffer): Promise<string> {
    const worker = await this.initialize();
    
    try {
      const { data: { text } } = await worker.recognize(buffer);
      return text.trim();
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const ocrService = new OCRService();

// Document hash generation for duplicate detection
export function generateDocumentHash(content: string): string {
  // Simple hash function for duplicate detection
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Document type detection based on content
export function detectDocumentType(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('medical') || lowerContent.includes('hospital') || lowerContent.includes('doctor')) {
    return 'MEDICAL';
  }
  
  if (lowerContent.includes('enrollment') || lowerContent.includes('student') || lowerContent.includes('education')) {
    return 'ENROLLMENT';
  }
  
  if (lowerContent.includes('invoice') || lowerContent.includes('bill')) {
    return 'INVOICE';
  }
  
  if (lowerContent.includes('estimate') || lowerContent.includes('quote')) {
    return 'ESTIMATE';
  }
  
  return 'OTHER';
}
