# Tumpang Doa native widget companion (iOS 17+)

This is separate from the React PWA. It provides bundled daily-prayer widgets and
an offline interactive Tasbih using SwiftUI, WidgetKit and App Intents. It does not
share Safari/PWA IndexedDB, cookies or counts, and does not use Supabase credentials.

**Xcode compilation, signing, WidgetKit rendering, App Intent execution and device
installation have NOT been run in the Linux development environment.** The source
and optional XcodeGen definition are supplied for completion on a Mac.

## Requirements and project creation

Use a Mac with Xcode 15 or newer (a current Xcode compatible with your iPhone's iOS
version is recommended), iOS 17+, a USB/Wi-Fi connected iPhone, and an Apple ID.
No App Store distribution is required. The PWA itself needs no Apple account.

Choose either method:

1. Optional XcodeGen: install the open-source XcodeGen tool on your Mac, run
   `cd ios && xcodegen generate`, then open `TitipanDoaNative.xcodeproj`. The YAML
   uses example bundle IDs; replace both with globally unique IDs under your name.
2. Xcode UI: create an iOS App called TitipanDoaNative with SwiftUI and Swift. Add
   a Widget Extension called TitipanDoaWidgets, enable **Include Configuration App
   Intent**, disable Live Activity, and set both deployment targets to iOS 17.
   Remove generated Swift @main/widget/template files before adding these sources.

Target membership:

- **App only:** `TitipanDoa/App/TitipanDoaApp.swift`.
- **Widget extension only:** `TitipanDoa/Widgets/TitipanDoaWidgets.swift`.
- **Both targets:** `TitipanDoa/Shared/NativeData.swift` and `Shared/Library.json`.
  Ensure Library.json appears in **Copy Bundle Resources** for both targets.
- Add source licenses from `../content/QURAN-LICENSE.txt` and
  `../content/HADITH-LICENSE.txt` to both targets' resources. The host shows source
  attribution and every displayed prayer has its exact reference.

For the manual project, add URL Type `titipandoa-native` to the host app. The widget
extension's Info.plist needs `NSExtensionPointIdentifier = com.apple.widgetkit-extension`.
The host can open a prayer from a widget URL, then link to the matching web-library
hash route. Opening that HTTPS link is controlled by iOS; it is not guaranteed to
launch the installed PWA rather than Safari.

Generate fresh bundled data after approved web-content changes:

```sh
node scripts/export-native-content.mjs
```

The bundled 54-entry order and Malaysian-calendar day selection match the web
catalogue at this source version. Widget timelines request a refresh at Malaysian
midnight; actual refresh timing is controlled by WidgetKit and can be delayed.
No runtime generation, unlicensed recording or network is needed for basic widgets.

## Personal Team signing and installation

1. In Xcode Settings → Accounts add your Apple ID.
2. Select the host and extension targets in turn. Under Signing & Capabilities,
   enable Automatically manage signing and select your Personal Team.
3. Use distinct unique bundle IDs (extension ID must start with the host ID).
4. Leave App Groups and other paid/team-restricted capabilities **off** initially.
5. Connect the iPhone, trust the Mac and enable Developer Mode when iOS requests it.
6. Select the physical iPhone as run destination and run the host app. Resolve any
   trust/developer certificate prompt in iPhone Settings before launching again.
7. Long-press the iPhone Home Screen → Edit/Add Widget → search Tumpang Doa. Add
   Doa Harian and/or Tasbih Digital in small or medium size.
8. Long-press the Tasbih widget → Edit Widget to select a zikir. The medium widget
   also offers a reset App Intent with confirmation.

Free Personal Team provisioning commonly expires after about seven days; rebuild
and reinstall from Xcode to renew it. Apple limits free device/app registrations,
and supported capabilities vary by team and Xcode version. If Xcode rejects a
widget extension or entitlement for your Personal Team, retain the independently
working PWA and inspect the exact signing error; no paid capability is assumed.
Do not claim native installation succeeded until it is run on your actual device.

## Counter storage and App Group fallback

Default `NativeCounterStore.appGroup` is **nil**. The widget extension stores its
counts in its own Application Support directory. App Intents and the widget
provider operate on that same extension-owned file. A file lock and atomic JSON
replacement serialize writes and avoid partial files. New counters begin at zero; damaged files and storage errors are surfaced and increment controls are disabled
in the widget snapshot rather than pretending to save.

With no App Group:

- Each zikir has its own persisted widget counter.
- The host's counter uses the host container and is independent; it cannot reset
  or inspect extension counts. Use the medium widget to reset and Edit Widget to
  change the selected zikir. The host explains this distinction.
- Both native counters are entirely independent from the PWA counter.

If your team supports App Groups, create a real group in Xcode, enable the same
entitlement for **both** targets, and set `NativeCounterStore.appGroup` to that exact
identifier. Only then can host and widget share the native counter file. Do not
add a nonexistent group or claim free-signing support without testing it. This
still does not synchronize with Safari/PWA storage.

The widget's target of 33 is explicitly a personal goal. No spiritual rewards or
new devotional prescriptions are claimed by counting.

## Device acceptance checklist

- Compile both targets; check extension-safe APIs, target membership and JSON decoding.
- Add each small/medium widget; check Arabic shaping, text clipping and VoiceOver.
- Disable Internet, tap increment rapidly, remove/re-add widget and restart iPhone.
  Verify the selected zikir's saved count and reset confirmation.
- Verify host/extension count separation in the no-App-Group configuration.
- If using a real App Group, tap concurrently in host/widget and verify no lost
  count; test the atomic-file error behavior with unavailable storage.
- Test daily rollover and source links. WidgetKit may defer a scheduled refresh.
- Verify deep links open the correct host prayer and the website's `/titipandoa/`
  hash route. Do not rely on an automatic Safari/PWA storage bridge.

The rebrand retains all bundle identifiers and widget kinds. The host includes an original Sage & Sand AppIcon asset and displays “Tumpang Doa”. Rebuild/reinstall with Xcode to update an existing installation; native compilation and device rendering remain unverified here.
