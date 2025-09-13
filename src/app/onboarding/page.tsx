'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { Heart, Users, CheckCircle, ArrowRight } from 'lucide-react';

function OnboardingContent() {
  const [selectedRoles, setSelectedRoles] = useState<{
    charity: boolean;
    patron: boolean;
  }>({
    charity: false,
    patron: false,
  });
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleRoleToggle = (role: 'charity' | 'patron') => {
    setSelectedRoles(prev => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoles.charity && !selectedRoles.patron) {
      alert('Please select at least one role');
      return;
    }

    if (!displayName.trim()) {
      alert('Please enter your display name');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create or update user profile
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          city: city.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user profile');
      }

      // Update user roles
      const rolesResponse = await fetch('/api/users/roles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: {
            charity: selectedRoles.charity,
            patron: selectedRoles.patron,
            moderator: false,
            admin: false,
          },
        }),
      });

      if (!rolesResponse.ok) {
        throw new Error('Failed to set user roles');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
      alert('Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Heart className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to GiftFlow
            </h1>
            <p className="text-gray-600">
              Let's set up your account to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Profile Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="How would you like to be known on GiftFlow?"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City (Optional)
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Baltimore, MD"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Choose Your Role(s)
              </h2>
              <p className="text-gray-600 mb-6">
                You can be both a Charity and a Patron, or choose just one role.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Charity Role */}
                <div 
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedRoles.charity 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRoleToggle('charity')}
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedRoles.charity 
                        ? 'border-indigo-500 bg-indigo-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedRoles.charity && (
                        <CheckCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <Users className="h-8 w-8 text-indigo-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Charity</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Post tax-deductible wishes and receive help from Patrons. 
                    Perfect if you have qualifying needs like medical expenses, 
                    educational materials, or housing assistance.
                  </p>
                </div>

                {/* Patron Role */}
                <div 
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedRoles.patron 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRoleToggle('patron')}
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedRoles.patron 
                        ? 'border-indigo-500 bg-indigo-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedRoles.patron && (
                        <CheckCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <Heart className="h-8 w-8 text-indigo-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Patron</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Fulfill wishes and receive automatic tax receipts. 
                    Track your impact with detailed analytics and get 
                    tax documentation for your donations.
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Deductible Guarantee */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 mb-1">
                    Tax-Deductible Guarantee
                  </h3>
                  <p className="text-sm text-green-700">
                    Every wish on GiftFlow is verified for tax deductibility. 
                    As a Patron, you can fulfill any published wish with confidence 
                    that it qualifies for tax deduction.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || (!selectedRoles.charity && !selectedRoles.patron)}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Setting up your account...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <>
      <SignedIn>
        <OnboardingContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
