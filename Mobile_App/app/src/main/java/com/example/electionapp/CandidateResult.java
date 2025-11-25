package com.example.electionapp;

public class CandidateResult {
    private String candidateId;
    private String candidateName;
    private String candidateParty;
    private String constituency;
    private String district;
    private String photoBase64;
    private String partySymbolBase64;
    private String electionName;
    private String electionDate;
    private int voteCount;

    public CandidateResult(String candidateId, String candidateName, String candidateParty,
                           String constituency, String district, String photoBase64,
                           String partySymbolBase64, String electionName, String electionDate,
                           int voteCount) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.candidateParty = candidateParty;
        this.constituency = constituency;
        this.district = district;
        this.photoBase64 = photoBase64;
        this.partySymbolBase64 = partySymbolBase64;
        this.electionName = electionName;
        this.electionDate = electionDate;
        this.voteCount = voteCount;
    }

    public void incrementVotes() {
        this.voteCount++;
    }

    // Getters
    public String getCandidateId() { return candidateId; }
    public String getCandidateName() { return candidateName; }
    public String getCandidateParty() { return candidateParty; }
    public String getConstituency() { return constituency; }
    public String getDistrict() { return district; }
    public String getPhotoBase64() { return photoBase64; }
    public String getPartySymbolBase64() { return partySymbolBase64; }

    public int getVoteCount() { return voteCount; }
}