'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface AnimatedChatIconProps {
  delay?: number;
}

export default function AnimatedChatIcon({ delay = 0 }: AnimatedChatIconProps) {
  const chatRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState('');

  // Fallback quotes in case API fails
  const fallbackQuotes = [
    "No one has ever become poor by giving.",
    "We rise by lifting others.",
    "Kindness is a language which the deaf can hear.",
    "The smallest act of kindness is worth more than grand intentions.",
    "We make a living by what we get, but we make a life by what we give."
  ];

  // Fetch a quote from the API when component mounts
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch('/api/quotes/generate');
        if (response.ok) {
          const data = await response.json();
          setSelectedQuote(data.quote);
        } else {
          throw new Error('Failed to fetch quote');
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        // Use a random fallback quote
        const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
        setSelectedQuote(fallbackQuotes[randomIndex]);
      }
    };

    fetchQuote();
  }, []);

  useEffect(() => {
    if (!chatRef.current || !textRef.current) return;

    // Set initial state
    gsap.set(chatRef.current, { 
      scale: 0, 
      opacity: 0,
      y: 20 
    });
    gsap.set(textRef.current, { 
      opacity: 0,
      y: 10 
    });

    // Create timeline
    const tl = gsap.timeline({ delay });

    // Animate chat bubble appearance
    tl.to(chatRef.current, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "back.out(1.7)"
    })
    // Animate text appearance
    .to(textRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.2")
    // Add a gentle bounce
    .to(chatRef.current, {
      y: -5,
      duration: 0.3,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1
    }, "-=0.1");

    // Show quote after 3 seconds
    setTimeout(() => {
      setShowQuote(true);
    }, (delay + 3) * 1000);

    return () => {
      tl.kill();
    };
  }, [delay]);

  // Animate text transition when quote appears
  useEffect(() => {
    if (showQuote && textRef.current) {
      gsap.fromTo(textRef.current, 
        { opacity: 0, y: 10 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          ease: "power2.out" 
        }
      );
    }
  }, [showQuote]);

  return (
    <div className="absolute top-1/6 left-2/3 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div
        ref={chatRef}
        className="relative bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 max-w-xs opacity-0 scale-0"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))'
        }}
      >
        {/* Chat bubble tail */}
        <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
        <div className="absolute -bottom-3 left-5 w-0 h-0 border-l-9 border-r-9 border-t-9 border-l-transparent border-r-transparent border-t-gray-200"></div>
        
        {/* Text content - changes from Hello to quote */}
        <div ref={textRef} className="text-gray-800 font-medium text-sm">
          {showQuote ? (
            <div>
              <div ref={quoteRef} className="italic mb-1">
                "{selectedQuote}"
              </div>
              <div className="text-xs text-gray-500 text-right italic">
                Powered by Gemini
              </div>
            </div>
          ) : (
            "Hello!"
          )}
        </div>
        
        {/* Animated dots - only show when quote is not visible */}
        {!showQuote && (
          <div className="flex space-x-1 mt-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
