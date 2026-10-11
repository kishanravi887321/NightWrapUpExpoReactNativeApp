import React, { useEffect, useState } from 'react';
import { Image, ImageResizeMode, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type SongArtworkProps = {
  uri: string;
  fallbackUri: string;
  style: StyleProp<ImageStyle>;
  cropMode?: ImageResizeMode;
};

export function SongArtwork({ uri, fallbackUri, style, cropMode = 'cover' }: SongArtworkProps) {
  const safeUri = uri?.trim();
  const safeFallbackUri = fallbackUri?.trim();
  const [imageUri, setImageUri] = useState(safeUri || safeFallbackUri || null);

  useEffect(() => {
    setImageUri(safeUri || safeFallbackUri || null);
  }, [safeFallbackUri, safeUri]);

  // Flatten incoming style to extract container dimensions and radius
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const {
    width,
    height,
    borderRadius,
    borderWidth,
    borderColor,
    backgroundColor,
    margin,
    marginRight,
    marginLeft,
    marginTop,
    marginBottom,
    marginHorizontal,
    marginVertical,
    ...imageStyleRest
  } = flattenedStyle;

  const containerStyle: StyleProp<ViewStyle> = {
    width,
    height,
    borderRadius,
    borderWidth,
    borderColor,
    backgroundColor: backgroundColor || '#071526',
    margin,
    marginRight,
    marginLeft,
    marginTop,
    marginBottom,
    marginHorizontal,
    marginVertical,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  };

  // Check if image is from YouTube (hqdefault/mqdefault letterbox 16:9 in 4:3 box)
  const isYoutubeThumbnail =
    typeof imageUri === 'string' &&
    (imageUri.includes('ytimg.com') || imageUri.includes('youtube.com'));

  // Scale up slightly for YouTube 4:3 letterboxed thumbnails so top/bottom black bars are cropped out
  const isHQDefault = typeof imageUri === 'string' && imageUri.includes('hqdefault.jpg');
  const scaleZoom = isHQDefault ? 1.34 : 1.0;

  if (!imageUri) {
    return (
      <View style={containerStyle}>
        <Image
          source={require('../../assets/icon.png')}
          style={[{ width: '100%', height: '100%' }, imageStyleRest]}
          resizeMode={cropMode}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: imageUri }}
        style={[
          {
            width: '100%',
            height: '100%',
            transform: scaleZoom > 1 ? [{ scale: scaleZoom }] : undefined,
          },
          imageStyleRest,
        ]}
        resizeMode={cropMode}
        onError={() => {
          if (safeFallbackUri && imageUri !== safeFallbackUri) {
            setImageUri(safeFallbackUri);
          } else {
            setImageUri(null);
          }
        }}
      />
    </View>
  );
}
