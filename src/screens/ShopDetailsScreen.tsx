// File: app/src/screens/ShopDetailsScreen.tsx

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, RefreshCw, X } from 'lucide-react';
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
      .then((p) => {
        setProfile(p);
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

  function updateField<K extends keyof ShopProfile>(key: K, value: ShopProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
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
        err instanceof Error ? err.message : 'Could not save your changes. Check your connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAccepting(next: boolean) {
    if (!organizationId || !profile) return;
    const previous = profile.accepting_orders;
    setProfile((prev) => (prev ? { ...prev, accepting_orders: next } : prev));
    setAcceptingError(null);
    setTogglingAccepting(true);
    try {
      await setAcceptingOrders(organizationId, next);
    } catch (err) {
      console.error('Failed to update accepting orders status:', err);
      setProfile((prev) => (prev ? { ...prev, accepting_orders: previous } : prev));
      setAcceptingError(
        err instanceof Error ? err.message : 'Could not update. Please try again.'
      );
    } finally {
      setTogglingAccepting(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !organizationId || !profile) return;

    setLogoError(null);
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadShopLogo(organizationId, file, profile.logo_url);
      setProfile((prev) => (prev ? { ...prev, logo_url: logoUrl } : prev));
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
      setProfile((prev) => (prev ? { ...prev, logo_url: null } : prev));
    } catch (err) {
      console.error('Failed to remove shop logo:', err);
      setLogoError(err instanceof Error ? err.message : 'Could not remove image. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading) {
    return (
      <ScreenShell>
        <div className="space-y-3 max-w-lg animate-pulse">
          <div className="h-16 rounded-[18px] bg-platinum/60" />
          <div className="h-40 rounded-[18px] bg-platinum/60" />
          <div className="h-24 rounded-[18px] bg-platinum/60" />
        </div>
      </ScreenShell>
    );
  }

  if (loadError || !profile) {
    return (
      <ScreenShell>
        <div className="pt-16 flex flex-col items-center gap-3 text-center px-6">
          <p className="text-[15px] font-medium text-accent-dark">Couldn't load shop details</p>
          <p className="text-sm text-olive">Check your connection and try again.</p>
          <button
            onClick={loadProfile}
            className="inline-flex items-center gap-2 rounded-full bg-accent-dark text-white px-5 h-11 text-sm font-semibold transition-transform duration-150 active:scale-[0.97] mt-1"
          >
            <RefreshCw size={14} strokeWidth={2.5} />
            Try again
          </button>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        className="flex items-center gap-3 mb-6"
      >
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90 shrink-0"
          aria-label="Back to Settings"
        >
          <ArrowLeft size={17} className="text-olive" />
        </button>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-accent-dark">
          Shop Details
        </h1>
      </motion.div>

      <p className="text-[13px] text-olive mb-4 max-w-lg">
        This is what your AI assistant tells customers on Messenger: your phone number, address, hours, and whether you offer delivery.
      </p>

      <div className="space-y-4 max-w-lg">
        <div className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex items-center gap-4">
          <div className="relative shrink-0">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={`${profile.name} logo`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent-dark flex items-center justify-center text-xl font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <RefreshCw size={16} className="text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-accent-dark mb-1">Shop logo</p>
            <p className="text-[12px] text-olive mb-2">Shown in Settings and to customers on Messenger.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="inline-flex items-center gap-1.5 rounded-full bg-platinum/60 text-accent-dark px-3.5 h-8 text-[12px] font-semibold transition-transform duration-150 active:scale-95 disabled:opacity-40"
              >
                <Camera size={13} />
                {profile.logo_url ? 'Change' : 'Upload'}
              </button>
              {profile.logo_url && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-red-500 disabled:opacity-40"
                >
                  <X size={13} />
                  Remove
                </button>
              )}
            </div>
            {logoError && <p className="text-[12px] text-red-600 mt-1.5">{logoError}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>

        <div className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-olive mb-1 block">Shop name</label>
            <input
              value={profile.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-olive mb-1 block">Phone number</label>
            <input
              value={profile.phone_number ?? ''}
              onChange={(e) => updateField('phone_number', e.target.value || null)}
              placeholder="e.g. 0917 123 4567"
              className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-olive mb-1 block">Address</label>
            <input
              value={profile.address ?? ''}
              onChange={(e) => updateField('address', e.target.value || null)}
              placeholder="e.g. 123 Rizal St, Barangay Poblacion, Calamba"
              className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-olive mb-1 block">Business hours</label>
            <input
              value={profile.business_hours ?? ''}
              onChange={(e) => updateField('business_hours', e.target.value || null)}
              placeholder="e.g. Mon-Sat, 9AM-6PM"
              className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
            />
          </div>
        </div>

        <div className="bg-white rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive">Fulfillment options</p>

          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <p className="text-[14px] text-accent-dark font-medium">Accepting orders</p>
              {!profile.accepting_orders && !acceptingError && (
                <p className="text-[12px] text-amber-700">
                  Customers messaging you will be told you are not taking orders right now.
                </p>
              )}
              {acceptingError && (
                <p className="text-[12px] text-red-600 leading-snug">{acceptingError}</p>
              )}
            </div>
            <Switch
              checked={profile.accepting_orders}
              onChange={handleToggleAccepting}
              ariaLabel="Accepting orders"
            />
          </div>

          <div className="h-px bg-platinum/60" />

          <label className="flex items-center justify-between">
            <span className="text-[14px] text-accent-dark">Pickup</span>
            <Switch
              checked={profile.pickup_available}
              onChange={(checked) => updateField('pickup_available', checked)}
              ariaLabel="Pickup available"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-[14px] text-accent-dark">Delivery</span>
            <Switch
              checked={profile.delivery_available}
              onChange={(checked) => updateField('delivery_available', checked)}
              ariaLabel="Delivery available"
            />
          </label>
          {profile.delivery_available && (
            <p className="text-[12px] text-olive">
              Delivery address collection isn't built into the order form yet. You'll still need to arrange addresses with customers directly.
            </p>
          )}
        </div>

        {saveError && (
          <p className="text-[13px] text-red-600 px-1">{saveError}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-[14px] bg-accent-dark text-white font-semibold transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
        >
          <Check size={16} />
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </button>
        <p className="text-[11px] text-olive text-center -mt-1">
          {togglingAccepting ? 'Updating order status…' : 'Accepting orders and the shop logo save immediately. Other changes need Save.'}
        </p>
      </div>
    </ScreenShell>
  );
}