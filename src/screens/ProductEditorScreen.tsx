// File: app/src/screens/ProductEditorScreen.tsx

import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.07 },
  }),
};

export function ProductEditorScreen() {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const isNewProduct = !routeProductId || routeProductId === 'new';
  const navigate = useNavigate();

  const { data: product, isLoading } = useProduct(isNewProduct ? undefined : routeProductId);
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
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="space-y-3 w-full max-w-sm px-5 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-[16px] bg-platinum/60" />
          ))}
        </div>
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
        { onSuccess: (p) => navigate(`/catalog/${p.id}`, { replace: true }) }
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
    <div className="min-h-[100dvh] flex flex-col bg-[#FAFAF8]">
      <NavBar
        title={isNewProduct ? 'New Product' : (product?.name ?? 'Product')}
        leading={
          <button
            onClick={() => navigate('/catalog')}
            aria-label="Back to catalog"
            className="flex items-center gap-1 min-h-[44px] min-w-[44px] -ml-2 px-2 text-accent transition-opacity duration-150 hover:opacity-70"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
            <span className="text-[15px] font-medium hidden sm:inline">Catalog</span>
          </button>
        }
        trailing={
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="min-h-[44px] px-2 text-[15px] font-semibold text-accent disabled:opacity-30 transition-opacity duration-150 hover:opacity-70"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />

      <main
        className="flex-1 px-5 md:px-10 max-w-5xl mx-auto w-full space-y-5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
      >
        {/* Details section */}
        <motion.section custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
            Details
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-platinum/60">
            <FormRow label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chocolate Cake"
                className="w-full text-[15px] text-accent-dark placeholder:text-olive/50 bg-transparent focus:outline-none"
              />
            </FormRow>
            <FormRow label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-[15px] text-accent-dark bg-transparent focus:outline-none appearance-none"
              >
                <option value="">None</option>
                {(categories ?? []).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="SKU">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Optional"
                className="w-full text-[15px] text-accent-dark placeholder:text-olive/50 bg-transparent focus:outline-none"
              />
            </FormRow>
            <FormRow label="Lead time (days)">
              <input
                type="number"
                inputMode="numeric"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="w-full text-[15px] text-accent-dark bg-transparent focus:outline-none"
              />
            </FormRow>
            <FormRow label="Min. quantity">
              <input
                type="number"
                inputMode="numeric"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full text-[15px] text-accent-dark bg-transparent focus:outline-none"
              />
            </FormRow>
          </div>
        </motion.section>

        {/* Description */}
        <motion.section custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
            Description
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Optional — describe this product for your team or customers."
              className="w-full text-[15px] text-accent-dark placeholder:text-olive/50 bg-transparent focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </motion.section>

        {/* Variants + Options (existing product only) */}
        {isNewProduct ? (
          <motion.p
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="text-sm text-olive px-1"
          >
            Save the product first to add sizes and options.
          </motion.p>
        ) : (
          <>
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
              <VariantsSection productId={routeProductId!} variants={product?.variants ?? []} />
            </motion.div>
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
              <OptionsSection productId={routeProductId!} options={product?.options ?? []} />
            </motion.div>

            {/* Delete */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-[16px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-red-500 text-[15px] font-semibold transition-colors duration-150 hover:bg-red-50 active:scale-[0.98]"
              >
                <Trash2 size={17} strokeWidth={2} />
                Delete Product
              </button>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 min-h-[52px] py-3">
      <label className="text-[15px] text-olive w-36 shrink-0">{label}</label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}