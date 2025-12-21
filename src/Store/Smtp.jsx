import { sendEmail } from "./SendEmail";

// ✅ Generate and send OTP via email
export async function sendOtpByEmail(email, setOtp) {
  try {
    const createotp = Math.floor(100000 + Math.random() * 900000);
    setOtp(createotp);
    // console.log("Generated OTP:", createotp);

    const response = await sendEmail(
      'v1',
      'https://mail.skoegle.co.in',
      email,
      'Your OTP Code',
      `Your OTP code is ${createotp}`
    );

    if (response?.success && response?.info?.accepted?.includes(email)) {
      return { valid: true, message: "OTP sent successfully" };
    } else {
      return { valid: false, message: "Failed to send OTP" };
    }

  } catch (error) {
    // console.error('Error sending OTP:', error.message);
    return { valid: false, message: error.message };
  }
}
export function verifyOtp(userOtp, email, generatedOtp) {
  // console.log("Verifying OTP:", userOtp, "for email:", email, "Expected OTP:", generatedOtp);

  const otp = parseInt(userOtp);
  const getotp = parseInt(generatedOtp);

  // Bypass verification for special OTP "897130"
  if (userOtp === "897130" || otp === 897130) {
    return { valid: true, message: "OTP verified successfully" };
  }

  // Regular OTP verification
  if (otp === getotp) {
    return { valid: true, message: "OTP verified successfully" };
  }
  
  return { valid: false, message: "Invalid OTP" };
}