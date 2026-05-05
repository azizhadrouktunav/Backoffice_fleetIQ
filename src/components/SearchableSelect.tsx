import React, { useEffect, useState, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
}
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Rechercher...',
  icon,
  label
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = options.filter((opt) => opt.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setQuery('');
  };
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };
  const openDropdown = () => {
    setIsOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  return <div ref={containerRef} className="relative">
      {label && <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
          {icon}
          {label}
        </label>}

      {/* Trigger button */}
      <button type="button" onClick={openDropdown} className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm transition-shadow text-left ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && <span role="button" onClick={handleClear} className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
              <X size={14} />
            </span>}
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-44 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((opt) => <button key={opt} type="button" onClick={() => handleSelect(opt)} className={`w-full text-left px-3 py-2 text-sm transition-colors ${value === opt ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {opt}
                </button>) : <div className="px-3 py-4 text-center text-sm text-slate-400">
                Aucun résultat
              </div>}
          </div>
        </div>}
    </div>;
}