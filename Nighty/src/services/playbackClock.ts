import { useEffect, useState } from 'react';

type Listener = (seconds: number) => void;

class PlaybackClock {
  private currentSeconds: number = 0;
  private isPlaying: boolean = false;
  private duration: number = 0;
  private listeners: Set<Listener> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastAnchorSeconds: number = 0;
  private lastAnchorTimestamp: number = Date.now();
  private isSeeking: boolean = false;
  private seekTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentTrackId: string | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.currentSeconds);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getTime(): number {
    return this.currentSeconds;
  }

  setTrack(trackId: string | null, duration: number = 0) {
    if (trackId !== this.currentTrackId) {
      this.currentTrackId = trackId;
      this.currentSeconds = 0;
      this.lastAnchorSeconds = 0;
      this.lastAnchorTimestamp = Date.now();
      this.isSeeking = false;
      this.duration = duration;
      this.notify();
    } else if (duration > 0) {
      this.duration = duration;
    }
  }

  setPlaying(playing: boolean) {
    if (this.isPlaying === playing) return;
    this.isPlaying = playing;

    if (playing) {
      this.lastAnchorTimestamp = Date.now();
      this.startTicker();
    } else {
      this.lastAnchorSeconds = this.currentSeconds;
      this.stopTicker();
    }
  }

  private startTicker() {
    this.stopTicker();
    this.intervalId = setInterval(() => {
      if (!this.isPlaying || this.isSeeking) return;

      const elapsed = (Date.now() - this.lastAnchorTimestamp) / 1000;
      const targetDuration = this.duration > 0 ? this.duration : 999999;
      const calculated = Math.min(targetDuration, Math.max(0, this.lastAnchorSeconds + elapsed));

      this.currentSeconds = calculated;
      this.notify();
    }, 250);
  }

  private stopTicker() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  syncNative(nativeSeconds: number) {
    if (this.isSeeking) return;
    if (nativeSeconds <= 0 && this.currentSeconds > 2) return;

    if (!this.isPlaying) {
      this.currentSeconds = nativeSeconds;
      this.lastAnchorSeconds = nativeSeconds;
      this.lastAnchorTimestamp = Date.now();
      this.notify();
      return;
    }

    const currentCalculated = this.lastAnchorSeconds + (Date.now() - this.lastAnchorTimestamp) / 1000;
    const diff = Math.abs(nativeSeconds - currentCalculated);

    // If drift is minor (< 1.5s), smoothly align anchor to prevent long-term drift
    if (diff < 1.5) {
      this.lastAnchorSeconds = nativeSeconds;
      this.lastAnchorTimestamp = Date.now();
    }
    // If diff >= 1.5s (chunk jump artifact from stream/ExoPlayer), ignore the jump!
    // The continuous 250ms ticker keeps the clock advancing sequentially: 5, 6, 7, 8, 9, 10!
  }

  seek(targetSeconds: number) {
    const clamped = Math.max(0, Math.min(this.duration > 0 ? this.duration : targetSeconds, targetSeconds));
    this.isSeeking = true;
    this.currentSeconds = clamped;
    this.lastAnchorSeconds = clamped;
    this.lastAnchorTimestamp = Date.now();
    this.notify();

    if (this.seekTimeout) clearTimeout(this.seekTimeout);
    this.seekTimeout = setTimeout(() => {
      this.isSeeking = false;
    }, 1200);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentSeconds));
  }
}

export const playbackClock = new PlaybackClock();

export function usePlaybackTime(): number {
  const [time, setTime] = useState(() => playbackClock.getTime());

  useEffect(() => {
    return playbackClock.subscribe((nextTime) => {
      setTime(nextTime);
    });
  }, []);

  return time;
}
