import React from 'react';
import { useLoan } from '../../context/LoanContext';
import { Link } from 'react-router-dom';
import { LoanNavigation } from '../../components/loan-applications/LoanNavigation';

export default function PropertyAssets() {
  const { formData, updateFormData, saveDraft, setCurrentStep } = useLoan();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('credit');
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Property & Assets</h1>
            <p className="text-gray-600 dark:text-gray-400">Provide information about your property and other assets.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Owns Property */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Do you own any property?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: true, label: 'Yes', icon: '🏠' },
                  { value: false, label: 'No', icon: '🏢' },
                ].map((option) => (
                  <label
                    key={option.value.toString()}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.property.ownsProperty === option.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={formData.property.ownsProperty === option.value}
                      onChange={() => updateFormData('property', { ownsProperty: option.value })}
                      className="sr-only"
                    />
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Details */}
            {formData.property.ownsProperty && (
              <div className="space-y-6 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Property Details</h3>
                
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Property Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'house', label: 'House', icon: '🏠' },
                      { value: 'flat', label: 'Flat/Apartment', icon: '🏢' },
                      { value: 'land', label: 'Land', icon: '🌳' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                          formData.property.propertyType === option.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          checked={formData.property.propertyType === option.value}
                          onChange={(e) => updateFormData('property', { propertyType: e.target.value as any })}
                          className="sr-only"
                        />
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Property Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Property Value (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.property.propertyValue || ''}
                    onChange={(e) => updateFormData('property', { propertyValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                    placeholder="Enter property value"
                    min="0"
                    step="10000"
                  />
                </div>

                {/* Existing Mortgages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Existing Mortgages (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.property.existingMortgages || ''}
                    onChange={(e) => updateFormData('property', { existingMortgages: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                    placeholder="Enter existing mortgage amount"
                    min="0"
                    step="10000"
                  />
                </div>
              </div>
            )}

            {/* Other Assets */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Other Assets</h3>
              
              {/* Vehicle */}
              <div className="mb-6">
                <label className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.property.otherAssets.vehicle}
                    onChange={(e) => updateFormData('property', { 
                      otherAssets: { ...formData.property.otherAssets, vehicle: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">I own a vehicle</span>
                </label>
                {formData.property.otherAssets.vehicle && (
                  <input
                    type="number"
                    value={formData.property.otherAssets.vehicleValue || ''}
                    onChange={(e) => updateFormData('property', { 
                      otherAssets: { ...formData.property.otherAssets, vehicleValue: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                    placeholder="Vehicle value (₹)"
                    min="0"
                    step="1000"
                  />
                )}
              </div>

              {/* Savings */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Savings (₹)
                </label>
                <input
                  type="number"
                  value={formData.property.otherAssets.savings || ''}
                  onChange={(e) => updateFormData('property', { 
                    otherAssets: { ...formData.property.otherAssets, savings: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  placeholder="Enter your savings amount"
                  min="0"
                  step="1000"
                />
              </div>

              {/* Investments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Investments (₹)
                </label>
                <input
                  type="number"
                  value={formData.property.otherAssets.investments || ''}
                  onChange={(e) => updateFormData('property', { 
                    otherAssets: { ...formData.property.otherAssets, investments: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  placeholder="Enter your investment value"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <Link
                  to="/loan-applications/new/loan-details"
                  className="px-6 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  ← Back: Loan Details
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
                Next: Credit Bureau Scores →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}