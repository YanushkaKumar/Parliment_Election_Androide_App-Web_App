import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";

function Results() {
  const [currentElectionName, setCurrentElectionName] = useState('');
  const [currentElectionDate, setCurrentElectionDate] = useState('');
  const [allCandidateResults, setAllCandidateResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [filterValue, setFilterValue] = useState('All');
  const [filterValues, setFilterValues] = useState(['All']);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch elections from Firestore
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "elections"));
        const electionsList = [];
        querySnapshot.forEach((doc) => {
          electionsList.push({ id: doc.id, ...doc.data() });
        });
        setElections(electionsList);
        
        // If there are elections, fetch the latest one by default
        if (electionsList.length > 0) {
          fetchLatestElectionResults();
        } else {
          setLoading(false);
          setError("No elections found");
        }
      } catch (error) {
        console.error("Error fetching elections: ", error);
        setLoading(false);
        setError("Error fetching elections");
      }
    };
    
    fetchElections();
  }, []);

  // Fetch latest election results
  const fetchLatestElectionResults = async () => {
    try {
      setLoading(true);
      // Sort the results collection by electionDate in descending order
      const resultsQuery = query(collection(db, "results"), orderBy("electionDate", "desc"));
      const querySnapshot = await getDocs(resultsQuery);
      
      if (!querySnapshot.empty) {
        const latestElection = querySnapshot.docs[0].data();
        const electionName = latestElection.electionName;
        const electionDate = latestElection.electionDate;
        
        setCurrentElectionName(electionName);
        setCurrentElectionDate(electionDate);
        
        // Fetch results for this election
        fetchElectionResults(electionName, electionDate);
      } else {
        setLoading(false);
        setError("No elections found");
      }
    } catch (error) {
      console.error("Error fetching latest election: ", error);
      setLoading(false);
      setError("Error fetching latest election");
    }
  };

  // Fetch election results for specific election
  const fetchElectionResults = async (electionName, electionDate) => {
    try {
      setLoading(true);
      const resultsQuery = query(
        collection(db, "results"),
        where("electionName", "==", electionName),
        where("electionDate", "==", electionDate)
      );
      
      const querySnapshot = await getDocs(resultsQuery);
      
      // Map to count votes for each candidate (similar to mobile app)
      const candidateVotesMap = new Map();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const candidateId = data.candidateId;
        const candidateName = data.candidateName;
        const candidateParty = data.candidateParty;
        const constituency = data.constituency;
        const district = data.district;
        const photoBase64 = data.candidatePhotoBase64;
        const partySymbolBase64 = data.partySymbolBase64;
        
        // Create a key for the candidate
        const key = `${candidateId}_${candidateName}`;
        
        if (candidateVotesMap.has(key)) {
          // Increment vote count for existing candidate
          const result = candidateVotesMap.get(key);
          result.voteCount++;
          candidateVotesMap.set(key, result);
        } else {
          // Create new candidate result
          const result = {
            candidateId,
            candidateName,
            candidateParty,
            constituency,
            district,
            photoBase64,
            partySymbolBase64,
            electionName,
            electionDate,
            voteCount: 1 // Initial vote count
          };
          candidateVotesMap.set(key, result);
        }
      });
      
      // Convert map to array
      const resultsArray = Array.from(candidateVotesMap.values());
      
      // Sort results by vote count in descending order
      resultsArray.sort((a, b) => b.voteCount - a.voteCount);
      
      setAllCandidateResults(resultsArray);
      setDisplayedResults(resultsArray);
      
      // Update filter options based on available data
      updateFilterValues('All');
      
      setLoading(false);
      
      if (resultsArray.length === 0) {
        setError("No election results found");
      } else {
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching election results: ", error);
      setLoading(false);
      setError("Error fetching election results");
    }
  };

  // Function to handle election selection change
  const handleElectionChange = (e) => {
    const selectedElection = elections.find(election => election.id === e.target.value);
    if (selectedElection) {
      setCurrentElectionName(selectedElection.name);
      setCurrentElectionDate(selectedElection.date);
      fetchElectionResults(selectedElection.name, selectedElection.date);
    }
  };

  // Update filter values based on filter type
  const updateFilterValues = (selectedFilterType) => {
    if (allCandidateResults.length === 0) {
      setFilterValues(['All']);
      return;
    }

    const newFilterValues = ['All'];
    const uniqueValues = new Set();

    if (selectedFilterType === 'District') {
      allCandidateResults.forEach(result => {
        if (result.district && result.district.trim() !== '') {
          uniqueValues.add(result.district);
        }
      });
    } else if (selectedFilterType === 'Constituency') {
      allCandidateResults.forEach(result => {
        if (result.constituency && result.constituency.trim() !== '') {
          uniqueValues.add(result.constituency);
        }
      });
    }

    uniqueValues.forEach(value => newFilterValues.push(value));
    setFilterValues(newFilterValues);
    setFilterValue('All'); // Reset to 'All' when filter type changes
  };

  // Handle filter type change
  const handleFilterTypeChange = (e) => {
    const selectedType = e.target.value;
    setFilterType(selectedType);
    updateFilterValues(selectedType);
  };

  // Handle filter value change
  const handleFilterValueChange = (e) => {
    setFilterValue(e.target.value);
  };

  // Apply filters (runs when filter type or value changes)
  useEffect(() => {
    if (allCandidateResults.length === 0) {
      return;
    }

    let filteredResults = [...allCandidateResults];

    if (filterType !== 'All' && filterValue !== 'All') {
      if (filterType === 'District') {
        filteredResults = allCandidateResults.filter(
          result => result.district === filterValue
        );
      } else if (filterType === 'Constituency') {
        filteredResults = allCandidateResults.filter(
          result => result.constituency === filterValue
        );
      }
    }

    // Sort results by vote count in descending order
    filteredResults.sort((a, b) => b.voteCount - a.voteCount);

    setDisplayedResults(filteredResults);
  }, [filterType, filterValue, allCandidateResults]);

  // Helper function to safely create image URLs from base64 data
  const getImageUrl = (base64String) => {
    if (!base64String) return null;
    
    // Check if base64 string already has the data URL prefix
    if (base64String.startsWith('data:image')) {
      return base64String;
    }
    
    // Add the data URL prefix if it's missing
    return `data:image/jpeg;base64,${base64String}`;
  };

  return (
    <div className="results-container">
      <h2 className="results-title">Election Results</h2>
      
      {/* Control panel with dropdowns in a responsive layout */}
      <div className="control-panel">
        <div className="control-item">
          <label htmlFor="election-select">Select Election:</label>
          <select 
            id="election-select"
            onChange={handleElectionChange}
            value={elections.find(e => e.name === currentElectionName && e.date === currentElectionDate)?.id || ''}
          >
            <option value="">Select an election</option>
            {elections.map(election => (
              <option key={election.id} value={election.id}>
                {election.name} ({election.date})
              </option>
            ))}
          </select>
        </div>
        
        <div className="controls-row">
          <div className="control-item">
            <label htmlFor="filter-type">Filter by:</label>
            <select 
              id="filter-type"
              value={filterType}
              onChange={handleFilterTypeChange}
            >
              <option value="All">All</option>
              <option value="District">District</option>
              <option value="Constituency">Constituency</option>
            </select>
          </div>
          
          <div className="control-item">
            <label htmlFor="filter-value">Value:</label>
            <select 
              id="filter-value"
              value={filterValue}
              onChange={handleFilterValueChange}
              disabled={filterType === 'All'}
            >
              {filterValues.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && <p className="loading-message">Loading election results...</p>}
      
      {/* Error state */}
      {!loading && error && <p className="error-message">{error}</p>}
      
      {/* Results display */}
      {!loading && !error && (
        <div className="results-list">
          {displayedResults.length === 0 ? (
            <p className="no-results">No results match the selected filters</p>
          ) : (
            <div className="results-grid">
              {displayedResults.map((result, index) => (
                <div key={`${result.candidateId}_${index}`} className="result-card">
                  <div className="result-card-header">
                    <div className="candidate-photo-container">
                      {result.photoBase64 ? (
                        <img 
                          src={getImageUrl(result.photoBase64)}
                          alt=""
                          className="candidate-photo"
                          onError={(e) => {
                            console.error("Failed to load candidate image");
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="candidate-photo-placeholder"></div>
                      )}
                    </div>
                    <div className="candidate-header-info">
                      <h3 className="candidate-name">{result.candidateName}</h3>
                      <div className="candidate-id">ID: {result.candidateId}</div>
                    </div>
                  </div>
                  
                  <div className="result-card-details">
                    <div className="party-info">
                      {result.partySymbolBase64 && (
                        <img 
                          src={getImageUrl(result.partySymbolBase64)}
                          alt=""
                          className="party-symbol1"
                          onError={(e) => {
                            console.error("Failed to load party symbol");
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="party-name">{result.candidateParty}</span>
                    </div>
                    
                    <div className="location-info">
                      <div className="info-row">
                        <span className="info-label">Constituency:</span>
                        <span className="info-value">{result.constituency}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">District:</span>
                        <span className="info-value">{result.district}</span>
                      </div>
                    </div>
                    
                    <div className="vote-count">
                      <span className="vote-count-label">Votes:</span>
                      <span className="vote-count-value">{result.voteCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Results;