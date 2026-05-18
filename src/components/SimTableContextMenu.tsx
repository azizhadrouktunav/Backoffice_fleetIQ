import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Edit2,
  Trash2,
  ArrowLeftRight,
  Unlink,
  CheckSquare,
  Square,
  Users
} from 'lucide-react';
import type { SimCard } from '../state/FleetStore';

export type SimRowContextMenuState = {
  sim: SimCard;
  x: number;
  y: number;
} | null;

type SimTableContextMenuProps = {
  menu: SimRowContextMenuState;
  onClose: () => void;
  selectedCount: number;
  isRowSelected: boolean;
  isSelectable: boolean;
  canAssign: boolean;
  canUnassign: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onDelete: () => void;
  onToggleSelection: () => void;
  onBulkAssign: () => void;
  bulkAssignCount: number;
};

export function SimTableContextMenu({
  menu,
  onClose,
  selectedCount,
  isRowSelected,
  isSelectable,
  canAssign,
  canUnassign,
  canDelete,
  onEdit,
  onAssign,
  onUnassign,
  onDelete,
  onToggleSelection,
  onBulkAssign,
  bulkAssignCount
}: SimTableContextMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!menu || !panelRef.current) return;
    const panel = panelRef.current;
    const margin = 8;
    const { innerWidth, innerHeight } = window;
    let x = menu.x;
    let y = menu.y;
    const rect = panel.getBoundingClientRect();
    if (x + rect.width > innerWidth - margin) x = innerWidth - rect.width - margin;
    if (y + rect.height > innerHeight - margin) y = innerHeight - rect.height - margin;
    if (x < margin) x = margin;
    if (y < margin) y = margin;
    setPosition({ x, y });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menu, onClose]);

  if (!menu) return null;

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        ref={panelRef}
        role="menu"
        className="fixed z-50 min-w-[220px] py-1.5 bg-white border border-slate-200 rounded-lg shadow-lg text-sm"
        style={{ left: position.x, top: position.y }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 mb-1">
          Actions sur la puce
        </p>
        <button
          type="button"
          role="menuitem"
          onClick={() => run(onEdit)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Edit2 size={15} className="text-slate-400" />
          Modifier la puce
        </button>
        {canAssign && (
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onAssign)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeftRight size={15} className="text-emerald-600" />
            Affecter à un client
          </button>
        )}
        {canUnassign && (
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onUnassign)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
          >
            <Unlink size={15} className="text-amber-600" />
            Retirer du client
          </button>
        )}

        {isSelectable && (
          <>
            <div className="my-1 border-t border-slate-100" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Affectation groupée
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={() => run(onToggleSelection)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-blue-50 transition-colors"
            >
              {isRowSelected ? (
                <Square size={15} className="text-blue-600" />
              ) : (
                <CheckSquare size={15} className="text-blue-600" />
              )}
              {isRowSelected ? 'Désélectionner' : 'Sélectionner'}
              {selectedCount > 0 && !isRowSelected && (
                <span className="ml-auto text-[10px] text-slate-400">{selectedCount} déjà</span>
              )}
            </button>
            {bulkAssignCount > 0 && (
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onBulkAssign)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-blue-700 hover:bg-blue-50 font-medium transition-colors"
              >
                <Users size={15} className="text-blue-600" />
                Affecter en groupe ({bulkAssignCount} puce{bulkAssignCount > 1 ? 's' : ''})
              </button>
            )}
          </>
        )}

        {canDelete && (
          <>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              role="menuitem"
              onClick={() => run(onDelete)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
              Supprimer la puce
            </button>
          </>
        )}
      </div>
    </>
  );
}
