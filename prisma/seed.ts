/* Seed TWEAK with showcase data: a living network of users, tracks, rooms and chatter. */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
  }),
});

const UPLOADS = path.join(process.cwd(), "public", "uploads");
mkdirSync(UPLOADS, { recursive: true });

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60 * 1000);
const hoursAgo = (h: number) => minsAgo(h * 60);
const daysAgo = (d: number) => hoursAgo(d * 24);

// ---------- audio synthesis: 16-bit mono WAV loops ----------
const SR = 22050;

function wavFile(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE((v * 32767) | 0, i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate an 8-bar loop: kick, hats, bassline. */
function makeLoop(bpm: number, seed: number, flavor: "acid" | "dub" | "rage"): Float32Array {
  const rand = mulberry(seed);
  const beat = (60 / bpm) * SR;
  const bars = 8;
  const len = Math.floor(beat * 4 * bars);
  const out = new Float32Array(len);

  const scale = [0, 3, 5, 7, 10, 12];
  const steps = Array.from({ length: 16 }, () => scale[(rand() * scale.length) | 0]);

  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const beatPos = i / beat;
    const inBeat = beatPos % 1;
    let v = 0;

    const kickT = inBeat * (60 / bpm);
    if (kickT < 0.12) {
      const pitch = 120 * Math.exp(-kickT * 22) + 45;
      v += Math.sin(2 * Math.PI * pitch * kickT) * Math.exp(-kickT * 18) * 0.9;
    }

    const hatPos = (beatPos + 0.5) % 1;
    const hatT = hatPos * (60 / bpm);
    if (hatT < 0.04) {
      v += (rand() * 2 - 1) * Math.exp(-hatT * 160) * (flavor === "rage" ? 0.4 : 0.25);
    }

    const stepIdx = Math.floor(beatPos * 4) % 16;
    const stepT = ((beatPos * 4) % 1) * (60 / bpm / 4);
    const note = steps[stepIdx];
    const freq = 55 * Math.pow(2, note / 12) * (flavor === "dub" ? 0.5 : 1);
    const env = Math.exp(-stepT * (flavor === "acid" ? 28 : 14));
    const phase = 2 * Math.PI * freq * t;
    const saw = 2 * ((phase / (2 * Math.PI)) % 1) - 1;
    const sq = Math.sign(Math.sin(phase));
    const osc = flavor === "rage" ? sq : saw;
    v += osc * env * 0.28;

    out[i] = Math.tanh(v * 1.2) * 0.85;
  }

  const fade = Math.floor(SR * 0.01);
  for (let i = 0; i < fade; i++) {
    out[i] *= i / fade;
    out[len - 1 - i] *= i / fade;
  }
  return out;
}

// ---------- artwork: generated SVG ----------
function artwork(title: string, hex: string, seed: number): string {
  const rand = mulberry(seed);
  let bars = "";
  for (let i = 0; i < 24; i++) {
    const h = 20 + rand() * 180;
    bars += `<rect x="${20 + i * 15}" y="${300 - h}" width="9" height="${h}" fill="${hex}" opacity="${0.25 + rand() * 0.75}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
<rect width="400" height="400" fill="#0f0f11"/>
<rect width="400" height="400" fill="url(#g)"/>
<defs><radialGradient id="g" cx="0.5" cy="0.1" r="1"><stop offset="0" stop-color="${hex}" stop-opacity="0.25"/><stop offset="1" stop-color="#0f0f11" stop-opacity="0"/></radialGradient></defs>
${bars}
<text x="20" y="350" font-family="monospace" font-size="20" fill="#edede8" letter-spacing="2">${title.toUpperCase().slice(0, 24)}</text>
<text x="20" y="375" font-family="monospace" font-size="11" fill="${hex}" letter-spacing="3">// TWEAK</text>
</svg>`;
}

const ACCENT_HEX: Record<string, string> = {
  hot: "#ff2400",
  acid: "#c8ff00",
  volt: "#4da6ff",
  strobe: "#ff4dc4",
  sodium: "#ffb224",
};

// ---------- seed data ----------
async function main() {
  console.log("seeding...");
  const pw = await bcrypt.hash("tweaktweak", 10);

  const USERS = [
    {
      username: "bsctv",
      displayName: "BSCTV",
      roles: "RADIO,COLLECTIVE",
      bio: "Shot from inside it. Phone-height footage only. No crew with a laminate.\nIf you were there, it belongs here.",
      location: "Austin, TX",
      genres: "rage,experimental",
      accentColor: "hot",
      profileBg: "static",
      statusLine: "if you were there, it belongs here",
      isVerified: true,
      instagram: "tweakmo.de",
    },
    {
      username: "noize_atx",
      displayName: "NOIZE",
      roles: "DJ,PRODUCER",
      bio: "303 worship. Sets every 1st and 3rd Saturday at Sip Haus.\nThe machines were never the problem.",
      location: "Austin, TX",
      genres: "acid,techno",
      accentColor: "acid",
      profileBg: "grid",
      statusLine: "the machines are talking",
      soundcloud: "noize-atx",
    },
    {
      username: "velvetcrypt",
      displayName: "Velvet Crypt",
      roles: "PRODUCER,ARTIST",
      bio: "Slow poison for fast rooms. Mastering engineer by daylight.",
      location: "Berlin",
      genres: "ebm,industrial",
      accentColor: "strobe",
      profileBg: "scanline",
      statusLine: "mastering at 4am again",
      bandcamp: "velvetcrypt",
    },
    {
      username: "subkultur",
      displayName: "SUBKULTUR",
      roles: "LABEL",
      bio: "Independent label. Demos: open fridays. Taste: not negotiable.\nSK-001 through SK-019 and counting.",
      location: "Detroit",
      genres: "techno,electro,dub",
      accentColor: "volt",
      profileBg: "haze",
      statusLine: "SK-019 out now",
      isVerified: true,
    },
    {
      username: "warehouse_mary",
      displayName: "Warehouse Mary",
      roles: "PROMOTER,VENUE",
      bio: "I find the rooms. You bring the noise. 18+. No cameras on the floor except ours.",
      location: "Austin, TX",
      genres: "techno,hardgroove",
      accentColor: "sodium",
      profileBg: "void",
      statusLine: "location drops 2 hours before",
    },
    {
      username: "lil_threshold",
      displayName: "lil threshold",
      roles: "ARTIST",
      bio: "clipping is a lifestyle. wav files or nothing.",
      location: "Houston",
      genres: "rage,footwork",
      accentColor: "hot",
      profileBg: "static",
      statusLine: "wav files or nothing",
    },
    {
      username: "ghostpattern",
      displayName: "ghost pattern",
      roles: "PRODUCER",
      bio: "Field recordings, broken sequencers, long walks. Everything here was recorded outside.",
      location: "Portland, OR",
      genres: "idm,ambient",
      accentColor: "volt",
      profileBg: "grid",
      statusLine: "recording rain again",
      bandcamp: "ghostpattern",
    },
    {
      username: "kazi887",
      displayName: "KAZI LATE NIGHT",
      roles: "RADIO",
      bio: "Late night frequencies, live from East Austin. Community radio since forever. 88.7fm.",
      location: "Austin, TX",
      genres: "experimental,dub,electro",
      accentColor: "sodium",
      profileBg: "void",
      statusLine: "on air thursdays 11pm",
      isVerified: true,
    },
    {
      username: "dj_milagro",
      displayName: "DJ Milagro",
      roles: "DJ",
      bio: "Three decks, no sync button, all love. Residencies in SA and ATX.",
      location: "San Antonio, TX",
      genres: "house,trance",
      accentColor: "strobe",
      profileBg: "haze",
      statusLine: "closing sets only",
      instagram: "dj.milagro",
    },
    {
      username: "eastside_amity",
      displayName: "EASTSIDE AMITY",
      roles: "COLLECTIVE,PROMOTER",
      bio: "Backyard systems, potluck energy. Bring a dish, leave with a family.\nEvery second Sunday.",
      location: "Austin, TX",
      genres: "electro,house,breaks",
      accentColor: "acid",
      profileBg: "grid",
      statusLine: "next function: second sunday",
    },
    {
      username: "tapewrm",
      displayName: "tapewrm",
      roles: "ARTIST,PRODUCER",
      bio: "160 and up. chopped tape, chewed samples. chicago to everywhere.",
      location: "Chicago",
      genres: "footwork,jungle",
      accentColor: "acid",
      profileBg: "static",
      statusLine: "160bpm forever",
      soundcloud: "tapewrm",
    },
    {
      username: "cold_closet",
      displayName: "COLD CLOSET",
      roles: "LABEL,COLLECTIVE",
      bio: "Montreal label for cold rooms. Body music for people who read.\nCC-001 → CC-004.",
      location: "Montréal",
      genres: "ebm,industrial",
      accentColor: "volt",
      profileBg: "scanline",
      statusLine: "CC-004 pressing now",
      bandcamp: "coldcloset",
    },
    {
      username: "yvonne_bleach",
      displayName: "Yvonne Bleach",
      roles: "DJ",
      bio: "Harder, colder, faster. Opening for no one.",
      location: "New York",
      genres: "ebm,gabber,industrial",
      accentColor: "strobe",
      profileBg: "static",
      statusLine: "180 or go home",
    },
    {
      username: "rot8",
      displayName: "ROT8",
      roles: "PRODUCER,DJ",
      bio: "Amen worship society, London chapter. Everything breaks eventually.",
      location: "London",
      genres: "dnb,jungle,breaks",
      accentColor: "acid",
      profileBg: "haze",
      statusLine: "rinsing dubs",
      soundcloud: "rot8",
    },
  ];

  const users: Record<string, { id: string }> = {};
  for (const u of USERS) {
    users[u.username] = await db.user.create({
      data: {
        ...u,
        email: `${u.username}@tweakmo.de`,
        passwordHash: pw,
        createdAt: daysAgo(30 + u.username.length),
      },
    });
  }

  // ---------- tracks ----------
  const TRACKS: Array<{
    user: string;
    title: string;
    genre: string;
    bpm: number;
    flavor: "acid" | "dub" | "rage";
    accent: string;
    desc?: string;
    age: number; // days ago
  }> = [
    { user: "noize_atx", title: "battery acid", genre: "acid", bpm: 138, flavor: "acid", accent: "acid", desc: "recorded live, one take, no undo", age: 1 },
    { user: "noize_atx", title: "sip haus opener", genre: "techno", bpm: 132, flavor: "acid", accent: "acid", desc: "the one that opens the night", age: 9 },
    { user: "velvetcrypt", title: "cold compress", genre: "ebm", bpm: 118, flavor: "dub", accent: "strobe", desc: "for the bruises", age: 2 },
    { user: "velvetcrypt", title: "mourning routine", genre: "industrial", bpm: 124, flavor: "rage", accent: "strobe", age: 14 },
    { user: "subkultur", title: "SK-019 A1 — tunnel logic", genre: "techno", bpm: 134, flavor: "acid", accent: "volt", desc: "A side. no skips.", age: 3 },
    { user: "subkultur", title: "SK-019 B2 — dub answer", genre: "dub", bpm: 120, flavor: "dub", accent: "volt", desc: "B side. the answer.", age: 3 },
    { user: "lil_threshold", title: "REDLINE!!", genre: "rage", bpm: 150, flavor: "rage", accent: "hot", desc: "volume check your neighbors first", age: 1 },
    { user: "bsctv", title: "room tone (live rip)", genre: "experimental", bpm: 128, flavor: "dub", accent: "hot", desc: "ripped from the floor, not colour corrected", age: 5 },
    { user: "ghostpattern", title: "driftnet", genre: "idm", bpm: 96, flavor: "dub", accent: "volt", desc: "recorded under the burnside bridge", age: 4 },
    { user: "ghostpattern", title: "low tide archive", genre: "ambient", bpm: 70, flavor: "dub", accent: "volt", desc: "forty minutes of coast, folded into four", age: 18 },
    { user: "dj_milagro", title: "milagro dub", genre: "house", bpm: 124, flavor: "dub", accent: "strobe", desc: "for the 4am faithful", age: 6 },
    { user: "dj_milagro", title: "ascension loop", genre: "trance", bpm: 140, flavor: "acid", accent: "strobe", age: 21 },
    { user: "tapewrm", title: "chewed tape", genre: "footwork", bpm: 160, flavor: "rage", accent: "acid", desc: "footwork for the dryer cycle", age: 2 },
    { user: "tapewrm", title: "splice life", genre: "jungle", bpm: 170, flavor: "rage", accent: "acid", age: 12 },
    { user: "cold_closet", title: "CC-004 — colder", genre: "ebm", bpm: 120, flavor: "dub", accent: "volt", desc: "pressing now. body music for people who read.", age: 7 },
    { user: "yvonne_bleach", title: "bleach point", genre: "gabber", bpm: 180, flavor: "rage", accent: "strobe", desc: "opening for no one", age: 4 },
    { user: "rot8", title: "rotation eight", genre: "dnb", bpm: 174, flavor: "rage", accent: "acid", desc: "amen worship society dub 008", age: 1 },
    { user: "rot8", title: "amen archive", genre: "breaks", bpm: 136, flavor: "acid", accent: "acid", age: 25 },
    { user: "eastside_amity", title: "amity house tape vol.1", genre: "electro", bpm: 130, flavor: "acid", accent: "acid", desc: "recorded in the backyard. dogs audible.", age: 10 },
  ];

  const trackIds: Record<string, string> = {};
  let seedN = 7;
  for (const t of TRACKS) {
    const slug = t.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const wavName = `seed-${slug}.wav`;
    const artName = `seed-${slug}.svg`;
    const samples = makeLoop(t.bpm, seedN * 1337, t.flavor);
    writeFileSync(path.join(UPLOADS, wavName), wavFile(samples));
    writeFileSync(path.join(UPLOADS, artName), artwork(t.title, ACCENT_HEX[t.accent], seedN * 99));
    const track = await db.track.create({
      data: {
        title: t.title,
        genre: t.genre,
        bpm: t.bpm,
        audioUrl: `/uploads/${wavName}`,
        artworkUrl: `/uploads/${artName}`,
        duration: Math.round(samples.length / SR),
        playCount: 90 + ((seedN * 467) % 4200),
        userId: users[t.user].id,
        description: t.desc ?? "",
        createdAt: daysAgo(t.age),
      },
    });
    trackIds[t.title] = track.id;
    seedN++;
  }

  // featured tracks
  const FEATURED: Array<[string, string]> = [
    ["noize_atx", "battery acid"],
    ["velvetcrypt", "cold compress"],
    ["subkultur", "SK-019 A1 — tunnel logic"],
    ["ghostpattern", "driftnet"],
    ["dj_milagro", "milagro dub"],
    ["tapewrm", "chewed tape"],
    ["cold_closet", "CC-004 — colder"],
    ["yvonne_bleach", "bleach point"],
    ["rot8", "rotation eight"],
    ["lil_threshold", "REDLINE!!"],
    ["bsctv", "room tone (live rip)"],
    ["eastside_amity", "amity house tape vol.1"],
  ];
  for (const [who, title] of FEATURED) {
    await db.user.update({
      where: { id: users[who].id },
      data: { featuredTrackId: trackIds[title] },
    });
  }

  // ---------- follows ----------
  const names = Object.keys(users);
  for (const a of names) {
    for (const b of names) {
      if (a !== b && (a.length * 7 + b.length * 3) % 4 !== 0) {
        await db.follow.create({
          data: {
            followerId: users[a].id,
            followeeId: users[b].id,
            createdAt: daysAgo(((a.length + b.length) % 20) + 1),
          },
        });
      }
    }
  }

  // top friends
  const TOP_FRIENDS: Array<[string, string[]]> = [
    ["bsctv", ["lil_threshold", "noize_atx", "kazi887", "warehouse_mary"]],
    ["noize_atx", ["bsctv", "warehouse_mary", "subkultur", "eastside_amity"]],
    ["dj_milagro", ["eastside_amity", "noize_atx", "kazi887"]],
    ["eastside_amity", ["dj_milagro", "bsctv", "tapewrm", "kazi887"]],
    ["velvetcrypt", ["cold_closet", "yvonne_bleach", "subkultur"]],
    ["tapewrm", ["rot8", "lil_threshold", "eastside_amity"]],
  ];
  for (const [who, friends] of TOP_FRIENDS) {
    await db.user.update({
      where: { id: users[who].id },
      data: { topFriends: friends.map((f) => users[f].id).join(",") },
    });
  }

  // ---------- rooms ----------
  const theRoom = await db.community.create({
    data: {
      slug: "the-room",
      name: "THE ROOM",
      description: "Everybody has a name in here. The original space.",
      rules: "1. No laminates.\n2. Post what you shot.\n3. Names, not clout.",
      ownerId: users.bsctv.id,
      createdAt: daysAgo(60),
      channels: {
        create: [
          { name: "general", position: 0 },
          { name: "footage", position: 1 },
          { name: "tracks", position: 2 },
        ],
      },
      members: {
        create: [
          { userId: users.bsctv.id, role: "OWNER" },
          { userId: users.noize_atx.id, role: "MOD" },
          { userId: users.kazi887.id, role: "MOD" },
          { userId: users.lil_threshold.id },
          { userId: users.warehouse_mary.id },
          { userId: users.velvetcrypt.id },
          { userId: users.dj_milagro.id },
          { userId: users.eastside_amity.id },
          { userId: users.tapewrm.id },
        ],
      },
    },
    include: { channels: true },
  });

  const acidWarehouse = await db.community.create({
    data: {
      slug: "acid-warehouse",
      name: "ACID WAREHOUSE",
      description: "303s, 909s, and the people who love them. Gear talk welcome.",
      rules: "No sync-button discourse. Post your patch notes.",
      ownerId: users.noize_atx.id,
      createdAt: daysAgo(45),
      channels: {
        create: [
          { name: "general", position: 0 },
          { name: "gear", position: 1 },
          { name: "wips", position: 2 },
        ],
      },
      members: {
        create: [
          { userId: users.noize_atx.id, role: "OWNER" },
          { userId: users.subkultur.id, role: "ADMIN" },
          { userId: users.velvetcrypt.id },
          { userId: users.rot8.id },
          { userId: users.dj_milagro.id },
          { userId: users.ghostpattern.id },
        ],
      },
    },
    include: { channels: true },
  });

  await db.community.create({
    data: {
      slug: "demo-inbox",
      name: "SUBKULTUR DEMO INBOX",
      description: "Private. Send your best two tracks. We listen to everything once.",
      isPrivate: true,
      ownerId: users.subkultur.id,
      createdAt: daysAgo(40),
      channels: { create: [{ name: "submissions", position: 0 }] },
      members: {
        create: [
          { userId: users.subkultur.id, role: "OWNER" },
          { userId: users.lil_threshold.id, status: "PENDING" },
          { userId: users.tapewrm.id, status: "PENDING" },
          { userId: users.velvetcrypt.id },
        ],
      },
    },
  });

  const amityHouse = await db.community.create({
    data: {
      slug: "amity-house",
      name: "EASTSIDE AMITY HOUSE",
      description: "Backyard systems, potluck energy. Every second Sunday. Bring a dish.",
      rules: "1. Bring a dish.\n2. Respect the neighbors until 10pm.\n3. After 10pm, respect the system.",
      ownerId: users.eastside_amity.id,
      createdAt: daysAgo(35),
      channels: {
        create: [
          { name: "general", position: 0 },
          { name: "events", position: 1 },
          { name: "potluck", position: 2 },
        ],
      },
      members: {
        create: [
          { userId: users.eastside_amity.id, role: "OWNER" },
          { userId: users.dj_milagro.id, role: "ADMIN" },
          { userId: users.bsctv.id },
          { userId: users.noize_atx.id },
          { userId: users.tapewrm.id },
          { userId: users.kazi887.id },
        ],
      },
    },
    include: { channels: true },
  });

  const lateNight = await db.community.create({
    data: {
      slug: "late-night-frequencies",
      name: "LATE NIGHT FREQUENCIES",
      description: "The KAZI 88.7fm after-hours room. Set trades, guest slots, airchecks.",
      ownerId: users.kazi887.id,
      createdAt: daysAgo(28),
      channels: {
        create: [
          { name: "general", position: 0 },
          { name: "schedule", position: 1 },
          { name: "airchecks", position: 2 },
        ],
      },
      members: {
        create: [
          { userId: users.kazi887.id, role: "OWNER" },
          { userId: users.bsctv.id, role: "ADMIN" },
          { userId: users.ghostpattern.id },
          { userId: users.dj_milagro.id },
          { userId: users.yvonne_bleach.id },
        ],
      },
    },
    include: { channels: true },
  });

  const waxOnly = await db.community.create({
    data: {
      slug: "wax-only",
      name: "WAX ONLY",
      description: "Vinyl finds, represses, pressing-plant gossip. Digital files tolerated, barely.",
      ownerId: users.cold_closet.id,
      createdAt: daysAgo(20),
      channels: {
        create: [
          { name: "general", position: 0 },
          { name: "finds", position: 1 },
        ],
      },
      members: {
        create: [
          { userId: users.cold_closet.id, role: "OWNER" },
          { userId: users.subkultur.id },
          { userId: users.velvetcrypt.id },
          { userId: users.rot8.id },
          { userId: users.yvonne_bleach.id },
        ],
      },
    },
    include: { channels: true },
  });

  // ---------- messages ----------
  type Msg = [string, string, number]; // user, body, minutes ago
  const chan = (room: { channels: { id: string; name: string }[] }, name: string) =>
    room.channels.find((c) => c.name === name)!.id;

  const CHATS: Array<[string, Msg[]]> = [
    [
      chan(theRoom, "general"),
      [
        ["bsctv", "doors tonight at sip haus. 10pm. you know the schedule.", 540],
        ["noize_atx", "bringing the 303. fresh acid only", 530],
        ["warehouse_mary", "location for saturday drops 2 hours before. watch this channel", 500],
        ["lil_threshold", "pulled up last time and it was CRAZY. footage going in #footage", 460],
        ["velvetcrypt", "someone pick me up from the airport thursday and i'll play a free set", 420],
        ["bsctv", "@velvetcrypt deal. bring the cold compress remix", 415],
        ["dj_milagro", "driving up from SA with the good speakers. save me a slot", 300],
        ["kazi887", "thursday's show is a TWEAK special. send me your rips by wednesday", 240],
        ["eastside_amity", "second sunday is ON. potluck thread in our room", 180],
        ["tapewrm", "chicago says hi. landing friday, who's got a floor", 90],
        ["bsctv", "@tapewrm the room has a couch with your name on it", 85],
        ["noize_atx", "sound check — the new TWEAK app is alive", 20],
      ],
    ],
    [
      chan(theRoom, "footage"),
      [
        ["lil_threshold", "uploaded 40 minutes from saturday. phone died at the best part obviously", 400],
        ["bsctv", "the part where the rail broke is staying in. that's the whole point", 390],
        ["kazi887", "audio from the board synced to lil T's clip. it SLAPS", 350],
      ],
    ],
    [
      chan(theRoom, "tracks"),
      [
        ["noize_atx", "battery acid is up. volume check your neighbors first", 1400],
        ["lil_threshold", "REDLINE!! out. everywhere that matters (here)", 1380],
        ["bsctv", "both going on thursday's show", 1300],
      ],
    ],
    [
      chan(acidWarehouse, "general"),
      [
        ["noize_atx", "warehouse rules: no sync button discourse, post your patch notes", 2000],
        ["rot8", "london checking in. amen archive stems going in #wips", 1500],
        ["subkultur", "demo fridays are open again. two tracks max, best first", 900],
        ["ghostpattern", "anyone want 3 hours of rain recorded through a guitar amp? asking for me", 600],
        ["velvetcrypt", "@ghostpattern yes. all of it. send everything", 580],
      ],
    ],
    [
      chan(acidWarehouse, "gear"),
      [
        ["noize_atx", "the 303's tuning knob is lying to me again. character, i guess", 800],
        ["dj_milagro", "three decks no sync. the third one is for courage", 700],
        ["rot8", "found an MPC60 at a boot sale for £40. the pads still have someone's swing in them", 300],
      ],
    ],
    [
      chan(amityHouse, "general"),
      [
        ["eastside_amity", "SECOND SUNDAY IS CONFIRMED. backyard opens 4pm", 1100],
        ["dj_milagro", "i'm on closing duty. bringing the good speakers", 1000],
        ["kazi887", "broadcasting the first hour live. neighbors are warned", 950],
        ["bsctv", "we'll be there phone-height as always", 900],
      ],
    ],
    [
      chan(amityHouse, "potluck"),
      [
        ["eastside_amity", "dish signup: we have 4 tamale commitments and zero drinks. fix this", 800],
        ["tapewrm", "flying in with chicago mix. the cd AND the salsa", 700],
        ["noize_atx", "bringing agua fresca and a subwoofer", 650],
      ],
    ],
    [
      chan(lateNight, "general"),
      [
        ["kazi887", "thursday 11pm: TWEAK special. all local, all unreleased", 1200],
        ["ghostpattern", "sending the driftnet extended mix. 22 minutes, no apologies", 1100],
        ["yvonne_bleach", "if you want 180bpm at 1am i'm available. the city needs it", 1000],
        ["kazi887", "@yvonne_bleach booked. 1am slot is yours", 990],
      ],
    ],
    [
      chan(lateNight, "schedule"),
      [
        ["kazi887", "NOV: 6th — TWEAK special / 13th — yvonne takeover / 20th — amity house live / 27th — open decks", 950],
      ],
    ],
    [
      chan(waxOnly, "general"),
      [
        ["cold_closet", "CC-004 test pressings arrived. two warps out of ten. pressing plant apologized in french", 1400],
        ["subkultur", "SK-019 repress confirmed. 300 only, no second repress, stop DMing me", 1200],
        ["velvetcrypt", "mastered for vinyl means something. loudness war deserters welcome", 1000],
      ],
    ],
    [
      chan(waxOnly, "finds"),
      [
        ["rot8", "found a white label at the boot sale. no idea what it is. best £2 ever spent", 800],
        ["yvonne_bleach", "basement of a church sale: 40 belgian new beat 12s. the lord provides", 500],
      ],
    ],
  ];

  for (const [channelId, msgs] of CHATS) {
    for (const [who, body, mins] of msgs) {
      await db.message.create({
        data: { body, channelId, userId: users[who].id, createdAt: minsAgo(mins) },
      });
    }
  }

  // ---------- posts ----------
  type P = [string, string, string | null, number]; // user, body, trackTitle, hours ago
  const POSTS: P[] = [
    ["bsctv", "when rage becomes the norm, TWEAK becomes the next thing.", null, 200],
    ["subkultur", "SK-019 is out. two sides, no skips. demo inbox opens friday.", "SK-019 A1 — tunnel logic", 76],
    ["ghostpattern", "spent the week recording rain through a broken amp. this is the listenable part.", "driftnet", 70],
    ["dj_milagro", "4am closing set energy, bottled. for the faithful.", "milagro dub", 64],
    ["warehouse_mary", "saturday. 18+. live on KAZI 88.7fm. location drops 2 hours before. you already know the rest.", null, 52],
    ["yvonne_bleach", "they asked for a warm-up set. i don't know her.", "bleach point", 47],
    ["cold_closet", "CC-004 test pressings are in. body music for people who read. pre-orders friday.", "CC-004 — colder", 42],
    ["tapewrm", "chicago → austin friday. bringing the chewed tape and the salsa.", "chewed tape", 38],
    ["eastside_amity", "SECOND SUNDAY CONFIRMED. backyard opens 4pm. bring a dish, leave with a family.", null, 30],
    ["kazi887", "thursday 11pm: TWEAK special on 88.7fm. all local, all unreleased. tape your radios.", null, 26],
    ["rot8", "amen worship society dub 008. everything breaks eventually.", "rotation eight", 22],
    ["velvetcrypt", "berlin was cold. the set was colder. rip below.", "cold compress", 18],
    ["lil_threshold", "REDLINE!! out everywhere that matters (here)", "REDLINE!!", 14],
    ["noize_atx", "dropped a new one. volume check your neighbors first.", "battery acid", 10],
    ["bsctv", "open uploads are open. if you were there, it belongs here.", null, 8],
    ["dj_milagro", "three decks, no sync button, all love. SA to ATX this weekend.", null, 6],
    ["ghostpattern", "the low tide archive is forty minutes of coast folded into four. headphones mandatory.", "low tide archive", 5],
    ["warehouse_mary", "sound system passed inspection. the floor did not. we move anyway.", null, 4],
    ["tapewrm", "splice life repress when", "splice life", 3],
    ["bsctv", "thursday: KAZI special. saturday: the floor. sunday: church (amity house).", null, 2],
    ["noize_atx", "the 303 is lying to me again and honestly the lies sound better", null, 1],
  ];

  const postIds: string[] = [];
  for (const [who, body, trackTitle, hrs] of POSTS) {
    const p = await db.post.create({
      data: {
        body,
        userId: users[who].id,
        trackId: trackTitle ? trackIds[trackTitle] : null,
        createdAt: hoursAgo(hrs),
      },
    });
    postIds.push(p.id);
  }

  // ---------- likes / reposts / comments ----------
  for (let i = 0; i < postIds.length; i++) {
    for (const name of names) {
      if ((i * 3 + name.length) % 3 !== 0) {
        await db.like
          .create({ data: { userId: users[name].id, postId: postIds[i] } })
          .catch(() => {});
      }
    }
  }
  const REPOSTS: Array<[string, string | null, number | null]> = [
    ["bsctv", "REDLINE!!", null],
    ["noize_atx", null, 1],
    ["kazi887", "driftnet", null],
    ["dj_milagro", "amity house tape vol.1", null],
    ["yvonne_bleach", "CC-004 — colder", null],
    ["tapewrm", "rotation eight", null],
    ["eastside_amity", null, 9],
    ["velvetcrypt", "bleach point", null],
  ];
  for (const [who, trackTitle, postIdx] of REPOSTS) {
    await db.repost
      .create({
        data: {
          userId: users[who].id,
          trackId: trackTitle ? trackIds[trackTitle] : null,
          postId: postIdx !== null ? postIds[postIdx] : null,
        },
      })
      .catch(() => {});
  }
  for (const title of Object.keys(trackIds)) {
    for (const name of names) {
      if ((title.length * 5 + name.length * 2) % 3 === 0) {
        await db.like
          .create({ data: { userId: users[name].id, trackId: trackIds[title] } })
          .catch(() => {});
      }
    }
  }
  const COMMENTS: Array<[string, string, string]> = [
    ["kazi887", "battery acid", "playing this thursday. the neighbors can file complaints with the FCC"],
    ["bsctv", "REDLINE!!", "the clip IS the mix"],
    ["velvetcrypt", "CC-004 — colder", "mastered this one. the quiet parts are load-bearing"],
    ["rot8", "chewed tape", "chicago keeps winning"],
    ["dj_milagro", "SK-019 A1 — tunnel logic", "closed with this saturday. the room understood"],
  ];
  for (const [who, trackTitle, body] of COMMENTS) {
    await db.comment.create({
      data: { body, userId: users[who].id, trackId: trackIds[trackTitle] },
    });
  }

  // ---------- streams ----------
  await db.stream.create({
    data: {
      title: "SIP HAUS // night 47 — live from the floor",
      isLive: true,
      startedAt: minsAgo(42),
      viewerPeak: 212,
      userId: users.bsctv.id,
    },
  });
  await db.stream.create({
    data: {
      title: "LATE NIGHT FREQUENCIES — aircheck w/ ghost pattern",
      isLive: true,
      startedAt: minsAgo(118),
      viewerPeak: 88,
      userId: users.kazi887.id,
    },
  });
  await db.stream.create({
    data: {
      title: "closing set rehearsal (chaotic)",
      isLive: false,
      startedAt: daysAgo(2),
      viewerPeak: 54,
      userId: users.dj_milagro.id,
    },
  });

  console.log(`seeded: ${names.length} users, ${Object.keys(trackIds).length} tracks, 6 rooms.`);
  console.log("demo login: noize_atx / tweaktweak (all users share the password)");
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
