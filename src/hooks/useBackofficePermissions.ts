import { useMemo } from 'react';
import { useFleetStore } from '../state/FleetStore';
import {
  getBackofficePermissions,
  type BackofficePermissions,
  type BackofficeRole
} from '../utils/backofficePermissions';

export function useBackofficePermissions(): BackofficePermissions | null {
  const { backofficeRole } = useFleetStore();
  return useMemo(
    () => (backofficeRole ? getBackofficePermissions(backofficeRole) : null),
    [backofficeRole]
  );
}

export function useBackofficeRole(): BackofficeRole | null {
  return useFleetStore().backofficeRole;
}
