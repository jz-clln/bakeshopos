// File: app/src/screens/TermsScreen.tsx
//
// PLACEHOLDER VALUES TO REPLACE BEFORE PUBLISHING: entity name,
// contact email, governing city/venue for disputes, subscription
// fee terms once pricing is finalized.

import { LegalDocument } from '../components/legal/LegalDocument';

export function TermsScreen() {
  return (
    <LegalDocument title="Terms and Conditions" lastUpdated="[EFFECTIVE DATE]">
      <p>
        These Terms and Conditions ("Terms") govern your access to and use of BakeShopOS, a
        platform operated by [YOUR COMPANY NAME] that helps small food businesses manage catalogs,
        orders, and customer conversations, including through an AI assistant on Facebook
        Messenger. By creating an account, you agree to these Terms.
      </p>

      <h2>1. Who Can Use BakeShopOS</h2>
      <p>
        You must be at least 18 years old and legally able to enter into contracts to create an
        account. You are responsible for the accuracy of the information you provide and for
        keeping your login credentials secure.
      </p>

      <h2>2. Your Responsibilities as a Merchant</h2>
      <ul>
        <li>Keep your product listings, prices, and lead times accurate and up to date.</li>
        <li>Honor orders placed through the platform in good faith, and communicate promptly with customers about any changes.</li>
        <li>Handle payments and refunds directly with your customers. BakeShopOS does not process payments; it only helps you verify payment proof images customers send you.</li>
        <li>Comply with Facebook's Messenger Platform Policy and Meta's Platform Terms when using the Messenger integration.</li>
        <li>Comply with the Data Privacy Act of 2012 with respect to your own customers' information.</li>
      </ul>

      <h2>3. The AI Assistant</h2>
      <p>
        BakeShopOS includes an AI assistant that can answer customer questions, calculate prices,
        and draft orders on your behalf. The assistant is designed to only quote prices and
        availability it has actually looked up, and to hand off to you when it is unsure. However,
        AI-generated responses may occasionally be incomplete or imperfect. You remain responsible
        for reviewing and confirming orders before fulfilling them, and for any commitments made
        in conversations with your customers.
      </p>

      <h2>4. Fees</h2>
      <p>
        [DESCRIBE YOUR SUBSCRIPTION OR USAGE FEES HERE, INCLUDING BILLING CYCLE, TRIAL PERIODS IF
        ANY, AND REFUND POLICY, ONCE FINALIZED.]
      </p>

      <h2>5. Prohibited Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the platform for any unlawful purpose or to sell prohibited goods.</li>
        <li>Attempt to access another Merchant's account or data without authorization.</li>
        <li>Interfere with or disrupt the platform's operation.</li>
        <li>Use data obtained through the Messenger integration for purposes outside operating your shop, including reselling customer data.</li>
      </ul>

      <h2>6. Third-Party Services</h2>
      <p>
        BakeShopOS relies on third-party services including Meta Platforms (Facebook Messenger),
        OpenAI, and Supabase. Your use of BakeShopOS is also subject to those providers' own terms
        where applicable, and we are not responsible for outages or changes on their end.
      </p>

      <h2>7. Disclaimer of Warranties</h2>
      <p>
        BakeShopOS is provided "as is" without warranties of any kind, express or implied, to the
        fullest extent permitted by law. We do not guarantee the platform will be uninterrupted,
        error-free, or that AI-generated responses will always be accurate.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, [YOUR COMPANY NAME] will not be liable for
        indirect, incidental, or consequential damages arising from your use of the platform,
        including lost sales, lost data, or disputes between you and your customers.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using BakeShopOS at any time. We may suspend or terminate accounts that
        violate these Terms, engage in unlawful activity, or misuse the platform.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the Republic of the Philippines. Any dispute
        arising from these Terms will first be addressed through good-faith negotiation, and
        failing that, will be subject to the exclusive jurisdiction of the courts of [CITY,
        PROVINCE].
      </p>

      <h2>11. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be reflected by
        updating the "Last updated" date above. Continued use of the platform after changes take
        effect constitutes acceptance of the updated Terms.
      </p>

      <h2>12. Contact Us</h2>
      <p>Questions about these Terms can be sent to [CONTACT EMAIL].</p>
    </LegalDocument>
  );
}