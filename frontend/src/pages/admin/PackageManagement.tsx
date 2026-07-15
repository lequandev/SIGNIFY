import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Package, Check, X, DollarSign, Clock, Zap, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const PackageManagement = () => {
  const { showToast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string } | null>(null);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: 0,
    durationDays: 30,
    aiLimitPerDay: 10,
    planType: 'individual'
  });

  const [activeTab, setActiveTab] = useState<'all' | 'individual' | 'business'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('date');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filteredPackages = packages
    .filter((pkg) => {
      const matchesTab = activeTab === 'all' || pkg.planType === activeTab;
      const matchesSearch = 
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'price') {
        const priceA = a.price ? Number(a.price.toString().replace(/,/g, '')) : 0;
        const priceB = b.price ? Number(b.price.toString().replace(/,/g, '')) : 0;
        return priceA - priceB;
      }
      return 0;
    });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/v1/service-packages');
      setPackages(response.data);
    } catch (err) {
      console.error('Failed to fetch packages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await api.put(`/v1/service-packages/${editingPackage.id}`, newPackage);
      } else {
        await api.post('/v1/service-packages', newPackage);
      }
      setShowAddModal(false);
      setEditingPackage(null);
      resetForm();
      fetchPackages();
      showToast(editingPackage ? 'Package updated successfully' : 'Package created successfully', 'success');
    } catch (err: any) {
      console.error('Failed to save package', err);
      showToast(err.response?.data?.message || 'Failed to save package', 'error');
    }
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setNewPackage({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price ? Number(pkg.price.toString().replace(/,/g, '')) : 0,
      durationDays: pkg.durationDays || 30,
      aiLimitPerDay: pkg.aiLimitPerDay || 10,
      planType: pkg.planType || 'individual'
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/v1/service-packages/${id}`);
      fetchPackages();
      showToast('Package deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete package', err);
      showToast(err.response?.data?.message || 'Failed to delete package', 'error');
    }
  };

  const resetForm = () => {
    setNewPackage({
      name: '',
      description: '',
      price: 0,
      durationDays: 30,
      aiLimitPerDay: 10,
      planType: 'individual'
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Package Management</h1>
          <p className="text-slate-500 font-medium">Create and manage subscription plans for your users.</p>
        </div>

        <button
          onClick={() => {
            setEditingPackage(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1E40AF] transition-all shadow-xl shadow-[#2563EB]/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add New Package
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-fade-in">
        <div className="inline-flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'all'
                ? 'bg-white text-[#2563EB] shadow-md shadow-[#2563EB]/5'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            All Plans
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'individual'
                ? 'bg-white text-[#2563EB] shadow-md shadow-[#2563EB]/5'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'business'
                ? 'bg-white text-[#2563EB] shadow-md shadow-[#2563EB]/5'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Business
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 flex-grow md:flex-grow-0 md:max-w-xl w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search plans..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-auto z-30">
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full sm:w-auto flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 hover:bg-slate-100/70 hover:border-slate-300 transition-all group font-bold text-sm text-slate-700"
            >
              <div className="flex items-center">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors mr-2" />
                <span>
                  {sortBy === 'date' && 'Sort by Date'}
                  {sortBy === 'name' && 'Sort by Name'}
                  {sortBy === 'price' && 'Sort by Price'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 ml-8 transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-slate-600' : ''}`} />
            </button>

            {isSortOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setIsSortOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('date');
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      sortBy === 'date'
                        ? 'bg-blue-50 text-[#2563EB]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Sort by Date
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('name');
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      sortBy === 'name'
                        ? 'bg-blue-50 text-[#2563EB]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Sort by Name
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('price');
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      sortBy === 'price'
                        ? 'bg-blue-50 text-[#2563EB]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Sort by Price
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">Loading packages...</div>
        ) : filteredPackages.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold italic text-center">No packages found.</div>
        ) : filteredPackages.map((pkg, idx) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group"
          >
            <div className="p-8 border-b border-slate-50">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(pkg)} className="p-2 text-slate-300 hover:text-[#2563EB] transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteModal({ isOpen: true, id: pkg.id })} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{pkg.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  pkg.planType === 'business' 
                    ? 'bg-purple-50 text-[#8B5CF6] border border-purple-100' 
                    : 'bg-blue-50 text-[#2563EB] border border-blue-100'
                }`}>
                  {pkg.planType || 'individual'}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">{pkg.description}</p>
            </div>
            <div className="p-8 bg-slate-50/50 flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Price</span>
                </div>
                <span className="text-2xl font-black text-slate-900">${pkg.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Duration</span>
                </div>
                <span className="text-sm font-black text-slate-700">{pkg.durationDays} Days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Limit</span>
                </div>
                <span className="text-sm font-black text-slate-700">{pkg.aiLimitPerDay} Req/Day</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingPackage ? 'Edit Package' : 'New Package'}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Package Name</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                        placeholder="e.g., Premium Plan"
                        value={newPackage.name}
                        onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Description</label>
                      <textarea
                        required
                        rows={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all resize-none"
                        placeholder="What's included?"
                        value={newPackage.description}
                        onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Price ($)</label>
                        <input
                          type="number"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                          value={newPackage.price}
                          onChange={(e) => setNewPackage({ ...newPackage, price: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Duration (Days)</label>
                        <input
                          type="number"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                          value={newPackage.durationDays}
                          onChange={(e) => setNewPackage({ ...newPackage, durationDays: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">AI Limit Per Day</label>
                      <input
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                        value={newPackage.aiLimitPerDay}
                        onChange={(e) => setNewPackage({ ...newPackage, aiLimitPerDay: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Plan Type</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setNewPackage({ ...newPackage, planType: 'individual' })}
                          className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            newPackage.planType === 'individual'
                              ? 'bg-white text-[#2563EB] shadow-md shadow-[#2563EB]/5 border border-slate-100'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Individual
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPackage({ ...newPackage, planType: 'business' })}
                          className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            newPackage.planType === 'business'
                              ? 'bg-white text-[#2563EB] shadow-md shadow-[#2563EB]/5 border border-slate-100'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Business
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#1E40AF] transition-all shadow-xl shadow-[#2563EB]/25 active:scale-[0.98] mt-4"
                >
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteModal?.isOpen}
        onClose={() => setDeleteModal(null)}
        onConfirm={() => deleteModal && handleDelete(deleteModal.id)}
        title="Delete Package"
        message="Are you sure you want to delete this package? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default PackageManagement;
