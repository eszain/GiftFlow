'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Heart, DollarSign, Calendar, MapPin, Filter } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  amount_requested: number;
  amount_raised: number;
  charity_name: string;
  created_at: string;
  images: string[];
}

export default function PatronListingsPage() {
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [donationModal, setDonationModal] = useState<{ isOpen: boolean; listing: Listing | null }>({
    isOpen: false,
    listing: null
  });
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const categories = [
    'education',
    'healthcare', 
    'food',
    'shelter',
    'clothing',
    'equipment',
    'transportation',
    'other'
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.user_metadata?.role !== 'patron') {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      await fetchListings();
    };

    getUser();
  }, [supabase.auth, router]);

  const fetchListings = async () => {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        return;
      }

      // Filter for verified listings on the client side for now
      const verifiedListings = data?.filter(listing => 
        listing.verification_status === 'verified' || 
        listing.verification_status === 'pending' // Show pending ones too for testing
      ) || [];
      
      setListings(verifiedListings);
    } catch (err) {
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [selectedCategory, user]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      education: 'bg-blue-100 text-blue-800',
      healthcare: 'bg-red-100 text-red-800',
      food: 'bg-green-100 text-green-800',
      shelter: 'bg-purple-100 text-purple-800',
      clothing: 'bg-pink-100 text-pink-800',
      equipment: 'bg-yellow-100 text-yellow-800',
      transportation: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  const getFundingPercentage = (raised: number, requested: number) => {
    return Math.round((raised / requested) * 100);
  };

  const handleDonateClick = (listing: Listing) => {
    setDonationModal({ isOpen: true, listing });
    setDonationAmount('');
  };

  const handleDonationSubmit = async () => {
    if (!donationModal.listing || !donationAmount || parseFloat(donationAmount) <= 0) {
      return;
    }

    setDonating(true);
    try {
      const amount = parseFloat(donationAmount);
      const newRaisedAmount = donationModal.listing.amount_raised + amount;

      // Update the listing's raised amount
      const { error } = await supabase
        .from('listings')
        .update({ amount_raised: newRaisedAmount })
        .eq('id', donationModal.listing.id);

      if (error) {
        console.error('Error updating listing:', error);
        setError('Failed to process donation. Please try again.');
        return;
      }

      // Update the local state
      setListings(prevListings => 
        prevListings.map(listing => 
          listing.id === donationModal.listing!.id 
            ? { ...listing, amount_raised: newRaisedAmount }
            : listing
        )
      );

      // Close modal and reset
      setDonationModal({ isOpen: false, listing: null });
      setDonationAmount('');
      
      // Show success message
      alert(`Thank you for your donation of $${amount.toFixed(2)}!`);
      
    } catch (err) {
      console.error('Donation error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setDonating(false);
    }
  };

  const closeDonationModal = () => {
    setDonationModal({ isOpen: false, listing: null });
    setDonationAmount('');
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
                <span className="text-2xl font-bold text-gray-900">Browse Listings</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No listings available
              </h3>
              <p className="text-gray-600 mb-8">
                {selectedCategory 
                  ? `No verified listings found in the ${selectedCategory} category.`
                  : 'No verified listings are currently available. Check back later!'
                }
              </p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  View All Categories
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {listing.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(listing.category)}`}>
                        {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {listing.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="font-medium">{listing.charity_name}</span>
                      <span className="mx-2">•</span>
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      ${listing.amount_requested.toLocaleString()}
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
                      {getFundingPercentage(listing.amount_raised, listing.amount_requested)}%
                    </div>
                    <div className="text-sm text-gray-600">Funded</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(getFundingPercentage(listing.amount_raised, listing.amount_requested), 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    ${(listing.amount_requested - listing.amount_raised).toLocaleString()} still needed
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleDonateClick(listing)}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Donate Now
                    </button>
                    {listing.verification_status === 'pending' && (
                      <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Donation Modal */}
      {donationModal.isOpen && donationModal.listing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Make a Donation
            </h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {donationModal.listing.title}
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                by {donationModal.listing.charity_name}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Goal:</span>
                  <span className="font-semibold">${donationModal.listing.amount_requested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Raised:</span>
                  <span className="font-semibold">${donationModal.listing.amount_raised.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Still needed:</span>
                  <span className="font-semibold text-red-600">
                    ${(donationModal.listing.amount_requested - donationModal.listing.amount_raised).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="donationAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Donation Amount ($)
              </label>
              <input
                type="number"
                id="donationAmount"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={closeDonationModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={donating}
              >
                Cancel
              </button>
              <button
                onClick={handleDonationSubmit}
                disabled={donating || !donationAmount || parseFloat(donationAmount) <= 0}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {donating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Donate ${donationAmount || '0.00'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
