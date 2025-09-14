'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Plus, Eye, Edit, Trash2, DollarSign, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  original_amount: number;
  current_amount: number;
  amount_raised: number;
  status: string;
  verification_status: string;
  charity_ein: string | null;
  created_at: string;
  updated_at: string;
}

export default function CharityListingsPage() {
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.user_metadata?.role !== 'charity') {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      await fetchListings(user.id);
    };

    getUser();
  }, [supabase.auth, router]);

  const fetchListings = async (charityId: string) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('charity_id', charityId)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setListings(data || []);
    } catch (err) {
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFundingPercentage = (raised: number, original: number) => {
    return Math.round((raised / original) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">My Listings</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard/charity/create"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New
              </Link>
              <Button variant="outline" onClick={handleSignOut} className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Plus className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No listings yet
              </h3>
              <p className="text-gray-600 mb-8">
                Create your first listing to start receiving donations from patrons.
              </p>
              <Link
                href="/dashboard/charity/create"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Listing
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {listing.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {listing.description}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                        {listing.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVerificationColor(listing.verification_status)}`}>
                        {listing.verification_status}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        ${listing.original_amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Goal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${listing.amount_raised.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Raised</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {getFundingPercentage(listing.amount_raised, listing.original_amount)}%
                      </div>
                      <div className="text-sm text-gray-600">Funded</div>
                    </div>
                  </div>

                  {/* EIN Display */}
                  {listing.charity_ein && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">EIN:</span>
                        <span className="font-mono bg-white px-2 py-1 rounded border">
                          {listing.charity_ein}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(getFundingPercentage(listing.amount_raised, listing.original_amount), 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/charity/listings/${listing.id}`}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                      <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
