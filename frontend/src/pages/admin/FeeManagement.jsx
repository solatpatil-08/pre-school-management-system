import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  CreditCard,
  Plus,
  Search,
  Receipt,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  User,
  School,
  X,
} from 'lucide-react';

const FeeManagement = () => {
  // State: Tab & View
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'overdue', 'paid', 'history'

  // State: Data
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Payments Pagination
  const [payPage, setPayPage] = useState(1);
  const [payTotalPages, setPayTotalPages] = useState(1);
  const [payTotalItems, setPayTotalItems] = useState(0);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    overdueCount: 0,
    pendingCount: 0,
    partialCount: 0,
    paidCount: 0,
  });

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active records for modals
  const [selectedFee, setSelectedFee] = useState(null);
  const [viewFeeDetails, setViewFeeDetails] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State: Add Fee
  const [assignMode, setAssignMode] = useState('student'); // 'student' or 'class'
  const [feeForm, setFeeForm] = useState({
    student: '',
    classId: '',
    feeType: 'Tuition',
    amount: '',
    dueDate: '',
    academicYear: '2026-2027',
    description: '',
    title: '',
  });

  // Form State: Edit Fee
  const [editForm, setEditForm] = useState({
    feeType: 'Tuition',
    amount: '',
    dueDate: '',
    academicYear: '2026-2027',
    description: '',
    title: '',
  });

  // Form State: Record Payment
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: '',
  });

  const { showToast } = useToast();

  // Fetch initial classes and students for dropdowns
  const fetchDependencies = async () => {
    try {
      const [classRes, studentRes] = await Promise.all([
        api.get('/classes?status=Active'),
        api.get('/students?limit=300&status=Active'),
      ]);
      if (classRes.data?.data) {
        setClasses(Array.isArray(classRes.data.data) ? classRes.data.data : classRes.data.data.classes || []);
      }
      if (studentRes.data?.data) {
        setStudents(Array.isArray(studentRes.data.data) ? studentRes.data.data : studentRes.data.data.students || []);
      }
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    }
  };

  // Fetch fees with active filters & pagination
  const fetchFees = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedType) params.append('feeType', selectedType);
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedAcademicYear) params.append('academicYear', selectedAcademicYear);

      // Tab-specific filters
      if (activeTab === 'pending') {
        params.append('status', 'PENDING');
      } else if (activeTab === 'overdue') {
        params.append('status', 'OVERDUE');
      } else if (activeTab === 'paid') {
        params.append('status', 'PAID');
      } else if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      const res = await api.get(`/fees?${params.toString()}`);
      if (res.data.success) {
        const feesData = res.data.fees || res.data.data?.fees || res.data.data || [];
        setFees(feesData);
        setCurrentPage(res.data.page || res.data.data?.page || page);
        setTotalPages(res.data.pages || res.data.data?.pages || 1);
        setTotalItems(res.data.total || res.data.data?.total || feesData.length);
        if (res.data.metrics || res.data.data?.metrics) {
          setMetrics(res.data.metrics || res.data.data?.metrics);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load fee records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment transactions history
  const fetchPayments = async (page = 1) => {
    try {
      setPaymentsLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 12);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/payments?${params.toString()}`);
      if (res.data.success) {
        const payData = res.data.payments || res.data.data?.payments || res.data.data || [];
        setPayments(payData);
        setPayPage(res.data.page || res.data.data?.page || page);
        setPayTotalPages(res.data.pages || res.data.data?.pages || 1);
        setPayTotalItems(res.data.total || res.data.data?.total || payData.length);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load payment history', 'error');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPayments(1);
    } else {
      fetchFees(1);
    }
  }, [activeTab, selectedStatus, selectedType, selectedClass, selectedAcademicYear]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'history') {
        fetchPayments(1);
      } else {
        fetchFees(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open Add Fee Modal
  const handleOpenAdd = () => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 15);
    setFeeForm({
      student: students[0]?._id || '',
      classId: classes[0]?._id || '',
      feeType: 'Tuition',
      amount: 1200,
      dueDate: defaultDueDate.toISOString().split('T')[0],
      academicYear: '2026-2027',
      description: 'Standard tuition invoice and educational materials pass',
      title: 'Term 1 Tuition Fee',
    });
    setAssignMode('student');
    setIsAddOpen(true);
  };

  // Submit Add Fee
  const handleCreateFee = async (e) => {
    e.preventDefault();
    const feeAmt = Number(feeForm.amount);
    if (!feeAmt || feeAmt <= 0) {
      showToast('Please provide a valid fee amount', 'warning');
      return;
    }
    if (!feeForm.dueDate) {
      showToast('Please provide a valid due date', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        feeType: feeForm.feeType,
        amount: feeAmt,
        dueDate: feeForm.dueDate,
        academicYear: feeForm.academicYear,
        description: feeForm.description,
        title: feeForm.title || `${feeForm.feeType} Fee`,
      };

      if (assignMode === 'class') {
        payload.classId = feeForm.classId;
      } else {
        payload.student = feeForm.student;
      }

      const res = await api.post('/fees', payload);
      if (res.data.success) {
        showToast(res.data.message || 'Fee invoice generated successfully!', 'success');
        setIsAddOpen(false);
        fetchFees(1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create fee invoice';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (fee) => {
    setSelectedFee(fee);
    setEditForm({
      feeType: fee.feeType || 'Tuition',
      amount: fee.amount !== undefined ? fee.amount : fee.totalAmount,
      dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : '',
      academicYear: fee.academicYear || '2026-2027',
      description: fee.description || '',
      title: fee.title || '',
    });
    setIsEditOpen(true);
  };

  // Submit Edit Fee
  const handleUpdateFee = async (e) => {
    e.preventDefault();
    if (!editForm.amount || Number(editForm.amount) < 0) {
      showToast('Please specify a positive fee amount', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.put(`/fees/${selectedFee._id}`, {
        feeType: editForm.feeType,
        amount: Number(editForm.amount),
        dueDate: editForm.dueDate,
        academicYear: editForm.academicYear,
        description: editForm.description,
        title: editForm.title,
      });

      if (res.data.success) {
        showToast('Fee invoice updated successfully', 'success');
        setIsEditOpen(false);
        fetchFees(currentPage);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update fee';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open View Fee Modal
  const handleOpenView = async (fee) => {
    setSelectedFee(fee);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/fees/${fee._id}`);
      if (res.data.success) {
        setViewFeeDetails(res.data.fee || res.data.data?.fee || res.data.data);
      }
    } catch (err) {
      console.error('Error fetching fee details:', err);
    }
  };

  // Open Record Payment Modal
  const handleOpenPay = (fee) => {
    setSelectedFee(fee);
    const amt = fee.amount !== undefined ? fee.amount : fee.totalAmount;
    const remaining = fee.remainingAmount !== undefined ? fee.remainingAmount : Math.max(0, amt - (fee.paidAmount || 0));

    setPayForm({
      amount: remaining,
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: `TXN-${Date.now().toString().slice(-6)}`,
      notes: `Payment for ${fee.feeType} fee`,
    });
    setIsPayOpen(true);
  };

  // Submit Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const payAmt = Number(payForm.amount);
    if (!payAmt || payAmt <= 0) {
      showToast('Payment amount must be greater than zero', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.post('/payments', {
        fee: selectedFee._id,
        amount: payAmt,
        paymentMethod: payForm.paymentMethod,
        paymentDate: payForm.paymentDate,
        transactionId: payForm.transactionId || undefined,
        notes: payForm.notes,
      });

      if (res.data.success) {
        showToast('Payment recorded and receipt generated!', 'success');
        setIsPayOpen(false);
        const receipt = res.data.payment || res.data.receipt || res.data.data?.payment;
        setSelectedReceipt(receipt);
        setIsReceiptOpen(true);
        fetchFees(currentPage);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment processing failed';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Confirm
  const handleOpenDelete = (fee) => {
    setSelectedFee(fee);
    setIsDeleteOpen(true);
  };

  // Submit Delete
  const handleDeleteFee = async () => {
    try {
      setFormSubmitting(true);
      const res = await api.delete(`/fees/${selectedFee._id}`);
      if (res.data.success) {
        showToast('Fee record deleted successfully', 'success');
        setIsDeleteOpen(false);
        fetchFees(currentPage);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete fee record';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedType('');
    setSelectedClass('');
    setSelectedAcademicYear('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <span>Fees & Payment Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete billing overview, payment collection, fee adjustments, and receipt management.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => (activeTab === 'history' ? fetchPayments(payPage) : fetchFees(currentPage))}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading || paymentsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate / Assign Fee</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card relative overflow-hidden group hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Billed Fees</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
            ${(metrics.totalBilled || 0).toLocaleString()}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>Academic Year 2026-2027</span>
            <span className="font-semibold text-slate-700">{totalItems} Invoices</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-100/70 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-700 mt-2">
            ${(metrics.totalCollected || 0).toLocaleString()}
          </h3>
          <div className="mt-2 pt-2 border-t border-emerald-50 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-semibold">
              {metrics.totalBilled > 0
                ? `${Math.round((metrics.totalCollected / metrics.totalBilled) * 100)}% collected`
                : '100%'}
            </span>
            <span className="text-emerald-700 font-bold">{metrics.paidCount || 0} Cleared</span>
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100/70 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Balances</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-amber-700 mt-2">
            ${(metrics.totalPending || 0).toLocaleString()}
          </h3>
          <div className="mt-2 pt-2 border-t border-amber-50 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 font-semibold">{metrics.pendingCount || 0} Pending</span>
            <span className="text-indigo-600 font-semibold">{metrics.partialCount || 0} Partial</span>
          </div>
        </div>

        {/* Total Overdue */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100/70 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-all bg-gradient-to-br from-white to-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Overdue Balances</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-rose-700 mt-2">
            ${(metrics.totalOverdue || 0).toLocaleString()}
          </h3>
          <div className="mt-2 pt-2 border-t border-rose-50 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 font-bold">{metrics.overdueCount || 0} Invoices Overdue</span>
            <span className="text-slate-400 font-medium">Immediate follow-up</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>All Invoices</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {totalItems}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pending Fees</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
            {metrics.pendingCount || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Overdue Fees</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'overdue' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800 font-bold'}`}>
            {metrics.overdueCount || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'paid'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Paid in Full</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'paid' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            {metrics.paidCount || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white shadow-sm shadow-slate-800/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Payment History Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'history' ? "Search transaction ID, receipt #, or student..." : "Search student name, ID, or fee description..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeTab !== 'history' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter (only shown in All tab) */}
            {activeTab === 'all' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">All Statuses</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            )}

            {/* Fee Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">All Fee Types</option>
              <option value="Tuition">Tuition</option>
              <option value="Admission">Admission</option>
              <option value="Transport">Transport</option>
              <option value="Meals">Meals & Nutrition</option>
              <option value="Activities">Activities</option>
              <option value="Uniform">Uniform</option>
              <option value="Examination">Examination</option>
              <option value="Books">Books & Stationary</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {(selectedStatus || selectedType || selectedClass || selectedAcademicYear) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main View: Invoices Table or Payment History */}
      {activeTab === 'history' ? (
        // PAYMENT HISTORY LOG TABLE
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-800">Recorded Payment Transactions</h2>
            </div>
            <span className="text-xs text-slate-500">{payTotalItems} Total Records</span>
          </div>

          {paymentsLoading ? (
            <LoadingSpinner text="Fetching payment audit records..." />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payments recorded yet"
              description="Record a fee installment to see official transactions and print receipt vouchers."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Receipt / Txn ID</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Fee Category</th>
                    <th className="py-3.5 px-4">Amount Paid</th>
                    <th className="py-3.5 px-4">Channel</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Received By</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {p.receiptNumber || 'N/A'}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.transactionId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {p.student?.firstName} {p.student?.lastName}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {p.student?.studentId} • {p.student?.class?.name || 'Class'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {p.fee?.feeType || 'Tuition'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-600 text-sm">
                          ${(p.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {p.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {p.receivedBy?.name || 'Admin'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedReceipt(p);
                            setIsReceiptOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs shadow-sm transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!paymentsLoading && payTotalPages > 1 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={payPage}
                totalPages={payTotalPages}
                onPageChange={(p) => fetchPayments(p)}
              />
            </div>
          )}
        </div>
      ) : (
        // INVOICES TABLE
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          {loading ? (
            <LoadingSpinner text="Fetching fee invoice records..." />
          ) : fees.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No fee records match the criteria"
              description="Assign fee structures to students or classes to track tuition collections."
              actionText="Generate Fee Invoice"
              onAction={handleOpenAdd}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Student</th>
                    <th className="py-3.5 px-4">Fee Type & Term</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Paid</th>
                    <th className="py-3.5 px-4">Remaining</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {fees.map((fee) => {
                    const totalAmt = fee.amount !== undefined ? fee.amount : fee.totalAmount;
                    const paidAmt = fee.paidAmount || 0;
                    const remainingAmt = fee.remainingAmount !== undefined ? fee.remainingAmount : Math.max(0, totalAmt - paidAmt);
                    const isOverdue = fee.status === 'OVERDUE' || (new Date(fee.dueDate) < new Date() && remainingAmt > 0);

                    return (
                      <tr key={fee._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900 text-sm">
                            {fee.student?.firstName} {fee.student?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {fee.student?.studentId} • {fee.student?.class?.name || 'Class N/A'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">{fee.feeType}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{fee.academicYear || '2026-2027'}</p>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                          ${totalAmt?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          ${paidAmt?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`font-extrabold ${
                              remainingAmt === 0
                                ? 'text-slate-400'
                                : isOverdue
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}
                          >
                            ${remainingAmt?.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(fee.dueDate).toLocaleDateString()}</span>
                          </div>
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                              Past Due
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={fee.status} text={fee.status} />
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Record Payment Button */}
                            {remainingAmt > 0 && (
                              <button
                                onClick={() => handleOpenPay(fee)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1"
                                title="Record payment"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Pay</span>
                              </button>
                            )}

                            {/* View Button */}
                            <button
                              onClick={() => handleOpenView(fee)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
                              title="View invoice & payments"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(fee)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
                              title="Edit fee"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleOpenDelete(fee)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all"
                              title="Delete fee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => fetchFees(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / ASSIGN FEE                                                 */}
      {/* ========================================================================= */}
      {isAddOpen && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Generate Fee Invoice"
          subtitle="Assign tuition or activity fee structure to students or full classes"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateFee} className="space-y-4">
            {/* Assignment Mode Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Assignment Mode</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAssignMode('student')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    assignMode === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Single Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode('class')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    assignMode === 'class' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Entire Class Batch</span>
                </button>
              </div>
            </div>

            {/* Target Selector */}
            {assignMode === 'student' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Student *</label>
                <select
                  required
                  value={feeForm.student}
                  onChange={(e) => setFeeForm({ ...feeForm, student: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.firstName} {st.lastName} ({st.studentId} - {st.class?.name || 'Class'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Class *</label>
                <select
                  required
                  value={feeForm.classId}
                  onChange={(e) => setFeeForm({ ...feeForm, classId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.section}) - {c.capacity} capacity
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Individual fee invoices will be generated for every enrolled student in this class.
                </p>
              </div>
            )}

            {/* Fee Type & Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fee Category *</label>
                <select
                  value={feeForm.feeType}
                  onChange={(e) => setFeeForm({ ...feeForm, feeType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="Tuition">Tuition</option>
                  <option value="Admission">Admission</option>
                  <option value="Transport">Transport</option>
                  <option value="Meals">Meals & Snacks</option>
                  <option value="Activities">Activities & Excursions</option>
                  <option value="Uniform">Uniform</option>
                  <option value="Examination">Examination</option>
                  <option value="Books">Books & Learning Kits</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Academic Year</label>
                <input
                  type="text"
                  value={feeForm.academicYear}
                  onChange={(e) => setFeeForm({ ...feeForm, academicYear: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. 2026-2027"
                />
              </div>
            </div>

            {/* Amount & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Amount ($) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    placeholder="1200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={feeForm.dueDate}
                  onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Invoice Title (Optional)</label>
              <input
                type="text"
                value={feeForm.title}
                onChange={(e) => setFeeForm({ ...feeForm, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. Fall Term 2026 Tuition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Notes</label>
              <textarea
                rows="2"
                value={feeForm.description}
                onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="Details of what this fee covers..."
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all flex items-center gap-1.5"
              >
                {formSubmitting ? 'Generating...' : 'Confirm & Invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT FEE                                                         */}
      {/* ========================================================================= */}
      {isEditOpen && selectedFee && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Fee Invoice"
          subtitle={`Student: ${selectedFee.student?.firstName} ${selectedFee.student?.lastName} (${selectedFee.student?.studentId})`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleUpdateFee} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fee Category</label>
                <select
                  value={editForm.feeType}
                  onChange={(e) => setEditForm({ ...editForm, feeType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="Tuition">Tuition</option>
                  <option value="Admission">Admission</option>
                  <option value="Transport">Transport</option>
                  <option value="Meals">Meals & Snacks</option>
                  <option value="Activities">Activities</option>
                  <option value="Uniform">Uniform</option>
                  <option value="Examination">Examination</option>
                  <option value="Books">Books</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Academic Year</label>
                <input
                  type="text"
                  value={editForm.academicYear}
                  onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Amount ($)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={selectedFee.paidAmount || 0}
                    step="0.01"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Cannot be less than paid (${selectedFee.paidAmount || 0})</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Notes</label>
              <textarea
                rows="2"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all flex items-center gap-1.5"
              >
                {formSubmitting ? 'Saving...' : 'Update Fee Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW FEE DETAILS & AUDIT TRAIL                                   */}
      {/* ========================================================================= */}
      {isViewOpen && selectedFee && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title="Fee Invoice Details"
          subtitle={`Invoice #${selectedFee._id?.slice(-8).toUpperCase()}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Top Student Header Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">
                  {selectedFee.student?.firstName?.[0]}
                  {selectedFee.student?.lastName?.[0]}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {selectedFee.student?.firstName} {selectedFee.student?.lastName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    ID: {selectedFee.student?.studentId} • Class: {selectedFee.student?.class?.name || 'Class'}
                  </p>
                  {selectedFee.student?.parent && (
                    <p className="text-[11px] text-slate-400">
                      Parent: {selectedFee.student?.parent?.firstName} {selectedFee.student?.parent?.lastName} ({selectedFee.student?.parent?.phone})
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={selectedFee.status} text={selectedFee.status} />
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</span>
                <p className="text-lg font-extrabold text-slate-900 mt-1">
                  ${(selectedFee.amount !== undefined ? selectedFee.amount : selectedFee.totalAmount)?.toLocaleString()}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Paid Amount</span>
                <p className="text-lg font-extrabold text-emerald-800 mt-1">
                  ${(selectedFee.paidAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Remaining Due</span>
                <p className="text-lg font-extrabold text-amber-800 mt-1">
                  ${(selectedFee.remainingAmount !== undefined
                    ? selectedFee.remainingAmount
                    : Math.max(0, (selectedFee.amount || selectedFee.totalAmount) - (selectedFee.paidAmount || 0))
                  )?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Category:</span>
                <span className="font-bold text-slate-800">{selectedFee.feeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Academic Year:</span>
                <span className="font-medium text-slate-800">{selectedFee.academicYear || '2026-2027'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedFee.dueDate).toLocaleDateString()}
                </span>
              </div>
              {selectedFee.description && (
                <div className="pt-2 border-t border-slate-100 text-slate-600">
                  <span className="text-slate-400 font-semibold block mb-0.5">Notes:</span>
                  {selectedFee.description}
                </div>
              )}
            </div>

            {/* Payments History for this Fee */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Recorded Payments for this Invoice
              </h4>
              {!viewFeeDetails?.payments || viewFeeDetails.payments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No payment transactions recorded for this invoice yet.
                </div>
              ) : (
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Receipt</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Method</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {viewFeeDetails.payments.map((p) => (
                        <tr key={p._id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {p.receiptNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-600">
                            ${p.amount}
                          </td>
                          <td className="py-2.5 px-3">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedReceipt(p);
                                setIsReceiptOpen(true);
                              }}
                              className="text-primary-600 hover:text-primary-800 font-bold text-xs"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedFee.status !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewOpen(false);
                      handleOpenPay(selectedFee);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsViewOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD PAYMENT                                                   */}
      {/* ========================================================================= */}
      {isPayOpen && selectedFee && (
        <Modal
          isOpen={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          title="Record Fee Payment"
          subtitle={`Student: ${selectedFee.student?.firstName} ${selectedFee.student?.lastName} • ${selectedFee.feeType} Fee`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {/* Balance Preview Card */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Total Invoiced:</span>
                <span className="font-bold text-slate-800">
                  ${(selectedFee.amount !== undefined ? selectedFee.amount : selectedFee.totalAmount)?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Already Paid:</span>
                <span className="font-bold text-emerald-700">${(selectedFee.paidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-emerald-200">
                <span className="text-emerald-900 font-bold">Outstanding Remaining:</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  ${(selectedFee.remainingAmount !== undefined
                    ? selectedFee.remainingAmount
                    : Math.max(0, (selectedFee.amount || selectedFee.totalAmount) - (selectedFee.paidAmount || 0))
                  )?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quick Action */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setPayForm({
                    ...payForm,
                    amount:
                      selectedFee.remainingAmount !== undefined
                        ? selectedFee.remainingAmount
                        : Math.max(0, (selectedFee.amount || selectedFee.totalAmount) - (selectedFee.paidAmount || 0)),
                  })
                }
                className="text-xs font-bold text-primary-600 hover:text-primary-700 underline"
              >
                Pay Full Outstanding Balance
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Amount ($) *</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={
                    selectedFee.remainingAmount !== undefined
                      ? selectedFee.remainingAmount
                      : Math.max(0, (selectedFee.amount || selectedFee.totalAmount) - (selectedFee.paidAmount || 0))
                  }
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction ID</label>
              <input
                type="text"
                value={payForm.transactionId}
                onChange={(e) => setPayForm({ ...payForm, transactionId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                placeholder="TXN-XXXXXX"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Remarks</label>
              <input
                type="text"
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                placeholder="e.g. Paid at administrative counter"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPayOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{formSubmitting ? 'Recording...' : `Record $${payForm.amount || 0}`}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: OFFICIAL PRINTABLE RECEIPT                                       */}
      {/* ========================================================================= */}
      {isReceiptOpen && selectedReceipt && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title="Payment Receipt"
          subtitle="Official Fee Collection Voucher"
          maxWidth="max-w-md"
        >
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4">
            {/* Header branding */}
            <div className="text-center pb-3 border-b border-slate-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Sunshine Kids Academy</h3>
              <p className="text-[11px] text-slate-500">Official Payment Receipt & Voucher</p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                RECEIPT #{selectedReceipt.receiptNumber}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-800">
                  {selectedReceipt.student?.firstName} {selectedReceipt.student?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student ID / Class:</span>
                <span className="font-medium text-slate-700">
                  {selectedReceipt.student?.studentId} • {selectedReceipt.student?.class?.name || 'Class'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-700">{selectedReceipt.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(selectedReceipt.paymentDate || selectedReceipt.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-semibold text-slate-700">{selectedReceipt.paymentMethod}</span>
              </div>
              {selectedReceipt.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Notes:</span>
                  <span className="text-slate-700 italic">{selectedReceipt.notes}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-800">Amount Paid:</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  ${selectedReceipt.amount?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
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

      {/* ========================================================================= */}
      {/* MODAL 6: DELETE CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {isDeleteOpen && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteFee}
          title="Delete Fee Invoice"
          message={`Are you sure you want to delete this ${selectedFee?.feeType} fee invoice for ${selectedFee?.student?.firstName} ${selectedFee?.student?.lastName}? All associated payment records will also be permanently deleted.`}
          confirmText={formSubmitting ? 'Deleting...' : 'Delete Permanently'}
          variant="danger"
        />
      )}
    </div>
  );
};

export default FeeManagement;
