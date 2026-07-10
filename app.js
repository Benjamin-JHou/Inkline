/* ============================================================
   Inkline — application logic
   Pure vanilla JS. Live render / auto-save / export / PWA / i18n.
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const editor    = $("#editor");
  const preview   = $("#preview");
  const workspace = $(".workspace");
  const toastEl   = $("#toast");
  const statWords = $("#stat-words");
  const statSaved = $("#stat-saved");
  const statInstall = $("#stat-install");
  const langLabel = $("#lang-label");
  const langBtn   = $("#btn-lang");

  const STORAGE_KEY = "inkline.doc.v1";
  const THEME_KEY   = "inkline.theme.v1";
  const LANG_KEY    = "inkline.lang.v1";

  /* ---------- i18n ---------- */
  const I18N = {
    en: {
      tab_write:    "Write",
      tab_preview:  "Preview",
      export:       "Export",
      export_md:    "Markdown (.md)",
      export_html:  "HTML (single file)",
      export_pdf:   "PDF (print)",
      placeholder:  "# Start writing here\n\nSupports **Markdown**, `code`, tables, task lists…\nEverything you type is saved locally.",
      saved:        "Saved",
      saving:       "Saving…",
      save_fail:    "Save failed",
      words:        "words",
      word:         "word",
      install:      "＋ Install",
      installed:    "Installed",
      toast_md:     "Markdown exported",
      toast_html:   "HTML exported",
      toast_pdf:    "Opening print dialog… choose «Save as PDF»",
      toast_installed: "Installed to home screen",
      lang_title:   "Switch language / 切换语言",
      theme_title:  "Toggle theme",
      sample_title: "Welcome to Inkline",
      sample_body:  "*Between ink and paper, for writing alone.* Write on the left, see it typeset on the right in real time.",
      sample_h2:    "What it does",
      sample_li1:   "**Live preview** — WYSIWYG typographic beauty",
      sample_li2:   "**Local-first** — content auto-saved on your device",
      sample_li3:   "**One-tap export** — `.md` source, standalone `.html`, or refined `PDF`",
      sample_li4:   "**Installable** — add to home screen, open like a native app",
      sample_quote: "Writing is the craft of placing thoughts onto paper.",
      sample_h2_syntax: "Syntax glance",
      sample_code_comment: "// try editing the code",
      sample_table_h1: "Feature",
      sample_table_h2: "Supported",
      sample_task1: "Write your first paragraph",
      sample_task2: "Export as PDF",
      sample_end:   "Now clear this text and write your own.",
      doc_default:  "inkline-document",
      lang_label_next: "中",
    },
    zh: {
      tab_write:    "写作",
      tab_preview:  "预览",
      export:       "导出",
      export_md:    "Markdown（.md）",
      export_html:  "HTML（单文件）",
      export_pdf:   "PDF（打印）",
      placeholder:  "# 从这里开始写作\n\n支持 **Markdown** 语法、`代码`、表格、任务列表……\n写下的一切都会自动保存在本地。",
      saved:        "已保存",
      saving:       "保存中…",
      save_fail:    "保存失败",
      words:        "字",
      word:         "字",
      install:      "＋ 安装到桌面",
      installed:    "已安装",
      toast_md:     "已导出 Markdown",
      toast_html:   "已导出 HTML",
      toast_pdf:    "正在准备打印… 请在对话框中选择「另存为 PDF」",
      toast_installed: "已安装到桌面",
      lang_title:   "切换语言 / Switch language",
      theme_title:  "切换主题",
      sample_title: "欢迎来到 Inkline",
      sample_body:  "*纸墨之间，只为写作。* 左侧书写，右侧即时成排。",
      sample_h2:    "它能做什么",
      sample_li1:   "**实时预览**：所见即所得的排版美学",
      sample_li2:   "**本地优先**：内容自动保存在你的设备",
      sample_li3:   "**一键导出**：`.md` 源文件、单文件 `.html`、或精排 `PDF`",
      sample_li4:   "**可安装**：加到手机主屏，像原生 App 一样打开",
      sample_quote: "写作是把思绪安放在纸面上的手艺。",
      sample_h2_syntax: "语法一览",
      sample_code_comment: "// 试着修改下面的代码",
      sample_table_h1: "功能",
      sample_table_h2: "支持",
      sample_task1: "写下第一段文字",
      sample_task2: "导出为 PDF",
      sample_end:   "现在清空这段文字，写下你自己的东西吧。",
      doc_default:  "inkline-文档",
      lang_label_next: "EN",
    },
  };

  let lang = "en";

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function applyLang(newLang) {
    lang = newLang;
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });
    langLabel.textContent = t("lang_label_next");
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    // If showing the sample doc, re-render it in the new language.
    if (editor.value === buildSample("en") || editor.value === buildSample("zh")) {
      editor.value = buildSample(lang);
      render();
      persist();
    } else {
      updateWordCount();
    }
  }

  (function initLang() {
    let l = null;
    try { l = localStorage.getItem(LANG_KEY); } catch (_) {}
    if (!l || (l !== "en" && l !== "zh")) l = "en";
    applyLang(l);
  })();

  langBtn.addEventListener("click", () => {
    applyLang(lang === "en" ? "zh" : "en");
  });

  /* ---------- Sample document ---------- */
  function buildSample(l) {
    const s = I18N[l];
    return `# ${s.sample_title}

${s.sample_body}

## ${s.sample_h2}

- ${s.sample_li1}
- ${s.sample_li2}
- ${s.sample_li3}
- ${s.sample_li4}

> ${s.sample_quote}

## ${s.sample_h2_syntax}

\`\`\`js
${s.sample_code_comment}
function greet(name) {
  return \`Hello, \${name}\`;
}
\`\`\`

| ${s.sample_table_h1} | ${s.sample_table_h2} |
| --- | --- |
| ✅ | ✅ |

- [x] ${s.sample_task1}
- [ ] ${s.sample_task2}

---

${s.sample_end}`;
  }

  /* ---------- Markdown renderer ---------- */
  const md = window.markdownit({
    html: false,
    linkify: true,
    typographer: true,
    breaks: false,
    highlight: function (str, lang) {
      if (lang && window.hljs && window.hljs.getLanguage(lang)) {
        try {
          return '<pre><code class="hljs language-' + lang + '">' +
            window.hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
            '</code></pre>';
        } catch (_) {}
      }
      return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    },
  });

  /* ---------- Core: render + persist ---------- */
  let saveTimer = null;

  function render() {
    preview.innerHTML = md.render(editor.value || "");
    updateWordCount();
  }

  function updateWordCount() {
    const text = editor.value || "";
    const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    const words = (text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
    const total = cjk + words;
    statWords.textContent = total + " " + t(total === 1 ? "word" : "words");
  }

  function persist() {
    statSaved.textContent = t("saving");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, editor.value);
        statSaved.textContent = t("saved");
      } catch (_) {
        statSaved.textContent = t("save_fail");
      }
    }, 400);
  }

  function load() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    editor.value = (saved !== null && saved !== undefined) ? saved : buildSample(lang);
    render();
  }

  /* ---------- Editor events ---------- */
  editor.addEventListener("input", () => { render(); persist(); });

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart, en = editor.selectionEnd;
      editor.value = editor.value.slice(0, s) + "  " + editor.value.slice(en);
      editor.selectionStart = editor.selectionEnd = s + 2;
      render(); persist();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      exportMarkdown();
    }
  });

  /* ---------- View tabs (mobile) ---------- */
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tt) => {
        tt.classList.remove("is-active");
        tt.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      workspace.setAttribute("data-mode", tab.dataset.view);
      if (tab.dataset.view === "read") render();
    });
  });

  /* ---------- Theme ---------- */
  const lightCss = $("#hljs-light"), darkCss = $("#hljs-dark");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]')
      .setAttribute("content", theme === "dark" ? "#1a1e24" : "#faf8f3");
    lightCss.disabled = theme === "dark";
    darkCss.disabled  = theme !== "dark";
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }

  (function initTheme() {
    let th = null;
    try { th = localStorage.getItem(THEME_KEY); } catch (_) {}
    if (!th) th = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(th);
  })();

  $("#btn-theme").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  });

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
      setTimeout(() => (toastEl.hidden = true), 300);
    }, 2200);
  }

  /* ---------- Filename helper ---------- */
  function docTitle() {
    const m = (editor.value || "").match(/^#\s+(.+)$/m);
    let name = m ? m[1].trim() : t("doc_default");
    name = name.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 60);
    return name || t("doc_default");
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /* ---------- Exports ---------- */
  function exportMarkdown() {
    download(docTitle() + ".md", editor.value || "", "text/markdown");
    toast(t("toast_md"));
  }

  function exportHTML() {
    const bodyHtml = md.render(editor.value || "");
    const css = standaloneCss();
    const html =
`<!DOCTYPE html>
<html lang="${lang === "zh" ? "zh-CN" : "en"}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(docTitle())}</title>
<style>${css}</style>
</head>
<body>
<article class="prose">
${bodyHtml}
</article>
</body>
</html>`;
    download(docTitle() + ".html", html, "text/html");
    toast(t("toast_html"));
  }

  function exportPDF() {
    render();
    const prevMode = workspace.getAttribute("data-mode");
    workspace.setAttribute("data-mode", "read");
    toast(t("toast_pdf"));
    setTimeout(() => {
      window.print();
      workspace.setAttribute("data-mode", prevMode);
    }, 250);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Standalone HTML stylesheet (inlined) ---------- */
  function standaloneCss() {
    return `
:root{--paper:#faf8f3;--ink:#2b2823;--ink-soft:#5c574e;--line:#e3ded2;--indigo:#3a4a5c;--ochre:#b06b34;--sunken:#f2efe7}
@media(prefers-color-scheme:dark){:root{--paper:#1a1e24;--ink:#e8e3d8;--ink-soft:#b3ab9d;--line:#2c333d;--indigo:#7fa0c0;--ochre:#d69a63;--sunken:#151920}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:Georgia,"Songti SC",serif;-webkit-font-smoothing:antialiased}
.prose{max-width:46rem;margin:0 auto;padding:56px 24px 96px;font-size:18px;line-height:1.78}
.prose>*:first-child{margin-top:0}
h1,h2,h3,h4{line-height:1.25;font-weight:600;margin:1.9em 0 .6em}
h1{font-size:2em;margin-top:.2em}
h2{font-size:1.5em;border-bottom:1px solid var(--line);padding-bottom:.2em}
h3{font-size:1.24em}
p{margin:0 0 1.1em}
a{color:var(--indigo);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--indigo) 40%,transparent)}
strong{font-weight:650}em{color:var(--ink-soft)}
blockquote{margin:1.4em 0;padding:.2em 1.2em;border-left:3px solid var(--ochre);color:var(--ink-soft);font-style:italic}
ul,ol{padding-left:1.5em;margin:0 0 1.1em}li{margin:.35em 0}li::marker{color:var(--ochre)}
code{font-family:ui-monospace,Menlo,monospace;font-size:.86em;background:var(--sunken);padding:.18em .42em;border-radius:5px;border:1px solid var(--line)}
pre{margin:1.4em 0;padding:18px 20px;background:var(--sunken);border:1px solid var(--line);border-radius:10px;overflow-x:auto;font-size:14px;line-height:1.6}
pre code{background:none;border:0;padding:0}
table{width:100%;border-collapse:collapse;margin:1.4em 0;font-family:system-ui,sans-serif;font-size:.92em}
th,td{padding:9px 14px;border:1px solid var(--line);text-align:left}th{background:var(--sunken)}
hr{border:0;height:1px;background:var(--line);margin:2.4em 0}
img{max-width:100%;border-radius:10px}
`.trim();
  }

  /* ---------- Export menu wiring ---------- */
  const exportBtn  = $("#btn-export");
  const exportMenu = $("#export-menu");

  function closeMenu() {
    exportMenu.hidden = true;
    exportBtn.setAttribute("aria-expanded", "false");
  }
  exportBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = exportMenu.hidden;
    exportMenu.hidden = !open;
    exportBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!exportMenu.hidden && !e.target.closest(".menu")) closeMenu();
  });
  exportMenu.querySelectorAll("[data-export]").forEach((b) => {
    b.addEventListener("click", () => {
      const kind = b.dataset.export;
      closeMenu();
      if (kind === "md") exportMarkdown();
      else if (kind === "html") exportHTML();
      else if (kind === "pdf") exportPDF();
    });
  });

  /* ---------- PWA: install prompt ---------- */
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    statInstall.textContent = t("install");
    statInstall.onclick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      statInstall.textContent = "";
    };
  });
  window.addEventListener("appinstalled", () => {
    statInstall.textContent = "";
    toast(t("toast_installed"));
  });

  /* ---------- Service worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  /* ---------- Boot ---------- */
  load();
})();
