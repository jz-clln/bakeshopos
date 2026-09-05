// File: app/src/hooks/useProducts.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-context';
import {
  createProduct,
  deleteProduct,
  fetchProductWithDetails,
  fetchProducts,
  updateProduct,
  type CreateProductInput,
  type UpdateProductInput,
} from '../api/products';

// Used by the catalog list screen (1B-ii), optionally filtered to one category.
export function useProducts(categoryId?: string) {
  const { organizationId } = useAuth();

  return useQuery({
    queryKey: ['products', organizationId, categoryId ?? 'all'],
    queryFn: () => fetchProducts(organizationId!, { categoryId }),
    enabled: !!organizationId,
  });
}

// Used by the product editor screen (1B-iii) — full nested detail.
export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductWithDetails(productId!),
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] });
    },
  });
}

export function useUpdateProduct() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateProductInput }) =>
      updateProduct(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] });
    },
  });
}