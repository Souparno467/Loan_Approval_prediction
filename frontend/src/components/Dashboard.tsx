import { useState } from 'react';

export default function Dashboard() {
  // Example stats, replace with real data as needed
  const [stats] = useState({
    totalLoans: 1280,
    activeLoans: 1024,
    defaulted: 56,
    totalAmount: 12500000,
  });

  return (
    <section className="mb-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 dark:from-pink-600 dark:via-red-600 dark:to-yellow-600 rounded-2xl p-6 shadow-2xl text-white border-2 border-pink-300/40 dark:border-pink-800/40 hover:scale-105 transition-all duration-300 hover:shadow-3xl hover:border-pink-200/60">
          <div className="text-3xl font-extrabold drop-shadow-lg animate-pulse">{stats.totalLoans}</div>
          <div className="text-sm mt-2 font-semibold text-pink-900 dark:text-pink-200">Total Loans</div>
          <div className="mt-2 text-xs opacity-80">All registered loans</div>
        </div>
        <div className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 dark:from-green-600 dark:via-blue-600 dark:to-purple-700 rounded-2xl p-6 shadow-2xl text-white border-2 border-green-300/40 dark:border-green-800/40 hover:scale-105 transition-all duration-300 hover:shadow-3xl hover:border-green-200/60">
          <div className="text-3xl font-extrabold drop-shadow-lg animate-bounce">{stats.activeLoans}</div>
          <div className="text-sm mt-2 font-semibold text-green-900 dark:text-green-200">Active Loans</div>
          <div className="mt-2 text-xs opacity-80">Currently active</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 dark:from-red-600 dark:via-pink-600 dark:to-orange-600 rounded-2xl p-6 shadow-2xl text-white border-2 border-red-300/40 dark:border-red-800/40 hover:scale-105 transition-all duration-300 hover:shadow-3xl hover:border-red-200/60">
          <div className="text-3xl font-extrabold drop-shadow-lg animate-pulse">{stats.defaulted}</div>
          <div className="text-sm mt-2 font-semibold text-red-900 dark:text-red-200">Defaulted</div>
          <div className="mt-2 text-xs opacity-80">At risk loans</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 dark:from-yellow-600 dark:via-orange-600 dark:to-pink-600 rounded-2xl p-6 shadow-2xl text-white border-2 border-yellow-300/40 dark:border-yellow-800/40 hover:scale-105 transition-all duration-300 hover:shadow-3xl hover:border-yellow-200/60">
          <div className="text-3xl font-extrabold drop-shadow-lg animate-bounce">${(stats.totalAmount/1e6).toFixed(2)}M</div>
          <div className="text-sm mt-2 font-semibold text-yellow-900 dark:text-yellow-200">Total Amount</div>
          <div className="mt-2 text-xs opacity-80">Portfolio value</div>
        </div>
      </div>
    </section>
  );
}
