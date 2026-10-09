import React from 'react';
import { CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';

const FeeChart = ({ data = {} }) => {
  const {
    totalExpected = 0,
    totalCollected = 0,
    totalPending = 0,
    totalOverdue = 0,
    collectionRate = 0,
    paymentMethods = [],
  } = data;

  const collectedPct = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;
  const pendingPct = totalExpected > 0 ? Math.min(100, Math.round((totalPending / totalExpected) * 100)) : 0;
  const overduePct = totalExpected > 0 ? Math.min(100, Math.round((totalOverdue / totalExpected) * 100)) : 0;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Fee Collection Overview</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time tuition revenues, pending dues & overdue balances</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Recovery Rate:</span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              {collectionRate}%
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="my-4">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-700">Total Billed: ₹{totalExpected.toLocaleString('en-IN')}</span>
            <span className="text-emerald-700 font-extrabold">{collectedPct}% Collected</span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${collectedPct}%` }}
              title={`Collected: ₹${totalCollected} (${collectedPct}%)`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${pendingPct}%` }}
              title={`Pending: ₹${totalPending} (${pendingPct}%)`}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${overduePct}%` }}
              title={`Overdue: ₹${totalOverdue} (${overduePct}%)`}
            />
          </div>

          {/* Segment Legend */}
          <div className="flex items-center justify-between text-[11px] font-semibold mt-2.5 text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Collected (₹{totalCollected.toLocaleString('en-IN')})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Pending (₹{totalPending.toLocaleString('en-IN')})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Overdue (₹{totalOverdue.toLocaleString('en-IN')})</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Collected</span>
            <p className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5">
              ₹{totalCollected.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending</span>
            <p className="text-lg sm:text-xl font-black text-amber-800 mt-0.5">
              ₹{totalPending.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Overdue</span>
            <p className="text-lg sm:text-xl font-black text-rose-800 mt-0.5">
              ₹{totalOverdue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Payment Methods breakdown if any */}
        {paymentMethods && paymentMethods.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Payment Channels Used
            </span>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((pm) => (
                <span
                  key={pm.method}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <CreditCard className="w-3 h-3 text-emerald-600" />
                  {pm.method}: <strong className="text-slate-900">₹{pm.amount?.toLocaleString('en-IN')}</strong>
                  <span className="text-slate-400 text-[10px]">({pm.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Includes term tuition, admission, and activity fees</span>
        <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
          Active ledger <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

export default FeeChart;
