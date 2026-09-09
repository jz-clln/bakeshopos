// File: app/src/screens/ProductEditorScreen.tsx

import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trash2, Sparkles, Info } from 'lucide-react';
import { NavBar } from '../components/layout/NavBar';
import { CategoryPicker } from '../components/catalog/CategoryPicker';
import { VariantsSection } from '../components/catalog/VariantsSection';
import { OptionsSection } from '../components/catalog/OptionsSection';
import { Stepper } from '../components/ui/Stepper';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
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

const AI_PLACEHOLDER = `Help your AI assistant answer customer questions accurately. For example:

What flavors or fillings are available?
How far in advance should customers order?
Does it need refrigeration after pickup?
Any allergens (nuts, dairy, gluten)?
What occasions is this best for?

The more you write here, the better your assistant can answer DMs on Facebook and Instagram.`;

export function ProductEditorScreen() {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const isNewProduct = !routeProductId || routeProductId === 'new';
  const navigate = useNavigate();

  const { data: product, isLoading } = useProduct(isNewProduct ? undefined : routeProductId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(0);
  const [minQuantity, setMinQuantity] = useState(1);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId(product.category_id ?? '');
      setDescription(product.description ?? '');
      setSku(product.sku ?? '');
      setLeadTimeDays(product.lead_time_days);
      setMinQuantity(product.min_quantity);
    }
  }, [product]);

  if (!isNewProduct && isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="space-y-3 w-full max-w-sm px-5 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-[20px] bg-platinum/60" />
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
          leadTimeDays,
          minQuantity,
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
          lead_time_days: leadTimeDays,
          min_quantity: minQuantity,
        },
      });
    }
  }

  function handleDelete() {
    if (!routeProductId) return;
    deleteProduct.mutate(routeProductId, {
      onSuccess: () => navigate('/catalog', { replace: true }),
    });
  }

  const saving = createProduct.isPending || updateProduct.isPending;
  const descLength = description.length;

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

        {/* Product details */}
        <motion.section custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
            Product details
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-platinum/60">

            <FormRow label="Product name" hint="What customers call this item" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chocolate Overload Cake"
                className="w-full text-[15px] text-accent-dark placeholder:text-olive/50 bg-transparent focus:outline-none"
              />
            </FormRow>

            <FormRow label="Category" hint="Groups products in your catalog">
              <CategoryPicker value={categoryId} onChange={setCategoryId} />
            </FormRow>

            <FormRow label="Order deadline" hint="How many days before pickup customers must order">
              <div className="flex items-center gap-3">
                <Stepper
                  value={leadTimeDays}
                  onChange={setLeadTimeDays}
                  min={0}
                  ariaLabel="order deadline in days"
                />
                <span className="text-[14px] text-olive">
                  {leadTimeDays === 1 ? 'day' : 'days'} in advance
                </span>
              </div>
            </FormRow>

            <FormRow label="Minimum order" hint="Fewest pieces a customer can order at once">
              <div className="flex items-center gap-3">
                <Stepper
                  value={minQuantity}
                  onChange={setMinQuantity}
                  min={1}
                  ariaLabel="minimum order quantity"
                />
                <span className="text-[14px] text-olive">
                  {minQuantity === 1 ? 'piece' : 'pieces'} minimum
                </span>
              </div>
            </FormRow>

            <FormRow label="Internal code" hint="Your own reference, not visible to customers">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CHOC-001 (optional)"
                className="w-full text-[15px] text-accent-dark placeholder:text-olive/50 bg-transparent focus:outline-none"
              />
            </FormRow>

          </div>
        </motion.section>

        {/* AI assistant context */}
        <motion.section custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Sparkles size={13} className="text-accent-dark" strokeWidth={2} />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-olive">
              AI assistant context
            </p>
          </div>

          <div className="flex gap-3 bg-accent-dark/[0.06] rounded-[16px] px-4 py-3 mb-3">
            <Info size={16} className="text-accent-dark shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[13px] text-accent-dark leading-relaxed">
              Your AI chatbot reads this to answer customer questions on{' '}
              <span className="font-semibold">Facebook</span> and{' '}
              <span className="font-semibold">Instagram</span>. Write it like
              you are briefing a new staff member on this product.
            </p>
          </div>

          <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4 border border-transparent focus-within:border-accent-dark/30 transition-colors duration-150">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder={AI_PLACEHOLDER}
              className="w-full text-[15px] text-accent-dark placeholder:text-olive/40 bg-transparent focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-platinum/60">
              <p className="text-[12px] text-olive">
                {descLength === 0
                  ? 'No context yet. Your assistant will give generic replies.'
                  : descLength < 100
                  ? 'Add more detail for better replies.'
                  : descLength < 300
                  ? 'Good start. More detail helps.'
                  : 'Great context. Your assistant can answer accurately.'}
              </p>
              <span className="text-[12px] text-olive tabular-nums shrink-0 ml-3">
                {descLength} chars
              </span>
            </div>
          </div>
        </motion.section>

        {/* Variants and Options (existing product only) */}
        {isNewProduct ? (
          <motion.div
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="flex gap-3 bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4"
          >
            <Info size={16} className="text-olive shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[14px] text-olive leading-relaxed">
              Save this product first, then you can add{' '}
              <span className="font-medium text-accent-dark">sizes</span> and{' '}
              <span className="font-medium text-accent-dark">options</span> like flavors and add-ons.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
              <VariantsSection productId={routeProductId!} variants={product?.variants ?? []} />
            </motion.div>
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
              <OptionsSection productId={routeProductId!} options={product?.options ?? []} />
            </motion.div>
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-[16px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-red-500 text-[15px] font-semibold transition-colors duration-150 hover:bg-red-50 active:scale-[0.98]"
              >
                <Trash2 size={17} strokeWidth={2} />
                Delete Product
              </button>
            </motion.div>
          </>
        )}
      </main>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this product?"
        description={`This removes "${product?.name ?? 'this product'}" along with its sizes and options. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          handleDelete();
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}

function FormRow({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4 px-5 min-h-[56px] py-3.5 focus-within:bg-accent-light/10 transition-colors duration-150">
      <div className="sm:w-36 sm:shrink-0 sm:pt-0.5">
        <p className="text-[15px] text-accent-dark font-medium leading-snug">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </p>
        {hint && <p className="text-[12px] text-olive leading-snug mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1 min-w-0 sm:pt-0.5">{children}</div>
    </div>
  );
}