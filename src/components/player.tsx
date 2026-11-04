"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type PlayerTrack = {
  id: string;
  title: string;
  audioUrl: string;
  artworkUrl: string | null;
  duration: number;
  artistName: string;
  artistUsername: string;
};

type PlayerState = {
  current: PlayerTrack | null;
  playing: boolean;
  progress: number; // seconds
  duration: number;
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  next: () => void;
  prev: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer outside PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<PlayerTrack[]>([]);
  const [current, setCurrent] = useState<PlayerTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => nextRef.current();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const load = useCallback((track: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.audioUrl;
    audio.play().catch(() => {});
    setCurrent(track);
    setPlaying(true);
    setProgress(0);
    // fire-and-forget play count
    fetch(`/api/tracks/${track.id}/play`, { method: "POST" }).catch(() => {});
  }, []);

  const play = useCallback(
    (track: PlayerTrack, queue?: PlayerTrack[]) => {
      if (queue) queueRef.current = queue;
      else if (!queueRef.current.some((t) => t.id === track.id))
        queueRef.current = [track];
      if (current?.id === track.id) {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
          audio.play().catch(() => {});
          setPlaying(true);
        } else {
          audio.pause();
          setPlaying(false);
        }
        return;
      }
      load(track);
    },
    [current, load]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [current]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const next = useCallback(() => {
    const q = queueRef.current;
    if (!current || q.length === 0) return;
    const i = q.findIndex((t) => t.id === current.id);
    const nextTrack = q[(i + 1) % q.length];
    if (nextTrack && nextTrack.id !== current.id) load(nextTrack);
    else setPlaying(false);
  }, [current, load]);

  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const prev = useCallback(() => {
    const q = queueRef.current;
    if (!current || q.length === 0) return;
    const i = q.findIndex((t) => t.id === current.id);
    const prevTrack = q[(i - 1 + q.length) % q.length];
    if (prevTrack) load(prevTrack);
  }, [current, load]);

  return (
    <PlayerContext.Provider
      value={{ current, playing, progress, duration, play, toggle, seek, next, prev }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
