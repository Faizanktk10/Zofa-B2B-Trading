import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <SEO title="Privacy Policy" description="Zofa B2B Trading privacy policy — how we collect, use and protect your data." />
      <h2 className="fw-bold mb-2">Privacy Policy</h2>
      <p className="text-muted small mb-5">Last updated: January 2024</p>

      {[
        {
          title: '1. Information We Collect',
          body: 'We collect information you provide during registration (name, email, phone, company details), RFQ and quotation data you submit, payment reference numbers, and usage data such as pages visited and search queries.'
        },
        {
          title: '2. How We Use Your Information',
          body: 'Your information is used to operate the marketplace, match buyers with suppliers, process subscription upgrades, send platform notifications, and improve our services. We do not sell your personal data to third parties.'
        },
        {
          title: '3. Contact Information Visibility',
          body: 'Buyer contact details (email and phone) are only visible to Premium suppliers or suppliers who have paid to unlock a specific lead. Free suppliers cannot see buyer contact information.'
        },
        {
          title: '4. Data Security',
          body: 'Passwords are hashed using BCrypt. All API communication is over HTTPS. We implement role-based access controls to protect sensitive data. However, no system is 100% secure and we cannot guarantee absolute security.'
        },
        {
          title: '5. Cookies',
          body: 'We use browser localStorage to store your authentication token and session data. We do not use third-party tracking cookies.'
        },
        {
          title: '6. Data Retention',
          body: 'Your account data is retained as long as your account is active. You may request deletion of your account and associated data by contacting support@zofa.pk.'
        },
        {
          title: '7. Third-Party Services',
          body: 'We use JazzCash and EasyPaisa for payment processing. Their privacy policies apply to payment transactions. We do not store full payment credentials.'
        },
        {
          title: '8. Your Rights',
          body: 'You have the right to access, correct, or delete your personal data. Contact us at privacy@zofa.pk to exercise these rights.'
        },
        {
          title: '9. Contact',
          body: 'For privacy-related questions, email us at privacy@zofa.pk or call +92-300-0000000.'
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
