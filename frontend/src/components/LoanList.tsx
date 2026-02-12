import { useState, useEffect } from 'react';
import axios from 'axios';


interface Loan {
  [key: string]: any;
}



export default function LoanList() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get('http://127.0.0.1:5000/loans')
      .then(res => setLoans(res.data.loans || []))
      .catch((err) => setError(
        err.response?.data?.error ||
        err.message ||
        'Cannot reach backend. Is Flask running on port 5000?'
      ))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-extrabold mb-6 text-left bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
        Loan List
      </h2>
      {loading && <div className="text-center py-8">Loading loans...</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-3xl shadow-2xl bg-gradient-to-br from-indigo-100/60 via-pink-100/60 to-yellow-100/60 dark:from-indigo-900/40 dark:via-pink-900/40 dark:to-yellow-900/40 p-2">
          <table className="min-w-full text-left rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-400 via-pink-400 to-yellow-300 text-white">
                {loans[0] && Object.keys(loans[0]).map((col) => (
                  <th key={col} className="py-3 px-4 font-bold uppercase tracking-wider drop-shadow-sm">{col}</th>
                ))}
                <th className="py-3 px-4 font-bold uppercase tracking-wider drop-shadow-sm">Details</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, idx) => (
                <tr
                  key={idx}
                  className={
                    `transition hover:scale-[1.01] hover:shadow-xl ` +
                    (idx % 2 === 0
                      ? 'bg-gradient-to-r from-indigo-50 via-pink-50 to-yellow-50 dark:from-indigo-950/40 dark:via-pink-950/40 dark:to-yellow-950/40'
                      : 'bg-white/60 dark:bg-gray-900/30')
                  }
                >
                  {loans[0] && Object.keys(loans[0]).map((col) => (
                    <td key={col} className="py-2 px-4 font-medium text-gray-700 dark:text-gray-200">
                      {loan[col]}
                    </td>
                  ))}
                  <td className="py-2 px-4">
                    <button
                      onClick={() => setSelected(loan)}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-semibold shadow hover:from-pink-600 hover:to-yellow-500 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="mt-6 p-8 bg-gradient-to-br from-pink-200/80 via-yellow-100/80 to-indigo-100/80 dark:from-pink-900/60 dark:via-yellow-900/60 dark:to-indigo-900/60 rounded-3xl shadow-2xl border-2 border-pink-300/40 dark:border-pink-800/40">
          <h3 className="text-2xl font-extrabold mb-4 bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">Loan Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(selected).map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-white/60 dark:bg-gray-900/40 shadow text-gray-800 dark:text-gray-100">
                <b className="text-pink-600 dark:text-pink-300">{k}:</b> {String(v)}
              </div>
            ))}
          </div>
          <button className="mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-bold rounded-xl shadow-lg hover:from-pink-600 hover:to-yellow-500 transition" onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}
    </section>
  );
}
