import CreditRiskForm from '../components/CreditRiskForm';

export default function CreditRiskPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Credit Risk Assessment</h1>
        <p className="text-gray-600 dark:text-gray-400">Analyze and predict credit risk for loan applications</p>
      </div>
      
      <CreditRiskForm />
    </div>
  );
}