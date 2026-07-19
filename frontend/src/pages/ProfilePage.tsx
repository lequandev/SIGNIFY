import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  KeyRound,
  AlertCircle,
  Sparkles,
  Crown,
  Calendar,
  Clock
} from 'lucide-react';
import api from '../services/api';
import { setLogin } from '../store/authSlice';
import { useToast } from '../context/ToastContext';
import { getMyEntitlement, EntitlementData } from '../services/entitlementService';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user, token } = useSelector((state: any) => state.auth);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [entitlement, setEntitlement] = useState<EntitlementData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncUser = (data: any) => {
    const merged = { ...(user || {}), ...data, id: data._id ?? data.id ?? user?.id };
    if (token) dispatch(setLogin({ user: merged, token }));
    return merged;
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [profileData, entitlementData] = await Promise.all([
          api.get('/users/profile').then(res => res.data),
          getMyEntitlement().catch(() => null),
        ]);
        if (ignore) return;
        setFormData({
          fullName: profileData.fullName || '',
          phoneNumber: profileData.phoneNumber || '',
          address: profileData.address || '',
        });
        setAvatarUrl(profileData.avatarUrl || null);
        syncUser(profileData);
        if (entitlementData) setEntitlement(entitlementData);
      } catch {
        // Chưa đăng nhập hoặc lỗi mạng
      }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = formData.fullName
    ? formData.fullName.split(' ').map((item: string) => item[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })
    : 'Thành viên mới';

  const validateAvatarFile = (file: File): string | undefined => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Kích thước ảnh không được vượt quá 5MB';
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return 'Chỉ chấp nhận file ảnh JPG, PNG, GIF, WebP';
    }

    return undefined;
  };

  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Họ tên không được để trống';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    } else if (formData.fullName.trim().length > 100) {
      errors.fullName = 'Họ tên không được vượt quá 100 ký tự';
    }

    if (formData.phoneNumber.trim()) {
      const normalized = formData.phoneNumber.trim().replace(/[\s-]/g, '');
      if (normalized.length > 15) {
        errors.phoneNumber = 'Số điện thoại không được quá 15 ký tự';
      } else {
        const phoneRegex = /^(\+?84|0)?[0-9]{9,10}$/;
        if (!phoneRegex.test(normalized)) {
          errors.phoneNumber = 'Số điện thoại không hợp lệ (VD: 0901234567)';
        }
      }
    }

    if (formData.address && formData.address.length > 200) {
      errors.address = 'Địa chỉ không được vượt quá 200 ký tự';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu không khớp';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordData((previous) => ({ ...previous, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file first
    const error = validateAvatarFile(file);
    if (error) {
      showToast(error, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/users/avatar', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(data.avatarUrl || null);
      setAvatarPreview(null);
      syncUser(data);
      showToast('Ảnh đại diện đã được cập nhật', 'success');
    } catch (error: any) {
      setAvatarPreview(null);
      showToast(error?.response?.data?.message || 'Tải ảnh thất bại', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateProfileForm()) {
      showToast('Vui lòng kiểm tra lại thông tin', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await api.put('/users/profile', {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
      });
      syncUser(data);
      showToast('Đã lưu thông tin thành công', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Lưu thất bại', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validatePasswordForm()) {
      showToast('Vui lòng kiểm tra lại mật khẩu', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      showToast('Đổi mật khẩu thành công', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Đổi mật khẩu thất bại', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const avatarSrc = avatarPreview || avatarUrl;
  const dailyLimit = entitlement?.dailyUsageLimitMinutes ?? 20;
  const remainingMinutes = entitlement?.remainingMinutesToday ?? dailyLimit;
  const usedMinutes = entitlement?.usedMinutesToday ?? 0;
  const usagePercent = entitlement?.unlimited ? 100 : Math.min(100, Math.max(0, (usedMinutes / dailyLimit) * 100));
  const packageExpiresAt = entitlement?.expiresAt
    ? new Date(entitlement.expiresAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;
  const isBusinessEntitlement = entitlement?.plan === 'BUSINESS_ADMIN' || entitlement?.plan === 'BUSINESS_MEMBER' || entitlement?.planType === 'business';

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="pt-28 flex-grow">
        <div className="max-w-[1200px] mx-auto px-6 py-10">

          {/* Profile Header Card */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md overflow-hidden mb-6"
          >
            {/* Header gradient banner */}
            <div className="relative bg-gradient-to-r from-primary via-primary-container to-secondary p-8 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_50%)] pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar section */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/10 overflow-hidden shadow-xl backdrop-blur">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-black">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white text-primary shadow-lg hover:scale-110 transition-transform flex items-center justify-center disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                </div>

                {/* User info */}
                <div className="flex-grow text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">
                    {formData.fullName || 'Người dùng'}
                  </h1>
                  <p className="text-white/80 text-sm mb-3">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      <Shield className="w-3 h-3" />
                      {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      <Sparkles className="w-3 h-3" />
                      {user?.status || 'ACTIVE'}
                    </div>
                  </div>
                </div>

                {/* Member since */}
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur text-center md:text-left">
                  <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
                    <Calendar className="w-4 h-4" />
                    Tham gia từ
                  </div>
                  <p className="text-sm font-bold">{memberSince}</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-surface-container/30">
              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-2">
                  <Crown className="w-4 h-4 text-primary" />
                  Gói hiện tại
                </div>
                <p className="text-base font-bold text-on-surface">{entitlement?.packageName || 'Miễn phí'}</p>
                {packageExpiresAt && (
                  <p className="text-xs font-semibold text-on-surface-variant mt-1">Hết hạn: {packageExpiresAt}</p>
                )}
                {entitlement?.organizationName && (
                  <p className="text-xs font-semibold text-primary mt-1">Doanh nghiệp: {entitlement.organizationName}</p>
                )}
                {isBusinessEntitlement && (
                  <Link
                    to="/business"
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-primary text-on-primary px-4 py-2 text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary-container hover:-translate-y-0.5 active:scale-95 transition-all"
                  >
                    Quản lý doanh nghiệp
                  </Link>
                )}
              </div>

              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Quyền truy cập
                </div>
                <p className="text-base font-bold text-on-surface">
                  {entitlement?.unlimited ? 'Không giới hạn' : 'Cơ bản'}
                </p>
              </div>

              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-3">
                  <Clock className="w-4 h-4 text-primary" />
                  Thời gian hôm nay
                </div>
                {entitlement?.unlimited ? (
                  <p className="text-sm font-bold text-on-surface">Không giới hạn</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-on-surface-variant">{usedMinutes}/{dailyLimit} phút</span>
                      <span className={`${remainingMinutes <= 5 ? 'text-error' : 'text-primary'}`}>
                        {remainingMinutes} phút còn lại
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${remainingMinutes <= 5 ? 'bg-error' : usagePercent >= 50 ? 'bg-amber-500' : 'bg-primary'}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Two column layout for forms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Update Profile Form */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Cập nhật thông tin</h2>
                  <p className="text-sm text-on-surface-variant">Chỉnh sửa thông tin cá nhân của bạn</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">
                    Họ và tên <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    maxLength={100}
                    autoComplete="name"
                    aria-invalid={!!validationErrors.fullName}
                    className={`w-full rounded-xl border ${validationErrors.fullName ? 'border-error' : 'border-outline-variant/60'} bg-surface-container px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20`}
                    placeholder="Nhập họ tên đầy đủ"
                  />
                  {validationErrors.fullName && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-outline-variant/40 bg-surface-container-high/50 px-4 py-3 text-sm text-on-surface-variant outline-none"
                  />
                  <p className="text-xs text-on-surface-variant">Email không thể thay đổi</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    maxLength={15}
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={!!validationErrors.phoneNumber}
                    className={`w-full rounded-xl border ${validationErrors.phoneNumber ? 'border-error' : 'border-outline-variant/60'} bg-surface-container px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20`}
                    placeholder="VD: 0901234567"
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.phoneNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Địa chỉ</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    maxLength={200}
                    rows={3}
                    autoComplete="street-address"
                    aria-invalid={!!validationErrors.address}
                    className={`w-full rounded-xl border ${validationErrors.address ? 'border-error' : 'border-outline-variant/60'} bg-surface-container px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none`}
                    placeholder="Nhập địa chỉ của bạn"
                  />
                  {validationErrors.address && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.address}
                    </p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={savingProfile}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-primary text-on-primary px-6 py-3.5 text-sm font-bold transition-all hover:bg-primary-container hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </motion.button>
              </form>
            </motion.section>

            {/* Change Password Form */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-2xl bg-secondary/10 p-2.5 text-secondary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Đổi mật khẩu</h2>
                  <p className="text-sm text-on-surface-variant">Cập nhật mật khẩu đăng nhập</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    aria-invalid={!!passwordErrors.currentPassword}
                    className={`w-full rounded-xl border ${passwordErrors.currentPassword ? 'border-error' : 'border-outline-variant/60'} bg-surface-container px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20`}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Mật khẩu mới</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    aria-invalid={!!passwordErrors.newPassword}
                    className={`w-full rounded-xl border ${passwordErrors.newPassword ? 'border-error' : 'border-outline-variant/60'} bg-surface-container px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20`}
                    placeholder="Ít nhất 6 ký tự"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    aria-invalid={!!passwordErrors.confirmPassword}
                    className={`w-full rounded-xl border ${passwordErrors.confirmPassword ? 'border-error' : 'border-outline-variant/60'} bg-surface-container px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={changingPassword}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-secondary text-on-secondary px-6 py-3.5 text-sm font-bold transition-all hover:bg-secondary-container hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </motion.button>
              </form>
            </motion.section>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
