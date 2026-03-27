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



    // Basic constructor
    public VoteResult(String voterNIC, String electionName, String candidateId,
                      String candidateName, String electionDate) {
        this.voterNIC = voterNIC;
        this.electionName = electionName;
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.electionDate = electionDate;
    }



    public void setCandidateParty(String candidateParty) {
        this.candidateParty = candidateParty;
    }



    public void setConstituency(String constituency) {
        this.constituency = constituency;
    }



    public void setDistrict(String district) {
        this.district = district;
    }



    public void setCandidatePhotoBase64(String candidatePhotoBase64) {
        this.candidatePhotoBase64 = candidatePhotoBase64;
    }



    public void setPartySymbolBase64(String partySymbolBase64) {
        this.partySymbolBase64 = partySymbolBase64;
    }



    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}