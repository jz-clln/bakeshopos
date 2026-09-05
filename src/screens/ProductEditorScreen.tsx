// File: app/src/screens/ProductEditorScreen.tsx
//
// Pushed full-screen (no tab bar) rather than living inside AppShell —
// this is a form, not a tab destination, matching how iOS treats
// create/edit screens.
//
// New products only get the basic fields at first. Sizes and options
// need a real product to attach to, so those sections only appear
// once the product has been saved for the first time.

import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { NavBar } from '../components/layout/NavBar';
import { VariantsSection } from '../components/catalog/VariantsSection';
import { OptionsSection } from '../components/catalog/OptionsSection';
import { useCategories } from '../hooks/useCategories';
import {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
} from '../hooks/useProducts';

export function ProductEditorScreen() {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const isNewProduct = !routeProductId || routeProductId === 'new';
  const navigate = useNavigate();

  const { data: product, isLoading } = useProduct(
    isNewProduct ? undefined : routeProductId
  );
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('0');
  const [minQuantity, setMinQuantity] = useState('1');

  // Once an existing product loads, fill the form from it.
  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId(product.category_id ?? '');
      setDescription(product.description ?? '');
      setSku(product.sku ?? '');
      setLeadTimeDays(String(product.lead_time_days));
      setMinQuantity(String(product.min_quantity));
    }
  }, [product]);

  if (!isNewProduct && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  function handleSave() {
    if (!name.trim()) return;

    if (isNewProduct) {
      createProduct.mutate(
        {
          name: name.trim(),
          categoryId: categoryId || null,
          description: description.trim() || undefined,
          sku: sku.trim() || undefined,
          leadTimeDays: Number(leadTimeDays) || 0,
          minQuantity: Number(minQuantity) || 1,
        },
        {
          // Swap into edit mode for the product we just created, so
          // sizes and options can now be added to it.
          onSuccess: (newProduct) =>
            navigate(`/catalog/${newProduct.id}`, { replace: true }),
        }
      );
    } else {
      updateProduct.mutate({
        id: routeProductId!,
        updates: {
          name: name.trim(),
          category_id: categoryId || null,
          description: description.trim() || null,
          sku: sku.trim() || null,
          lead_time_days: Number(leadTimeDays) || 0,
          min_quantity: Number(minQuantity) || 1,
        },
      });
    }
  }

  function handleDelete() {
    if (!routeProductId) return;
    if (!window.confirm(`Delete "${product?.name}"? This can't be undone.`)) return;
    deleteProduct.mutate(routeProductId, {
      onSuccess: () => navigate('/catalog', { replace: true }),
    });
  }

  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar
        title={isNewProduct ? 'New Product' : product?.name ?? 'Product'}
        leading={
          <button onClick={() => navigate('/catalog')} aria-label="Back to catalog">
            <ChevronLeft size={26} className="text-accent" />
          </button>
        }
        trailing={
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="text-accent font-medium disabled:opacity-40"
          >
            Save
          </button>
        }
      />

      <main
        className="flex-1 px-4 space-y-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
            Details
          </h2>
          <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            <FormRow label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chocolate Cake"
                className="w-full text-base focus:outline-none"
              />
            </FormRow>
            <FormRow label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-base bg-transparent focus:outline-none"
              >
                <option value="">None</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="SKU">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Optional"
                className="w-full text-base focus:outline-none"
              />
            </FormRow>
            <FormRow label="Lead time (days)">
              <input
                type="number"
                inputMode="numeric"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="w-full text-base focus:outline-none"
              />
            </FormRow>
            <FormRow label="Min. order qty">
              <input
                type="number"
                inputMode="numeric"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full text-base focus:outline-none"
              />
            </FormRow>
          </div>
          <div className="mt-3 rounded-xl bg-white border border-gray-200 px-4 py-3">
            <label className="block text-sm text-gray-500 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional"
              className="w-full text-base focus:outline-none resize-none"
            />
          </div>
        </section>

        {isNewProduct ? (
          <p className="text-sm text-gray-400 px-1">
            Save the product first to add sizes and options.
          </p>
        ) : (
          <>
            <VariantsSection
              productId={routeProductId!}
              variants={product?.variants ?? []}
            />
            <OptionsSection
              productId={routeProductId!}
              options={product?.options ?? []}
            />

            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-red-200 text-red-600 font-medium"
            >
              <Trash2 size={18} /> Delete Product
            </button>
          </>
        )}
      </main>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
      <label className="text-sm text-gray-500 w-32 shrink-0">{label}</label>
      {children}
    </div>
  );
}