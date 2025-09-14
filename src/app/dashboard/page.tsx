'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Plus, Eye, Receipt, FileText } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);
      
      // Get user role from user metadata
      if (user?.user_metadata?.role) {
        setUserRole(user.user_metadata.role);
      }
      
      setLoading(false);
    };

    getUser();
  }, [supabase.auth, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {user.email}
                </div>
                <div className="flex items-center justify-end space-x-1">
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    userRole === 'patron' 
                      ? 'bg-green-100 text-green-800' 
                      : userRole === 'charity'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userRole === 'patron' ? 'Patron' : 
                     userRole === 'charity' ? 'Charity' : 
                     'User'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userRole === 'charity' ? (
          <CharityDashboard />
        ) : userRole === 'patron' ? (
          <PatronDashboard />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to GiftFlow
            </h2>
            <p className="text-gray-600 mb-8">
              Your account is being set up. Please contact support if you need assistance.
            </p>
            <Link
              href="/"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

// Charity Dashboard Component
function CharityDashboard() {
  const [stats, setStats] = useState({
    activeListings: 0,
    totalRaised: 0,
    fulfilledWishes: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: listings, error } = await supabase
          .from('listings')
          .select('status, amount_raised')
          .eq('charity_id', user.id);

        if (error) {
          console.error('Error fetching stats:', error);
          return;
        }

        const activeListings = listings?.filter(l => l.status === 'active').length || 0;
        const totalRaised = listings?.reduce((sum, l) => sum + (l.amount_raised || 0), 0) || 0;
        const fulfilledWishes = listings?.filter(l => l.status === 'fulfilled').length || 0;

        setStats({
          activeListings,
          totalRaised,
          fulfilledWishes
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Charity Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Manage your charity listings and track donations
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Create New Listing */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Plus className="h-8 w-8 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Create New Listing</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Post a new wish or need that patrons can fulfill. Make sure to include all necessary documentation for tax verification.
          </p>
          <Link
            href="/dashboard/charity/create"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Listing
          </Link>
        </div>

        {/* View My Listings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Eye className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">My Listings</h2>
          </div>
          <p className="text-gray-600 mb-6">
            View and manage your existing listings, track donations, and update status.
          </p>
          <Link
            href="/dashboard/charity/listings"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
          >
            <Eye className="h-5 w-5 mr-2" />
            View Listings
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {loading ? '...' : stats.activeListings}
          </div>
          <div className="text-gray-600">Active Listings</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {loading ? '...' : `$${stats.totalRaised.toLocaleString()}`}
          </div>
          <div className="text-gray-600">Total Raised</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {loading ? '...' : stats.fulfilledWishes}
          </div>
          <div className="text-gray-600">Fulfilled Wishes</div>
        </div>
      </div>
    </div>
  );
}

// Patron Dashboard Component
function PatronDashboard() {
  const [stats, setStats] = useState({
    activeListings: 0,
    totalDonated: 0,
    charitiesHelped: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch active listings count
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('id')
          .eq('status', 'active');

        if (listingsError) {
          console.error('Error fetching listings:', listingsError);
        }

        // For now, we'll set donations to 0 since we don't have a donations table yet
        // In the future, you'd fetch from a donations table
        const activeListings = listings?.length || 0;
        const totalDonated = 0; // TODO: Fetch from donations table
        const charitiesHelped = 0; // TODO: Fetch from donations table

        setStats({
          activeListings,
          totalDonated,
          charitiesHelped
        });
      } catch (err) {
        console.error('Error fetching patron stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Patron Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Discover and fulfill charity wishes to make a difference
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Browse Listings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Eye className="h-8 w-8 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Browse Listings</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Explore verified charity wishes and find causes you want to support.
          </p>
          <Link
            href="/dashboard/patron/listings"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
          >
            <Eye className="h-5 w-5 mr-2" />
            Browse Listings
          </Link>
        </div>

        {/* My Donations */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Receipt className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Donation Summary</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Track your donations, generate tax summaries, and export receipts for tax filing.
          </p>
          <Link
            href="/dashboard/donations"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
          >
            <Receipt className="h-5 w-5 mr-2" />
            View Donation Summary
          </Link>
        </div>
      </div>

      {/* Tax Form Preparation - Centered on its own row */}
      <div className="flex justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-md w-full">
          <div className="flex items-center mb-4">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Tax Form Preparation</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Prepare draft Schedule A and Form 8283 for your charitable donations with IRS compliance.
          </p>
          <Link
            href="/dashboard/tax-forms"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <FileText className="h-5 w-5 mr-2" />
            Prepare Tax Forms
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {loading ? '...' : stats.activeListings}
          </div>
          <div className="text-gray-600">Active Listings</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {loading ? '...' : `$${stats.totalDonated.toLocaleString()}`}
          </div>
          <div className="text-gray-600">Total Donated</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {loading ? '...' : stats.charitiesHelped}
          </div>
          <div className="text-gray-600">Charities Helped</div>
        </div>
      </div>
    </div>
  );
}
