import React, { useState } from 'react';
import { useLoan } from '../../context/LoanContext';
import { Link } from 'react-router-dom';
import { LoanNavigation } from '../../components/loan-applications/LoanNavigation';

export default function FinancialInformation() {
  const { formData, updateFormData, saveDraft, setCurrentStep } = useLoan();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.financial.monthlyIncome || formData.financial.monthlyIncome <= 0) {
      newErrors.monthlyIncome = 'Monthly income is required and must be greater than 0';
    }
    
    if (!formData.financial.monthlyExpenses || formData.financial.monthlyExpenses < 0) {
      newErrors.monthlyExpenses = 'Monthly expenses must be 0 or greater';
    }
    
    if (!formData.financial.employerName && formData.financial.employmentType !== 'unemployed') {
      newErrors.employerName = 'Employer name is required for employed individuals';
    }
    
    if (!formData.financial.yearsInCurrentJob || formData.financial.yearsInCurrentJob < 0) {
      newErrors.yearsInCurrentJob = 'Years in current job must be 0 or greater';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setCurrentStep('loan-details');
  };

  const handleSaveDraft = () => {
    saveDraft();
    // Show success message or toast
    alert('Draft saved successfully!');
  };

  return (
    <div className="animate-fade-in">
      <LoanNavigation />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Financial Information</h1>
            <p className="text-gray-600 dark:text-gray-400">Please provide your financial details to help us assess your loan eligibility.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Monthly Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Income (₹)
              </label>
              <input
                type="number"
                value={formData.financial.monthlyIncome || ''}
                onChange={(e) => updateFormData('financial', { monthlyIncome: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.monthlyIncome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                placeholder="Enter your monthly income"
                min="0"
                step="1000"
              />
              {errors.monthlyIncome && (
                <p className="mt-2 text-sm text-red-600">{errors.monthlyIncome}</p>
              )}
            </div>

            {/* Other Income Sources */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Other Income Sources
              </label>
              <input
                type="text"
                value={formData.financial.otherIncomeSources}
                onChange={(e) => updateFormData('financial', { otherIncomeSources: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                placeholder="e.g., Rental income, Investments, etc."
              />
            </div>

            {/* Monthly Expenses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Expenses (₹)
              </label>
              <input
                type="number"
                value={formData.financial.monthlyExpenses || ''}
                onChange={(e) => updateFormData('financial', { monthlyExpenses: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.monthlyExpenses ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                placeholder="Enter your monthly expenses"
                min="0"
                step="1000"
              />
              {errors.monthlyExpenses && (
                <p className="mt-2 text-sm text-red-600">{errors.monthlyExpenses}</p>
              )}
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Employment Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { value: 'salaried', label: 'Salaried Employee', icon: '💼' },
                  { value: 'self-employed', label: 'Self Employed', icon: '👔' },
                  { value: 'business-owner', label: 'Business Owner', icon: '🏢' },
                  { value: 'student', label: 'Student', icon: '🎓' },
                  { value: 'unemployed', label: 'Unemployed', icon: '🏠' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.financial.employmentType === option.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={formData.financial.employmentType === option.value}
                      onChange={(e) => updateFormData('financial', { employmentType: e.target.value as any })}
                      className="sr-only"
                    />
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Employer Name */}
            {formData.financial.employmentType !== 'unemployed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employer Name
                </label>
                <input
                  type="text"
                  value={formData.financial.employerName}
                  onChange={(e) => updateFormData('financial', { employerName: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.employerName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                  placeholder="Enter your employer's name"
                />
                {errors.employerName && (
                  <p className="mt-2 text-sm text-red-600">{errors.employerName}</p>
                )}
              </div>
            )}

            {/* Years in Current Job */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Years in Current Job
              </label>
              <input
                type="number"
                value={formData.financial.yearsInCurrentJob || ''}
                onChange={(e) => updateFormData('financial', { yearsInCurrentJob: parseInt(e.target.value) || 0 })}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.yearsInCurrentJob ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                placeholder="Enter years in current job"
                min="0"
                max="50"
              />
              {errors.yearsInCurrentJob && (
                <p className="mt-2 text-sm text-red-600">{errors.yearsInCurrentJob}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <Link
                  to="/loan-applications"
                  className="px-6 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  ← Back to Applications
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
                Next: Loan Details →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}