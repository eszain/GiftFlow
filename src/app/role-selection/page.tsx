'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Shield, Crown } from 'lucide-react';

export default function RoleSelectionPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const handleRoleSelection = async (role: 'patron' | 'charity') => {
    if (!user) return;
    
    setIsLoading(true);
    setSelectedRole(role);

    try {
      const response = await fetch('/api/users/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          role: role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set user role');
      }

      // Redirect to appropriate dashboard
      if (role === 'patron') {
        router.push('/dashboard/patron');
      } else {
        router.push('/dashboard/charity');
      }
    } catch (error) {
      console.error('Error setting user role:', error);
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to GiftFlow! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Choose your role to get started
            </p>
            <p className="text-gray-500">
              You can always change this later in your settings
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Patron Card */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedRole === 'patron' ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
              }`}
              onClick={() => !isLoading && handleRoleSelection('patron')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-indigo-100 rounded-full w-fit">
                  <Heart className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Patron</CardTitle>
                <CardDescription className="text-lg">
                  I want to support tax-deductible wishes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Tax Deductible
                    </Badge>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      Browse and fulfill wishes from charities
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      Get tax receipts for your donations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      Track your giving impact
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      Access detailed analytics
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Charity Card */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedRole === 'charity' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'
              }`}
              onClick={() => !isLoading && handleRoleSelection('charity')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Charity</CardTitle>
                <CardDescription className="text-lg">
                  I represent a charity and need support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Non-Profit
                    </Badge>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Create tax-deductible wishes
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Upload supporting documents
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Manage your wish requests
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Track fulfillment status
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-indigo-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                Setting up your account...
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Want to be both? You can add additional roles later in your profile settings.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                Back to Home
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/help')}>
                Need Help?
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
