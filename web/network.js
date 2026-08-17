(() => {
  const VENUE_SHORT = {
    jap: "JAP",
    pp: "PPsych",
    obhdp: "OBHDP",
    job: "JOB",
    lq: "LQ",
    orm: "ORM",
    jvb: "JVB",
    johp: "JOHP",
    hrm: "HRM",
    hrmj: "HRMJ",
    hrmr: "HRMR",
    ijhrm: "IJHRM",
    perrev: "Pers Rev",
    hrdq: "HRDQ",
    jlos: "JLOS",
    cdi: "CDI",
    war: "WAR",
    jbp: "JBP",
    ejwop: "EJWOP",
    joop: "JOOP",
    iop: "IOP",
    was: "Work & Stress",
    ijsa: "IJSA",
    apir: "Appl. Psych",
    opr: "OPR",
    gom: "GOM",
    pm: "Psych Methods",
    ampps: "AMPPS",
    jom: "JoM",
    amj: "AMJ",
    amr: "AMR",
    asq: "ASQ",
    ms: "Mgmt Sci",
    os: "Org Sci",
    smj: "SMJ",
    jms: "JMS",
    hr: "Hum Relat",
    ostud: "Org Studies",
    aoma: "AOM Annals",
    amd: "AMD",
    jpsp: "JPSP",
    psci: "Psych Sci",
    pbul: "Psych Bull",
    nhb: "Nat Hum Behav",
    nrp: "Nat Rev Psych",
    nature: "Nature",
    science: "Science",
    pnas: "PNAS",
    ncomms: "Nat Commun",
    chb: "CHB",
    aropob: "AROPOB",
    odyn: "Org Dyn",
    assess: "Assessment",
    brm: "BRM",
    epm: "EPM",
    mbr: "MBR",
    pas: "Psych Assess",
    pmetrika: "Psychometrika",
    smr: "SMR",
    ampsych: "Am Psychol",
    arp: "ARP",
    cdps: "Curr Dir",
    pps: "Perspect Psych Sci",
    prev: "Psych Rev",
    pspi: "PSPI",
    jepg: "JEP:Gen",
    jdm: "JDM",
    pspb: "PSPB",
    pspr: "PSPR",
    jpers: "J Pers",
    jrp: "JRP",
    paid: "PAID",
    intel: "Intelligence",
    lid: "LID",
    jasp: "JASP",
    jca: "JCA",
    jcouns: "J Couns Psych",
    jedu: "J Educ Psych",
    hf: "Hum Factors",
    jhp: "J Health Psych",
    page: "Psych Aging",
    mil: "Mil Psych",
    jmp: "J Manag Psychol",
    sah: "Stress & Health",
    ijsm: "IJSM",
    hbr: "HBR",
  };

  const FALLBACK_DISCIPLINES = [
    { id: "io", label: "I-O / Work Psychology" },
    { id: "ob_mgmt", label: "OB / Management" },
    { id: "methods", label: "Methods / Measurement / Psychometrics" },
    { id: "general_psych", label: "General / Experimental / Decision Psychology" },
    { id: "social_id", label: "Social / Individual Differences" },
    { id: "career", label: "Career / Vocational / Counseling / Educational Psychology" },
    { id: "applied", label: "Human Factors / Health / Aging / Technology" },
  ];

  const canvas = document.getElementById("netCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const els = {
    search: document.getElementById("netSearch"),
    programSearch: document.getElementById("programSearch"),
    allAreas: document.getElementById("netAllAreas"),
    areaTree: document.getElementById("netAreaTree"),
    countries: document.getElementById("netCountries"),
    yearFrom: document.getElementById("netYearFrom"),
    yearTo: document.getElementById("netYearTo"),
    yearFromOut: document.getElementById("netYearFromOut"),
    yearToOut: document.getElementById("netYearToOut"),
    yearFill: document.getElementById("netYearFill"),
    minWeight: document.getElementById("minWeight"),
    minDegree: document.getElementById("minDegree"),
    status: document.getElementById("netStatus"),
    pop: document.getElementById("netPop"),
    popBody: document.getElementById("netPopBody"),
    popClose: document.getElementById("netPopClose"),
    stage: canvas.parentElement,
    journalsBtn: document.getElementById("netJournalsBtn"),
    journalsDialog: document.getElementById("netJournalsDialog"),
    journalsClose: document.getElementById("netJournalsClose"),
    journalsDone: document.getElementById("netJournalsDone"),
    venuesTree: document.getElementById("netVenuesTree"),
    venuesAll: document.getElementById("netVenuesAll"),
    venuesQ1: document.getElementById("netVenuesQ1"),
    venuesAstar: document.getElementById("netVenuesAstar"),
    venuesA: document.getElementById("netVenuesA"),
    venuesNone: document.getElementById("netVenuesNone"),
    venuesCount: document.getElementById("netVenuesCount"),
    tourBtn: document.getElementById("netTourBtn"),
    tourRoot: document.getElementById("netTourRoot"),
    tourSpotlight: document.getElementById("netTourSpotlight"),
    tourPopover: document.getElementById("netTourPopover"),
    tourTitle: document.getElementById("netTourTitle"),
    tourBody: document.getElementById("netTourBody"),
    tourProgress: document.getElementById("netTourProgress"),
    tourBack: document.getElementById("netTourBack"),
    tourNext: document.getElementById("netTourNext"),
    tourSkip: document.getElementById("netTourSkip"),
    tourArrow: document.getElementById("netTourArrow"),
  };

  function tourEl(selector) {
    if (!selector) return null;
    if (
      selector.includes('data-tour="network"') ||
      selector.includes('data-tour="rankings"')
    ) {
      return document.querySelector(selector);
    }
    const root = document.getElementById("view-network");
    return (root || document).querySelector(selector);
  }

  const state = {
    nodes: [],
    edges: [],
    venues: [],
    selectedVenues: new Set(),
    selectedAreas: new Set(),
    domains: [],
    disciplines: [],
    areas: [],
    yearMin: 1973,
    yearMax: 2026,
    yearFrom: 2017,
    yearTo: 2026,
    minWeight: 1,
    minDegree: 1,
    query: "",
    programQuery: "",
    selected: null,
    hover: null,
    transform: { x: 0, y: 0, k: 1 },
    dragging: null,
    panning: null,
    running: true,
  };

  function hashHue(id) {
    let h = 0;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h % 360;
  }

  function colorFor(instId) {
    return `hsl(${hashHue(instId)} 48% 42%)`;
  }

  function nodeAffiliations(n) {
    if (Array.isArray(n.institutions) && n.institutions.length) return n.institutions;
    if (!n.institution_id && !n.institution) return [];
    return [
      {
        institution_id: n.institution_id,
        name: n.institution,
        country: n.country,
        current: true,
      },
    ];
  }

  function formatAffiliation(a) {
    const name = a.name || a.institution_id || "";
    const start = a.start_year;
    const end = a.end_year;
    let span = "";
    if (start != null || end != null) {
      const left = start == null ? "?" : String(start);
      const right = end == null ? "present" : String(end);
      span = `${left}–${right}`;
    } else if (a.current) {
      span = "current";
    }
    return span ? `${name} (${span})` : name;
  }

  function matchesProgram(n, pq) {
    if (!pq) return true;
    return nodeAffiliations(n).some((a) => {
      const name = String(a.name || "").toLowerCase();
      const iid = String(a.institution_id || "").toLowerCase();
      return name.includes(pq) || iid.includes(pq);
    });
  }

  function disciplines() {
    return state.disciplines?.length ? state.disciplines : FALLBACK_DISCIPLINES;
  }

  function venueDiscipline(v) {
    return v.discipline || "other";
  }

  function sortVenues(list) {
    return [...list].sort((a, b) => {
      const ia = Number(a.impact_factor);
      const ib = Number(b.impact_factor);
      const na = Number.isFinite(ia) ? ia : -1;
      const nb = Number.isFinite(ib) ? ib : -1;
      if (nb !== na) return nb - na;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }

  function venuesForDiscipline(id, subfield) {
    return sortVenues(
      state.venues.filter((v) => {
        if (venueDiscipline(v) !== id) return false;
        if (subfield) return (v.subfield || "") === subfield;
        return true;
      })
    );
  }

  function q1VenueIds() {
    return state.venues
      .filter((v) => String(v.jcr_quartile || "").toUpperCase() === "Q1")
      .map((v) => v.id);
  }

  function astarVenueIds() {
    return state.venues
      .filter((v) => String(v.abdc || "").trim() === "A*")
      .map((v) => v.id);
  }

  function aAndAstarVenueIds() {
    return state.venues
      .filter((v) => {
        const r = String(v.abdc || "").trim();
        return r === "A*" || r === "A";
      })
      .map((v) => v.id);
  }

  function selectionMatches(ids) {
    return (
      ids.length > 0 &&
      state.selectedVenues.size === ids.length &&
      ids.every((id) => state.selectedVenues.has(id))
    );
  }

  function allVenueIds() {
    return state.venues.map((v) => v.id);
  }

  function domains() {
    return state.domains || [];
  }

  function allAreaNames() {
    const fromDomains = domains().flatMap((d) => d.areas || []);
    return [...new Set([...fromDomains, ...(state.areas || [])])];
  }

  function allAreasSelected() {
    const all = allAreaNames();
    return all.length > 0 && state.selectedAreas.size === all.length;
  }

  function paperAreasOk(p) {
    if (allAreasSelected()) return true;
    if (state.selectedAreas.size === 0) return false;
    return (p.a || []).some((a) => state.selectedAreas.has(a));
  }

  function paperVisible(p) {
    if (!state.selectedVenues.has(p.v)) return false;
    const fullSpan =
      state.yearFrom <= state.yearMin && state.yearTo >= state.yearMax;
    const y = p.y == null ? null : Number(p.y);
    if (y == null || Number.isNaN(y)) {
      if (!fullSpan) return false;
    } else if (y < state.yearFrom || y > state.yearTo) {
      return false;
    }
    return paperAreasOk(p);
  }

  function liveWeight(edge) {
    const papers = edge.papers || [];
    if (papers.length) {
      return papers.filter(paperVisible).length;
    }
    const venues = edge.venues || {};
    let w = 0;
    for (const id of state.selectedVenues) w += Number(venues[id] || 0);
    return w;
  }

  function selectedCountries() {
    return new Set(
      String(els.countries?.value || "US,CA")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    );
  }

  function clampYear(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function syncYearUI() {
    const min = state.yearMin;
    const max = state.yearMax;
    const span = Math.max(1, max - min);
    const fromPct = ((state.yearFrom - min) / span) * 100;
    const toPct = ((state.yearTo - min) / span) * 100;
    els.yearFrom.value = String(state.yearFrom);
    els.yearTo.value = String(state.yearTo);
    els.yearFromOut.textContent = String(state.yearFrom);
    els.yearToOut.textContent = String(state.yearTo);
    els.yearFill.style.left = `${fromPct}%`;
    els.yearFill.style.width = `${Math.max(0, toPct - fromPct)}%`;
    if (state.yearFrom >= state.yearTo - 1) {
      els.yearFrom.style.zIndex = "3";
      els.yearTo.style.zIndex = "4";
    } else {
      els.yearFrom.style.zIndex = "4";
      els.yearTo.style.zIndex = "3";
    }
  }

  function setupYearSliderBounds() {
    for (const el of [els.yearFrom, els.yearTo]) {
      el.setAttribute("min", String(state.yearMin));
      el.setAttribute("max", String(state.yearMax));
    }
  }

  function onYearInput(which) {
    let from = Number(els.yearFrom.value);
    let to = Number(els.yearTo.value);
    if (which === "from" && from > to) from = to;
    if (which === "to" && to < from) to = from;
    state.yearFrom = clampYear(from, state.yearMin, state.yearMax);
    state.yearTo = clampYear(to, state.yearMin, state.yearMax);
    syncYearUI();
    applyFilters();
  }

  function refreshEdgeWeights() {
    for (const e of state.simEdges || []) e.weight = liveWeight(e);
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(text) {
    return escapeHtml(text).replaceAll("'", "&#39;");
  }

  function venueShort(v) {
    return VENUE_SHORT[v.id] || v.id.toUpperCase();
  }

  function syncVenueUI() {
    if (!els.venuesTree) return;
    els.venuesTree.querySelectorAll("input[data-venue]").forEach((box) => {
      box.checked = state.selectedVenues.has(box.dataset.venue);
    });
    els.venuesTree.querySelectorAll("input[data-discipline]").forEach((box) => {
      const list = venuesForDiscipline(
        box.dataset.discipline,
        box.dataset.subfield || null
      );
      const n = list.filter((v) => state.selectedVenues.has(v.id)).length;
      box.checked = n === list.length && n > 0;
      box.indeterminate = n > 0 && n < list.length;
    });
    const n = state.selectedVenues.size;
    const total = allVenueIds().length;
    if (els.venuesCount) els.venuesCount.textContent = `${n} / ${total} selected`;
  }

  function updateJournalsBtn() {
    if (!els.journalsBtn) return;
    const n = state.selectedVenues.size;
    const total = allVenueIds().length;
    const isAll = n === total && total > 0;
    let label = `Journals (${n})`;
    if (isAll) label = `Journals (all · ${n})`;
    else if (selectionMatches(q1VenueIds())) label = `Journals (Q1 · ${n})`;
    else if (selectionMatches(astarVenueIds())) label = `Journals (A* · ${n})`;
    else if (selectionMatches(aAndAstarVenueIds())) label = `Journals (A* & A · ${n})`;
    els.journalsBtn.textContent = label;
    els.journalsBtn.classList.toggle("active", !isAll);
  }

  function buildVenuesTree() {
    const formatIf = (v) => {
      const n = Number(v.impact_factor);
      if (!Number.isFinite(n) || n <= 0) return "—";
      return n.toFixed(1);
    };
    const jcrBadge = (v) => {
      const q = String(v.jcr_quartile || "").toUpperCase();
      if (!q) {
        return `<span class="jcr-badge jcr-na" title="Not in Web of Science; no JCR quartile">—</span>`;
      }
      return `<span class="jcr-badge jcr-${q.toLowerCase()}" title="Best Clarivate JCR 2025 quartile across the journal’s Web of Science categories">${escapeHtml(q)}</span>`;
    };
    const abdcBadge = (v) => {
      const r = String(v.abdc || "").trim();
      if (!r) {
        return `<span class="abdc-badge abdc-na" title="Not on the 2025 ABDC Journal Quality List">—</span>`;
      }
      const cls = r === "A*" ? "astar" : r.toLowerCase();
      return `<span class="abdc-badge abdc-${cls}" title="ABDC 2025 Journal Quality List">${escapeHtml(r)}</span>`;
    };
    const venueRow = (v) => `
      <label class="venue-row" title="${escapeAttr(v.name)}">
        <input type="checkbox" data-venue="${escapeAttr(v.id)}" />
        <span class="venue-short">${escapeHtml(venueShort(v))}</span>
        <span class="venue-name">${escapeHtml(v.name)}</span>
        <span class="venue-if" title="Clarivate Journal Impact Factor 2025 (JCR 2026)">${escapeHtml(formatIf(v))}</span>
        ${jcrBadge(v)}
        ${abdcBadge(v)}
      </label>`;
    const venueGrid = (list) =>
      `<div class="venue-grid">${list.map(venueRow).join("")}</div>`;

    const used = new Set();
    const groups = [];
    for (const disc of disciplines()) {
      const allIn = venuesForDiscipline(disc.id);
      if (!allIn.length) continue;
      allIn.forEach((v) => used.add(v.id));
      const subs = (disc.subfields || []).filter(
        (sf) => venuesForDiscipline(disc.id, sf.id).length
      );
      let inner = "";
      if (subs.length > 1) {
        inner = subs
          .map((sf) => {
            const list = venuesForDiscipline(disc.id, sf.id);
            return `
              <div class="venue-subgroup">
                <label class="venue-subgroup-title">
                  <input type="checkbox" data-discipline="${escapeAttr(disc.id)}" data-subfield="${escapeAttr(sf.id)}" />
                  <span>${escapeHtml(sf.label)}</span>
                </label>
                ${venueGrid(list)}
              </div>`;
          })
          .join("");
        const leftovers = allIn.filter(
          (v) => !subs.some((sf) => (v.subfield || "") === sf.id)
        );
        if (leftovers.length) inner += venueGrid(leftovers);
      } else {
        inner = venueGrid(allIn);
      }
      groups.push(`
        <div class="venue-group">
          <label class="venue-group-title">
            <input type="checkbox" data-discipline="${escapeAttr(disc.id)}" />
            <span>${escapeHtml(disc.label)}</span>
          </label>
          ${inner}
        </div>`);
    }
    const leftover = sortVenues(state.venues.filter((v) => !used.has(v.id)));
    if (leftover.length) {
      groups.push(`
        <div class="venue-group">
          <label class="venue-group-title">
            <input type="checkbox" data-discipline="other" />
            <span>Other</span>
          </label>
          ${venueGrid(leftover)}
        </div>`);
    }
    els.venuesTree.innerHTML = groups.join("");
    els.venuesTree.querySelectorAll("input[data-venue]").forEach((box) => {
      box.addEventListener("change", () => {
        if (box.checked) state.selectedVenues.add(box.dataset.venue);
        else state.selectedVenues.delete(box.dataset.venue);
        syncVenueUI();
        updateJournalsBtn();
        applyFilters();
      });
    });
    els.venuesTree.querySelectorAll("input[data-discipline]").forEach((box) => {
      box.addEventListener("change", () => {
        const list = venuesForDiscipline(
          box.dataset.discipline,
          box.dataset.subfield || null
        );
        if (box.checked) list.forEach((v) => state.selectedVenues.add(v.id));
        else list.forEach((v) => state.selectedVenues.delete(v.id));
        syncVenueUI();
        updateJournalsBtn();
        applyFilters();
      });
    });
  }

  function openJournalsDialog() {
    syncVenueUI();
    if (typeof els.journalsDialog.showModal === "function") {
      els.journalsDialog.showModal();
    } else {
      els.journalsDialog.setAttribute("open", "");
    }
  }

  function closeJournalsDialog() {
    if (typeof els.journalsDialog.close === "function") els.journalsDialog.close();
    else els.journalsDialog.removeAttribute("open");
  }

  function syncAreaUI() {
    const all = allAreaNames();
    if (els.allAreas) {
      els.allAreas.checked =
        state.selectedAreas.size === all.length && all.length > 0;
      els.allAreas.indeterminate =
        state.selectedAreas.size > 0 && state.selectedAreas.size < all.length;
    }
    if (!els.areaTree) return;
    els.areaTree.querySelectorAll("input[data-area]").forEach((box) => {
      box.checked = state.selectedAreas.has(box.dataset.area);
    });
    els.areaTree.querySelectorAll("input[data-domain]").forEach((box) => {
      const domain = domains().find((d) => d.id === box.dataset.domain);
      if (!domain) return;
      const n = domain.areas.filter((a) => state.selectedAreas.has(a)).length;
      box.checked = n === domain.areas.length && n > 0;
      box.indeterminate = n > 0 && n < domain.areas.length;
    });
  }

  function buildSidebar() {
    if (!els.areaTree) return;
    els.areaTree.innerHTML = domains()
      .map((domain) => {
        const rows = (domain.areas || [])
          .map(
            (area) => `
          <label class="area-row">
            <span class="area-name">${escapeHtml(area)}</span>
            <input type="checkbox" data-area="${escapeAttr(area)}" />
          </label>`
          )
          .join("");
        return `
        <div class="domain-block" style="--domain:${domain.color}">
          <label class="domain-head">
            <span class="domain-label">${escapeHtml(domain.label)}</span>
            <input type="checkbox" data-domain="${escapeAttr(domain.id)}" />
          </label>
          <div class="domain-areas">${rows}</div>
        </div>`;
      })
      .join("");

    els.areaTree.querySelectorAll("input[data-area]").forEach((box) => {
      box.addEventListener("change", () => {
        if (box.checked) state.selectedAreas.add(box.dataset.area);
        else state.selectedAreas.delete(box.dataset.area);
        syncAreaUI();
        applyFilters();
      });
    });
    els.areaTree.querySelectorAll("input[data-domain]").forEach((box) => {
      box.addEventListener("change", () => {
        const domain = domains().find((d) => d.id === box.dataset.domain);
        if (!domain) return;
        if (box.checked) domain.areas.forEach((a) => state.selectedAreas.add(a));
        else domain.areas.forEach((a) => state.selectedAreas.delete(a));
        syncAreaUI();
        applyFilters();
      });
    });
  }

  function resize() {
    const rect = els.stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function isSearchHit(n) {
    const q = state.query.trim().toLowerCase();
    const pq = state.programQuery.trim().toLowerCase();
    if (!q && !pq) return false;
    const nameOk = !q || n.name.toLowerCase().includes(q);
    const progOk = matchesProgram(n, pq);
    return nameOk && progOk;
  }

  function inRegion(node) {
    const countries = selectedCountries();
    const codes = nodeAffiliations(node)
      .map((a) => a.country)
      .filter(Boolean);
    if (!codes.length) return !node.country || countries.has(node.country);
    return codes.some((c) => countries.has(c));
  }

  function visibleSet() {
    const q = state.query.trim().toLowerCase();
    const pq = state.programQuery.trim().toLowerCase();
    const searching = Boolean(q || pq);
    const minDeg = state.minDegree;
    const degree = new Map();
    for (const e of state.simEdges) {
      if (e.weight < state.minWeight) continue;
      if (!inRegion(e.a) || !inRegion(e.b)) continue;
      degree.set(e.a.id, (degree.get(e.a.id) || 0) + 1);
      degree.set(e.b.id, (degree.get(e.b.id) || 0) + 1);
    }
    const keep = new Set();
    for (const n of state.sim) {
      if (!inRegion(n)) continue;
      const nameOk = !q || n.name.toLowerCase().includes(q);
      const progOk = matchesProgram(n, pq);
      if (!nameOk || !progOk) continue;
      if (!searching && (degree.get(n.id) || 0) < minDeg) continue;
      keep.add(n.id);
    }
    if (searching) {
      for (const e of state.simEdges) {
        if (e.weight < state.minWeight) continue;
        if (keep.has(e.a.id) && inRegion(e.b)) keep.add(e.b.id);
        if (keep.has(e.b.id) && inRegion(e.a)) keep.add(e.a.id);
      }
    }
    return keep;
  }

  function screenToWorld(sx, sy) {
    const t = state.transform;
    return { x: (sx - t.x) / t.k, y: (sy - t.y) / t.k };
  }

  function nodeAt(sx, sy) {
    const p = screenToWorld(sx, sy);
    let best = null;
    let bestD = 12;
    for (const n of state.sim) {
      if (!n.show) continue;
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      const r = n.r + 3;
      if (d <= r && d < bestD + n.r) {
        best = n;
        bestD = d;
      }
    }
    return best;
  }

  function tick() {
    const nodes = state.sim.filter((n) => n.show);
    const edges = state.simEdges.filter(
      (e) => e.weight >= state.minWeight && e.a.show && e.b.show
    );
    const n = Math.max(1, nodes.length);
    const k = 28;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.hypot(dx, dy) || 0.01;
        const force = (k * k) / dist;
        dx /= dist;
        dy /= dist;
        if (!a.fixed) {
          a.vx += dx * force * 0.02;
          a.vy += dy * force * 0.02;
        }
        if (!b.fixed) {
          b.vx -= dx * force * 0.02;
          b.vy -= dy * force * 0.02;
        }
      }
    }
    for (const e of edges) {
      const a = e.a;
      const b = e.b;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const rest = 55 + 8 * Math.sqrt(n);
      const pull = (dist - rest) * 0.008 * Math.min(3, 0.4 + e.weight / 8);
      dx /= dist;
      dy /= dist;
      if (!a.fixed) {
        a.vx += dx * pull;
        a.vy += dy * pull;
      }
      if (!b.fixed) {
        b.vx -= dx * pull;
        b.vy -= dy * pull;
      }
    }
    let cx = 0;
    let cy = 0;
    for (const node of nodes) {
      cx += node.x;
      cy += node.y;
    }
    cx /= n;
    cy /= n;
    for (const node of nodes) {
      if (node.fixed) continue;
      node.vx += (0 - (node.x - cx)) * 0.01;
      node.vy += (0 - (node.y - cy)) * 0.01;
      node.vx *= 0.82;
      node.vy *= 0.82;
      node.x += node.vx;
      node.y += node.vy;
    }
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(state.transform.x, state.transform.y);
    ctx.scale(state.transform.k, state.transform.k);

    const q = state.query.trim().toLowerCase();
    const pq = state.programQuery.trim().toLowerCase();
    const searching = Boolean(q || pq);
    const focus = state.selected && state.selected.show ? state.selected : null;
    const neighborhood = focus ? neighborhoodSet(focus) : null;
    const searchHits = searching
      ? new Set(state.sim.filter((n) => n.show && isSearchHit(n)).map((n) => n.id))
      : null;

    for (const e of state.simEdges) {
      if (e.weight < state.minWeight || !e.a.show || !e.b.show) continue;
      const onFocus = focus
        ? neighborhood.has(e.a.id) &&
          neighborhood.has(e.b.id) &&
          (e.a === focus || e.b === focus)
        : searching
          ? searchHits.has(e.a.id) || searchHits.has(e.b.id)
          : false;
      const hot =
        onFocus ||
        (!focus && !searching && state.hover && (e.a === state.hover || e.b === state.hover));
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      if ((focus || searching) && !onFocus) {
        ctx.strokeStyle = "rgba(0,0,0,0.04)";
      } else {
        ctx.strokeStyle = hot ? "rgba(26,117,187,0.65)" : "rgba(0,0,0,0.12)";
      }
      ctx.lineWidth = Math.min(5, 0.6 + Math.sqrt(e.weight) * 0.45) / state.transform.k;
      ctx.stroke();
    }

    for (const n of state.sim) {
      if (!n.show) continue;
      const named = isSearchHit(n);
      const inFocus = focus
        ? neighborhood.has(n.id)
        : searching
          ? named
          : true;
      const hot = n === state.hover || n === state.selected || named;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n === focus || named ? n.r + 1.5 : n.r, 0, Math.PI * 2);
      ctx.fillStyle = colorFor(n.institution_id);
      ctx.globalAlpha = inFocus ? 1 : 0.16;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = ((n === focus || named ? 2.4 : hot ? 2 : 1) ) / state.transform.k;
      ctx.strokeStyle = n === focus || named ? "#111" : hot ? "#333" : "rgba(0,0,0,0.35)";
      ctx.stroke();
      if (named || n === focus || (inFocus && (hot || state.transform.k > 1.35))) {
        ctx.fillStyle = inFocus ? "#111" : "#888";
        ctx.font = `${(n === focus || named ? 13 : 12) / state.transform.k}px "Source Sans 3", sans-serif`;
        ctx.fillText(n.name, n.x + n.r + 3, n.y + 4 / state.transform.k);
      }
    }
    ctx.restore();
  }

  function applyFilters() {
    refreshEdgeWeights();
    const keep = visibleSet();
    for (const n of state.sim) n.show = keep.has(n.id);
    const shown = state.sim.filter((n) => n.show).length;
    const hits = state.sim.filter((n) => n.show && isSearchHit(n)).length;
    const ecount = state.simEdges.filter(
      (e) => e.weight >= state.minWeight && e.a.show && e.b.show
    ).length;
    const searching = Boolean(
      state.query.trim() || state.programQuery.trim()
    );
    els.status.textContent = searching
      ? `${hits} match${hits === 1 ? "" : "es"} · ${shown} shown (plus coauthors) · ${state.yearFrom}–${state.yearTo}`
      : `${shown} faculty · ${ecount} ties · ${state.yearFrom}–${state.yearTo}`;
    if (state.selected && !state.selected.show) {
      state.selected = null;
      showDetail(null);
    } else if (state.selected) {
      showDetail(state.selected);
    }
  }

  function neighborhoodSet(node) {
    const ids = new Set([node.id]);
    for (const e of state.simEdges) {
      if (e.weight < state.minWeight || !e.a.show || !e.b.show) continue;
      if (e.a === node) ids.add(e.b.id);
      else if (e.b === node) ids.add(e.a.id);
    }
    return ids;
  }

  function showDetail(node) {
    if (!els.pop) return;
    if (!node) {
      els.pop.hidden = true;
      els.pop.classList.add("hidden");
      if (els.popBody) els.popBody.innerHTML = "";
      return;
    }
    const neighbors = state.simEdges
      .filter(
        (e) =>
          e.weight >= state.minWeight &&
          (e.a === node || e.b === node) &&
          e.a.show &&
          e.b.show
      )
      .map((e) => ({
        other: e.a === node ? e.b : e.a,
        weight: e.weight,
        papers: (e.papers || []).filter(paperVisible),
      }))
      .sort((a, b) => b.weight - a.weight || a.other.name.localeCompare(b.other.name));
    const venueLabel = (id) => {
      const v = state.venues.find((x) => x.id === id);
      return v ? venueShort(v) : id || "";
    };
    const affilText = nodeAffiliations(node)
      .map(formatAffiliation)
      .filter(Boolean)
      .join(" · ");
    els.pop.hidden = false;
    els.pop.classList.remove("hidden");
    els.popBody.innerHTML = `
      <h2>${escapeHtml(node.name)}</h2>
      <p class="net-meta">${escapeHtml(affilText || node.institution || node.institution_id || "")}</p>
      <p>${neighbors.length} roster coauthor${neighbors.length === 1 ? "" : "s"} · ${neighbors.reduce((s, r) => s + r.weight, 0)} shared papers</p>
      <ol class="net-neighbors">
        ${neighbors
          .map((row) => {
            const papers = [...row.papers].sort(
              (a, b) => (b.y || 0) - (a.y || 0) || String(a.t || "").localeCompare(String(b.t || ""))
            );
            const list = papers
              .map((p) => {
                const meta = [p.y || "", venueLabel(p.v)].filter(Boolean).join(" · ");
                return `<li><span class="net-shared-meta">${escapeHtml(meta)}</span><span class="net-shared-title">${escapeHtml(p.t || "Untitled")}</span></li>`;
              })
              .join("");
            return `<li>
              <div class="net-coauthor">
                <button type="button" class="net-name" data-id="${escapeAttr(row.other.id)}">${escapeHtml(row.other.name)}</button>
                <button type="button" class="net-papers-btn" data-papers="${escapeAttr(row.other.id)}" aria-expanded="false">Papers</button>
                <span class="net-count">${row.weight}</span>
              </div>
              <ol class="net-shared hidden" data-for="${escapeAttr(row.other.id)}">${list || "<li>No titles in the current filters.</li>"}</ol>
            </li>`;
          })
          .join("")}
      </ol>
    `;
    els.popBody.querySelectorAll("button.net-name[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = state.sim.find((n) => n.id === btn.dataset.id);
        if (!next) return;
        state.selected = next;
        showDetail(next);
      });
    });
    els.popBody.querySelectorAll("button.net-papers-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const box = els.popBody.querySelector(`.net-shared[data-for="${CSS.escape(btn.dataset.papers)}"]`);
        if (!box) return;
        const open = box.classList.toggle("hidden") === false;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.classList.toggle("open", open);
      });
    });
  }

  function pointerPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  let viewActive = false;
  let looping = false;
  let didCenter = false;

  function loop() {
    if (!viewActive) {
      looping = false;
      return;
    }
    if (state.running) {
      for (let i = 0; i < 2; i++) tick();
    }
    draw();
    requestAnimationFrame(loop);
  }

  function startLoop() {
    if (looping) return;
    looping = true;
    loop();
  }

  function activateNetwork() {
    viewActive = true;
    resize();
    if (!didCenter && canvas.clientWidth > 1) {
      state.transform.x = canvas.clientWidth / 2;
      state.transform.y = canvas.clientHeight / 2;
      didCenter = true;
    }
    startLoop();
  }

  function deactivateNetwork() {
    viewActive = false;
  }

  const TOUR_STEPS = [
    {
      title: "Welcome to IO Psychology Network",
      body: "This map shows coauthorship among I-O faculty with a Google Scholar profile, including people on more than one program over time. A line means they share papers in the journals and years you select.",
      selector: null,
    },
    {
      title: "Filter by Region",
      body: "Show faculty in the U.S., Canada, or both.",
      selector: '[data-tour="region"]',
    },
    {
      title: "Choose publication years",
      body: "Drag the handles to keep only collaborations from those years. Default is the most recent 10 years.",
      selector: '[data-tour="years"]',
    },
    {
      title: "Minimum shared papers",
      body: "A tie appears only if two people share at least this many papers in the current journal and year filters.",
      selector: '[data-tour="minPapers"]',
    },
    {
      title: "Minimum connections",
      body: "Hide people with fewer roster coauthors than this. 1 hides isolates; 0 shows everyone.",
      selector: '[data-tour="minConnections"]',
    },
    {
      title: "Search faculty",
      body: "Type a name to keep that person and their coauthors. The match is highlighted; everyone else on screen fades.",
      selector: '[data-tour="faculty"]',
    },
    {
      title: "Search programs",
      body: "Type a school name to highlight faculty who are or were at that program. Their coauthors stay on the map, faded.",
      selector: '[data-tour="program"]',
    },
    {
      title: "Select journals",
      body: "Open Journals to choose which venues count. All whitelist journals are on by default, grouped by discipline and sorted by impact factor. Each row shows JIF, JCR quartile, and ABDC rating. Use Q1 only, A* only, or A* & A only to narrow the set.",
      selector: '[data-tour="journals"]',
    },
    {
      title: "Back to Rankings",
      body: "Switch to the Rankings tab for the program table — publication counts, citations, and impact-factor scores.",
      selector: '[data-tour="rankings"]',
    },
    {
      title: "Research areas",
      body: "Use the left sidebar to include or exclude areas (Selection, Leadership, Teams, …). Domain headers toggle a whole group.",
      selector: '[data-tour="areas"]',
      place: "right",
    },
    {
      title: "Explore the graph",
      body: "Click a node to highlight coauthors and open a card with their program and ties. Drag to move people; scroll to zoom; click empty space to clear.",
      selector: '[data-tour="graph"]',
      place: "left",
    },
  ];

  let tourIndex = 0;
  let tourTarget = null;

  function clearTourTarget() {
    if (tourTarget) {
      tourTarget.classList.remove("tour-target");
      tourTarget = null;
    }
    if (els.tourSpotlight) els.tourSpotlight.hidden = true;
  }

  function placeSpotlight(el) {
    const pad = 4;
    const r = el.getBoundingClientRect();
    const spot = els.tourSpotlight;
    spot.hidden = false;
    spot.style.left = `${Math.max(0, r.left - pad)}px`;
    spot.style.top = `${Math.max(0, r.top - pad)}px`;
    spot.style.width = `${r.width + pad * 2}px`;
    spot.style.height = `${r.height + pad * 2}px`;
  }

  function positionTourPopover(step) {
    const pop = els.tourPopover;
    const arrow = els.tourArrow;
    const margin = 12;
    const popW = pop.offsetWidth || 340;
    const popH = pop.offsetHeight || 160;
    const backdrop = els.tourRoot.querySelector(".tour-backdrop");

    if (!step.selector) {
      backdrop.classList.remove("is-clear");
      pop.style.left = `${Math.max(margin, (window.innerWidth - popW) / 2)}px`;
      pop.style.top = `${Math.max(margin, window.innerHeight * 0.28)}px`;
      arrow.hidden = true;
      return;
    }

    const el = tourEl(step.selector);
    if (!el) {
      backdrop.classList.remove("is-clear");
      pop.style.left = `${margin}px`;
      pop.style.top = `${margin}px`;
      arrow.hidden = true;
      return;
    }

    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const r2 = el.getBoundingClientRect();
    placeSpotlight(el);
    backdrop.classList.add("is-clear");

    const gap = 14;
    const fitsBottom = r2.bottom + gap + popH <= window.innerHeight - margin;
    const fitsTop = r2.top - gap - popH >= margin;
    const fitsRight = r2.right + gap + popW <= window.innerWidth - margin;

    let place = step.place || "bottom";
    if (!["top", "bottom", "left", "right"].includes(place)) place = "bottom";

    if (!step.place) {
      if (!fitsBottom && fitsTop) place = "top";
      else if (!fitsBottom && !fitsTop) place = "top";
      else place = "bottom";
    } else if (place === "bottom" && !fitsBottom && fitsTop) {
      place = "top";
    } else if (place === "right" && !fitsRight) {
      place = fitsTop ? "top" : "bottom";
    }

    let top;
    let left;
    if (place === "right") {
      left = r2.right + gap;
      top = r2.top + Math.min(24, Math.max(0, (r2.height - popH) / 2));
    } else if (place === "left") {
      left = r2.left - popW - gap;
      top = r2.top + Math.min(24, Math.max(0, (r2.height - popH) / 2));
    } else if (place === "top") {
      top = r2.top - popH - gap;
      left = r2.left + r2.width / 2 - popW / 2;
    } else {
      top = r2.bottom + gap;
      left = r2.left + r2.width / 2 - popW / 2;
    }

    top = Math.min(window.innerHeight - popH - margin, Math.max(margin, top));
    left = Math.min(window.innerWidth - popW - margin, Math.max(margin, left));
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;

    arrow.hidden = false;
    arrow.className = "tour-arrow";
    arrow.style.left = "";
    arrow.style.right = "";
    arrow.style.top = "";
    arrow.style.bottom = "";

    if (place === "right") {
      arrow.classList.add("left");
      arrow.style.left = "-18px";
      arrow.style.top = `${Math.min(popH - 24, Math.max(16, r2.top + 28 - top))}px`;
    } else if (place === "left") {
      arrow.classList.add("right");
      arrow.style.right = "-18px";
      arrow.style.top = `${Math.min(popH - 24, Math.max(16, r2.top + 28 - top))}px`;
    } else if (place === "top") {
      arrow.classList.add("bottom");
      arrow.style.left = `${Math.min(popW - 24, Math.max(16, r2.left + r2.width / 2 - left - 9))}px`;
    } else {
      arrow.classList.add("top");
      arrow.style.left = `${Math.min(popW - 24, Math.max(16, r2.left + r2.width / 2 - left - 9))}px`;
    }
  }

  function showTourStep() {
    const step = TOUR_STEPS[tourIndex];
    clearTourTarget();
    els.tourTitle.textContent = step.title;
    els.tourBody.textContent = step.body;
    els.tourProgress.textContent = `${tourIndex + 1} / ${TOUR_STEPS.length}`;
    els.tourBack.disabled = tourIndex === 0;
    els.tourNext.textContent = tourIndex === TOUR_STEPS.length - 1 ? "Done" : "Next";
    if (step.selector) {
      const el = tourEl(step.selector);
      if (el) {
        tourTarget = el;
        tourTarget.classList.add("tour-target");
      }
    }
    requestAnimationFrame(() => positionTourPopover(step));
  }

  function startTour() {
    tourIndex = 0;
    els.tourRoot.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    showTourStep();
  }

  function endTour() {
    clearTourTarget();
    els.tourRoot.classList.add("hidden");
    document.body.style.overflow = "";
    try {
      localStorage.setItem("io-network-tour-seen", "1");
    } catch (_) {
      /* ignore */
    }
  }

  function tourNext() {
    if (tourIndex >= TOUR_STEPS.length - 1) {
      endTour();
      return;
    }
    tourIndex += 1;
    showTourStep();
  }

  function tourBack() {
    if (tourIndex <= 0) return;
    tourIndex -= 1;
    showTourStep();
  }

  async function init() {
    window.addEventListener("resize", () => {
      if (!viewActive) return;
      resize();
      draw();
    });
    const res = await fetch("data/coauthor_network.json");
    if (!res.ok) {
      els.status.textContent = "Could not load coauthor_network.json";
      return;
    }
    const data = await res.json();
    state.nodes = data.nodes || [];
    state.edges = data.roster_edges || [];
    state.venues = data.venues || [];
    state.domains = data.domains || [];
    state.disciplines = data.disciplines || [];
    state.areas = data.areas || [];
    state.selectedVenues = new Set(allVenueIds());
    state.selectedAreas = new Set(allAreaNames());
    buildVenuesTree();
    buildSidebar();
    syncVenueUI();
    syncAreaUI();
    updateJournalsBtn();
    const byId = new Map();
    state.sim = state.nodes.map((n, i) => {
      const angle = (i / Math.max(1, state.nodes.length)) * Math.PI * 2;
      const rad = 40 + (i % 17) * 18;
      const node = {
        ...n,
        x: Math.cos(angle) * rad,
        y: Math.sin(angle) * rad,
        vx: 0,
        vy: 0,
        r: 3.5 + Math.sqrt(n.degree || 0) * 1.1,
        show: true,
        fixed: false,
      };
      byId.set(n.id, node);
      return node;
    });
    state.simEdges = state.edges
      .map((e) => ({
        a: byId.get(e.source),
        b: byId.get(e.target),
        venues: e.venues || {},
        papers: e.papers || [],
        weight: 0,
      }))
      .filter((e) => e.a && e.b);
    const stats = data.stats || {};
    state.yearMin = Number(stats.year_min) || 1973;
    state.yearMax = Number(stats.year_max) || 2026;
    setupYearSliderBounds();
    state.yearTo = state.yearMax;
    state.yearFrom = Math.max(state.yearMin, state.yearMax - 9);
    syncYearUI();
    applyFilters();
    if (document.body.classList.contains("is-network")) {
      didCenter = false;
      activateNetwork();
    }
  }

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    applyFilters();
  });
  if (els.programSearch) {
    els.programSearch.addEventListener("input", () => {
      state.programQuery = els.programSearch.value;
      applyFilters();
    });
  }
  els.countries.addEventListener("change", applyFilters);
  els.yearFrom.addEventListener("input", () => onYearInput("from"));
  els.yearTo.addEventListener("input", () => onYearInput("to"));
  els.minWeight.addEventListener("input", () => {
    state.minWeight = Math.max(1, Number(els.minWeight.value) || 1);
    applyFilters();
  });
  els.minDegree.addEventListener("input", () => {
    state.minDegree = Math.max(0, Number(els.minDegree.value) || 0);
    applyFilters();
  });
  if (els.allAreas) {
    els.allAreas.addEventListener("change", () => {
      if (els.allAreas.checked) {
        state.selectedAreas = new Set(allAreaNames());
      } else {
        state.selectedAreas = new Set();
      }
      syncAreaUI();
      applyFilters();
    });
  }
  els.journalsBtn.addEventListener("click", openJournalsDialog);
  els.journalsClose.addEventListener("click", closeJournalsDialog);
  els.journalsDone.addEventListener("click", closeJournalsDialog);
  els.journalsDialog.addEventListener("click", (ev) => {
    if (ev.target === els.journalsDialog) closeJournalsDialog();
  });
  els.venuesAll.addEventListener("click", () => {
    state.selectedVenues = new Set(allVenueIds());
    syncVenueUI();
    updateJournalsBtn();
    applyFilters();
  });
  els.venuesQ1.addEventListener("click", () => {
    state.selectedVenues = new Set(q1VenueIds());
    syncVenueUI();
    updateJournalsBtn();
    applyFilters();
  });
  els.venuesAstar.addEventListener("click", () => {
    state.selectedVenues = new Set(astarVenueIds());
    syncVenueUI();
    updateJournalsBtn();
    applyFilters();
  });
  els.venuesA.addEventListener("click", () => {
    state.selectedVenues = new Set(aAndAstarVenueIds());
    syncVenueUI();
    updateJournalsBtn();
    applyFilters();
  });
  els.venuesNone.addEventListener("click", () => {
    state.selectedVenues = new Set();
    syncVenueUI();
    updateJournalsBtn();
    applyFilters();
  });

  canvas.addEventListener("mousemove", (ev) => {
    const p = pointerPos(ev);
    if (state.dragging) {
      const world = screenToWorld(p.x, p.y);
      state.dragging.x = world.x;
      state.dragging.y = world.y;
      state.dragging.vx = 0;
      state.dragging.vy = 0;
      return;
    }
    if (state.panning) {
      if (Math.hypot(p.x - state.panning.x, p.y - state.panning.y) > 3) {
        state.panMoved = true;
      }
      state.transform.x += p.x - state.panning.x;
      state.transform.y += p.y - state.panning.y;
      state.panning = p;
      return;
    }
    state.hover = nodeAt(p.x, p.y);
    canvas.style.cursor = state.hover ? "pointer" : "grab";
  });

  canvas.addEventListener("mousedown", (ev) => {
    const p = pointerPos(ev);
    const node = nodeAt(p.x, p.y);
    state.panMoved = false;
    if (node) {
      state.dragging = node;
      node.fixed = true;
      state.selected = node;
      showDetail(node);
    } else {
      state.panning = p;
    }
  });

  window.addEventListener("mouseup", () => {
    if (state.dragging) state.dragging.fixed = false;
    if (state.panning && !state.panMoved) {
      state.selected = null;
      showDetail(null);
    }
    state.dragging = null;
    state.panning = null;
  });

  if (els.popClose) {
    els.popClose.addEventListener("click", () => {
      state.selected = null;
      showDetail(null);
    });
  }

  canvas.addEventListener(
    "wheel",
    (ev) => {
      ev.preventDefault();
      const p = pointerPos(ev);
      const before = screenToWorld(p.x, p.y);
      const factor = ev.deltaY < 0 ? 1.08 : 1 / 1.08;
      state.transform.k = Math.min(6, Math.max(0.25, state.transform.k * factor));
      const after = screenToWorld(p.x, p.y);
      state.transform.x += (after.x - before.x) * state.transform.k;
      state.transform.y += (after.y - before.y) * state.transform.k;
    },
    { passive: false }
  );

  if (els.tourBtn) {
    els.tourBtn.addEventListener("click", startTour);
    els.tourNext.addEventListener("click", tourNext);
    els.tourBack.addEventListener("click", tourBack);
    els.tourSkip.addEventListener("click", endTour);
    els.tourRoot.querySelector(".tour-backdrop").addEventListener("click", endTour);
    window.addEventListener("keydown", (ev) => {
      if (els.tourRoot.classList.contains("hidden")) return;
      if (ev.key === "Escape") endTour();
      else if (ev.key === "ArrowRight" || ev.key === "Enter") tourNext();
      else if (ev.key === "ArrowLeft") tourBack();
    });
    window.addEventListener("resize", () => {
      if (!els.tourRoot.classList.contains("hidden")) {
        positionTourPopover(TOUR_STEPS[tourIndex]);
      }
    });
  }

  window.addEventListener("site-view", (ev) => {
    if (ev.detail === "network") activateNetwork();
    else deactivateNetwork();
  });

  init();
})();
