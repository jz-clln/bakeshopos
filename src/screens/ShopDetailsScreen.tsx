// File: app/src/screens/ShopDetailsScreen.tsx

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Check,
  RefreshCw,
  Store,
  Phone,
  MapPin,
  Clock3,
  ShoppingBag,
  PackageCheck,
  Truck,
} from 'lucide-react';

import { ScreenShell } from '../components/layout/ScreenShell';
import { Switch } from '../components/ui/Switch';
import { useAuth } from '../lib/auth-context';

import {
  fetchShopProfile,
  updateShopProfile,
  setAcceptingOrders,
  uploadShopLogo,
  removeShopLogo,
  InvalidLogoFileError,
  type ShopProfile,
} from '../api/shopProfile';

const EASE = [0.23, 1, 0.32, 1] as const;

type InputMode =
  | 'none'
  | 'text'
  | 'tel'
  | 'url'
  | 'email'
  | 'numeric'
  | 'decimal'
  | 'search';

export function ShopDetailsScreen() {
  const { organizationId } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ShopProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [togglingAccepting, setTogglingAccepting] = useState(false);
  const [acceptingError, setAcceptingError] = useState<string | null>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  function loadProfile() {
    if (!organizationId) return;

    setLoading(true);
    setLoadError(false);

    fetchShopProfile(organizationId)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load shop details:', err);
        setLoadError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  function updateField<K extends keyof ShopProfile>(
    key: K,
    value: ShopProfile[K]
  ) {
    setProfile((previous) =>
      previous
        ? {
            ...previous,
            [key]: value,
          }
        : previous
    );

    setSaved(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (!organizationId || !profile) return;

    setSaving(true);
    setSaveError(null);

    try {
      await updateShopProfile(organizationId, {
        name: profile.name,
        phone_number: profile.phone_number,
        address: profile.address,
        business_hours: profile.business_hours,
        pickup_available: profile.pickup_available,
        delivery_available: profile.delivery_available,
      });

      setSaved(true);
    } catch (err) {
      console.error('Failed to save shop details:', err);

      setSaveError(
        err instanceof Error
          ? err.message
          : 'Could not save your changes. Check your connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAccepting(next: boolean) {
    if (!organizationId || !profile) return;

    const previous = profile.accepting_orders;

    setProfile((current) =>
      current
        ? {
            ...current,
            accepting_orders: next,
          }
        : current
    );

    setAcceptingError(null);
    setTogglingAccepting(true);

    try {
      await setAcceptingOrders(organizationId, next);
    } catch (err) {
      console.error('Failed to update accepting orders status:', err);

      setProfile((current) =>
        current
          ? {
              ...current,
              accepting_orders: previous,
            }
          : current
      );

      setAcceptingError(
        err instanceof Error
          ? err.message
          : 'Could not update. Please try again.'
      );
    } finally {
      setTogglingAccepting(false);
    }
  }

  async function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    // Allows selecting the same file again later.
    event.target.value = '';

    if (!file || !organizationId || !profile) return;

    setLogoError(null);
    setUploadingLogo(true);

    try {
      const logoUrl = await uploadShopLogo(
        organizationId,
        file,
        profile.logo_url
      );

      setProfile((current) =>
        current
          ? {
              ...current,
              logo_url: logoUrl,
            }
          : current
      );
    } catch (err) {
      console.error('Failed to upload shop logo:', err);

      setLogoError(
        err instanceof InvalidLogoFileError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not upload image. Please try again.'
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    if (!organizationId || !profile?.logo_url) return;

    setLogoError(null);
    setUploadingLogo(true);

    try {
      await removeShopLogo(organizationId, profile.logo_url);

      setProfile((current) =>
        current
          ? {
              ...current,
              logo_url: null,
            }
          : current
      );
    } catch (err) {
      console.error('Failed to remove shop logo:', err);

      setLogoError(
        err instanceof Error
          ? err.message
          : 'Could not remove image. Please try again.'
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading) {
    return (
      <ScreenShell>
        <div className="max-w-xl mx-auto animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-full bg-platinum/60" />

            <div className="space-y-2">
              <div className="h-5 w-32 rounded-md bg-platinum/60" />
              <div className="h-3 w-48 rounded-md bg-platinum/50" />
            </div>
          </div>

          <div className="space-y-5">
            <div className="h-[180px] rounded-[24px] bg-platinum/60" />
            <div className="h-[290px] rounded-[22px] bg-platinum/60" />
            <div className="h-[260px] rounded-[22px] bg-platinum/60" />
          </div>
        </div>
      </ScreenShell>
    );
  }

  if (loadError || !profile) {
    return (
      <ScreenShell>
        <div className="max-w-xl mx-auto">
          <div className="pt-16 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-[14px] bg-[#F4ECE0] flex items-center justify-center mb-1">
              <Store
                size={20}
                strokeWidth={1.8}
                className="text-[#2A2320]"
              />
            </div>

            <p className="text-[15px] font-semibold text-accent-dark">
              Couldn't load shop details
            </p>

            <p className="text-sm text-olive max-w-xs">
              Check your connection and try again.
            </p>

            <button
              type="button"
              onClick={loadProfile}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                h-11
                mt-2
                px-5
                rounded-full
                bg-[#2A2320]
                text-white
                text-sm
                font-semibold
                shadow-[0_6px_18px_rgba(42,35,32,0.16)]
                transition-all
                duration-150
                active:scale-[0.97]
              "
            >
              <RefreshCw size={14} strokeWidth={2.3} />

              Try again
            </button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <div className="max-w-xl mx-auto pb-8">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.26,
            ease: EASE,
          }}
          className="flex items-center gap-3 mb-7"
        >
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="
              w-10
              h-10
              rounded-full
              bg-white
              border
              border-black/[0.05]
              shadow-[0_2px_10px_rgba(42,35,32,0.06)]
              flex
              items-center
              justify-center
              transition-all
              duration-200
              hover:bg-[#F8F4EE]
              active:scale-95
              shrink-0
            "
            aria-label="Back to Settings"
          >
            <ArrowLeft
              size={17}
              strokeWidth={2}
              className="text-accent-dark"
            />
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-[24px] md:text-[28px] font-bold tracking-[-0.02em] text-accent-dark leading-tight">
              Shop Details
            </h1>

            <p className="text-[13px] text-olive mt-0.5">
              Manage how your shop appears and operates.
            </p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Shop identity */}
          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
              ease: EASE,
              delay: 0.04,
            }}
            className="
              relative
              overflow-hidden
              rounded-[24px]
              bg-[#2A2320]
              border
              border-white/[0.06]
              shadow-[0_14px_40px_rgba(42,35,32,0.18)]
            "
          >
            {/* Subtle decorative depth */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -top-24
                -right-20
                w-56
                h-56
                rounded-full
                bg-white/[0.035]
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -bottom-28
                -right-8
                w-64
                h-64
                rounded-full
                bg-black/[0.06]
              "
            />

            <div className="relative p-5 md:p-6">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="relative shrink-0">
                  {profile.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt={`${profile.name} logo`}
                      className="
                        w-[68px]
                        h-[68px]
                        rounded-[18px]
                        object-cover
                        border
                        border-white/10
                        shadow-[0_8px_24px_rgba(0,0,0,0.20)]
                      "
                    />
                  ) : (
                    <div
                      className="
                        w-[68px]
                        h-[68px]
                        rounded-[18px]
                        bg-white/[0.09]
                        border
                        border-white/[0.10]
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <span className="font-display text-2xl font-semibold text-white">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {uploadingLogo && (
                    <div
                      className="
                        absolute
                        inset-0
                        rounded-[18px]
                        bg-black/50
                        backdrop-blur-[2px]
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <RefreshCw
                        size={17}
                        className="text-white animate-spin"
                      />
                    </div>
                  )}
                </div>

                {/* Identity */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/40 mb-1.5">
                    Shop profile
                  </p>

                  <h2 className="font-display text-[20px] md:text-[22px] font-semibold tracking-[-0.02em] text-white truncate">
                    {profile.name}
                  </h2>

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`
                        w-2
                        h-2
                        rounded-full
                        ${
                          profile.accepting_orders
                            ? 'bg-emerald-400'
                            : 'bg-white/30'
                        }
                      `}
                    />

                    <span className="text-[12px] text-white/55">
                      {profile.accepting_orders
                        ? 'Accepting orders'
                        : 'Orders paused'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logo actions */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="
                    h-9
                    px-4
                    rounded-full
                    bg-white/[0.09]
                    border
                    border-white/[0.09]
                    text-white
                    text-[12px]
                    font-semibold
                    inline-flex
                    items-center
                    gap-2
                    transition-all
                    duration-200
                    hover:bg-white/[0.14]
                    active:scale-[0.97]
                    disabled:opacity-40
                  "
                >
                  <Camera size={14} strokeWidth={2} />

                  {profile.logo_url ? 'Change logo' : 'Upload logo'}
                </button>

                {profile.logo_url && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="
                      h-9
                      px-3
                      rounded-full
                      text-[12px]
                      font-medium
                      text-white/45
                      transition-colors
                      duration-200
                      hover:text-white/80
                      disabled:opacity-40
                    "
                  >
                    Remove
                  </button>
                )}
              </div>

              {logoError && (
                <p
                  role="alert"
                  className="text-[12px] text-red-300 mt-3 leading-relaxed"
                >
                  {logoError}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </motion.section>

          {/* Business information */}
          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
              ease: EASE,
              delay: 0.08,
            }}
          >
            <SectionHeading
              title="Business information"
              description="Details your assistant can share with customers."
            />

            <div
              className="
                bg-white
                rounded-[22px]
                border
                border-black/[0.04]
                shadow-[0_3px_18px_rgba(42,35,32,0.055)]
                overflow-hidden
              "
            >
              <PremiumField
                icon={<Store size={16} />}
                label="Shop name"
                value={profile.name}
                onChange={(value: string) =>
                  updateField('name', value)
                }
                placeholder="Your shop name"
              />

              <FieldDivider />

              <PremiumField
                icon={<Phone size={16} />}
                label="Phone number"
                value={profile.phone_number ?? ''}
                onChange={(value: string) =>
                  updateField(
                    'phone_number',
                    value.trim() ? value : null
                  )
                }
                placeholder="e.g. 0917 123 4567"
                inputMode="tel"
              />

              <FieldDivider />

              <PremiumField
                icon={<MapPin size={16} />}
                label="Address"
                value={profile.address ?? ''}
                onChange={(value: string) =>
                  updateField(
                    'address',
                    value.trim() ? value : null
                  )
                }
                placeholder="Add your shop address"
              />

              <FieldDivider />

              <PremiumField
                icon={<Clock3 size={16} />}
                label="Business hours"
                value={profile.business_hours ?? ''}
                onChange={(value: string) =>
                  updateField(
                    'business_hours',
                    value.trim() ? value : null
                  )
                }
                placeholder="e.g. Mon–Sat, 9 AM–6 PM"
              />
            </div>
          </motion.section>

          {/* Ordering */}
          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
              ease: EASE,
              delay: 0.12,
            }}
          >
            <SectionHeading
              title="Ordering"
              description="Control when and how customers can receive orders."
            />

            <div
              className="
                bg-white
                rounded-[22px]
                border
                border-black/[0.04]
                shadow-[0_3px_18px_rgba(42,35,32,0.055)]
                overflow-hidden
              "
            >
              {/* Accepting orders */}
              <SettingToggleRow
                icon={<ShoppingBag size={18} strokeWidth={1.9} />}
                title="Accepting orders"
                description={
                  acceptingError
                    ? acceptingError
                    : profile.accepting_orders
                      ? 'Customers can currently place new orders.'
                      : 'Customers will be told that orders are currently paused.'
                }
                error={Boolean(acceptingError)}
              >
                <Switch
                  checked={profile.accepting_orders}
                  onChange={handleToggleAccepting}
                  ariaLabel="Accepting orders"
                />
              </SettingToggleRow>

              <FieldDivider />

              {/* Pickup */}
              <SettingToggleRow
                icon={<PackageCheck size={18} strokeWidth={1.9} />}
                title="Pickup"
                description="Customers can collect completed orders from your shop."
              >
                <Switch
                  checked={profile.pickup_available}
                  onChange={(checked) =>
                    updateField('pickup_available', checked)
                  }
                  ariaLabel="Pickup available"
                />
              </SettingToggleRow>

              <FieldDivider />

              {/* Delivery */}
              <SettingToggleRow
                icon={<Truck size={18} strokeWidth={1.9} />}
                title="Delivery"
                description="Offer delivery as a fulfillment option."
              >
                <Switch
                  checked={profile.delivery_available}
                  onChange={(checked) =>
                    updateField('delivery_available', checked)
                  }
                  ariaLabel="Delivery available"
                />
              </SettingToggleRow>

              {profile.delivery_available && (
                <div className="mx-5 mb-5">
                  <div
                    className="
                      rounded-[14px]
                      bg-[#F8F4EE]
                      border
                      border-[#2A2320]/[0.04]
                      px-4
                      py-3
                    "
                  >
                    <p className="text-[12px] text-olive leading-relaxed">
                      Delivery addresses are currently arranged directly
                      with customers after they place an order.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* Save error */}
          {saveError && (
            <motion.div
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              role="alert"
              className="
                rounded-[14px]
                bg-red-50
                border
                border-red-100
                px-4
                py-3
                text-[13px]
                text-red-600
                leading-relaxed
              "
            >
              {saveError}
            </motion.div>
          )}

          {/* Save */}
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
              ease: EASE,
              delay: 0.16,
            }}
            className="pt-1"
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="
                w-full
                h-[54px]
                rounded-[16px]
                bg-[#2A2320]
                text-white
                text-[14px]
                font-semibold
                flex
                items-center
                justify-center
                gap-2
                shadow-[0_8px_24px_rgba(42,35,32,0.18)]
                transition-all
                duration-200
                hover:bg-[#332B27]
                hover:shadow-[0_10px_28px_rgba(42,35,32,0.22)]
                active:scale-[0.985]
                disabled:opacity-50
                disabled:shadow-none
              "
            >
              {saving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Check size={16} strokeWidth={2.3} />
              )}

              {saving
                ? 'Saving changes…'
                : saved
                  ? 'Changes saved'
                  : 'Save changes'}
            </button>

            <p className="text-[11px] text-olive/70 text-center mt-3 px-4 leading-relaxed">
              {togglingAccepting
                ? 'Updating your order status…'
                : 'Order status and logo changes save automatically. Other changes require Save changes.'}
            </p>
          </motion.div>
        </div>
      </div>
    </ScreenShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Helper components                             */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2.5 px-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-olive">
        {title}
      </p>

      <p className="text-[12px] text-olive/70 mt-0.5">
        {description}
      </p>
    </div>
  );
}

function FieldDivider() {
  return <div className="mx-5 h-px bg-black/[0.055]" />;
}

function PremiumField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: InputMode;
}) {
  return (
    <div
      className="
        px-5
        py-4
        transition-colors
        duration-150
        focus-within:bg-[#FAF8F5]
      "
    >
      <div className="flex items-start gap-3.5">
        {/* Field icon */}
        <div
          className="
            mt-0.5
            w-9
            h-9
            rounded-[11px]
            bg-[#F4ECE0]
            text-[#2A2320]
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          {icon}
        </div>

        {/* Field */}
        <div className="min-w-0 flex-1">
          <label className="block text-[11px] font-semibold text-olive mb-1">
            {label}
          </label>

          <input
            type="text"
            value={value}
            inputMode={inputMode}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="
              w-full
              min-w-0
              bg-transparent
              border-0
              p-0
              text-[14px]
              font-medium
              leading-6
              text-accent-dark
              placeholder:text-olive/40
              outline-none
              focus:outline-none
              focus:ring-0
            "
          />
        </div>
      </div>
    </div>
  );
}

function SettingToggleRow({
  icon,
  title,
  description,
  error = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="p-5 flex items-center gap-4">
      {/* Icon */}
      <div
        className="
          w-10
          h-10
          rounded-[12px]
          bg-[#F4ECE0]
          text-[#2A2320]
          flex
          items-center
          justify-center
          shrink-0
        "
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-accent-dark">
          {title}
        </p>

        <p
          className={`
            text-[12px]
            leading-relaxed
            mt-0.5
            ${error ? 'text-red-600' : 'text-olive'}
          `}
        >
          {description}
        </p>
      </div>

      {/* Switch */}
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}