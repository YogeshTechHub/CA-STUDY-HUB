# CA Final Study Hub (GitHub Pages + Firebase Spark Plan)

A fast, mobile-responsive, offline-resilient study platform tailored for CA Final preparation across Windows 11 desktop browsers and Android tablets.

Live Website: [https://yogeshtechhub.github.io/CA-STUDY-HUB/](https://yogeshtechhub.github.io/CA-STUDY-HUB/)

---

## 🚀 Features Built

1. **`firebase-config.js` (Modular Firebase v10+ via CDN)**
   - Pre-configured with your Firebase project keys: `ca-study-hub-f5479`.
   - Initializes Firebase App, Google Authentication (`signInWithPopup`), and Cloud Firestore.
   - Compatible with free static GitHub Pages hosting (no Node build step required).

2. **`sync-engine.js` (Universal Cross-Device Synchronization Engine)**
   - **Floating Sync Bar**: Displays real-time sync states (`Synced`, `Saving...`, `Offline`, `Sign in to Sync`) and user profile avatar/name.
   - **User Scoped Security**: All data is automatically scoped under `users/{uid}/pages/{PAGE_ID}` in Cloud Firestore.
   - **Two-Way Live Sync**: Automatic `onSnapshot` listener updates the webpage seamlessly if you switch between desktop and tablet.
   - **Checkbox State Persistence**: Automatically stores and restores every checkbox by its element `id`.
   - **Text Highlighter Tool**: Select any text on any page to open a floating toolbar; highlight in yellow or green, or remove highlights. Highlights persist across device reloads.
   - **Notes & Editable Blocks**: Synchronizes all `<textarea>` and `contenteditable` inputs with debounced cloud saves.
   - **Offline Local Cache**: Automatically persists to `localStorage` when offline or unauthenticated.

3. **`index.html` (Master Study Dashboard)**
   - Fast, modern dark-themed responsive dashboard.
   - Live Search bar (searches chapters, Ind AS, subjects, and keywords).
   - Subject category filter buttons (`All`, `Trackers`, `FR`, `AFM`, `Audit`, `DT`, `IDT`).
   - Dynamic progress bars on each card reflecting completion percentages directly from synchronized data.
   - High-level overview stats (active modules, checkpoints mastered, highlights created).

4. **Included Study Modules**
   - **`study-tracker.html`**: Master 6-Paper ICAI New Scheme granular tracker (Theory/Practice breakdowns, 5 revision cycles, ABC category filters).
   - **`indas-116.html`**: Deep-dive Ind AS 116 Leases revision capsule with interactive checkpoints, formulas, and real-time personal notes.

5. **`firestore.rules`**
   - Strict security rules scoped to authenticated Google users.

---

## 🛠️ How to Add a New Study Page
To make any new `.html` file support automatic Firebase sync:
1. Ensure all interactive inputs have permanent, unique `id` attributes:
   ```html
   <input type="checkbox" id="chk_sa500_procedures">
   <textarea id="notes_sa500_tricks"></textarea>
   ```
2. At the bottom before `</body>`, assign a unique `PAGE_ID` and import `sync-engine.js`:
   ```html
   <script>
     window.PAGE_ID = "audit-sa-500";
   </script>
   <script type="module" src="./sync-engine.js"></script>
   ```
3. Add a new card in `index.html` pointing to your new file!
