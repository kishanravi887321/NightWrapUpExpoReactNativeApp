export const formatTime = (duration: number) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const buildFallbackImage = (index: number) =>
  `https://images.unsplash.com/photo-${[
    '1516280440614-37939bbacd81',
    '1525201548942-d8732f6617a0',
    '1504384308090-c894fdcc538d',
    '1493225457124-dc58bca47335',
  ][index % 4]}?auto=format&fit=crop&w=900&q=80`;

const MOBILE_WEB_ORIGIN = 'https://nightwrapup.ziax.online';

export const normalizeImageUrl = (value?: string) => {
  const imageUrl = value?.trim();

  if (!imageUrl) {
    return undefined;
  }

  if (imageUrl.startsWith('//')) {
    return `https:${imageUrl}`;
  }

  if (imageUrl.startsWith('/')) {
    return `${MOBILE_WEB_ORIGIN}${imageUrl}`;
  }

  if (imageUrl.startsWith('uploads/') || imageUrl.startsWith('images/')) {
    return `${MOBILE_WEB_ORIGIN}/${imageUrl}`;
  }

  if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
    try {
      const localUrl = new URL(imageUrl);
      return `${MOBILE_WEB_ORIGIN}${localUrl.pathname}${localUrl.search}`;
    } catch {
      return undefined;
    }
  }

  return imageUrl;
};

export const buildYoutubeThumbnail = (videoId?: string, youtubeUrl?: string) => {
  let resolvedVideoId = videoId?.trim();

  if (!resolvedVideoId && youtubeUrl) {
    try {
      const parsedUrl = new URL(youtubeUrl);
      resolvedVideoId = parsedUrl.searchParams.get('v') ?? parsedUrl.pathname.split('/').pop();
    } catch {
      resolvedVideoId = undefined;
    }
  }

  return resolvedVideoId
    ? `https://i.ytimg.com/vi/${encodeURIComponent(resolvedVideoId)}/hqdefault.jpg`
    : undefined;
};
