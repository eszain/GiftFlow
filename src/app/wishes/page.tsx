import { Suspense } from 'react';
import { Heart, Search, Filter, MapPin, Tag, DollarSign } from 'lucide-react';
import Link from 'next/link';

// Mock data for demonstration
const mockWishes = [
  {
    id: '1',
    title: 'Medical expenses for cancer treatment',
    description: 'Help cover qualifying medical bills for ongoing cancer treatment at Johns Hopkins Hospital.',
    city: 'Baltimore, MD',
    amountCents: 500000, // $5,000
    tags: ['medical', 'cancer-treatment', 'baltimore'],
    type: 'PREVERIFIED',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Educational materials for engineering student',
    description: 'Textbooks and software licenses needed for mechanical engineering program at University of Maryland.',
    city: 'College Park, MD',
    amountCents: 120000, // $1,200
    tags: ['education', 'engineering', 'college-park'],
    type: 'PREVERIFIED',
    createdAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    title: 'Housing assistance for single mother',
    description: 'Rent assistance through approved 501(c)(3) housing partner for single mother with two children.',
    city: 'Silver Spring, MD',
    amountCents: 200000, // $2,000
    tags: ['housing', 'single-mother', 'silver-spring'],
    type: 'PREVERIFIED',
    createdAt: new Date('2024-01-13'),
  },
];

function WishCard({ wish }: { wish: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{wish.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          wish.type === 'PREVERIFIED' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {wish.type === 'PREVERIFIED' ? 'Pre-Verified' : 'Custom'}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3">{wish.description}</p>
      
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <MapPin className="h-4 w-4 mr-1" />
        {wish.city}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-lg font-semibold text-indigo-600">
          <DollarSign className="h-5 w-5 mr-1" />
          ${(wish.amountCents / 100).toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">
          {wish.createdAt.toLocaleDateString()}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {wish.tags.map((tag: string) => (
          <span 
            key={tag}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
          >
            <Tag className="h-3 w-3 inline mr-1" />
            {tag}
          </span>
        ))}
      </div>
      
      <Link 
        href={`/wishes/${wish.id}`}
        className="block w-full bg-indigo-600 text-white text-center py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        View Details
      </Link>
    </div>
  );
}

function WishesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockWishes.map((wish) => (
        <WishCard key={wish.id} wish={wish} />
      ))}
    </div>
  );
}

export default function WishesPage() {
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
              <Link href="/wishes" className="text-indigo-600 font-medium">Browse Wishes</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tax-Deductible Wishes</h1>
          <p className="text-gray-600">
            Browse verified, tax-deductible wishes from Charities in your community. 
            Every wish has been verified for tax eligibility.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search wishes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">All Cities</option>
                <option value="baltimore">Baltimore, MD</option>
                <option value="college-park">College Park, MD</option>
                <option value="silver-spring">Silver Spring, MD</option>
              </select>
              
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">All Categories</option>
                <option value="medical">Medical</option>
                <option value="education">Education</option>
                <option value="housing">Housing</option>
              </select>
              
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Trust Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                <strong>Tax-Deductible Guarantee:</strong> All wishes shown here have been verified for tax deductibility. 
                You can fulfill any wish with confidence that it qualifies for tax deduction.
              </p>
            </div>
          </div>
        </div>

        {/* Wishes Grid */}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        }>
          <WishesGrid />
        </Suspense>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="px-6 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
            Load More Wishes
          </button>
        </div>
      </main>
    </div>
  );
}
