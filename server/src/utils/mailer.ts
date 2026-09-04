import nodemailer from 'nodemailer';

// Configure transport for development
// Using Ethereal Email (Mailtrap) as a default testing service
// In production, use your actual SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  // Use frontend URL from env or fallback to localhost
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"CRM Platform" <noreply@crmplatform.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Please click the link below to set a new password:</p>
      <a href="${resetLink}" target="_blank" style="display:inline-block;padding:10px 20px;color:white;background-color:#007BFF;text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    
    // Log preview URL if using Ethereal email
    if (!process.env.SMTP_HOST) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
