export type Election = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (Asia/Colombo)
  endTime: string;
};

export type Candidate = {
  id: string; // Firestore document id
  candidateId: string;
  candidateName: string;
  candidateParty: string;
  district: string;
  constituency: string;
  electionName: string;
  candidatePhotoBase64?: string;
  partySymbolBase64?: string;
  votes: number;
};

export type Voter = {
  id: string;
  nic: string;
  name: string;
  email: string;
  district: string;
  constituency: string;
};

export type VoterTally = { count: number; candidateDocIds: string[] };
