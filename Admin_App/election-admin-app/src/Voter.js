// Voter.js
import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

function Voter() {
  const [voterData, setVoterData] = useState({
    nic: '',
    name: '',
    email: '',
    address: '',
    district: '',
    constituency: ''
  });

  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Sample districts for dropdown
  const districts = ['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Jaffna', 'Matale'];

  // Fetch voters from Firestore
  const fetchVoters = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "voters"));
      const votersList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVoters(votersList);
    } catch (error) {
      console.error("Error fetching voters: ", error);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  const handleVoterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEditing && editId) {
        // Update existing voter
        const voterRef = doc(db, "voters", editId);
        await updateDoc(voterRef, voterData);
        alert('Voter updated successfully!');
      } else {
        // Add new voter
        await addDoc(collection(db, "voters"), voterData);
        alert('Voter added successfully!');
      }
      
      // Reset form and refresh voter list
      resetForm();
      fetchVoters();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} voter: `, error);
      alert(`Failed to ${isEditing ? 'update' : 'add'} voter: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setVoterData({
      nic: '',
      name: '',
      email: '',
      address: '',
      district: '',
      constituency: ''
    });
    setIsEditing(false);
    setEditId(null);
  };

  // Handle edit button click
  const handleEditVoter = (voter) => {
    setIsEditing(true);
    setEditId(voter.id);
    setVoterData({
      nic: voter.nic || '',
      name: voter.name || '',
      email: voter.email || '',
      address: voter.address || '',
      district: voter.district || '',
      constituency: voter.constituency || ''
    });
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete voter function
  const handleDeleteVoter = async (voterId) => {
    // Ask for confirmation before deleting
    const confirmDelete = window.confirm("Are you sure you want to delete this voter? This action cannot be undone.");
    
    if (confirmDelete) {
      setLoading(true);
      try {
        // Delete the document from Firestore
        const voterRef = doc(db, "voters", voterId);
        await deleteDoc(voterRef);
        
        // Update the local state by removing the deleted voter
        setVoters(voters.filter(voter => voter.id !== voterId));
        
        // Reset form if the deleted voter was being edited
        if (editId === voterId) {
          resetForm();
        }
        
        alert('Voter deleted successfully!');
      } catch (error) {
        console.error("Error deleting voter: ", error);
        alert(`Failed to delete voter: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {/* Voter Form */}
      <form onSubmit={handleVoterSubmit} className="form-container"> {/* ADD className here */}
        <h2 className="form-title">
          {isEditing ? 'Update Voter' : 'Add Voter'}
        </h2>

        {/* WRAP fields in a div with className="form-grid" */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Enter NIC Number</label> {/* Use form-label class for consistency */}
            <input 
              type="text" 
              className="form-input"
              value={voterData.nic}
              onChange={(e) => setVoterData({...voterData, nic: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Enter Voter Name</label>
            <input 
              type="text" 
              className="form-input"
              value={voterData.name}
              onChange={(e) => setVoterData({...voterData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Enter Voter Email</label>
            <input 
              type="email" 
              className="form-input"
              value={voterData.email}
              onChange={(e) => setVoterData({...voterData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <select 
              className="form-select"
              value={voterData.district}
              onChange={(e) => setVoterData({...voterData, district: e.target.value})}
              required
              /* Use form-select class */
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
              value={voterData.constituency}
              onChange={(e) => setVoterData({...voterData, constituency: e.target.value})}
              required
            />
          </div>

          {/* This field can span two columns if needed, but for now it's in the grid */}
          <div className="form-group">
            <label className="form-label">Enter Voter Address</label>
            <textarea 
              value={voterData.address}
              onChange={(e) => setVoterData({...voterData, address: e.target.value})}
              required
            />
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

      {/* Voter List */}
      <div className="voters-container">
        {voters.length === 0 ? (
          <p>No voters found.</p>
        ) : (
          voters.map((voter) => (
            <div key={voter.id} className="voter-card">
              <h3>{voter.name}</h3>
              <p><strong>NIC:</strong> {voter.nic}</p>
              <p><strong>Email:</strong> {voter.email}</p>
              <p><strong>Address:</strong> {voter.address}</p>
              <p><strong>District:</strong> {voter.district}</p>
              <p><strong>Constituency:</strong> {voter.constituency}</p>
              
              <div className="card-actions">
                <button 
                  className="edit-button"
                  onClick={() => handleEditVoter(voter)}
                  disabled={loading}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteVoter(voter.id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Voter;

//done
// Note: Make sure to add appropriate CSS styles for the classes used above