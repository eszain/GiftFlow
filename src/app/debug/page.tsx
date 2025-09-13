'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function DebugPage() {
  const { isLoaded, userId, sessionId, isSignedIn } = useAuth();
  const [envStatus, setEnvStatus] = useState<any>(null);

  useEffect(() => {
    // Check environment variables
    fetch('/api/debug/env')
      .then(res => res.json())
      .then(data => setEnvStatus(data))
      .catch(err => console.error('Failed to fetch env status:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">GiftFlow Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clerk Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Clerk Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Loaded:</strong> {isLoaded ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Signed In:</strong> {isSignedIn ? '✅ Yes' : '❌ No'}</p>
              <p><strong>User ID:</strong> {userId || 'Not authenticated'}</p>
              <p><strong>Session ID:</strong> {sessionId || 'No session'}</p>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            {envStatus ? (
              <div className="space-y-2">
                {Object.entries(envStatus.variables || {}).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key}:</strong> 
                    <span className={value === 'SET' ? 'text-green-600' : 'text-red-600'}>
                      {value === 'SET' ? ' ✅ SET' : ' ❌ NOT SET'}
                    </span>
                  </p>
                ))}
              </div>
            ) : (
              <p>Loading environment status...</p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Check .env.local file:</strong> Make sure it exists in the project root</p>
              <p>2. <strong>Verify Clerk keys:</strong> Ensure they start with pk_test_ and sk_test_</p>
              <p>3. <strong>Restart dev server:</strong> Run <code>npm run dev</code> after adding keys</p>
              <p>4. <strong>Check Clerk dashboard:</strong> Verify your application is active</p>
              <p>5. <strong>Clear browser cache:</strong> Hard refresh the page (Ctrl+F5)</p>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
            <button
              onClick={() => fetch('/api/debug/env').then(res => res.json()).then(console.log)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test API
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
