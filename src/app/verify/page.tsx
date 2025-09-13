'use client';

import React, { useState } from 'react';
import { Shield, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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

  const mode: 'url' | 'ein' | 'name' | null = React.useMemo(() => {
    if (!input.trim()) return null;
    if (isUrl(input.trim())) return 'url';
    if (isEin(input.trim())) return 'ein';
    return 'name';
  }, [input]);

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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to GiftFlow
            </Link>
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">GiveGuard</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Verify Fundraiser Legitimacy</h1>
          <p className="text-xl text-gray-600">
            Ensure your donations go to legitimate causes with conservative checks + AI signals
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
                Fundraiser URL, Charity Name, or EIN
              </label>
              <input
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste fundraiser URL, type charity name, or enter EIN"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              {mode && (
                <p className="mt-2 text-sm text-gray-500">
                  Detected: <span className="font-medium text-purple-700">{mode}</span>
                </p>
              )}
            </div>

            {mode === 'url' && (
              <div>
                <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Description (Optional)
                </label>
                <textarea
                  id="desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="(Optional) Paste the fundraiser description here for a better summary and risk analysis."
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  rows={3}
                />
              </div>
            )}

<button
  type="submit"
  className="w-full !bg-purple-600 !text-white px-6 py-3 !rounded-lg font-semibold hover:!bg-purple-700 disabled:!bg-gray-400 transition-colors text-lg"
>
  {loading ? 'Analyzing...' : 'Verify Legitimacy'}
</button>


            
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
              Debug: Input length: {input.length}, Loading: {loading.toString()}
            </div>
          </form>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8">
              {result.preview && (result.preview.title || result.preview.description || result.preview.image) && (
                <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
                  {result.preview.image && (
                    <img src={result.preview.image} alt="Preview" className="mb-3 max-h-40 rounded-md object-cover" />
                  )}
                  {result.preview.title && <p className="text-sm font-medium text-gray-900">{result.preview.title}</p>}
                  {result.preview.description && <p className="text-sm text-gray-700 mt-1">{result.preview.description}</p>}
                </div>
              )}
              <VerificationResult data={result} />
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-800 font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            Go to Dashboard
          </Link>
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
    green: 'bg-green-100 text-green-800 ring-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    red: 'bg-red-100 text-red-800 ring-red-200',
    gray: 'bg-gray-100 text-gray-800 ring-gray-200',
    purple: 'bg-purple-100 text-purple-800 ring-purple-200',
    blue: 'bg-blue-100 text-blue-800 ring-blue-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${palette[color]}`}
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
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">{org.name}</h3>
          <p className="text-sm text-gray-500">
            EIN: {org.ein} • {org.subsection || '—'}
          </p>
        </div>
        <Badge color={data?.deductible ? 'purple' : 'gray'}>
          {data?.deductible ? '✅ Tax-deductible' : 'Not tax-deductible'}
        </Badge>
      </div>

      {Array.isArray(data?.sources) && data.sources.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-600">Sources</p>
          <ul className="mt-1 text-xs text-gray-600 list-disc pl-4">
            {data.sources.map((s: any, i: number) => (
              <li key={i}>{s.name}</li>
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

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">
            {data?.scrapedContent?.title || `${platform} Fundraiser`}
          </h3>
          <p className="text-sm text-gray-500">
            {platformVerified ? '✅ Platform verified' : '⚠️ Platform not verified'}
            {data?.scrapedContent?.organizer && ` • Organized by ${data.scrapedContent.organizer}`}
          </p>
        </div>
        <Badge color={badge.color as any}>{badge.text}</Badge>
      </div>

      {/* Optional progress panel if you pass scrapedContent */}
      {data?.scrapedContent && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Fundraising Progress</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Goal</p>
              <p className="font-semibold">{data.scrapedContent.goal || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-gray-600">Raised</p>
              <p className="font-semibold text-purple-700">
                {data.scrapedContent.raised || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Donors</p>
              <p className="font-semibold">{data.scrapedContent.donors || '0'}</p>
            </div>
            <div>
              <p className="text-gray-600">Time Left</p>
              <p className="font-semibold">{data.scrapedContent.daysLeft || 'Unknown'}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI block: show bands + reasons; HIDE confidence/probability */}
      {platformVerified ? (
        ai ? (
          <div
            className={`p-4 rounded-lg border ${
              ai.risk_band === 'high'
                ? 'bg-yellow-50 border-yellow-200'
                : ai.risk_band === 'low'
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-2">AI Analysis</h4>
                {Array.isArray(ai.reasons) && ai.reasons.length > 0 ? (
                  <ul className="text-sm leading-relaxed list-disc pl-5">
                    {ai.reasons.slice(0, 5).map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-700">No specific reasons provided.</p>
                )}
                {Array.isArray(ai.highlight_quotes) && ai.highlight_quotes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700">Notable evidence</p>
                    <ul className="text-xs text-gray-700 list-disc pl-5">
                      {ai.highlight_quotes.slice(0, 3).map((q: string, i: number) => (
                        <li key={i}>&ldquo;{q}&rdquo;</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            {reason && <p className="mt-3 text-xs text-gray-600">Verdict reason: {reason}</p>}
          </div>
        ) : (
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <p className="text-sm">No AI analysis available for this link.</p>
          </div>
        )
      ) : (
        // Platform not verified → do NOT show AI; show deterministic warning only
        <div className="p-4 rounded-lg border bg-red-50 border-red-200">
          <p className="text-sm">We could not verify the platform or the URL looks unsafe.</p>
          {reason && <p className="mt-2 text-xs text-red-700">{reason}</p>}
        </div>
      )}
    </div>
  );
}
