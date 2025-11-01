import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { voterAPI } from '../services/api'

const VoterDashboard = () => {
  const [elections, setElections] = useState([])
  const [selectedElection, setSelectedElection] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [votedElections, setVotedElections] = useState([])
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('VoterDashboard mounted, user:', user)
    if (!user || user.userType !== 'voter') {
      console.log('Not a voter, redirecting to login')
      navigate('/login')
      return
    }
    fetchActiveElections()
  }, [navigate, user])

  const fetchActiveElections = async () => {
    try {
      setLoading(true)
      console.log('Fetching active elections...')
      const response = await voterAPI.getActiveElections()
      console.log('Elections response:', response.data)
      setElections(response.data || [])
    } catch (error) {
      console.error('Error fetching elections:', error)
      setMessage('❌ Error fetching elections: ' + (error.response?.data?.message || 'Please try again later'))
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (electionId, candidateId) => {
    if (!selectedCandidate) {
      setMessage('❌ Please select a candidate to vote for')
      return
    }

    if (!window.confirm(`Are you sure you want to vote for ${selectedCandidate.name} from ${selectedCandidate.party}? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Use voter ID from the user object
      const voterId = user?.id || user?._id || 'demo-voter-id'
      
      console.log('Casting vote with:', { electionId, candidateId, voterId })
      await voterAPI.castVote(electionId, candidateId, voterId)
      
      setMessage('✅ Your vote has been cast successfully! Thank you for participating in the democratic process.')
      
      // Add to voted elections
      setVotedElections([...votedElections, electionId])
      
      // Reset selections
      setSelectedElection(null)
      setSelectedCandidate(null)
      
      // Refresh elections list
      fetchActiveElections()
    } catch (error) {
      console.error('Error casting vote:', error)
      setMessage('❌ Error casting vote: ' + (error.response?.data?.message || 'Please try again'))
    } finally {
      setLoading(false)
    }
  }

  const viewElectionDetails = (election) => {
    console.log('Viewing election details:', election)
    setSelectedElection(election)
    setSelectedCandidate(null)
    setMessage('')
  }

  const selectCandidate = (candidate) => {
    console.log('Selected candidate:', candidate)
    setSelectedCandidate(candidate)
    setMessage(`✅ Selected: ${candidate.name} (${candidate.party})`)
  }

  const getElectionStatus = (election) => {
    if (!election.startTime || !election.endTime) return 'unknown'
    
    const now = new Date()
    const start = new Date(election.startTime)
    const end = new Date(election.endTime)

    if (now < start) return 'upcoming'
    if (now > end) return 'completed'
    return 'active'
  }

  const hasVoted = (electionId) => {
    return votedElections.includes(electionId)
  }

  const getTimeRemaining = (endTime) => {
    if (!endTime) return 'Unknown'
    
    const end = new Date(endTime)
    const now = new Date()
    const diff = end - now
    
    if (diff <= 0) return 'Election ended'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m remaining`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    try {
      return new Date(dateString).toLocaleString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  if (loading && elections.length === 0) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="card-body">
            <div style={{ fontSize: '4rem' }}>⏳</div>
            <h3>Loading Your Dashboard...</h3>
            <p>Please wait while we fetch available elections</p>
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
          <h1 className="card-title">🗳️ Voter Dashboard</h1>
          <p className="card-subtitle">
            Welcome, Citizen! Exercise your right to vote
          </p>
        </div>
        
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h3>Available Elections</h3>
              <p className="text-muted mb-0">
                Active Elections: <strong>{elections.filter(e => getElectionStatus(e) === 'active').length}</strong>
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <button 
                className="btn btn-secondary"
                onClick={logout}
              >
                🚪 Logout
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={fetchActiveElections}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Voter Info */}
          <div className="alert alert-info mt-3">
            <h4>👤 Voter Information</h4>
            <p className="mb-1"><strong>Aadhaar Number:</strong> {user?.aadhaarNumber || 'Not provided'}</p>
            <p className="mb-1"><strong>Name:</strong> {user?.name || 'Not provided'}</p>
            <p className="mb-0"><strong>Age:</strong> {user?.age || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('❌') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {/* Available Elections */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📋 Elections Available for Voting</h2>
          <p className="card-subtitle">Select an election to view candidates and cast your vote</p>
        </div>
        
        <div className="card-body">
          {elections.length === 0 ? (
            <div className="text-center p-4">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗳️</div>
              <h3 className="text-primary">No Elections Available</h3>
              <p className="text-muted">There are currently no active elections. Please check back later.</p>
              <button 
                className="btn btn-primary mt-2"
                onClick={fetchActiveElections}
                disabled={loading}
              >
                {loading ? '⏳ Checking...' : '🔍 Check for Elections'}
              </button>
            </div>
          ) : (
            <div className="grid grid-2">
              {elections.map(election => {
                const status = getElectionStatus(election)
                const hasVotedInThisElection = hasVoted(election._id)
                const candidatesCount = election.candidates?.length || 0
                
                return (
                  <div key={election._id} className="card slide-up">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h4 className="text-primary">{election.name || 'Unnamed Election'}</h4>
                          <p className="text-muted mb-1">{election.description || 'No description available'}</p>
                        </div>
                        <span className={`btn btn-sm ${
                          status === 'active' ? 'btn-success' : 
                          status === 'upcoming' ? 'btn-warning' : 'btn-secondary'
                        }`}>
                          {status === 'active' ? '✅ Active' : 
                           status === 'upcoming' ? '⏰ Upcoming' : '🏁 Completed'}
                        </span>
                      </div>
                      
                      <div className="small text-muted mb-3">
                        <div>🕐 <strong>Start:</strong> {formatDate(election.startTime)}</div>
                        <div>🕐 <strong>End:</strong> {formatDate(election.endTime)}</div>
                        {status === 'active' && (
                          <div>⏱️ <strong>Time Left:</strong> {getTimeRemaining(election.endTime)}</div>
                        )}
                        <div>👥 <strong>Candidates:</strong> {candidatesCount}</div>
                        {election.constituency && (
                          <div>🏛️ <strong>Constituency:</strong> {election.constituency}</div>
                        )}
                        <div>🏷️ <strong>Type:</strong> {election.electionType || 'General'}</div>
                      </div>

                      {/* Show candidates preview */}
                      {election.candidates && election.candidates.length > 0 && (
                        <div className="mb-3">
                          <h6>👥 Candidates Preview:</h6>
                          <div className="d-flex flex-wrap gap-1">
                            {election.candidates.slice(0, 3).map((candidate, index) => (
                              <span key={index} className="btn btn-outline-secondary btn-xs">
                                {candidate.name} ({candidate.party})
                              </span>
                            ))}
                            {election.candidates.length > 3 && (
                              <span className="btn btn-outline-secondary btn-xs">
                                +{election.candidates.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="d-flex gap-2 flex-wrap">
                        {status === 'active' && !hasVotedInThisElection && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => viewElectionDetails(election)}
                            disabled={loading}
                          >
                            🗳️ Vote Now
                          </button>
                        )}
                        
                        {status === 'active' && hasVotedInThisElection && (
                          <button className="btn btn-success btn-sm" disabled>
                            ✅ Already Voted
                          </button>
                        )}
                        
                        {status === 'upcoming' && (
                          <button className="btn btn-secondary btn-sm" disabled>
                            ⏰ Coming Soon
                          </button>
                        )}
                        
                        {status === 'completed' && (
                          <button className="btn btn-secondary btn-sm" disabled>
                            🏁 Election Ended
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => viewElectionDetails(election)}
                          disabled={loading}
                        >
                          👀 View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Election Details & Voting Interface */}
      {selectedElection && (
        <div className="card slide-up">
          <div className="card-header text-center">
            <h2 className="card-title">
              🗳️ Cast Your Vote: {selectedElection.name}
            </h2>
            <p className="card-subtitle">
              Select your preferred candidate and confirm your vote
            </p>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedElection(null)
                setSelectedCandidate(null)
              }}
              style={{ position: 'absolute', right: '1rem', top: '1rem' }}
              disabled={loading}
            >
              ✕ Close
            </button>
          </div>
          
          <div className="card-body">
            {/* Election Info */}
            <div className="alert alert-info mb-4">
              <h4>ℹ️ Election Information</h4>
              <p className="mb-1"><strong>Description:</strong> {selectedElection.description}</p>
              <p className="mb-1"><strong>Constituency:</strong> {selectedElection.constituency || 'National'}</p>
              <p className="mb-1"><strong>Type:</strong> {selectedElection.electionType || 'General Election'}</p>
              <p className="mb-0"><strong>Time Left:</strong> {getTimeRemaining(selectedElection.endTime)}</p>
            </div>

            {/* Selected Candidate Display */}
            {selectedCandidate && (
              <div className="alert alert-success text-center">
                <h4>✅ Candidate Selected</h4>
                <p className="mb-0">
                  You have selected <strong>{selectedCandidate.name}</strong> from <strong>{selectedCandidate.party}</strong>
                </p>
                <p className="mb-0 mt-2">
                  <small>Click "Cast Vote" below to confirm your selection</small>
                </p>
              </div>
            )}

            {/* Candidates List */}
            <h3 className="text-center mb-4">👥 Candidates</h3>
            
            {(!selectedElection.candidates || selectedElection.candidates.length === 0) ? (
              <div className="text-center p-4">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
                <h4 className="text-warning">No Candidates Available</h4>
                <p className="text-muted">This election doesn't have any candidates yet.</p>
              </div>
            ) : (
              <div className="candidate-grid">
                {selectedElection.candidates.map((candidate, index) => (
                  <div 
                    key={candidate._id || index}
                    className={`candidate-card text-center ${
                      selectedCandidate?._id === candidate._id ? 'selected' : ''
                    }`}
                    onClick={() => selectCandidate(candidate)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="candidate-avatar">
                      {candidate.party?.includes('Congress') ? '🟠' :
                       candidate.party?.includes('BJP') ? '🟡' :
                       candidate.party?.includes('AAP') ? '🔵' : 
                       candidate.party?.includes('Party') ? '⚪' : '👤'}
                    </div>
                    <h4 className="candidate-name">{candidate.name || 'Unknown Candidate'}</h4>
                    <p className="candidate-party">{candidate.party || 'Independent'}</p>
                    <div className="candidate-votes">
                      {candidate.votes || 0} votes
                    </div>
                    <div className={`selection-indicator ${
                      selectedCandidate?._id === candidate._id ? 'selected' : ''
                    }`}>
                      {selectedCandidate?._id === candidate._id ? '✅ Selected' : '⬜ Click to Select'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Voting Instructions */}
            <div className="alert alert-warning mt-4">
              <h4>⚠️ Important Voting Instructions</h4>
              <ul className="mb-0">
                <li>Select one candidate by clicking on their card</li>
                <li>Your vote is final and cannot be changed once cast</li>
                <li>Voting is anonymous and secure</li>
                <li>You can only vote once in each election</li>
                <li>Make sure you have selected the correct candidate before confirming</li>
              </ul>
            </div>

            {/* Vote Button */}
            <div className="text-center mt-4">
              <button 
                className="btn btn-success btn-lg"
                onClick={() => handleVote(selectedElection._id, selectedCandidate?._id)}
                disabled={!selectedCandidate || loading || hasVoted(selectedElection._id)}
                style={{ minWidth: '200px' }}
              >
                {loading ? (
                  <>⏳ Casting Vote...</>
                ) : (
                  <>✅ Cast Vote for {selectedCandidate?.name}</>
                )}
              </button>
              
              {!selectedCandidate && (
                <div className="alert alert-info mt-3">
                  <strong>ℹ️ Please select a candidate to enable voting</strong>
                </div>
              )}
              
              {hasVoted(selectedElection._id) && (
                <div className="alert alert-success mt-3">
                  <strong>✅ You have already voted in this election.</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voting Statistics */}
      {elections.length > 0 && (
        <div className="card">
          <div className="card-header text-center">
            <h3 className="card-title">📊 Your Voting Summary</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-3 text-center">
              <div>
                <div className="text-primary" style={{ fontSize: '2rem' }}>🗳️</div>
                <h4>{elections.length}</h4>
                <p className="text-muted">Total Elections</p>
              </div>
              <div>
                <div className="text-success" style={{ fontSize: '2rem' }}>✅</div>
                <h4>{votedElections.length}</h4>
                <p className="text-muted">Elections Voted</p>
              </div>
              <div>
                <div className="text-warning" style={{ fontSize: '2rem' }}>⏰</div>
                <h4>{elections.filter(e => getElectionStatus(e) === 'active').length - votedElections.length}</h4>
                <p className="text-muted">Elections to Vote</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Information (remove in production) */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🐛 Debug Information</h3>
        </div>
        <div className="card-body">
          <div className="small">
            <p><strong>User Data:</strong> {JSON.stringify(user)}</p>
            <p><strong>Elections Count:</strong> {elections.length}</p>
            <p><strong>Selected Election:</strong> {selectedElection?._id || 'None'}</p>
            <p><strong>Selected Candidate:</strong> {selectedCandidate?._id || 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoterDashboard