(() => {
  const PAGES = {
    ranking: { file: "docs/ranking.md", title: "How we rank" },
    methodology: { file: "docs/ranking.md", title: "How we rank" },
    network: { file: "docs/network.md", title: "How we network" },
    faq: { file: "docs/faq.md", title: "FAQ" },
  };
  const ALIASES = { methodology: "ranking" };

  const REPO_BLOB =
    "https://github.com/wpengda/IO-PYSCH-RANKINGS/blob/main/";

  const body = document.getElementById("docBody");
  const params = new URLSearchParams(location.search);
  const rawKey = params.get("p") || "ranking";
  const key = ALIASES[rawKey] || rawKey;
  const navLink = document.querySelector(`.doc-nav a[data-page="${key}"]`);
  const page = navLink?.dataset.file
    ? { file: navLink.dataset.file, title: navLink.dataset.title || key }
    : PAGES[key];

  document.querySelectorAll(".doc-nav a").forEach((a) => {
    if (a.dataset.page === key) a.classList.add("active");
  });

  function rewriteHref(href) {
    if (!href) return href;
    if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) return href;

    const md = href.match(/(?:^|\/)?([a-z0-9-]+)\.md(?:#.*)?$/i);
    if (md && (PAGES[md[1]] || ALIASES[md[1]])) {
      const pageKey = ALIASES[md[1]] || md[1];
      const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
      return `doc.html?p=${pageKey}${hash}`;
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
