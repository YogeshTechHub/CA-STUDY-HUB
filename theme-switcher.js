// theme-switcher.js
// Universal 3D Floating Top Navigation, Theme & Font Switcher for CA Study Hub
// Works seamlessly across all study capsules and trackers
// Features:
// 1. ← Dashboard Link
// 2. 📋 Copy Clean HTML Button
// 3. ☀️ / 🌙 Light/Dark Mode Switcher
// 4. 🎨 5 Eye-Friendly Themes (Paper, Sage, Ocean, Lavender, Sunset)
// 5. Aa Font Switcher (Plus Jakarta Sans vs. Literata Serif)

(function() {
  const THEME_OPTIONS = [
    { id: "theme-paper", name: "Warm Paper", desc: "Kindle Cream / Espresso", color: "#d97706" },
    { id: "theme-sage", name: "Calm Sage", desc: "Mint / Forest Slate", color: "#10b981" },
    { id: "theme-ocean", name: "Crisp Ocean", desc: "Sky / Midnight Navy", color: "#3b82f6" },
    { id: "theme-lavender", name: "Studio Lavender", desc: "Lilac / Plum Charcoal", color: "#a855f7" },
    { id: "theme-sunset", name: "Amber Sunset", desc: "Sand / Obsidian", color: "#f97316" }
  ];

  function injectStyles() {
    if (document.getElementById("theme-switcher-styles")) return;
    const style = document.createElement("style");
    style.id = "theme-switcher-styles";
    style.textContent = `
      /* Controls sit in the shared page header. */
      #hub-theme-toolbar {
        position: relative;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
      }

      .hub-tool-btn {
        background: transparent;
        border: none;
        color: var(--text-primary, #0f172a);
        font-family: var(--font-sans, system-ui, sans-serif);
        font-size: 13px;
        font-weight: 700;
        min-height: 40px;
        padding: 0 10px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.18s, color 0.18s, transform 0.1s;
      }
      .hub-tool-btn:hover {
        background: var(--accent-soft, rgba(59, 130, 246, 0.12));
        color: var(--text-primary, #0f172a);
      }
      .hub-tool-btn:active {
        transform: scale(0.94);
      }

      .hub-tool-btn.btn-dashboard {
        color: var(--text-primary, #0f172a);
        padding-left: 12px;
        padding-right: 12px;
      }

      .hub-tool-sep {
        width: 1px;
        height: 18px;
        background: var(--border, #cbd5e1);
        margin: 0 2px;
      }

      /* 3D Theme Dropdown Menu */
      #hub-theme-dropdown {
        position: absolute;
        top: calc(100% + 10px);
        left: 0;
        background: var(--bg-card, #ffffff);
        border: 1.5px solid var(--border, #cbd5e1);
        border-radius: 16px;
        box-shadow: var(--shadow-3d, 0 15px 35px rgba(0,0,0,0.25));
        padding: 8px;
        display: none;
        flex-direction: column;
        gap: 4px;
        min-width: 220px;
        z-index: 100000;
      }
      .hub-theme-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border-radius: 10px;
        background: transparent;
        border: none;
        color: var(--text-primary, #0f172a);
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        text-align: left;
        transition: background 0.15s, transform 0.1s;
      }
      .hub-theme-item:hover {
        background: var(--accent-soft, rgba(59, 130, 246, 0.1));
      }
      .hub-theme-item.active {
        background: var(--accent-soft, rgba(59, 130, 246, 0.15));
        color: var(--text-primary, #0f172a);
        font-weight: 800;
      }
      .hub-theme-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 6px rgba(0,0,0,0.2);
      }
      .hub-theme-meta {
        display: flex;
        flex-direction: column;
      }
      .hub-theme-name {
        font-size: 13px;
        line-height: 1.2;
      }
      .hub-theme-desc {
        font-size: 10.5px;
        color: var(--text-dim, #64748b);
      }

      /* Copy feedback toast */
      #hub-copy-toast {
        position: fixed;
        bottom: 28px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: #10b981;
        color: #ffffff;
        font-family: var(--font-sans, system-ui, sans-serif);
        font-size: 13.5px;
        font-weight: 700;
        padding: 8px 20px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
        opacity: 0;
        pointer-events: none;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 100001;
      }
      #hub-copy-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }


    `;
    document.head.appendChild(style);
  }

  function initPreferences() {
    // Default to 'light' mode as requested for comfortable reading, fallback to user's saved choice
    const savedMode = localStorage.getItem("ca_hub_pref_mode") || "light";
    const savedTheme = localStorage.getItem("ca_hub_pref_theme") || "theme-paper";
    const savedFont = localStorage.getItem("ca_hub_pref_font") || "sans";

    document.documentElement.setAttribute("data-mode", savedMode);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-font", savedFont);

    // Sync legacy attributes for full compatibility
    document.documentElement.setAttribute("data-theme-style", savedTheme.replace("theme-", ""));
  }

  function toggleMode() {
    const current = document.documentElement.getAttribute("data-mode") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-mode", next);
    localStorage.setItem("ca_hub_pref_mode", next);
    updateModeButton();
  }

  function updateModeButton() {
    const btn = document.getElementById("btnHubMode");
    if (!btn) return;
    const mode = document.documentElement.getAttribute("data-mode") || "light";
    btn.textContent = mode === "light" ? "Dark mode" : "Light mode";
    btn.title = mode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode";
  }

  function setTheme(themeId) {
    document.documentElement.setAttribute("data-theme", themeId);
    document.documentElement.setAttribute("data-theme-style", themeId.replace("theme-", ""));
    localStorage.setItem("ca_hub_pref_theme", themeId);
    updateActiveThemeItem();
    const dropdown = document.getElementById("hub-theme-dropdown");
    if (dropdown) closeThemeDropdown();
  }

  function updateActiveThemeItem() {
    const current = document.documentElement.getAttribute("data-theme") || "theme-paper";
    document.querySelectorAll(".hub-theme-item").forEach(item => {
      if (item.dataset.theme === current) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  function toggleFont() {
    const current = document.documentElement.getAttribute("data-font") || "sans";
    const next = current === "sans" ? "serif" : "sans";
    document.documentElement.setAttribute("data-font", next);
    localStorage.setItem("ca_hub_pref_font", next);
    updateFontButton();
  }

  function updateFontButton() {
    const btn = document.getElementById("btnHubFont");
    if (!btn) return;
    const current = document.documentElement.getAttribute("data-font") || "sans";
    btn.innerHTML = current === "sans" ? `<span style="font-family: serif; font-weight: bold;">Aa</span>` : `<span style="font-family: sans-serif; font-weight: bold;">Aa</span>`;
    btn.title = current === "sans" ? "Switch to Book Serif (Literata)" : "Switch to Modern Sans (Plus Jakarta Sans)";
  }

  function showToast(text = "Copied to clipboard!") {
    let toast = document.getElementById("hub-copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hub-copy-toast";
      document.body.appendChild(toast);
    }
    toast.innerText = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  }

  async function copyCleanHtml() {
    try {
      const clone = document.documentElement.cloneNode(true);
      const toRemove = clone.querySelectorAll(
        "#hub-site-tools, #hub-copy-toast, #theme-switcher-styles, #sync-topbar, #study-highlight-toolbar"
      );
      toRemove.forEach(el => el.remove());
      const htmlStr = "<!DOCTYPE html>\n" + clone.outerHTML;
      await navigator.clipboard.writeText(htmlStr);
      showToast("📋 Clean HTML Structure Copied!");
    } catch (e) {
      console.warn("Copy error:", e);
      showToast("Unable to copy to clipboard");
    }
  }

  function closeThemeDropdown() {
    document.getElementById("hub-theme-dropdown").style.display = "none";
    document.getElementById("btnHubTheme").setAttribute("aria-expanded", "false");
  }

  function renderToolbar() {
    const path = window.location.pathname.split("/").pop();
    const isDashboard = (path === "index.html" || path === "");

    if (document.getElementById("hub-theme-toolbar")) return;

    const bar = document.createElement("div");
    bar.id = "hub-theme-toolbar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Study tools");

    let html = "";
    if (!isDashboard) {
      html += `
        <a href="./index.html" class="hub-tool-btn btn-dashboard" title="Return to Master Dashboard">
          Dashboard
        </a>
        <div class="hub-tool-sep"></div>
      `;
    }

    html += `
      <button class="hub-tool-btn" id="btnHubCopy" title="Copy clean HTML layout">
        Copy HTML
      </button>

      <button class="hub-tool-btn" id="btnHubMode" title="Toggle Light / Dark mode">
        Dark mode
      </button>

      <button class="hub-tool-btn" id="btnHubTheme" aria-expanded="false" aria-controls="hub-theme-dropdown" title="Change Color Theme">
        Theme
      </button>

      <button class="hub-tool-btn" id="btnHubFont" title="Toggle Font (Sans vs Serif)">
        Aa
      </button>

      <div id="hub-theme-dropdown">
        ${THEME_OPTIONS.map(opt => `
          <button class="hub-theme-item" data-theme="${opt.id}">
            <span class="hub-theme-dot" style="background: ${opt.color};"></span>
            <div class="hub-theme-meta">
              <span class="hub-theme-name">${opt.name}</span>
              <span class="hub-theme-desc">${opt.desc}</span>
            </div>
          </button>
        `).join("")}
      </div>
    `;

    bar.innerHTML = html;
    const header = document.createElement("div");
    header.id = "hub-site-tools";
    header.appendChild(bar);
    document.body.prepend(header);

    // Event handlers
    document.getElementById("btnHubCopy").addEventListener("click", copyCleanHtml);
    document.getElementById("btnHubMode").addEventListener("click", toggleMode);
    document.getElementById("btnHubFont").addEventListener("click", toggleFont);

    const themeBtn = document.getElementById("btnHubTheme");
    const dropdown = document.getElementById("hub-theme-dropdown");

    themeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === "flex";
      dropdown.style.display = isVisible ? "none" : "flex";
      themeBtn.setAttribute("aria-expanded", String(!isVisible));
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#hub-theme-toolbar")) {
        closeThemeDropdown();
      }
    });

    bar.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && themeBtn.getAttribute("aria-expanded") === "true") {
        closeThemeDropdown();
        themeBtn.focus();
      }
    });

    dropdown.querySelectorAll(".hub-theme-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        setTheme(item.dataset.theme);
      });
    });

    updateModeButton();
    updateFontButton();
    updateActiveThemeItem();
  }

  // Auto initialize
  injectStyles();
  initPreferences();
  if (document.body) {
    renderToolbar();
  } else {
    document.addEventListener("DOMContentLoaded", renderToolbar, { once: true });
  }
})();
