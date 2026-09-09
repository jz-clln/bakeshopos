// File: app/src/screens/NewOrderScreen.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, UserPlus, Check } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { formatPrice } from '../lib/currency';
import { fetchProducts, fetchProductWithDetails } from '../api/products';
import { calculatePrice } from '../api/pricing';
import { searchCustomers, createCustomer, type Customer } from '../api/customers';
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

          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-accent-light/20 rounded-[12px] px-3 py-2.5">
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
            </div>
          ) : addingNewCustomer ? (
            <div className="space-y-2">
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
                <button
                  onClick={handleCreateNewCustomer}
                  disabled={!newCustomerName.trim()}
                  className="flex-1 text-[13px] font-semibold px-3 py-2 rounded-[10px] bg-accent-dark text-white disabled:opacity-40"
                >
                  Add customer
                </button>
                <button
                  onClick={() => setAddingNewCustomer(false)}
                  className="text-[13px] font-semibold px-3 py-2 rounded-[10px] text-olive"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
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
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerQuery('');
                        setCustomerResults([]);
                      }}
                      className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-platinum/50 text-[14px] text-accent-dark"
                    >
                      {c.full_name}
                      {c.phone_number && <span className="text-olive text-[12px]"> · {c.phone_number}</span>}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setAddingNewCustomer(true)}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-dark"
              >
                <UserPlus size={14} />
                Add a new customer
              </button>
            </>
          )}
        </motion.section>

        {/* Product */}
        <motion.section
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-3">Product</p>

          <select
            value={selectedProductId ?? ''}
            onChange={(e) => setSelectedProductId(e.target.value || null)}
            className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] mb-3 focus:outline-none focus:border-accent-dark/40"
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {productDetails && (
            <>
              <p className="text-[12px] font-semibold text-olive mb-1.5">Size / variant</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {productDetails.variants.filter((v) => v.is_active).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border ${
                      selectedVariantId === v.id
                        ? 'bg-accent-dark text-white border-accent-dark'
                        : 'bg-white text-accent-dark border-platinum'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>

              {productDetails.options.map((option) => (
                <div key={option.id} className="mb-4">
                  <p className="text-[12px] font-semibold text-olive mb-1.5">
                    {option.name}{option.is_required && <span className="text-red-500"> *</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => (
                      <button
                        key={value.id}
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
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-olive">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full bg-platinum flex items-center justify-center text-accent-dark font-bold"
                  >
                    −
                  </button>
                  <span className="text-[15px] font-semibold text-accent-dark w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-full bg-platinum flex items-center justify-center text-accent-dark font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.section>

        {/* Fulfillment */}
        <motion.section
          custom={3} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-3">Fulfillment</p>

          <p className="text-[12px] font-semibold text-olive mb-1.5">Event date</p>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] mb-4 focus:outline-none focus:border-accent-dark/40"
          />

          <p className="text-[12px] font-semibold text-olive mb-1.5">Method</p>
          <div className="flex gap-2">
            {(['pickup', 'delivery'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setFulfillmentMethod(method)}
                className={`flex-1 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold border capitalize ${
                  fulfillmentMethod === method
                    ? 'bg-accent-dark text-white border-accent-dark'
                    : 'bg-white text-accent-dark border-platinum'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
          {fulfillmentMethod === 'delivery' && (
            <p className="text-[12px] text-olive mt-2">
              Delivery address collection isn't built yet — you'll need to arrange the address with the customer directly for now.
            </p>
          )}
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
    </ScreenShell>
  );
}