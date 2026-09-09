// File: app/src/screens/CatalogScreen.tsx

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronRight, X } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { formatPrice } from '../lib/currency';
import { getStartingPrice } from '../lib/catalog-helpers';
import type { ProductCategory, ProductListItem } from '../types/catalog';

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.05 },
  }),
};

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const listRow = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

/* Screen */
export function CatalogScreen() {
  const [query, setQuery] = useState('');
  const { data: categories, isLoading: catLoading, isError: catError } = useCategories();
  const { data: products,   isLoading: prodLoading, isError: prodError } = useProducts();

  const isLoading = catLoading || prodLoading;
  const isError   = catError  || prodError;

  const filtered = useMemo(
    () => (products ?? []).filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  return (
    <ScreenShell>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-4 mb-5"
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        <h1 className="font-display text-[26px] md:text-3xl font-bold tracking-tight text-accent-dark">
          Catalog
        </h1>
        <Link
          to="/catalog/new"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent-dark text-white px-5 h-11 text-sm font-semibold shadow-control transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add product
        </Link>
      </motion.div>

      <div className="max-w-2xl">
        {/* Search */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="relative mb-5"
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-olive pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full h-11 pl-10 pr-10 rounded-full bg-white border border-platinum/70 text-[15px] text-accent-dark placeholder:text-olive/60 focus:outline-none focus:ring-2 focus:ring-accent-dark/20 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-shadow duration-200"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-platinum/70 flex items-center justify-center text-olive transition-colors duration-150 hover:bg-platinum active:scale-90"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
        </motion.div>

        {/* States */}
        {isLoading && <LoadingState />}
        {!isLoading && isError && <ErrorState />}
        {!isLoading && !isError && (
          <CatalogList
            categories={categories ?? []}
            products={filtered}
            hasQuery={query.length > 0}
          />
        )}
      </div>

      {/* Mobile FAB */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: 0.35 }}
        className="sm:hidden fixed right-5 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20"
      >
        <Link
          to="/catalog/new" aria-label="Add product"
          className="w-14 h-14 rounded-full bg-accent-dark text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-transform duration-150 active:scale-90"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>
      </motion.div>
    </ScreenShell>
  );
}

/* Sub-components */

function LoadingState() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading catalog">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[60px] rounded-[16px] bg-platinum/60" />
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="pt-16 flex flex-col items-center gap-2">
      <p className="text-[15px] font-medium text-accent-dark">Couldn't load catalog</p>
      <p className="text-sm text-olive">Check your connection and try again.</p>
    </div>
  );
}

function CatalogList({
  categories,
  products,
  hasQuery,
}: {
  categories: ProductCategory[];
  products: ProductListItem[];
  hasQuery: boolean;
}) {
  if (products.length === 0) {
    return (
      <div className="pt-16 flex flex-col items-center gap-3 text-center px-6">
        <p className="text-[15px] font-medium text-accent-dark">
          {hasQuery ? 'No results' : 'No products yet'}
        </p>
        <p className="text-sm text-olive">
          {hasQuery
            ? 'Try a different search term.'
            : 'Add your first product to start building your catalog.'}
        </p>
        {!hasQuery && (
          <Link
            to="/catalog/new"
            className="inline-flex items-center gap-2 rounded-full bg-accent-dark text-white px-5 h-11 text-sm font-semibold shadow-control transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] mt-1"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add product
          </Link>
        )}
      </div>
    );
  }

  // When searching, show a flat list without category grouping
  if (hasQuery) {
    return (
      <motion.div
        className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-platinum/60"
        variants={listContainer} initial="hidden" animate="visible"
      >
        {products.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </motion.div>
    );
  }

  const groups = categories
    .map((cat) => ({
      category: cat,
      items: products.filter((p) => p.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  const uncategorized = products.filter((p) => !p.category_id);

  return (
    <motion.div className="space-y-5" variants={listContainer} initial="hidden" animate="visible">
      {groups.map(({ category, items }, gi) => (
        <ProductGroup key={category.id} title={category.name} items={items} groupIndex={gi} />
      ))}
      {uncategorized.length > 0 && (
        <ProductGroup
          title="Uncategorized"
          items={uncategorized}
          groupIndex={groups.length}
        />
      )}
    </motion.div>
  );
}

function ProductGroup({
  title,
  items,
  groupIndex,
}: {
  title: string;
  items: ProductListItem[];
  groupIndex: number;
}) {
  return (
    <motion.div
      custom={groupIndex}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-platinum/60">
        {items.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </div>
    </motion.div>
  );
}

function ProductRow({ product }: { product: ProductListItem }) {
  const startingPrice = getStartingPrice(product.variants);

  return (
    <motion.div variants={listRow}>
      <Link
        to={`/catalog/${product.id}`}
        className="flex items-center justify-between gap-3 px-5 py-3.5 min-h-[56px] transition-colors duration-150 hover:bg-platinum/20 active:bg-platinum/30"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-accent-dark truncate leading-snug">
            {product.name}
          </p>
          {!product.is_active && (
            <p className="text-[12px] text-olive">Inactive</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-sm text-olive">
            {startingPrice !== null ? `From ${formatPrice(startingPrice)}` : 'No price'}
          </p>
          <ChevronRight size={15} className="text-olive/50" />
        </div>
      </Link>
    </motion.div>
  );
}