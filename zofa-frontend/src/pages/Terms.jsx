import SEO from '../components/SEO';

export default function Terms() {
  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <SEO title="Terms of Service" description="Zofa B2B Trading terms of service and usage policy." />
      <h2 className="fw-bold mb-2">Terms of Service</h2>
      <p className="text-muted small mb-5">Last updated: January 2024</p>

      {[
        {
          title: '1. Acceptance of Terms',
          body: 'By accessing or using Zofa B2B Trading ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.'
        },
        {
          title: '2. User Accounts',
          body: 'You must register an account to post RFQs or submit quotations. You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration.'
        },
        {
          title: '3. Buyer Responsibilities',
          body: 'Buyers must post genuine RFQs with accurate product requirements. Posting false or misleading RFQs is strictly prohibited and may result in account suspension.'
        },
        {
          title: '4. Supplier Responsibilities',
          body: 'Suppliers must submit honest and accurate quotations. Misrepresenting product quality, pricing, or delivery timelines is prohibited. Suppliers are responsible for fulfilling accepted quotations.'
        },
        {
          title: '5. Subscription & Payments',
          body: 'Premium subscriptions are billed monthly or yearly. Payments are processed manually via JazzCash, EasyPaisa, or bank transfer. Refunds are not provided for activated subscriptions. Lead unlock fees are non-refundable once buyer contact is revealed.'
        },
        {
          title: '6. Prohibited Activities',
          body: 'Users may not: post spam or irrelevant RFQs, harass other users, attempt to bypass the platform\'s contact restrictions, share false business information, or use the platform for illegal activities.'
        },
        {
          title: '7. Platform Role',
          body: 'Zofa B2B Trading is a marketplace platform only. We do not guarantee the quality of products, accuracy of listings, or completion of transactions. All deals are made directly between buyers and suppliers.'
        },
        {
          title: '8. Account Termination',
          body: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or harm other users of the platform.'
        },
        {
          title: '9. Changes to Terms',
          body: 'We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.'
        },
        {
          title: '10. Contact',
          body: 'For questions about these terms, contact us at legal@zofa.pk'
        }
      ].map(section => (
        <div key={section.title} className="mb-4">
          <h5 className="fw-bold">{section.title}</h5>
          <p className="text-muted">{section.body}</p>
        </div>
      ))}
    </div>
  );
}
