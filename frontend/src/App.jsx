import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import VoterDashboard from './pages/VoterDashboard'
import VotingBooth from './pages/VotingBooth'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  const { user, userType } = useAuth()

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredUserType="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Voter Routes */}
          <Route 
            path="/voter/dashboard" 
            element={
              <ProtectedRoute requiredUserType="voter">
                <VoterDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/voting/:electionId" 
            element={
              <ProtectedRoute requiredUserType="voter">
                <VotingBooth />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect to appropriate dashboard based on user type */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                userType === 'admin' ? 
                  <Navigate to="/admin/dashboard" replace /> : 
                  <Navigate to="/voter/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App