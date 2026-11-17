// sync-engine.js
// Universal Real-Time Sync & Study Utility Engine for CA Study Hub
// Works across desktop (Windows 11) and mobile/tablet (Android)
// Handles Google Auth, Cloud Firestore two-way sync, persistent highlights, notes, and checkboxes.

import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp 
} from "./firebase-config.js";

class SyncEngine {
  constructor() {
    this.pageId = window.PAGE_ID || this.detectPageId();
    this.currentUser = null;
    this.unsubscribeFirestore = null;
    this.isApplyingRemoteChange = false;
    this.saveTimeout = null;
    this.syncStatus = "offline"; // "synced", "saving", "offline", "unauthenticated"
    this.highlightColor = "yellow"; // default
    this.pageData = {
      checkboxes: {},
      notes: {},
      highlights: [],
      customState: {},
      lastUpdated: null
    };

    this.init();
  }

  detectPageId() {
    let path = window.location.pathname.split("/").pop();
    if (!path || path === "" || path === "index.html") {
      return "master-dashboard";
    }
    return path.replace(".html", "").replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  init() {
    this.injectStyles();
    this.injectTopBar();
    this.initHighlightToolbar();
    this.attachDomListeners();
    this.initAuth();
  }

  // --- UI Injections ---
  injectStyles() {
    if (document.getElementById("sync-engine-styles")) return;
    const style = document.createElement("style");
    style.id = "sync-engine-styles";
    style.textContent = `
      #sync-topbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px 10px;
        color: var(--text-primary);
        font-family: var(--font-sans);
        font-size: 0.8rem;
      }
      .sync-status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
      }
      .sync-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #94a3b8;
        transition: background-color 0.3s ease;
      }
      .sync-dot.synced { background-color: #10b981; box-shadow: 0 0 8px #10b981; }
      .sync-dot.saving { background-color: #f59e0b; box-shadow: 0 0 8px #f59e0b; animation: pulse 1s infinite; }
      .sync-dot.offline { background-color: #ef4444; }
      .sync-dot.unauthenticated { background-color: #64748b; }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }

      .sync-user-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sync-user-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
        border: 1.5px solid #3b82f6;
      }
      .sync-user-name {
        max-width: 110px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .sync-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 5px 12px;
        border-radius: 9999px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background 0.2s, transform 0.1s;
      }
      .sync-btn:hover {
        background: #1d4ed8;
      }
      .sync-btn:active {
        transform: scale(0.96);
      }
      .sync-btn.btn-signout {
        background: rgba(239, 68, 68, 0.18);
        color: var(--text-primary);
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      .sync-btn.btn-signout:hover {
        background: rgba(239, 68, 68, 0.35);
      }

      /* Floating Highlight Toolbar for Text Selection */
      #study-highlight-toolbar {
        position: absolute;
        z-index: 100000;
        display: none;
        background: #1e293b;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        padding: 4px 6px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        align-items: center;
        gap: 6px;
      }
      .hl-btn {
        width: 26px;
        height: 26px;
        border-radius: 6px;
        border: 1px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        transition: transform 0.15s, border-color 0.15s;
      }
      .hl-btn:hover { transform: scale(1.1); }
      .hl-btn-yellow { background: #fef08a; color: #854d0e; }
      .hl-btn-green { background: #bbf7d0; color: #166534; }
      .hl-btn-remove { background: #f1f5f9; color: #ef4444; border: 1px solid #cbd5e1; }

      /* Highlight Span Styles */
      mark.study-hl {
        border-radius: 3px;
        padding: 1px 3px;
        cursor: pointer;
        color: inherit;
        position: relative;
      }
      mark.study-hl-yellow {
        background-color: #fde047;
        color: #1e293b;
      }
      mark.study-hl-green {
        background-color: #86efac;
        color: #064e3b;
      }
      [data-mode="dark"] mark.study-hl-yellow {
        background-color: rgba(234, 179, 8, 0.4);
        color: #fef08a;
      }
      [data-mode="dark"] mark.study-hl-green {
        background-color: rgba(34, 197, 94, 0.35);
        color: #bbf7d0;
      }

      /* Responsive for Android Tablets / Mobile */
      @media (max-width: 640px) {
        .sync-user-name {
          max-width: 70px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  injectTopBar() {
    if (document.getElementById("sync-topbar")) return;
    const bar = document.createElement("div");
    bar.id = "sync-topbar";
    bar.innerHTML = `
      <div class="sync-status-indicator" id="syncStatusIndicator">
        <span class="sync-dot unauthenticated" id="syncDot"></span>
        <span id="syncText">Sign in to Sync</span>
      </div>
      <div id="syncAuthContainer">
        <button class="sync-btn" id="btnGoogleSignIn">
          <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.51c-.33 2.1-2.18 3.63-4.51 3.63-2.6 0-4.72-2.12-4.72-4.72s2.12-4.72 4.72-4.72c1.17 0 2.23.43 3.06 1.15l2.06-2.06C16.82 5.51 14.7 4.5 12.18 4.5 7.9 4.5 4.5 7.9 4.5 12.18s3.4 7.68 7.68 7.68c4.47 0 7.42-3.14 7.42-7.56 0-.58-.06-1.12-.25-1.2z"/></svg>
          Google Sync
        </button>
      </div>
    `;
    const header = document.getElementById("hub-site-tools");
    if (header) header.appendChild(bar);
    else document.body.prepend(bar);

    document.getElementById("btnGoogleSignIn").addEventListener("click", () => this.handleSignIn());
  }

  initHighlightToolbar() {
    if (document.getElementById("study-highlight-toolbar")) return;
    const toolbar = document.createElement("div");
    toolbar.id = "study-highlight-toolbar";
    toolbar.innerHTML = `
      <button class="hl-btn hl-btn-yellow" data-color="yellow" title="Yellow Highlight">A</button>
      <button class="hl-btn hl-btn-green" data-color="green" title="Green Highlight">A</button>
      <button class="hl-btn hl-btn-remove" data-action="remove" title="Remove Highlight">✕</button>
    `;
    document.body.appendChild(toolbar);

    toolbar.addEventListener("mousedown", (e) => {
      e.preventDefault(); // prevent blur
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.action === "remove") {
        this.removeCurrentSelectionHighlight();
      } else if (btn.dataset.color) {
        this.highlightSelection(btn.dataset.color);
      }
      toolbar.style.display = "none";
    });

    document.addEventListener("mouseup", (e) => {
      // Don't trigger if clicked within topbar or toolbar
      if (e.target.closest("#hub-site-tools, #sync-topbar, #study-highlight-toolbar")) return;
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            toolbar.style.left = `${window.scrollX + rect.left + rect.width / 2 - 45}px`;
            toolbar.style.top = `${window.scrollY + rect.top - 40}px`;
            toolbar.style.display = "flex";
            return;
          }
        }
        toolbar.style.display = "none";
      }, 30);
    });

    // Clicking an existing highlight directly lets you clear or switch it
    document.addEventListener("click", (e) => {
      const hl = e.target.closest("mark.study-hl");
      if (hl) {
        if (confirm("Remove this highlight?")) {
          const parent = hl.parentNode;
          while (hl.firstChild) {
            parent.insertBefore(hl.firstChild, hl);
          }
          parent.removeChild(hl);
          this.rebuildHighlightsFromDOM();
          this.triggerSave();
        }
      }
    });
  }

  // --- Auth Handling ---
  initAuth() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.updateAuthUI(user);
        this.updateStatus("synced", "Synced");
        this.startRealtimeSync();
      } else {
        this.currentUser = null;
        this.updateAuthUI(null);
        this.updateStatus("unauthenticated", "Sign in to Sync");
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this.unsubscribeFirestore = null;
        }
        // Load fallback offline cache if present
        this.loadLocalCache();
      }
    });
  }

  async handleSignIn() {
    try {
      this.updateStatus("saving", "Connecting...");
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign-in error:", err);
      this.updateStatus("offline", "Sign-in failed");
      setTimeout(() => this.updateStatus("unauthenticated", "Sign in to Sync"), 3000);
    }
  }

  async handleSignOut() {
    try {
      if (this.unsubscribeFirestore) {
        this.unsubscribeFirestore();
        this.unsubscribeFirestore = null;
      }
      await signOut(auth);
      this.updateStatus("unauthenticated", "Signed out");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }

  updateAuthUI(user) {
    const container = document.getElementById("syncAuthContainer");
    if (!container) return;

    if (user) {
      const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=2563eb&color=fff`;
      const name = user.displayName || user.email || "Study User";
      container.innerHTML = `
        <div class="sync-user-info" title="${user.email}">
          <img class="sync-user-avatar" src="${photo}" alt="Avatar" referrerpolicy="no-referrer">
          <span class="sync-user-name">${name}</span>
          <button class="sync-btn btn-signout" id="btnGoogleSignOut" title="Sign Out">Sign Out</button>
        </div>
      `;
      document.getElementById("btnGoogleSignOut").addEventListener("click", () => this.handleSignOut());
    } else {
      container.innerHTML = `
        <button class="sync-btn" id="btnGoogleSignIn">
          <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.51c-.33 2.1-2.18 3.63-4.51 3.63-2.6 0-4.72-2.12-4.72-4.72s2.12-4.72 4.72-4.72c1.17 0 2.23.43 3.06 1.15l2.06-2.06C16.82 5.51 14.7 4.5 12.18 4.5 7.9 4.5 4.5 7.9 4.5 12.18s3.4 7.68 7.68 7.68c4.47 0 7.42-3.14 7.42-7.56 0-.58-.06-1.12-.25-1.2z"/></svg>
          Google Sync
        </button>
      `;
      document.getElementById("btnGoogleSignIn").addEventListener("click", () => this.handleSignIn());
    }
  }

  updateStatus(status, text) {
    this.syncStatus = status;
    const dot = document.getElementById("syncDot");
    const label = document.getElementById("syncText");
    if (!dot || !label) return;

    dot.className = `sync-dot ${status}`;
    label.textContent = text;
  }

  // --- Real-time Firestore Sync ---
  getFirestoreDocRef() {
    if (!this.currentUser) return null;
    return doc(db, "users", this.currentUser.uid, "pages", this.pageId);
  }

  startRealtimeSync() {
    const docRef = this.getFirestoreDocRef();
    if (!docRef) return;

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }

    this.unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data();
        this.applyRemoteData(remoteData);
        this.updateStatus("synced", "Synced");
      } else {
        // Document doesn't exist yet, save current local state up
        this.collectCurrentDOMState();
        this.saveToFirestore();
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
      this.updateStatus("offline", "Offline");
    });
  }

  applyRemoteData(data) {
    if (!data) return;
    this.isApplyingRemoteChange = true;

    try {
      this.pageData = { ...this.pageData, ...data };
      this.saveLocalCache(this.pageData);

      // 1. Restore Checkboxes
      if (data.checkboxes) {
        Object.entries(data.checkboxes).forEach(([id, checked]) => {
          const el = document.getElementById(id);
          if (el) {
            if (el.tagName === "INPUT" && el.type === "checkbox") {
              el.checked = !!checked;
            } else if (el.classList.contains("custom-check")) {
              // Custom checkbox div support (e.g., in Study Tracker)
              if (checked) {
                el.classList.add("checked");
              } else {
                el.classList.remove("checked");
              }
            }
          }
        });
      }

      // 2. Restore Notes / Textarea / Contenteditable
      if (data.notes) {
        Object.entries(data.notes).forEach(([id, content]) => {
          const el = document.getElementById(id);
          if (el && document.activeElement !== el) {
            if ("value" in el) {
              el.value = content || "";
            } else if (el.isContentEditable) {
              el.innerText = content || "";
            }
          }
        });
      }

      // 3. Restore Highlights
      if (Array.isArray(data.highlights)) {
        this.renderStoredHighlights(data.highlights);
      }

      // 4. Custom State Hook (for complex trackers e.g. study-tracker userProgress)
      if (data.customState && typeof window.onRemoteCustomStateReceived === "function") {
        window.onRemoteCustomStateReceived(data.customState);
      }

      // Dispatch event for any other custom scripts listening
      window.dispatchEvent(new CustomEvent("studyHubSyncReceived", { detail: data }));
    } finally {
      this.isApplyingRemoteChange = false;
    }
  }

  // --- Highlight Restoration and Creation ---
  highlightSelection(color = "yellow") {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    try {
      const range = selection.getRangeAt(0);
      const mark = document.createElement("mark");
      mark.className = `study-hl study-hl-${color}`;
      mark.dataset.color = color;
      
      // Surround contents
      const selectedContent = range.extractContents();
      mark.appendChild(selectedContent);
      range.insertNode(mark);
      selection.removeAllRanges();

      this.rebuildHighlightsFromDOM();
      this.triggerSave();
    } catch (e) {
      console.warn("Complex highlight across nodes, simplified fallback:", e);
    }
  }

  removeCurrentSelectionHighlight() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const marks = (container.nodeType === Node.ELEMENT_NODE ? container : container.parentNode).querySelectorAll("mark.study-hl");
    marks.forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
    selection.removeAllRanges();
    this.rebuildHighlightsFromDOM();
    this.triggerSave();
  }

  rebuildHighlightsFromDOM() {
    const marks = document.querySelectorAll("mark.study-hl");
    const highlights = [];
    marks.forEach((mark, index) => {
      const parentWithId = mark.closest("[id]");
      highlights.push({
        index,
        parentId: parentWithId ? parentWithId.id : "body",
        color: mark.dataset.color || (mark.classList.contains("study-hl-green") ? "green" : "yellow"),
        text: mark.textContent
      });
    });
    this.pageData.highlights = highlights;
  }

  renderStoredHighlights(highlights) {
    if (!highlights || highlights.length === 0) return;
    
    // Clear previously rendered highlights to avoid duplicates
    document.querySelectorAll("mark.study-hl").forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });

    highlights.forEach(h => {
      if (!h.text || !h.text.trim()) return;
      const container = (h.parentId && h.parentId !== "body") ? document.getElementById(h.parentId) : document.body;
      if (!container) return;

      this.highlightTextInsideNode(container, h.text, h.color || "yellow");
    });
  }

  highlightTextInsideNode(node, text, color) {
    if (node.nodeType === Node.TEXT_NODE) {
      const idx = node.textContent.indexOf(text);
      if (idx >= 0) {
        const span = document.createElement("mark");
        span.className = `study-hl study-hl-${color}`;
        span.dataset.color = color;
        const middle = node.splitText(idx);
        middle.splitText(text.length);
        span.appendChild(middle.cloneNode(true));
        middle.parentNode.replaceChild(span, middle);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes && !["SCRIPT", "STYLE", "MARK"].includes(node.tagName)) {
      Array.from(node.childNodes).forEach(child => this.highlightTextInsideNode(child, text, color));
    }
  }

  // --- DOM Listeners ---
  attachDomListeners() {
    // 1. Checkboxes
    document.addEventListener("change", (e) => {
      if (this.isApplyingRemoteChange) return;
      const target = e.target;
      if (target && target.tagName === "INPUT" && target.type === "checkbox") {
        if (!target.id) {
          // Generate stable fallback id if missing
          target.id = "chk_" + Math.random().toString(36).substring(2, 9);
        }
        this.pageData.checkboxes[target.id] = target.checked;
        this.triggerSave();
      }
    });

    // 2. Textarea / Editable Notes
    document.addEventListener("input", (e) => {
      if (this.isApplyingRemoteChange) return;
      const target = e.target;
      if (target && (target.tagName === "TEXTAREA" || target.isContentEditable || (target.tagName === "INPUT" && target.type === "text" && target.classList.contains("sync-input")))) {
        if (target.id) {
          this.pageData.notes[target.id] = "value" in target ? target.value : target.innerText;
          this.triggerSave();
        }
      }
    });
  }

  collectCurrentDOMState() {
    // Checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      if (chk.id) {
        this.pageData.checkboxes[chk.id] = chk.checked;
      }
    });

    // Notes
    document.querySelectorAll("textarea[id], [contenteditable='true'][id], input.sync-input[id]").forEach(el => {
      this.pageData.notes[el.id] = "value" in el ? el.value : el.innerText;
    });

    // Custom State Hook
    if (typeof window.getCustomStateForSync === "function") {
      this.pageData.customState = window.getCustomStateForSync();
    }
  }

  // Method for external scripts to sync custom JSON structures (like study tracker userProgress)
  syncCustomState(stateObj) {
    if (this.isApplyingRemoteChange) return;
    this.pageData.customState = stateObj;
    this.triggerSave();
  }

  triggerSave() {
    if (this.isApplyingRemoteChange) return;
    this.updateStatus("saving", "Saving...");

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToFirestore();
    }, 600); // 600ms debounce
  }

  async saveToFirestore() {
    // Always persist to local cache first
    this.saveLocalCache(this.pageData);

    if (!this.currentUser) {
      this.updateStatus("unauthenticated", "Saved locally (Sign in to sync)");
      return;
    }

    const docRef = this.getFirestoreDocRef();
    if (!docRef) return;

    try {
      this.pageData.lastUpdated = new Date().toISOString();
      await setDoc(docRef, {
        ...this.pageData,
        pageId: this.pageId,
        userEmail: this.currentUser.email,
        serverTimestamp: serverTimestamp()
      }, { merge: true });

      this.updateStatus("synced", "Synced");
    } catch (err) {
      console.error("Firestore write failed:", err);
      this.updateStatus("offline", "Offline (Saved locally)");
    }
  }

  // --- Offline Fallback Storage ---
  saveLocalCache(data) {
    try {
      localStorage.setItem(`ca_hub_sync_${this.pageId}`, JSON.stringify(data));
    } catch (e) {
      console.warn("LocalStorage failed:", e);
    }
  }

  loadLocalCache() {
    try {
      const cached = localStorage.getItem(`ca_hub_sync_${this.pageId}`);
      if (cached) {
        const data = JSON.parse(cached);
        this.applyRemoteData(data);
      }
    } catch (e) {
      console.warn("Failed loading local cache:", e);
    }
  }
}

// Auto-initialize when loaded
export const syncEngine = new SyncEngine();
window.syncEngine = syncEngine;
