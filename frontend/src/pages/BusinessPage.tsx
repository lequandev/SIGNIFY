import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Clock, Mail, Plus, Shield, Trash2, UserCheck, UserMinus, Users } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import {
  inviteBusinessMember,
  BusinessMember,
  BusinessOverview,
  deleteBusinessMember,
  getBusinessMembers,
  getMyBusiness,
  updateBusinessMemberStatus,
} from '../services/businessService';

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa xác định';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const BusinessPage: React.FC = () => {
  const { showToast } = useToast();
  const [business, setBusiness] = useState<BusinessOverview | null>(null);
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [noBusiness, setNoBusiness] = useState(false);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'status' | 'delete';
    member: BusinessMember;
    nextStatus?: 'ACTIVE' | 'INACTIVE';
  } | null>(null);

  const activeMembers = useMemo(() => members.filter(member => member.status === 'ACTIVE').length, [members]);
  const memberCount = business?.memberCount ?? members.length;
  const maxAccounts = business?.maxAccounts ?? 20;
  const usagePercent = Math.min(100, Math.max(0, (memberCount / maxAccounts) * 100));

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      setNoBusiness(false);
      const data = await getMyBusiness();
      setBusiness(data);
      if (data.canManageMembers) {
        setMembersLoading(true);
        const memberData = await getBusinessMembers();
        setMembers(memberData);
        setMembersLoading(false);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setNoBusiness(true);
      } else {
        showToast(error?.response?.data?.message || 'Không thể tải thông tin doanh nghiệp', 'error');
      }
    } finally {
      setLoading(false);
      setMembersLoading(false);
    }
  };

  const refreshBusinessState = async () => {
    const [businessData, memberData] = await Promise.all([
      getMyBusiness(),
      getBusinessMembers(),
    ]);
    setBusiness(businessData);
    setMembers(memberData);
  };

  useEffect(() => {
    fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      showToast('Email thành viên không hợp lệ', 'error');
      return;
    }

    setAdding(true);
    try {
      await inviteBusinessMember(normalizedEmail);
      setEmail('');
      await refreshBusinessState();
      showToast(`Đã gửi lời mời tới ${normalizedEmail}`, 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể gửi lời mời', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (member: BusinessMember, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await updateBusinessMemberStatus(member.id, nextStatus);
      await refreshBusinessState();
      showToast(nextStatus === 'ACTIVE' ? 'Đã kích hoạt thành viên' : 'Đã vô hiệu hóa thành viên', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể cập nhật trạng thái thành viên', 'error');
    }
  };

  const handleDeleteMember = async (member: BusinessMember) => {
    try {
      await deleteBusinessMember(member.id);
      await refreshBusinessState();
      showToast('Đã xóa thành viên khỏi doanh nghiệp', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể xóa thành viên', 'error');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-[420px] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      );
    }

    if (noBusiness || !business) {
      return (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-primary via-primary-container to-secondary p-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_50%)] pointer-events-none" />
            <div className="relative max-w-3xl">
              <div className="w-16 h-16 rounded-[22px] border border-white/25 bg-white/15 text-white flex items-center justify-center mb-5 backdrop-blur">
                <Building2 className="w-8 h-8" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80 mb-3">Business Signify</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Bạn chưa có gói Doanh nghiệp</h1>
              <p className="text-sm md:text-base font-medium text-white/85 leading-relaxed max-w-2xl">
                Đăng ký gói Business để tạo workspace doanh nghiệp, quản lý tối đa 20 tài khoản và cấp quyền sử dụng đầy đủ cho thành viên.
              </p>
            </div>
          </div>
          <div className="p-6 bg-surface-container/30">
            <Link
              to="/packages"
              className="inline-flex items-center justify-center rounded-xl bg-primary text-on-primary px-6 py-3 text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-container hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              Xem gói dịch vụ
            </Link>
          </div>
        </motion.section>
      );
    }

    return (
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-primary via-primary-container to-secondary p-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_50%)] pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/10 overflow-hidden shadow-xl backdrop-blur flex items-center justify-center shrink-0">
                <Building2 className="w-11 h-11" />
              </div>

              <div className="flex-grow text-center lg:text-left">
                <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">{business.organizationName}</h1>
                <p className="text-white/80 text-sm mb-3">Quản lý thành viên và quyền truy cập Business của doanh nghiệp</p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                    <Shield className="w-3 h-3" />
                    {business.role === 'BUSINESS_ADMIN' ? 'Admin doanh nghiệp' : 'Thành viên doanh nghiệp'}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                    <Users className="w-3 h-3" />
                    {memberCount}/{maxAccounts} tài khoản
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur text-center lg:text-left w-full lg:w-64">
                <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
                  <Users className="w-4 h-4" />
                  Sức chứa tài khoản
                </div>
                <div className="flex items-center justify-between text-sm font-bold mb-2">
                  <span>{memberCount} / {maxAccounts}</span>
                  <span>{Math.round(usagePercent)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full rounded-full bg-white" style={{ width: `${usagePercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-surface-container/30">
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-2">
                <Shield className="w-4 h-4 text-primary" />
                Gói hiện tại
              </div>
              <p className="text-base font-bold text-on-surface">{business.packageName}</p>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-2">
                <Clock className="w-4 h-4 text-primary" />
                Ngày hết hạn
              </div>
              <p className="text-base font-bold text-on-surface">{formatDate(business.expiresAt)}</p>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-2">
                <Users className="w-4 h-4 text-primary" />
                Thành viên hoạt động
              </div>
              <p className="text-base font-bold text-on-surface">{business.canManageMembers ? activeMembers : memberCount} tài khoản</p>
            </div>
          </div>
        </motion.section>

        {business.canManageMembers ? (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Mời thành viên</h2>
                  <p className="text-sm text-on-surface-variant">Hệ thống sẽ gửi email mời tham gia doanh nghiệp</p>
                </div>
              </div>

              <form onSubmit={handleAddMember} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Email thành viên</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="member@example.com"
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 pl-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adding || !isValidEmail(email)}
                  className="w-full rounded-xl bg-primary text-on-primary px-6 py-3 text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-container hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {adding ? 'Đang gửi...' : 'Gửi lời mời'}
                </button>
              </form>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Danh sách thành viên</h2>
                    <p className="text-sm text-on-surface-variant">Quản lý trạng thái và quyền truy cập Business</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 text-primary px-4 py-2 text-xs font-black uppercase tracking-wider">
                  {memberCount}/{maxAccounts} tài khoản
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container/50 border-b border-outline-variant/40">
                      <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.18em]">Thành viên</th>
                      <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.18em]">Role</th>
                      <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.18em]">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.18em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {membersLoading ? (
                      <tr><td colSpan={4} className="px-6 py-16 text-center text-on-surface-variant font-bold italic">Đang tải thành viên...</td></tr>
                    ) : members.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-16 text-center text-on-surface-variant font-bold italic">Chưa có thành viên.</td></tr>
                    ) : members.map(member => {
                      const isAdmin = member.role === 'BUSINESS_ADMIN';
                      const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                      return (
                        <tr key={member.id} className="hover:bg-surface-container/40 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black uppercase overflow-hidden">
                                {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" /> : (member.fullName || member.email || 'U').slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-on-surface">{member.fullName || 'Người dùng Signify'}</p>
                                <p className="text-xs font-semibold text-on-surface-variant">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">{isAdmin ? 'Business Admin' : 'Member'}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <button
                                disabled={isAdmin}
                                onClick={() => setConfirmAction({ isOpen: true, type: 'status', member, nextStatus })}
                                className="p-2 rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                                title={nextStatus === 'ACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa'}
                              >
                                {nextStatus === 'ACTIVE' ? <UserCheck className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                              </button>
                              <button
                                disabled={isAdmin}
                                onClick={() => setConfirmAction({ isOpen: true, type: 'delete', member })}
                                className="p-2 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                                title="Xóa thành viên"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </div>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md p-8 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black tracking-tight text-on-surface mb-2">Bạn đang là thành viên doanh nghiệp</h2>
            <p className="text-sm font-medium text-on-surface-variant">Tài khoản của bạn đã được cấp quyền Business, nhưng chỉ admin doanh nghiệp mới quản lý danh sách thành viên.</p>
          </motion.section>
        )}
      </div>
    );
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary">
      <Header />
      <main className="pt-28 flex-grow">
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          {renderContent()}
        </div>
      </main>
      <Footer />

      <ConfirmModal
        isOpen={!!confirmAction?.isOpen}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === 'delete') {
            handleDeleteMember(confirmAction.member);
          } else if (confirmAction.nextStatus) {
            handleUpdateStatus(confirmAction.member, confirmAction.nextStatus);
          }
        }}
        title={confirmAction?.type === 'delete' ? 'Xóa thành viên' : confirmAction?.nextStatus === 'ACTIVE' ? 'Kích hoạt thành viên' : 'Vô hiệu hóa thành viên'}
        message={confirmAction?.type === 'delete'
          ? `Xóa ${confirmAction.member.email} khỏi doanh nghiệp? Thành viên sẽ quay về quyền Free nếu không có gói cá nhân.`
          : confirmAction?.nextStatus === 'ACTIVE'
            ? `Kích hoạt lại ${confirmAction?.member.email}? Thành viên sẽ được dùng đầy đủ tính năng Business.`
            : `Vô hiệu hóa ${confirmAction?.member.email}? Thành viên sẽ quay về quyền Free.`}
        confirmText={confirmAction?.type === 'delete' ? 'Xóa' : confirmAction?.nextStatus === 'ACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa'}
        type={confirmAction?.type === 'delete' || confirmAction?.nextStatus === 'INACTIVE' ? 'danger' : 'info'}
      />
    </div>
  );
};

export default BusinessPage;
