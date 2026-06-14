import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_2ccciqm';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_j2419fj';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '0rpuOjkQdLmEVGOSP';

// Initialize EmailJS with public key
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Send verification code via EmailJS
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} code - 6-digit verification code
 * @param {string} verificationLink - Direct verification link
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendVerificationEmail = async (toEmail, toName, code, verificationLink) => {
  const templateParams = {
    to_email: toEmail,
    to_name: toName || 'User',
    verification_code: code,
    verification_link: verificationLink,
    from_name: 'Zofa B2B Trading',
    subject: 'Verify Your Email — Zofa B2B'
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('[EmailJS] Verification email sent successfully:', response.status, response.text);
    return { success: true, message: 'Verification code sent to your email' };
  } catch (error) {
    console.error('[EmailJS] Failed to send verification email:', error);
    return { 
      success: false, 
      message: error?.text || 'Failed to send verification email. Please try again.' 
    };
  }
};

/**
 * Send welcome email via EmailJS
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} role - User role (Buyer/Supplier)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendWelcomeEmail = async (toEmail, toName, role) => {
  const templateParams = {
    to_email: toEmail,
    to_name: toName || 'User',
    user_role: role,
    from_name: 'Zofa B2B Trading'
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('[EmailJS] Welcome email sent successfully:', response.status, response.text);
    return { success: true, message: 'Welcome email sent' };
  } catch (error) {
    console.error('[EmailJS] Failed to send welcome email:', error);
    return { 
      success: false, 
      message: error?.text || 'Failed to send welcome email' 
    };
  }
};

export default { sendVerificationEmail, sendWelcomeEmail };