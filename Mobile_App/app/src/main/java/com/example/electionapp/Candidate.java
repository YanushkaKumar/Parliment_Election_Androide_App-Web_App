package com.example.electionapp;

public class Candidate {
    private String candidateId;
    private String candidateName;
    private String candidateParty;
    private String constituency;
    private String district;
    private String electionName;
    private String candidatePhotoBase64;
    private String partySymbolBase64;
    private int votes;
    private boolean voted; // New field

    // Main constructor with required fields
    public Candidate(String candidateId, String candidateName, String candidateParty) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.candidateParty = candidateParty;
        this.votes = 0; // Initialize votes to zero
        this.voted = false; // Initialize voted to false
    }

    // Full constructor with all fields
    public Candidate(String candidateId, String candidateName, String candidateParty,
                     String constituency, String district, String electionName,
                     String candidatePhotoBase64, String partySymbolBase64, int votes) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.candidateParty = candidateParty;
        this.constituency = constituency;
        this.district = district;
        this.electionName = electionName;
        this.candidatePhotoBase64 = candidatePhotoBase64;
        this.partySymbolBase64 = partySymbolBase64;
        this.votes = votes;
        this.voted = false; // Initialize voted to false
    }

    // Getters and setters for voted
    public boolean isVoted() {
        return voted;
    }

    public void setVoted(boolean voted) {
        this.voted = voted;
    }

    // Getters and setters
    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getCandidateParty() {
        return candidateParty;
    }

    public void setCandidateParty(String candidateParty) {
        this.candidateParty = candidateParty;
    }

    public String getConstituency() {
        return constituency;
    }

    public void setConstituency(String constituency) {
        this.constituency = constituency;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getElectionName() {
        return electionName;
    }

    public void setElectionName(String electionName) {
        this.electionName = electionName;
    }

    public String getCandidatePhotoBase64() {
        return candidatePhotoBase64;
    }

    public void setCandidatePhotoBase64(String candidatePhotoBase64) {
        this.candidatePhotoBase64 = candidatePhotoBase64;
    }

    public String getPartySymbolBase64() {
        return partySymbolBase64;
    }

    public void setPartySymbolBase64(String partySymbolBase64) {
        this.partySymbolBase64 = partySymbolBase64;
    }



    // Method to increment votes
    public void incrementVotes() {
        this.votes++;
    }
}