import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Package, Search, Shield, User, Users } from 'lucide-react';
import api from '../../services/api';

interface AdminSubscription {
  subscriptionId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  packageId: string;
  packageName: string | null;
  planType: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const statusClass = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-600';
    case 'EXPIRED':
      return 'bg-amber-50 text-amber-600';
    case 'REPLACED':
      return 'bg-slate-100 text-slate-500';
    case 'CANCELLED':
      return 'bg-red-50 text-red-500';
    default:
      return 'bg-blue-50 text-blue-600';
  }
};

const planTypeClass = (planType?: string | null) => (
  planType === 'business'
    ? 'bg-violet-50 text-violet-600'
    : 'bg-blue-50 text-blue-600'
);

const SubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'individual' | 'business'>('all');

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await api.get('/admin/subscriptions');
        setSubscriptions(response.data || []);
      } catch (error) {
        console.error('Failed to fetch subscriptions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(subscription => {
      const matchesFilter = activeFilter === 'all' || subscription.planType === activeFilter;
      const query = searchTerm.toLowerCase();
      const matchesSearch = !query
        || (subscription.userName || '').toLowerCase().includes(query)
        || (subscription.userEmail || '').toLowerCase().includes(query)
        || (subscription.packageName || '').toLowerCase().includes(query)
        || (subscription.status || '').toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [subscriptions, activeFilter, searchTerm]);

  const activeCount = subscriptions.filter(item => item.status === 'ACTIVE').length;
  const businessCount = subscriptions.filter(item => item.planType === 'business').length;
  const individualCount = subscriptions.filter(item => item.planType !== 'business').length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Subscription Management</h1>
          <p className="text-slate-500 font-medium">Monitor active, expired, individual, and business subscriptions.</p>
        </div>

        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#2563EB] transition-colors" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard icon={<Package className="w-5 h-5" />} label="Total" value={subscriptions.length} />
        <StatCard icon={<Shield className="w-5 h-5" />} label="Active" value={activeCount} />
        <StatCard icon={<Users className="w-5 h-5" />} label="Business" value={businessCount} />
        <StatCard icon={<User className="w-5 h-5" />} label="Individual" value={individualCount} />
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit">
        {(['all', 'individual', 'business'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              activeFilter === filter
                ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {filter === 'all' ? 'All' : filter === 'individual' ? 'Individual' : 'Business'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Package</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">Loading subscriptions...</td></tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">No subscriptions found.</td></tr>
              ) : filteredSubscriptions.map(subscription => (
                <tr key={subscription.subscriptionId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs uppercase group-hover:bg-[#2563EB]/10 group-hover:text-[#2563EB] transition-colors">
                        {(subscription.userName || subscription.userEmail || 'U').slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 tracking-tight">{subscription.userName || 'Unknown user'}</span>
                        <span className="text-xs text-slate-400 font-medium">{subscription.userEmail || subscription.userId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-300" />
                      <span className="text-sm font-black text-slate-800">{subscription.packageName || 'Unknown package'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${planTypeClass(subscription.planType)}`}>
                      {subscription.planType || 'individual'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusClass(subscription.status)}`}>
                      {subscription.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold whitespace-nowrap">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      {formatDate(subscription.startDate)} → {formatDate(subscription.endDate)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6"
  >
    <div className="w-11 h-11 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center mb-4">
      {icon}
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">{label}</p>
    <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
  </motion.div>
);

export default SubscriptionManagement;
