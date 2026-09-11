// File: app/src/screens/PrivacyPolicyScreen.tsx
//
// PLACEHOLDER VALUES TO REPLACE BEFORE PUBLISHING: your registered
// business or entity name and business address.
// Have a Philippine lawyer or DPO review this before it goes live.

import { LegalDocument } from '../components/legal/LegalDocument';

export function PrivacyPolicyScreen() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="September 13, 2026">
      <p>
        This Privacy Policy explains how Keki ("Keki," "we," "us," or "our")
        collects, uses, stores, and protects personal information in connection with our platform,
        which helps small food businesses manage orders, catalogs, and customer conversations,
        including through an AI assistant on Facebook Messenger.
      </p>
      <p>
        This Policy applies to two groups of people: business owners and staff who create an
        account to use Keki ("Merchants"), and individuals who message a Merchant's shop
        through Facebook Messenger ("Customers"). If you are a Customer, the shop you messaged is
        the party responsible for your order and your relationship with them, but this Policy
        explains how Keki, as the platform they use, handles your information on their
        behalf.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>From Merchants</h3>
      <ul>
        <li>Account information: name, email address, phone number, and password.</li>
        <li>Business information: shop name, address, business hours, and fulfillment options.</li>
        <li>Product and catalog data you enter, such as items, prices, and options.</li>
      </ul>

      <h3>From Customers, collected through Facebook Messenger</h3>
      <ul>
        <li>Your name and public Facebook profile picture, obtained through Facebook's Graph API when you first message a shop.</li>
        <li>Your Facebook Page-Scoped ID (PSID), a unique identifier Facebook provides for your conversation with the shop.</li>
        <li>The content of messages you send, including text and any photos you share.</li>
        <li>Order details you provide during a conversation, such as the item, quantity, event date, and pickup or delivery preference.</li>
        <li>If you send a photo as proof of payment, that image is stored to help the shop verify your payment.</li>
      </ul>

      <h3>Collected automatically</h3>
      <p>
        We use browser local storage, not cookies, to keep Merchants signed in to their account.
        We do not currently use analytics or advertising cookies. See our{' '}
        <a href="/cookies">Cookies Policy</a> for details.
      </p>
      <p>
        Our website loads fonts from Google Fonts. As a result, your browser makes a direct
        request to Google's servers when you load the app, which shares standard technical
        information such as your IP address with Google. This does not involve cookies or
        tracking on our end.
      </p>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>To operate the ordering platform, including catalogs, orders, and payment verification.</li>
        <li>To power the AI assistant that answers Customer questions and helps place orders on a Merchant's behalf, using OpenAI's API to generate responses.</li>
        <li>To communicate with Merchants about their account and the service.</li>
        <li>To maintain security, prevent abuse, and comply with legal obligations.</li>
        <li>To improve the platform, using aggregated or de-identified information where possible.</li>
      </ul>
      <p>
        The AI assistant only draws on shop information the Merchant has entered and product data
        it looks up in real time. It does not invent prices, availability, or product details.
      </p>

      <h2>3. Legal Bases for Processing</h2>
      <p>
        Under the Data Privacy Act of 2012 (Republic Act No. 10173), we process personal
        information based on: consent (for example, when a Merchant signs up), the performance of
        a contract (fulfilling an order a Customer requested), our legitimate interests in
        operating and securing the platform, and compliance with legal obligations.
      </p>

      <h2>4. Sharing of Information</h2>
      <p>We share information with the following service providers, strictly to operate the platform:</p>
      <ul>
        <li><strong>Supabase</strong>, our database and file storage provider, which hosts account, order, and message data, including payment proof images.</li>
        <li><strong>OpenAI</strong>, which processes message content to generate the AI assistant's replies.</li>
        <li><strong>Meta Platforms, Inc. (Facebook) and (Messenger)</strong>, through whose Messenger Platform and Graph API Customer conversations take place.</li>
      </ul>
      <p>
        We do not sell personal information, and we do not use data obtained through Facebook
        Messenger for advertising or any purpose beyond operating the ordering and messaging
        service, in line with Meta's Platform Terms.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain Merchant account data for as long as the account is active. Customer
        conversation and order data is retained for as long as reasonably needed for order
        history, dispute resolution, and the Merchant's own recordkeeping, after which it may be
        deleted or anonymized on request.
      </p>

      <h2>6. Data Security</h2>
      <p>
        We use reasonable organizational and technical measures, including encrypted connections,
        access controls, and signed webhook verification for messages received from Facebook, to
        protect personal information from unauthorized access, alteration, or disclosure.
      </p>

      <h2>7. Your Rights Under the Data Privacy Act</h2>
      <p>As a data subject, you have the right to:</p>
      <ul>
        <li>Be informed of how your personal information is processed.</li>
        <li>Access your personal information held by us.</li>
        <li>Request correction of inaccurate or outdated information.</li>
        <li>Object to processing, or request the erasure or blocking of your information, subject to legal or contractual limits.</li>
        <li>Data portability, where technically feasible.</li>
        <li>File a complaint with the National Privacy Commission (NPC) if you believe your rights have been violated.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at kekiai@gmail.com. If you are a Customer,
        you may also raise requests directly with the shop you messaged.
      </p>

      <h2>8. International Data Transfers</h2>
      <p>
        Some service providers we use, including Supabase and OpenAI, may process or store data
        on servers located outside the Philippines. We require these providers to maintain
        safeguards consistent with the Data Privacy Act.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        Keki is intended for use by adults operating or interacting with a business. We do
        not knowingly collect personal information from children. If you believe a child has
        provided us with personal information, contact us and we will take steps to remove it.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Policy from time to time. Material changes will be reflected by
        updating the "Last updated" date above. Continued use of the platform after changes take
        effect constitutes acceptance of the updated Policy.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have questions about this Policy or how your data is handled, contact us at
        kekiai@gmail.com. You may also file a complaint with the
        National Privacy Commission at{' '}
        <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer">privacy.gov.ph</a>.
      </p>
    </LegalDocument>
  );
}