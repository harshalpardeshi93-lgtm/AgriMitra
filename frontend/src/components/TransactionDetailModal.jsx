import React, { useState } from 'react';
import { 
  X, CheckCircle2, Clock, CreditCard, ShieldCheck, 
  PackageCheck, IndianRupee, MapPin, User, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { updatePaymentStatus, updateTransactionStatus } from '../services/api';

/**
 * TransactionDetailModal Component
 * Shows details, timeline, and demo payment controls for a transaction.
 */
export default function TransactionDetailModal({ transaction, onClose, onTransactionUpdated }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  if (!transaction) return null;

  const handleUpdatePayment = async (newPaymentStatus) => {
    setUpdating(true);
    setError('');
    try {
      const updated = await updatePaymentStatus(transaction.id, newPaymentStatus);
      if (onTransactionUpdated) {
        onTransactionUpdated(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to update payment status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (newTxnStatus) => {
    setUpdating(true);
    setError('');
    try {
      const updated = await updateTransactionStatus(transaction.id, newTxnStatus);
      if (onTransactionUpdated) {
        onTransactionUpdated(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to update transaction status.');
    } finally {
      setUpdating(false);
    }
  };

  // Determine current timeline progress step
  // Timeline steps:
  // Step 1: Offer Accepted (Always completed)
  // Step 2: Transaction Confirmed (Always completed when txn exists)
  // Step 3: Payment Processing (When payment_status is Processing or Paid)
  // Step 4: Payment Completed (When payment_status is Paid)
  // Step 5: Transaction Completed (When transaction_status is Completed)

  const isStep3Done = transaction.payment_status === 'Processing' || transaction.payment_status === 'Paid';
  const isStep4Done = transaction.payment_status === 'Paid';
  const isStep5Done = transaction.transaction_status === 'Completed';

  const qtyKg = transaction.quantity_quintals * 100;

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-surface-bg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-agrigreen-500/20 text-agrigreen-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-text-primary text-base">Transaction Details</h3>
                <span className="text-[10px] font-semibold text-text-secondary bg-stone-200/80 px-2 py-0.5 rounded">
                  #TXN-{transaction.id}
                </span>
              </div>
              <p className="text-xs text-text-secondary">AgriMitra Direct Market Transaction</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">

          {/* Banner / Prototype Notice */}
          <div className="bg-agrigreen-500/10 border border-agrigreen-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-agrigreen-900 block">
                Agreed Total Amount
              </span>
              <div className="text-2xl font-bold text-agrigreen-900 mt-0.5">
                ₹{transaction.total_amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-text-secondary block">Demo Payment Tracking</span>
              <span className={`inline-block mt-1 text-xs font-bold px-3 py-1 rounded-full border ${
                transaction.payment_status === 'Paid' ? 'bg-agrigreen-500/20 text-agrigreen-700 border-emerald-300' :
                transaction.payment_status === 'Processing' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                Payment: {transaction.payment_status}
              </span>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="bg-surface-bg p-5 rounded-2xl border border-border-subtle space-y-3">
            <h4 className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
              Transaction Timeline
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs pt-1">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-agrigreen-500 text-white flex items-center justify-center font-bold mb-1 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="font-bold text-text-primary text-[11px]">Offer Accepted</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-agrigreen-500 text-white flex items-center justify-center font-bold mb-1 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="font-bold text-text-primary text-[11px]">Confirmed</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 shadow-sm ${
                  isStep3Done ? 'bg-agrigreen-500 text-white' : 'bg-stone-200 text-text-secondary'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <span className={`text-[11px] ${isStep3Done ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
                  Processing
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 shadow-sm ${
                  isStep4Done ? 'bg-agrigreen-500 text-white' : 'bg-stone-200 text-text-secondary'
                }`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className={`text-[11px] ${isStep4Done ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
                  Paid
                </span>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 shadow-sm ${
                  isStep5Done ? 'bg-agrigreen-500 text-white' : 'bg-stone-200 text-text-secondary'
                }`}>
                  <PackageCheck className="w-4 h-4" />
                </div>
                <span className={`text-[11px] ${isStep5Done ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
                  Completed
                </span>
              </div>

            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs text-text-primary">
            <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle space-y-1">
              <span className="text-text-secondary font-medium uppercase text-[10px]">Crop & Quality</span>
              <div className="font-bold text-text-primary text-sm">{transaction.crop_name}</div>
              <div className="text-text-secondary font-medium">{transaction.quality_grade}</div>
            </div>

            <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle space-y-1">
              <span className="text-text-secondary font-medium uppercase text-[10px]">Quantity</span>
              <div className="font-bold text-text-primary text-sm">{qtyKg.toLocaleString('en-IN')} kg</div>
              <div className="text-text-secondary font-medium">{transaction.quantity_quintals} Quintals</div>
            </div>

            <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle space-y-1">
              <span className="text-text-secondary font-medium uppercase text-[10px]">Agreed Price</span>
              <div className="font-bold text-agrigreen-900 text-sm">₹{transaction.agreed_price_per_quintal.toLocaleString('en-IN')} / qtl</div>
            </div>

            <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle space-y-1">
              <span className="text-text-secondary font-medium uppercase text-[10px]">Location</span>
              <div className="font-bold text-text-primary text-sm">{transaction.market_name}</div>
            </div>

            <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle space-y-1">
              <span className="text-text-secondary font-medium uppercase text-[10px]">Seller (Farmer/FPO)</span>
              <div className="font-bold text-text-primary text-sm">{transaction.farmer_name}</div>
            </div>

            <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle space-y-1">
              <span className="text-text-secondary font-medium uppercase text-[10px]">Buyer</span>
              <div className="font-bold text-text-primary text-sm">{transaction.buyer_name}</div>
            </div>
          </div>

          {/* Interactive Demo Payment Controls */}
          <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-agrigreen-500 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                Demo Payment Controls
              </h4>
              <span className="text-[10px] text-text-secondary">Prototype Actions</span>
            </div>

            {error && (
              <div className="text-xs text-red-400 font-semibold">{error}</div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              {transaction.payment_status === 'Pending' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdatePayment('Processing')}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>Mark Payment Processing</span>
                </button>
              )}

              {transaction.payment_status !== 'Paid' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdatePayment('Paid')}
                  className="px-4 py-2 bg-agrigreen-500 hover:bg-agrigreen-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Mark as Paid (Demo)</span>
                </button>
              )}

              {transaction.payment_status === 'Paid' && (
                <div className="text-xs font-bold text-agrigreen-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-agrigreen-500" />
                  <span>Payment completed & transaction closed</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
