# Nighty APK Version Notes

## Previous version - Version 01

APK:

`output/version--01/Nighty.apk`

The previous version included:

- NightWrapUp library and song browsing
- Mobile login and stored authentication session
- Song playback using `expo-audio`
- Previous, play/pause, and next controls
- Automatic advance to the next song
- Library switching
- Play-count updates through the backend
- Basic now-playing screen and bottom player

Limitations:

- It was tested through Expo Go/development mode.
- Android background playback was not fully configured in the native app.
- Lock-screen media controls and the Android media playback foreground service were unavailable.
- Background playback could stop when Android suspended the app.
- The expanded bottom-player controls could be clipped on smaller screens.

## Current version - Version 02

APK:

`output/version--02/Nighty.apk`

Changes in this version:

- Enabled Expo Audio background playback through the config plugin:

  ```json
  [
    "expo-audio",
    {
      "enableBackgroundPlayback": true
    }
  ]
  ```

- Enabled Android media playback foreground-service permissions.
- Added lock-screen and notification playback controls for the active song.
- Added song title, artist, and artwork metadata to the lock-screen player.
- Disabled lock-screen controls when the user signs out.
- Increased the expanded bottom-player height so the progress bar and transport controls remain visible.
- Preserved automatic next-track playback.
- Preserved the deployed backend connection:

  `https://apinightwrapup.ziax.online/api`

## Installation and sharing

Version 02 is an installable Android APK and can be shared directly. The recipient does not need Expo Go, Node.js, Metro, or the source code.

1. Send `output/version--02/Nighty.apk` to the Android device.
2. Open the APK on the device.
3. If prompted, allow installation from the browser or file manager.
4. Install and open Nighty.
5. Sign in with the mobile account.

## Background audio requirement

Version 02 must be installed as the rebuilt APK for native background playback to work. Expo Go cannot provide the configured Android media playback service.

After starting a song, the app should continue playing when the screen is locked or the app is placed in the background. Android battery optimization, loss of network connectivity, force-stopping the app, or an unavailable audio URL can still stop playback.

## Latest update - Version 03

Version 03 contains the mobile YouTube sharing flow and player display fixes.

Changes:

- Added Android share-intent support with `expo-share-intent`.
- Users can share a YouTube video from the YouTube app directly to NightWrapUp.
- NightWrapUp opens and displays a library-selection modal.
- Users select a library without manually copying or pasting the YouTube URL.
- The app saves the shared song through the mobile access-token route:

  ```text
  PUT /api/libraries/:libraryId/songs
  ```

- The backend prepares the audio, uploads it to Cloudinary, and stores the song in the selected library.
- Added a `Save to library` modal with library names, track counts, and a cancel action.
- Shared YouTube URLs are retained while the user signs in.
- Invalid shared links display a clear YouTube-link error.
- Updated the player time display to show only whole minutes and seconds:

  ```text
  8:34
  -1:38
  ```

- Removed decimal millisecond values from the progress display.

## Version 03 build requirement

Version 03 uses native Android share-intent functionality and cannot be tested through Expo Go. A new APK must be built and installed:

```powershell
cd Nighty
npx eas build --profile preview --platform android
```

After installing the new APK:

1. Open YouTube.
2. Open a video and tap `Share`.
3. Select `NightWrapUp`.
4. Choose a library in the modal.
5. Wait for the backend to prepare and save the song.

## Future versions

When app code or native configuration changes, create and share a new APK. For an internal/shareable Android build:

```powershell
cd Nighty
npx eas build --profile preview --platform android
```