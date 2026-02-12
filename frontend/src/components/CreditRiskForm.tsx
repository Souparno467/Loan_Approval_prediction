import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface FormData {
  gender: string;
  age: number;
  family_status: string;
  children: number;
  income: number;
  income_type: string;
  education: string;
  employment_years: number;
  credit_amount: number;
  annuity: number;
  contract_type: string;
  goods_price: number;
  own_car: string;
  own_realty: string;
  housing_type: string;
  family_members: number;
  ext_source_1: number;
  ext_source_2: number;
  ext_source_3: number;
}

interface Result {
  probability: number;
  category: string;
  badge: string;
  badgeClass: string;
  recommendation: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const extractDefaultProbability = (data: any): number => {
  // 1) Explicit default_probability field
  if (typeof data?.default_probability === 'number') {
    return data.default_probability;
  }

  // 2) probability as scalar
  if (typeof data?.probability === 'number') {
    return data.probability;
  }

  // 3) probability as [p0, p1] or similar
  if (Array.isArray(data?.probability) && data.probability.length > 0) {
    // Prefer positive-class probability if available
    if (data.probability.length > 1 && typeof data.probability[1] === 'number') {
      return data.probability[1];
    }
    if (typeof data.probability[0] === 'number') {
      return data.probability[0];
    }
  }

  // 4) Some backends may put the score in "prediction"
  if (typeof data?.prediction === 'number') {
    return data.prediction;
  }

  // Fallback (should be rare)
  return 0.15;
};

export default function CreditRiskForm() {
  const [formData, setFormData] = useState<FormData>({
    gender: '',
    age: 18,
    family_status: '',
    children: 0,
    income: 0,
    income_type: '',
    education: '',
    employment_years: 0,
    credit_amount: 0,
    annuity: 0,
    contract_type: '',
    goods_price: 0,
    own_car: 'N',
    own_realty: 'N',
    housing_type: '',
    family_members: 1,
    ext_source_1: 0,
    ext_source_2: 0,
    ext_source_3: 0,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [featureCols, setFeatureCols] = useState<string[] | null>(null);
  const [featureMedians, setFeatureMedians] = useState<Record<string, any>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['age', 'children', 'income', 'employment_years', 'credit_amount', 'annuity', 'goods_price', 'family_members', 'ext_source_1', 'ext_source_2', 'ext_source_3'].includes(name) 
        ? Number(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.gender || !formData.family_status || !formData.income_type || !formData.education || !formData.contract_type) {
      alert('Please fill in all required fields marked with *');
      return;
    }
    if (formData.age < 18 || formData.age > 100) {
      alert('Age must be between 18 and 100');
      return;
    }

    setLoading(true);
    setShowResults(false);
    
    try {
      // Try backend API first - map form fields to backend-style names
      const apiPayload: Record<string, any> = {
        NAME_CONTRACT_TYPE: formData.contract_type === 'Cash' ? 'Cash loans' : 'Revolving loans',
        AMT_INCOME_TOTAL: formData.income,
        AMT_CREDIT: formData.credit_amount,
        AMT_ANNUITY: formData.annuity,
        AMT_GOODS_PRICE: formData.goods_price || formData.credit_amount,
        DAYS_BIRTH: -(formData.age * 365.25), // Convert age to negative days
        DAYS_EMPLOYED: -(formData.employment_years * 365.25),
        REGION_RATING_CLIENT: formData.ext_source_1 > 0 ? Math.round(formData.ext_source_1 * 3) : 2,
      };
      let probabilityFromModel: number | null = null;

      // If server provides feature order, build full numeric features array
      if (featureCols && Object.keys(featureMedians).length > 0) {
        const fullPayload: Record<string, any> = {};

        for (const col of featureCols) {
          let value: any;

          // 1) Exact backend-style name (already numeric)
          if (Object.prototype.hasOwnProperty.call(apiPayload, col)) {
            value = apiPayload[col];
          }
          // 2) Exact match to formData key
          else if (Object.prototype.hasOwnProperty.call(formData as any, col)) {
            value = (formData as any)[col];
          }
          // 3) Case-insensitive match (e.g. EXT_SOURCE_1 vs ext_source_1)
          else {
            const lowerCol = col.toLowerCase();
            const matchingKey = Object.keys(formData as any).find(
              (k) => k.toLowerCase() === lowerCol
            );
            if (matchingKey && (formData as any)[matchingKey] !== undefined) {
              value = (formData as any)[matchingKey];
            } else {
              // 4) Fallback to model median if we have no mapped user input
              value = featureMedians[col];
            }
          }

          fullPayload[col] = value;
        }

        const features = featureCols.map((c) => {
          const raw = fullPayload[c];
          if (typeof raw === 'string') {
            const median = featureMedians[c];
            if (typeof median === 'number') return median;
            return 0;
          }
          return raw;
        });

        const response = await axios.post(`${API_BASE_URL}/predict`, { features });
        probabilityFromModel = extractDefaultProbability(response.data);
      } else {
        const response = await axios.post(`${API_BASE_URL}/predict`, apiPayload);
        probabilityFromModel = extractDefaultProbability(response.data);
      }

      // Use model probability (if available) to drive UI
      const finalProb = probabilityFromModel ?? calculateRiskProbability(formData);
      displayResults(finalProb);
      setShowResults(true);
    } catch (err: any) {
      // Fallback to local calculation when backend is unavailable
      alert(
        err.response?.data?.error ||
        err.message ||
        'Cannot reach backend. Is Flask running on port 5000?'
      );
      const probability = calculateRiskProbability(formData);
      displayResults(probability);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    axios.get(`${API_BASE_URL}/api/features`)
      .then(res => {
        if (!mounted) return;
        setFeatureCols(res.data.feature_columns || null);
        setFeatureMedians(res.data.feature_medians || {});
      })
      .catch(() => {});
    return () => { mounted = false };
  }, []);

  const calculateRiskProbability = (data: FormData): number => {
    // Simple risk calculation based on form inputs
    let baseRisk = 0.15;
    
    // Age factor (younger = higher risk)
    if (data.age > 0 && data.age < 25) baseRisk += 0.1;
    else if (data.age > 60) baseRisk += 0.05;
    
    // Income vs credit amount ratio (guard against division by zero)
    if (data.credit_amount > 0 && data.income > 0) {
      const incomeToCreditRatio = data.income / data.credit_amount;
      if (!Number.isFinite(incomeToCreditRatio)) baseRisk += 0.1;
      else if (incomeToCreditRatio < 2) baseRisk += 0.15;
      else if (incomeToCreditRatio > 5) baseRisk -= 0.05;
    } else if (data.credit_amount > 0 && data.income === 0) {
      baseRisk += 0.15; // No income is high risk
    }
    
    // Employment history
    if (data.employment_years >= 0 && data.employment_years < 1) baseRisk += 0.1;
    else if (data.employment_years > 5) baseRisk -= 0.05;
    
    // Family status
    if (data.family_status === 'Married') baseRisk -= 0.05;
    else if (data.family_status === 'Separated') baseRisk += 0.05;
    
    // Assets
    if (data.own_realty === 'Y') baseRisk -= 0.05;
    if (data.own_car === 'Y') baseRisk -= 0.02;
    
    // External scores (handle optional fields - 0 means not provided)
    const extScores = [data.ext_source_1, data.ext_source_2, data.ext_source_3].filter(s => s > 0);
    if (extScores.length > 0) {
      const avgScore = extScores.reduce((a, b) => a + b, 0) / extScores.length;
      if (avgScore < 0.3) baseRisk += 0.15;
      else if (avgScore > 0.8) baseRisk -= 0.05;
    }
    
    // Ensure probability is between 0.05 and 0.95
    const probability = Math.max(0.05, Math.min(0.95, baseRisk));
    return Number.isFinite(probability) ? probability : 0.15;
  };

  const displayResults = (probability: number) => {
    let category, badge, badgeClass, recommendation;
    
    if (probability < 0.1) {
      category = 'Very Low Risk';
      badge = 'LOW RISK';
      badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      recommendation = '✅ Approved';
    } else if (probability < 0.25) {
      category = 'Low Risk';
      badge = 'LOW RISK';
      badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      recommendation = '✅ Approved';
    } else if (probability < 0.5) {
      category = 'Medium Risk';
      badge = 'MEDIUM RISK';
      badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      recommendation = '⚠️ Not auto-approved (manual review required)';
    } else {
      category = 'High Risk';
      badge = 'HIGH RISK';
      badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      recommendation = '❌ Not approved';
    }
    
    setResult({
      probability,
      category,
      badge,
      badgeClass,
      recommendation
    });
  };

  const fillSampleData = () => {
    setFormData({
      gender: 'F',
      age: 35,
      family_status: 'Married',
      children: 2,
      income: 45000,
      income_type: 'Working',
      education: 'Higher',
      employment_years: 5,
      credit_amount: 30000,
      annuity: 1800,
      contract_type: 'Cash',
      goods_price: 28000,
      own_car: 'Y',
      own_realty: 'Y',
      housing_type: 'House',
      family_members: 4,
      ext_source_1: 0.65,
      ext_source_2: 0.72,
      ext_source_3: 0.58,
    });
  };

  const resetForm = () => {
    setFormData({
      gender: '',
      age: 18,
      family_status: '',
      children: 0,
      income: 0,
      income_type: '',
      education: '',
      employment_years: 0,
      credit_amount: 0,
      annuity: 0,
      contract_type: '',
      goods_price: 0,
      own_car: 'N',
      own_realty: 'N',
      housing_type: '',
      family_members: 1,
      ext_source_1: 0,
      ext_source_2: 0,
      ext_source_3: 0,
    });
    setShowResults(false);
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8 shadow-sm"
      >
        {/* Personal Information */}
        <div className="pb-4 border-b border-emerald-100 dark:border-emerald-900/40 rounded-lg bg-emerald-50/70 dark:bg-emerald-900/20 backdrop-blur-sm shadow-sm px-4 md:px-5 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                Personal information
              </h3>
              <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Basic demographics used for underwriting.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Age (years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="18"
                max="100"
                placeholder="35"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Family status <span className="text-red-500">*</span>
              </label>
              <select
                name="family_status"
                value={formData.family_status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select status</option>
                <option value="Married">Married</option>
                <option value="Single">Single / not married</option>
                <option value="Civil">Civil marriage</option>
                <option value="Separated">Separated</option>
                <option value="Widow">Widow</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Number of children
              </label>
              <input
                type="number"
                name="children"
                value={formData.children}
                onChange={handleChange}
                min="0"
                max="20"
                placeholder="2"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="pb-4 border-b border-sky-100 dark:border-sky-900/40 rounded-lg bg-sky-50/70 dark:bg-sky-900/20 backdrop-blur-sm shadow-sm px-4 md:px-5 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-sky-900 dark:text-sky-200">
                Financials
              </h3>
              <p className="mt-1 text-xs text-sky-800/80 dark:text-sky-300/80">
                Income, employment history and education.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Annual income (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="income"
                value={formData.income}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="50000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                required
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Total annual income in ₹.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Income type <span className="text-red-500">*</span>
              </label>
              <select
                name="income_type"
                value={formData.income_type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select income type</option>
                <option value="Working">Working</option>
                <option value="Commercial">Commercial associate</option>
                <option value="Pensioner">Pensioner</option>
                <option value="State">State servant</option>
                <option value="Student">Student</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Education level <span className="text-red-500">*</span>
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select education</option>
                <option value="Higher">Higher education</option>
                <option value="Secondary">Secondary / secondary special</option>
                <option value="Incomplete">Incomplete higher</option>
                <option value="Lower">Lower secondary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Employment years
              </label>
              <input
                type="number"
                name="employment_years"
                value={formData.employment_years}
                onChange={handleChange}
                min="0"
                max="50"
                step="0.5"
                placeholder="5.5"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Years at current employer.
              </p>
            </div>
          </div>
        </div>

        {/* Loan Information */}
        <div className="pb-4 border-b border-emerald-100 dark:border-emerald-900/40 rounded-lg bg-emerald-50/70 dark:bg-emerald-900/20 backdrop-blur-sm shadow-sm px-4 md:px-5 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                Loan details
              </h3>
              <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Requested amount and repayment structure.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Loan amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="credit_amount"
                value={formData.credit_amount}
                onChange={handleChange}
                min="1000"
                step="1000"
                placeholder="25000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Loan annuity (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="annuity"
                value={formData.annuity}
                onChange={handleChange}
                min="100"
                step="100"
                placeholder="1500"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Contract type <span className="text-red-500">*</span>
              </label>
              <select
                name="contract_type"
                value={formData.contract_type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select type</option>
                <option value="Cash">Cash loans</option>
                <option value="Revolving">Revolving loans</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Goods price (₹)
              </label>
              <input
                type="number"
                name="goods_price"
                value={formData.goods_price}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="20000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Price of the underlying asset, if applicable.
              </p>
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="pb-4 border-b border-sky-100 dark:border-sky-900/40 rounded-lg bg-sky-50/70 dark:bg-sky-900/20 backdrop-blur-sm shadow-sm px-4 md:px-5 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-sky-900 dark:text-sky-200">
                Assets & housing
              </h3>
              <p className="mt-1 text-xs text-sky-800/80 dark:text-sky-300/80">
                Collateral and living situation.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Own car
              </label>
              <select
                name="own_car"
                value={formData.own_car}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Own property
              </label>
              <select
                name="own_realty"
                value={formData.own_realty}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Housing type
              </label>
              <select
                name="housing_type"
                value={formData.housing_type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select type</option>
                <option value="House">House / apartment</option>
                <option value="Parents">With parents</option>
                <option value="Municipal">Municipal apartment</option>
                <option value="Rented">Rented apartment</option>
                <option value="Office">Office apartment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Family members
              </label>
              <input
                type="number"
                name="family_members"
                value={formData.family_members}
                onChange={handleChange}
                min="1"
                max="20"
                placeholder="4"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* External Scores */}
        <div className="pb-4 border-b border-emerald-100 dark:border-emerald-900/40 rounded-lg bg-emerald-50/70 dark:bg-emerald-900/20 backdrop-blur-sm shadow-sm px-4 md:px-5 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                External credit scores
              </h3>
              <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Optional bureau scores on a 0–1 scale.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                External source 1
              </label>
              <input
                type="number"
                name="ext_source_1"
                value={formData.ext_source_1}
                onChange={handleChange}
                min="0"
                max="1"
                step="0.01"
                placeholder="0.65"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Range: 0.0 – 1.0
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                External source 2
              </label>
              <input
                type="number"
                name="ext_source_2"
                value={formData.ext_source_2}
                onChange={handleChange}
                min="0"
                max="1"
                step="0.01"
                placeholder="0.72"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Range: 0.0 – 1.0
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                External source 3
              </label>
              <input
                type="number"
                name="ext_source_3"
                value={formData.ext_source_3}
                onChange={handleChange}
                min="0"
                max="1"
                step="0.01"
                placeholder="0.58"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Range: 0.0 – 1.0
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Predict risk
              </span>
            )}
          </button>
          
          <button
            type="button"
            onClick={fillSampleData}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-2">
              Load example
            </span>
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-100 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-2">
              Reset form
            </span>
          </button>
        </div>
      </form>

      {/* Results */}
      {showResults && result && (
        <div className="mt-6 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Risk assessment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Default probability
              </div>
              <div className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                {(result.probability * 100).toFixed(2)}%
              </div>
              <div className={`mt-3 px-3 py-1.5 rounded-full text-center text-xs font-medium ${result.badgeClass}`}>
                {result.badge}
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Risk category
              </div>
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                {result.category}
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Recommendation
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {result.recommendation}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}