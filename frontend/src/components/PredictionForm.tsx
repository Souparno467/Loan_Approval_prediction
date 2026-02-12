import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';

interface PredictionResponse {
  default_probability: number;
  will_default: boolean;
  message?: string;
}

export default function PredictionForm() {
  const [formData, setFormData] = useState({
    NAME_CONTRACT_TYPE: 'Cash loans',
    AMT_INCOME_TOTAL: 180000,
    AMT_CREDIT: 450000,
    AMT_ANNUITY: 22500,
    AMT_GOODS_PRICE: 400000,
    DAYS_BIRTH: -14000,          // ≈ 38 years old
    DAYS_EMPLOYED: -3000,
    REGION_RATING_CLIENT: 2,
  });

  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureCols, setFeatureCols] = useState<string[] | null>(null);
  const [featureMedians, setFeatureMedians] = useState<Record<string, any>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: [
        'AMT_INCOME_TOTAL',
        'AMT_CREDIT',
        'AMT_ANNUITY',
        'AMT_GOODS_PRICE',
        'DAYS_BIRTH',
        'DAYS_EMPLOYED',
        'REGION_RATING_CLIENT',
      ].includes(name)
        ? Number(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // If we have feature metadata, build a full features array in the expected order
      if (featureCols && Object.keys(featureMedians).length > 0) {
        const features = featureCols.map((col) => {
          const raw =
            Object.prototype.hasOwnProperty.call(formData, col)
              ? (formData as any)[col]
              : featureMedians[col];

          // Ensure we only send numeric values to the backend model
          if (typeof raw === 'string') {
            const median = featureMedians[col];
            if (typeof median === 'number') return median;
            return 0;
          }

          return raw;
        });
        const response = await axios.post('http://127.0.0.1:5000/predict', { features });
        setResult(response.data);
      } else {
        const response = await axios.post('http://127.0.0.1:5000/predict', formData);
        setResult(response.data);
      }
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

  useEffect(() => {
    let mounted = true;
    axios.get('http://127.0.0.1:5000/api/features')
      .then(res => {
        if (!mounted) return;
        setFeatureCols(res.data.feature_columns || null);
        setFeatureMedians(res.data.feature_medians || {});
      })
      .catch(() => {
        // ignore — server may not expose feature metadata
      });
    return () => { mounted = false };
  }, []);

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-pink-100/60 via-yellow-100/60 to-indigo-100/60 dark:from-indigo-900/40 dark:via-pink-900/40 dark:to-yellow-900/40 border-2 border-pink-200/40 dark:border-pink-800/40 rounded-3xl shadow-2xl p-8 md:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contract Type
            </label>
            <select
              name="NAME_CONTRACT_TYPE"
              value={formData.NAME_CONTRACT_TYPE}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl"
            >
              <option value="Cash loans">Cash loans</option>
              <option value="Revolving loans">Revolving loans</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Monthly Income
            </label>
            <input
              type="number"
              name="AMT_INCOME_TOTAL"
              value={formData.AMT_INCOME_TOTAL}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl"
              required
            />
          </div>

          {/* Add more inputs here as needed */}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 via-yellow-400 to-indigo-500 hover:from-pink-600 hover:to-yellow-500 hover:to-indigo-600'
          }`}
        >
          {loading ? 'Predicting...' : 'Get Prediction'}
        </button>
      </form>

      {error && <div className="mt-6 p-4 bg-gradient-to-r from-red-400/80 to-pink-500/80 text-white rounded-xl shadow">{error}</div>}

      {result && (
        <div className="mt-8 p-6 bg-gradient-to-br from-pink-200/80 via-yellow-100/80 to-indigo-100/80 dark:from-pink-900/60 dark:via-yellow-900/60 dark:to-indigo-900/60 rounded-3xl text-center shadow-xl">
          <div className="text-5xl font-extrabold drop-shadow-lg">
            {(result.default_probability * 100).toFixed(1)}%
          </div>
          <div className={`text-2xl mt-2 font-bold ${result.will_default ? 'text-red-500' : 'text-green-500'}`}>
            {result.will_default ? 'High Risk' : 'Low Risk'}
          </div>
        </div>
      )}
    </div>
  );
}