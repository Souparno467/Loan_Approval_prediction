export interface LoanApplication {
  id?: string;
  createdAt?: Date;
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';
  referenceNumber?: string;
  
  // Financial Information
  monthlyIncome: number;
  otherIncomeSources: string;
  monthlyExpenses: number;
  employmentType: 'salaried' | 'self-employed' | 'business-owner' | 'student' | 'unemployed';
  employerName: string;
  yearsInCurrentJob: number;
  
  // Loan Details
  loanAmount: number;
  loanPurpose: 'home-purchase' | 'education' | 'business' | 'personal' | 'car' | 'debt-consolidation' | 'other';
  loanTerm: number;
  interestRateType: 'fixed' | 'floating';
  
  // Property & Assets
  ownsProperty: boolean;
  propertyType: 'house' | 'flat' | 'land' | 'none';
  propertyValue: number;
  existingMortgages: number;
  otherAssets: {
    vehicle: boolean;
    vehicleValue: number;
    savings: number;
    investments: number;
  };
  
  // Credit Bureau Scores
  cibilScore: number;
  experianScore: number;
  equifaxScore: number;
  hasDefaults: boolean;
  activeLoansCount: number;
  totalOutstandingAmount: number;
  creditReportFile?: File;
}

export type LoanStep = 'financial' | 'loan-details' | 'property' | 'credit';

// Map step names to their corresponding form data keys
export const stepToFormDataKey: Record<LoanStep, keyof LoanFormData> = {
  financial: 'financial',
  'loan-details': 'loanDetails',
  property: 'property',
  credit: 'credit',
};

export interface LoanFormData {
  financial: Pick<LoanApplication, 
    'monthlyIncome' | 'otherIncomeSources' | 'monthlyExpenses' | 
    'employmentType' | 'employerName' | 'yearsInCurrentJob'
  >;
  loanDetails: Pick<LoanApplication,
    'loanAmount' | 'loanPurpose' | 'loanTerm' | 'interestRateType'
  >;
  property: Pick<LoanApplication,
    'ownsProperty' | 'propertyType' | 'propertyValue' | 'existingMortgages' |
    'otherAssets'
  >;
  credit: Pick<LoanApplication,
    'cibilScore' | 'experianScore' | 'equifaxScore' | 'hasDefaults' |
    'activeLoansCount' | 'totalOutstandingAmount' | 'creditReportFile'
  >;
}

export interface LoanContextType {
  formData: LoanFormData;
  updateFormData: (step: LoanStep, data: Partial<LoanFormData[keyof LoanFormData]>) => void;
  resetFormData: () => void;
  saveDraft: () => void;
  submitApplication: () => Promise<{ success: boolean; referenceNumber?: string; error?: string }>;
  currentStep: LoanStep;
  setCurrentStep: (step: LoanStep) => void;
  isSubmitting: boolean;
}