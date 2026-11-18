package com.example.electionapp;

import com.google.firebase.firestore.DocumentSnapshot;

public class Candidate {
    private final String docId;        // Firestore document id (used by castVote)
    private final String candidateId;  // human-readable id entered by the admin
    private final String candidateName;
    private final String candidateParty;
    private final String constituency;
    private final String district;
    private final String electionName;
    private final String candidatePhotoBase64;
    private final String partySymbolBase64;
    private final long votes;
    private boolean voted;

    private Candidate(DocumentSnapshot doc) {
        docId = doc.getId();
        candidateId = orEmpty(doc.getString("candidateId"));
        candidateName = orEmpty(doc.getString("candidateName"));
        candidateParty = orEmpty(doc.getString("candidateParty"));
        constituency = orEmpty(doc.getString("constituency"));
        district = orEmpty(doc.getString("district"));
        electionName = orEmpty(doc.getString("electionName"));
        candidatePhotoBase64 = doc.getString("candidatePhotoBase64");
        partySymbolBase64 = doc.getString("partySymbolBase64");
        Long v = doc.getLong("votes");
        votes = v != null ? v : 0;
    }

    public static Candidate fromDocument(DocumentSnapshot doc) {
        Candidate c = new Candidate(doc);
        return c.candidateName.isEmpty() ? null : c;
    }

    private static String orEmpty(String s) { return s != null ? s : ""; }

    public String getDocId() { return docId; }
    public String getCandidateId() { return candidateId; }
    public String getCandidateName() { return candidateName; }
    public String getCandidateParty() { return candidateParty; }
    public String getConstituency() { return constituency; }
    public String getDistrict() { return district; }
    public String getElectionName() { return electionName; }
    public String getCandidatePhotoBase64() { return candidatePhotoBase64; }
    public String getPartySymbolBase64() { return partySymbolBase64; }
    public long getVotes() { return votes; }
    public boolean isVoted() { return voted; }
    public void setVoted(boolean voted) { this.voted = voted; }
}
