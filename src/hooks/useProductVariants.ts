// File: app/src/hooks/useProductVariants.ts
//
// Variants are always viewed as part of a product (via useProduct), so
// these mutations just invalidate that one product's detail query
// rather than having a list query of their own.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-context';
import {
  createVariant,
  deleteVariant,
  updateVariant,
  type CreateVariantInput,
} from '../api/variants';
import type { ProductVariant } from '../types/catalog';

export function useCreateVariant(productId: string) {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVariantInput) =>
      createVariant(organizationId!, productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] });
    },
  });
}

export function useUpdateVariant(productId: string) {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<ProductVariant, 'name' | 'price_amount' | 'is_active'>>;
    }) => updateVariant(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] });
    },
  });
}

export function useDeleteVariant(productId: string) {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] });
    },
  });
}