import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Package, CreditCard, TrendingUp, ArrowUpRight } from 'lucide-react';
import api from '../../services/api';

const DashboardOverview = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
    { label: 'Total Packages', value: stats?.totalPackages || 0, icon: Package, color: 'indigo' },
    { label: 'Subscriptions', value: stats?.totalSubscriptions || 0, icon: CreditCard, color: 'emerald' },
    { label: 'Revenue', value: '$0', icon: TrendingUp, color: 'violet' },
  ];

  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Overview</h1>
        <p className="text-slate-500 font-medium">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl border ${colors[card.color]} transition-transform group-hover:scale-110`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                <ArrowUpRight className="w-3 h-3" />
                12%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
              <h2 className="text-3xl font-black text-slate-900">{loading ? '...' : card.value}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900">Recent Activity</h3>
            <button className="text-xs font-bold text-[#2563EB] uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black group-hover:bg-[#2563EB]/10 group-hover:text-[#2563EB] transition-colors">
                  TL
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">New user registered</h4>
                  <p className="text-xs text-slate-400 font-medium">trantheluong204@gmail.com</p>
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">2 hours ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#2563EB] to-[#4F46E5] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-[#2563EB]/30">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-4 tracking-tight">System Status</h3>
            <p className="text-white/70 text-sm font-medium leading-relaxed mb-8">All systems are operational. AI processing is running at optimal speeds.</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span>Database</span>
                <span className="text-emerald-300">Healthy</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="w-[95%] h-full bg-emerald-400" />
              </div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest pt-2">
                <span>AI Engine</span>
                <span className="text-emerald-300">Online</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="w-[98%] h-full bg-emerald-400" />
              </div>
            </div>
          </div>
          {/* Decorative Orbs */}
          <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
