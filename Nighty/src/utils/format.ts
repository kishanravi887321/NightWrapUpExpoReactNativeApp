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
