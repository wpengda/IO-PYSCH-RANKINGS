(() => {
  const FEEDBACK_FORM_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSco-_VbMsAgw0Qgz3H2d4-yFXM68cbcLk00zZdiM1RIEtegEQ/viewform";

  const COPY = {
    rankings: {
      title: "IO Psychology Rankings",
      intro:
        "IO Psychology Rankings is a metrics-based ranking of top industrial-organizational psychology programs based on faculty publications in selective journals.",
    },
    network: {
      title: "IO Psychology Network",
      intro:
        "IO Psychology Network maps coauthorship among faculty at U.S. and Canadian industrial-organizational psychology programs, using papers in selective journals.",
    },
  };

  const brandLink = document.getElementById("brandLink");
  const brandTitle = document.getElementById("brandTitle");
  const siteIntro = document.getElementById("siteIntro");
  const tabRankings = document.getElementById("tabRankings");
  const tabNetwork = document.getElementById("tabNetwork");
  const viewRankings = document.getElementById("view-rankings");
  const viewNetwork = document.getElementById("view-network");

  function viewFromHash() {
    return location.hash === "#network" ? "network" : "rankings";
  }

  function urlFor(view) {
    const path = `${location.pathname}${location.search}`;
    return view === "network" ? `${path}#network` : path;
  }

  let current = null;

  function apply(view) {
    if (current === view) return;
    current = view;
    const isNet = view === "network";
    const copy = COPY[view];
    document.body.classList.toggle("is-network", isNet);
    document.body.classList.toggle("is-rankings", !isNet);
    document.title = copy.title;
    if (brandTitle) brandTitle.textContent = copy.title;
    if (brandLink) brandLink.setAttribute("href", view === "network" ? "#network" : "#rankings");
    if (siteIntro) siteIntro.textContent = copy.intro;
    const howLink = document.getElementById("howLink");
    if (howLink) {
      howLink.href = isNet ? "doc.html?p=network" : "doc.html?p=ranking";
      howLink.textContent = isNet ? "How we network" : "How we rank";
    }
    tabRankings?.classList.toggle("is-active", !isNet);
    tabNetwork?.classList.toggle("is-active", isNet);
    tabRankings?.setAttribute("aria-current", isNet ? "false" : "page");
    tabNetwork?.setAttribute("aria-current", isNet ? "page" : "false");
    if (viewRankings) viewRankings.hidden = isNet;
    if (viewNetwork) viewNetwork.hidden = !isNet;
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("site-view", { detail: view }));
    });
  }

  function go(view, replace) {
    const url = urlFor(view);
    const here = `${location.pathname}${location.search}${location.hash}`;
    if (here !== url) {
      if (replace) history.replaceState({ view }, "", url);
      else history.pushState({ view }, "", url);
    }
    apply(view);
  }

  tabRankings?.addEventListener("click", (ev) => {
    ev.preventDefault();
    go("rankings");
  });
  tabNetwork?.addEventListener("click", (ev) => {
    ev.preventDefault();
    go("network");
  });
  brandLink?.addEventListener("click", (ev) => {
    ev.preventDefault();
    go(viewFromHash());
  });

  window.addEventListener("hashchange", () => apply(viewFromHash()));
  window.addEventListener("popstate", () => apply(viewFromHash()));

  document.querySelectorAll('a[href="network.html"], a[href="#network"]').forEach((a) => {
    if (a === tabNetwork) return;
    a.setAttribute("href", "#network");
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      go("network");
    });
  });

  go(viewFromHash(), true);

  const feedbackUrl = String(FEEDBACK_FORM_URL || "").trim();
  const headerFeedback = document.getElementById("feedbackLink");
  if (headerFeedback) {
    if (feedbackUrl) {
      headerFeedback.href = feedbackUrl;
      headerFeedback.target = "_blank";
      headerFeedback.rel = "noopener noreferrer";
      headerFeedback.classList.remove("is-soon");
      headerFeedback.removeAttribute("aria-disabled");
      headerFeedback.title = "Send feedback";
    } else {
      headerFeedback.removeAttribute("href");
      headerFeedback.setAttribute("role", "link");
      headerFeedback.setAttribute("aria-disabled", "true");
      headerFeedback.classList.add("is-soon");
      headerFeedback.title = "Google Form coming soon";
      headerFeedback.addEventListener("click", (ev) => ev.preventDefault());
    }
  }
})();
