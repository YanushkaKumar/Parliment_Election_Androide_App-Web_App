import React, { useState, useEffect, useRef } from 'react';
import { addDoc, collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

function Candidate() {
  const [candidateData, setCandidateData] = useState({
    candidateId: '',
    candidateName: '',
    candidateParty: '',
    district: '',
    constituency: '',
    electionName: '',
    votes: 0,
    candidatePhotoBase64: '',
    partySymbolBase64: ''
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [symbolPreview, setSymbolPreview] = useState(null);
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Use refs to access the file inputs directly
  const photoInputRef = useRef(null);
  const symbolInputRef = useRef(null);
  
  const districts = ['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Jaffna', 'Matale'];

  // Fetch elections from Firestore
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "elections"));
        const electionsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setElections(electionsList);
      } catch (error) {
        console.error("Error fetching elections: ", error);
      }
    };
    fetchElections();
  }, []);

  // Fetch candidates from Firestore
  const fetchCandidates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "candidates"));
      const candidatesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCandidates(candidatesList);
    } catch (error) {
      console.error("Error fetching candidates: ", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Compress image before converting to base64
  const compressImage = (file, maxWidth = 500, maxHeight = 500, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw resized image
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed base64 string
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
      };
    });
  };

  // Handle candidate photo selection
  const handleCandidatePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLoading(true);
        const compressedBase64 = await compressImage(file);
        setCandidateData({...candidateData, candidatePhotoBase64: compressedBase64});
        setPhotoPreview(compressedBase64);
      } catch (error) {
        console.error("Error processing image:", error);
        alert("Failed to process image. Please try again with a smaller image.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle party symbol selection
  const handlePartySymbolChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLoading(true);
        const compressedBase64 = await compressImage(file, 300, 300, 0.6);
        setCandidateData({...candidateData, partySymbolBase64: compressedBase64});
        setSymbolPreview(compressedBase64);
      } catch (error) {
        console.error("Error processing image:", error);
        alert("Failed to process image. Please try again with a smaller image.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check if both images are provided and warn about data size if needed
      if (candidateData.candidatePhotoBase64 && candidateData.partySymbolBase64) {
        const totalSize = (candidateData.candidatePhotoBase64.length + candidateData.partySymbolBase64.length) / 1024 / 1024;
        if (totalSize > 0.8) {
          const proceed = window.confirm(`The images are quite large (${totalSize.toFixed(2)}MB). This may affect your Firestore document size limits. Do you want to proceed?`);
          if (!proceed) {
            setLoading(false);
            return;
          }
        }
      }
      
      if (isEditing && editId) {
        // Update existing candidate
        const candidateRef = doc(db, "candidates", editId);
        await updateDoc(candidateRef, candidateData);
        alert('Candidate updated successfully!');
      } else {
        // Add new candidate
        await addDoc(collection(db, "candidates"), candidateData);
        alert('Candidate added successfully!');
      }
      
      // Reset form and preview images
      resetForm();
      fetchCandidates();
    } catch (error) {
      console.error("Error handling candidate: ", error);
      alert(`Failed to ${isEditing ? 'update' : 'add'} candidate: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    // Clear all form data
    setCandidateData({
      candidateId: '',
      candidateName: '',
      candidateParty: '',
      district: '',
      constituency: '',
      electionName: '',
      votes: 0,
      candidatePhotoBase64: '',
      partySymbolBase64: ''
    });
    
    // Clear preview states
    setPhotoPreview(null);
    setSymbolPreview(null);
    
    // Reset editing state
    setIsEditing(false);
    setEditId(null);
    
    // Reset file inputs using refs
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
    
    if (symbolInputRef.current) {
      symbolInputRef.current.value = '';
    }
  };

  // Handle edit button click
  const handleEditCandidate = (candidate) => {
    setIsEditing(true);
    setEditId(candidate.id);
    setCandidateData({
      candidateId: candidate.candidateId || '',
      candidateName: candidate.candidateName || '',
      candidateParty: candidate.candidateParty || '',
      district: candidate.district || '',
      constituency: candidate.constituency || '',
      electionName: candidate.electionName || '',
      votes: candidate.votes || 0,
      candidatePhotoBase64: candidate.candidatePhotoBase64 || '',
      partySymbolBase64: candidate.partySymbolBase64 || ''
    });
    setPhotoPreview(candidate.candidatePhotoBase64 || null);
    setSymbolPreview(candidate.partySymbolBase64 || null);
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete candidate function
  const handleDeleteCandidate = async (candidateId) => {
    // Ask for confirmation before deleting
    const confirmDelete = window.confirm("Are you sure you want to delete this candidate? This action cannot be undone.");
    
    if (confirmDelete) {
      setLoading(true);
      try {
        // Delete the document from Firestore
        const candidateRef = doc(db, "candidates", candidateId);
        await deleteDoc(candidateRef);
        
        // Update the local state by removing the deleted candidate
        setCandidates(candidates.filter(candidate => candidate.id !== candidateId));
        
        // Reset form if the deleted candidate was being edited
        if (editId === candidateId) {
          resetForm();
        }
        
        alert('Candidate deleted successfully!');
      } catch (error) {
        console.error("Error deleting candidate: ", error);
        alert(`Failed to delete candidate: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {/* Candidate Form */}
      <form onSubmit={handleCandidateSubmit} className="form-container"> {/* ADD className here */}
        <h2 className="form-title">
          {isEditing ? 'Update Candidate' : 'Add Candidate'}
        </h2>

        {/* WRAP fields in a div with className="form-grid" */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Enter Candidate ID</label>
            <input 
              type="text"
              className="form-input"
              value={candidateData.candidateId}
              onChange={(e) => setCandidateData({...candidateData, candidateId: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Enter Candidate Name</label>
            <input 
              type="text" 
              className="form-input"
              value={candidateData.candidateName}
              onChange={(e) => setCandidateData({...candidateData, candidateName: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Enter Candidate Party</label>
            <input 
              type="text" 
              className="form-input"
              value={candidateData.candidateParty}
              onChange={(e) => setCandidateData({...candidateData, candidateParty: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select District</label>
            <select 
              className="form-select"
              value={candidateData.district}
              onChange={(e) => setCandidateData({...candidateData, district: e.target.value})}
              required
            >
              <option value="">Select a district</option>
              {districts.map((district, index) => (
                <option key={index} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Enter Constituency</label>
            <input 
              type="text" 
              className="form-input"
              value={candidateData.constituency}
              onChange={(e) => setCandidateData({...candidateData, constituency: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Election</label>
            <select 
              className="form-select"
              value={candidateData.electionName}
              onChange={(e) => setCandidateData({...candidateData, electionName: e.target.value})}
              required
            >
              <option value="">Select an election</option>
              {elections.map((election) => (
                <option key={election.id} value={election.name}>{election.name}</option>
              ))}
            </select>
          </div>

          {/* Candidate Photo Upload */}
          <div className="form-group">
            <label className="form-label">
              {isEditing ? 'Update Candidate Photo (optional)' : 'Upload Candidate Photo'}
            </label>
            <input 
              ref={photoInputRef}
              type="file"
              className="form-input" /* Use form-input for consistent styling */
              accept="image/*"
              onChange={handleCandidatePhotoChange}
              required={!isEditing && !photoPreview}
            />
            {photoPreview && (
              <div className="image-preview">
                <img 
                  src={photoPreview} 
                  alt="Candidate preview" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                />
              </div>
            )}
          </div>

          {/* Party Symbol Upload */}
          <div className="form-group">
            <label className="form-label">
              {isEditing ? 'Update Party Symbol (optional)' : 'Upload Party Symbol'}
            </label>
            <input 
              ref={symbolInputRef}
              type="file"
              className="form-input" /* Use form-input for consistent styling */
              accept="image/*"
              onChange={handlePartySymbolChange}
              required={!isEditing && !symbolPreview}
            />
            {symbolPreview && (
              <div className="image-preview">
                <img 
                  src={symbolPreview} 
                  alt="Party symbol preview" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                />
              </div>
            )}
          </div>
        </div> {/* END of form-grid */}

 <div 
          className="form-buttons" 
          style={!isEditing ? { justifyContent: 'center' } : {}}
        >
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
            // This style is applied only when the button is by itself
            style={!isEditing ? { flex: 'none' } : {}}
          >
            {loading ? 'Processing...' : isEditing ? 'Update Candidate' : 'Submit Candidate'}
            {/* For Voter.js, the text will be 'Submit Voter' etc. The logic is the same. */}
          </button>
          
          {isEditing && (
            <button 
              type="button" 
              className="cancel-button" 
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Candidate Cards */}
      <div className="candidates-container">
     
        {candidates.length === 0 ? (
          <p>No candidates found.</p>
        ) : (
          candidates.map((candidate) => (
            <div key={candidate.id} className="candidate-card">
              <div className="candidate-image">
                {candidate.candidatePhotoBase64 ? (
                  <img 
                    src={candidate.candidatePhotoBase64} 
                    alt={candidate.candidateName}
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="no-image">No Photo</div>
                )}
              </div>
              <div className="candidate-details">
                <h3>{candidate.candidateName}</h3>
                <p><strong>ID:</strong> {candidate.candidateId}</p>
                <p><strong>Party:</strong> {candidate.candidateParty}</p>
                <div className="party-symbol">
                  {candidate.partySymbolBase64 ? (
                    <img 
                      src={candidate.partySymbolBase64} 
                      alt={`${candidate.candidateParty} symbol`}
                      style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="no-symbol">No Symbol</div>
                  )}
                </div>
                <p><strong>District:</strong> {candidate.district}</p>
                <p><strong>Constituency:</strong> {candidate.constituency}</p>
                <p><strong>Election:</strong> {candidate.electionName}</p>
                
                <div className="card-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEditCandidate(candidate)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteCandidate(candidate.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Candidate;