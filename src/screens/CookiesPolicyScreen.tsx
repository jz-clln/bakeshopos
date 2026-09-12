// File: app/src/screens/CookiesPolicyScreen.tsx
//
// This describes the app's actual current behavior based on the code
// reviewed so far: session storage via localStorage, no analytics or
// ad tracking. Update this immediately if that ever changes.

import { LegalDocument } from '../components/legal/LegalDocument';

export function CookiesPolicyScreen() {
  return (
    <LegalDocument title="Cookies Policy" lastUpdated="September 13, 2026">
      <p>
        This Cookies Policy explains how Keki uses cookies and similar technologies, such as
        browser local storage, when you use our platform.
      </p>

      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small text files that websites can store on your device. Local storage is a
        similar browser feature that lets a website save small amounts of data on your device
        without sending it back to a server on every request.
      </p>

      <h2>2. What We Actually Use</h2>
      <p>
        Keki currently does not use cookies for tracking or advertising. We use your
        browser's local storage to keep you signed in to your Merchant account between visits,
        so you do not have to log in every time. This is considered strictly necessary for the
        platform to function and does not track you across other websites.
      </p>
      <p>
        We do not currently use analytics cookies, advertising cookies, or third-party tracking
        pixels on Keki.
      </p>

      <h2>3. Facebook Messenger</h2>
      <p>
        If you communicate with a shop through Facebook Messenger, Facebook's own cookies and
        data practices apply to that conversation as governed by{' '}
        <a href="https://www.facebook.com/policy/cookies/" target="_blank" rel="noopener noreferrer">
          Meta's Cookies Policy
        </a>
        , which is outside our control.
      </p>

      <h2>4. Managing Local Storage</h2>
      <p>
        You can clear your browser's local storage at any time through your browser's settings.
        Doing so will simply sign you out of your account.
      </p>

      <h2>5. If This Changes</h2>
      <p>
        If we introduce analytics, advertising, or other tracking technologies in the future, we
        will update this Policy and, where required by law, request your consent before those
        technologies are activated.
      </p>

      <h2>6. Contact Us</h2>
      <p>Questions about this Policy can be sent to kekiai.ph@gmail.com.</p>
    </LegalDocument>
  );
}