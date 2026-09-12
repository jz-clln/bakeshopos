// File: app/src/screens/NewOrderScreen.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { ArrowLeft, Search, UserPlus, Check, Trash2 } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { Dropdown } from '../components/ui/Dropdown';
import { CalendarInput, toDateString } from '../components/ui/Calendar';
import { useAuth } from '../lib/auth-context';
import { formatPrice } from '../lib/currency';
import { fetchProducts, fetchProductWithDetails } from '../api/products';
import { calculatePrice } from '../api/pricing';
import { searchCustomers, createCustomer, deleteCustomer, type Customer } from '../api/customers';
import { createOrder } from '../api/orders';
import type { ProductListItem, ProductWithDetails } from '../types/catalog';

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.06 },
  }),
};

export function NewOrderScreen() {
  const { organizationId } = useAuth();
  const navigate = useNavigate();

  // Customer
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addingNewCustomer, setAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Deleting a duplicate customer directly from the search results —
  // pendingDeleteId swaps that one row into an inline confirm bar
  // instead of a separate modal, since this is meant to be a quick
  // cleanup action, not a heavy flow.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Product / variant / options
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<ProductWithDetails | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  // Fulfillment
  const [eventDate, setEventDate] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'delivery'>('pickup');

  // Pricing / submission
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    fetchProducts(organizationId).then(setProducts).catch(console.error);
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || !customerQuery.trim()) {
      setCustomerResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchCustomers(organizationId, customerQuery).then(setCustomerResults).catch(console.error);
    }, 250);
    return () => clearTimeout(timeout);
  }, [organizationId, customerQuery]);

  useEffect(() => {
    if (!selectedProductId) {
      setProductDetails(null);
      return;
    }
    fetchProductWithDetails(selectedProductId).then((details) => {
      setProductDetails(details);
      setSelectedVariantId(null);
      setSelectedOptionValues({});
    }).catch(console.error);
  }, [selectedProductId]);

  useEffect(() => {
    if (!selectedVariantId) {
      setUnitPrice(null);
      return;
    }
    const optionValueIds = Object.values(selectedOptionValues);
    setPriceError(null);
    calculatePrice(selectedVariantId, optionValueIds)
      .then(setUnitPrice)
      .catch((err) => {
        setUnitPrice(null);
        setPriceError(err instanceof Error ? err.message : 'Could not calculate price');
      });
  }, [selectedVariantId, selectedOptionValues]);

  async function handleCreateNewCustomer() {
    if (!organizationId || !newCustomerName.trim()) return;
    try {
      const customer = await createCustomer(organizationId, {
        fullName: newCustomerName.trim(),
        phoneNumber: newCustomerPhone.trim() || undefined,
      });
      setSelectedCustomer(customer);
      setAddingNewCustomer(false);
      setCustomerQuery('');
    } catch (err) {
      console.error('Failed to create customer:', err);
    }
  }

  async function handleDeleteCustomer(customerId: string) {
    setDeletingCustomerId(customerId);
    setDeleteError(null);
    try {
      await deleteCustomer(customerId);
      setCustomerResults((prev) => prev.filter((c) => c.id !== customerId));
      setPendingDeleteId(null);
    } catch (err) {
      console.error('Failed to delete customer:', err);
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this customer.');
    } finally {
      setDeletingCustomerId(null);
    }
  }

  // Sublabel = starting price from the cheapest active variant, so the
  // dropdown carries real catalog data instead of a bare name.
  const productOptions = products.map((p) => {
    const activePrices = p.variants.filter((v) => v.is_active).map((v) => v.price_amount);
    const startingPrice = activePrices.length > 0 ? Math.min(...activePrices) : null;
    return {
      value: p.id,
      label: p.name,
      sublabel: startingPrice !== null ? `Starts at ${formatPrice(startingPrice)}` : undefined,
    };
  });

  // Earliest bookable date, driven by the selected product's lead_time_days.
  const minEventDate = productDetails
    ? toDateString(new Date(Date.now() + productDetails.lead_time_days * 86_400_000))
    : undefined;

  const allRequiredOptionsSelected =
    productDetails?.options
      .filter((o) => o.is_required)
      .every((o) => !!selectedOptionValues[o.id]) ?? true;

  const canSubmit =
    !!organizationId &&
    !!selectedCustomer &&
    !!selectedVariantId &&
    allRequiredOptionsSelected &&
    unitPrice !== null &&
    quantity > 0 &&
    !!eventDate &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit || !organizationId || !selectedCustomer || !selectedVariantId) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      await createOrder(organizationId, {
        customerId: selectedCustomer.id,
        variantId: selectedVariantId,
        optionValueIds: Object.values(selectedOptionValues),
        quantity,
        eventDate,
        fulfillmentMethod,
      });
      navigate('/orders');
    } catch (err) {
      console.error('Failed to create order:', err);
      setSubmitError(err instanceof Error ? err.message : 'Could not create order.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenShell>
      <MotionConfig reducedMotion="user">
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => navigate('/orders')}
            className="w-10 h-10 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90 shrink-0"
            aria-label="Back to Orders"
          >
            <ArrowLeft size={17} className="text-olive" />
          </button>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-accent-dark">
            New Order
          </h1>
        </motion.div>

        <div className="space-y-5 max-w-lg">
          {/* Customer */}
          <motion.section
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-3">Customer</p>

            <AnimatePresence mode="wait">
              {selectedCustomer ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between bg-accent-light/20 rounded-[12px] px-3 py-2.5"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-accent-dark">{selectedCustomer.full_name}</p>
                    {selectedCustomer.phone_number && (
                      <p className="text-[12px] text-olive">{selectedCustomer.phone_number}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-[12px] font-semibold text-accent-dark underline"
                  >
                    Change
                  </button>
                </motion.div>
              ) : addingNewCustomer ? (
                <motion.div
                  key="adding"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2"
                >
                  <input
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Customer's full name"
                    className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
                  />
                  <input
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Phone number (optional)"
                    className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleCreateNewCustomer}
                      disabled={!newCustomerName.trim()}
                      className="flex-1 text-[13px] font-semibold px-3 py-2 rounded-[10px] bg-accent-dark text-white disabled:opacity-40"
                    >
                      Add customer
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAddingNewCustomer(false)}
                      className="text-[13px] font-semibold px-3 py-2 rounded-[10px] text-olive"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="relative mb-2">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive/60" />
                    <input
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      placeholder="Search customer by name…"
                      className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
                    />
                  </div>

                  {customerResults.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {deleteError && (
                        <p className="text-[12px] text-red-600 px-1 pb-1">{deleteError}</p>
                      )}
                      {customerResults.map((c) =>
                        pendingDeleteId === c.id ? (
                          <div
                            key={c.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] bg-red-50"
                          >
                            <span className="text-[13px] text-red-700 truncate">
                              Delete {c.full_name}?
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setPendingDeleteId(null)}
                                className="text-[12px] font-semibold text-olive px-2 py-1"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(c.id)}
                                disabled={deletingCustomerId === c.id}
                                className="text-[12px] font-semibold text-white bg-red-600 px-3 py-1 rounded-[8px] disabled:opacity-50"
                              >
                                {deletingCustomerId === c.id ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div key={c.id} className="flex items-center gap-1">
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerQuery('');
                                setCustomerResults([]);
                              }}
                              className="flex-1 min-w-0 text-left px-3 py-2 rounded-[10px] hover:bg-platinum/50 text-[14px] text-accent-dark"
                            >
                              {c.full_name}
                              {c.phone_number && <span className="text-olive text-[12px]"> · {c.phone_number}</span>}
                            </motion.button>
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setPendingDeleteId(c.id);
                              }}
                              aria-label={`Delete ${c.full_name}`}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-olive/60 hover:text-red-600 hover:bg-red-50 transition-colors duration-150 shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setAddingNewCustomer(true)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-dark"
                  >
                    <UserPlus size={14} />
                    Add a new customer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Product */}
          <motion.section
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-3">Product</p>

            <Dropdown
              options={productOptions}
              value={selectedProductId}
              onChange={(id) => setSelectedProductId(id)}
              placeholder="Select a product…"
              className="mb-3"
            />

            <AnimatePresence>
              {productDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                >
                  <p className="text-[12px] font-semibold text-olive mb-1.5">Size / variant</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {productDetails.variants.filter((v) => v.is_active).map((v) => (
                      <motion.button
                        key={v.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border ${
                          selectedVariantId === v.id
                            ? 'bg-accent-dark text-white border-accent-dark'
                            : 'bg-white text-accent-dark border-platinum'
                        }`}
                      >
                        {v.name}
                      </motion.button>
                    ))}
                  </div>

                  {productDetails.options.map((option) => (
                    <div key={option.id} className="mb-4">
                      <p className="text-[12px] font-semibold text-olive mb-1.5">
                        {option.name}{option.is_required && <span className="text-red-500"> *</span>}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => (
                          <motion.button
                            key={value.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              setSelectedOptionValues((prev) => ({ ...prev, [option.id]: value.id }))
                            }
                            className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border ${
                              selectedOptionValues[option.id] === value.id
                                ? 'bg-accent-dark text-white border-accent-dark'
                                : 'bg-white text-accent-dark border-platinum'
                            }`}
                          >
                            {value.value}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-olive">Quantity</p>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-full bg-platinum flex items-center justify-center text-accent-dark font-bold"
                      >
                        −
                      </motion.button>
                      <span className="text-[15px] font-semibold text-accent-dark w-6 text-center">{quantity}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 rounded-full bg-platinum flex items-center justify-center text-accent-dark font-bold"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Fulfillment */}
          <motion.section
            custom={3} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-3">Fulfillment</p>

            <p className="text-[12px] font-semibold text-olive mb-1.5">Event date</p>
            <CalendarInput
              value={eventDate}
              onChange={setEventDate}
              placeholder="Select event date…"
              minDate={minEventDate}
              className="mb-4"
            />

            <p className="text-[12px] font-semibold text-olive mb-1.5">Method</p>
            <div className="flex gap-2">
              {(['pickup', 'delivery'] as const).map((method) => (
                <motion.button
                  key={method}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFulfillmentMethod(method)}
                  className={`flex-1 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold border capitalize ${
                    fulfillmentMethod === method
                      ? 'bg-accent-dark text-white border-accent-dark'
                      : 'bg-white text-accent-dark border-platinum'
                  }`}
                >
                  {method}
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {fulfillmentMethod === 'delivery' && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="text-[12px] text-olive mt-2"
                >
                  Delivery address collection isn't built yet — you'll need to arrange the address with the customer directly for now.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Price + submit */}
          <motion.section
            custom={4} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            {priceError ? (
              <p className="text-[13px] text-red-600 mb-3">{priceError}</p>
            ) : unitPrice !== null ? (
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[13px] text-olive">Total ({quantity} ×)</p>
                <p className="text-[20px] font-bold text-accent-dark">{formatPrice(unitPrice * quantity)}</p>
              </div>
            ) : (
              <p className="text-[13px] text-olive mb-3">Select a product and size to see the price.</p>
            )}

            {submitError && <p className="text-[13px] text-red-600 mb-3">{submitError}</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-[14px] bg-accent-dark text-white font-semibold transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
            >
              <Check size={16} />
              {submitting ? 'Creating order…' : 'Create order'}
            </button>
          </motion.section>
        </div>
      </MotionConfig>
    </ScreenShell>
  );
}