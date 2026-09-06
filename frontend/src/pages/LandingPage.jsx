import React, { Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Users, ShieldCheck, ArrowRight, Store, Scale, BarChart3, CheckCircle2, Sparkles, Building2, ChevronRight, Zap, Leaf, MapPin } from 'lucide-react';
import { DEMO_MARKETS, DEMO_PRICE_TRENDS } from '../data/mockData';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// Lazy-load the 3D Component for performance
const FarmToMarket3D = lazy(() => import('../components/FarmToMarket3D'));

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-20 pb-20">

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[100vh] lg:min-h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-surface-bg pt-20 md:pt-24 lg:pt-0">

        {/* Split Layout Container */}
        <div className="flex-grow flex flex-col lg:flex-row items-center justify-center w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-2 lg:mt-16">

          {/* Left Side: Text Content */}
          <div className="relative z-20 w-full lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:pr-8 xl:pr-12 pt-8 lg:pt-0">

            {/* Positioning Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-card/60 backdrop-blur-md text-agrigreen-900 text-xs font-semibold tracking-wide border border-agrigreen-500/30 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <span className="w-2 h-2 rounded-full bg-agrigreen-500 animate-pulse"></span>
              AI-powered market intelligence for better selling decisions
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-text-primary leading-[1.1] drop-shadow-sm">
              Know the price.<br/>
              Find the buyer.<br/>
              <span className="text-agrigreen-700">Sell smarter.</span>
            </h1>

            {/* Supporting Description */}
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl font-normal leading-relaxed drop-shadow-sm">
              Compare market prices, discover suitable buyers and make confident, profitable selling decisions.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 pb-4 w-full">
              <Link
                to="/farmer"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-agrigreen-700 hover:bg-agrigreen-700 text-white font-bold text-base transition-all shadow-[0_4px_14px_0_rgb(4,120,87,0.39)] hover:shadow-[0_6px_20px_rgba(4,120,87,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>Explore Markets &rarr;</span>
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-surface-card/80 backdrop-blur-sm hover:bg-surface-card text-text-primary border border-border-subtle font-semibold text-base transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="text-amber-500">✦</span>
                <span>Try Demo</span>
              </Link>
            </div>
          </div>

          {/* Right Side: 3D Scene */}
          <div className="relative z-10 w-full lg:w-[55%] h-[380px] sm:h-[450px] md:h-[500px] lg:h-[700px] mt-6 lg:mt-0 flex items-center justify-center lg:translate-x-12">

            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm font-mono">
                Loading 3D Ecosystem...
              </div>
            }>
              <FarmToMarket3D />
            </Suspense>
          </div>
        </div>

        {/* Stats Bar (Bottom) */}
        <div className="relative z-20 mt-auto w-full max-w-5xl mx-auto pointer-events-none pt-4 pb-4 lg:pb-8">
          <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-24 border-t border-border-subtle/60 pt-6 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-5 h-5 text-text-secondary" />
                <span className="text-2xl font-bold text-text-primary">5+ Mandis</span>
              </div>
              <span className="text-sm text-text-secondary font-medium">Nearby APMC Prices</span>
            </div>

            <div className="hidden sm:block w-px h-10 bg-stone-200/60"></div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-5 h-5 text-agrigreen-500" />
                <span className="text-2xl font-bold text-text-primary">8 Crops</span>
              </div>
              <span className="text-sm text-text-secondary font-medium">Tracked Daily</span>
            </div>

            <div className="hidden sm:block w-px h-10 bg-stone-200/60"></div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-lg font-bold text-agrigreen-500 bg-agrigreen-500/10 px-2 py-0.5 rounded border border-agrigreen-500/20">₹</div>
                <span className="text-2xl font-bold text-agrigreen-700">0% Fee</span>
              </div>
              <span className="text-sm text-text-secondary font-medium">Free for Farmers</span>
            </div>
          </div>
        </div>

      </section>

      {/* 2. HOW AGRIMITRA WORKS (4 SIMPLE STEPS) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-agrigreen-700 bg-agrigreen-500/10 px-3 py-1 rounded-full border border-agrigreen-500/30">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">How AgriMitra Works</h2>
          <p className="text-text-secondary text-base">
            From crop input to final transaction, AgriMitra simplifies agricultural commerce in four easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-surface-card p-6 rounded-2xl border border-border-subtle space-y-4 hover:border-agrigreen-500/50 transition-colors shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-agrigreen-500/10 text-agrigreen-700 border border-agrigreen-500/30 flex items-center justify-center font-bold text-base">
                01
              </div>
              <h3 className="text-lg font-bold text-text-primary">Enter Your Crop</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Select your harvested crop, quantity in quintals, location, and quality grade (Grade A/B/C).
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-agrigreen-700 flex items-center gap-1">
              <span>Quick Form Input</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-card p-6 rounded-2xl border border-border-subtle space-y-4 hover:border-agrigreen-500/50 transition-colors shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-base">
                02
              </div>
              <h3 className="text-lg font-bold text-text-primary">Compare Markets</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Instantly view modal prices across nearby APMC Mandis along with estimated transport costs.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <span>Net Profit Discovery</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-surface-card p-6 rounded-2xl border border-border-subtle space-y-4 hover:border-agrigreen-500/50 transition-colors shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-agrigreen-500/10 text-agrigreen-700 border border-agrigreen-500/30 flex items-center justify-center font-bold text-base">
                03
              </div>
              <h3 className="text-lg font-bold text-text-primary">Get Recommendation</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Our AI Sell Advisor evaluates price trends, volatility, and net returns to recommend the best market window.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-agrigreen-700 flex items-center gap-1">
              <span>AI Sell Advisor</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-surface-card p-6 rounded-2xl border border-border-subtle space-y-4 hover:border-agrigreen-500/50 transition-colors shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center justify-center font-bold text-base">
                04
              </div>
              <h3 className="text-lg font-bold text-text-primary">Find the Right Buyer</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Connect with verified institutional buyers looking for your produce lot and complete secure transactions.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-sky-800 flex items-center gap-1">
              <span>Direct Offers & Deals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. MARKET INTELLIGENCE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-sm p-6 md:p-8 space-y-8">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-agrigreen-700" />
                <span className="text-xs font-semibold uppercase tracking-wider text-agrigreen-700">
                  Market Intelligence
                </span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mt-1">
                Real-Time APMC Price Discovery & Arrivals
              </h2>
              <p className="text-text-secondary text-sm mt-0.5">
                Understand modal prices, price trends, nearby mandis, and net profit expectations before transporting your crop.
              </p>
            </div>

            <Link
              to="/farmer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-agrigreen-500/10 text-agrigreen-700 hover:bg-agrigreen-500/20 font-semibold text-xs border border-agrigreen-500/30 transition-colors shrink-0"
            >
              <span>Explore All Markets</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mandi Cards & Recharts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Nearby APMC Cards */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-bold uppercase text-text-secondary tracking-wider">Nearby APMC Mandi Prices (Prototype Data)</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_MARKETS.slice(0, 3).map((m) => (
                  <div key={m.id} className="p-4 rounded-xl border border-border-subtle bg-surface-bg/70 hover:bg-surface-card hover:border-agrigreen-500/50 transition-all space-y-2">
                    <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
                      <span>{m.distanceKm} km away</span>
                      <span className="font-semibold text-agrigreen-700">{m.demandLevel} Demand</span>
                    </div>
                    <div className="font-bold text-text-primary text-base">{m.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-text-primary">₹{m.modalPricePerQuintal}</span>
                      <span className="text-xs text-text-secondary font-medium">/ Qtl</span>
                    </div>
                    <div className="text-[11px] text-text-secondary border-t border-border-subtle/80 pt-2 flex justify-between">
                      <span>Est. Transport:</span>
                      <span className="font-semibold text-text-primary">₹{m.estimatedTransportCost}/Qtl</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Trend Chart */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase text-text-secondary tracking-wider">5-Day Price Trend (Sharbati Wheat)</h4>
                  <span className="text-[11px] text-text-secondary font-mono">₹/Quintal</span>
                </div>
                <div className="h-48 w-full bg-surface-bg rounded-2xl p-3 border border-border-subtle/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={DEMO_PRICE_TRENDS}>
                      <XAxis dataKey="date" stroke="#78716c" fontSize={11} />
                      <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="#78716c" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1c1917', color: '#fff', borderRadius: '10px', fontSize: '12px', border: 'none' }}
                      />
                      <Area type="monotone" dataKey="lasalgaon" stroke="#15803d" fill="#dcfce7" strokeWidth={2} name="Lasalgaon APMC" />
                      <Area type="monotone" dataKey="nashik" stroke="#0369a1" fill="#e0f2fe" strokeWidth={2} name="Nashik APMC" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Intelligence Summary Sidebar */}
            <div className="lg:col-span-5 bg-stone-900 text-stone-200 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-agrigreen-700 text-white flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Why Transparent Discovery?</h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Smallholders often lose 15-25% of their crop value due to lack of local market visibility and high transportation costs. AgriMitra combines nearby mandi prices with net transport calculations so you never sell below fair market value.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-stone-800 pt-4">
                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-agrigreen-500 shrink-0" />
                  <span>Net Price Calculation (Modal Price − Freight)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-agrigreen-500 shrink-0" />
                  <span>Quality Grade Adjustments (Grade A/B/C)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-agrigreen-500 shrink-0" />
                  <span>Direct Buyer Match Notifications</span>
                </div>
              </div>

              <Link
                to="/farmer"
                className="w-full py-3 px-4 rounded-xl bg-agrigreen-700 hover:bg-agrigreen-500 text-white text-xs font-bold text-center transition-colors block shadow-sm"
              >
                Test Farmer Market Finder &rarr;
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 4. AI SELL ADVISOR SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-900 to-stone-900 text-white rounded-3xl p-8 md:p-12 space-y-8 relative overflow-hidden shadow-sm">

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 text-teal-200 text-xs font-semibold border border-teal-700">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Market Timing</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">AI Sell Advisor</h2>

            <p className="text-stone-300 text-base leading-relaxed">
              AgriMitra analyzes available market data to help identify a suitable market and selling window. By evaluating historical price trends, volatility, and arrival volumes, the advisor estimates expected prices and confidence levels.
            </p>

            <div className="pt-2">
              <div className="inline-block px-3.5 py-1.5 rounded-lg bg-stone-800/90 text-amber-300 text-xs font-medium border border-amber-500/40">
                ⚠️ <span className="font-semibold">Disclaimer:</span> AI-assisted estimate based on prototype market data.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-teal-800/80 text-left">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="text-xs text-teal-300 font-medium">Chronological Validation</div>
              <div className="text-lg font-bold text-white mt-1">Time-Series Error MAE</div>
              <div className="text-[11px] text-stone-300 mt-1">Evaluated on historical arrivals</div>
            </div>

            <div className="bg-surface-card/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="text-xs text-amber-300 font-medium">Confidence Estimate</div>
              <div className="text-lg font-bold text-white mt-1">75% – 92% Range</div>
              <div className="text-[11px] text-stone-300 mt-1">Based on data availability</div>
            </div>

            <div className="bg-surface-card/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="text-xs text-sky-300 font-medium">Selling Window</div>
              <div className="text-lg font-bold text-white mt-1">Hold vs Sell Now</div>
              <div className="text-[11px] text-stone-300 mt-1">Optimal market timing</div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. BUYER CONNECTION WORKFLOW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-card rounded-3xl border border-border-subtle p-8 space-y-8 shadow-sm">

          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Direct Trading Flow
            </span>
            <h2 className="text-3xl font-bold text-text-primary">Direct Buyer Connection</h2>
            <p className="text-text-secondary text-sm">
              Eliminating unnecessary intermediaries by connecting farmers and FPOs directly to verified corporate buyers.
            </p>
          </div>

          {/* Workflow Diagram */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4">

            <div className="w-full md:w-1/5 bg-surface-bg p-4 rounded-2xl border border-border-subtle text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-agrigreen-700 text-white flex items-center justify-center mx-auto text-xs font-bold">
                1
              </div>
              <div className="font-bold text-text-primary text-sm">Farmer / FPO</div>
              <div className="text-[11px] text-text-secondary">Creates produce lot</div>
            </div>

            <ArrowRight className="w-5 h-5 text-text-secondary shrink-0 rotate-90 md:rotate-0" />

            <div className="w-full md:w-1/5 bg-surface-bg p-4 rounded-2xl border border-border-subtle text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center mx-auto text-xs font-bold">
                2
              </div>
              <div className="font-bold text-text-primary text-sm">Produce Lot</div>
              <div className="text-[11px] text-text-secondary">Listed on hub</div>
            </div>

            <ArrowRight className="w-5 h-5 text-text-secondary shrink-0 rotate-90 md:rotate-0" />

            <div className="w-full md:w-1/5 bg-surface-bg p-4 rounded-2xl border border-border-subtle text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-sky-700 text-white flex items-center justify-center mx-auto text-xs font-bold">
                3
              </div>
              <div className="font-bold text-text-primary text-sm">Buyer Offer</div>
              <div className="text-[11px] text-text-secondary">Buyer submits price offer</div>
            </div>

            <ArrowRight className="w-5 h-5 text-text-secondary shrink-0 rotate-90 md:rotate-0" />

            <div className="w-full md:w-1/5 bg-surface-bg p-4 rounded-2xl border border-border-subtle text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-agrigreen-900 text-white flex items-center justify-center mx-auto text-xs font-bold">
                4
              </div>
              <div className="font-bold text-text-primary text-sm">Transaction</div>
              <div className="text-[11px] text-text-secondary">Accept & track payment</div>
            </div>

          </div>

          <div className="pt-4 flex justify-center gap-4">
            <Link
              to="/buyer"
              className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Explore Buyer Dashboard</span>
            </Link>
            <Link
              to="/fpo"
              className="px-6 py-3 rounded-xl bg-agrigreen-700 hover:bg-agrigreen-900 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Explore FPO Hub</span>
            </Link>
          </div>

        </div>
      </section>

      {/* 6. PROTOTYPE IMPACT & HONEST METRICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-12 space-y-8">

          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-bold text-white">Platform Prototype Metrics</h2>
            <p className="text-text-secondary text-sm">
              Real functional capabilities active inside this AgriMitra hackathon prototype.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
              <div className="text-3xl font-extrabold text-agrigreen-500">5</div>
              <div className="text-xs text-stone-300 mt-1 font-medium">APMC Mandis Tracked</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
              <div className="text-3xl font-extrabold text-amber-400">8</div>
              <div className="text-xs text-stone-300 mt-1 font-medium">Agricultural Crops</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
              <div className="text-3xl font-extrabold text-sky-400">3</div>
              <div className="text-xs text-stone-300 mt-1 font-medium">User Roles (Farmer/Buyer/FPO)</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
              <div className="text-3xl font-extrabold text-agrigreen-500">100%</div>
              <div className="text-xs text-stone-300 mt-1 font-medium">Local-First Architecture</div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
