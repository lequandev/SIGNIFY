import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, MoreVertical, Shield, User as UserIcon, UserMinus, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const UserManagement = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; userId: string; status: string } | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      const response = await api.put(`/admin/users/${id}`, updates);
      setUsers(users.map(u => u.id === id ? response.data : u));
      showToast('User updated successfully', 'success');
    } catch (err: any) {
      console.error('Failed to update user', err);
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium">Manage and monitor all platform members.</p>
        </div>
        
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#2563EB] transition-colors" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Member</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Joined Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">No users found.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs uppercase group-hover:bg-[#2563EB]/10 group-hover:text-[#2563EB] transition-colors">
                        {user.fullName.substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 tracking-tight">{user.fullName}</span>
                        <span className="text-xs text-slate-400 font-medium">{user.email || user.username || 'No login ID'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-3 h-3 ${user.role === 'ADMIN' ? 'text-amber-500' : 'text-slate-300'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'text-amber-500' : 'text-slate-500'}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs text-slate-400 font-bold">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">

                      <button 
                        onClick={() => setConfirmModal({ 
                          isOpen: true, 
                          userId: user.id, 
                          status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' 
                        })}
                        className={`p-2 transition-colors ${user.status === 'ACTIVE' ? 'text-slate-300 hover:text-red-500' : 'text-slate-300 hover:text-emerald-500'}`}
                        title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                      >
                        {user.status === 'ACTIVE' ? <UserMinus className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmModal?.isOpen}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => confirmModal && handleUpdateUser(confirmModal.userId, { status: confirmModal.status })}
        title={confirmModal?.status === 'ACTIVE' ? 'Activate User' : 'Suspend User'}
        message={`Are you sure you want to ${confirmModal?.status === 'ACTIVE' ? 'activate' : 'suspend'} this user?`}
        confirmText={confirmModal?.status === 'ACTIVE' ? 'Activate' : 'Suspend'}
        type={confirmModal?.status === 'ACTIVE' ? 'info' : 'danger'}
      />
    </div>
  );
};

export default UserManagement;
