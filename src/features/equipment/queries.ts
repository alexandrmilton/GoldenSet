import { useMutation, useQuery } from '@tanstack/react-query';

import type { CatalogItem, EquipmentKind } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useCatalog(kind: EquipmentKind) {
  return useQuery({
    queryKey: ['catalog', kind],
    staleTime: Infinity,
    queryFn: async (): Promise<CatalogItem[]> => {
      const { data, error } = await supabase
        .from('equipment_catalog')
        .select('*')
        .eq('kind', kind)
        .eq('is_active', true)
        .order('brand')
        .order('model');
      if (error) throw error;
      return data;
    },
  });
}

export function catalogLabel(item: CatalogItem) {
  return `${item.brand} ${item.model}`;
}

export type EquipmentDraft = {
  kind: EquipmentKind;
  catalogId?: string | null;
  /** Used when the model is not in the catalogue — plenty of racquets are not. */
  customName?: string | null;
  stringModel?: string | null;
  tensionKg?: number | null;
};

/**
 * Saves what the player plays with. Everything except the racquet itself is
 * optional: many amateurs genuinely do not know what is strung in theirs, and a
 * required field there would cost us the signup.
 */
export function useSaveEquipment(profileId: string | undefined) {
  return useMutation({
    mutationFn: async (drafts: EquipmentDraft[]) => {
      const rows = drafts
        .filter((draft) => draft.catalogId || draft.customName)
        .map((draft) => ({
          profile_id: profileId as string,
          kind: draft.kind,
          catalog_id: draft.catalogId ?? null,
          custom_name: draft.customName ?? null,
          string_model: draft.stringModel ?? null,
          tension_kg: draft.tensionKg ?? null,
          is_primary: true,
        }));

      if (!profileId || rows.length === 0) return [];

      const { data, error } = await supabase.from('user_equipment').insert(rows).select();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyEquipment(profileId: string | undefined) {
  return useQuery({
    queryKey: ['equipment', profileId],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_equipment')
        .select('*, equipment_catalog(brand, model, kind)')
        .eq('profile_id', profileId as string)
        .is('retired_at', null);
      if (error) throw error;
      return data;
    },
  });
}
