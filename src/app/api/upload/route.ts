import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/auth";

const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
};

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_AUDIO = 60 * 1024 * 1024; // 60MB
const MAX_IMAGE = 8 * 1024 * 1024; // 8MB

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "no file" }, { status: 400 });

  const isAudio = file.type in AUDIO_TYPES;
  const isImage = file.type in IMAGE_TYPES;
  if (!isAudio && !isImage)
    return NextResponse.json({ error: "unsupported type" }, { status: 415 });
  if (file.size > (isAudio ? MAX_AUDIO : MAX_IMAGE))
    return NextResponse.json({ error: "file too large" }, { status: 413 });

  const ext = isAudio ? AUDIO_TYPES[file.type] : IMAGE_TYPES[file.type];
  const name = `${crypto.randomBytes(12).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${name}` });
}
