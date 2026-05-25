import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Package, Check, X, DollarSign, Clock, Zap } from 'lucide-react';
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
    aiLimitPerDay: 10
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages');
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
        await api.put(`/packages/${editingPackage.id}`, newPackage);
      } else {
        await api.post('/packages', newPackage);
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
      price: pkg.price,
      durationDays: pkg.durationDays,
      aiLimitPerDay: pkg.aiLimitPerDay
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/packages/${id}`);
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
      aiLimitPerDay: 10
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
           <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold italic text-center">No packages found. Start by creating one!</div>
        ) : packages.map((pkg, idx) => (
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
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{pkg.name}</h3>
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
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingPackage ? 'Edit Package' : 'New Package'}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Package Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                    placeholder="e.g., Premium Plan"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                    placeholder="What's included?"
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Price ($)</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                      value={newPackage.price}
                      onChange={(e) => setNewPackage({...newPackage, price: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Duration (Days)</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                      value={newPackage.durationDays}
                      onChange={(e) => setNewPackage({...newPackage, durationDays: Number(e.target.value)})}
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
                    onChange={(e) => setNewPackage({...newPackage, aiLimitPerDay: Number(e.target.value)})}
                  />
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
