(() => {
  const FALLBACK_DOMAINS = [
    {
      id: "industrial",
      label: "Industrial / Personnel",
      color: "#1a75bb",
      areas: [
        "Selection",
        "Training",
        "Individual Differences / Personality",
        "Performance",
      ],
    },
    {
      id: "organizational",
      label: "Organizational",
      color: "#ca7c1b",
      areas: [
        "Leadership",
        "Motivation / Attitudes",
        "Teams",
        "Work Design",
        "Culture / Climate",
        "Diversity",
        "Careers",
      ],
    },
    {
      id: "technology",
      label: "Technology & Future of Work",
      color: "#c45c26",
      areas: ["AI / Technology"],
    },
    {
      id: "health",
      label: "Occupational Health",
      color: "#2e8b57",
      areas: ["Stress / Well-being", "Work–Family", "Safety"],
    },
    {
      id: "methods",
      label: "Methods & General",
      color: "#6b4fa0",
      areas: ["Methods", "General"],
    },
  ];

  const FALLBACK_DISCIPLINES = [
    { id: "io", label: "I-O / Work Psychology" },
    { id: "ob_mgmt", label: "OB / Management" },
    { id: "methods", label: "Methods / Measurement / Psychometrics" },
    { id: "general_psych", label: "General / Experimental / Decision Psychology" },
    { id: "social_id", label: "Social / Individual Differences" },
    { id: "career", label: "Career / Vocational / Counseling / Educational Psychology" },
    { id: "applied", label: "Human Factors / Health / Aging / Technology" },
  ];

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

  const state = {
    data: null,
    expanded: new Set(),
    selectedAreas: new Set(),
    selectedVenues: new Set(),
    metric: "adj_count",
    yearMin: 1990,
    yearMax: 2026,
    yearFrom: 2017,
    yearTo: 2026,
    byAppointment: false,
    facultyView: false,
  };

  const els = {
    countries: document.getElementById("countries"),
    yearFrom: document.getElementById("yearFrom"),
    yearTo: document.getElementById("yearTo"),
    yearFromOut: document.getElementById("yearFromOut"),
    yearToOut: document.getElementById("yearToOut"),
    yearFill: document.getElementById("yearFill"),
    metric: document.getElementById("metric"),
    minFaculty: document.getElementById("minFaculty"),
    schoolSearch: document.getElementById("schoolSearch"),
    journalsBtn: document.getElementById("journalsBtn"),
    journalsDialog: document.getElementById("journalsDialog"),
    journalsClose: document.getElementById("journalsClose"),
    journalsDone: document.getElementById("journalsDone"),
    venuesTree: document.getElementById("venuesTree"),
    venuesAll: document.getElementById("venuesAll"),
    venuesQ1: document.getElementById("venuesQ1"),
    venuesAstar: document.getElementById("venuesAstar"),
    venuesA: document.getElementById("venuesA"),
    venuesNone: document.getElementById("venuesNone"),
    venuesCount: document.getElementById("venuesCount"),
    tourBtn: document.getElementById("tourBtn"),
    tourRoot: document.getElementById("tourRoot"),
    tourSpotlight: document.getElementById("tourSpotlight"),
    tourPopover: document.getElementById("tourPopover"),
    tourTitle: document.getElementById("tourTitle"),
    tourBody: document.getElementById("tourBody"),
    tourProgress: document.getElementById("tourProgress"),
    tourBack: document.getElementById("tourBack"),
    tourNext: document.getElementById("tourNext"),
    tourSkip: document.getElementById("tourSkip"),
    tourArrow: document.getElementById("tourArrow"),
    allAreas: document.getElementById("allAreas"),
    areaTree: document.getElementById("areaTree"),
    apptToggle: document.getElementById("apptToggle"),
    facToggle: document.getElementById("facToggle"),
    searchLabel: document.getElementById("searchLabel"),
    nameHead: document.getElementById("nameHead"),
    auxHead: document.getElementById("auxHead"),
    expandAll: document.getElementById("expandAll"),
    collapseAll: document.getElementById("collapseAll"),
    tbody: document.querySelector("#rankTable tbody"),
    metricHead: document.getElementById("metricHead"),
    empty: document.getElementById("empty"),
    modal: document.getElementById("facultyModal"),
    modalTitle: document.getElementById("modalTitle"),
    modalMeta: document.getElementById("modalMeta"),
    modalScore: document.getElementById("modalScore"),
    modalPapers: document.getElementById("modalPapers"),
    modalClose: document.getElementById("modalClose"),
    dataStamp: document.getElementById("dataStamp"),
  };

  function tourEl(selector) {
    if (!selector) return null;
    if (
      selector.includes('data-tour="network"') ||
      selector.includes('data-tour="rankings"')
    ) {
      return document.querySelector(selector);
    }
    const root = document.getElementById("view-rankings");
    return (root || document).querySelector(selector);
  }

  function domains() {
    return state.data?.domains?.length ? state.data.domains : FALLBACK_DOMAINS;
  }

  function venuesList() {
    return state.data?.venues || [];
  }

  function disciplines() {
    return state.data?.disciplines?.length
      ? state.data.disciplines
      : FALLBACK_DISCIPLINES;
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
      venuesList().filter((v) => {
        if (venueDiscipline(v) !== id) return false;
        if (subfield) return (v.subfield || "") === subfield;
        return true;
      })
    );
  }

  function ioVenueIds() {
    return venuesList()
      .filter(
        (v) =>
          venueDiscipline(v) === "io" ||
          v.io_relevance === "high" ||
          v.io_relevance === "core"
      )
      .map((v) => v.id);
  }

  function q1VenueIds() {
    return venuesList()
      .filter((v) => String(v.jcr_quartile || "").toUpperCase() === "Q1")
      .map((v) => v.id);
  }

  function astarVenueIds() {
    return venuesList()
      .filter((v) => String(v.abdc || "").trim() === "A*")
      .map((v) => v.id);
  }

  function aAndAstarVenueIds() {
    return venuesList()
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
    return venuesList().map((v) => v.id);
  }

  function allAreaNames() {
    const fromDomains = domains().flatMap((d) => d.areas);
    const listed = state.data?.areas || [];
    return [...new Set([...fromDomains, ...listed])];
  }

  function venueShort(v) {
    return VENUE_SHORT[v.id] || v.id.toUpperCase();
  }

  function parseHash() {
    const raw = location.hash.replace(/^#/, "");
    const params = new URLSearchParams(raw);
    const areasRaw = params.get("areas");
    let areas = null;
    if (areasRaw === "") areas = [];
    else if (areasRaw) areas = areasRaw.split("|").filter(Boolean);

    const venuesRaw = params.get("venues");
    let venues = null; // null = default all
    if (venuesRaw === "all") venues = "all";
    else if (venuesRaw === "q1") venues = "q1";
    else if (venuesRaw === "astar" || venuesRaw === "a*") venues = "astar";
    else if (venuesRaw === "a") venues = "a";
    else if (venuesRaw === "io") venues = "io";
    else if (venuesRaw === "") venues = [];
    else if (venuesRaw) venues = venuesRaw.split("|").filter(Boolean);
    // Back-compat: old #cross=1 meant include all journals
    else if (params.get("cross") === "1") venues = "all";

    return {
      countries: params.get("countries") || "US,CA",
      from: params.get("from"),
      to: params.get("to"),
      window: params.get("window"), // back-compat: 5 / 10 / all
      metric: params.get("metric") || "adj_count",
      minFaculty: Math.max(1, Number(params.get("min") || 1) || 1),
      q: params.get("q") || "",
      appt: params.get("appt") === "1",
      faculty: params.get("fac") === "1",
      areas,
      venues,
    };
  }

  function writeHash() {
    const params = new URLSearchParams();
    params.set("countries", els.countries.value);
    params.set("from", String(state.yearFrom));
    params.set("to", String(state.yearTo));
    params.set("metric", state.metric);
    params.set("min", String(els.minFaculty.value || "1"));
    const q = (els.schoolSearch?.value || "").trim();
    if (q) params.set("q", q);
    if (state.facultyView) params.set("fac", "1");
    else if (state.byAppointment) params.set("appt", "1");

    const all = allAreaNames();
    if (state.selectedAreas.size === 0) params.set("areas", "");
    else if (state.selectedAreas.size < all.length) {
      params.set("areas", [...state.selectedAreas].join("|"));
    }

    const allV = allVenueIds();
    const selected = [...state.selectedVenues];
    const isAll =
      selected.length === allV.length && allV.every((id) => state.selectedVenues.has(id));
    if (selected.length === 0) params.set("venues", "");
    else if (isAll) {
      /* omit — all journals is the default */
    } else if (selectionMatches(q1VenueIds())) params.set("venues", "q1");
    else if (selectionMatches(astarVenueIds())) params.set("venues", "astar");
    else if (selectionMatches(aAndAstarVenueIds())) params.set("venues", "a");
    else params.set("venues", selected.join("|"));

    history.replaceState(null, "", `#${params.toString()}`);
  }

  function viewKey() {
    // Full paper set; year/venue/area filters applied client-side.
    return "window_all__with_cross";
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
    // Keep the active thumb on top for easier grabbing when overlapping
    if (state.yearFrom >= state.yearTo - 1) {
      els.yearFrom.style.zIndex = "3";
      els.yearTo.style.zIndex = "4";
    } else {
      els.yearFrom.style.zIndex = "4";
      els.yearTo.style.zIndex = "3";
    }
  }

  function setupYearSliderBounds() {
    const attrs = {
      min: String(state.yearMin),
      max: String(state.yearMax),
    };
    for (const [k, v] of Object.entries(attrs)) {
      els.yearFrom.setAttribute(k, v);
      els.yearTo.setAttribute(k, v);
    }
  }

  function metricValue(row, key) {
    return Number(row[key] ?? 0);
  }

  function formatScore(value, key) {
    if (
      key.includes("citation") ||
      key === "raw_count" ||
      key === "first_second_last" ||
      key === "last_author"
    ) {
      return Math.round(value).toLocaleString();
    }
    return Number(value).toFixed(1);
  }

  function facultyMetricKey(metric) {
    return metric.replace(/_per_faculty$/, "");
  }

  function metricLabel(key) {
    const meta = state.data?.metrics?.find((m) => m.key === key);
    return meta ? meta.label : key;
  }

  function venueImpactFactor(venueId) {
    const v = (state.data?.venues || []).find((x) => x.id === venueId);
    if (!v) return null;
    const n = Number(v.impact_factor);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function allAreasSelected() {
    const all = allAreaNames();
    return all.length > 0 && state.selectedAreas.size === all.length;
  }

  function paperMatches(paper) {
    if (!state.selectedVenues.has(paper.venue_id)) return false;
    const y = validYear(paper.year);
    if (y == null) {
      // Undated pubs count only on the full year span (matches score window_all).
      if (state.yearFrom > state.yearMin || state.yearTo < state.yearMax) {
        return false;
      }
    } else if (y < state.yearFrom || y > state.yearTo) {
      return false;
    }
    if (allAreasSelected()) return true;
    if (state.selectedAreas.size === 0) return false;
    return (paper.areas || []).some((a) => state.selectedAreas.has(a));
  }

  function facultyAreasFromPapers(papers, curated = null, maxLabels = 7) {
    // Labels use the full whitelist paper set (all venues, all years).
    // Journal / year / area UI filters must not change these pills.
    const counts = new Map();
    const weights = new Map();
    for (const p of papers || []) {
      const areas = (p.areas || []).filter((a) => a && a !== "General");
      if (!areas.length) continue;
      const share = Number(p.adj_credit || 0) / areas.length;
      for (const a of areas) {
        counts.set(a, (counts.get(a) || 0) + 1);
        weights.set(a, (weights.get(a) || 0) + share);
      }
    }
    for (const a of curated || []) {
      if (!a || a === "General") continue;
      if (!counts.has(a)) counts.set(a, 0);
      if (!weights.has(a)) weights.set(a, 0);
    }
    if (!counts.size) return [];
    return [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          (weights.get(b[0]) || 0) - (weights.get(a[0]) || 0) ||
          a[0].localeCompare(b[0])
      )
      .slice(0, maxLabels)
      .map(([a]) => a);
  }

  function appointmentCoverage() {
    return new Set(state.data?.appointment_coverage || []);
  }

  function yearsOverlap(start, end, from, to) {
    const s = start == null || start === "" ? 1900 : Number(start);
    const e = end == null || end === "" ? 9999 : Number(end);
    if (!Number.isFinite(s) || !Number.isFinite(e)) return true;
    return s <= to && e >= from;
  }

  function paperInAppointment(year, start, end) {
    const y = validYear(year);
    if (y == null) return false;
    const s = start == null || start === "" ? 1900 : Number(start);
    const e = end == null || end === "" ? 9999 : Number(end);
    return y >= s && y <= e;
  }

  function formatAppointmentSpan(start, end) {
    const s = start == null || start === "" ? "?" : String(start);
    const e = end == null || end === "" ? "present" : String(end);
    return `${s}–${e}`;
  }

  function formatAffiliationYears(aff) {
    const hasStart = aff.start_year != null && aff.start_year !== "";
    const hasEnd = aff.end_year != null && aff.end_year !== "";
    if (!hasStart && !hasEnd) return aff.current ? "present" : "";
    return formatAppointmentSpan(aff.start_year, aff.end_year);
  }

  function instMetaMap(view) {
    const map = new Map();
    const add = (list) => {
      for (const i of list || []) {
        if (i?.institution_id && !map.has(i.institution_id)) map.set(i.institution_id, i);
      }
    };
    add(view?.institutions);
    for (const v of Object.values(state.data?.views || {})) add(v.institutions);
    return map;
  }

  function affiliationsFor(f, instById) {
    const fid = f.faculty_id;
    const byIid = new Map();
    for (const appt of state.data.appointments || []) {
      if (appt.faculty_id !== fid) continue;
      const inst = instById.get(appt.institution_id) || {};
      const open = appt.end_year == null || appt.end_year === "";
      byIid.set(appt.institution_id, {
        institution_id: appt.institution_id,
        name: inst.name || appt.institution_id,
        country: inst.country || "",
        start_year: appt.start_year,
        end_year: appt.end_year,
        current: Boolean(open),
      });
    }
    if (f.institution_id && !byIid.has(f.institution_id)) {
      const inst = instById.get(f.institution_id) || {};
      byIid.set(f.institution_id, {
        institution_id: f.institution_id,
        name: inst.name || f.institution_id,
        country: inst.country || "",
        start_year: null,
        end_year: null,
        current: f.current_roster !== false,
      });
    }
    return [...byIid.values()].sort((a, b) => {
      if (Boolean(a.current) !== Boolean(b.current)) return a.current ? -1 : 1;
      return (Number(b.start_year) || 0) - (Number(a.start_year) || 0);
    });
  }

  function affiliationPhrase(aff) {
    const years = formatAffiliationYears(aff);
    return years ? `${aff.name} (${years})` : aff.name;
  }

  function tallyPapers(papers) {
    let adj = 0;
    let cites = 0;
    let weighted = 0;
    let firstSecondLast = 0;
    let lastAuthor = 0;
    for (const p of papers) {
      adj += Number(p.adj_credit);
      cites += Number(p.cited_by_count);
      weighted += Number(p.weighted_if);
      if (p.is_first_second_last || p.is_first || p.is_second || p.is_last) {
        firstSecondLast += 1;
      }
      if (p.is_last) lastAuthor += 1;
    }
    return {
      adj_count: adj,
      raw_count: papers.length,
      citations: cites,
      weighted_if: weighted,
      first_second_last: firstSecondLast,
      last_author: lastAuthor,
    };
  }

  function hasScholarProfile(f) {
    const scholarId = String(f.google_scholar_id || "").trim();
    return (
      f.has_scholar_data !== false &&
      Boolean(scholarId) &&
      scholarId.toLowerCase() !== "nan" &&
      scholarId.toLowerCase() !== "none"
    );
  }

  function emptyInst(base) {
    return {
      ...base,
      faculty_count: 0,
      adj_count: 0,
      raw_count: 0,
      citations: 0,
      weighted_if: 0,
      first_second_last: 0,
      last_author: 0,
      faculty_ids: [],
      by_appointment: false,
    };
  }

  function addFacultyToInst(inst, row) {
    if (hasScholarProfile(row)) inst.faculty_count += 1;
    inst.adj_count += row.adj_count;
    inst.raw_count += row.raw_count;
    inst.citations += row.citations;
    inst.weighted_if += row.weighted_if;
    inst.first_second_last += row.first_second_last;
    inst.last_author += row.last_author;
    inst.faculty_ids.push(row._key || row.faculty_id);
  }

  function finalizeInst(inst) {
    const fc = Math.max(1, inst.faculty_count);
    return {
      ...inst,
      adj_count: Number(inst.adj_count.toFixed(4)),
      raw_count: inst.raw_count,
      citations: inst.citations,
      weighted_if: Number(inst.weighted_if.toFixed(4)),
      first_second_last: inst.first_second_last,
      last_author: inst.last_author,
      adj_count_per_faculty: Number((inst.adj_count / fc).toFixed(4)),
      citations_per_faculty: Number((inst.citations / fc).toFixed(4)),
      weighted_if_per_faculty: Number((inst.weighted_if / fc).toFixed(4)),
    };
  }

  function rescoreView(view) {
    const whitelist = new Set(allVenueIds());
    const scoredFaculty = view.faculty.map((f) => {
      const papers = (f.papers || []).filter(paperMatches);
      const labelPapers = (f.papers || []).filter((p) =>
        whitelist.has(p.venue_id)
      );
      return {
        ...f,
        papers,
        areas: facultyAreasFromPapers(labelPapers, f.areas),
        ...tallyPapers(papers),
      };
    });
    const byFid = new Map(scoredFaculty.map((f) => [f.faculty_id, f]));
    const covered = appointmentCoverage();
    const useAppt = Boolean(state.byAppointment);

    const byInst = new Map();
    for (const inst of view.institutions) {
      byInst.set(inst.institution_id, emptyInst(inst));
    }

    const facultyOut = [];

    for (const f of scoredFaculty) {
      if (f.current_roster === false) continue;
      if (useAppt && covered.has(f.institution_id)) continue;
      const inst = byInst.get(f.institution_id);
      if (!inst) continue;
      const row = { ...f, _key: f.faculty_id };
      addFacultyToInst(inst, row);
      facultyOut.push(row);
    }

    if (useAppt) {
      for (const appt of state.data.appointments || []) {
        const iid = appt.institution_id;
        if (!covered.has(iid)) continue;
        if (!yearsOverlap(appt.start_year, appt.end_year, state.yearFrom, state.yearTo)) {
          continue;
        }
        const src = byFid.get(appt.faculty_id);
        const papers = (src?.papers || []).filter((p) =>
          paperInAppointment(p.year, appt.start_year, appt.end_year)
        );
        const key = `${appt.faculty_id}::${iid}`;
        const row = {
          ...(src || {
            faculty_id: appt.faculty_id,
            homepage: "",
            orcid: "",
            rank: "",
            areas: [],
            has_scholar_data: false,
          }),
          ...tallyPapers(papers),
          papers,
          faculty_id: appt.faculty_id,
          name: appt.name || src?.name || appt.faculty_id,
          institution_id: iid,
          google_scholar_id: appt.google_scholar_id || src?.google_scholar_id || "",
          start_year: appt.start_year,
          end_year: appt.end_year,
          appointment_span: formatAppointmentSpan(appt.start_year, appt.end_year),
          _key: key,
        };
        const inst = byInst.get(iid);
        if (!inst) continue;
        inst.by_appointment = true;
        addFacultyToInst(inst, row);
        facultyOut.push(row);
      }
    }

    return {
      institutions: [...byInst.values()].map(finalizeInst),
      faculty: facultyOut,
    };
  }

  function syncApptToggle() {
    const on = Boolean(state.byAppointment);
    document.body.classList.toggle("is-appointment-view", on);
    if (!els.apptToggle) return;
    els.apptToggle.classList.toggle("is-on", on);
    els.apptToggle.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function syncFacToggle() {
    const on = Boolean(state.facultyView);
    document.body.classList.toggle("is-faculty-view", on);
    if (els.facToggle) {
      els.facToggle.classList.toggle("is-on", on);
      els.facToggle.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (els.searchLabel) els.searchLabel.textContent = on ? "Faculty" : "School";
    if (els.schoolSearch) {
      els.schoolSearch.placeholder = on ? "Search names or schools…" : "Search schools…";
    }
    if (els.nameHead) els.nameHead.textContent = on ? "Faculty" : "Institution";
    if (els.auxHead) {
      els.auxHead.textContent = on ? "Institution" : "Faculty";
      els.auxHead.title = on
        ? "Programs and years on the roster"
        : "Faculty with a Google Scholar ID";
    }
  }

  function facultyRankingRows(view) {
    const whitelist = new Set(allVenueIds());
    const instById = instMetaMap(view);
    const byId = new Map();
    for (const f of view.faculty || []) {
      const fid = f.faculty_id;
      if (!fid) continue;
      const papers = (f.papers || []).filter(paperMatches);
      const labelPapers = (f.papers || []).filter((p) =>
        whitelist.has(p.venue_id)
      );
      const affiliations = affiliationsFor(f, instById);
      const row = {
        ...f,
        papers,
        areas: facultyAreasFromPapers(labelPapers, f.areas),
        ...tallyPapers(papers),
        _key: fid,
        affiliations,
      };
      const prev = byId.get(fid);
      if (!prev || (prev.current_roster === false && f.current_roster !== false)) {
        byId.set(fid, row);
      }
    }
    return [...byId.values()];
  }

  function setAreas(areas) {
    state.selectedAreas = new Set(areas);
    syncAreaUI();
    render();
  }

  function setVenues(ids) {
    state.selectedVenues = new Set(ids);
    syncVenueUI();
    updateJournalsBtn();
    render();
  }

  function syncAreaUI() {
    const all = allAreaNames();
    els.allAreas.checked =
      state.selectedAreas.size === all.length && all.length > 0;
    els.allAreas.indeterminate =
      state.selectedAreas.size > 0 && state.selectedAreas.size < all.length;

    els.areaTree.querySelectorAll('input[data-area]').forEach((box) => {
      box.checked = state.selectedAreas.has(box.dataset.area);
    });
    els.areaTree.querySelectorAll('input[data-domain]').forEach((box) => {
      const domain = domains().find((d) => d.id === box.dataset.domain);
      if (!domain) return;
      const n = domain.areas.filter((a) => state.selectedAreas.has(a)).length;
      box.checked = n === domain.areas.length && n > 0;
      box.indeterminate = n > 0 && n < domain.areas.length;
    });
  }

  function syncVenueUI() {
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
    els.venuesCount.textContent = `${n} / ${total} selected`;
  }

  function updateJournalsBtn() {
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

  function buildSidebar() {
    els.areaTree.innerHTML = domains()
      .map((domain) => {
        const rows = domain.areas
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
        render();
      });
    });

    els.areaTree.querySelectorAll("input[data-domain]").forEach((box) => {
      box.addEventListener("change", () => {
        const domain = domains().find((d) => d.id === box.dataset.domain);
        if (!domain) return;
        if (box.checked) domain.areas.forEach((a) => state.selectedAreas.add(a));
        else domain.areas.forEach((a) => state.selectedAreas.delete(a));
        syncAreaUI();
        render();
      });
    });
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
    const leftover = sortVenues(venuesList().filter((v) => !used.has(v.id)));
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
        render();
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
        render();
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

  const TOUR_STEPS = [
    {
      title: "Welcome to IO Psychology Rankings",
      body: "Find I-O PhD programs by faculty research output in selective journals — similar in spirit to CSRankings.",
      selector: null,
    },
    {
      title: "Filter by Region",
      body: "Looking at the U.S., Canada, or both? Use the region filter to narrow the ranking.",
      selector: '[data-tour="region"]',
    },
    {
      title: "Choose publication years",
      body: "Drag the two handles to set the year range. Default is the most recent 10 years — useful for seeing who is currently active.",
      selector: '[data-tour="years"]',
    },
    {
      title: "Pick a metric",
      body: "Adjusted count (1/N) splits credit across coauthors (default). You can also rank by raw papers, 1st/2nd/last author, last author only, citations, impact-factor sum, or per-faculty versions.",
      selector: '[data-tour="metric"]',
    },
    {
      title: "Minimum faculty",
      body: "Hide smaller programs by requiring at least this many rostered faculty.",
      selector: '[data-tour="minFaculty"]',
    },
    {
      title: "Search schools",
      body: "Type part of a university name to jump to matching programs. In faculty ranking, search also matches people.",
      selector: '[data-tour="search"]',
    },
    {
      title: "Select journals",
      body: "Open Journals to choose which venues count. All whitelist journals are on by default, grouped by discipline and sorted by impact factor. Each row shows JIF, JCR quartile, and ABDC rating. Use Q1 only, A* only, or A* & A only to narrow the set.",
      selector: '[data-tour="journals"]',
    },
    {
      title: "Network analysis",
      body: "Switch to the Network tab for a coauthorship map of faculty with a Google Scholar profile (including people who moved), using the same journal list.",
      selector: '[data-tour="network"]',
    },
    {
      title: "Research areas",
      body: "Use the left sidebar to include or exclude areas (Selection, Leadership, Teams, …). Domain headers toggle a whole group at once.",
      selector: '[data-tour="areas"]',
      place: "right",
    },
    {
      title: "Explore the ranking",
      body: "Click a school to expand faculty. Click a name to see counted papers. Gray names mean no Google Scholar ID was found.",
      selector: '[data-tour="table"]',
      place: "left",
    },
    {
      title: "Count by faculty appointment",
      body: "Turn on by faculty appointment to score programs that have a faculty timeline using only papers published while that person was there. Schools without a timeline stay on the current-faculty default. UIUC is filled in first. This turns off faculty ranking.",
      selector: '[data-tour="appointment"]',
    },
    {
      title: "Faculty ranking",
      body: "Turn on faculty ranking to sort every person instead of programs. Scores use that person’s full paper list (same years, journals, and areas). Appointment years are labels only. This turns off by faculty appointment.",
      selector: '[data-tour="facultyRank"]',
    },
  ];

  let tourIndex = 0;
  let tourTarget = null;

  function clearTourTarget() {
    if (tourTarget) {
      tourTarget.classList.remove("tour-target");
      tourTarget = null;
    }
    if (els.tourSpotlight) {
      els.tourSpotlight.hidden = true;
    }
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

    top = Math.min(
      window.innerHeight - popH - margin,
      Math.max(margin, top)
    );
    left = Math.min(
      window.innerWidth - popW - margin,
      Math.max(margin, left)
    );

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
      arrow.style.left = `${Math.min(
        popW - 24,
        Math.max(16, r2.left + r2.width / 2 - left - 9)
      )}px`;
    } else {
      arrow.classList.add("top");
      arrow.style.left = `${Math.min(
        popW - 24,
        Math.max(16, r2.left + r2.width / 2 - left - 9)
      )}px`;
    }
  }

  function showTourStep() {
    const step = TOUR_STEPS[tourIndex];
    clearTourTarget();
    els.tourTitle.textContent = step.title;
    els.tourBody.textContent = step.body;
    els.tourProgress.textContent = `${tourIndex + 1} / ${TOUR_STEPS.length}`;
    els.tourBack.disabled = tourIndex === 0;
    els.tourNext.textContent =
      tourIndex === TOUR_STEPS.length - 1 ? "Done" : "Next";

    if (step.selector) {
      const el = tourEl(step.selector);
      if (el) {
        tourTarget = el;
        tourTarget.classList.add("tour-target");
      }
    }

    requestAnimationFrame(() => {
      positionTourPopover(step);
    });
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
      localStorage.setItem("io-rankings-tour-seen", "1");
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

  function openFacultyModal(faculty, metricKey) {
    const links = [];
    if (faculty.homepage) {
      links.push(
        `<a href="${escapeAttr(faculty.homepage)}" target="_blank" rel="noopener">Homepage</a>`
      );
    }
    if (faculty.orcid) {
      links.push(
        `<a href="https://orcid.org/${escapeAttr(faculty.orcid)}" target="_blank" rel="noopener">ORCID</a>`
      );
    }
    if (faculty.google_scholar_id) {
      links.push(
        `<a href="https://scholar.google.com/citations?user=${escapeAttr(faculty.google_scholar_id)}" target="_blank" rel="noopener">Scholar</a>`
      );
    }

    const facMetric = facultyMetricKey(metricKey);
    const affilText = (faculty.affiliations || [])
      .map((a) => escapeHtml(affiliationPhrase(a)))
      .join("; ");
    els.modalTitle.textContent = faculty.name;
    els.modalMeta.innerHTML = [
      affilText ||
        (faculty.appointment_span
          ? escapeHtml(faculty.appointment_span)
          : escapeHtml(faculty.rank || "")),
      links.join(" · "),
    ]
      .filter(Boolean)
      .join(" · ");
    els.modalScore.textContent = `${metricLabel(facMetric)}: ${formatScore(
      metricValue(faculty, facMetric),
      facMetric
    )} · ${faculty.raw_count || 0} papers`;
    const areaPills = (faculty.areas || [])
      .map((a) => `<span class="fac-tag">${escapeHtml(a)}</span>`)
      .join("");
    if (areaPills) {
      els.modalScore.innerHTML += `<div class="faculty-tags modal-tags">${areaPills}</div>`;
    }

    const papers = faculty.papers || [];
    if (!papers.length) {
      els.modalPapers.innerHTML =
        "<li class='empty-papers'>No counted papers in this view.</li>";
    } else {
      els.modalPapers.innerHTML = papers
        .map((p) => {
          const doi = p.doi
            ? ` <a href="${escapeAttr(p.doi)}" target="_blank" rel="noopener">DOI</a>`
            : "";
          const tags = (p.areas || [])
            .map((a) => `<span class="tag">${escapeHtml(a)}</span>`)
            .join("");
          const ifVal =
            p.impact_factor != null && Number(p.impact_factor) > 0
              ? Number(p.impact_factor)
              : venueImpactFactor(p.venue_id);
          const ifText =
            ifVal != null ? ` · IF ${Number(ifVal).toFixed(1)}` : "";
          const roles = [];
          if (p.is_first) roles.push("1st");
          if (p.is_second) roles.push("2nd");
          if (p.is_last) roles.push("last");
          const roleText = roles.length ? ` · ${roles.join("/")}` : "";
          return `<li>
            <div class="paper-year">${p.year ?? "—"}</div>
            <div>
              <div class="paper-title">${escapeHtml(p.title || "(untitled)")}${doi}</div>
              <div class="paper-venue">${escapeHtml(p.venue_name || "")}
                · credit ${Number(p.adj_credit || 0).toFixed(2)}${ifText}
                · cites ${Number(p.cited_by_count || 0).toLocaleString()}${roleText}
              </div>
              ${tags ? `<div class="paper-areas">${tags}</div>` : ""}
            </div>
          </li>`;
        })
        .join("");
    }

    if (typeof els.modal.showModal === "function") els.modal.showModal();
    else els.modal.setAttribute("open", "");
  }

  function closeFacultyModal() {
    if (typeof els.modal.close === "function") els.modal.close();
    else els.modal.removeAttribute("open");
  }

  function renderFacultyTable(view) {
    const countries = new Set(els.countries.value.split(","));
    const metric = facultyMetricKey(state.metric);
    const q = (els.schoolSearch?.value || "").trim().toLowerCase();
    const rows = facultyRankingRows(view)
      .map((f) => {
        const affiliations = f.affiliations || [];
        const countriesFound = affiliations.map((a) => a.country).filter(Boolean);
        return {
          ...f,
          instName: affiliations.map(affiliationPhrase).join("; "),
          countriesFound,
          _score: metricValue(f, metric),
        };
      })
      .filter(
        (f) =>
          !f.countriesFound.length ||
          f.countriesFound.some((c) => countries.has(c))
      )
      .filter((f) => {
        if (!q) return true;
        return (
          String(f.name || "").toLowerCase().includes(q) ||
          String(f.instName || "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          b._score - a._score || String(a.name || "").localeCompare(String(b.name || ""))
      );

    els.tbody.innerHTML = "";
    if (!rows.length) {
      els.empty.textContent = q
        ? `No faculty match “${els.schoolSearch.value.trim()}”.`
        : "No faculty match the current filters.";
      els.empty.classList.remove("hidden");
      return;
    }
    els.empty.classList.add("hidden");

    rows.forEach((f, idx) => {
      const tr = document.createElement("tr");
      tr.className = "fac-row";
      const pills = (f.areas || [])
        .map((a) => `<span class="fac-tag">${escapeHtml(a)}</span>`)
        .join("");
      const hasScholar = Boolean(
        f.google_scholar_id &&
          String(f.google_scholar_id).trim() &&
          String(f.google_scholar_id).toLowerCase() !== "nan"
      );
      const nameClass = hasScholar ? "faculty-name" : "faculty-name no-scholar";
      const nameTitle = hasScholar
        ? "View counted papers"
        : "No Google Scholar ID on file";
      const affilHtml = (f.affiliations || [])
        .map((a) => {
          const years = formatAffiliationYears(a);
          return `<div class="affil-item">
            <span class="inst-label">${escapeHtml(a.name)}</span>
            ${a.country ? `<span class="flag" title="${escapeAttr(a.country)}">${escapeHtml(a.country)}</span>` : ""}
            ${years ? `<span class="affil-years">${escapeHtml(years)}</span>` : ""}
          </div>`;
        })
        .join("");
      tr.innerHTML = `
        <td class="col-rank">${idx + 1}</td>
        <td class="col-inst">
          <div class="fac-row-name">
            <button type="button" class="${nameClass}" data-fid="${escapeAttr(f._key || f.faculty_id)}" title="${escapeAttr(nameTitle)}">${escapeHtml(f.name)}</button>
            ${pills ? `<span class="faculty-tags">${pills}</span>` : ""}
          </div>
        </td>
        <td class="col-count">${formatScore(f._score, metric)}</td>
        <td class="col-fac">${affilHtml}</td>
      `;
      tr.addEventListener("click", (ev) => {
        if (ev.target.closest("button")) return;
        if (hasScholar) openFacultyModal(f, state.metric);
      });
      const nameBtn = tr.querySelector(".faculty-name");
      if (nameBtn && hasScholar) {
        nameBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          openFacultyModal(f, state.metric);
        });
      }
      els.tbody.appendChild(tr);
    });
  }

  function render() {
    if (!state.data) return;
    writeHash();
    syncAreaUI();
    updateJournalsBtn();
    syncApptToggle();
    syncFacToggle();

    const baseView = state.data.views[viewKey()];
    if (!baseView) {
      els.tbody.innerHTML = "";
      els.empty.classList.remove("hidden");
      return;
    }

    els.metricHead.textContent = "Count";
    els.metricHead.title = metricLabel(state.metric);

    if (state.facultyView) {
      renderFacultyTable(baseView);
      return;
    }

    const view = rescoreView(baseView);
    const countries = new Set(els.countries.value.split(","));
    const metric = state.metric;
    const minFac = Math.max(1, Number(els.minFaculty.value) || 1);
    const q = (els.schoolSearch?.value || "").trim().toLowerCase();

    const facultyById = new Map(
      view.faculty.map((f) => [f._key || f.faculty_id, f])
    );
    const rows = view.institutions
      .filter((inst) => countries.has(inst.country))
      .filter((inst) => Number(inst.faculty_count) >= minFac)
      .filter((inst) => !q || String(inst.name || "").toLowerCase().includes(q))
      .map((inst) => ({ ...inst, _score: metricValue(inst, metric) }))
      .sort((a, b) => b._score - a._score || a.name.localeCompare(b.name));

    els.tbody.innerHTML = "";
    if (!rows.length) {
      els.empty.textContent = q
        ? `No schools match “${els.schoolSearch.value.trim()}”.`
        : "No institutions match the current filters.";
      els.empty.classList.remove("hidden");
      return;
    }
    els.empty.classList.add("hidden");

    const facMetric = facultyMetricKey(metric);

    rows.forEach((inst, idx) => {
      const tr = document.createElement("tr");
      tr.className = "inst-row";
      const expanded = state.expanded.has(inst.institution_id);
      tr.setAttribute("aria-expanded", expanded ? "true" : "false");
      const home = inst.program_url || inst.homepage;
      const homeLink = home
        ? `<a class="inst-icon" href="${escapeAttr(home)}" target="_blank" rel="noopener" title="Program site" onclick="event.stopPropagation()">⌂</a>`
        : "";
      const apptMark = inst.by_appointment
        ? `<span class="appt-mark" title="Counted from faculty appointment years">faculty appointment</span>`
        : "";
      tr.innerHTML = `
        <td class="col-rank">${idx + 1}</td>
        <td class="inst-name">
          <button type="button" class="expand-btn" aria-label="Expand">${expanded ? "▼" : "▶"}</button>
          <span class="inst-label">${escapeHtml(inst.name)}</span>
          ${homeLink}
          <span class="flag" title="${escapeAttr(inst.country)}">${escapeHtml(inst.country)}</span>
          ${apptMark}
        </td>
        <td class="col-count">${formatScore(inst._score, metric)}</td>
        <td class="col-fac">${inst.faculty_count}</td>
      `;
      tr.addEventListener("click", () => {
        if (state.expanded.has(inst.institution_id)) {
          state.expanded.delete(inst.institution_id);
        } else {
          state.expanded.add(inst.institution_id);
        }
        render();
      });
      els.tbody.appendChild(tr);

      if (expanded) {
        const panel = document.createElement("tr");
        panel.className = "faculty-panel";
        const faculty = (inst.faculty_ids || [])
          .map((id) => facultyById.get(id))
          .filter(Boolean)
          .sort(
            (a, b) =>
              metricValue(b, facMetric) - metricValue(a, facMetric) ||
              a.name.localeCompare(b.name)
          );
        const list = faculty
          .map((f) => {
            const pills = (f.areas || [])
              .map((a) => `<span class="fac-tag">${escapeHtml(a)}</span>`)
              .join("");
            const hasScholar = Boolean(
              f.google_scholar_id &&
                String(f.google_scholar_id).trim() &&
                String(f.google_scholar_id).toLowerCase() !== "nan"
            );
            const nameClass = hasScholar
              ? "faculty-name"
              : "faculty-name no-scholar";
            const nameTitle = hasScholar
              ? "View counted papers"
              : "No Google Scholar ID on file";
            const rankText = f.appointment_span || f.rank || "";
            return `
            <li>
              <div class="faculty-main">
                <button type="button" class="${nameClass}" data-fid="${escapeAttr(f._key || f.faculty_id)}" title="${escapeAttr(nameTitle)}">${escapeHtml(f.name)}</button>
                <span class="faculty-tags">${pills}</span>
              </div>
              <span class="faculty-rank">${escapeHtml(rankText)}</span>
              <span class="score">${formatScore(metricValue(f, facMetric), facMetric)}</span>
            </li>`;
          })
          .join("");
        panel.innerHTML = `<td colspan="4"><ul class="faculty-list">${list}</ul></td>`;
        panel.querySelectorAll(".faculty-name").forEach((btn) => {
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const f = facultyById.get(btn.dataset.fid);
            if (f) openFacultyModal(f, metric);
          });
        });
        els.tbody.appendChild(panel);
      }
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll("'", "&#39;");
  }

  function clampYear(y, lo, hi) {
    return Math.min(hi, Math.max(lo, y));
  }

  /** Parse publication year; reject null/"" (Number(null)===0) and nonsense values. */
  function validYear(value) {
    if (value == null || value === "") return null;
    const y = Number(value);
    if (!Number.isFinite(y)) return null;
    const yi = Math.round(y);
    if (yi < 1900 || yi > 2100) return null;
    return yi;
  }

  function detectYearBounds(data) {
    const view = data?.views?.window_all__with_cross;
    let ymin = Infinity;
    let ymax = -Infinity;
    for (const f of view?.faculty || []) {
      for (const p of f.papers || []) {
        const y = validYear(p.year);
        if (y == null) continue;
        if (y < ymin) ymin = y;
        if (y > ymax) ymax = y;
      }
    }
    const dataYear = validYear(data?.data_year) || new Date().getFullYear();
    if (!Number.isFinite(ymin) || !Number.isFinite(ymax)) {
      return { min: 1990, max: dataYear };
    }
    return { min: ymin, max: Math.max(ymax, dataYear) };
  }

  function resolveYearsFromHash(h) {
    const max = state.yearMax;
    const min = state.yearMin;
    let from = null;
    let to = null;
    const hashFrom = validYear(h.from);
    const hashTo = validYear(h.to);
    if (hashFrom != null || hashTo != null) {
      from = hashFrom;
      to = hashTo;
    } else if (h.window === "all") {
      from = min;
      to = max;
    } else if (h.window === "5") {
      from = max - 4;
      to = max;
    } else {
      // default / window=10
      from = max - 9;
      to = max;
    }
    if (from == null) from = max - 9;
    if (to == null) to = max;
    from = clampYear(from, min, max);
    to = clampYear(to, min, max);
    if (from > to) [from, to] = [to, from];
    return { from, to };
  }

  function applyInitial() {
    const h = parseHash();
    els.countries.value = h.countries;
    els.minFaculty.value = String(h.minFaculty);
    if (els.schoolSearch) els.schoolSearch.value = h.q || "";
    state.facultyView = Boolean(h.faculty);
    state.byAppointment = state.facultyView ? false : Boolean(h.appt);
    syncApptToggle();
    syncFacToggle();
    els.metric.innerHTML = state.data.metrics
      .map((m) => `<option value="${m.key}">${m.label}</option>`)
      .join("");
    state.metric = state.data.metrics.some((m) => m.key === h.metric)
      ? h.metric
      : "adj_count";
    els.metric.value = state.metric;

    const bounds = detectYearBounds(state.data);
    state.yearMin = bounds.min;
    state.yearMax = bounds.max;
    setupYearSliderBounds();
    const years = resolveYearsFromHash(h);
    state.yearFrom = years.from;
    state.yearTo = years.to;
    syncYearUI();

    const all = allAreaNames();
    if (h.areas === null) state.selectedAreas = new Set(all);
    else state.selectedAreas = new Set(h.areas.filter((a) => all.includes(a)));

    const known = new Set(allVenueIds());
    if (h.venues === "all" || h.venues === null) {
      state.selectedVenues = new Set(allVenueIds());
    } else if (h.venues === "q1") {
      state.selectedVenues = new Set(q1VenueIds());
    } else if (h.venues === "astar") {
      state.selectedVenues = new Set(astarVenueIds());
    } else if (h.venues === "a") {
      state.selectedVenues = new Set(aAndAstarVenueIds());
    } else if (h.venues === "io") {
      state.selectedVenues = new Set(ioVenueIds());
    } else if (Array.isArray(h.venues)) {
      state.selectedVenues = new Set(h.venues.filter((id) => known.has(id)));
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
    render();
  }

  async function init() {
    const res = await fetch("data/rankings.json");
    if (!res.ok) {
      els.empty.textContent =
        "Rankings data not found. Run `python pipeline/score.py` first.";
      els.empty.classList.remove("hidden");
      return;
    }
    state.data = await res.json();
    if (els.dataStamp && state.data.generated_at) {
      const d = new Date(state.data.generated_at);
      if (!Number.isNaN(d.getTime())) {
        els.dataStamp.textContent = d.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });
      } else if (state.data.data_year) {
        els.dataStamp.textContent = String(state.data.data_year);
      }
    }
    applyInitial();
    buildSidebar();
    buildVenuesTree();
    syncAreaUI();
    syncVenueUI();
    updateJournalsBtn();

    els.countries.addEventListener("change", render);
    els.minFaculty.addEventListener("change", render);
    els.minFaculty.addEventListener("input", render);
    if (els.schoolSearch) {
      els.schoolSearch.addEventListener("input", render);
      els.schoolSearch.addEventListener("search", render);
    }
    els.yearFrom.addEventListener("input", () => onYearInput("from"));
    els.yearTo.addEventListener("input", () => onYearInput("to"));
    els.metric.addEventListener("change", () => {
      state.metric = els.metric.value;
      render();
    });
    els.allAreas.addEventListener("change", () => {
      if (els.allAreas.checked) setAreas(allAreaNames());
      else setAreas([]);
    });
    els.journalsBtn.addEventListener("click", openJournalsDialog);
    els.journalsClose.addEventListener("click", closeJournalsDialog);
    els.journalsDone.addEventListener("click", closeJournalsDialog);
    els.journalsDialog.addEventListener("click", (ev) => {
      if (ev.target === els.journalsDialog) closeJournalsDialog();
    });
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
    els.venuesAll.addEventListener("click", () => setVenues(allVenueIds()));
    els.venuesQ1.addEventListener("click", () => setVenues(q1VenueIds()));
    els.venuesAstar.addEventListener("click", () => setVenues(astarVenueIds()));
    els.venuesA.addEventListener("click", () => setVenues(aAndAstarVenueIds()));
    els.venuesNone.addEventListener("click", () => setVenues([]));
    if (els.apptToggle) {
      els.apptToggle.addEventListener("click", () => {
        const next = !state.byAppointment;
        state.byAppointment = next;
        if (next) state.facultyView = false;
        syncApptToggle();
        syncFacToggle();
        render();
      });
    }
    if (els.facToggle) {
      els.facToggle.addEventListener("click", () => {
        const next = !state.facultyView;
        state.facultyView = next;
        if (next) state.byAppointment = false;
        syncApptToggle();
        syncFacToggle();
        render();
      });
    }
    els.expandAll.addEventListener("click", () => {
      const view = state.data.views[viewKey()];
      if (!view) return;
      view.institutions.forEach((i) => state.expanded.add(i.institution_id));
      render();
    });
    els.collapseAll.addEventListener("click", () => {
      state.expanded.clear();
      render();
    });
    els.modalClose.addEventListener("click", closeFacultyModal);
    els.modal.addEventListener("click", (ev) => {
      if (ev.target === els.modal) closeFacultyModal();
    });
    window.addEventListener("hashchange", () => {
      applyInitial();
      syncAreaUI();
      syncVenueUI();
      updateJournalsBtn();
      render();
    });
    render();
  }

  init();
})();
