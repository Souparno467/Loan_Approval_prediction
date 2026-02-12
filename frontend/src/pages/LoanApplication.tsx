import { Link } from 'react-router-dom';

export default function LoanApplicationPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Loan Application</h1>
        <p className="text-gray-600 dark:text-gray-400">Start your loan application journey with our comprehensive multi-step process.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quick Start */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">🚀 Quick Start</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our new multi-step application process ensures we gather all necessary information 
            to provide you with the best loan terms and fastest approval.
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-lg">📋</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Financial Information</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-lg">💰</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Loan Details</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-lg">🏠</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Property & Assets</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-lg">📊</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Credit Bureau Scores</span>
            </div>
          </div>

          <Link
            to="/loan-applications/new"
            className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold shadow-lg"
          >
            🚀 Start New Application
          </Link>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Loans?</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-semibold">Fast Approval</h3>
                <p className="text-sm opacity-90">Get approved within 24-48 hours</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="font-semibold">Competitive Rates</h3>
                <p className="text-sm opacity-90">Lowest interest rates guaranteed</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-semibold">Secure Process</h3>
                <p className="text-sm opacity-90">Your data is always protected</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-semibold">Progress Tracking</h3>
                <p className="text-sm opacity-90">Save progress and complete at your pace</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Applications */}
      <div className="mt-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">📋 Existing Applications</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            View and manage your existing loan applications, check their status, and track progress.
          </p>
          <Link
            to="/loan-list"
            className="inline-flex items-center px-6 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium border border-gray-700"
          >
            📋 View All Applications
          </Link>
        </div>
      </div>
    </div>
  );
}