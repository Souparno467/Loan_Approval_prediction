import React from 'react';
import { useLoan } from '../../context/LoanContext';
import { Link, useLocation } from 'react-router-dom';

const steps = [
  { id: 'financial', label: 'Financial Information', path: '/loan-applications/new/financial' },
  { id: 'loan-details', label: 'Loan Details', path: '/loan-applications/new/loan-details' },
  { id: 'property', label: 'Property & Assets', path: '/loan-applications/new/property' },
  { id: 'credit', label: 'Credit Bureau Scores', path: '/loan-applications/new/credit' },
];

export const LoanNavigation: React.FC = () => {
  const { currentStep } = useLoan();
  const location = useLocation();

  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loan Application Progress</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isActive = location.pathname === step.path;
          
          return (
            <React.Fragment key={step.id}>
              <Link
                to={step.path}
                className={`flex items-center space-x-3 group ${
                  status === 'pending' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                }`}
                onClick={(e) => {
                  if (status === 'pending') {
                    e.preventDefault();
                  }
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    status === 'completed'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                      : status === 'current'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                  }`}
                >
                  {status === 'completed' ? '✓' : index + 1}
                </div>
                <div className="text-left">
                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`text-xs transition-colors duration-300 ${
                      status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {status === 'completed' ? 'Completed' : status === 'current' ? 'Current' : 'Pending'}
                  </div>
                </div>
              </Link>
              
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                    status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};