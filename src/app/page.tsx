import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Heart, Users, Shield, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">GiftFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Bridge Wealth Gaps with
            <span className="text-indigo-600"> Tax-Deductible Wishes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect Patrons (donors) with Charities (recipients) through verified, 
            tax-deductible wishes. Every wish is verified for tax eligibility before publication.
          </p>
          
          <SignedOut>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignInButton mode="modal">
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors">
                  Get Started
                </button>
              </SignInButton>
              <Link 
                href="/wishes"
                className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Browse Wishes
              </Link>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/wishes"
                className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Browse Wishes
              </Link>
            </div>
          </SignedIn>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">For Charities</h3>
            <p className="text-gray-600">
              Post your tax-deductible needs as wishes. Choose from pre-verified categories 
              or submit custom wishes for verification.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Heart className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">For Patrons</h3>
            <p className="text-gray-600">
              Fulfill wishes and receive automatic tax receipts. Track your impact 
              with detailed analytics and tax documentation.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Shield className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tax Compliance</h3>
            <p className="text-gray-600">
              Every wish is verified for tax deductibility. Our system ensures 
              only eligible wishes are published and fulfilled.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How GiftFlow Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Account</h3>
              <p className="text-gray-600 text-sm">
                Sign up as a Charity, Patron, or both
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Post or Browse</h3>
              <p className="text-gray-600 text-sm">
                Charities post wishes, Patrons browse and filter
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verify & Fulfill</h3>
              <p className="text-gray-600 text-sm">
                System verifies tax eligibility, Patrons fulfill wishes
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Receipts</h3>
              <p className="text-gray-600 text-sm">
                Automatic tax receipts and documentation
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Tax-Deductible Guarantee
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every wish published on GiftFlow has been verified for tax deductibility. 
              Our automated system and human moderators ensure compliance with IRS guidelines. 
              Only eligible wishes are published and fulfilled.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-indigo-400" />
              <span className="ml-2 text-xl font-bold">GiftFlow</span>
            </div>
            <p className="text-gray-400 mb-4">
              Connecting communities through tax-deductible wishes
            </p>
            <p className="text-sm text-gray-500">
              This platform provides standardized receipts and summaries. 
              Consult a tax professional for your specific situation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
