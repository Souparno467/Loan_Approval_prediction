import { useState } from 'react';
import axios from 'axios';

export default function LoanApplicationForm() {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    term: '',
    purpose: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post('http://127.0.0.1:5000/apply', form);
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Cannot reach backend. Is Flask running on port 5000?'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-4 text-left">Apply for a Loan</h2>
      <div className="max-w-xl mx-auto bg-gradient-to-br from-pink-100/60 via-yellow-100/60 to-indigo-100/60 dark:from-indigo-900/40 dark:via-pink-900/40 dark:to-yellow-900/40 rounded-3xl shadow-2xl border-2 border-pink-200/40 dark:border-pink-800/40 p-8">
        {submitted ? (
          <div className="text-green-500 text-lg font-semibold text-center py-8">
            Application submitted! We will contact you soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-500 text-center py-2">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Loan Amount</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Term (months)</label>
              <input
                type="number"
                name="term"
                value={form.term}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Purpose</label>
              <select
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl"
                required
              >
                <option value="">Select purpose</option>
                <option value="Home">Home</option>
                <option value="Car">Car</option>
                <option value="Education">Education</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-pink-500 via-yellow-400 to-indigo-500 hover:from-pink-600 hover:to-yellow-500 hover:to-indigo-600 transition-all"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
