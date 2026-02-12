import React from 'react';
import { useLoan } from '../../context/LoanContext';
import { Link } from 'react-router-dom';
import { LoanNavigation } from '../../components/loan-applications/LoanNavigation';

export default function LoanDetails() {
  const { formData, updateFormData, saveDraft, setCurrentStep } = useLoan();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('property');
  };

  const handleSaveDraft = () => {
    saveDraft();
    alert('Draft saved successfully!');
  };

  return (
    <div className="animate-fade-in">
      <LoanNavigation />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Loan Details</h1>
            <p className="text-gray-600 dark:text-gray-400">Specify the loan amount and terms you're looking for.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Loan Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loan Amount Requested (₹)
              </label>
              <input
                type="number"
                value={formData.loanDetails.loanAmount || ''}
                onChange={(e) => updateFormData('loan-details', { loanAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                placeholder="Enter loan amount"
                min="1000"
                step="1000"
              />
            </div>

            {/* Loan Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Loan Purpose
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { value: 'home-purchase', label: 'Home Purchase', icon: '🏠' },
                  { value: 'education', label: 'Education', icon: '🎓' },
                  { value: 'business', label: 'Business', icon: '🏢' },
                  { value: 'personal', label: 'Personal', icon: '💼' },
                  { value: 'car', label: 'Car', icon: '🚗' },
                  { value: 'debt-consolidation', label: 'Debt Consolidation', icon: '💳' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.loanDetails.loanPurpose === option.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={formData.loanDetails.loanPurpose === option.value}
                      onChange={(e) => updateFormData('loan-details', { loanPurpose: e.target.value as any })}
                      className="sr-only"
                    />
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Loan Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loan Term (Months)
              </label>
              <select
                value={formData.loanDetails.loanTerm}
                onChange={(e) => updateFormData('loan-details', { loanTerm: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              >
                <option value={12}>12 months (1 year)</option>
                <option value={24}>24 months (2 years)</option>
                <option value={36}>36 months (3 years)</option>
                <option value={48}>48 months (4 years)</option>
                <option value={60}>60 months (5 years)</option>
                <option value={84}>84 months (7 years)</option>
                <option value={120}>120 months (10 years)</option>
              </select>
            </div>

            {/* Interest Rate Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Interest Rate Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'fixed', label: 'Fixed Rate', description: 'Rate remains constant throughout the loan term' },
                  { value: 'floating', label: 'Floating Rate', description: 'Rate varies with market conditions' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.loanDetails.interestRateType === option.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={formData.loanDetails.interestRateType === option.value}
                      onChange={(e) => updateFormData('loan-details', { interestRateType: e.target.value as any })}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <Link
                  to="/loan-applications/new/financial"
                  className="px-6 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  ← Back: Financial Info
                </Link>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium border border-gray-700"
                >
                  💾 Save Draft
                </button>
              </div>
              
              <button
                type="submit"
                className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Next: Property & Assets →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}