import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const VotingBooth = () => {
  const { electionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [voted, setVoted] = useState(false)
  const [error, setError] = useState('')
  const voter = location.state?.voter

  useEffect(() => {
    if (!voter) {
      navigate('/voter/login')
      return
    }
    fetchElection()
  }, [electionId, voter, navigate])

  const fetchElection = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/election/public`)
      const currentElection = response.data.find(e => e._id === electionId)
      setElection(currentElection)
    } catch (error) {
      setError('Error fetching election data')
    }
  }

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate')
      return
    }

    try {
      await axios.post('http://localhost:5000/api/voter/vote', {
        electionId,
        candidateId: selectedCandidate,
        voterId: voter.id
      })
      setVoted(true)
    } catch (error) {
      setError(error.response?.data?.message || 'Error casting vote')
    }
  }

  if (!election) {
    return <div className="container mt-4">Loading...</div>
  }

  if (voted) {
    return (
      <div className="container container-custom mt-4 text-center">
        <div className="alert alert-success">
          <h4>Thank You for Voting!</h4>
          <p>Your vote has been recorded successfully.</p>
          <button 
            className="btn btn-custom"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container container-custom mt-4">
      <h2 className="text-center">{election.name}</h2>
      <p className="text-center">{election.description}</p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="row">
        <div className="col-md-8 mx-auto">
          <h4 className="mb-4">Select Your Candidate:</h4>
          <div className="row">
            {election.candidates.map(candidate => (
              <div key={candidate._id} className="col-md-6 mb-3">
                <div 
                  className={`candidate-card ${selectedCandidate === candidate._id ? 'selected' : ''}`}
                  onClick={() => setSelectedCandidate(candidate._id)}
                >
                  <div>{candidate.name}</div>
                  <div className="small">{candidate.party}</div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedCandidate && (
            <div className="text-center mt-4">
              <button className="btn btn-custom btn-lg" onClick={handleVote}>
                Confirm Vote
              </button>
              <p className="text-muted mt-2">
                You are voting as: {voter.name} (Aadhaar: {voter.aadhaarNumber})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VotingBooth