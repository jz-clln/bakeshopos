// File: app/src/screens/CatalogScreen.tsx
//
// Browses the catalog grouped by category, iOS-style grouped-list
// look. Creating/editing products comes in 1B-iii — this screen is
// read-only for now.

import { AppShell } from '../components/layout/AppShell';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { formatPrice } from '../lib/currency';
import { getStartingPrice } from '../lib/catalog-helpers';
import type { ProductCategory, ProductListItem } from '../types/catalog';

export function CatalogScreen() {
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories();
  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
  } = useProducts();

  const isLoading = categoriesLoading || productsLoading;
  const isError = categoriesError || productsError;

  return (
    <AppShell title="Catalog">
      {isLoading && <LoadingState />}
      {!isLoading && isError && <ErrorState />}
      {!isLoading && !isError && (
        <CatalogList categories={categories ?? []} products={products ?? []} />
      )}
    </AppShell>
  );
}

function LoadingState() {
  return (
    <div className="pt-4 space-y-3 animate-pulse" aria-label="Loading catalog">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="pt-16 text-center">
      <p className="text-gray-500">
        Couldn't load your catalog. Check your connection and try again.
      </p>
    </div>
  );
}

function CatalogList({
  categories,
  products,
}: {
  categories: ProductCategory[];
  products: ProductListItem[];
}) {
  if (products.length === 0) {
    return (
      <div className="pt-16 text-center">
        <p className="text-gray-500">No products yet.</p>
      </div>
    );
  }

  const groups = categories
    .map((category) => ({
      category,
      items: products.filter((product) => product.category_id === category.id),
    }))
    .filter((group) => group.items.length > 0);

  const uncategorized = products.filter((product) => !product.category_id);

  return (
    <div className="pt-4 pb-4 space-y-6">
      {groups.map(({ category, items }) => (
        <ProductGroup key={category.id} title={category.name} items={items} />
      ))}
      {uncategorized.length > 0 && (
        <ProductGroup title="Uncategorized" items={uncategorized} />
      )}
    </div>
  );
}

function ProductGroup({
  title,
  items,
}: {
  title: string;
  items: ProductListItem[];
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
        {title}
      </h2>
      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {items.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: ProductListItem }) {
  const startingPrice = getStartingPrice(product.variants);

  return (
    <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
      <div>
        <p className="text-base text-gray-900">{product.name}</p>
        {!product.is_active && (
          <span className="text-xs text-gray-400">Inactive</span>
        )}
      </div>
      <p className="text-sm text-gray-500 shrink-0 ml-3">
        {startingPrice !== null ? `From ${formatPrice(startingPrice)}` : 'No price set'}
      </p>
    </div>
  );
}