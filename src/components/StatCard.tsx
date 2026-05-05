import React from 'react';
import { BoxIcon } from 'lucide-react';
interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtitle: string;
  icon?: BoxIcon;
  onClick?: () => void;
  color?: 'blue' | 'red';
}
export function StatCard({
  title,
  value,
  trend,
  trendUp,
  subtitle,
  icon: Icon,
  onClick,
  color = 'blue'
}: StatCardProps) {
  const isClickable = !!onClick;
  const colorClasses = {
    blue: {
      border: 'border-l-blue-500',
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-600'
    },
    red: {
      border: 'border-l-red-500',
      iconBg: 'bg-red-50',
      iconText: 'text-red-600'
    }
  };
  return <div onClick={onClick} className={`bg-white p-5 rounded-lg border border-slate-200 border-l-4 ${colorClasses[color].border} shadow-sm transition-all ${isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wide">
          {title}
        </h3>
        {Icon && <div className={`p-2 rounded-lg ${colorClasses[color].iconBg}`}>
            <Icon className={colorClasses[color].iconText} size={18} />
          </div>}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        {trend && <span className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? '↗' : '↘'} {trend}
          </span>}
      </div>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>;
}