package com.example.electionapp;

public class VoteResult {
    private String voterNIC;
    private String electionName;
    private String candidateId;
    private String candidateName;
    private String electionDate;
    private String candidateParty;
    private String constituency;
    private String district;
    private String candidatePhotoBase64;
    private String partySymbolBase64;
    private long timestamp;

    // Default constructor for Firestore
    public VoteResult() {
    }

    // Basic constructor
    public VoteResult(String voterNIC, String electionName, String candidateId,
                      String candidateName, String electionDate) {
        this.voterNIC = voterNIC;
        this.electionName = electionName;
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.electionDate = electionDate;
    }

    // Getters and setters
    public String getVoterNIC() {
        return voterNIC;
    }

    public void setVoterNIC(String voterNIC) {
        this.voterNIC = voterNIC;
    }

    public String getElectionName() {
        return electionName;
    }

    public void setElectionName(String electionName) {
        this.electionName = electionName;
    }

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

    public String getElectionDate() {
        return electionDate;
    }

    public void setElectionDate(String electionDate) {
        this.electionDate = electionDate;
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

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}