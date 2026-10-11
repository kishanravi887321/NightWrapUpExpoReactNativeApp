import { SongItem } from '../types/api';

/**
 * Generates a unique, deterministic audio waveform profile for a specific song.
 * Every song receives a distinct acoustic fingerprint (heights, peaks, valleys)
 * that stays 100% consistent every time this exact song is viewed or played.
 */
export function getSongWaveform(song: SongItem, count: number = 30): number[] {
  const seedString = `${song._id || ''}_${song.title || ''}_${song.artist || ''}_${song.duration || ''}`;
  let seed = 5381;
  for (let i = 0; i < seedString.length; i++) {
    seed = ((seed << 5) + seed + seedString.charCodeAt(i)) | 0;
  }
  seed = Math.abs(seed);

  const nextRandom = (idx: number) => {
    const x = Math.sin(seed + idx * 9301.12 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    const pos = i / Math.max(1, count - 1); // 0 to 1 across the track
    
    // Natural acoustic envelope: softer intro, energetic chorus/bridge, gentle outro
    const envelope = Math.sin(pos * Math.PI);
    const baseEnvelope = 0.35 + 0.65 * envelope;

    // Harmonic frequency waves specific to this song seed
    const harmonic1 = Math.sin(pos * Math.PI * 5 + (seed % 9));
    const harmonic2 = Math.cos(pos * Math.PI * 9 + (seed % 7));
    const noise = nextRandom(i);

    const rawAmp =
      baseEnvelope * 0.45 +
      Math.abs(harmonic1) * 0.28 +
      Math.abs(harmonic2) * 0.15 +
      noise * 0.18;

    // Height scaled between 5px and 28px
    const h = Math.round(5 + rawAmp * 22);
    heights.push(Math.max(5, Math.min(28, h)));
  }

  return heights;
}
