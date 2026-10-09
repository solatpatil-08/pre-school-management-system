import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import {
  CreditCard,
  CheckCircle2,
  DollarSign,
  Printer,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Clock,
  Receipt,
  Baby,
  RefreshCw,
} from 'lucide-react';

const ParentFees = () => {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'due', 'cleared', 'history'
  const [selectedChildId, setSelectedChildId] = useState('ALL');

  // Modals
  const [selectedFee, setSelectedFee] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({
    amount: '',
    paymentMethod: 'Credit Card',
    cardNumber: '•••• •••• •••• 4242',
    cardHolder: 'Parent Name',
    expiry: '12/28',
    cvv: '982',
    upiId: 'parent@upi',
  });

  const { showToast } = useToast();

  // Fetch fees for parent's children
  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees?limit=100');
      if (res.data.success) {
        const feeData = res.data.fees || res.data.data?.fees || res.data.data || [];
        setFees(feeData);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load child fee records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment history for parent's children
  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const res = await api.get('/payments?limit=100');
      if (res.data.success) {
        const payData = res.data.payments || res.data.data?.payments || res.data.data || [];
        setPayments(payData);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load payment history', 'error');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchPayments();
  }, []);

  // Unique list of children from fees
  const childrenList = React.useMemo(() => {
    const map = new Map();
    fees.forEach((f) => {
      if (f.student?._id && !map.has(f.student._id)) {
        map.set(f.student._id, f.student);
      }
    });
    return Array.from(map.values());
  }, [fees]);

  // Filtered fees based on child and tab
  const filteredFees = React.useMemo(() => {
    return fees.filter((fee) => {
      if (selectedChildId !== 'ALL' && fee.student?._id !== selectedChildId) {
        return false;
      }
      const totalAmt = fee.amount !== undefined ? fee.amount : fee.totalAmount;
      const remainingAmt = fee.remainingAmount !== undefined ? fee.remainingAmount : Math.max(0, totalAmt - (fee.paidAmount || 0));

      if (activeTab === 'due') {
        return remainingAmt > 0;
      }
      if (activeTab === 'cleared') {
        return remainingAmt === 0 || fee.status === 'PAID';
      }
      return true;
    });
  }, [fees, selectedChildId, activeTab]);

  // Filtered payments based on child
  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      if (selectedChildId !== 'ALL' && p.student?._id !== selectedChildId) {
        return false;
      }
      return true;
    });
  }, [payments, selectedChildId]);

  // Overall calculations
  const totalBilled = fees.reduce(
    (sum, f) => sum + (f.amount !== undefined ? f.amount : f.totalAmount || 0),
    0
  );
  const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalDue = Math.max(0, totalBilled - totalPaid);

  const overdueCount = fees.filter(
    (f) =>
      f.status === 'OVERDUE' ||
      (new Date(f.dueDate) < new Date() &&
        (f.remainingAmount !== undefined ? f.remainingAmount : f.amount - f.paidAmount) > 0)
  ).length;

  // Open Checkout
  const handleOpenCheckout = (fee) => {
    setSelectedFee(fee);
    const totalAmt = fee.amount !== undefined ? fee.amount : fee.totalAmount;
    const balance = fee.remainingAmount !== undefined ? fee.remainingAmount : Math.max(0, totalAmt - (fee.paidAmount || 0));

    setCheckoutForm({
      amount: balance,
      paymentMethod: 'Credit Card',
      cardNumber: '•••• •••• •••• 4242',
      cardHolder: 'Parent Name',
      expiry: '12/28',
      cvv: '982',
      upiId: 'parent@upi',
    });
    setIsCheckoutOpen(true);
  };

  // Process Online Payment
  const handlePayOnline = async (e) => {
    e.preventDefault();
    const payAmt = Number(checkoutForm.amount);
    if (!payAmt || payAmt <= 0) {
      showToast('Please enter a valid payment amount', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/payments', {
        fee: selectedFee._id,
        amount: payAmt,
        paymentMethod: checkoutForm.paymentMethod,
        notes: `Paid online through Parent Portal (${checkoutForm.paymentMethod})`,
      });

      if (res.data.success) {
        showToast('Payment processed successfully!', 'success');
        setIsCheckoutOpen(false);
        const receipt = res.data.payment || res.data.receipt || res.data.data?.payment;
        setReceiptData(receipt);
        setIsReceiptOpen(true);
        fetchFees();
        fetchPayments();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment processing failed';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <span>Child Fees & Online Payments</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track tuition fee billings, settle balances securely, and view downloadable payment receipts.
          </p>
        </div>

        <button
          onClick={() => {
            fetchFees();
            fetchPayments();
          }}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all self-start sm:self-auto"
          title="Refresh fees"
        >
          <RefreshCw className={`w-4 h-4 ${loading || paymentsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Financial Overview Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{totalBilled.toLocaleString()}
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Across all registered children</span>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-100/80 shadow-sm bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Paid Amount</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-700 mt-2">
            ₹{totalPaid.toLocaleString()}
          </h3>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {totalBilled > 0 ? `${Math.round((totalPaid / totalBilled) * 100)}% settled` : '100%'}
          </span>
        </div>

        {/* Remaining Due */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100/80 shadow-sm bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Remaining Balance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={`text-2xl font-extrabold mt-2 ${
              totalDue > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            ₹{totalDue.toLocaleString()}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalDue > 0 ? 'Due across active terms' : 'All invoices cleared!'}
          </span>
        </div>

        {/* Status / Overdue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Health</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                overdueCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {overdueCount > 0 ? <AlertCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
          </div>
          <h3
            className={`text-2xl font-extrabold mt-2 ${
              overdueCount > 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {overdueCount > 0 ? `${overdueCount} Overdue` : 'Up to Date'}
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {overdueCount > 0 ? 'Please settle overdue items' : 'No overdue notices on file'}
          </span>
        </div>
      </div>

      {/* Child Filter Tabs (if more than 1 child) */}
      {childrenList.length > 1 && (
        <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-card flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 px-3 uppercase flex items-center gap-1.5">
            <Baby className="w-3.5 h-3.5" /> Child:
          </span>
          <button
            onClick={() => setSelectedChildId('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedChildId === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Children ({fees.length})
          </button>
          {childrenList.map((ch) => (
            <button
              key={ch._id}
              onClick={() => setSelectedChildId(ch._id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedChildId === ch._id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {ch.firstName} {ch.lastName}
            </button>
          ))}
        </div>
      )}

      {/* Main Tab Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'all'
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Invoices ({filteredFees.length})
        </button>
        <button
          onClick={() => setActiveTab('due')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'due'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Outstanding & Due
        </button>
        <button
          onClick={() => setActiveTab('cleared')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'cleared'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Paid in Full
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white shadow-sm shadow-slate-800/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Payment Receipts History ({filteredPayments.length})</span>
        </button>
      </div>

      {/* VIEW: Payment History or Fee Invoices */}
      {activeTab === 'history' ? (
        // PAYMENT HISTORY RECEIPTS
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Your Electronic Payment Receipts</h3>
            <span className="text-xs text-slate-400 font-semibold">{filteredPayments.length} Receipts</span>
          </div>

          {paymentsLoading ? (
            <LoadingSpinner text="Fetching your payment history..." />
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payments made yet"
              description="Payments completed via online checkout or the school counter will appear here with official downloadable vouchers."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Receipt #</th>
                    <th className="py-3.5 px-4">Child</th>
                    <th className="py-3.5 px-4">Fee Item</th>
                    <th className="py-3.5 px-4">Amount Paid</th>
                    <th className="py-3.5 px-4">Channel</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-6 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {filteredPayments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                        {p.receiptNumber}
                        <div className="text-[10px] text-slate-400 font-normal">{p.transactionId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {p.student?.firstName} {p.student?.lastName}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {p.fee?.feeType || 'Tuition'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">
                        ₹{p.amount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => {
                            setReceiptData(p);
                            setIsReceiptOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // INVOICES LIST
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner text="Fetching child fee statements..." />
          ) : filteredFees.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No fee statements matching selection"
              description="All bills are currently cleared or none have been assigned yet."
            />
          ) : (
            filteredFees.map((fee) => {
              const totalAmt = fee.amount !== undefined ? fee.amount : fee.totalAmount;
              const paidAmt = fee.paidAmount || 0;
              const remainingAmt = fee.remainingAmount !== undefined ? fee.remainingAmount : Math.max(0, totalAmt - paidAmt);
              const isOverdue = fee.status === 'OVERDUE' || (new Date(fee.dueDate) < new Date() && remainingAmt > 0);

              return (
                <div
                  key={fee._id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={fee.status} text={fee.status} />
                      <span className="text-xs font-bold text-slate-300">•</span>
                      <span className="text-xs font-bold text-primary-700 flex items-center gap-1">
                        <Baby className="w-3.5 h-3.5" />
                        {fee.student?.firstName} {fee.student?.lastName} ({fee.student?.class?.name || 'Class'})
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] uppercase border border-rose-200">
                          Overdue Notice
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">
                      {fee.title || `${fee.feeType} Fee`}
                    </h3>

                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                      <span>Category: <strong className="text-slate-700">{fee.feeType}</strong></span>
                      <span>•</span>
                      <span>Academic Year: <strong className="text-slate-700">{fee.academicYear || '2026-2027'}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due Date: <strong className={isOverdue ? 'text-rose-600' : 'text-slate-700'}>{new Date(fee.dueDate).toLocaleDateString()}</strong>
                      </span>
                    </div>

                    {fee.description && (
                      <p className="text-xs text-slate-500 pt-1 border-t border-slate-50">
                        {fee.description}
                      </p>
                    )}
                  </div>

                  {/* Financial Breakdown & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-5 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Balance Due
                      </span>
                      <span
                        className={`text-2xl font-extrabold ${
                          remainingAmt > 0
                            ? isOverdue
                              ? 'text-rose-600'
                              : 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        ₹{remainingAmt.toLocaleString()}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5 space-x-2">
                        <span>Billed: ₹{totalAmt?.toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">Paid: ₹{paidAmt.toLocaleString()}</span>
                      </div>
                    </div>

                    {remainingAmt > 0 ? (
                      <button
                        onClick={() => handleOpenCheckout(fee)}
                        className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Online Now</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Cleared</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONLINE CHECKOUT GATEWAY MODAL                                             */}
      {/* ========================================================================= */}
      {selectedFee && isCheckoutOpen && (
        <Modal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          title="Secure Tuition Payment Gateway"
          subtitle={`Child: ${selectedFee.student?.firstName} ${selectedFee.student?.lastName} • ${selectedFee.feeType}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handlePayOnline} className="space-y-4">
            {/* Invoice Breakdown Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold text-slate-800">{selectedFee.title || selectedFee.feeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-medium text-slate-700">
                  {new Date(selectedFee.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Outstanding Balance:</span>
                <span className="font-extrabold text-amber-700 text-sm">
                  ₹{(selectedFee.remainingAmount !== undefined
                    ? selectedFee.remainingAmount
                    : Math.max(0, (selectedFee.amount || selectedFee.totalAmount) - (selectedFee.paidAmount || 0))
                  )?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount to Pay (₹) *</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  max={
                    selectedFee.remainingAmount !== undefined
                      ? selectedFee.remainingAmount
                      : Math.max(0, (selectedFee.amount || selectedFee.totalAmount) - (selectedFee.paidAmount || 0))
                  }
                  required
                  value={checkoutForm.amount}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, amount: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                You can settle the full amount or make a partial installment.
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Payment Channel</label>
              <select
                value={checkoutForm.paymentMethod}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, paymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              >
                <option value="Credit Card">Credit Card (Visa / Mastercard / Amex)</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI Instant Pay (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Net Banking Wire</option>
              </select>
            </div>

            {/* Card / UPI simulator fields */}
            {checkoutForm.paymentMethod === 'UPI' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UPI ID *</label>
                <input
                  type="text"
                  required
                  value={checkoutForm.upiId}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, upiId: e.target.value })}
                  placeholder="name@okhdfcbank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:outline-none font-mono"
                />
              </div>
            ) : (
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    value={checkoutForm.cardNumber}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, cardNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Expiry</label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.expiry}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, expiry: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength="4"
                      required
                      value={checkoutForm.cvv}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, cvv: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Authorizing...' : `Pay ₹${checkoutForm.amount || 0} Securely`}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL RECEIPT CONFIRMATION MODAL                                       */}
      {/* ========================================================================= */}
      {isReceiptOpen && receiptData && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title="Payment Voucher"
          subtitle="Official Preschool Fee Receipt"
          maxWidth="max-w-md"
        >
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4">
            <div className="text-center pb-3 border-b border-slate-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Sunshine Kids Academy</h3>
              <p className="text-[11px] text-slate-400">Electronic Payment Receipt Confirmation</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                RECEIPT #{receiptData.receiptNumber}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Child Name:</span>
                <span className="font-bold text-slate-800">
                  {receiptData.student?.firstName} {receiptData.student?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Category:</span>
                <span className="font-semibold text-slate-700">
                  {receiptData.fee?.feeType || 'Tuition'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-700">{receiptData.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(receiptData.paymentDate || receiptData.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-700">{receiptData.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-800">Total Amount Paid:</span>
                <span className="text-base font-extrabold text-emerald-600">
                  ₹{receiptData.amount?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-800 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ParentFees;
