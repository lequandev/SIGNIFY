import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface WorkspaceTopbarProps {
  currentLabel: string;
  backTo?: string;
  backLabel?: string;
}

const WorkspaceTopbar: React.FC<WorkspaceTopbarProps> = ({ currentLabel, backTo = '/profile', backLabel = 'Hồ sơ' }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/45 bg-surface-container-lowest/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button type="button" onClick={() => navigate(backTo)} title={`Quay lại ${backLabel}`} aria-label={`Quay lại ${backLabel}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-outline-variant/60 bg-background text-on-surface-variant shadow-sm transition hover:border-primary/35 hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <nav aria-label="Đường dẫn trang" className="flex min-w-0 items-center gap-2 text-sm">
          <Link to={backTo} className="shrink-0 font-bold text-on-surface-variant transition hover:text-primary">{backLabel}</Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-outline" />
          <span className="truncate font-extrabold text-on-surface">{currentLabel}</span>
        </nav>
      </div>
    </header>
  );
};

export default WorkspaceTopbar;
