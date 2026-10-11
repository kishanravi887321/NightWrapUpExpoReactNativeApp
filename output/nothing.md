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
- Backend play-count updates were used by the earlier version
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

## Latest update - Version 04

Version 04 improves the library browsing layout and makes the YouTube sharing flow more reliable.

Changes:

- Added a collapsible library header for libraries containing multiple songs.
- The now-playing card, library tabs, and track count section slide away when the user scrolls down through the song list.
- The collapsible header returns when the user scrolls back to the top.
- Kept the hamburger navigation bar fixed and accessible while browsing songs.
- Preserved pull-to-refresh behavior and bottom-player controls.
- Reset the selected library whenever a new YouTube share is received, so a previous selection cannot be saved accidentally.
- Cleaned trailing punctuation from copied or shared YouTube URLs before sending them to the backend.
- Improved the create-library flow during sharing:
  - Create a new library from the sharing modal.
  - Automatically select the newly created library.
  - Return to the sharing modal so the user can press `Save`.
- Close the create-library dialog correctly when the shared-song flow is dismissed.
- Added loading states that prevent changing the selected library or starting duplicate save/create requests while an operation is running.

## Version 04 sharing and testing

Version 04 still requires a rebuilt APK for Android share-intent testing. Expo Go cannot receive Android share intents.

Build a fresh APK:

```powershell
cd Nighty
npx eas build --profile preview --platform android
```

Test the Version 04 flow after installing the APK:

1. Open YouTube and share a video to `NightWrapUp`.
2. Confirm that the `Save to library` modal opens.
3. Select an existing library and confirm that the checkmark appears.
4. Tap `Create new library`, enter a name, and create it.
5. Confirm that the new library is selected automatically.
6. Tap `Save` and wait for the `Saving song...` indicator.
7. Open a library containing multiple songs and scroll down to confirm that the top section collapses.
8. Scroll back to the top and confirm that the top section returns.

## Future versions

When app code or native configuration changes, create and share a new APK. For an internal/shareable Android build:

```powershell
cd Nighty
npx eas build --profile preview --platform android
```

## Latest update - Version 05

Version 05 adds local song downloads while preserving online playback and the existing backend API.

Changes:

- Added bottom navigation for:
  - Libraries
  - Tracks
  - Offline
  - Settings
- Added a download action to ready songs in the library using the `☁` symbol.
- The cloud symbol starts the download directly; a percentage is shown while downloading.
- Replaced text-based online/offline indicators with symbols:
  - `☁` — available online and ready to download
  - `⇩` — saved locally and available offline
  - `⏳` — audio preparation is pending
- Downloads use the existing Cloudinary audio URL and are stored in the app's private device storage.
- Added download progress and local-file status on downloaded songs.
- Added an Offline screen that first shows libraries containing local songs.
- Users can open a library in Offline and see only its downloaded songs.
- Added local playback controls in the Offline section, including the bottom player, progress, previous, next, and automatic next-song playback.
- Added local-only removal for downloaded songs. Removing a local song deletes the device file and metadata but keeps the backend library song available online.
- Each local download stores its library ID and library name, so the downloaded song remains associated with the library where it was saved.
- Playback now prefers a valid local file and falls back to the Cloudinary URL when the song is not downloaded.
- When a song is selected from a library or reached through a saved track, the audio path is resolved as `local file path -> Cloudinary URL`.
- Automatic next-song playback supports mixed tracks containing both local and online songs.
- Added a safe artwork fallback so older local downloads without thumbnails do not produce empty-image warnings.
- Existing login, library, YouTube sharing, library creation, background playback, and lock-screen APIs remain unchanged.
- The mobile app no longer sends play-count update requests when a song starts.
- Local download metadata is cleaned when a saved file no longer exists.

Version 05 requires a new native APK because it adds `expo-file-system`:

```powershell
cd Nighty
npx eas build --profile preview --platform android
```

Downloaded songs are device-specific. They are removed when the app is uninstalled and are not synchronized to another phone.

## Latest update - Version 06

Version 06 adds locally saved custom tracks under the new `Tracks` navigation tab.

Changes:

- Added `Tracks` as the second bottom-navigation tab.
- Added local track creation with three modes:
  - `Online` — uses Cloudinary audio URLs.
  - `Offline` — uses only songs downloaded to the device.
  - `Mixed` — prefers a local file and falls back to Cloudinary.
- Users can name a track and select songs from the loaded libraries.
- Saved tracks are stored only on the device and do not create backend records.
- Added play and delete actions for saved tracks.
- Track playback reuses the existing bottom music player.
- Previous, next, play/pause, progress, and automatic advancement are available for track playback.
- If an online track fails because of an unstable connection, the track automatically attempts the next track.
- Local songs continue to play when the internet is unavailable.
- Before logout, the app warns that saved local tracks will be removed.
- Confirmed logout clears saved tracks but keeps downloaded song files.