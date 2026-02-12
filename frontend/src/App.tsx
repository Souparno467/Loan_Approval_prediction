import React from 'react';
import CreditRiskForm from './components/CreditRiskForm';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 text-gray-900 flex flex-col">
      <header className="border-b border-emerald-100 bg-emerald-50/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-emerald-900">
            LoanGuard
          </h1>
          <p className="text-xs md:text-sm text-emerald-800/80 mt-1">
            Credit risk assessment dashboard
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <h2 className="text-sm md:text-base font-semibold text-emerald-900">
              New application
            </h2>
            <p className="text-xs text-emerald-800/80 mt-1">
              Enter applicant details to estimate default probability using the production model.
            </p>
          </div>

          <CreditRiskForm />
        </div>
      </main>
    </div>
  );
}

export default App;
