import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sprout, MapPin, Scale, Award, Search, AlertCircle, Info, 
  ArrowUpDown, Sparkles, TrendingUp, Calendar, CheckCircle2, 
  ShieldCheck, ArrowRight, UserCheck, Package, ShoppingBag, Eye, RefreshCw, Clock, IndianRupee, Plus, CloudRain, XCircle
} from 'lucide-react';
import { 
  getCrops, getMarkets, getMarketPrices, getTrends, 
  getAdvisorRecommendation, getMyProduceLots, getFarmerTransactions, getBuyersApi, createProduceLot 
} from '../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import TransactionDetailModal from '../components/TransactionDetailModal';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const effectiveUserId = user?.id;
  const navigate = useNavigate();

  // Reference Data State
  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [buyersList, setBuyersList] = useState([]);

  // Form State
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [quantityKg, setQuantityKg] = useState('500');
  const [qualityGrade, setQualityGrade] = useState('Grade A');

  // AI & Analytics State
  const [pricesData, setPricesData] = useState([]);
  const [advisorData, setAdvisorData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [myLots, setMyLots] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);

  // UI States
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Lot Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lotQuantityKg, setLotQuantityKg] = useState('500');
  const [lotQualityGrade, setLotQualityGrade] = useState('Grade A');
  const [lotExpectedPrice, setLotExpectedPrice] = useState('');
  const [lotMarketId, setLotMarketId] = useState('');
  const [submittingLot, setSubmittingLot] = useState(false);
  const [lotFormError, setLotFormError] = useState('');
  const [lotFormSuccess, setLotFormSuccess] = useState('');

  // Time greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting_morning');
    if (hour < 17) return t('dashboard.greeting_afternoon');
    return t('dashboard.greeting_evening');
  };

  // Initial Data Load
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        setLoadingCrops(true);
        const [cropsList, marketsList, buyersData, lotsData, txnsData] = await Promise.all([
          getCrops(),
          getMarkets(),
          getBuyersApi().catch(() => []),
          getMyProduceLots(effectiveUserId).catch(() => []),
          getFarmerTransactions(effectiveUserId).catch(() => [])
        ]);

        if (isMounted) {
          setCrops(cropsList);
          setMarkets(marketsList);
          setBuyersList(buyersData);
          setMyLots(lotsData);
          setMyTransactions(txnsData);

          if (cropsList.length > 0) {
            const defaultCropId = cropsList[0].id.toString();
            setSelectedCropId(defaultCropId);
            runMarketAnalysis(defaultCropId, 'All', '500', 'Grade A');
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage('We couldn\'t load market options. Please ensure backend server is running.');
        }
      } finally {
        if (isMounted) setLoadingCrops(false);
      }
    }
    loadInitialData();
    return () => { isMounted = false; };
  }, [effectiveUserId]);

  const runMarketAnalysis = async (cropId, locationFilter, qty, quality) => {
    if (!cropId) return;
    setLoadingAnalysis(true);
    setErrorMessage('');

    try {
      let state = '';
      let district = '';
      if (locationFilter && locationFilter !== 'All') {
        const selectedM = markets.find(m => m.name === locationFilter);
        if (selectedM) {
          district = selectedM.district;
          state = selectedM.state;
        }
      }

      // Fetch market prices & AI Advisor recommendation in parallel
      const [pricesRes, advisorRes] = await Promise.all([
        getMarketPrices({ cropId: parseInt(cropId), state, district }),
        getAdvisorRecommendation({ cropId: parseInt(cropId), quantityKg: parseFloat(qty) || 500, qualityGrade: quality })
      ]);

      setPricesData(pricesRes);
      setAdvisorData(advisorRes);

      // Load 25-day price trend chart for recommended market or first available market
      const targetMarket = markets.find(m => m.name === advisorRes.recommended_market) || markets[0];
      if (targetMarket) {
        const trendsRes = await getTrends({ cropId: parseInt(cropId), marketId: targetMarket.id, days: 25 }).catch(() => []);
        setChartData(trendsRes);
      }

    } catch (err) {
      console.error(err);
      setErrorMessage('We couldn\'t load AI analysis data. Please try again.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    runMarketAnalysis(selectedCropId, selectedLocation, quantityKg, qualityGrade);
  };

  const scrollToBuyers = () => {
    const el = document.getElementById('buyers-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenCreateModal = (buyer = null) => {
    setIsModalOpen(true);
    setLotFormError('');
    setLotFormSuccess('');
    setLotQuantityKg(quantityKg || '500');
    setLotQualityGrade(qualityGrade || 'Grade A');
    setLotExpectedPrice(advisorData?.expected_price?.toString() || '');
    const recMarket = markets.find(m => m.name === advisorData?.recommended_market);
    setLotMarketId(recMarket ? recMarket.id.toString() : (markets[0]?.id.toString() || ''));
  };

  const handleCreateLotSubmit = async (e) => {
    e.preventDefault();
    setLotFormError('');
    setLotFormSuccess('');

    if (!selectedCropId) {
      setLotFormError('Please select a crop first.');
      return;
    }
    const qty = parseFloat(lotQuantityKg);
    if (isNaN(qty) || qty <= 0) {
      setLotFormError('Quantity must be greater than 0.');
      return;
    }
    const price = parseFloat(lotExpectedPrice);
    if (isNaN(price) || price <= 0) {
      setLotFormError('Expected price must be greater than 0.');
      return;
    }
    if (!lotMarketId) {
      setLotFormError('Please select a market.');
      return;
    }

    setSubmittingLot(true);
    try {
      await createProduceLot({
        crop_id: parseInt(selectedCropId),
        market_id: parseInt(lotMarketId),
        quantity_quintals: qty / 100,
        quality_grade: lotQualityGrade,
        expected_price_per_quintal: price,
        status: 'Available'
      });
      setLotFormSuccess(t('dashboard.success'));
      const lotsData = await getMyProduceLots(effectiveUserId).catch(() => []);
      setMyLots(lotsData);
      setTimeout(() => {
        setIsModalOpen(false);
        setLotFormSuccess('');
      }, 1200);
    } catch (err) {
      setLotFormError(err.message || 'Failed to create lot.');
    } finally {
      setSubmittingLot(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Header Greetings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-agrigreen-900 bg-agrigreen-500/20 px-2.5 py-1 rounded border border-emerald-300">
              {t('dashboard.farmer_hub')}
            </span>
            <span className="text-xs font-medium text-text-secondary bg-surface-subtle px-2.5 py-1 rounded border border-border-subtle">
              {t('dashboard.ai_intelligence')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mt-2">
            {getGreeting()}, {user?.name || t('auth.farmer')}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-agrigreen-700 hover:bg-agrigreen-900 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('dashboard.create_produce_lot')}</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION 1 — Find Your Best Market Input Card */}
      <div className="bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-sm">
        <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-agrigreen-700" />
          <span>{t('dashboard.find_best_market')}</span>
        </h2>

        {loadingCrops ? (
          <div className="py-6 text-center text-text-secondary font-medium">{t('dashboard.loading_crops')}</div>
        ) : (
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            
            {/* Crop Select */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
                {t('dashboard.crop')}
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              >
                {crops.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
                {t('dashboard.quantity')}
              </label>
              <input
                type="number"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                placeholder="500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
                {t('dashboard.location')}
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              >
                <option value="All">{t('dashboard.all_locations')}</option>
                {markets.map(m => (
                  <option key={m.id} value={m.name}>{m.name} ({m.district})</option>
                ))}
              </select>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
                {t('dashboard.quality_grade')}
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              >
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Grade C">Grade C</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loadingAnalysis}
                className="w-full py-2.5 px-4 bg-agrigreen-700 hover:bg-agrigreen-900 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingAnalysis ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('dashboard.analyzing')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('dashboard.find_best_market')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Notice</h4>
            <p className="text-xs">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 3. SECTION 2 — AI SELL ADVISOR RESULT (Primary Visual Priority) */}
      {advisorData && (
        <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-700/50 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌾</span>
              <h2 className="text-xl font-bold tracking-tight text-white">Best Selling Opportunity</h2>
            </div>
            <span className="text-xs text-teal-200 bg-teal-700/80 px-3 py-1 rounded-full border border-teal-500/50 font-medium">
              {advisorData.data_disclaimer}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            {/* Top Market Name & Price */}
            <div className="space-y-3 lg:border-r lg:border-teal-700/80 pr-4">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300">{t('advisor.recommended_market')}</div>
              <div className="text-3xl font-extrabold text-white">{advisorData.recommended_market}</div>
              <div className="text-xs text-teal-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>{advisorData.district}, {advisorData.state}</span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:col-span-2">
              
              <div className="bg-teal-950/60 p-4 rounded-2xl border border-teal-700/40">
                <span className="text-[11px] font-semibold text-teal-300 uppercase block">{t('advisor.expected_price')}</span>
                {advisorData.expected_price != null ? (
                  <div className="text-2xl font-bold text-white mt-1">₹{advisorData.expected_price.toLocaleString('en-IN')}</div>
                ) : (
                  <div className="text-2xl font-bold text-white mt-1">Price unavailable</div>
                )}
                <span className="text-[10px] text-teal-400 font-medium">{t('dashboard.per_qtl')}</span>
              </div>

              <div className="bg-teal-950/60 p-4 rounded-2xl border border-teal-700/40">
                <span className="text-[11px] font-semibold text-teal-300 uppercase block">{t('advisor.current_price')}</span>
                {advisorData.current_modal_price != null ? (
                  <div className="text-xl font-bold text-teal-100 mt-1">₹{advisorData.current_modal_price.toLocaleString('en-IN')}</div>
                ) : (
                  <div className="text-xl font-bold text-teal-100 mt-1">Price unavailable</div>
                )}
                {advisorData.expected_gain != null ? (
                  <span className="text-sm font-semibold text-teal-200 block">
                    {advisorData.expected_gain >= 0 ? `+₹${advisorData.expected_gain} ${t('advisor.expected_gain')}` : `₹${advisorData.expected_gain} ${t('advisor.expected_gain')}`}
                  </span>
                ) : null}
              </div>

              <div className="bg-teal-950/60 p-4 rounded-2xl border border-teal-700/40">
                <span className="text-[11px] font-semibold text-teal-300 uppercase block">Recommended Window</span>
                <div className="text-base font-bold text-amber-300 mt-1">{advisorData.recommended_window}</div>
                <span className="text-[10px] text-stone-300">{advisorData.confidence_level}</span>
              </div>

            </div>

          </div>

          {/* AI Recommendation Reason */}
          {advisorData.key_reasons && advisorData.key_reasons.length > 0 && (
            <div className="bg-teal-950/70 p-4 rounded-2xl border border-teal-700/40 text-xs text-teal-100 leading-relaxed flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                {advisorData.decision ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      {advisorData.decision === "SELL_NOW" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>}
                      {advisorData.decision === "PARTIAL_SELL" && <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>}
                      {advisorData.decision === "WAIT" && <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>}
                      {(advisorData.decision === "LOW_CONFIDENCE" || advisorData.decision === "INSUFFICIENT_DATA") && <span className="w-2.5 h-2.5 rounded-full bg-stone-500"></span>}
                      <span className="font-bold text-amber-300 text-sm">
                        {t(`advisor.decision.${advisorData.decision}`) || t('advisor.recommendation')}
                      </span>
                    </div>
                    <p className="text-sm">
                      {advisorData.decision_reason || advisorData.key_reasons.join(' ')}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-amber-300">{t('advisor.ai_recommendation')} </span>
                    "{advisorData.key_reasons.join(' ')}"
                  </>
                )}
              </div>
            </div>
          )}

          {/* Phase 4: Weather Risk UI */}
          {advisorData.weather_data_available && (
            <div className="bg-teal-950/40 p-4 rounded-2xl border border-teal-700/30 text-xs text-teal-100 mt-4 flex items-start gap-3">
              <CloudRain className={`w-5 h-5 shrink-0 mt-0.5 ${advisorData.weather_risk_level === 'HIGH' ? 'text-red-400' : advisorData.weather_risk_level === 'MEDIUM' ? 'text-yellow-400' : 'text-blue-400'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-teal-200">
                    {t('advisor.weather_risk')}: {t(`advisor.weather_risk_level_${advisorData.weather_risk_level}`) || advisorData.weather_risk_level}
                  </span>
                  <span className="text-[10px] text-teal-500 font-medium">Source: {advisorData.weather_source}</span>
                </div>
                {advisorData.weather_condition && (
                  <p className="text-sm text-teal-300">
                    {t('advisor.weather_condition')}: {advisorData.weather_condition}
                  </p>
                )}
                {advisorData.weather_warning && (
                  <p className="text-sm text-red-300 mt-1">
                    {advisorData.weather_warning}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {!advisorData.weather_data_available && (
            <div className="bg-teal-950/20 p-3 rounded-2xl border border-teal-700/20 text-[11px] text-teal-500 mt-4 flex items-center gap-2">
              <CloudRain className="w-3.5 h-3.5 opacity-50" />
              <span>{t('advisor.weather_unavailable')}</span>
            </div>
          )}

        </div>
      )}

      {/* Warnings Block */}
      {advisorData && advisorData.warnings && advisorData.warnings.length > 0 && (
        <div className="bg-amber-100/50 border border-amber-300 p-4 rounded-2xl shadow-sm space-y-2 mt-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <span>{t('advisor.advisory_warnings')}</span>
          </div>
          <ul className="list-disc list-inside space-y-1 ml-1">
            {advisorData.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. SECTION 3 — Market Comparison */}
      {advisorData && advisorData.market_rankings && advisorData.market_rankings.length > 0 && (
        <div className="bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Scale className="w-5 h-5 text-agrigreen-700" />
              <span>{t('dashboard.compare_markets')}</span>
            </h3>
            <span className="text-xs text-text-secondary">{t('dashboard.sorted_by')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-primary">
              <thead className="bg-surface-bg text-text-secondary uppercase font-semibold text-[11px] border-b border-border-subtle">
                <tr>
                  <th className="px-4 py-3">{t('dashboard.table_market')}</th>
                  <th className="px-4 py-3 text-center">{t('dashboard.table_distance')}</th>
                  <th className="px-4 py-3 text-center">{t('dashboard.table_transport_cost')}</th>
                  <th className="px-4 py-3 text-right">{t('dashboard.table_current_price')}</th>
                  <th className="px-4 py-3 text-right">{t('dashboard.table_expected_price')}</th>
                  <th className="px-4 py-3 text-center">{t('dashboard.table_net_realization')}</th>
                  <th className="px-4 py-3 text-center">{t('dashboard.table_trend')}</th>
                  <th className="px-4 py-3 text-right">{t('dashboard.table_arrivals')}</th>
                  <th className="px-4 py-3 text-center">{t('dashboard.table_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {advisorData.market_rankings.map((m, idx) => {
                  const isTop = m.market_name === advisorData.recommended_market;
                  return (
                    <tr key={idx} className={`hover:bg-surface-bg/80 transition-colors ${isTop ? 'bg-agrigreen-500/10/50 font-semibold' : ''}`}>
                      <td className="px-4 py-3.5 font-bold text-text-primary text-sm">
                        {m.market_name}
                        <div className="text-[10px] font-normal text-text-secondary">{m.district}, {m.state}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-text-secondary text-xs">{t('dashboard.not_available')}</td>
                      <td className="px-4 py-3.5 text-center text-text-secondary text-xs">{t('dashboard.not_available')}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-text-primary">
                        {m.latest_modal_price > 0 ? `₹${m.latest_modal_price.toLocaleString('en-IN')} / qtl` : t('dashboard.not_available')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-agrigreen-900">
                        {m.expected_5d_price > 0 ? `₹${m.expected_5d_price.toLocaleString('en-IN')} / qtl` : t('dashboard.not_available')}
                      </td>
                      <td className="px-4 py-3.5 text-center text-text-secondary text-xs">{t('dashboard.not_available')}</td>
                      <td className="px-4 py-3.5 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          m.trend_direction === 'Upward' ? 'bg-agrigreen-500/20 text-agrigreen-700' :
                          m.trend_direction === 'Downward' ? 'bg-red-100 text-red-800' :
                          'bg-surface-subtle text-text-primary'
                        }`}>
                          {m.trend_direction === 'Upward' ? t('dashboard.rising') : m.trend_direction === 'Downward' ? t('dashboard.falling') : t('dashboard.stable')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-text-secondary text-xs">
                        {m.arrival_quantity != null ? `${m.arrival_quantity} ${t('dashboard.tons')}` : t('dashboard.arrival_unavailable')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isTop ? (
                          <span className="bg-agrigreen-700 text-white text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            ★ Best Market
                          </span>
                        ) : (
                          <span className="text-text-secondary text-xs">Standard</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SECTION 4 — Price Trend & Selling Window */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Price Trend Chart */}
        <div className="lg:col-span-2 bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border-subtle pb-3">
            <div>
              <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-agrigreen-700" />
                Price Trend
              </h3>
              <p className="text-xs text-text-secondary">Historical modal price movement over the last 25 days</p>
            </div>
            {chartData.length > 0 ? (
              <span className="text-xs font-semibold text-agrigreen-700 bg-agrigreen-500/10 px-2.5 py-1 rounded border border-agrigreen-500/30">
                Data available for trend analysis
              </span>
            ) : (
              <span className="text-xs font-semibold text-text-secondary bg-surface-bg px-2.5 py-1 rounded border border-border-subtle">
                Insufficient data for trend
              </span>
            )}
          </div>

          <div className="h-64 w-full pt-2">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary text-xs">
                No trend chart data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#047857" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#a8a29e" />
                  <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 100', 'dataMax + 100']} stroke="#a8a29e" />
                  <Tooltip 
                    formatter={(val) => [`₹${val} / quintal`, 'Modal Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area type="monotone" dataKey="modal_price" stroke="#047857" strokeWidth={2.5} fillOpacity={1} fill="url(#priceColor)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Selling Window Decision Card */}
        <div className="bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-text-primary text-base flex items-center gap-2 border-b border-border-subtle pb-3">
              <Calendar className="w-5 h-5 text-agrigreen-700" />
              When Should I Sell?
            </h3>
            
            <div className="mt-4 space-y-3">
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-widest block mb-2">Recommended Window</span>
                <div className="text-3xl font-black text-amber-900 tracking-tight">
                  {advisorData ? advisorData.recommended_window : 'Next 2–3 days'}
                </div>
              </div>

              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-secondary">Price Trend:</span>
                  <span className="font-bold text-agrigreen-700">Rising</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-secondary">Buyer Demand:</span>
                  <span className="font-bold text-text-primary">High</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-secondary">Current Price:</span>
                  {advisorData?.current_modal_price != null ? (
                    <span className="font-bold text-text-primary">₹{advisorData.current_modal_price.toLocaleString('en-IN')} / qtl</span>
                  ) : (
                    <span className="font-bold text-text-primary">Price unavailable</span>
                  )}
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-secondary">Expected Price:</span>
                  {advisorData?.expected_price != null ? (
                    <span className="font-bold text-agrigreen-900">₹{advisorData.expected_price.toLocaleString('en-IN')} / qtl</span>
                  ) : (
                    <span className="font-bold text-agrigreen-900">Price unavailable</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToBuyers}
            className="w-full py-3.5 bg-agrigreen-700 hover:bg-agrigreen-900 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>{t('dashboard.matched_buyers')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 6. SECTION 5 — Buyers Looking for Your Produce */}
      <div id="buyers-section" className="bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-agrigreen-700" />
              {t('dashboard.matched_buyers')}
            </h3>
            <p className="text-xs text-text-secondary">{t('dashboard.marketplace_subtitle')}</p>
          </div>
          <span className="text-xs font-medium text-agrigreen-700 bg-agrigreen-500/10 px-3 py-1 rounded-full border border-agrigreen-500/30">
            {buyersList.length || 3} Verified Buyers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {buyersList.length > 0 ? buyersList.slice(0, 3).map((buyer) => (
            <div key={buyer.id} className="bg-surface-bg rounded-2xl border border-border-subtle p-5 flex flex-col justify-between space-y-4 hover:border-agrigreen-500/60 transition-all">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-text-primary text-base">{buyer.name || 'Verified Buyer'}</h4>
                    <span className="text-[11px] font-semibold text-agrigreen-700 bg-agrigreen-500/20 px-2 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3 h-3 text-agrigreen-700" /> Verified Buyer
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-text-secondary pt-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-medium">Buying Crop:</span>
                    <span className="font-bold text-text-primary">{crops.find(c => c.id.toString() === selectedCropId)?.name || 'Any'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-medium">Requirement:</span>
                    <span className="font-semibold text-text-primary">{t('dashboard.requirement_open')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-medium">Location:</span>
                    <span className="font-medium text-text-primary">Any APMC</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateModal(buyer)}
                className="w-full py-2 bg-agrigreen-700 hover:bg-agrigreen-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{t('dashboard.sell_directly')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )) : (
            <div className="col-span-3 text-center text-text-secondary text-sm py-8 bg-surface-bg rounded-xl border border-dashed border-border-subtle">
              No registered buyers available.
            </div>
          )}
        </div>
      </div>

      {/* 7. SECTION 6 & 7 — My Produce & Recent Sales Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: My Produce */}
        <div className="bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border-subtle pb-3">
            <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-agrigreen-700" />
              {t('dashboard.my_lots')}
            </h3>
          </div>

          {myLots.length === 0 ? (
            <div className="py-8 text-center text-text-secondary text-xs bg-surface-bg rounded-2xl border border-dashed border-border-subtle">
              No produce lots listed yet.<br />
              <button onClick={() => handleOpenCreateModal()} className="text-agrigreen-700 font-bold underline mt-1 inline-block">Create Produce Lot</button>
            </div>
          ) : (
            <div className="space-y-3">
              {myLots.slice(0, 3).map((lot) => (
                <div key={lot.id} className="bg-surface-bg p-4 rounded-2xl border border-border-subtle flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-text-primary text-sm">{lot.crop_name}</div>
                    <div className="text-text-secondary font-medium">{lot.quantity_quintals * 100} kg ({lot.quantity_quintals} qtl) • {lot.quality_grade}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-agrigreen-900">₹{lot.expected_price_per_quintal.toLocaleString('en-IN')} / qtl</div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      lot.status === 'Available' ? 'bg-agrigreen-500/20 text-agrigreen-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {lot.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Sales Transactions */}
        <div className="bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border-subtle pb-3">
            <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-agrigreen-700" />
              {t('dashboard.transactions')}
            </h3>
          </div>

          {myTransactions.length === 0 ? (
            <div className="py-8 text-center text-text-secondary text-xs bg-surface-bg rounded-2xl border border-dashed border-border-subtle">
              No recent sales transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myTransactions.slice(0, 3).map((txn) => (
                <div key={txn.id} className="bg-surface-bg p-4 rounded-2xl border border-border-subtle flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-text-primary text-sm">{txn.crop_name} • {txn.buyer_name}</div>
                    <div className="text-text-secondary font-medium">{txn.quantity_quintals} qtl • ₹{txn.agreed_price_per_quintal}/qtl</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-agrigreen-900">₹{txn.total_amount.toLocaleString('en-IN')}</div>
                    <button
                      type="button"
                      onClick={() => setSelectedTransaction(txn)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-agrigreen-700 hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{txn.payment_status}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onTransactionUpdated={(updated) => {
            setSelectedTransaction(updated);
            getFarmerTransactions(effectiveUserId).then(t => setMyTransactions(t));
          }}
        />
      )}

      {/* Create Lot Modal (Moved into FarmerDashboard for seamless flow) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in border border-border-subtle">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text-primary">{t('dashboard.create_lot_title')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {lotFormError && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded-xl border border-red-200">
                {lotFormError}
              </div>
            )}
            {lotFormSuccess && (
              <div className="mb-4 p-3 bg-agrigreen-50 text-agrigreen-800 text-sm rounded-xl border border-agrigreen-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {lotFormSuccess}
              </div>
            )}

            <form onSubmit={handleCreateLotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Crop</label>
                <select value={selectedCropId} disabled className="w-full bg-surface-subtle border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary text-sm opacity-80 cursor-not-allowed">
                  <option value={selectedCropId}>{crops.find(c => c.id.toString() === selectedCropId)?.name}</option>
                </select>
                <p className="text-[10px] text-text-secondary mt-1">Pre-filled from your analysis.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Quantity (kg)</label>
                <input type="number" value={lotQuantityKg} onChange={e => setLotQuantityKg(e.target.value)} className="w-full bg-surface-bg border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Quality Grade</label>
                <select value={lotQualityGrade} onChange={e => setLotQualityGrade(e.target.value)} className="w-full bg-surface-bg border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none">
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Expected Price (₹/Quintal)</label>
                <input type="number" value={lotExpectedPrice} onChange={e => setLotExpectedPrice(e.target.value)} className="w-full bg-surface-bg border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">{t('dashboard.table_market')}</label>
                <select value={lotMarketId} onChange={e => setLotMarketId(e.target.value)} className="w-full bg-surface-bg border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none" required>
                  <option value="">Select Market</option>
                  {markets.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.district})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-border-subtle text-text-primary hover:bg-surface-subtle font-bold rounded-xl transition-colors">
                  {t('dashboard.cancel')}
                </button>
                <button type="submit" disabled={submittingLot} className="flex-1 py-2.5 bg-agrigreen-700 hover:bg-agrigreen-900 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {submittingLot ? (
                    <>{t('dashboard.submitting')}</>
                  ) : (
                    <>{t('dashboard.submit')}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
