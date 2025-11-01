import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminAPI, voterAPI } from '../services/api'

const Login = () => {
  const [activeTab, setActiveTab] = useState('voter')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    aadhaarNumber: '',
    age: '',
    phone: '',
    email: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [voterData, setVoterData] = useState(null)
  const [otp, setOtp] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleOTPChange = (e) => {
    setOtp(e.target.value)
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Attempting admin login with:', {
        username: formData.username,
        password: formData.password
      })

      const response = await adminAPI.login(formData.username, formData.password)
      console.log('Admin login response:', response.data)
      
      const adminData = {
        ...response.data.admin,
        userType: 'admin'
      }
      
      login(adminData, response.data.token, 'admin')
      console.log('Admin login successful, navigating to admin dashboard...')
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Admin login error:', error)
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleVoterVerification = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Starting voter verification with:', {
        aadhaarNumber: formData.aadhaarNumber,
        age: formData.age,
        phone: formData.phone,
        email: formData.email
      })

      const response = await voterAPI.verifyAndSendOTP(
        formData.aadhaarNumber, 
        parseInt(formData.age),
        formData.phone,
        formData.email
      )
      console.log('OTP sent response:', response.data)

      setVoterData({
        voterId: response.data.voterId,
        verificationMethod: response.data.verificationMethod,
        debugOTP: response.data.debugOTP
      })
      setShowOTP(true)
      setError('')
      setOtp('') // Reset OTP field

    } catch (error) {
      console.error('Voter verification error:', error)
      setError(error.response?.data?.message || 'Verification failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Verifying OTP:', otp)
      const response = await voterAPI.verifyOTP(voterData.voterId, otp)
      console.log('OTP verification response:', response.data)

      if (response.data.verified) {
        const voterData = {
          ...response.data.voter,
          userType: 'voter'
        }
        
        login(voterData, 'voter-token', 'voter')
        console.log('Voter login successful, navigating to voter dashboard...')
        navigate('/voter/dashboard')
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setError(error.response?.data?.message || 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await voterAPI.resendOTP(voterData.voterId)
      console.log('OTP resent response:', response.data)
      
      setVoterData(prev => ({
        ...prev,
        debugOTP: response.data.debugOTP
      }))
      setOtp('') // Reset OTP field
      setError('✅ OTP has been resent successfully!')
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError(error.response?.data?.message || 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOTP = () => {
    setShowOTP(false)
    setVoterData(null)
    setOtp('')
    setError('')
  }

  return (
    <div className="container">
      <div className="card slide-up" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="card-header text-center">
          <h1 className="card-title">Welcome to SpringVote</h1>
          <p className="card-subtitle">Secure E-Voting System</p>
        </div>
        
        <div className="card-body">
          {/* Tab Navigation */}
          <div className="tabs">
            <button
              onClick={() => {
                setActiveTab('voter')
                setShowOTP(false)
                setError('')
              }}
              className={`tab ${activeTab === 'voter' ? 'active' : ''}`}
            >
              👤 Voter Login
            </button>
            <button
              onClick={() => {
                setActiveTab('admin')
                setShowOTP(false)
                setError('')
              }}
              className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
            >
              👑 Admin Login
            </button>
          </div>

          {error && (
            <div className={`alert ${error.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
              {error}
            </div>
          )}

          {/* OTP Verification Section - SHOWS AFTER SENDING OTP */}
          {showOTP && voterData && (
            <div className="otp-section fade-in">
              <div className="card" style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', border: '2px solid #667eea' }}>
                <div className="card-header text-center">
                  <h3 className="card-title">🔐 OTP Verification Required</h3>
                  <p className="card-subtitle">
                    Enter the 6-digit OTP sent to your {voterData.verificationMethod?.toLowerCase()}
                  </p>
                </div>
                
                <div className="card-body">
                  {/* Debug OTP Display - Only in development */}
                  {voterData.debugOTP && (
                    <div className="alert alert-info text-center">
                      <strong>🛠️ Development OTP:</strong> 
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', margin: '10px 0' }}>
                        {voterData.debugOTP}
                      </div>
                      <small>This OTP is shown only in development mode</small>
                    </div>
                  )}

                  <form onSubmit={handleOTPVerify}>
                    <div className="form-group">
                      <label htmlFor="otp" className="form-label">
                        📱 Enter 6-Digit OTP *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="otp"
                        name="otp"
                        value={otp}
                        onChange={handleOTPChange}
                        pattern="[0-9]{6}"
                        maxLength="6"
                        required
                        placeholder="Enter 6-digit OTP"
                        disabled={loading}
                        style={{ 
                          fontSize: '1.5rem', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          letterSpacing: '10px'
                        }}
                      />
                      <small className="text-muted">
                        Check your {voterData.verificationMethod?.toLowerCase()} for the verification code
                      </small>
                    </div>

                    <div className="d-flex gap-2 justify-content-center flex-wrap mt-4">
                      <button
                        type="submit"
                        className="btn btn-success btn-lg"
                        disabled={loading || otp.length !== 6}
                      >
                        {loading ? '⏳ Verifying...' : '✅ Verify & Login'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleResendOTP}
                        disabled={loading}
                      >
                        🔄 Resend OTP
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleCancelOTP}
                        disabled={loading}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </form>

                  <div className="alert alert-warning mt-4">
                    <h6>📋 OTP Instructions</h6>
                    <ul className="mb-0 small">
                      <li>We've sent a 6-digit OTP to your registered contact method</li>
                      <li>Enter the code exactly as received</li>
                      <li>The OTP is valid for 10 minutes</li>
                      <li>Keep this code confidential</li>
                      <li>Click "Resend OTP" if you didn't receive it</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Voter Login Form - SHOWS FIRST */}
          {!showOTP && activeTab === 'voter' && (
            <form onSubmit={handleVoterVerification} className="fade-in">
              <div className="form-group">
                <label htmlFor="aadhaarNumber" className="form-label">
                  📱 Aadhaar Number *
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="aadhaarNumber"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  pattern="[0-9]{12}"
                  maxLength="12"
                  required
                  placeholder="Enter 12-digit Aadhaar number"
                  disabled={loading}
                />
                <small className="text-muted">
                  Enter your 12-digit Aadhaar number without spaces
                </small>
              </div>
              
              <div className="form-group">
                <label htmlFor="age" className="form-label">
                  🎂 Age *
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="18"
                  max="120"
                  required
                  placeholder="Enter your age"
                  disabled={loading}
                />
                <small className="text-muted">
                  You must be 18 years or older to vote
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  📞 Phone Number (Optional for OTP)
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  placeholder="Enter 10-digit phone number"
                  disabled={loading}
                />
                <small className="text-muted">
                  For OTP verification via SMS (recommended)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  📧 Email (Optional for OTP)
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  disabled={loading}
                />
                <small className="text-muted">
                  For OTP verification via Email
                </small>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>⏳ Sending OTP...</>
                ) : (
                  <>📱 Send OTP & Verify</>
                )}
              </button>
              
              <div className="text-center mt-3">
                <small className="text-muted">
                  🔒 Your information is secure and encrypted
                </small>
              </div>

              {/* Test Credentials Info */}
              <div className="mt-3 p-3 bg-light rounded">
                <h6>🧪 Test Mode Active</h6>
                <p className="mb-1 small">
                  <strong>Test Credentials:</strong><br/>
                  • Aadhaar: <code>123456789012</code><br/>
                  • Age: <code>18</code> or above<br/>
                  • OTP will be shown on screen after clicking "Send OTP"
                </p>
                <p className="mb-0 small text-muted">
                  In production, OTP will be sent via SMS/Email only
                </p>
              </div>
            </form>
          )}

          {/* Admin Login Form */}
          {!showOTP && activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="fade-in">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  👤 Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Enter admin username"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  🔑 Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter admin password"
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>⏳ Logging in...</>
                ) : (
                  <>🚀 Admin Login</>
                )}
              </button>
              
              <div className="text-center mt-3">
                <small className="text-muted">
                  Default credentials: <strong>admin</strong> / <strong>admin123</strong>
                </small>
              </div>
            </form>
          )}

          {/* Security Notice */}
          <div className="alert alert-info mt-4">
            <h6>🛡️ Enhanced Security Features</h6>
            <p className="mb-0 small">
              • OTP verification required for voters<br/>
              • Prevents fake and duplicate votes<br/>
              • Secure encrypted communication<br/>
              • Real-time vote validation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login