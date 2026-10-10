import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

type SongArtworkProps = {
  uri: string;
  fallbackUri: string;
  style: StyleProp<ImageStyle>;
};

export function SongArtwork({ uri, fallbackUri, style }: SongArtworkProps) {
  const safeUri = uri?.trim();
  const safeFallbackUri = fallbackUri?.trim();
  const [imageUri, setImageUri] = useState(safeUri || safeFallbackUri || null);

  useEffect(() => {
    setImageUri(safeUri || safeFallbackUri || null);
  }, [safeFallbackUri, safeUri]);

  if (!imageUri) {
    return <Image source={require('../../assets/icon.png')} style={style} resizeMode="cover" />;
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      resizeMode="cover"
      onError={() => {
        if (safeFallbackUri && imageUri !== safeFallbackUri) {
          setImageUri(safeFallbackUri);
        } else {
          setImageUri(null);
        }
      }}
    />
  );
}
