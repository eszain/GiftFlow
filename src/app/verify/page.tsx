'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shield, ArrowLeft, ExternalLink, Heart, Search, AlertTriangle, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

function isUrl(value: string) {
  try { new URL(value); return true } catch { return false }
}
const digits = (s: string) => s.replace(/\D/g, '');
const isEin = (s: string) => digits(s).length === 9;

export default function VerifyPage() {
  const [input, setInput] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Animation refs
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const mode: 'url' | 'ein' | 'name' | null = React.useMemo(() => {
    if (!input.trim()) return null;
    if (isUrl(input.trim())) return 'url';
    if (isEin(input.trim())) return 'ein';
    return 'name';
  }, [input]);

  // Animation useEffect
  useEffect(() => {
    const tl = gsap.timeline();

    // Set initial states
    gsap.set([headerRef.current, titleRef.current, formRef.current], { y: 50, opacity: 0 });

    // Animate elements in sequence
    tl.to(headerRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    })
    .to(titleRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.4")
    .to(formRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.4");

    // Animate result when it appears
    if (result && resultRef.current) {
      gsap.fromTo(resultRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)"
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [result]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const value = input.trim();
    if (!value) return;

    try {
      setLoading(true);

      let requestBody;
      if (mode === 'url') {
        requestBody = { type: 'fundraiser', data: { url: value, text: desc || undefined } };
      } else if (mode === 'ein') {
        requestBody = { type: 'charity', data: { ein: digits(value) } };
      } else {
        requestBody = { type: 'charity', data: { query: value } };
      }

      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setResult(await res.json());
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary">
      {/* Header */}
      <header ref={headerRef} className="bg-card/90 backdrop-blur-sm border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className=" rounded-xl flex items-center hover:text-foreground transition-colors duration-200 group">
              <ArrowLeft className=" h-5 w-5 mr-2 group-hover:-translate-x-1 text-primary transition-transform duration-200" />
            </Link>
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary rounded-xl shadow-lg">
                  <Heart className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold text-primary">GiftFlow</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div ref={titleRef} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-6">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Verify Fundraiser Legitimacy
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Ensure your donations go to legitimate causes with our advanced verification system combining 
            <span className="font-semibold text-primary"> AI analysis</span>, 
            <span className="font-semibold text-accent"> platform verification</span>, and 
            <span className="font-semibold text-destructive"> trust scoring</span>
          </p>
        </div>

        <div ref={formRef} className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-xl border border-border p-8">
          <form onSubmit={onSubmit} className="space-y-8">
            <div className="space-y-4">
              <label htmlFor="input" className="block text-lg font-semibold text-foreground mb-3">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-primary" />
                  <span>Fundraiser URL, Charity Name, or EIN</span>
                </div>
              </label>
              <div className="relative">
                <input
                  id="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste fundraiser URL, type charity name, or enter EIN"
                  className="w-full rounded-xl border-2 border-input bg-background px-6 py-4 text-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-ring transition-all duration-200 placeholder-muted-foreground"
                />
                {mode && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="capitalize">{mode}</span>
                    </div>
                  </div>
                )}
              </div>
              {mode && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Detected: <span className="font-semibold text-primary capitalize">{mode}</span></span>
                </div>
              )}
            </div>

            {mode === 'url' && (
              <div className="space-y-3">
                <label htmlFor="desc" className="block text-lg font-semibold text-foreground">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <span>Additional Description (Optional)</span>
                  </div>
                </label>
                <textarea
                  id="desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Paste the fundraiser description here for enhanced AI analysis and risk assessment..."
                  className="w-full rounded-xl border-2 border-input bg-background px-6 py-4 text-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-ring transition-all duration-200 placeholder-muted-foreground resize-none"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Providing additional context helps our AI make more accurate assessments</span>
                </p>
              </div>
            )}

            <button
              type="submit"
              style={{
                background: 'linear-gradient(to right, var(--primary), var(--accent))',
                color: 'var(--primary-foreground)',
                border: 'none',
                cursor: 'pointer'
              }}
                  className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Verify Legitimacy</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-8 rounded-xl border-2 border-red-200 bg-red-50 p-6">
              <div className="flex items-start space-x-3">
                <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Verification Failed</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div ref={resultRef} className="mt-8 space-y-6">
              {result.preview && (result.preview.title || result.preview.description || result.preview.image) && (
                <div className="bg-gradient-to-r from-muted to-secondary border-2 border-border rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h4 className="text-lg font-bold text-foreground">Preview</h4>
                  </div>
                  <div className="space-y-4">
                    {result.preview.image && (
                      <img 
                        src={result.preview.image} 
                        alt="Preview" 
                        className="w-full max-h-48 rounded-xl object-cover shadow-md" 
                      />
                    )}
                    <div className="space-y-2">
                      {result.preview.title && (
                        <h5 className="text-lg font-semibold text-gray-900 leading-tight">{result.preview.title}</h5>
                      )}
                      {result.preview.description && (
                        <p className="text-gray-700 leading-relaxed">{result.preview.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <VerificationResult data={result} />
            </div>
          )}
        </div>

       
      </main>
    </div>
  );
}

/* ---------- helpers & UI ---------- */

function Badge({
  color,
  children,
}: {
  color: 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'blue';
  children: React.ReactNode;
}) {
  const palette: Record<string, string> = {
    green: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 ring-green-300 shadow-green-100',
    yellow: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 ring-yellow-300 shadow-yellow-100',
    red: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 ring-red-300 shadow-red-100',
    gray: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 ring-gray-300 shadow-gray-100',
    purple: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 ring-purple-300 shadow-purple-100',
    blue: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 ring-blue-300 shadow-blue-100',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ring-2 ring-inset shadow-sm ${palette[color]}`}
    >
      {children}
    </span>
  );
}

// NEW: read platform verification regardless of API shape
function platformVerifiedFrom(data: any) {
  if (typeof data?.allowedHost === 'boolean') {
    return !!(data.allowedHost && data.https && data.pathOk);
  }
  return !!data?.platformVerified; // backward compat
}

function VerificationResult({ data }: { data: any }) {
  const isCharity = data?.subjectType === 'charity';
  return isCharity ? <CharityResult data={data} /> : <FundraiserResult data={data} />;
}

function CharityResult({ data }: { data: any }) {
  const org = data?.org;
  if (!org) return <div className="text-sm">No result</div>;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{org.name}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-lg text-gray-700">
              <span className="font-semibold">EIN:</span> {org.ein}
            </p>
            <p className="text-lg text-gray-700">
              <span className="font-semibold">Status:</span> {org.subsection || 'Not specified'}
            </p>
          </div>
        </div>
        <Badge color={data?.deductible ? 'green' : 'gray'}>
          {data?.deductible ? '✅ Tax-deductible' : '❌ Not tax-deductible'}
        </Badge>
      </div>

      {Array.isArray(data?.sources) && data.sources.length > 0 && (
        <div className="bg-white/60 rounded-xl p-4 border border-green-200">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center space-x-2">
            <ExternalLink className="h-4 w-4" />
            <span>Verification Sources</span>
          </h4>
          <ul className="space-y-2">
            {data.sources.map((s: any, i: number) => (
              <li key={i} className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FundraiserResult({ data }: { data: any }) {
  const platformVerified = platformVerifiedFrom(data);
  const platform = data?.platform || 'unknown';
  const ai = data?.ai || data?.aiAnalysis; // support both keys
  const verdict: 'LIKELY_LEGIT' | 'REVIEW' | 'SCAM_LIKELY' =
    data?.verdict || (platformVerified ? 'REVIEW' : 'SCAM_LIKELY');
  const reason =
    data?.reason ||
    (platformVerified ? 'Insufficient or mixed signals' : 'Unrecognized or unsafe domain');

  const badge = {
    text:
      verdict === 'SCAM_LIKELY'
        ? '⛔ Scam Likely'
        : verdict === 'LIKELY_LEGIT'
        ? '✅ Likely Legit'
        : '⚠️ Needs Review',
    color:
      verdict === 'SCAM_LIKELY'
        ? 'red'
        : verdict === 'LIKELY_LEGIT'
        ? 'green'
        : 'yellow',
  } as const;

  const bgColor = verdict === 'SCAM_LIKELY' 
    ? 'from-red-50 to-rose-50 border-red-200' 
    : verdict === 'LIKELY_LEGIT' 
    ? 'from-green-50 to-emerald-50 border-green-200'
    : 'from-yellow-50 to-amber-50 border-yellow-200';

  return (
    <div className={`bg-gradient-to-r ${bgColor} border-2 rounded-2xl p-8 shadow-lg`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-xl ${
              verdict === 'SCAM_LIKELY' ? 'bg-red-100' : 
              verdict === 'LIKELY_LEGIT' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {verdict === 'SCAM_LIKELY' ? (
                <XCircle className="h-6 w-6 text-red-600" />
              ) : verdict === 'LIKELY_LEGIT' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {data?.scrapedContent?.title || `${platform} Fundraiser`}
            </h3>
          </div>
          <div className="space-y-2">
            <p className="text-lg text-gray-700 flex items-center space-x-2">
              {platformVerified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span>
                {platformVerified ? 'Platform verified' : 'Platform not verified'}
              </span>
            </p>
            {data?.scrapedContent?.organizer && (
              <p className="text-lg text-gray-700">
                <span className="font-semibold">Organized by:</span> {data.scrapedContent.organizer}
              </p>
            )}
          </div>
        </div>
        <Badge color={badge.color as any}>{badge.text}</Badge>
      </div>

      {/* Optional progress panel if you pass scrapedContent */}
      {data?.scrapedContent && (
        <div className="mb-6 bg-white/70 rounded-xl p-6 border border-gray-200 shadow-sm">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span>Fundraising Progress</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Goal</p>
              <p className="text-lg font-bold text-gray-900">{data.scrapedContent.goal || 'Not specified'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Raised</p>
              <p className="text-lg font-bold text-indigo-600">
                {data.scrapedContent.raised || 'Not specified'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Donors</p>
              <p className="text-lg font-bold text-purple-600">{data.scrapedContent.donors || '0'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Time Left</p>
              <p className="text-lg font-bold text-orange-600">{data.scrapedContent.daysLeft || 'Unknown'}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI block: show bands + reasons; HIDE confidence/probability */}
      {platformVerified ? (
        ai ? (
          <div
            className={`p-6 rounded-xl border-2 shadow-sm ${
              ai.risk_band === 'high'
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
                : ai.risk_band === 'low'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-800 mb-4">AI Analysis</h4>
                {Array.isArray(ai.reasons) && ai.reasons.length > 0 ? (
                  <div className="space-y-3">
                    <ul className="space-y-2">
                      {ai.reasons.slice(0, 5).map((r: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">No specific reasons provided.</p>
                )}
                {Array.isArray(ai.highlight_quotes) && ai.highlight_quotes.length > 0 && (
                  <div className="mt-6 bg-white/60 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-bold text-gray-800 mb-3 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Notable Evidence</span>
                    </p>
                    <ul className="space-y-2">
                      {ai.highlight_quotes.slice(0, 3).map((q: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-300">
                          &ldquo;{q}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            {reason && (
              <div className="mt-4 p-3 bg-white/60 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Verdict reason:</span> {reason}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">No AI analysis available for this link.</p>
            </div>
          </div>
        )
      ) : (
        // Platform not verified → do NOT show AI; show deterministic warning only
        <div className="p-6 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
          <div className="flex items-start space-x-3">
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-bold text-red-800 mb-2">Platform Verification Failed</h4>
              <p className="text-sm text-red-700">We could not verify the platform or the URL looks unsafe.</p>
              {reason && <p className="mt-2 text-sm text-red-600 font-medium">{reason}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
