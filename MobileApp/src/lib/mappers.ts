import type { DocumentData } from "firebase/firestore";
import { DEFAULT_END, DEFAULT_START } from "./electionTime";
import type { Candidate, Election, Voter, VoterTally } from "./types";

const s = (v: unknown) => (typeof v === "string" ? v : "");

export const toElection = (id: string, d: DocumentData): Election | null =>
  d.name && d.date
    ? { id, name: d.name, date: d.date, startTime: d.startTime || DEFAULT_START, endTime: d.endTime || DEFAULT_END }
    : null;

export const toCandidate = (id: string, d: DocumentData): Candidate | null =>
  d.candidateName
    ? {
        id,
        candidateId: s(d.candidateId),
        candidateName: s(d.candidateName),
        candidateParty: s(d.candidateParty),
        district: s(d.district),
        constituency: s(d.constituency),
        electionName: s(d.electionName),
        candidatePhotoBase64: d.candidatePhotoBase64 || undefined,
        partySymbolBase64: d.partySymbolBase64 || undefined,
        votes: typeof d.votes === "number" ? d.votes : 0,
      }
    : null;

export const toVoter = (id: string, d: DocumentData): Voter => ({
  id, nic: s(d.nic), name: s(d.name), email: s(d.email), district: s(d.district), constituency: s(d.constituency),
});

export const toTally = (_: string, d: DocumentData): VoterTally => ({
  count: typeof d.count === "number" ? d.count : 0,
  candidateDocIds: Array.isArray(d.candidateDocIds) ? d.candidateDocIds : [],
});

/** RN <Image> needs a data URI; the admin app stores data URLs, older data may be bare base64. */
export const imageUri = (b64?: string) =>
  !b64 ? undefined : b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
