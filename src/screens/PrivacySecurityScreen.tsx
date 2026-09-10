// File: app/src/screens/PrivacySecurityScreen.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  KeyRound,
  MonitorSmartphone,
  Fingerprint,
  FileText,
  ScrollText,
  Cookie,
  Download,
  Trash2,
  Check,
} from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.06 },
  }),
};

const SUPPORT_EMAIL = 'kekiai@gmail.com';

export function PrivacySecurityScreen() {
  const navigate = useNavigate();
  const { session } = useAuth() as {
    session: { user?: { email?: string; user_metadata?: { organization_name?: string } } } | null;
  };

  const shopName = session?.user?.user_metadata?.organization_name?.trim() || 'my shop';
  const userEmail = session?.user?.email ?? '';

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setPasswordSaved(true);
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleSignOutAllDevices() {
    setSigningOutAll(true);
    await supabase.auth.signOut({ scope: 'global' });
    // The app's auth listener picks up the cleared session and routes
    // to the sign-in screen automatically, so nothing else to do here.
  }

  function handleRequestDataExport() {
    const subject = encodeURIComponent(`Data export request — ${shopName}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to request a copy of the personal data associated with my account (${userEmail}) for "${shopName}".\n\nThanks.`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  function handleRequestDeletion() {
    setConfirmDeletion(false);
    const subject = encodeURIComponent(`Account deletion request — ${shopName}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to request deletion of my account (${userEmail}) and the data for "${shopName}".\n\nI understand this will remove my shop's orders, customers, and conversation history, and cannot be undone.\n\nThanks.`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <ScreenShell>
      <motion.div
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
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
          Privacy & Security
        </h1>
      </motion.div>

      <div className="space-y-5 max-w-lg">
        {/* Account security */}
        <motion.section custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
            Account security
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-platinum/60">
            <SecurityRow
              icon={<KeyRound size={17} className="text-accent-dark" />}
              label="Change password"
              onClick={() => {
                setShowChangePassword((s) => !s);
                setPasswordError(null);
                setPasswordSaved(false);
              }}
            />
            {showChangePassword && (
              <div className="px-5 py-4 space-y-2.5 bg-platinum/10">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2.5 rounded-[10px] border border-platinum text-[14px] focus:outline-none focus:border-accent-dark/40"
                />
                {passwordError && <p className="text-[13px] text-red-600">{passwordError}</p>}
                {passwordSaved && (
                  <p className="text-[13px] text-green-700 flex items-center gap-1.5">
                    <Check size={14} /> Password updated.
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  className="w-full h-11 rounded-[10px] bg-accent-dark text-white text-[14px] font-semibold disabled:opacity-40 transition-opacity duration-150 active:scale-[0.98]"
                >
                  {passwordSaving ? 'Updating…' : 'Update password'}
                </button>
              </div>
            )}
            <SecurityRow
              icon={<MonitorSmartphone size={17} className="text-accent-dark" />}
              label="Sign out of all devices"
              description="Ends every active session, including this one"
              onClick={() => setConfirmSignOutAll(true)}
            />
            <SecurityRow
              icon={<Fingerprint size={17} className="text-accent-dark" />}
              label="Two-factor authentication"
              description="Coming soon"
              disabled
            />
          </div>
        </motion.section>

        {/* Your data */}
        <motion.section custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
            Your data
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-platinum/60">
            <SecurityLinkRow
              icon={<FileText size={17} className="text-accent-dark" />}
              label="Privacy Policy"
              to="/privacy"
            />
            <SecurityLinkRow
              icon={<ScrollText size={17} className="text-accent-dark" />}
              label="Terms and Conditions"
              to="/terms"
            />
            <SecurityLinkRow
              icon={<Cookie size={17} className="text-accent-dark" />}
              label="Cookies Policy"
              to="/cookies"
            />
            <SecurityRow
              icon={<Download size={17} className="text-accent-dark" />}
              label="Download my data"
              description="Request an export of your account information"
              onClick={handleRequestDataExport}
            />
          </div>
        </motion.section>

        {/* Danger zone */}
        <motion.section custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
            Danger zone
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <button
              onClick={() => setConfirmDeletion(true)}
              className="w-full flex items-center gap-4 px-5 min-h-[56px] py-3 text-left transition-colors duration-150 hover:bg-red-50 active:bg-red-50"
            >
              <div className="w-8 h-8 rounded-[10px] bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={17} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-red-500">Request account deletion</p>
                <p className="text-[13px] text-olive">Sends a request to permanently remove your data</p>
              </div>
            </button>
          </div>
        </motion.section>
      </div>

      <ConfirmDialog
        open={confirmSignOutAll}
        title="Sign out everywhere?"
        description="This will end every active session for your account, including this one. You'll need to sign in again."
        confirmLabel={signingOutAll ? 'Signing out…' : 'Sign out everywhere'}
        destructive
        onConfirm={handleSignOutAllDevices}
        onCancel={() => setConfirmSignOutAll(false)}
      />

      <ConfirmDialog
        open={confirmDeletion}
        title="Request account deletion?"
        description={`This opens an email to request permanent deletion of "${shopName}" and its data. Our team will confirm with you before anything is removed.`}
        confirmLabel="Continue"
        destructive
        onConfirm={handleRequestDeletion}
        onCancel={() => setConfirmDeletion(false)}
      />
    </ScreenShell>
  );
}

function SecurityRow({
  icon,
  label,
  description,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const inner = (
    <div
      className={`flex items-center gap-4 px-5 min-h-[56px] py-3 transition-colors duration-150 ${
        disabled ? 'opacity-45' : 'hover:bg-platinum/20 active:bg-platinum/30'
      }`}
    >
      <div className="w-8 h-8 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-accent-dark">{label}</p>
        {description && <p className="text-[13px] text-olive">{description}</p>}
      </div>
    </div>
  );

  if (disabled) return <div aria-disabled="true">{inner}</div>;
  return (
    <button className="w-full text-left" onClick={onClick}>
      {inner}
    </button>
  );
}

function SecurityLinkRow({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      target="_blank"
      className="flex items-center gap-4 px-5 min-h-[56px] py-3 transition-colors duration-150 hover:bg-platinum/20 active:bg-platinum/30"
    >
      <div className="w-8 h-8 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <p className="flex-1 min-w-0 text-[15px] font-medium text-accent-dark">{label}</p>
    </Link>
  );
}