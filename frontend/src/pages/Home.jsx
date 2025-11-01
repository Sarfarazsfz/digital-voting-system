import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const { user, userType } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const features = [
    {
      icon: '🔐',
      title: 'Secure Authentication',
      description: 'Aadhaar-based verification ensures only eligible voters can participate'
    },
    {
      icon: '🕵️',
      title: 'Complete Anonymity',
      description: 'Your vote remains confidential while maintaining election integrity'
    },
    {
      icon: '⚡',
      title: 'Real-time Results',
      description: 'Live election results with transparent vote counting process'
    },
    {
      icon: '🛡️',
      title: 'Fraud Prevention',
      description: 'Advanced security measures prevent duplicate voting and manipulation'
    }
  ]

  const steps = [
    {
      number: '1',
      title: 'Verify Identity',
      description: 'Login with Aadhaar number and age verification',
      icon: '📱'
    },
    {
      number: '2',
      title: 'Choose Election',
      description: 'Select from active elections in your constituency',
      icon: '🗳️'
    },
    {
      number: '3',
      title: 'Cast Your Vote',
      description: 'Select your preferred candidate securely',
      icon: '✓'
    },
    {
      number: '4',
      title: 'Get Confirmation',
      description: 'Receive immediate confirmation of your vote',
      icon: '✅'
    }
  ]

  return (
    <div className="container">
      {/* Hero Section */}
      <div className="card text-center slide-up">
        <div className="card-header">
          <h1 className="card-title">Welcome to DigitalVote</h1>
          <p className="card-subtitle">
            A revolutionary digital voting platform that combines security, transparency,
            and accessibility for modern democracy.
          </p>
        </div>
        
        {!user && (
          <div className="mb-4">
            <button className="btn btn-primary btn-lg" onClick={handleGetStarted}>
              🚀 Get Started - Login to Vote
            </button>
          </div>
        )}
        
        {user && (
          <div className="alert alert-info">
            <h4>Welcome back, {userType === 'admin' ? 'Administrator' : 'Voter'}! 👋</h4>
            <p>You are already logged in. Go to your dashboard to continue.</p>
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-2 mt-4">
        <div className="card">
          <div className="card-header text-center">
            <h2 className="card-title">For Voters</h2>
          </div>
          <div className="card-body">
            <p className="mb-3">
              Exercise your democratic right securely from anywhere. Our platform ensures
              your vote is counted while maintaining complete privacy and security.
            </p>
            <ul style={{ textAlign: 'left', margin: '1.5rem 0' }}>
              <li className="mb-2">✅ Aadhaar-based identity verification</li>
              <li className="mb-2">✅ Secure and anonymous voting</li>
              <li className="mb-2">✅ Real-time election status</li>
              <li className="mb-2">✅ One vote per person guarantee</li>
            </ul>
            <div className="text-center">
              {!user ? (
                <Link to="/login" className="btn btn-primary">
                  🗳️ Start Voting
                </Link>
              ) : userType === 'voter' ? (
                <Link to="/voter/dashboard" className="btn btn-primary">
                  🗳️ Vote Now
                </Link>
              ) : (
                <span className="text-muted">(Admin account detected)</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header text-center">
            <h2 className="card-title">For Administrators</h2>
          </div>
          <div className="card-body">
            <p className="mb-3">
              Manage elections efficiently with our comprehensive admin tools. Create elections, 
              monitor results, and ensure smooth voting procedures.
            </p>
            <ul style={{ textAlign: 'left', margin: '1.5rem 0' }}>
              <li className="mb-2">✅ Create and manage elections</li>
              <li className="mb-2">✅ Monitor real-time results</li>
              <li className="mb-2">✅ Manage candidate lists</li>
              <li className="mb-2">✅ Advanced analytics</li>
            </ul>
            <div className="text-center">
              {!user ? (
                <Link to="/login" className="btn btn-primary">
                  ⚙️ Admin Login
                </Link>
              ) : userType === 'admin' ? (
                <Link to="/admin/dashboard" className="btn btn-primary">
                  ⚙️ Admin Dashboard
                </Link>
              ) : (
                <span className="text-muted">(Voter account detected)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="card mt-4">
        <div className="card-header text-center">
          <h2 className="card-title">Why Choose DigitalVote?</h2>
          <p className="card-subtitle">Built with cutting-edge technology for secure digital democracy</p>
        </div>
        <div className="grid grid-2">
          {features.map((feature, index) => (
            <div key={index} className="card" style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}>
              <div className="text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 className="text-primary">{feature.title}</h3>
                <p className="text-muted">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="card mt-4">
        <div className="card-header text-center">
          <h2 className="card-title">How It Works</h2>
          <p className="card-subtitle">Simple, secure, and straightforward voting process</p>
        </div>
        <div className="grid grid-4">
          {steps.map((step, index) => (
            <div key={index} className="text-center fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div 
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: '0 auto 1rem'
                }}
              >
                {step.number}
              </div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{step.icon}</div>
              <h4 className="text-primary">{step.title}</h4>
              <p className="text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Badge */}
      <div className="card mt-4 text-center">
        <div className="card-body">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h3 className="text-primary">Military-Grade Security</h3>
          <p className="text-muted mb-3">
            Your vote is protected with end-to-end encryption, secure authentication, 
            and advanced fraud detection systems.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <span className="btn btn-secondary">🔒 Encrypted</span>
            <span className="btn btn-secondary">📊 Transparent</span>
            <span className="btn btn-secondary">⚡ Fast</span>
            <span className="btn btn-secondary">🌐 Accessible</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home