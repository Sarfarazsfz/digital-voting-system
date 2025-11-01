import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userType, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <header className="main-header">
        <div className="header-content">
          <h1>Digital Vote</h1>
          <p className="tagline">Secure Digital Voting System</p>
        </div>
      </header>
      
      <nav className="main-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            🗳️ Digital-Vote
          </Link>
          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            
            {!user ? (
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
            ) : (
              <>
                {userType === 'voter' && (
                  <Link
                    to="/voter/dashboard"
                    className={`nav-link ${isActive('/voter/dashboard') ? 'active' : ''}`}
                  >
                    🗳️ Vote Now
                  </Link>
                )}
                
                {userType === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                >
                  📊 My Dashboard
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="logout-btn"
                >
                  🚪 Logout
                </button>
                
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                  {userType === 'admin' ? '👑 Admin' : '👤 Voter'}
                </span>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar