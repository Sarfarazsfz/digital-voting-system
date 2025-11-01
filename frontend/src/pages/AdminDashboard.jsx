import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminAPI } from '../services/api'

const AdminDashboard = () => {
  const [elections, setElections] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showElectionTypes, setShowElectionTypes] = useState(false)
  const [selectedElectionType, setSelectedElectionType] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    electionType: '',
    constituency: '',
    candidates: [{ name: '', party: '' }]
  })
  const [selectedElection, setSelectedElection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()
  const { user, userType, logout } = useAuth()

  const electionTypes = [
    { value: 'national', label: 'National Election', icon: '🏛️', description: 'Country-wide elections' },
    { value: 'state', label: 'State Election', icon: '🏙️', description: 'State-level elections' },
    { value: 'municipal', label: 'Municipal Election', icon: '🏘️', description: 'City or municipal elections' },
    { value: 'student', label: 'Student Union', icon: '🎓', description: 'Educational institution elections' },
    { value: 'corporate', label: 'Corporate Election', icon: '💼', description: 'Company board elections' },
    { value: 'organization', label: 'Organization', icon: '👥', description: 'Non-profit organization elections' }
  ]

  useEffect(() => {
    // Check if user is admin
    if (!user || userType !== 'admin') {
      console.log('Not admin, redirecting to login. User:', user, 'UserType:', userType)
      navigate('/login')
      return
    }
    console.log('Admin user detected, fetching elections...')
    fetchElections()
    fetchStats()
  }, [navigate, user, userType])

  const fetchElections = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getElections()
      console.log('Elections fetched:', response.data)
      setElections(response.data)
    } catch (error) {
      console.error('Error fetching elections:', error)
      setMessage('❌ Error fetching elections: ' + (error.response?.data?.message || 'Please check your connection'))
      
      if (error.response?.status === 401) {
        logout()
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getElectionStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleElectionTypeSelect = (type) => {
    setSelectedElectionType(type.value)
    setFormData({
      ...formData,
      electionType: type.value,
      name: `${type.label} - ${new Date().getFullYear()}`,
      description: `Annual ${type.label.toLowerCase()} for selecting representatives`,
      startTime: '',
      endTime: '',
      constituency: '',
      candidates: [{ name: '', party: '' }]
    })
    setShowElectionTypes(false)
    setShowCreateForm(true)
  }

  const handleCreateElection = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const electionData = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString()
      }

      console.log('Creating election with data:', electionData)
      const response = await adminAPI.createElection(electionData)
      
      setMessage('✅ ' + response.data.message)
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        electionType: '',
        constituency: '',
        candidates: [{ name: '', party: '' }]
      })
      setSelectedElectionType('')
      
      fetchElections()
      fetchStats()
    } catch (error) {
      console.error('Error creating election:', error)
      setMessage('❌ Error creating election: ' + (error.response?.data?.message || 'Please check all fields'))
    } finally {
      setLoading(false)
    }
  }

  const addCandidate = () => {
    setFormData({
      ...formData,
      candidates: [...formData.candidates, { name: '', party: '' }]
    })
  }

  const removeCandidate = (index) => {
    if (formData.candidates.length > 1) {
      const updatedCandidates = formData.candidates.filter((_, i) => i !== index)
      setFormData({ ...formData, candidates: updatedCandidates })
    }
  }

  const updateCandidate = (index, field, value) => {
    const updatedCandidates = formData.candidates.map((candidate, i) =>
      i === index ? { ...candidate, [field]: value } : candidate
    )
    setFormData({ ...formData, candidates: updatedCandidates })
  }

  const viewResults = async (electionId) => {
    try {
      const response = await adminAPI.getElectionResults(electionId)
      setSelectedElection(response.data.election)
    } catch (error) {
      console.error('Error fetching results:', error)
      setMessage('❌ Error fetching results: ' + (error.response?.data?.message || 'Election not found'))
    }
  }

  const updateElectionStatus = async (electionId, status) => {
    try {
      await adminAPI.updateElectionStatus(electionId, status)
      setMessage(`✅ Election ${status} successfully!`)
      fetchElections()
      fetchStats()
    } catch (error) {
      console.error('Error updating election status:', error)
      setMessage('❌ Error updating election status: ' + (error.response?.data?.message || 'Please try again'))
    }
  }

  const getElectionTypeIcon = (type) => {
    const electionType = electionTypes.find(t => t.value === type)
    return electionType ? electionType.icon : '🗳️'
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { color: 'btn-secondary', text: '⏰ Upcoming' },
      active: { color: 'btn-success', text: '✅ Active' },
      completed: { color: 'btn-primary', text: '🏁 Completed' }
    }
    const config = statusConfig[status] || statusConfig.upcoming
    return <span className={`btn ${config.color} btn-sm`}>{config.text}</span>
  }

  if (loading && elections.length === 0) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="card-body">
            <div style={{ fontSize: '4rem' }}>⏳</div>
            <h3>Loading Admin Dashboard...</h3>
            <p>Please wait while we fetch your elections</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Header Section */}
      <div className="card slide-up">
        <div className="card-header text-center">
          <h1 className="card-title">👑 Admin Dashboard</h1>
          <p className="card-subtitle">
            Welcome back, {user?.username}! Manage elections and monitor results
          </p>
        </div>
        
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h3>Election Management</h3>
              <p className="text-muted mb-0">
                Total Elections: <strong>{elections.length}</strong>
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary"
                onClick={() => setShowElectionTypes(true)}
                disabled={loading}
              >
                ➕ Create New Election
              </button>
              <button 
                className="btn btn-secondary"
                onClick={logout}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('❌') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {/* Election Type Selection */}
      {showElectionTypes && !showCreateForm && (
        <div className="card slide-up">
          <div className="card-header text-center">
            <h2 className="card-title">Select Election Type</h2>
            <p className="card-subtitle">Choose the type of election you want to create</p>
          </div>
          
          <div className="card-body">
            <div className="grid grid-3">
              {electionTypes.map((type, index) => (
                <div 
                  key={type.value}
                  className="card candidate-card text-center"
                  onClick={() => handleElectionTypeSelect(type)}
                  style={{ cursor: 'pointer', animationDelay: `${index * 0.1}s` }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {type.icon}
                  </div>
                  <h4 className="text-primary">{type.label}</h4>
                  <p className="text-muted">{type.description}</p>
                  <div className="btn btn-primary btn-sm">Select</div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-3">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowElectionTypes(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Election Form */}
      {showCreateForm && (
        <div className="card slide-up">
          <div className="card-header text-center">
            <h2 className="card-title">
              {getElectionTypeIcon(selectedElectionType)} Create {electionTypes.find(t => t.value === selectedElectionType)?.label}
            </h2>
            <p className="card-subtitle">Fill in the election details</p>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleCreateElection}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">🏷️ Election Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter election name"
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">📝 Description *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Enter election description"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">⏰ Start Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">⏹️ End Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">🏛️ Constituency (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.constituency}
                  onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                  placeholder="Enter constituency or district"
                  disabled={loading}
                />
              </div>

              {/* Candidates Section */}
              <div className="form-group">
                <label className="form-label">👥 Candidates *</label>
                <div className="card" style={{ background: 'var(--light-gray)' }}>
                  <div className="card-body">
                    {formData.candidates.map((candidate, index) => (
                      <div key={index} className="grid grid-2 gap-2 mb-2">
                        <div>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Candidate Name *"
                            value={candidate.name}
                            onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                            required
                            disabled={loading}
                          />
                        </div>
                        <div className="d-flex gap-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Party/Affiliation *"
                            value={candidate.party}
                            onChange={(e) => updateCandidate(index, 'party', e.target.value)}
                            required
                            disabled={loading}
                          />
                          {formData.candidates.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => removeCandidate(index)}
                              disabled={loading}
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={addCandidate}
                      disabled={loading}
                    >
                      ➕ Add Candidate
                    </button>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false)
                    setSelectedElectionType('')
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '⏳ Creating...' : '✅ Create Election'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elections List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📋 All Elections</h2>
          <p className="card-subtitle">Manage existing elections and view results</p>
        </div>
        
        <div className="card-body">
          {elections.length === 0 ? (
            <div className="text-center p-4">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗳️</div>
              <h3 className="text-primary">No Elections Created Yet</h3>
              <p className="text-muted">Create your first election to get started with the voting process.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowElectionTypes(true)}
              >
                Create Your First Election
              </button>
            </div>
          ) : (
            <div className="grid grid-2">
              {elections.map(election => (
                <div key={election._id} className="card slide-up">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h4 className="text-primary">
                          {getElectionTypeIcon(election.electionType)} {election.name}
                        </h4>
                        <p className="text-muted mb-1">{election.description}</p>
                      </div>
                      {getStatusBadge(election.status)}
                    </div>
                    
                    <div className="small text-muted mb-3">
                      <div>🕐 <strong>Start:</strong> {new Date(election.startTime).toLocaleString()}</div>
                      <div>🕐 <strong>End:</strong> {new Date(election.endTime).toLocaleString()}</div>
                      <div>👥 <strong>Candidates:</strong> {election.candidates.length}</div>
                      {election.constituency && (
                        <div>🏛️ <strong>Constituency:</strong> {election.constituency}</div>
                      )}
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => viewResults(election._id)}
                      >
                        📊 View Results
                      </button>
                      
                      {election.status === 'upcoming' && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => updateElectionStatus(election._id, 'active')}
                        >
                          ▶️ Start Election
                        </button>
                      )}
                      
                      {election.status === 'active' && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => updateElectionStatus(election._id, 'completed')}
                        >
                          ⏹️ End Election
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Panel */}
      {selectedElection && (
        <div className="card slide-up">
          <div className="card-header text-center">
            <h2 className="card-title">📊 Election Results: {selectedElection.name}</h2>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedElection(null)}
              style={{ position: 'absolute', right: '1rem', top: '1rem' }}
            >
              ✕
            </button>
          </div>
          
          <div className="card-body">
            <div className="candidate-grid">
              {selectedElection.candidates.map(candidate => (
                <div key={candidate.id} className="card candidate-card text-center">
                  <h4 className="candidate-name">{candidate.name}</h4>
                  <p className="candidate-party">{candidate.party}</p>
                  <div className="candidate-votes text-primary">
                    {candidate.votes} votes ({candidate.percentage}%)
                  </div>
                  <div className="progress">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${candidate.percentage}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-3">
              <div className="alert alert-info">
                <strong>Total Votes Cast:</strong> {selectedElection.totalVotes}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="card">
          <div className="card-header text-center">
            <h3 className="card-title">📈 Election Statistics</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-4 text-center">
              <div>
                <div className="text-primary" style={{ fontSize: '2rem' }}>🗳️</div>
                <h4>{stats.totalElections}</h4>
                <p className="text-muted">Total Elections</p>
              </div>
              <div>
                <div className="text-success" style={{ fontSize: '2rem' }}>✅</div>
                <h4>{stats.activeElections}</h4>
                <p className="text-muted">Active Elections</p>
              </div>
              <div>
                <div className="text-warning" style={{ fontSize: '2rem' }}>⏰</div>
                <h4>{stats.upcomingElections}</h4>
                <p className="text-muted">Upcoming</p>
              </div>
              <div>
                <div className="text-info" style={{ fontSize: '2rem' }}>🏁</div>
                <h4>{stats.completedElections}</h4>
                <p className="text-muted">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard