import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LoanFormData, LoanContextType, LoanStep } from '../types/loan';
import { stepToFormDataKey } from '../types/loan';

const defaultFormData: LoanFormData = {
  financial: {
    monthlyIncome: 0,
    otherIncomeSources: '',
    monthlyExpenses: 0,
    employmentType: 'salaried',
    employerName: '',
    yearsInCurrentJob: 0,
  },
  loanDetails: {
    loanAmount: 0,
    loanPurpose: 'personal',
    loanTerm: 12,
    interestRateType: 'fixed',
  },
  property: {
    ownsProperty: false,
    propertyType: 'none',
    propertyValue: 0,
    existingMortgages: 0,
    otherAssets: {
      vehicle: false,
      vehicleValue: 0,
      savings: 0,
      investments: 0,
    },
  },
  credit: {
    cibilScore: 0,
    experianScore: 0,
    equifaxScore: 0,
    hasDefaults: false,
    activeLoansCount: 0,
    totalOutstandingAmount: 0,
    creditReportFile: undefined,
  },
};

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const useLoan = () => {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error('useLoan must be used within a LoanProvider');
  }
  return context;
};

export const LoanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<LoanFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState<LoanStep>('financial');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('loanFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (error) {
        console.error('Error parsing saved loan data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem('loanFormData', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = useCallback((step: LoanStep, data: Partial<LoanFormData[keyof LoanFormData]>) => {
    const formKey = stepToFormDataKey[step];
    setFormData(prev => ({
      ...prev,
      [formKey]: { ...prev[formKey], ...data }
    }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(defaultFormData);
    localStorage.removeItem('loanFormData');
  }, []);

  const saveDraft = useCallback(() => {
    // Data is automatically saved via useEffect
    console.log('Draft saved');
  }, []);

  const submitApplication = useCallback(async (): Promise<{ success: boolean; referenceNumber?: string; error?: string }> => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const referenceNumber = `LG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Save final application
      const finalApplication = {
        ...formData,
        status: 'submitted' as const,
        referenceNumber,
        createdAt: new Date(),
      };
      
      localStorage.setItem('loanFormData', JSON.stringify(defaultFormData));
      localStorage.setItem('loanApplication', JSON.stringify(finalApplication));
      
      return { success: true, referenceNumber };
    } catch (error) {
      return { success: false, error: 'Failed to submit application' };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const value: LoanContextType = {
    formData,
    updateFormData,
    resetFormData,
    saveDraft,
    submitApplication,
    currentStep,
    setCurrentStep,
    isSubmitting,
  };

  return (
    <LoanContext.Provider value={value}>
      {children}
    </LoanContext.Provider>
  );
};