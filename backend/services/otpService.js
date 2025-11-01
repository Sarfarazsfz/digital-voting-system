
class OTPService {
  // Mock SMS sending
  static async sendSMS(phoneNumber, otp) {
    console.log(`📱 SMS OTP sent to ${phoneNumber}: ${otp}`);
    // In production, integrate with:
    // - Twilio
    // - TextLocal
    // - Fast2SMS
    // - Any SMS gateway
    return true;
  }

  // Mock Email sending
  static async sendEmail(email, otp) {
    console.log(`📧 Email OTP sent to ${email}: ${otp}`);
    // In production, integrate with:
    // - Nodemailer
    // - SendGrid
    // - Mailgun
    return true;
  }

  // Generate secure OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export default OTPService;