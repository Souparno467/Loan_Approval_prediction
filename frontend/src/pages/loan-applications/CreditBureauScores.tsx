import React, { useState } from 'react';
import { useLoan } from '../../context/LoanContext';
import { Link } from 'react-router-dom';
import { LoanNavigation } from '../../components/loan-applications/LoanNavigation';

export default function CreditBureauScores() {
  const { formData, updateFormData, saveDraft, submitApplication, setCurrentStep, isSubmitting } = useLoan();
  const [showSuccess, setShowSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await submitApplication();
    
    if (result.success) {
      setShowSuccess(true);
      setReferenceNumber(result.referenceNumber || '');
      setCurrentStep('financial'); // Reset to first step
    } else {
      alert('Failed to submit application: ' + result.error);
    }
  };

  const handleSaveDraft = () => {
    saveDraft();
    alert('Draft saved successfully!');
  };

  if (showSuccess) {
    return (
      <div className="animate-fade-in">
        <LoanNavigation />
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted!</h1>
              <p className="text-gray-600 dark:text-gray-400">Your loan application has been successfully submitted.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reference Number</h2>
              <p className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{referenceNumber}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please save this reference number for future correspondence.</p>
            </div>

            <div className="space-y-4">
              <Link
                to="/loan-applications"
                className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold shadow-lg"
              >
                📋 View All Applications
              </Link>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Our team will review your application and contact you within 24-48 hours.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <LoanNavigation />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Credit Bureau Scores</h1>
            <p className="text-gray-600 dark:text-gray-400">Provide your credit information to help us assess your creditworthiness.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* CIBIL Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CIBIL Score
              </label>
              <input
                type="number"
                value={formData.credit.cibilScore || ''}
                onChange={(e) => updateFormData('credit', { cibilScore: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                placeholder="Enter your CIBIL score (300-900)"
                min="300"
                max="900"
              />
            </div>

            {/* Other Bureau Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experian Score
                </label>
                <input
                  type="number"
                  value={formData.credit.experianScore || ''}
                  onChange={(e) => updateFormData('credit', { experianScore: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  placeholder="Enter Experian score"
                  min="300"
                  max="900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equifax Score
                </label>
                <input
                  type="number"
                  value={formData.credit.equifaxScore || ''}
                  onChange={(e) => updateFormData('credit', { equifaxScore: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  placeholder="Enter Equifax score"
                  min="300"
                  max="900"
                />
              </div>
            </div>

            {/* Credit History */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Have you had any defaults in the past?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: true, label: 'Yes', icon: '⚠️', color: 'border-red-500 bg-red-50 dark:bg-red-900/20' },
                  { value: false, label: 'No', icon: '✅', color: 'border-green-500 bg-green-50 dark:bg-green-900/20' },
                ].map((option) => (
                  <label
                    key={option.value.toString()}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.credit.hasDefaults === option.value
                        ? option.color
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={formData.credit.hasDefaults === option.value}
                      onChange={() => updateFormData('credit', { hasDefaults: option.value })}
                      className="sr-only"
                    />
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Loans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Active Loans
                </label>
                <input
                  type="number"
                  value={formData.credit.activeLoansCount || ''}
                  onChange={(e) => updateFormData('credit', { activeLoansCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  placeholder="Enter number of active loans"
                  min="0"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Outstanding Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.credit.totalOutstandingAmount || ''}
                  onChange={(e) => updateFormData('credit', { totalOutstandingAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  placeholder="Enter total outstanding amount"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            {/* Credit Report Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Credit Report (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    📎
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <label className="relative cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            updateFormData('credit', { creditReportFile: e.target.files[0] });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF, JPG, PNG up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <Link
                  to="/loan-applications/new/property"
                  className="px-6 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  ← Back: Property & Assets
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
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg font-semibold shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${
                  isSubmitting
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700 hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </span>
                ) : (
                  '🚀 Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}