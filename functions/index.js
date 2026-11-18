"use strict";

const crypto = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const { electionStatus, MAX_VOTES_PER_VOTER } = require("./src/electionWindow");
const { buildOtpEmail, sendBrevoEmail } = require("./src/email");

initializeApp();
const db = getFirestore();

// Keep in sync with FUNCTIONS_REGION in the Android app.
const REGION = "asia-south1";
setGlobalOptions({ region: REGION, maxInstances: 10 });

// Brevo transactional email. Set the key with: firebase functions:secrets:set BREVO_API_KEY
const BREVO_API_KEY = defineSecret("BREVO_API_KEY");
// Must be a verified sender in the Brevo account. Override in functions/.env if needed.
const EMAIL_SENDER = defineString("EMAIL_SENDER", { default: "synccertsolution@gmail.com" });
const EMAIL_SENDER_NAME = defineString("EMAIL_SENDER_NAME", { default: "Election App" });

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

// ---------- helpers ----------

function requireString(value, field, { min = 1, max = 128 } = {}) {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new HttpsError("invalid-argument", `${field} is invalid.`);
  }
  return trimmed;
}

/** Finds a voter by NIC; tries the exact value, then upper-case (old "...V" NICs). */
async function findVoterByNic(nic) {
  const candidates = [...new Set([nic, nic.toUpperCase()])];
  for (const value of candidates) {
    const snap = await db.collection("voters").where("nic", "==", value).limit(1).get();
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

function hashOtp(salt, otp) {
  return crypto.createHash("sha256").update(`${salt}:${otp}`).digest("hex");
}

function maskEmail(email) {
  const [user, domain] = email.split("@");
  if (!domain) return "your registered email";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"*".repeat(Math.max(3, user.length - visible.length))}@${domain}`;
}

function voterIdFromAuth(auth) {
  if (!auth || auth.token.role !== "voter" || !auth.uid.startsWith("voter_")) {
    throw new HttpsError("unauthenticated", "Please log in again.");
  }
  return auth.uid.slice("voter_".length);
}

// ---------- OTP login ----------

exports.requestOtp = onCall(
  { secrets: [BREVO_API_KEY] },
  async (request) => {
    const nic = requireString(request.data?.nic, "NIC", { min: 5, max: 20 });
    const voterDoc = await findVoterByNic(nic);
    if (!voterDoc) {
      throw new HttpsError("not-found", "This NIC is not registered.");
    }
    const email = voterDoc.get("email");
    if (typeof email !== "string" || !email.includes("@")) {
      throw new HttpsError("failed-precondition", "No email is associated with this NIC.");
    }

    const otpRef = db.collection("otps").doc(voterDoc.id);
    const existing = await otpRef.get();
    const lastSent = existing.exists ? existing.get("lastSentAt")?.toMillis() ?? 0 : 0;
    if (Date.now() - lastSent < OTP_RESEND_MS) {
      throw new HttpsError("resource-exhausted", "Please wait a minute before requesting another code.");
    }

    const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const salt = crypto.randomBytes(16).toString("hex");
    await otpRef.set({
      hash: hashOtp(salt, otp),
      salt,
      attempts: 0,
      expiresAt: Timestamp.fromMillis(Date.now() + OTP_TTL_MS),
      lastSentAt: FieldValue.serverTimestamp(),
    });

    // Local emulator: always print the code; only email it when EMULATOR_SEND_EMAIL=true
    // (fake voters have example.com addresses, which must not be emailed).
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      logger.info(`[EMULATOR] OTP for NIC ${voterDoc.get("nic")} (${email}): ${otp}`);
      if (process.env.EMULATOR_SEND_EMAIL !== "true") {
        return { maskedEmail: maskEmail(email), expiresInSeconds: OTP_TTL_MS / 1000 };
      }
    }

    try {
      const name = voterDoc.get("name") || "";
      const message = buildOtpEmail({ name, otp, minutes: OTP_TTL_MS / 60000 });
      const sent = await sendBrevoEmail({
        apiKey: BREVO_API_KEY.value(),
        sender: { email: EMAIL_SENDER.value(), name: EMAIL_SENDER_NAME.value() },
        to: { email, name },
        ...message,
      });
      logger.info("OTP email sent", { voterId: voterDoc.id, messageId: sent.messageId });
    } catch (err) {
      logger.error("Failed to send OTP email", { voterId: voterDoc.id, err: err.message });
      await otpRef.delete();
      throw new HttpsError("internal", "Could not send the verification email. Try again later.");
    }

    return { maskedEmail: maskEmail(email), expiresInSeconds: OTP_TTL_MS / 1000 };
  },
);

exports.verifyOtp = onCall(async (request) => {
  const nic = requireString(request.data?.nic, "NIC", { min: 5, max: 20 });
  const otp = requireString(request.data?.otp, "Code", { min: 6, max: 6 });
  if (!/^\d{6}$/.test(otp)) {
    throw new HttpsError("invalid-argument", "The code must be 6 digits.");
  }

  const voterDoc = await findVoterByNic(nic);
  if (!voterDoc) {
    throw new HttpsError("not-found", "This NIC is not registered.");
  }

  const otpRef = db.collection("otps").doc(voterDoc.id);
  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(otpRef);
    if (!snap.exists) return "missing";
    const data = snap.data();
    if (data.expiresAt.toMillis() < Date.now()) {
      tx.delete(otpRef);
      return "expired";
    }
    if (data.attempts >= OTP_MAX_ATTEMPTS) {
      tx.delete(otpRef);
      return "locked";
    }
    const expected = Buffer.from(data.hash, "hex");
    const actual = Buffer.from(hashOtp(data.salt, otp), "hex");
    if (!crypto.timingSafeEqual(expected, actual)) {
      tx.update(otpRef, { attempts: FieldValue.increment(1) });
      return "wrong";
    }
    tx.delete(otpRef);
    return "ok";
  });

  switch (outcome) {
    case "missing":
    case "expired":
      throw new HttpsError("failed-precondition", "The code has expired. Request a new one.");
    case "locked":
      throw new HttpsError("resource-exhausted", "Too many wrong attempts. Request a new code.");
    case "wrong":
      throw new HttpsError("permission-denied", "Incorrect code. Please try again.");
  }

  const token = await getAuth().createCustomToken(`voter_${voterDoc.id}`, { role: "voter" });
  return { token, voterId: voterDoc.id, name: voterDoc.get("name") ?? "" };
});

// ---------- voting ----------

exports.castVote = onCall(async (request) => {
  const voterId = voterIdFromAuth(request.auth);
  const electionId = requireString(request.data?.electionId, "electionId");
  const candidateDocId = requireString(request.data?.candidateId, "candidateId");

  const electionRef = db.collection("elections").doc(electionId);
  const candidateRef = db.collection("candidates").doc(candidateDocId);
  const voterRef = db.collection("voters").doc(voterId);
  const tallyRef = db.collection("voterVotes").doc(`${electionId}_${voterId}`);
  const ballotRef = db.collection("results").doc(`${electionId}_${voterId}_${candidateDocId}`);

  return db.runTransaction(async (tx) => {
    const [election, candidate, voter, tally, ballot] = await Promise.all(
      [electionRef, candidateRef, voterRef, tallyRef, ballotRef].map((ref) => tx.get(ref)),
    );

    if (!election.exists) throw new HttpsError("not-found", "Election not found.");
    if (!candidate.exists) throw new HttpsError("not-found", "Candidate not found.");
    if (!voter.exists) throw new HttpsError("permission-denied", "Voter is no longer registered.");

    const e = election.data();
    const status = electionStatus(e);
    if (status !== "open") {
      const msg = status === "upcoming" ? "Voting has not started yet." : "Voting for this election has closed.";
      throw new HttpsError("failed-precondition", msg);
    }

    const c = candidate.data();
    const v = voter.data();
    if (c.electionName !== e.name) {
      throw new HttpsError("invalid-argument", "Candidate is not part of this election.");
    }
    if (c.constituency !== v.constituency) {
      throw new HttpsError("permission-denied", "You can only vote for candidates in your constituency.");
    }
    if (ballot.exists) {
      throw new HttpsError("already-exists", `You have already voted for ${c.candidateName}.`);
    }

    const used = tally.exists ? tally.get("count") ?? 0 : 0;
    if (used >= MAX_VOTES_PER_VOTER) {
      throw new HttpsError("resource-exhausted", "You have used all your votes.");
    }

    tx.create(ballotRef, {
      electionId,
      electionName: e.name,
      electionDate: e.date,
      voterId,
      voterNIC: v.nic,
      candidateDocId,
      candidateId: c.candidateId ?? "",
      candidateName: c.candidateName ?? "",
      candidateParty: c.candidateParty ?? "",
      constituency: c.constituency ?? "",
      district: c.district ?? "",
      timestamp: FieldValue.serverTimestamp(),
    });
    tx.set(
      tallyRef,
      {
        electionId,
        voterId,
        count: used + 1,
        candidateDocIds: FieldValue.arrayUnion(candidateDocId),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.update(candidateRef, { votes: FieldValue.increment(1) });

    return {
      votesUsed: used + 1,
      votesRemaining: MAX_VOTES_PER_VOTER - (used + 1),
    };
  });
});
