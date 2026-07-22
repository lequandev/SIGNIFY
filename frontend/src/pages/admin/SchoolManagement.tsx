import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Loader2, Lock, Unlock } from 'lucide-react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';

interface School {
  id: string;
  name: string;
  ownerUserId?: string;
  subscriptionId?: string;
  status: string;
  createdAt?: string;
}

const schoolStatusLabel = (status: string) => status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa';

const SchoolManagement: React.FC = () => {
  const { showToast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolToToggle, setSchoolToToggle] = useState<School | null>(null);

  const load = useCallback(async () => {
    try {
      setSchools((await api.get<School[]>('/admin/schools')).data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (school: School) => {
    try {
      await api.patch(`/admin/schools/${school.id}/status`, { status: school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      await load();
      showToast(school.status === 'ACTIVE' ? 'Đã tạm khóa trường học' : 'Đã kích hoạt trường học', 'success');
    } catch (error: unknown) {
      const response = error as { response?: { data?: { message?: string } } };
      showToast(response.response?.data?.message || 'Không thể cập nhật trạng thái trường học', 'error');
    }
  };

  return (
    <div className="space-y-8 font-sans text-on-surface">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Quản trị giáo dục</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-on-surface sm:text-4xl">Các trường học</h1>
        <p className="mt-2 font-medium text-on-surface-variant">Theo dõi, kích hoạt hoặc khóa không gian trường học.</p>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
              <tr><th className="px-6 py-4">Trường học</th><th className="px-6 py-4">Gói đăng ký</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4" /></tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading && <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>}
              {!loading && schools.map(school => (
                <tr key={school.id} className="hover:bg-surface-container/60">
                  <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Building2 className="h-5 w-5" /></div><div><p className="font-black">{school.name}</p><p className="text-xs text-on-surface-variant">Chủ sở hữu: {school.ownerUserId || 'Chưa cập nhật'}</p></div></div></td>
                  <td className="px-6 py-5 text-sm text-on-surface-variant">{school.subscriptionId || '-'}</td>
                  <td className="px-6 py-5"><span className={`rounded-full px-3 py-1 text-xs font-black ${school.status === 'ACTIVE' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>{schoolStatusLabel(school.status)}</span></td>
                  <td className="px-6 py-5 text-right"><button onClick={() => setSchoolToToggle(school)} title={school.status === 'ACTIVE' ? 'Khóa trường học' : 'Kích hoạt trường học'} className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 px-3 py-2 text-xs font-black text-on-surface-variant hover:border-primary hover:text-primary">{school.status === 'ACTIVE' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}{school.status === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt'}</button></td>
                </tr>
              ))}
              {!loading && schools.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">Chưa có trường học nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal
        isOpen={Boolean(schoolToToggle)}
        onClose={() => setSchoolToToggle(null)}
        onConfirm={() => {
          if (!schoolToToggle) return;
          const school = schoolToToggle;
          setSchoolToToggle(null);
          void toggle(school);
        }}
        title={schoolToToggle?.status === 'ACTIVE' ? 'Tạm khóa trường học' : 'Kích hoạt trường học'}
        message={schoolToToggle?.status === 'ACTIVE'
          ? `Bạn có chắc muốn tạm khóa không gian ${schoolToToggle?.name || ''}?`
          : `Bạn có chắc muốn kích hoạt lại không gian ${schoolToToggle?.name || ''}?`}
        confirmText={schoolToToggle?.status === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt'}
        type={schoolToToggle?.status === 'ACTIVE' ? 'warning' : 'info'}
      />
    </div>
  );
};

export default SchoolManagement;
