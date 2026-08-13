(() => {
  const PAGES = {
    methodology: { file: "docs/methodology.md", title: "Methodology" },
    "faculty-roster": { file: "docs/faculty-roster.md", title: "Faculty roster" },
    faq: { file: "docs/faq.md", title: "FAQ" },
    contributing: { file: "docs/contributing.md", title: "Contributing" },
  };

  const REPO_BLOB =
    "https://github.com/wpengda/IO-PYSCH-RANKINGS/blob/main/";

  const body = document.getElementById("docBody");
  const params = new URLSearchParams(location.search);
  const key = params.get("p") || "methodology";
  const page = PAGES[key];

  document.querySelectorAll(".doc-nav a").forEach((a) => {
    if (a.dataset.page === key) a.classList.add("active");
  });

  function rewriteHref(href) {
    if (!href) return href;
    if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) return href;

    const md = href.match(/(?:^|\/)?([a-z0-9-]+)\.md(?:#.*)?$/i);
    if (md && PAGES[md[1]]) {
      const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
      return `doc.html?p=${md[1]}${hash}`;
    }

    const data = href.match(/^(?:\.\.\/)*(data\/.+)$/i);
    if (data) return REPO_BLOB + data[1];

    const gh = href.match(/^(?:\.\.\/)*(\.github\/.+)$/i);
    if (gh) return REPO_BLOB + gh[1];

    return href;
  }

  async function load() {
    if (!page) {
      body.innerHTML =
        '<p>Unknown page. Try <a href="doc.html?p=faq">FAQ</a>.</p>';
      return;
    }
    document.title = `${page.title} · IO Psychology Rankings`;
    try {
      const res = await fetch(`${page.file}?v=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const md = await res.text();
      marked.use({
        gfm: true,
        breaks: false,
        walkTokens(token) {
          if (token.type === "link") token.href = rewriteHref(token.href);
        },
      });
      body.innerHTML = marked.parse(md);
    } catch (err) {
      body.innerHTML = `<p class="doc-error">Could not load this page (${String(
        err.message || err
      )}).</p>`;
    }
  }

  load();
})();
