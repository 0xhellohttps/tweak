/* Seed TWEAK with demo data: users, synthesized audio loops, artwork, rooms, posts. */
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

// ---------- audio synthesis: 16-bit mono WAV techno loops ----------
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

/** Generate an 8-bar loop: kick, hats, acid bassline. */
function makeLoop(bpm: number, seed: number, flavor: "acid" | "dub" | "rage"): Float32Array {
  const rand = mulberry(seed);
  const beat = (60 / bpm) * SR; // samples per beat
  const bars = 8;
  const len = Math.floor(beat * 4 * bars);
  const out = new Float32Array(len);

  // acid note sequence (semitones from root 55Hz)
  const scale = [0, 3, 5, 7, 10, 12];
  const steps = Array.from({ length: 16 }, () => scale[(rand() * scale.length) | 0]);

  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const beatPos = i / beat; // position in beats
    const inBeat = beatPos % 1;
    let v = 0;

    // kick: every beat, pitch-dropping sine
    const kickT = inBeat * (60 / bpm);
    if (kickT < 0.12) {
      const pitch = 120 * Math.exp(-kickT * 22) + 45;
      v += Math.sin(2 * Math.PI * pitch * kickT) * Math.exp(-kickT * 18) * 0.9;
    }

    // hats: offbeat noise bursts
    const hatPos = (beatPos + 0.5) % 1;
    const hatT = hatPos * (60 / bpm);
    if (hatT < 0.04) {
      v += (rand() * 2 - 1) * Math.exp(-hatT * 160) * (flavor === "rage" ? 0.4 : 0.25);
    }

    // 16th-note acid line
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

    // gentle master clip
    out[i] = Math.tanh(v * 1.2) * 0.85;
  }

  // fade edges to loop cleanly
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

// ---------- seed data ----------
async function main() {
  console.log("seeding...");
  const pw = await bcrypt.hash("tweaktweak", 10);

  const USERS = [
    {
      username: "bsctv",
      displayName: "BSCTV",
      roles: "RADIO,COLLECTIVE",
      bio: "Shot from inside it. Phone-height footage only. No crew with a laminate.\nAustin, TX.",
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
      bio: "303 worship. Sets every 1st and 3rd Saturday.",
      location: "Austin, TX",
      genres: "acid,techno",
      accentColor: "acid",
      profileBg: "grid",
      statusLine: "the machines are talking",
    },
    {
      username: "velvetcrypt",
      displayName: "Velvet Crypt",
      roles: "PRODUCER,ARTIST",
      bio: "Slow poison for fast rooms.",
      location: "Berlin",
      genres: "ebm,industrial",
      accentColor: "strobe",
      profileBg: "scanline",
      statusLine: "mastering at 4am again",
    },
    {
      username: "subkultur",
      displayName: "SUBKULTUR",
      roles: "LABEL",
      bio: "Independent label. Demos: open. Taste: not negotiable.",
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
      bio: "I find the rooms. You bring the noise. 18+.",
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
      bio: "clipping is a lifestyle",
      location: "Houston",
      genres: "rage,footwork",
      accentColor: "hot",
      profileBg: "static",
      statusLine: "wav files or nothing",
    },
  ];

  const users: Record<string, { id: string }> = {};
  for (const u of USERS) {
    users[u.username] = await db.user.create({
      data: { ...u, email: `${u.username}@tweakmo.de`, passwordHash: pw },
    });
  }

  // tracks with synthesized audio
  const ACCENT_HEX: Record<string, string> = {
    hot: "#ff2400",
    acid: "#c8ff00",
    volt: "#4da6ff",
    strobe: "#ff4dc4",
    sodium: "#ffb224",
  };

  const TRACKS: Array<{
    user: string;
    title: string;
    genre: string;
    bpm: number;
    flavor: "acid" | "dub" | "rage";
    accent: string;
  }> = [
    { user: "noize_atx", title: "battery acid", genre: "acid", bpm: 138, flavor: "acid", accent: "acid" },
    { user: "noize_atx", title: "sip haus opener", genre: "techno", bpm: 132, flavor: "acid", accent: "acid" },
    { user: "velvetcrypt", title: "cold compress", genre: "ebm", bpm: 118, flavor: "dub", accent: "strobe" },
    { user: "velvetcrypt", title: "mourning routine", genre: "industrial", bpm: 124, flavor: "rage", accent: "strobe" },
    { user: "subkultur", title: "SK-019 A1 — tunnel logic", genre: "techno", bpm: 134, flavor: "acid", accent: "volt" },
    { user: "subkultur", title: "SK-019 B2 — dub answer", genre: "dub", bpm: 120, flavor: "dub", accent: "volt" },
    { user: "lil_threshold", title: "REDLINE!!", genre: "rage", bpm: 150, flavor: "rage", accent: "hot" },
    { user: "bsctv", title: "room tone (live rip)", genre: "experimental", bpm: 128, flavor: "dub", accent: "hot" },
  ];

  const trackIds: Record<string, string> = {};
  let seedN = 7;
  for (const t of TRACKS) {
    const slug = t.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const wavName = `seed-${slug}.wav`;
    const artName = `seed-${slug}.svg`;
    const samples = makeLoop(t.bpm, seedN * 1337, t.flavor);
    writeFileSync(path.join(UPLOADS, wavName), wavFile(samples));
    writeFileSync(
      path.join(UPLOADS, artName),
      artwork(t.title, ACCENT_HEX[t.accent], seedN * 99)
    );
    const track = await db.track.create({
      data: {
        title: t.title,
        genre: t.genre,
        bpm: t.bpm,
        audioUrl: `/uploads/${wavName}`,
        artworkUrl: `/uploads/${artName}`,
        duration: Math.round(samples.length / SR),
        playCount: 50 + ((seedN * 467) % 1900),
        userId: users[t.user].id,
        description: "seeded demo loop — synthesized in-house",
      },
    });
    trackIds[t.title] = track.id;
    seedN++;
  }

  // featured tracks
  await db.user.update({
    where: { id: users.noize_atx.id },
    data: { featuredTrackId: trackIds["battery acid"] },
  });
  await db.user.update({
    where: { id: users.velvetcrypt.id },
    data: { featuredTrackId: trackIds["cold compress"] },
  });
  await db.user.update({
    where: { id: users.subkultur.id },
    data: { featuredTrackId: trackIds["SK-019 A1 — tunnel logic"] },
  });

  // follows
  const names = Object.keys(users);
  for (const a of names) {
    for (const b of names) {
      if (a !== b && (a.length + b.length) % 3 !== 0) {
        await db.follow.create({
          data: { followerId: users[a].id, followeeId: users[b].id },
        });
      }
    }
  }

  // top friends
  await db.user.update({
    where: { id: users.noize_atx.id },
    data: {
      topFriends: [users.bsctv.id, users.warehouse_mary.id, users.subkultur.id].join(","),
    },
  });
  await db.user.update({
    where: { id: users.bsctv.id },
    data: {
      topFriends: [users.lil_threshold.id, users.noize_atx.id, users.velvetcrypt.id].join(","),
    },
  });

  // rooms
  const theRoom = await db.community.create({
    data: {
      slug: "the-room",
      name: "THE ROOM",
      description: "Everybody has a name in here. The original space.",
      rules: "1. No laminates.\n2. Post what you shot.\n3. Names, not clout.",
      ownerId: users.bsctv.id,
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
          { userId: users.lil_threshold.id },
          { userId: users.warehouse_mary.id },
          { userId: users.velvetcrypt.id },
        ],
      },
    },
    include: { channels: true },
  });

  await db.community.create({
    data: {
      slug: "acid-warehouse",
      name: "ACID WAREHOUSE",
      description: "303s, 909s, and the people who love them. Gear talk welcome.",
      ownerId: users.noize_atx.id,
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
        ],
      },
    },
  });

  await db.community.create({
    data: {
      slug: "demo-inbox",
      name: "SUBKULTUR DEMO INBOX",
      description: "Private. Send your best two tracks. We listen to everything once.",
      isPrivate: true,
      ownerId: users.subkultur.id,
      channels: { create: [{ name: "submissions", position: 0 }] },
      members: {
        create: [
          { userId: users.subkultur.id, role: "OWNER" },
          { userId: users.lil_threshold.id, status: "PENDING" },
        ],
      },
    },
  });

  // messages in THE ROOM #general
  const general = theRoom.channels.find((c) => c.name === "general")!;
  const CHAT: Array<[string, string]> = [
    ["bsctv", "doors tonight at sip haus. 10pm. you know the schedule."],
    ["noize_atx", "bringing the 303. fresh acid only"],
    ["warehouse_mary", "location for saturday drops 2 hours before. watch this channel"],
    ["lil_threshold", "pulled up last time and it was CRAZY. footage going in #footage"],
    ["velvetcrypt", "someone pick me up from the airport thursday and i'll play a free set"],
    ["bsctv", "@velvetcrypt deal. bring the cold compress remix"],
  ];
  for (const [who, body] of CHAT) {
    await db.message.create({
      data: { body, channelId: general.id, userId: users[who].id },
    });
  }

  // posts
  const POSTS: Array<[string, string, string | null]> = [
    ["bsctv", "when rage becomes the norm, TWEAK becomes the next thing.", null],
    ["noize_atx", "dropped a new one. volume check your neighbors first.", trackIds["battery acid"]],
    ["subkultur", "SK-019 is out. two sides, no skips. demo inbox opens friday.", trackIds["SK-019 A1 — tunnel logic"]],
    ["warehouse_mary", "saturday. 18+. live on KAZI 88.7fm. you already know the rest.", null],
    ["lil_threshold", "REDLINE!! out everywhere that matters (here)", trackIds["REDLINE!!"]],
    ["velvetcrypt", "berlin was cold. the set was colder. rip below.", trackIds["cold compress"]],
    ["bsctv", "open uploads are open. if you were there, it belongs here.", null],
  ];
  const postIds: string[] = [];
  for (const [who, body, trackId] of POSTS) {
    const p = await db.post.create({
      data: { body, userId: users[who].id, trackId },
    });
    postIds.push(p.id);
  }

  // likes + reposts
  for (let i = 0; i < postIds.length; i++) {
    for (const name of names) {
      if ((i + name.length) % 2 === 0) {
        await db.like.create({
          data: { userId: users[name].id, postId: postIds[i] },
        }).catch(() => {});
      }
    }
  }
  await db.repost.create({
    data: { userId: users.bsctv.id, trackId: trackIds["REDLINE!!"] },
  });
  await db.repost.create({
    data: { userId: users.noize_atx.id, postId: postIds[2] },
  });
  for (const title of Object.keys(trackIds)) {
    for (const name of names.slice(0, 4)) {
      if ((title.length + name.length) % 2 === 0) {
        await db.like.create({
          data: { userId: users[name].id, trackId: trackIds[title] },
        }).catch(() => {});
      }
    }
  }

  // one live stream
  await db.stream.create({
    data: {
      title: "SIP HAUS // night 47 — live from the floor",
      isLive: true,
      startedAt: new Date(Date.now() - 42 * 60 * 1000),
      userId: users.bsctv.id,
    },
  });

  console.log("seeded. demo login: noize_atx / tweaktweak (all users share the password)");
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
