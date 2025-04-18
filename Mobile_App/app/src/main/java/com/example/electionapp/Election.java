package com.example.electionapp;

public class Election {
    private String name;
    private String date;
    private String candidateId;
    private String candidateName;
    private String voterNIC;

    //Empty constructor required for Firestore
    public Election() {
        this.name = "";
        this.date = "N/A";
        this.candidateId = "";
        this.candidateName = "";
        this.voterNIC = "";
    }

    // Constructor with two parameters (existing functionality)
    public Election(String name, String date) {
        this.name = name;
        this.date = (date == null || date.isEmpty()) ? "N/A" : date;
        this.candidateId = "";
        this.candidateName = "";
        this.voterNIC = "";
    }

    // New constructor with all required parameters
    public Election(String name, String date, String candidateId, String candidateName, String voterNIC) {
        this.name = name;
        this.date = (date == null || date.isEmpty()) ? "N/A" : date;
        this.candidateId = (candidateId == null) ? "" : candidateId;
        this.candidateName = (candidateName == null) ? "" : candidateName;
        this.voterNIC = (voterNIC == null) ? "" : voterNIC;
    }

    // Getters
    public String getName() {
        return name;
    }

    public String getDate() {
        return date;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public String getVoterNIC() {
        return voterNIC;
    }
}
