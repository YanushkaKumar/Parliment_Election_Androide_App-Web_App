// Voter.js
import React, { useMemo, useState } from 'react';
import { addDoc, collection, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useLiveCollection } from "./live";
import { SearchBox, useUi } from "./ui";

function Voter() {
  const { toast, confirm } = useUi();
  const [voterData, setVoterData] = useState({
    nic: '',
    name: '',
    email: '',
    address: '',
    district: '',
    constituency: ''
  });

  const liveVoters = useLiveCollection("voters");
  const voters = liveVoters.docs;
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Sample districts for dropdown
  const districts = ['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Jaffna', 'Matale'];

  const shownVoters = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...voters].sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    if (!q) return list;
    return list.filter((v) => [v.name, v.nic, v.email, v.constituency, v.district]
      .some((f) => (f || '').toLowerCase().includes(q)));
  }, [voters, search]);

  const handleVoterSubmit = async (e) => {
    e.preventDefault();

    // NIC is the login identifier, so normalise it and keep it unique.
    const data = {
      ...voterData,
      nic: voterData.nic.trim().toUpperCase(),
      email: voterData.email.trim(),
      constituency: voterData.constituency.trim(),
    };
    const duplicate = voters.find((v) => (v.nic || '').toUpperCase() === data.nic && v.id !== editId);
    if (duplicate) {
      toast(`NIC ${data.nic} is already registered to ${duplicate.name}.`, 'error');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && editId) {
        // Update existing voter
        const voterRef = doc(db, "voters", editId);
        await updateDoc(voterRef, data);
        toast(`${data.name} updated.`);
      } else {
        // Add new voter
        await addDoc(collection(db, "voters"), data);
        toast(`${data.name} registered.`);
      }
      
      // Reset form and refresh voter list
      resetForm();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} voter: `, error);
      toast(`Failed to ${isEditing ? 'update' : 'add'} voter: ${error.message}`, 'error');
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
    const target = voters.find((v) => v.id === voterId);
    const confirmDelete = await confirm({
      title: `Delete ${target?.name || 'voter'}?`,
      message: 'They will no longer be able to log in to the voter app. This cannot be undone.',
      confirmLabel: 'Delete voter',
      danger: true,
    });
    
    if (confirmDelete) {
      setLoading(true);
      try {
        // Delete the document from Firestore
        const voterRef = doc(db, "voters", voterId);
        await deleteDoc(voterRef);
        
        // Reset form if the deleted voter was being edited
        if (editId === voterId) {
          resetForm();
        }
        
        toast(`${target?.name || 'Voter'} deleted.`, 'info');
      } catch (error) {
        console.error("Error deleting voter: ", error);
        toast(`Failed to delete voter: ${error.message}`, 'error');
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
            <label className="form-label">Select District</label>
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
            {loading ? 'Processing...' : isEditing ? 'Update Voter' : 'Submit Voter'}
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
      <SearchBox value={search} onChange={setSearch} placeholder="Search voters by name, NIC, email, constituency…" />
      <div className="list-meta">
        <span>{shownVoters.length} of {voters.length} voters</span>
      </div>
      <div className="voters-container">
        {liveVoters.loading ? (
          <p>Loading voters…</p>
        ) : shownVoters.length === 0 ? (
          <p>{search ? 'No voters match your search.' : 'No voters found.'}</p>
        ) : (
          shownVoters.map((voter) => (
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