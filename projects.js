/* projects.js — Shared project storage & Fuse.js search utilities */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'energy_intel_v1';
  const PAGE_SIZE = 12;

  function getAllProjects() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function saveProject(searchParams, data) {
    const projects = getAllProjects();
    const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const newName = norm(data.projectName || searchParams.projectName);
    const idx = projects.findIndex(p =>
      norm(p.data?.projectName || p.searchParams?.projectName) === newName
    );
    const entry = {
      id: idx >= 0 ? projects[idx].id : uid(),
      savedAt: new Date().toISOString(),
      searchParams: { ...searchParams },
      data: { ...data },
    };
    if (idx >= 0) projects[idx] = entry;
    else projects.unshift(entry);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      projects.splice(40);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
    return entry;
  }

  function getProjectById(id) {
    return getAllProjects().find(p => p.id === id) || null;
  }

  function deleteProject(id) {
    localStorage.setItem(STORAGE_KEY,
      JSON.stringify(getAllProjects().filter(p => p.id !== id)));
  }

  function capacityString(cap) {
    if (!cap) return '';
    const parts = [];
    if (cap.mw)  parts.push(cap.mw  + ' MW');
    if (cap.mwh) parts.push(cap.mwh + ' MWh');
    return parts.join(' / ');
  }

  function shNames(arr) {
    return (arr || []).map(x => x?.name || '').filter(Boolean).join(' ');
  }

  function toSearchEntry(p) {
    const d = p.data || {};
    const s = p.searchParams || {};
    return {
      id:           p.id,
      savedAt:      p.savedAt,
      projectName:  d.projectName   || s.projectName   || '',
      searchName:   s.projectName   || '',
      altNames:     (d.alternativeNames || []).join(' '),
      country:      d.location?.country  || s.country  || '',
      city:         d.location?.city     || '',
      region:       d.location?.region   || '',
      businessType: s.businessType  || '',
      participants: s.participants   || '',
      developers:   shNames(d.stakeholders?.developer),
      investors:    shNames(d.stakeholders?.investor),
      operators:    shNames(d.stakeholders?.operator),
      constructors: shNames(d.stakeholders?.constructor),
      phase:        d.phase || '',
    };
  }

  function uid() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  const FUSE_OPTS = {
    threshold: 0.35,
    distance: 200,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
    keys: [
      { name: 'projectName',  weight: 4   },
      { name: 'searchName',   weight: 3   },
      { name: 'altNames',     weight: 2   },
      { name: 'participants', weight: 2   },
      { name: 'developers',   weight: 1.5 },
      { name: 'investors',    weight: 1   },
      { name: 'country',      weight: 1.2 },
      { name: 'city',         weight: 1   },
      { name: 'region',       weight: 1   },
      { name: 'businessType', weight: 0.8 },
    ],
  };

  global.EnergyProjects = {
    PAGE_SIZE,
    getAllProjects,
    saveProject,
    getProjectById,
    deleteProject,
    toSearchEntry,
    capacityString,
    FUSE_OPTS,
  };
})(window);
