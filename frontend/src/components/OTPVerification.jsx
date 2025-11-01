import React, { useState, useEffect, useRef } from 'react';

const OTPVerification = ({ 
  voterId, 
  onVerify, 
  onResendOTP, 
  verificationMethod,
  debugOTP,
  onCancel 
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const inputsRef = useRef([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (debugOTP && otp.join('') === '') {
      // Auto-fill OTP in development
      const otpArray = debugOTP.split('');
      setOtp(otpArray);
      otpArray.forEach((digit, index) => {
        if (inputsRef.current[index]) {
          inputsRef.current[index].value = digit;
        }
      });
    }
  }, [debugOTP]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d{6}$/.test(pasteData)) {
      const otpArray = pasteData.split('');
      setOtp(otpArray);
      otpArray.forEach((digit, index) => {
        if (inputsRef.current[index]) {
          inputsRef.current[index].value = digit;
        }
      });
      inputsRef.current[5].focus();
    }
  };

  const handleVerify = async (enteredOTP = otp.join('')) => {
    if (enteredOTP.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(enteredOTP);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      await onResendOTP();
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(600); // Reset timer
      inputsRef.current[0].focus();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="card slide-up">
      <div className="card-header text-center">
        <h2 className="card-title">🔐 OTP Verification</h2>
        <p className="card-subtitle">
          Enter the 6-digit OTP sent to your {verificationMethod?.toLowerCase()}
        </p>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* OTP Input Fields */}
        <div className="text-center mb-4">
          <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputsRef.current[index] = el}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={loading}
              />
            ))}
          </div>
          
          <div className="mt-2">
            <small className="text-muted">
              Time remaining: <strong>{formatTime(timeLeft)}</strong>
            </small>
          </div>
        </div>

        {/* Debug OTP Display */}
        {debugOTP && (
          <div className="alert alert-info text-center">
            <strong>Development OTP:</strong> {debugOTP}
            <br />
            <small>This will be hidden in production</small>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <button
            className="btn btn-primary"
            onClick={() => handleVerify()}
            disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
          >
            {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleResendOTP}
            disabled={loading || timeLeft > 540} // Can resend after 1 minute
          >
            🔄 Resend OTP
          </button>

          <button
            className="btn btn-outline-danger"
            onClick={onCancel}
            disabled={loading}
          >
            ✕ Cancel
          </button>
        </div>

        {/* Instructions */}
        <div className="alert alert-warning mt-4">
          <h6>📱 OTP Instructions</h6>
          <ul className="mb-0 small">
            <li>Check your {verificationMethod?.toLowerCase()} for the 6-digit OTP</li>
            <li>OTP is valid for 10 minutes</li>
            <li>You can resend OTP after 1 minute</li>
            <li>Keep your OTP confidential</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;