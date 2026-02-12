import LoanList from '../components/LoanList';

export default function LoanListPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Loan List</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all your loan applications and track their status</p>
      </div>
      
      <LoanList />
    </div>
  );
}