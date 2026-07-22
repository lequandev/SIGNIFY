import React, { useState } from 'react';
import { Copy, Eye, EyeOff, KeyRound, MapPin, Mail, Phone, Shield, User, X } from 'lucide-react';
import type { SchoolMember } from '../services/schoolService';

interface MemberDetailsModalProps {
  member: SchoolMember | null;
  studentPassword?: string;
  onClose: () => void;
  onResetPassword?: () => void;
  onCopyCredentials?: () => void;
}

const roleLabel = (role: string) => ({ SCHOOL_ADMIN: 'Quản trị trường', TEACHER: 'Giáo viên', STUDENT: 'Học sinh' }[role] || role);
const statusLabel = (status: string) => ({ ACTIVE: 'Đang hoạt động', INACTIVE: 'Tạm khóa' }[status] || status);

const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({ member, studentPassword, onClose, onResetPassword, onCopyCredentials }) => {
  const [visiblePasswordFor, setVisiblePasswordFor] = useState<string | null>(null);

  if (!member) return null;
  const isStudent = member.role === 'STUDENT';
  const showPassword = visiblePasswordFor === member.userId;

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-on-surface/50 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
              {member.avatarUrl ? <img src={member.avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" /> : <User className="h-6 w-6" />}
            </div>
            <div><p className="text-xs font-black uppercase tracking-wider text-primary">Thông tin thành viên</p><h2 className="mt-1 text-xl font-black">{member.fullName}</h2></div>
          </div>
          <button type="button" onClick={onClose} title="Đóng" className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"><X className="h-5 w-5" /></button>
        </div>

        {isStudent ? (
          <div className="mt-6 space-y-3">
            <DetailRow icon={KeyRound} label="Mã đăng nhập" value={member.username || 'Chưa có'} />
            <PasswordRow password={studentPassword} visible={showPassword} onToggle={() => setVisiblePasswordFor(showPassword ? null : member.userId)} />
            {!studentPassword && <p className="text-xs leading-5 text-on-surface-variant">Mật khẩu hiện tại được lưu dưới dạng mã hóa. Hãy đặt lại mật khẩu để tạo một mật khẩu mới có thể xem và sao chép.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {onResetPassword && <button type="button" onClick={onResetPassword} className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 py-3 text-sm font-black text-primary"><KeyRound className="h-4 w-4" />Đặt lại mật khẩu</button>}
              {studentPassword && onCopyCredentials && <button type="button" onClick={onCopyCredentials} className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-black text-on-secondary"><Copy className="h-4 w-4" />Sao chép thông tin</button>}
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <DetailRow icon={Mail} label="Email" value={member.email || 'Chưa cập nhật'} />
            <DetailRow icon={Phone} label="Số điện thoại" value={member.phoneNumber || 'Chưa cập nhật'} />
            <DetailRow icon={MapPin} label="Địa chỉ" value={member.address || 'Chưa cập nhật'} />
            <DetailRow icon={Shield} label="Vai trò" value={roleLabel(member.role)} />
            <DetailRow icon={Shield} label="Trạng thái" value={statusLabel(member.status)} />
            <DetailRow icon={User} label="Ngày tham gia" value={member.createdAt ? new Date(member.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} />
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="rounded-xl bg-surface-container p-3"><div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant"><Icon className="h-4 w-4 text-primary" />{label}</div><p className="mt-1 break-words text-sm font-bold text-on-surface">{value}</p></div>
);

const PasswordRow = ({ password, visible, onToggle }: { password?: string; visible: boolean; onToggle: () => void }) => (
  <div className="rounded-xl bg-surface-container p-3">
    <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant"><Shield className="h-4 w-4 text-primary" />Mật khẩu</div>
    <div className="mt-1 flex items-center gap-2">
      <code className="min-w-0 flex-1 break-all text-sm font-black text-on-surface">{visible ? (password || 'Chưa có mật khẩu tạm thời') : '••••••••'}</code>
      <button type="button" onClick={onToggle} title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="shrink-0 rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary">
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

export default MemberDetailsModal;
