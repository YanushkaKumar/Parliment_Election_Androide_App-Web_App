"use strict";
/**
 * Seeds the LOCAL Firebase emulators with fake data for manual testing.
 * Refuses to run unless both emulator host variables are set, so it can never touch production.
 *
 *   firebase emulators:start           # in one terminal
 *   cd functions && npm run seed       # in another
 */
const zlib = require("node:zlib");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("Refusing to seed: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must be set.");
  process.exit(1);
}

const PROJECT_ID = process.env.GCLOUD_PROJECT || "electionnew-app";
initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

// ---------- tiny PNG generator (no dependencies) ----------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
/** pixel(x, y) -> [r, g, b] */
function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const file = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${file.toString("base64")}`;
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Simple "avatar": head + shoulders silhouette on a coloured background. */
function avatar(bg) {
  const B = hex(bg), F = [245, 245, 245], S = 96;
  return png(S, (x, y) => {
    const head = (x - 48) ** 2 + (y - 38) ** 2 < 18 ** 2;
    const body = (x - 48) ** 2 / 34 ** 2 + (y - 100) ** 2 / 38 ** 2 < 1;
    return head || body ? F : B;
  });
}
/** Party symbol: a coloured shape on white. */
function symbol(shape, color) {
  const C = hex(color), W = [255, 255, 255], S = 64;
  return png(S, (x, y) => {
    const dx = x - 32, dy = y - 32;
    let inside = false;
    if (shape === "circle") inside = dx * dx + dy * dy < 24 ** 2;
    if (shape === "square") inside = Math.abs(dx) < 20 && Math.abs(dy) < 20;
    if (shape === "triangle") inside = y > 10 && y < 54 && Math.abs(dx) < (y - 10) / 2;
    if (shape === "diamond") inside = Math.abs(dx) + Math.abs(dy) < 24;
    if (shape === "star") inside = (Math.abs(dx) < 6 && Math.abs(dy) < 24) || (Math.abs(dy) < 6 && Math.abs(dx) < 24) || Math.abs(dx) + Math.abs(dy) < 14;
    return inside ? C : W;
  });
}

// ---------- fake data ----------
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date());

const PARTIES = {
  "Green Unity Party": symbol("circle", "#2e7d32"),
  "Blue Progress Alliance": symbol("square", "#1565c0"),
  "Red Workers Front": symbol("triangle", "#c62828"),
  "Golden People's Party": symbol("star", "#f9a825"),
  "Independent": symbol("diamond", "#6a1b9a"),
};

const ELECTIONS = {
  open: { id: "parliament2026", name: "Parliamentary Election 2026", date: today, startTime: "00:00", endTime: "23:59" },
  closed: { id: "provincial2025", name: "Provincial Council Election 2025", date: "2025-06-15", startTime: "09:00", endTime: "16:00" },
  upcoming: { id: "localgov2027", name: "Local Government Election 2027", date: "2027-02-10", startTime: "08:00", endTime: "17:00" },
};

const VOTERS = [
  ["voterAmal", "199012345678", "Amal Perera", "amal.perera@example.com", "12 Galle Road, Colombo 03", "Colombo", "Colombo North"],
  ["voterNimali", "856789012V", "Nimali Fernando", "nimali.f@example.com", "45 Temple Street, Colombo 13", "Colombo", "Colombo North"],
  ["voterKasun", "199834567890", "Kasun Silva", "kasun.silva@example.com", "7 Lake View, Colombo 15", "Colombo", "Colombo North"],
  ["voterDilani", "927654321V", "Dilani Jayawardena", "dilani.j@example.com", "88 Peradeniya Road, Kandy", "Kandy", "Kandy Central"],
  ["voterRuwan", "200145678901", "Ruwan Bandara", "ruwan.b@example.com", "3 Hill Street, Kandy", "Kandy", "Kandy Central"],
  ["voterSanduni", "199556781234", "Sanduni Wickramasinghe", "sanduni.w@example.com", "21 Fort Road, Galle", "Galle", "Galle Town"],
];

const COLORS = ["#5c6bc0", "#26a69a", "#ef5350", "#ab47bc", "#ffa726", "#8d6e63", "#42a5f5", "#66bb6a", "#ec407a", "#78909c"];
let colorIdx = 0;
const cand = (docId, candidateId, name, party, district, constituency, election) => ({
  docId,
  data: {
    candidateId, candidateName: name, candidateParty: party, district, constituency,
    electionName: election.name, votes: 0,
    candidatePhotoBase64: avatar(COLORS[colorIdx++ % COLORS.length]),
    partySymbolBase64: PARTIES[party],
  },
});

const CANDIDATES = [
  // Open election
  cand("pe_cn_1", "PE-CN-01", "Sunil Rathnayake", "Green Unity Party", "Colombo", "Colombo North", ELECTIONS.open),
  cand("pe_cn_2", "PE-CN-02", "Chamari Gunasekara", "Blue Progress Alliance", "Colombo", "Colombo North", ELECTIONS.open),
  cand("pe_cn_3", "PE-CN-03", "Mahesh de Alwis", "Red Workers Front", "Colombo", "Colombo North", ELECTIONS.open),
  cand("pe_cn_4", "PE-CN-04", "Priyanka Senanayake", "Golden People's Party", "Colombo", "Colombo North", ELECTIONS.open),
  cand("pe_cn_5", "PE-CN-05", "Tharindu Abeywickrama", "Independent", "Colombo", "Colombo North", ELECTIONS.open),
  cand("pe_kc_1", "PE-KC-01", "Lalith Dissanayake", "Green Unity Party", "Kandy", "Kandy Central", ELECTIONS.open),
  cand("pe_kc_2", "PE-KC-02", "Ishara Herath", "Blue Progress Alliance", "Kandy", "Kandy Central", ELECTIONS.open),
  cand("pe_kc_3", "PE-KC-03", "Gayan Wijesinghe", "Red Workers Front", "Kandy", "Kandy Central", ELECTIONS.open),
  cand("pe_gt_1", "PE-GT-01", "Ranjith Karunaratne", "Golden People's Party", "Galle", "Galle Town", ELECTIONS.open),
  cand("pe_gt_2", "PE-GT-02", "Malini Weerasinghe", "Blue Progress Alliance", "Galle", "Galle Town", ELECTIONS.open),
  // Closed election (has historical ballots)
  cand("pc_cn_1", "PC-CN-01", "Ajith Kumara", "Green Unity Party", "Colombo", "Colombo North", ELECTIONS.closed),
  cand("pc_cn_2", "PC-CN-02", "Shanika Madushani", "Blue Progress Alliance", "Colombo", "Colombo North", ELECTIONS.closed),
  cand("pc_cn_3", "PC-CN-03", "Ravi Jayasuriya", "Red Workers Front", "Colombo", "Colombo North", ELECTIONS.closed),
  cand("pc_kc_1", "PC-KC-01", "Nadeesha Rajapaksha", "Golden People's Party", "Kandy", "Kandy Central", ELECTIONS.closed),
  cand("pc_kc_2", "PC-KC-02", "Kamal Ekanayake", "Independent", "Kandy", "Kandy Central", ELECTIONS.closed),
  // Upcoming election
  cand("lg_cn_1", "LG-CN-01", "Thilini Samarasinghe", "Green Unity Party", "Colombo", "Colombo North", ELECTIONS.upcoming),
  cand("lg_cn_2", "LG-CN-02", "Dinesh Pathirana", "Red Workers Front", "Colombo", "Colombo North", ELECTIONS.upcoming),
];

// Historical ballots for the closed election: voterDocId -> candidate docIds
const PAST_BALLOTS = {
  voterAmal: ["pc_cn_1", "pc_cn_2", "pc_cn_3"],
  voterNimali: ["pc_cn_1", "pc_cn_3"],
  voterKasun: ["pc_cn_1"],
  voterDilani: ["pc_kc_1", "pc_kc_2"],
  voterRuwan: ["pc_kc_1"],
};

const ADMIN = { email: "admin@example.com", password: "Admin@123" };

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

async function main() {
  for (const c of ["elections", "candidates", "voters", "results", "voterVotes", "otps", "admins"]) {
    await clearCollection(c);
  }

  // Admin account
  const auth = getAuth();
  let adminUser;
  try {
    adminUser = await auth.getUserByEmail(ADMIN.email);
    await auth.updateUser(adminUser.uid, { password: ADMIN.password });
  } catch {
    adminUser = await auth.createUser({ email: ADMIN.email, password: ADMIN.password, displayName: "Test Admin" });
  }
  await db.doc(`admins/${adminUser.uid}`).set({ email: ADMIN.email });

  for (const e of Object.values(ELECTIONS)) {
    const { id, ...data } = e;
    await db.doc(`elections/${id}`).set(data);
  }
  for (const [id, nic, name, email, address, district, constituency] of VOTERS) {
    await db.doc(`voters/${id}`).set({ nic, name, email, address, district, constituency });
  }

  const counts = {};
  const byId = Object.fromEntries(CANDIDATES.map((c) => [c.docId, c.data]));
  const voters = Object.fromEntries(VOTERS.map((v) => [v[0], v]));
  const closed = ELECTIONS.closed;
  for (const [voterId, candIds] of Object.entries(PAST_BALLOTS)) {
    for (const [i, cid] of candIds.entries()) {
      const c = byId[cid];
      counts[cid] = (counts[cid] || 0) + 1;
      await db.doc(`results/${closed.id}_${voterId}_${cid}`).set({
        electionId: closed.id, electionName: closed.name, electionDate: closed.date,
        voterId, voterNIC: voters[voterId][1], candidateDocId: cid,
        candidateId: c.candidateId, candidateName: c.candidateName, candidateParty: c.candidateParty,
        constituency: c.constituency, district: c.district,
        timestamp: Timestamp.fromDate(new Date(`${closed.date}T0${4 + i}:30:00Z`)),
      });
    }
    await db.doc(`voterVotes/${closed.id}_${voterId}`).set({
      electionId: closed.id, voterId, count: candIds.length, candidateDocIds: candIds,
    });
  }
  for (const c of CANDIDATES) {
    await db.doc(`candidates/${c.docId}`).set({ ...c.data, votes: counts[c.docId] || 0 });
  }

  console.log(`Seeded project "${PROJECT_ID}" (emulators):`);
  console.log(`  Admin login:  ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  Elections:    ${Object.values(ELECTIONS).map((e) => `${e.name} [${e.date}]`).join(", ")}`);
  console.log("  Voters (NIC → constituency):");
  for (const v of VOTERS) console.log(`    ${v[1].padEnd(13)} ${v[2].padEnd(24)} ${v[6]}`);
  console.log("  OTP codes are printed in the emulator log (look for [EMULATOR] OTP).");
}

main().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
