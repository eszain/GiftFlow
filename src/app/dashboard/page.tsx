import { Suspense } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { Heart, Plus, Eye, TrendingUp, Users, Shield } from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  // Mock user data
  const userRoles = {
    charity: true,
    patron: true,
    moderator: false,
    admin: false,
  };

  const stats = {
    wishesPosted: 3,
    wishesFulfilled: 7,
    totalDonated: 250000, // $2,500 in cents
    totalReceived: 120000, // $1,200 in cents
  };

  const recentWishes = [
    {
      id: '1',
      title: 'Medical expenses for cancer treatment',
      status: 'ELIGIBLE',
      amountCents: 500000,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      title: 'Educational materials for engineering',
      status: 'UNDER_REVIEW',
      amountCents: 120000,
      createdAt: new Date('2024-01-14'),
    },
  ];

  const recentFulfillments = [
    {
      id: '1',
      wishTitle: 'Housing assistance for single mother',
      amountCents: 200000,
      createdAt: new Date('2024-01-13'),
    },
    {
      id: '2',
      wishTitle: 'Food assistance program',
      amountCents: 50000,
      createdAt: new Date('2024-01-12'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <Heart className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">GiftFlow</span>
            </Link>
            <nav className="flex space-x-8">
              <Link href="/dashboard" className="text-indigo-600 font-medium">Dashboard</Link>
              <Link href="/wishes" className="text-gray-600 hover:text-gray-900">Browse Wishes</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to your Dashboard</h1>
          <p className="text-gray-600">
            Manage your wishes and track your impact as a {userRoles.charity && userRoles.patron ? 'Charity and Patron' : userRoles.charity ? 'Charity' : 'Patron'}
          </p>
        </div>

        {/* Role Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {userRoles.charity && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Charity</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Post tax-deductible wishes and receive help from Patrons
              </p>
              <Link 
                href="/create-wish"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post a Wish
              </Link>
            </div>
          )}

          {userRoles.patron && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Heart className="h-8 w-8 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Patron</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Fulfill wishes and receive tax receipts for your donations
              </p>
              <Link 
                href="/wishes"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Browse Wishes
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Plus className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wishes Posted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.wishesPosted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wishes Fulfilled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.wishesFulfilled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Donated</p>
                <p className="text-2xl font-bold text-gray-900">${(stats.totalDonated / 100).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-gray-900">${(stats.totalReceived / 100).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Wishes */}
          {userRoles.charity && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Wishes</h2>
                <Link 
                  href="/my-wishes"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentWishes.map((wish) => (
                  <div key={wish.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{wish.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        wish.status === 'ELIGIBLE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {wish.status === 'ELIGIBLE' ? 'Published' : 'Under Review'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      ${(wish.amountCents / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {wish.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Fulfillments */}
          {userRoles.patron && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Fulfillments</h2>
                <Link 
                  href="/analytics"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View Analytics
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentFulfillments.map((fulfillment) => (
                  <div key={fulfillment.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{fulfillment.wishTitle}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      ${(fulfillment.amountCents / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fulfillment.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userRoles.charity && (
              <Link 
                href="/create-wish"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-6 w-6 text-indigo-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Post a Wish</h3>
                  <p className="text-sm text-gray-600">Create a new tax-deductible wish</p>
                </div>
              </Link>
            )}
            
            {userRoles.patron && (
              <Link 
                href="/wishes"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-6 w-6 text-indigo-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Browse Wishes</h3>
                  <p className="text-sm text-gray-600">Find wishes to fulfill</p>
                </div>
              </Link>
            )}
            
            <Link 
              href="/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-indigo-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600">Track your impact and donations</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <SignedIn>
        <Suspense fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        }>
          <DashboardContent />
        </Suspense>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
