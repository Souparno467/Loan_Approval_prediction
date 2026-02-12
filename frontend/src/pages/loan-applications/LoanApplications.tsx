import { Link } from 'react-router-dom';
import { useLoan } from '../../context/LoanContext';

export default function LoanApplications() {
  const { resetFormData } = useLoan();

  const stats = [
    { label: 'Total Loans', value: '1,280', icon: '💰', color: 'from-pink-500 to-red-500' },
    { label: 'Active Loans', value: '1,024', icon: '📊', color: 'from-green-500 to-blue-500' },
    { label: 'Defaulted', value: '56', icon: '⚠️', color: 'from-orange-500 to-red-500' },
    { label: 'Portfolio Value', value: '$12.5M', icon: '💼', color: 'from-yellow-500 to-pink-500' },
  ];

  const recentApplications = [
    { id: 1, name: 'John Doe', amount: '$25,000', status: 'pending', date: '2024-01-15' },
    { id: 2, name: 'Jane Smith', amount: '$15,000', status: 'approved', date: '2024-01-14' },
    { id: 3, name: 'Bob Johnson', amount: '$50,000', status: 'rejected', date: '2024-01-13' },
    { id: 4, name: 'Alice Brown', amount: '$8,000', status: 'pending', date: '2024-01-12' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Loan Applications</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and track all loan applications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-black rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-1`}>
                  {stat.value}
                </p>
              </div>
              <div className="text-4xl opacity-80">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Start New Application */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Start New Loan Application</h2>
            <p className="mb-6 opacity-90">Begin your loan application journey with our simple, step-by-step process.</p>
            <Link
              to="/loan-applications/new"
              onClick={resetFormData}
              className="inline-flex items-center px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🚀 Start Application
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {app.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{app.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{app.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{app.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link
                  to="/loan-list"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                >
                  View All Applications →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}