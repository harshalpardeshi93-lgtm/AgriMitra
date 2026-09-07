import React, { useState, useEffect } from 'react';
import { 
  Plus, Package, IndianRupee, MapPin, Award, CheckCircle2, 
  XCircle, Clock, AlertCircle, X, ChevronRight, ShoppingBag, 
  Layers, Users, Check, RefreshCw, Receipt, Eye
} from 'lucide-react';
import { 
  getCrops, getMarkets, getMyProduceLots, createProduceLot, 
  getOffersReceived, updateOfferStatus, getFarmerTransactions
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translateCrop, translateRole, translateMarket, translateUnit, translateStatus } from '../utils/i18nHelpers';
import TransactionDetailModal from '../components/TransactionDetailModal';

/**
 * FPO Hub and Produce Lot Workflow
 */
export default function FPODashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const effectiveUserId = user?.id;

  // Data State
  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [myLots, setMyLots] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI & Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('lots'); // 'lots' | 'offers' | 'transactions'
  
  // Selected Lot for viewing offers / Selected Transaction
  const [selectedLotForOffers, setSelectedLotForOffers] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Form State for Create Produce Lot
  const [cropId, setCropId] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [marketId, setMarketId] = useState('');

  // Form Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Action status for offer updates
  const [updatingOfferId, setUpdatingOfferId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [effectiveUserId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cropsData, marketsData, lotsData, offersData, txnsData] = await Promise.all([
        getCrops(),
        getMarkets(),
        getMyProduceLots(effectiveUserId),
        getOffersReceived(effectiveUserId),
        getFarmerTransactions(effectiveUserId)
      ]);
      setCrops(cropsData);
      setMarkets(marketsData);
      setMyLots(lotsData);
      setReceivedOffers(offersData);
      setTransactions(txnsData);
    } catch (err) {
      console.error('Error loading FPO Dashboard data:', err);
      setError(t('fpo.err_load_data'));
    } finally {
      setLoading(false);
    }
  };


  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
    setFormError('');
    setFormSuccess('');
    setCropId('');
    setQuantityKg('');
    setQualityGrade('Grade A');
    setExpectedPrice('');
    setMarketId('');
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
    setFormError('');
    setFormSuccess('');
  };

  const handleCreateLotSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validation
    if (!cropId) {
      setFormError(t('dashboard.err_select_crop'));
      return;
    }

    const qty = parseFloat(quantityKg);
    if (isNaN(qty) || qty <= 0) {
      setFormError(t('dashboard.err_qty_0'));
      return;
    }

    if (!qualityGrade) {
      setFormError(t('dashboard.err_select_quality'));
      return;
    }

    const price = parseFloat(expectedPrice);
    if (isNaN(price) || price <= 0) {
      setFormError(t('dashboard.err_price_0'));
      return;
    }

    if (!marketId) {
      setFormError(t('dashboard.err_select_market'));
      return;
    }

    setSubmitting(true);
    try {
      // 1 Quintal = 100 {t("units.kg")}
      const quantityQuintals = qty / 100;

      await createProduceLot({
        crop_id: parseInt(cropId),
        market_id: parseInt(marketId),
        quantity_quintals: quantityQuintals,
        quality_grade: qualityGrade,
        expected_price_per_quintal: price,
        status: 'Available'
      });

      setFormSuccess(t('fpo.success_lot_created'));
      
      // Refresh backend data
      const [updatedLots, updatedOffers] = await Promise.all([
        getMyProduceLots(effectiveUserId),
        getOffersReceived(effectiveUserId)
      ]);
      setMyLots(updatedLots);
      setReceivedOffers(updatedOffers);

      // Close modal after brief delay
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess('');
      }, 1200);

    } catch (err) {
      setFormError(err.message || t('fpo.err_create_lot'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOfferStatusChange = async (offerId, newStatus) => {
    setUpdatingOfferId(offerId);
    try {
      await updateOfferStatus(offerId, newStatus);
      // Refresh dashboard data
      const [updatedLots, updatedOffers] = await Promise.all([
        getMyProduceLots(effectiveUserId),
        getOffersReceived(effectiveUserId)
      ]);
      setMyLots(updatedLots);
      setReceivedOffers(updatedOffers);
    } catch (err) {
      alert(t('fpo.err_update_offer'));
    } finally {
      setUpdatingOfferId(null);
    }
  };


  // Metrics Calculations (using actual backend data)
  const activeLots = myLots.filter(l => l.status === 'Available' || l.status === 'Offer Received');
  const availableProduceQuintals = activeLots.reduce((sum, l) => sum + l.quantity_quintals, 0);
  const totalOffersReceived = receivedOffers.length;
  const completedSales = myLots.filter(l => l.status === 'Sold').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Dashboard Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-agrigreen-900 bg-agrigreen-500/20 px-2.5 py-1 rounded border border-emerald-300">{t("fpo.fpo_hub")}</span>
            <span className="text-xs font-medium text-text-secondary bg-surface-subtle px-2.5 py-1 rounded border border-border-subtle">{t("fpo.prototype_data")}</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mt-2">{t('fpo.fpo_hub')}</h1>
          <p className="text-text-secondary text-sm mt-1">{t("fpo.manage_produce")}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-agrigreen-700 hover:bg-agrigreen-900 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t("fpo.create_lot_btn")}</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Active Lots */}
        <div className="bg-surface-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-agrigreen-500/10 text-agrigreen-700 border border-agrigreen-500/30 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">{t("fpo.active_lots")}</div>
            <div className="text-2xl font-bold text-text-primary mt-0.5">{activeLots.length}</div>
            <div className="text-[11px] text-agrigreen-700 font-medium mt-0.5">{t("fpo.visible_to_buyers")}</div>
          </div>
        </div>

        {/* Card 2: Available Produce */}
        <div className="bg-surface-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-subtle text-text-primary border border-border-subtle flex items-center justify-center font-bold">
            <Layers className="w-6 h-6 text-text-primary" />
          </div>
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">{t('fpo.available_produce')}</div>
            <div className="text-2xl font-bold text-text-primary mt-0.5">
              {(availableProduceQuintals * 100).toLocaleString('en-IN')} <span className="text-sm font-normal text-text-secondary">{t("fpo.kg_unit")}</span>
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5">{availableProduceQuintals} Quintals</div>
          </div>
        </div>

        {/* Card 3: Offers Received */}
        <div className="bg-surface-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center font-bold">
            <Package className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">{t("fpo.offers_received")}</div>
            <div className="text-2xl font-bold text-text-primary mt-0.5">{totalOffersReceived}</div>
            <div className="text-[11px] text-blue-700 font-medium mt-0.5">{t("fpo.from_buyers")}</div>
          </div>
        </div>

        {/* Card 4: Completed Sales */}
        <div className="bg-surface-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-agrigreen-900 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6 text-agrigreen-500" />
          </div>
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">{t('fpo.completed_sales')}</div>
            <div className="text-2xl font-bold text-text-primary mt-0.5">{completedSales}</div>
            <div className="text-[11px] text-text-secondary mt-0.5">{t("fpo.accepted_deals")}</div>
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border-subtle gap-6">
        <button
          type="button"
          onClick={() => { setActiveTab('lots'); setSelectedLotForOffers(null); }}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'lots' && !selectedLotForOffers
              ? 'border-agrigreen-700 text-agrigreen-900'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('tabs.my_produce_lots')} ({myLots.length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('offers'); setSelectedLotForOffers(null); }}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            (activeTab === 'offers' || selectedLotForOffers) && activeTab !== 'transactions'
              ? 'border-agrigreen-700 text-agrigreen-900'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('tabs.all_offers_received')} ({receivedOffers.length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('transactions'); setSelectedLotForOffers(null); }}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'transactions'
              ? 'border-agrigreen-700 text-agrigreen-900'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('tabs.sales_transactions')} ({transactions.length})
        </button>
      </div>


      {/* Loading & Error Indicators */}
      {loading ? (
        <div className="py-12 text-center text-text-secondary font-medium flex justify-center items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-agrigreen-700" />
          <span>{t("fpo.loading_lots")}</span>
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">{t("fpo.notice")}</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: My Produce Lots */}
          {activeTab === 'lots' && !selectedLotForOffers && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-text-primary">{t("fpo.my_produce_lots")}</h2>
                <span className="text-xs text-text-secondary">
                  {myLots.length} lot{myLots.length !== 1 ? 's' : ''} listed
                </span>
              </div>

              {myLots.length === 0 ? (
                <div className="py-12 text-center text-text-secondary font-medium bg-surface-bg rounded-2xl border border-border-subtle border-dashed space-y-3">
                  <Package className="w-10 h-10 text-text-secondary mx-auto" />
                  <p>{t('fpo.no_lots_created')}</p>
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-agrigreen-700 hover:bg-agrigreen-900 text-white rounded-xl text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("fpo.create_lot_btn")}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myLots.map((lot) => {
                    const lotOffers = receivedOffers.filter(o => o.lot_id === lot.id);
                    const qtyKg = lot.quantity_quintals * 100;
                    
                    return (
                      <div 
                        key={lot.id} 
                        className="bg-surface-card rounded-2xl border border-border-subtle p-6 space-y-4 shadow-sm hover:border-agrigreen-500/50 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-agrigreen-700 bg-agrigreen-500/10 border border-agrigreen-500/30 px-2.5 py-0.5 rounded">
                              {t(`quality.${lot.quality_grade}`)}
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              lot.status === 'Available' ? 'bg-agrigreen-500/10 text-agrigreen-700 border-agrigreen-500/30' :
                              lot.status === 'Offer Received' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-surface-subtle text-text-primary border-border-subtle'
                            }`}>
                              {translateStatus(lot.status, t)}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-text-primary">{translateCrop(lot.crop_name, t)}</h3>

                          <div className="space-y-2 text-xs border-t border-border-subtle pt-3 text-text-secondary">
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary font-medium">{t("dashboard.quantity")}:</span>
                              <span className="font-bold text-text-primary">{qtyKg.toLocaleString('en-IN')} kg ({lot.quantity_quintals} {t("units.qtl")})</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary font-medium">{t("dashboard.expected_price")}:</span>
                              <span className="font-bold text-agrigreen-900">₹{lot.expected_price_per_quintal.toLocaleString('en-IN')} / {t("units.quintal")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary font-medium">{t("dashboard.market_location")}:</span>
                              <span className="font-medium text-text-primary">{translateMarket(lot.market_name, t)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                              <span className="text-text-secondary font-semibold">Offers Received:</span>
                              <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                                lotOffers.length > 0 ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'text-text-secondary'
                              }`}>
                                {lotOffers.length} offer{lotOffers.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                          <span className="text-[11px] text-text-secondary">
                            Lot #{lot.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLotForOffers(lot);
                              setActiveTab('offers');
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-agrigreen-700 hover:text-agrigreen-900 bg-agrigreen-500/10 hover:bg-agrigreen-500/20 px-3 py-1.5 rounded-lg border border-agrigreen-500/30/60 transition-colors"
                          >
                            <span>{t("fpo.view_offers")}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Offers Received */}
          {(activeTab === 'offers' || selectedLotForOffers) && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {selectedLotForOffers 
                      ? `Offers Received for ${translateCrop(selectedLotForOffers.crop_name, t)} (Lot #${selectedLotForOffers.id})`
                      : 'All Offers Received'
                    }
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">{t("fpo.review_offers_desc")}</p>
                </div>
                {selectedLotForOffers && (
                  <button
                    type="button"
                    onClick={() => setSelectedLotForOffers(null)}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-stone-200 px-3 py-1.5 rounded-lg self-start sm:self-auto"
                  >{t("fpo.show_all_offers")}</button>
                )}
              </div>

              {(() => {
                const displayOffers = selectedLotForOffers 
                  ? receivedOffers.filter(o => o.lot_id === selectedLotForOffers.id)
                  : receivedOffers;

                if (displayOffers.length === 0) {
                  return (
                    <div className="py-12 text-center text-text-secondary font-medium bg-surface-bg rounded-2xl border border-border-subtle border-dashed">{t("fpo.no_offers_lot")}<br />
                      <span className="text-xs text-text-secondary">{t("fpo.buyers_browsing")}</span>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {displayOffers.map((offer) => (
                      <div 
                        key={offer.id}
                        className="bg-surface-card rounded-2xl border border-border-subtle p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-bold text-lg text-text-primary">{translateCrop(offer.crop_name, t)}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              offer.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              offer.status === 'Accepted' ? 'bg-agrigreen-500/10 text-agrigreen-700 border-agrigreen-500/30' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {translateStatus(offer.status, t)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-text-secondary pt-2">
                            <div>
                              <span className="text-text-secondary font-medium block uppercase text-[10px]">{t("fpo.buyer_name")}</span>
                              <span className="font-bold text-text-primary text-sm">{translateRole(offer.farmer_name || 'Institutional Buyer A', t)}</span>
                            </div>
                            <div>
                              <span className="text-text-secondary font-medium block uppercase text-[10px]">{t("fpo.offered_qty")}</span>
                              <span className="font-bold text-text-primary text-sm">{offer.quantity} {t("units.quintal")} ({(offer.quantity * 100).toLocaleString('en-IN')} {t("units.kg")})</span>
                            </div>
                            <div>
                              <span className="text-text-secondary font-medium block uppercase text-[10px]">{t("buyer.offered_price")}</span>
                              <span className="font-bold text-agrigreen-700 text-sm">₹{offer.offered_price.toLocaleString('en-IN')} / {t("units.quintal")}</span>
                            </div>
                          </div>

                          {offer.message && (
                            <div className="bg-surface-bg p-3 rounded-xl border border-border-subtle text-xs text-text-primary mt-2">
                              <span className="font-semibold text-text-secondary">Note: </span>
                              "{offer.message}"
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-border-subtle pt-4 md:pt-0 md:pl-6 shrink-0">
                          {offer.status === 'Pending' ? (
                            <>
                              <button
                                type="button"
                                disabled={updatingOfferId === offer.id}
                                onClick={() => handleOfferStatusChange(offer.id, 'Accepted')}
                                className="px-4 py-2 bg-agrigreen-700 hover:bg-agrigreen-900 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                              >
                                <Check className="w-4 h-4" />
                                <span>{t("fpo.accept_offer")}</span>
                              </button>
                              <button
                                type="button"
                                disabled={updatingOfferId === offer.id}
                                onClick={() => handleOfferStatusChange(offer.id, 'Rejected')}
                                className="px-4 py-2 bg-surface-card border border-border-subtle hover:border-red-500 text-text-primary hover:text-red-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>{t("fpo.reject")}</span>
                              </button>
                            </>
                          ) : (
                            <div className="text-xs text-text-secondary font-medium text-right">
                              Status: <strong className="text-text-primary">{translateStatus(offer.status, t)}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}


          {/* TAB 3: Sales Transactions */}
          {activeTab === 'transactions' && (

            <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border-subtle flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-text-primary">{t("fpo.sales_txns")}</h2>
                  <p className="text-sm text-text-secondary">{t("fpo.track_sales")}</p>
                </div>
                <span className="text-xs font-semibold text-text-secondary bg-surface-subtle px-3 py-1 rounded-full border border-border-subtle">{t("buyer.demo_payment_tracking")}</span>
              </div>

              {transactions.length === 0 ? (
                <div className="py-12 text-center text-text-secondary text-sm bg-surface-bg border-b border-border-subtle">{t("fpo.no_sales_yet")}<br />
                  <span className="text-xs text-text-secondary">{t("fpo.txn_auto_created")}</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-text-primary">
                    <thead className="bg-surface-bg text-text-secondary uppercase font-semibold text-[11px] border-b border-border-subtle">
                      <tr>
                        <th className="px-5 py-3.5">{t("buyer.txn_id_crop")}</th>
                        <th className="px-5 py-3.5">{t("fpo.buyer")}</th>
                        <th className="px-5 py-3.5 text-right">{t("buyer.quantity")}</th>
                        <th className="px-5 py-3.5 text-right">{t("buyer.agreed_price")}</th>
                        <th className="px-5 py-3.5 text-right">{t("fpo.total_amount")}</th>
                        <th className="px-5 py-3.5 text-center">{t("buyer.payment_status")}</th>
                        <th className="px-5 py-3.5 text-center">{t("buyer.txn_status")}</th>
                        <th className="px-5 py-3.5 text-right">{t('dashboard.table_action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {transactions.map(txn => (
                        <tr key={txn.id} className="hover:bg-surface-bg/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-text-primary">{translateCrop(txn.crop_name, t)}</div>
                            <div className="text-[11px] font-mono text-text-secondary">#TXN-{txn.id} • {txn.quality_grade}</div>
                          </td>
                          <td className="px-5 py-4 font-semibold text-text-primary">{translateRole(txn.buyer_name, t)}</td>
                          <td className="px-5 py-4 text-right font-medium">{txn.quantity_quintals} {t("units.qtl")}</td>
                          <td className="px-5 py-4 text-right">₹{txn.agreed_price_per_quintal.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-4 text-right font-bold text-agrigreen-900">₹{txn.total_amount.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              txn.payment_status === 'Paid' ? 'bg-agrigreen-500/10 text-agrigreen-700 border-agrigreen-500/30' :
                              txn.payment_status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {translateStatus(txn.payment_status, t)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              txn.transaction_status === 'Completed' ? 'bg-agrigreen-500/10 text-agrigreen-700 border-agrigreen-500/30' :
                              'bg-surface-subtle text-text-primary border-border-subtle'
                            }`}>
                              {translateStatus(txn.transaction_status, t)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(txn)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-agrigreen-700 hover:text-agrigreen-900 bg-agrigreen-500/10 hover:bg-agrigreen-500/20 px-3 py-1.5 rounded-lg border border-agrigreen-500/30/60 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t("buyer.view_details")}</span>
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
        </>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onTransactionUpdated={(updatedTxn) => {
            setSelectedTransaction(updatedTxn);
            loadDashboardData();
          }}
        />
      )}


      {/* CREATE PRODUCE LOT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-surface-bg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-agrigreen-500/20 text-agrigreen-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">{t("fpo.create_lot_btn")}</h3>
                  <p className="text-xs text-text-secondary">{t("fpo.list_aggregated")}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCloseCreateModal}
                className="p-1 hover:bg-stone-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="overflow-y-auto p-6">
              {formSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-agrigreen-500 mx-auto" />
                  <h4 className="text-lg font-bold text-text-primary">{t("fpo.lot_created")}</h4>
                  <p className="text-sm text-text-secondary">{formSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleCreateLotSubmit} className="space-y-4">
                  
                  {/* Crop Select */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">{t("buyer.crop")}</label>
                    <select
                      value={cropId}
                      onChange={(e) => setCropId(e.target.value)}
                      className="w-full bg-surface-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                    >
                      <option value="">[ Select Crop ]</option>
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {t(`crops.${c.name.toLowerCase()}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Quality */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">{t("buyer.quantity")}</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="e.g. 500"
                          value={quantityKg}
                          onChange={(e) => setQuantityKg(e.target.value)}
                          className="w-full bg-surface-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none pr-10"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-text-secondary font-medium">{t("fpo.kg_unit")}</span>
                      </div>
                      {quantityKg && !isNaN(parseFloat(quantityKg)) && parseFloat(quantityKg) > 0 && (
                        <span className="text-[11px] text-text-secondary mt-1 block">
                          = {(parseFloat(quantityKg) / 100).toFixed(2)} Quintals
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">{t("dashboard.quality_grade")}</label>
                      <select
                        value={qualityGrade}
                        onChange={(e) => setQualityGrade(e.target.value)}
                        className="w-full bg-surface-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                      >
                        <option value="Grade A">{t("quality.Grade A")}</option>
                        <option value="Grade B">{t("quality.Grade B")}</option>
                        <option value="Grade C">{t("quality.Grade C")}</option>
                        <option value="Premium">{t("quality.Premium")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Expected Price */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">{t("buyer.expected_price")}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm text-text-secondary font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 2850"
                        value={expectedPrice}
                        onChange={(e) => setExpectedPrice(e.target.value)}
                        className="w-full bg-surface-bg border border-border-subtle rounded-xl pl-8 pr-24 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-text-secondary font-medium">
                        / {t("units.quintal")}
                      </span>
                    </div>
                  </div>

                  {/* Market / Location */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">{t("common.location")}</label>
                    <select
                      value={marketId}
                      onChange={(e) => setMarketId(e.target.value)}
                      className="w-full bg-surface-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                    >
                      <option value="">[ Select Market ]</option>
                      {markets.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.district}, {m.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Availability Badge */}
                  <div className="flex items-center justify-between bg-agrigreen-500/10 p-3 rounded-xl border border-agrigreen-500/30">
                    <span className="text-xs font-medium text-agrigreen-900">Availability Status:</span>
                    <span className="text-xs font-bold text-agrigreen-700 bg-surface-card px-2.5 py-0.5 rounded border border-emerald-300">{t("fpo.available")}</span>
                  </div>

                  {/* Form Error Feedback */}
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-agrigreen-700 hover:bg-agrigreen-900 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{t("fpo.creating_lot")}</span>
                        </>
                      ) : (
                        <span>{t("fpo.create_lot")}</span>
                      )}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
