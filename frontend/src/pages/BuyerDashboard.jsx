import React, { useState, useEffect } from 'react';
import { getCrops, getMarkets, getLots, getLot, createOffer, getMyOffers, getBuyerTransactions } from '../services/api';
import { Search, X, MapPin, Scale, Award, Package, IndianRupee, Tag, ShieldCheck, ChevronRight, MessageSquare, AlertCircle, Receipt, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TransactionDetailModal from '../components/TransactionDetailModal';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const effectiveBuyerId = user?.id;

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'offers' | 'transactions'
  
  // Data State
  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [lots, setLots] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Filter State
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [offerPrice, setOfferPrice] = useState('');
  const [offerQuantity, setOfferQuantity] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerError, setOfferError] = useState('');
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    loadFiltersAndLots();
  }, []);

  useEffect(() => {
    if (activeTab === 'offers') {
      loadMyOffers();
    } else if (activeTab === 'transactions') {
      loadMyTransactions();
    }
  }, [activeTab, effectiveBuyerId]);

  const loadFiltersAndLots = async () => {
    setLoading(true);
    setError('');
    try {
      const [cropsData, marketsData, lotsData] = await Promise.all([
        getCrops(),
        getMarkets(),
        getLots()
      ]);
      setCrops(cropsData);
      setMarkets(marketsData);
      setLots(lotsData);
    } catch (err) {
      setError('We couldn\'t load produce listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyOffers = async () => {
    try {
      const offersData = await getMyOffers(effectiveBuyerId);
      setMyOffers(offersData);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyTransactions = async () => {
    try {
      const txnsData = await getBuyerTransactions(effectiveBuyerId);
      setTransactions(txnsData);
    } catch (err) {
      console.error(err);
    }
  };


  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const lotsData = await getLots({
        cropId: selectedCrop,
        marketId: selectedMarket,
        qualityGrade: selectedQuality
      });
      setLots(lotsData);
    } catch (err) {
      setError('We couldn\'t load produce listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCrop('');
    setSelectedMarket('');
    setSelectedQuality('');
    
    // Automatically trigger search when clearing filters
    getLots().then(data => setLots(data)).catch(() => {});
  };

  const handleOpenModal = (lot) => {
    setSelectedLot(lot);
    setOfferPrice(lot.expected_price_per_quintal.toString());
    setOfferQuantity(lot.quantity_quintals.toString());
    setOfferMessage('');
    setOfferError('');
    setOfferSuccess(false);
  };

  const handleCloseModal = () => {
    setSelectedLot(null);
    setOfferSuccess(false);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setOfferError('');
    
    const price = parseFloat(offerPrice);
    const qty = parseFloat(offerQuantity);
    
    if (!price || price <= 0) {
      setOfferError('Price must be greater than 0.');
      return;
    }
    if (!qty || qty <= 0) {
      setOfferError('Quantity must be greater than 0.');
      return;
    }
    if (qty > selectedLot.quantity_quintals) {
      setOfferError(`Quantity cannot exceed available lot quantity (${selectedLot.quantity_quintals} qtl).`);
      return;
    }

    setSubmittingOffer(true);
    try {
      await createOffer({
        lot_id: selectedLot.id,
        offered_price: price,
        quantity: qty,
        message: offerMessage
      });
      setOfferSuccess(true);
    } catch (err) {
      setOfferError(err.message || 'Failed to submit offer.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200/60">
              Buyer Dashboard
            </span>
            <span className="text-xs text-agrigreen-700 bg-agrigreen-500/10 px-2.5 py-1 rounded border border-agrigreen-500/30 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-agrigreen-700" />
              Verified produce listings
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mt-2">Find the right produce from verified farmers and FPOs.</h1>
          <p className="text-text-secondary text-sm mt-1">
            Browse available lots, apply filters, and make competitive offers directly to sellers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'browse' ? 'border-agrigreen-700 text-agrigreen-700' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Browse Lots
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'offers' ? 'border-agrigreen-700 text-agrigreen-700' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          My Offers ({myOffers.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-agrigreen-700 text-agrigreen-700' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          My Transactions ({transactions.length})
        </button>
      </div>


      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Filter Panel */}
          <div className="bg-surface-card p-5 rounded-2xl border border-border-subtle shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">Crop</label>
              <select 
                value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              >
                <option value="">All Crops</option>
                {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">Location</label>
              <select 
                value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              >
                <option value="">All Locations</option>
                {markets.map(m => <option key={m.id} value={m.id}>{m.name} ({m.district})</option>)}
              </select>
            </div>

            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">Quality</label>
              <select 
                value={selectedQuality} onChange={(e) => setSelectedQuality(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              >
                <option value="">Any Quality</option>
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
              <button 
                onClick={handleSearch}
                className="flex-1 md:flex-none py-2 px-4 bg-stone-900 hover:bg-black text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
              <button 
                onClick={clearFilters}
                className="flex-1 md:flex-none py-2 px-4 bg-surface-subtle hover:bg-stone-200 text-text-primary rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>

          {/* Results Area */}
          {loading ? (
            <div className="py-12 text-center text-text-secondary font-medium">Loading produce listings...</div>
          ) : error ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold">Error</h4>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : lots.length === 0 ? (
            <div className="py-12 text-center text-text-secondary font-medium bg-surface-bg rounded-2xl border border-border-subtle border-dashed">
              No matching produce found.<br/>
              <span className="text-sm text-text-secondary">Try changing your filters.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lots.map(lot => (
                <div key={lot.id} className="bg-surface-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
                  <div className="p-5 border-b border-border-subtle flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-text-primary">{lot.crop_name}</h3>
                        <span className="inline-block px-2 py-0.5 bg-surface-subtle text-text-primary text-xs font-semibold rounded mt-1">
                          {lot.quality_grade}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-text-secondary uppercase font-semibold">Quantity</div>
                        <div className="font-bold text-text-primary">{lot.quantity_quintals} qtl</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-text-secondary" />
                        <span>{lot.district}, {lot.state}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-text-secondary" />
                        <span>Expected: <strong>₹{lot.expected_price_per_quintal.toLocaleString('en-IN')}</strong> / qtl</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-text-secondary" />
                        <span>Seller: {lot.farmer_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-bg">
                    <button 
                      onClick={() => handleOpenModal(lot)}
                      className="w-full py-2.5 bg-surface-card border border-border-subtle hover:border-agrigreen-500 hover:text-agrigreen-700 text-text-primary font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>View Lot & Offer</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Offers Tab */}
      {activeTab === 'offers' && (
        <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border-subtle">
            <h2 className="font-bold text-lg text-text-primary">Your Submitted Offers</h2>
            <p className="text-sm text-text-secondary">Track the status of offers you've made to sellers.</p>
          </div>
          {myOffers.length === 0 ? (
            <div className="p-12 text-center text-text-secondary text-sm">
              You haven't made any offers yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface-bg text-text-secondary uppercase font-semibold text-[11px] border-b border-border-subtle">
                  <tr>
                    <th className="px-5 py-3">Crop</th>
                    <th className="px-5 py-3">Seller</th>
                    <th className="px-5 py-3 text-right">Quantity</th>
                    <th className="px-5 py-3 text-right">Offered Price</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {myOffers.map(offer => (
                    <tr key={offer.id} className="hover:bg-surface-bg/50">
                      <td className="px-5 py-4 font-bold text-text-primary">{offer.crop_name}</td>
                      <td className="px-5 py-4">{offer.farmer_name}</td>
                      <td className="px-5 py-4 text-right">{offer.quantity} qtl</td>
                      <td className="px-5 py-4 text-right font-semibold">₹{offer.offered_price.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          offer.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          offer.status === 'Accepted' ? 'bg-agrigreen-500/10 text-agrigreen-700 border-agrigreen-500/30' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {offer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* My Transactions Tab */}
      {activeTab === 'transactions' && (

        <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border-subtle flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg text-text-primary">My Purchase Transactions</h2>
              <p className="text-sm text-text-secondary">Track order settlements and demo payment status.</p>
            </div>
            <span className="text-xs font-semibold text-text-secondary bg-surface-subtle px-3 py-1 rounded-full border border-border-subtle">
              Demo payment tracking
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center text-text-secondary text-sm">
              You don't have any completed or confirmed transactions yet.<br />
              <span className="text-xs text-text-secondary">Transactions are created when a seller accepts your offer.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface-bg text-text-secondary uppercase font-semibold text-[11px] border-b border-border-subtle">
                  <tr>
                    <th className="px-5 py-3.5">Txn ID & Crop</th>
                    <th className="px-5 py-3.5">Seller (Farmer/FPO)</th>
                    <th className="px-5 py-3.5 text-right">Quantity</th>
                    <th className="px-5 py-3.5 text-right">Agreed Price</th>
                    <th className="px-5 py-3.5 text-right">Total Amount</th>
                    <th className="px-5 py-3.5 text-center">Payment Status</th>
                    <th className="px-5 py-3.5 text-center">Txn Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-surface-bg/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-text-primary">{txn.crop_name}</div>
                        <div className="text-[11px] font-mono text-text-secondary">#TXN-{txn.id} • {txn.quality_grade}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-text-primary">{txn.farmer_name}</td>
                      <td className="px-5 py-4 text-right font-medium">{txn.quantity_quintals} qtl</td>
                      <td className="px-5 py-4 text-right">₹{txn.agreed_price_per_quintal.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-right font-bold text-agrigreen-900">₹{txn.total_amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          txn.payment_status === 'Paid' ? 'bg-agrigreen-500/10 text-agrigreen-700 border-agrigreen-500/30' :
                          txn.payment_status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {txn.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          txn.transaction_status === 'Completed' ? 'bg-agrigreen-500/10 text-agrigreen-700 border-agrigreen-500/30' :
                          'bg-surface-subtle text-text-primary border-border-subtle'
                        }`}>
                          {txn.transaction_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTransaction(txn)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-agrigreen-700 hover:text-agrigreen-900 bg-agrigreen-500/10 hover:bg-agrigreen-500/20 px-3 py-1.5 rounded-lg border border-agrigreen-500/30/60 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onTransactionUpdated={(updatedTxn) => {
            setSelectedTransaction(updatedTxn);
            loadMyTransactions();
          }}
        />
      )}


      {/* Lot Details / Make Offer Modal */}
      {selectedLot && (
        <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-surface-bg">
              <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <Package className="w-5 h-5 text-agrigreen-700" />
                Lot Details
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              
              {/* Lot Info summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle">
                  <div className="text-xs text-text-secondary font-semibold uppercase mb-1">Crop & Quality</div>
                  <div className="font-bold text-text-primary text-lg">{selectedLot.crop_name}</div>
                  <div className="text-sm font-medium text-text-secondary">{selectedLot.quality_grade}</div>
                </div>
                <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle">
                  <div className="text-xs text-text-secondary font-semibold uppercase mb-1">Expected Price</div>
                  <div className="font-bold text-agrigreen-700 text-lg">₹{selectedLot.expected_price_per_quintal.toLocaleString('en-IN')}</div>
                  <div className="text-sm font-medium text-text-secondary">per quintal</div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-text-primary">
                <div className="flex justify-between py-2 border-b border-border-subtle">
                  <span className="text-text-secondary font-medium">Quantity Available</span>
                  <span className="font-bold">{selectedLot.quantity_quintals} quintals</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-subtle">
                  <span className="text-text-secondary font-medium">Seller</span>
                  <span className="font-bold">{selectedLot.farmer_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-subtle">
                  <span className="text-text-secondary font-medium">Location</span>
                  <span className="font-bold">{selectedLot.market_name} ({selectedLot.district}, {selectedLot.state})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-subtle">
                  <span className="text-text-secondary font-medium">Status</span>
                  <span className="font-bold text-agrigreen-500">{selectedLot.status}</span>
                </div>
              </div>

              {/* Offer Form */}
              <div className="bg-surface-bg p-5 rounded-2xl border border-border-subtle">
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-agrigreen-700" />
                  Your Offer
                </h3>
                
                {offerSuccess ? (
                  <div className="bg-agrigreen-500/10 text-agrigreen-700 p-4 rounded-xl border border-agrigreen-500/30 font-medium text-sm text-center">
                    Offer submitted successfully. The seller has been notified.
                  </div>
                ) : (
                  <form onSubmit={handleSubmitOffer} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">Price (₹ / quintal)</label>
                        <input
                          type="number"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">Quantity (quintals)</label>
                        <input
                          type="number"
                          value={offerQuantity}
                          onChange={(e) => setOfferQuantity(e.target.value)}
                          max={selectedLot.quantity_quintals}
                          className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Message (optional)
                      </label>
                      <textarea
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                        placeholder="Add any terms or questions for the seller..."
                        rows={2}
                        className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none resize-none"
                      />
                    </div>
                    
                    {offerError && (
                      <div className="text-red-600 text-sm font-medium">{offerError}</div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={submittingOffer}
                      className="w-full py-2.5 bg-agrigreen-700 hover:bg-agrigreen-900 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                    >
                      {submittingOffer ? 'Submitting...' : 'Submit Offer'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
