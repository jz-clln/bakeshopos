// File: app/src/hooks/useProductOptions.ts
//
// Same pattern as variants — options and their values are only ever
// viewed nested inside one product, so mutations just invalidate that
// product's detail query.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-context';
import {
  createOption,
  createOptionValue,
  deleteOption,
  deleteOptionValue,
  updateOption,
  updateOptionValue,
  type CreateOptionInput,
  type CreateOptionValueInput,
} from '../api/options';
import type { ProductOption, ProductOptionValue } from '../types/catalog';

function invalidateProduct(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string
) {
  queryClient.invalidateQueries({ queryKey: ['product', productId] });
}

export function useCreateOption(productId: string) {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOptionInput) =>
      createOption(organizationId!, productId, input),
    onSuccess: () => invalidateProduct(queryClient, productId),
  });
}

export function useUpdateOption(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<ProductOption, 'name' | 'is_required' | 'sort_order'>>;
    }) => updateOption(id, updates),
    onSuccess: () => invalidateProduct(queryClient, productId),
  });
}

export function useDeleteOption(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOption(id),
    onSuccess: () => invalidateProduct(queryClient, productId),
  });
}

export function useCreateOptionValue(productId: string) {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ optionId, input }: { optionId: string; input: CreateOptionValueInput }) =>
      createOptionValue(organizationId!, optionId, input),
    onSuccess: () => invalidateProduct(queryClient, productId),
  });
}

export function useUpdateOptionValue(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<ProductOptionValue, 'value' | 'price_adjustment_amount' | 'sort_order'>>;
    }) => updateOptionValue(id, updates),
    onSuccess: () => invalidateProduct(queryClient, productId),
  });
}

export function useDeleteOptionValue(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOptionValue(id),
    onSuccess: () => invalidateProduct(queryClient, productId),
  });
}