export type MobileUser = {
  id: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  mobileAccessEnabled?: boolean;
  mobileSecretKey?: string;
  mobileSecretKeyCreatedAt?: string;
  mobileSecretKeyLastUsedAt?: string;
};

export type MobileLoginResponse = {
  user: MobileUser;
  accessToken: string;
  refreshToken: string;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type ApiLibrary = {
  _id: string;
  name: string;
  description?: string;
  songCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiSong = {
  _id: string;
  library?: string;
  title: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  thumbnail?: string;
  channelName?: string;
  playCount?: number;
  audio?: {
    url?: string;
    publicId?: string;
    status?: string;
    quality?: string;
    size?: string;
    duration?: number;
    provider?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type LibraryItem = {
  _id: string;
  name: string;
  description: string;
  accent: string;
  songCount?: number;
};

export type SongItem = {
  _id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  audioUrl?: string;
  tag: string;
  mood: string;
  audioReady: boolean;
  playCount?: number;
};
