import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

type SongArtworkProps = {
  uri: string;
  fallbackUri: string;
  style: StyleProp<ImageStyle>;
};

export function SongArtwork({ uri, fallbackUri, style }: SongArtworkProps) {
  const [imageUri, setImageUri] = useState(uri);

  useEffect(() => {
    setImageUri(uri);
  }, [uri]);

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      resizeMode="cover"
      onError={() => {
        if (imageUri !== fallbackUri) {
          setImageUri(fallbackUri);
        }
      }}
    />
  );
}
