// File: app/src/hooks/useCategories.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-context';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../api/categories';
import type { ProductCategory } from '../types/catalog';

export function useCategories() {
  const { organizationId } = useAuth();

  return useQuery({
    queryKey: ['categories', organizationId],
    queryFn: () => fetchCategories(organizationId!),
    enabled: !!organizationId,
  });
}

export function useCreateCategory() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; sortOrder?: number }) =>
      createCategory(organizationId!, input.name, input.sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', organizationId] });
    },
  });
}

export function useUpdateCategory() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<ProductCategory, 'name' | 'sort_order'>>;
    }) => updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', organizationId] });
    },
  });
}

export function useDeleteCategory() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', organizationId] });
    },
  });
}