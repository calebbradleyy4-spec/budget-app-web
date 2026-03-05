import { create } from 'zustand';
import * as categoriesApi from '../api/categories';
import type { CategoryDTO } from '../types/shared';

interface CategoriesState {
  categories: CategoryDTO[];
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await categoriesApi.getCategories();
      set({ categories: data, isLoading: false });
    } catch (err: unknown) {
      const e = err as { message?: string };
      set({ error: e?.message || 'Failed to load categories', isLoading: false });
    }
  },
}));
