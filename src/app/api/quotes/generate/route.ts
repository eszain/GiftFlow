import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/services/gemini';

export async function GET(request: NextRequest) {
  try {
    // Generate an inspirational quote about giving, charity, or kindness
    const prompt = `Generate a short, inspirational quote about giving, charity, kindness, or helping others. The quote should be exactly 10-12 words maximum. Make it uplifting and meaningful. Return only the quote text, no quotation marks, no author attribution, just the quote itself.`;

    const result = await generateContent(prompt);
    
    if (!result.success || !result.content) {
      // Fallback to a default quote if API fails
      const fallbackQuotes = [
        "No one has ever become poor by giving.",
        "We rise by lifting others.",
        "Kindness is a language which the deaf can hear.",
        "The smallest act of kindness is worth more than grand intentions.",
        "We make a living by what we get, but we make a life by what we give."
      ];
      
      const randomFallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      
      return NextResponse.json({ 
        quote: randomFallback,
        source: 'fallback'
      });
    }

    // Clean up the response - remove quotes and extra whitespace
    let quote = result.content.trim();
    quote = quote.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    quote = quote.trim();

    // Ensure it's within word limit
    const words = quote.split(' ');
    if (words.length > 12) {
      quote = words.slice(0, 12).join(' ');
    }

    return NextResponse.json({ 
      quote,
      source: 'gemini'
    });

  } catch (error) {
    console.error('Error generating quote:', error);
    
    // Return a fallback quote
    const fallbackQuotes = [
      "No one has ever become poor by giving.",
      "We rise by lifting others.",
      "Kindness is a language which the deaf can hear.",
      "The smallest act of kindness is worth more than grand intentions.",
      "We make a living by what we get, but we make a life by what we give."
    ];
    
    const randomFallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    
    return NextResponse.json({ 
      quote: randomFallback,
      source: 'fallback'
    });
  }
}
