// File: app/src/screens/CatalogScreen.tsx

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  ChevronRight,
  X,
  Package,
} from 'lucide-react';

import { ScreenShell } from '../components/layout/ScreenShell';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { formatPrice } from '../lib/currency';
import { getStartingPrice } from '../lib/catalog-helpers';

import type {
  ProductCategory,
  ProductListItem,
} from '../types/catalog';

/* ============================================================
   MOTION
============================================================ */

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 8,
  },

  visible: (i: number) => ({
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.26,
      ease: EASE,
      delay: i * 0.05,
    },
  }),
};

const listContainer = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const listRow = {
  hidden: {
    opacity: 0,
    y: 6,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.22,
      ease: EASE,
    },
  },
};

/* ============================================================
   CATALOG SCREEN
============================================================ */

export function CatalogScreen() {
  const [query, setQuery] = useState('');

  const {
    data: categories,
    isLoading: catLoading,
    isError: catError,
  } = useCategories();

  const {
    data: products,
    isLoading: prodLoading,
    isError: prodError,
  } = useProducts();

  const isLoading = catLoading || prodLoading;
  const isError = catError || prodError;

  const filtered = useMemo(
    () =>
      (products ?? []).filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ),
    [products, query]
  );

  return (
    <ScreenShell>
      <div className="mx-auto w-full min-w-0 max-w-[1200px] pb-6">

        {/* ==================================================
            HEADER
        ================================================== */}

        <motion.header
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-5 flex items-center justify-between gap-3"
        >
          {/* Title */}

          <div className="min-w-0 flex-1">

            <h1 className="font-display text-[23px] font-bold leading-tight tracking-[-0.035em] text-accent-dark sm:text-[26px]">
              Catalog
            </h1>

            {!isLoading && !isError && (
              <p className="mt-1 text-[11px] font-medium text-olive/60 sm:text-[12px]">
                {products?.length ?? 0}{' '}
                {(products?.length ?? 0) === 1
                  ? 'product'
                  : 'products'}
              </p>
            )}

          </div>

          {/* Desktop add product */}

          <Link
            to="/catalog/new"
            className="hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent-dark px-4 text-[12px] font-semibold text-white shadow-[0_3px_12px_rgba(42,35,32,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent-dark/95 hover:shadow-[0_6px_18px_rgba(42,35,32,0.18)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2 sm:inline-flex"
          >
            <Plus
              size={15}
              strokeWidth={2.2}
            />

            Add product
          </Link>

        </motion.header>

        {/* ==================================================
            CATALOG CONTENT
        ================================================== */}

        <div className="w-full min-w-0 max-w-[900px]">

          {/* ==================================================
              SEARCH
          ================================================== */}

          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative mb-5"
          >

            <div className="relative flex h-11 w-full items-center overflow-hidden rounded-[14px] border border-[#E5DED5] bg-white shadow-[0_2px_10px_rgba(42,35,32,0.045)] transition-all duration-150 focus-within:border-accent-dark/25 focus-within:shadow-[0_3px_14px_rgba(42,35,32,0.075)] focus-within:ring-2 focus-within:ring-accent-dark/[0.035]">

              {/* Search icon */}

              <Search
                size={16}
                strokeWidth={1.9}
                className="pointer-events-none absolute left-3.5 text-olive/55"
              />

              {/* Search input */}

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="h-full w-full min-w-0 bg-transparent pl-10 pr-10 text-[14px] font-medium text-accent-dark outline-none placeholder:font-normal placeholder:text-olive/45"
              />

              {/* Clear search */}

              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-olive/55 transition-colors duration-150 hover:bg-platinum/50 hover:text-accent-dark active:scale-90"
                >
                  <X
                    size={14}
                    strokeWidth={2}
                  />
                </button>
              )}

            </div>

            {/* Search result count */}

            {query.length > 0 && !isLoading && !isError && (
              <p className="mt-2 px-1 text-[11px] font-medium text-olive/60">
                {filtered.length}{' '}
                {filtered.length === 1
                  ? 'result'
                  : 'results'}
              </p>
            )}

          </motion.div>

          {/* ==================================================
              STATES
          ================================================== */}

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

        {/* ==================================================
            MOBILE FLOATING ACTION BUTTON
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.3,
            ease: EASE,
            delay: 0.35,
          }}
          className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-5 z-20 sm:hidden"
        >

          <Link
            to="/catalog/new"
            aria-label="Add product"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-dark text-white shadow-[0_8px_22px_rgba(42,35,32,0.22)] ring-1 ring-white/10 transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2"
          >
            <Plus
              size={20}
              strokeWidth={2.2}
            />
          </Link>

        </motion.div>

      </div>
    </ScreenShell>
  );
}

/* ============================================================
   LOADING STATE
============================================================ */

function LoadingState() {
  return (
    <div
      className="overflow-hidden rounded-[20px] border border-platinum/60 bg-white shadow-[0_3px_16px_rgba(42,35,32,0.035)]"
      aria-label="Loading catalog"
    >

      <div className="divide-y divide-platinum/45">

        {[0, 1, 2, 3].map((i) => (

          <div
            key={i}
            className="flex min-h-[64px] animate-pulse items-center gap-3 px-4 py-3 motion-reduce:animate-none sm:px-5"
          >

            {/* Product icon placeholder */}

            <div className="h-9 w-9 shrink-0 rounded-[11px] bg-platinum/55" />

            {/* Product details */}

            <div className="min-w-0 flex-1 space-y-2">

              <div className="h-3 w-32 max-w-full rounded-full bg-platinum/60" />

              <div className="h-2.5 w-20 max-w-full rounded-full bg-platinum/40" />

            </div>

            {/* Price placeholder */}

            <div className="h-3 w-14 shrink-0 rounded-full bg-platinum/50" />

          </div>

        ))}

      </div>

    </div>
  );
}

/* ============================================================
   ERROR STATE
============================================================ */

function ErrorState() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[20px] border border-platinum/60 bg-white px-5 py-8 text-center shadow-[0_3px_16px_rgba(42,35,32,0.035)]">

      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-platinum/40">
        <Package
          size={19}
          strokeWidth={1.7}
          className="text-olive"
        />
      </div>

      <p className="text-[13px] font-semibold text-accent-dark">
        Couldn't load catalog
      </p>

      <p className="mt-1 max-w-[240px] text-[11px] leading-5 text-olive/60">
        Check your connection and try again.
      </p>

    </div>
  );
}

/* ============================================================
   CATALOG LIST
============================================================ */

function CatalogList({
  categories,
  products,
  hasQuery,
}: {
  categories: ProductCategory[];
  products: ProductListItem[];
  hasQuery: boolean;
}) {

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (products.length === 0) {
    return (
      <div className="flex min-h-[210px] flex-col items-center justify-center rounded-[20px] border border-platinum/60 bg-white px-5 py-8 text-center shadow-[0_3px_16px_rgba(42,35,32,0.035)]">

        {/* Icon */}

        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-platinum/40">
          {hasQuery ? (
            <Search
              size={19}
              strokeWidth={1.7}
              className="text-olive"
            />
          ) : (
            <Package
              size={19}
              strokeWidth={1.7}
              className="text-olive"
            />
          )}
        </div>

        {/* Title */}

        <p className="text-[13px] font-semibold text-accent-dark">
          {hasQuery
            ? 'No results'
            : 'No products yet'}
        </p>

        {/* Description */}

        <p className="mt-1 max-w-[260px] text-[11px] leading-5 text-olive/60">
          {hasQuery
            ? 'Try a different search term.'
            : 'Add your first product to start building your catalog.'}
        </p>

        {/* Add product */}

        {!hasQuery && (
          <Link
            to="/catalog/new"
            className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent-dark px-4 text-[12px] font-semibold text-white shadow-[0_3px_10px_rgba(42,35,32,0.12)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2"
          >
            <Plus
              size={14}
              strokeWidth={2.2}
            />

            Add product
          </Link>
        )}

      </div>
    );
  }

  /* ==========================================================
     SEARCH RESULTS
  ========================================================== */

  if (hasQuery) {
    return (
      <motion.div
        className="divide-y divide-platinum/45 overflow-hidden rounded-[20px] border border-platinum/60 bg-white shadow-[0_3px_16px_rgba(42,35,32,0.035)]"
        variants={listContainer}
        initial="hidden"
        animate="visible"
      >

        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
          />
        ))}

      </motion.div>
    );
  }

  /* ==========================================================
     CATEGORY GROUPING
  ========================================================== */

  const groups = categories
    .map((cat) => ({
      category: cat,
      items: products.filter(
        (p) => p.category_id === cat.id
      ),
    }))
    .filter((g) => g.items.length > 0);

  const uncategorized = products.filter(
    (p) => !p.category_id
  );

  return (
    <motion.div
      className="space-y-5"
      variants={listContainer}
      initial="hidden"
      animate="visible"
    >

      {/* Category groups */}

      {groups.map(({ category, items }, gi) => (
        <ProductGroup
          key={category.id}
          title={category.name}
          items={items}
          groupIndex={gi}
        />
      ))}

      {/* Uncategorized products */}

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

/* ============================================================
   PRODUCT GROUP
============================================================ */

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
    <motion.section
      custom={groupIndex}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >

      {/* Group header */}

      <div className="mb-2.5 flex items-center justify-between gap-3 px-1">

        <h2 className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.13em] text-olive/80">
          {title}
        </h2>

        {/* Product count */}

        <span className="shrink-0 rounded-full border border-platinum/65 bg-white/80 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-olive/65">
          {items.length}
        </span>

      </div>

      {/* Grouped product list */}

      <div className="divide-y divide-platinum/45 overflow-hidden rounded-[20px] border border-platinum/60 bg-white shadow-[0_3px_16px_rgba(42,35,32,0.035)]">

        {items.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
          />
        ))}

      </div>

    </motion.section>
  );
}

/* ============================================================
   PRODUCT ROW
============================================================ */

function ProductRow({
  product,
}: {
  product: ProductListItem;
}) {

  const startingPrice = getStartingPrice(product.variants);

  return (
    <motion.div variants={listRow}>

      <Link
        to={`/catalog/${product.id}`}
        className="group flex min-h-[64px] w-full min-w-0 items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-platinum/[0.15] active:bg-platinum/30 focus-visible:outline-none focus-visible:bg-platinum/25 sm:gap-3.5 sm:px-5"
      >

        {/* ==================================================
            PRODUCT ICON
        ================================================== */}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#F5F1EC] text-accent-dark transition-colors duration-150 group-hover:bg-[#EFE9E1]">

          <Package
            size={16}
            strokeWidth={1.7}
          />

        </div>

        {/* ==================================================
            PRODUCT INFORMATION
        ================================================== */}

        <div className="min-w-0 flex-1">

          <p className="truncate text-[13px] font-semibold leading-5 tracking-[-0.01em] text-accent-dark sm:text-[14px]">
            {product.name}
          </p>

          {!product.is_active && (

            <div className="mt-1 flex items-center">

              <span className="inline-flex items-center gap-1 rounded-full bg-platinum/55 px-2 py-0.5 text-[10px] font-medium text-olive">

                <span className="h-1 w-1 rounded-full bg-olive/50" />

                Inactive

              </span>

            </div>

          )}

        </div>

        {/* ==================================================
            PRICE + NAVIGATION
        ================================================== */}

        <div className="flex min-w-0 max-w-[48%] shrink-0 items-center gap-2 sm:max-w-none sm:gap-3">

          {/* Price */}

          <div className="min-w-0 text-right">

            {startingPrice !== null ? (

              <p className="max-w-full truncate whitespace-nowrap text-[12px] font-semibold tracking-[-0.01em] tabular-nums text-accent-dark sm:text-[13px]">
                From {formatPrice(startingPrice)}
              </p>

            ) : (

              <p className="text-[11px] font-medium text-olive/50">
                No price
              </p>

            )}

          </div>

          {/* Navigation chevron */}

          <ChevronRight
            size={15}
            strokeWidth={1.9}
            className="shrink-0 text-olive/35 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-olive/60"
          />

        </div>

      </Link>

    </motion.div>
  );
}