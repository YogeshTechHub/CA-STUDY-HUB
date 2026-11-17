// navigation-bar.js
// Universal Floating Top Navigation & Utility Bar for CA Study Hub
// Strictly implements GEMINI.md requirements:
// 1. Back to Dashboard Button (← Dashboard) pointing to ./index.html
// 2. Small Copy/Duplicate HTML Icon Button (📋) with "Copied!" feedback
// 3. Dark / Light Mode Toggle (☀️ / 🌙) remembering preference in localStorage
// 4. Theme Switcher Icon (🎨) with 4 eye-friendly themes:
//    - Classic Minimalist (default)
//    - Warm Paper / Sepia
//    - Calm Sage Green
//    - Soft Slate Blue

(function() {
  const THEMES = [
    { id: "classic", name: "Classic Minimalist", icon: "fa-circle-half-stroke" },
    { id: "sepia", name: "Warm Sepia / Paper", icon: "fa-book-open" },
    { id: "sage", name: "Calm Sage Green", icon: "fa-leaf" },
    { id: "slate", name: "Soft Slate Blue", icon: "fa-water" }
  ];

  function injectNavStyles() {
    if (document.getElementById("study-hub-nav-styles")) return;
    const style = document.createElement("style");
    style.id = "study-hub-nav-styles";
    style.textContent = `
      /* Theme definitions across Light and Dark modes */
      :root {
        --nav-bg: rgba(15, 23, 42, 0.88);
        --nav-border: rgba(255, 255, 255, 0.14);
        --nav-text: #f8fafc;
        --nav-text-muted: #94a3b8;
        --nav-hover: rgba(255, 255, 255, 0.1);
      }

      /* 1. Theme: Classic Minimalist (Dark default, Crisp Light) */
      [data-theme-style="classic"] {
        /* uses base default theme definitions */
      }
      [data-theme="light"][data-theme-style="classic"] {
        --bg-primary: #f8fafc;
        --bg-secondary: #f1f5f9;
        --bg-card: #ffffff;
        --bg-card-hover: #f8fafc;
        --border-color: #cbd5e1;
        --border-subtle: #e2e8f0;
        --text-main: #0f172a;
        --text-muted: #334155;
        --text-dim: #64748b;
        --accent-blue: #1d4ed8;
      }

      /* 2. Theme: Warm Paper / Sepia (Eye-friendly reading) */
      [data-theme-style="sepia"] {
        --bg-primary: #1c1815;
        --bg-secondary: #26211c;
        --bg-card: #2e2823;
        --bg-card-hover: #38312b;
        --border-color: #4a3e35;
        --border-subtle: #3d342c;
        --text-main: #f5eedc;
        --text-muted: #d6caa7;
        --text-dim: #a8997c;
        --accent-blue: #d97706;
        --accent-emerald: #10b981;
      }
      [data-theme="light"][data-theme-style="sepia"] {
        --bg-primary: #fbf7ee;
        --bg-secondary: #f4ecdc;
        --bg-card: #ffffff;
        --bg-card-hover: #faf5e8;
        --border-color: #dcd0b8;
        --border-subtle: #e8dfcc;
        --text-main: #2b2118;
        --text-muted: #574637;
        --text-dim: #7a6652;
        --accent-blue: #b45309;
        --accent-emerald: #047857;
      }

      /* 3. Theme: Calm Sage Green (Relaxing study atmosphere) */
      [data-theme-style="sage"] {
        --bg-primary: #0f1715;
        --bg-secondary: #162420;
        --bg-card: #1c2e29;
        --bg-card-hover: #233b35;
        --border-color: #2e4d44;
        --border-subtle: #243d36;
        --text-main: #e6f4f1;
        --text-muted: #b0d4cc;
        --text-dim: #7da89e;
        --accent-blue: #14b8a6;
        --accent-emerald: #10b981;
      }
      [data-theme="light"][data-theme-style="sage"] {
        --bg-primary: #f2f8f6;
        --bg-secondary: #e3efec;
        --bg-card: #ffffff;
        --bg-card-hover: #f5faf9;
        --border-color: #bedbd4;
        --border-subtle: #cfe4df;
        --text-main: #132a24;
        --text-muted: #284c42;
        --text-dim: #4c776b;
        --accent-blue: #0d9488;
        --accent-emerald: #059669;
      }

      /* 4. Theme: Soft Slate Blue (Balanced & Elegant) */
      [data-theme-style="slate"] {
        --bg-primary: #0b1329;
        --bg-secondary: #131f40;
        --bg-card: #182852;
        --bg-card-hover: #20346b;
        --border-color: #2b437f;
        --border-subtle: #203566;
        --text-main: #e2e8f0;
        --text-muted: #cbd5e1;
        --text-dim: #94a3b8;
        --accent-blue: #60a5fa;
        --accent-emerald: #34d399;
      }
      [data-theme="light"][data-theme-style="slate"] {
        --bg-primary: #f0f4f9;
        --bg-secondary: #e2eaf4;
        --bg-card: #ffffff;
        --bg-card-hover: #f8fafc;
        --border-color: #c7d5e8;
        --border-subtle: #dbe4f0;
        --text-main: #0f172a;
        --text-muted: #2d3e58;
        --text-dim: #546884;
        --accent-blue: #2563eb;
        --accent-emerald: #059669;
      }

      /* Top Utility Bar - Floating & Sticky */
      #study-hub-utility-bar {
        position: fixed;
        top: 12px;
        left: 16px;
        z-index: 99998;
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--nav-bg);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--nav-border);
        padding: 5px 10px;
        border-radius: 9999px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--nav-text);
        transition: all 0.25s ease;
      }
      [data-theme="light"] #study-hub-utility-bar {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #cbd5e1;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        color: #0f172a;
      }

      .nav-btn {
        background: transparent;
        border: none;
        color: inherit;
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        min-width: 36px;
        min-height: 36px;
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
      .nav-btn:hover {
        background: rgba(125, 125, 125, 0.15);
      }
      .nav-btn:active {
        transform: scale(0.95);
      }
      .nav-btn.nav-dashboard-link {
        color: #3b82f6;
        font-weight: 700;
        padding-left: 12px;
        padding-right: 12px;
      }
      [data-theme="light"] .nav-btn.nav-dashboard-link {
        color: #1d4ed8;
      }

      .nav-divider {
        width: 1px;
        height: 20px;
        background: var(--nav-border);
      }
      [data-theme="light"] .nav-divider {
        background: #cbd5e1;
      }

      /* Theme Popover Menu */
      #theme-palette-menu {
        position: absolute;
        top: calc(100% + 8px);
        left: 70px;
        background: var(--bg-card, #162032);
        border: 1px solid var(--border-color, #2a3a54);
        border-radius: 12px;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45);
        padding: 6px;
        display: none;
        flex-direction: column;
        gap: 4px;
        min-width: 190px;
        z-index: 100000;
      }
      [data-theme="light"] #theme-palette-menu {
        background: #ffffff;
        border-color: #cbd5e1;
        box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      }
      .theme-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: var(--text-main, #f8fafc);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        text-align: left;
        transition: background 0.15s;
      }
      .theme-item:hover {
        background: var(--bg-card-hover, rgba(255, 255, 255, 0.08));
      }
      .theme-item.active {
        background: rgba(59, 130, 246, 0.15);
        color: var(--accent-blue, #60a5fa);
      }

      /* Copy notification toast */
      #study-copy-toast {
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%) translateY(-10px);
        background: #10b981;
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        padding: 6px 16px;
        border-radius: 9999px;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
        opacity: 0;
        pointer-events: none;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 100001;
      }
      #study-copy-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        #study-hub-utility-bar {
          top: 10px;
          left: 10px;
          gap: 4px;
          padding: 4px 6px;
        }
        .nav-btn {
          min-width: 32px;
          min-height: 32px;
          padding: 0 6px;
          font-size: 12px;
        }
        .nav-btn span.label-text {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function initThemes() {
    const savedMode = localStorage.getItem("ca_hub_color_mode") || "dark";
    const savedStyle = localStorage.getItem("ca_hub_theme_style") || "classic";
    document.documentElement.setAttribute("data-theme", savedMode);
    document.documentElement.setAttribute("data-theme-style", savedStyle);
  }

  function toggleLightDarkMode() {
    const currentMode = document.documentElement.getAttribute("data-theme") || "dark";
    const newMode = currentMode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newMode);
    localStorage.setItem("ca_hub_color_mode", newMode);
    updateToggleIcon();
  }

  function updateToggleIcon() {
    const btn = document.getElementById("btnNavLightDark");
    if (!btn) return;
    const mode = document.documentElement.getAttribute("data-theme") || "dark";
    btn.innerHTML = mode === "dark" ? `☀️` : `🌙`;
    btn.title = mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
  }

  function selectThemeStyle(styleId) {
    document.documentElement.setAttribute("data-theme-style", styleId);
    localStorage.setItem("ca_hub_theme_style", styleId);
    updateThemeMenuSelection();
    const menu = document.getElementById("theme-palette-menu");
    if (menu) menu.style.display = "none";
  }

  function updateThemeMenuSelection() {
    const active = document.documentElement.getAttribute("data-theme-style") || "classic";
    document.querySelectorAll(".theme-item").forEach(item => {
      if (item.dataset.themeId === active) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  function showToast(msg = "Copied to clipboard!") {
    let toast = document.getElementById("study-copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "study-copy-toast";
      document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  async function copyCleanHtmlStructure() {
    try {
      // Clone root and strip non-template/dynamic script tags
      const clone = document.documentElement.cloneNode(true);
      const scripts = clone.querySelectorAll("#sync-engine-styles, #study-hub-nav-styles, #study-hub-utility-bar, #sync-topbar, #study-highlight-toolbar, #study-copy-toast, #theme-palette-menu");
      scripts.forEach(s => s.remove());

      const fullHtml = "<!DOCTYPE html>\n" + clone.outerHTML;
      await navigator.clipboard.writeText(fullHtml);
      showToast("📋 Clean HTML Structure Copied!");
    } catch (err) {
      console.error("Copy failed:", err);
      showToast("Failed to copy automatically");
    }
  }

  function injectUtilityBar() {
    // Exclude master dashboard index.html per GEMINI.md rule 1
    const path = window.location.pathname.split("/").pop();
    if (path === "index.html" || path === "") {
      return;
    }
    if (document.getElementById("study-hub-utility-bar")) return;

    const bar = document.createElement("div");
    bar.id = "study-hub-utility-bar";
    bar.innerHTML = `
      <a href="./index.html" class="nav-btn nav-dashboard-link" title="Return to Master Study Hub">
        <i class="fa-solid fa-arrow-left"></i>
        <span class="label-text">Dashboard</span>
      </a>

      <div class="nav-divider"></div>

      <button class="nav-btn" id="btnNavCopyHtml" title="Copy clean HTML structure to reuse layout">
        📋
      </button>

      <button class="nav-btn" id="btnNavLightDark" title="Toggle Light/Dark Mode">
        ☀️
      </button>

      <button class="nav-btn" id="btnNavThemePalette" title="Switch Eye-Friendly Color Theme">
        🎨
      </button>

      <div id="theme-palette-menu">
        ${THEMES.map(t => `
          <button class="theme-item" data-theme-id="${t.id}">
            <i class="fa-solid ${t.icon}"></i>
            <span>${t.name}</span>
          </button>
        `).join("")}
      </div>
    `;

    document.body.appendChild(bar);

    // Event handlers
    document.getElementById("btnNavLightDark").addEventListener("click", toggleLightDarkMode);
    document.getElementById("btnNavCopyHtml").addEventListener("click", copyCleanHtmlStructure);

    const paletteBtn = document.getElementById("btnNavThemePalette");
    const paletteMenu = document.getElementById("theme-palette-menu");

    paletteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = paletteMenu.style.display === "flex";
      paletteMenu.style.display = isVisible ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#study-hub-utility-bar")) {
        paletteMenu.style.display = "none";
      }
    });

    paletteMenu.querySelectorAll(".theme-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        selectThemeStyle(item.dataset.themeId);
      });
    });

    updateToggleIcon();
    updateThemeMenuSelection();
  }

  // Initialize
  injectNavStyles();
  initThemes();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUtilityBar);
  } else {
    injectUtilityBar();
  }
})();
