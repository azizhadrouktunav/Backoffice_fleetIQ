import { FileSpreadsheet, FileText } from 'lucide-react';

type Props = {
  onExportExcel: () => void;
  onExportPdf: () => void;
  disabled?: boolean;
  size?: 'default' | 'compact';
};

const buttonBase =
  'font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

const sizeClasses = {
  default: 'px-4 py-2 text-sm',
  compact: 'px-3 py-1.5 text-xs'
};

export function TableExportButtons({
  onExportExcel,
  onExportPdf,
  disabled = false,
  size = 'default'
}: Props) {
  const cls = `${buttonBase} ${sizeClasses[size]}`;

  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0">
      <button type="button" onClick={onExportExcel} disabled={disabled} className={cls}>
        <FileSpreadsheet size={size === 'compact' ? 14 : 16} />
        Exporter Excel
      </button>
      <button type="button" onClick={onExportPdf} disabled={disabled} className={cls}>
        <FileText size={size === 'compact' ? 14 : 16} />
        Exporter PDF
      </button>
    </div>
  );
}
