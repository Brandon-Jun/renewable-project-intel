'use strict';

// ── State ──────────────────────────────────────────────────────
let currentData  = null;
let searchParams = {};
let fromList     = false;

const $ = id => document.getElementById(id);

// ── Helpers ────────────────────────────────────────────────────
function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── Section visibility ─────────────────────────────────────────
function showSection(name) {
  ['searchSection','loadingSection','errorSection','dashboard'].forEach(id =>
    $(id).classList.add('hidden'));
  $(name).classList.remove('hidden');
}

function resetToSearch() {
  if (fromList) { window.location.href = 'list.html'; return; }
  const url = new URL(window.location);
  url.search = '';
  window.history.replaceState({}, '', url);
  showSection('searchSection');
  $('searchBtn').disabled = false;
  $('searchBtn').querySelector('.btn-text').textContent = 'AI 검색 시작';
}

// ── Loading animation ──────────────────────────────────────────
function animateLoadingSteps() {
  [
    { el:'step1', delay:0 },
    { el:'step2', delay:8000 },
    { el:'step3', delay:20000 },
  ].forEach(({ el, delay }) => {
    setTimeout(() => {
      const step = $(el); if (!step) return;
      const prev = {step2:'step1',step3:'step2'}[el];
      if (prev) { const p=$(prev); p.classList.remove('active'); p.classList.add('done'); }
      step.classList.add('active');
    }, delay);
  });
}

// ── Format helpers ─────────────────────────────────────────────
function na(val, suffix='') { return (val===null||val===undefined||val===''||val==='null') ? '—' : val+suffix; }
function phaseLabel(p)  { return {development:'개발',construction:'건설',operation:'운영'}[p]||p||'—'; }
function phaseClass(p)  { return ['development','construction','operation'].includes(p)?p:''; }
function confLabel(c)   { return {high:'데이터 신뢰도: 높음',medium:'데이터 신뢰도: 보통',low:'데이터 신뢰도: 낮음'}[c]||c||''; }
function shIcon(t)      { return {developer:'🏗️',constructor:'⚙️',operator:'⚡',investor:'💼'}[t]||'🏢'; }
function shLabel(t)     { return {developer:'개발사',constructor:'시공사',operator:'운영사',investor:'투자사'}[t]||t; }
function gridStatusLabel(s) { return {connected:'계통 연계 완료',pending:'연계 대기 중',planned:'연계 계획 중',unknown:'정보 없음'}[s]||s||'—'; }
function curtailmentBadge(r) {
  if (!r||r==='unknown') return '';
  return `<span class="curtailment-badge ${r}">${{high:'위험',medium:'보통',low:'낮음'}[r]||r}</span>`;
}
function ppaTypeLabel(t) { return {PPA:'PPA (전력구매계약)',market:'시장 판매',merchant:'상업 판매',unknown:'미정'}[t]||t||'—'; }

// ── Render dashboard ───────────────────────────────────────────
function renderDashboard(data, params, fromStorage=false) {
  currentData  = data;
  searchParams = params;

  $('dashSearchDate').textContent = `검색일: ${data.searchDate||new Date().toISOString().split('T')[0]}`;
  const cb = $('confidenceBadge');
  cb.textContent = confLabel(data.dataConfidence);
  cb.className = `confidence-badge ${data.dataConfidence||'medium'}`;

  const backBtn = document.querySelector('.btn-back');
  if (backBtn) backBtn.textContent = fromList ? '← 목록으로' : '← 새 검색';

  $('projName').textContent = data.projectName||params.projectName;
  $('projAltNames').textContent = (data.alternativeNames||[]).join(' / ');
  $('tagType').textContent = params.businessType;
  const phEl = $('tagPhase');
  phEl.textContent = phaseLabel(data.phase);
  phEl.className = `tag tag-phase ${phaseClass(data.phase)}`;
  $('tagCountry').textContent = data.location?.country||params.country;

  const cap = data.capacity;
  let capStr = '—';
  if (cap?.mw) capStr = cap.mw+' MW'+(cap.mwh?` / ${cap.mwh} MWh`:'');
  $('metCapacity').textContent = capStr;
  $('metPhase').textContent    = phaseLabel(data.phase);
  $('metCOD').textContent      = na(data.timeline?.codYear,'년');
  $('overviewStatus').textContent = data.timeline?.currentStatus||'';

  const loc = data.location||{};
  const addrParts = [loc.city,loc.region,loc.country].filter(Boolean);
  $('locationAddress').textContent = addrParts.join(', ')||'—';
  if (loc.coordinates?.lat&&loc.coordinates?.lng)
    $('locationCoords').textContent = `${loc.coordinates.lat}, ${loc.coordinates.lng}`;
  if (data.siteSizeHectares) $('siteSize').textContent = `부지 면적: ${data.siteSizeHectares} ha`;

  const mapQuery = loc.address||addrParts.join(', ')||(params.projectName+' '+params.country);
  $('mapLink').href = `https://www.google.com/maps/search/${encodeURIComponent(mapQuery)}`;
  $('mapEmbed').src = loc.coordinates?.lat&&loc.coordinates?.lng
    ? `https://maps.google.com/maps?q=${loc.coordinates.lat},${loc.coordinates.lng}&z=10&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  const sg = $('stakeholderGrid');
  sg.innerHTML = '';
  ['developer','constructor','operator','investor'].forEach(type => {
    const list = data.stakeholders?.[type];
    if (!list||!list.length) return;
    const g = document.createElement('div');
    g.className = 'stakeholder-group';
    g.innerHTML = `<div class="sh-group-title">${shLabel(type)}</div>`;
    list.forEach(sh => {
      if (!sh?.name) return;
      const item = document.createElement('div');
      item.className = 'sh-item';
      item.innerHTML = `
        <div class="sh-icon">${shIcon(type)}</div>
        <div class="sh-details">
          <div class="sh-name">${escHtml(sh.name)}</div>
          <div class="sh-meta">${escHtml(sh.country||'')} ${sh.type?`· ${escHtml(sh.type)}`:''}</div>
        </div>
        ${sh.equity?`<div class="sh-equity">${escHtml(sh.equity)}</div>`:''}
      `;
      g.appendChild(item);
    });
    sg.appendChild(g);
  });

  const fin = data.financials||{};
  let invStr = '—';
  if (fin.totalInvestmentUSD) invStr = `USD ${fin.totalInvestmentUSD}M`;
  if (fin.totalInvestmentLocal) invStr += ` (${fin.totalInvestmentLocal})`;
  $('finInvestment').textContent = invStr;
  $('finIRR').textContent        = fin.irr ? `${fin.irr}%` : '—';
  $('finGeneration').textContent = fin.expectedGenerationGwh ? `${fin.expectedGenerationGwh} GWh/년` : '—';
  $('finSiteSize').textContent   = data.siteSizeHectares ? `${data.siteSizeHectares} ha` : '—';

  const grid = data.gridConnection||{};
  $('gridInfo').innerHTML = `
    <div class="info-row"><span class="info-label">계통 상태</span><span class="info-val">${gridStatusLabel(grid.status)}</span></div>
    ${grid.substation?`<div class="info-row"><span class="info-label">변전소</span><span class="info-val">${escHtml(grid.substation)}</span></div>`:''}
    ${grid.transmissionOperator?`<div class="info-row"><span class="info-label">계통 운영사</span><span class="info-val">${escHtml(grid.transmissionOperator)}</span></div>`:''}
    <div class="info-row"><span class="info-label">Curtailment</span><span class="info-val">${curtailmentBadge(grid.curtailmentRisk)||'—'}</span></div>
    ${grid.curtailmentNotes?`<div class="info-row"><span class="info-label">비고</span><span class="info-val" style="color:var(--gray-600);font-weight:400">${escHtml(grid.curtailmentNotes)}</span></div>`:''}
  `;

  const ppa = data.powerPurchase||{};
  $('ppaInfo').innerHTML = `
    <div class="info-row"><span class="info-label">판매 유형</span><span class="info-val">${ppaTypeLabel(ppa.type)}</span></div>
    ${ppa.buyer?`<div class="info-row"><span class="info-label">수요가 / 구매자</span><span class="info-val">${escHtml(ppa.buyer)}</span></div>`:''}
    ${ppa.term?`<div class="info-row"><span class="info-label">계약 기간</span><span class="info-val">${escHtml(ppa.term)}년</span></div>`:''}
    ${ppa.price?`<div class="info-row"><span class="info-label">단가</span><span class="info-val">${escHtml(ppa.price)}</span></div>`:''}
    ${!ppa.buyer&&!ppa.term&&!ppa.price?`<div class="info-row"><span class="info-label">비고</span><span class="info-val" style="color:var(--gray-400)">상세 정보 없음</span></div>`:''}
  `;

  const nl = $('newsList');
  nl.innerHTML = '';
  const news = data.news||[];
  if (!news.length) {
    nl.innerHTML='<p style="color:var(--gray-400);font-size:13px;">관련 뉴스를 찾지 못했습니다.</p>';
  } else {
    news.forEach(item => {
      if (!item?.title) return;
      const div = document.createElement('div');
      div.className = `news-item${item.hasCurtailment?' has-curtailment':''}${item.isHighlight?' is-highlight':''}`;
      div.innerHTML = `
        <div class="news-header">
          <span class="news-title">${escHtml(item.title)}</span>
          ${item.hasCurtailment?'<span class="news-badge curtailment">⚡ Curtailment</span>':''}
          ${item.isHighlight&&!item.hasCurtailment?'<span class="news-badge highlight">주요</span>':''}
        </div>
        ${item.summary?`<p class="news-summary">${escHtml(item.summary)}</p>`:''}
        <div class="news-footer">
          ${item.date?`<span class="news-date">📅 ${escHtml(item.date)}</span>`:''}
          ${item.source?`<span class="news-source">📰 ${escHtml(item.source)}</span>`:''}
          ${item.url?`<a class="news-link" href="${escHtml(item.url)}" target="_blank" rel="noopener">링크 →</a>`:''}
        </div>
      `;
      nl.appendChild(div);
    });
  }

  const sources = data.sources||[];
  if (sources.length)
    $('sourcesRow').innerHTML = `<span class="sources-label">참고 출처:</span>${sources.map(escHtml).join(' · ')}`;

  if (!fromStorage && typeof EnergyProjects !== 'undefined')
    EnergyProjects.saveProject(params, data);

  showSection('dashboard');
}

// ── Autocomplete (uses INITIAL_PROJECTS + localStorage) ────────
let fuseAc      = null;
let acDropdown  = null;
let acInput     = null;

// Merge initial data + localStorage projects into unified search list
function buildAcEntries() {
  const initial = (window.INITIAL_PROJECTS || []).map(p => ({
    source:       'initial',
    id:           p.id,
    projectName:  p.projectName,
    country:      p.country,
    businessType: p.businessType,
    participants: p.participants,
    capacity:     p.capacity,
  }));

  const historical = typeof EnergyProjects !== 'undefined'
    ? EnergyProjects.getAllProjects().map(p => ({
        source:       'history',
        id:           p.id,
        projectName:  p.data?.projectName || p.searchParams?.projectName || '',
        country:      p.data?.location?.country || p.searchParams?.country || '',
        businessType: p.searchParams?.businessType || '',
        participants: p.searchParams?.participants || '',
        capacity:     EnergyProjects.capacityString(p.data?.capacity),
        _project:     p,
      }))
    : [];

  // Merge: historical overrides initial for same project name
  const seen = new Set(historical.map(e => e.projectName.toLowerCase().trim()));
  const merged = [
    ...historical,
    ...initial.filter(e => !seen.has(e.projectName.toLowerCase().trim())),
  ];
  return merged;
}

function initAutocomplete() {
  acInput    = $('projectName');
  acDropdown = $('acDropdown');
  if (!acInput || !acDropdown) return;
  if (typeof Fuse === 'undefined') return;

  acInput.addEventListener('input',   renderAc);
  acInput.addEventListener('focus',   renderAc);
  acInput.addEventListener('keydown', e => { if (e.key==='Escape') hideAc(); });
  document.addEventListener('click',  e => {
    if (!e.target.closest('.autocomplete-wrapper')) hideAc();
  });
}

function renderAc() {
  const query   = (acInput.value||'').trim();
  const entries = buildAcEntries();
  if (!entries.length) return;

  fuseAc = new Fuse(entries, {
    threshold: 0.35, ignoreLocation: true,
    includeScore: true, minMatchCharLength: 2,
    keys: [{ name:'projectName',weight:4 },{ name:'participants',weight:1.5 },{ name:'country',weight:1 }],
  });

  let results;
  if (!query) {
    // Recent 8 items (historical first, then initial)
    results = entries.slice(0,8);
  } else {
    results = fuseAc.search(query).slice(0,8).map(r => r.item);
  }

  if (!results.length) { hideAc(); return; }

  acDropdown.innerHTML = '';

  results.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'ac-item';
    const nameHL = query
      ? escHtml(entry.projectName).replace(new RegExp(`(${escRegex(query)})`, 'gi'), '<mark>$1</mark>')
      : escHtml(entry.projectName);
    const sourceTag = entry.source === 'history'
      ? '<span class="ac-source-tag ac-source-history">검색이력</span>'
      : '<span class="ac-source-tag ac-source-initial">DB</span>';
    div.innerHTML = `
      <div class="ac-name">${nameHL} ${sourceTag}</div>
      <div class="ac-meta">
        ${entry.country?`<span class="ac-tag">${escHtml(entry.country)}</span>`:''}
        ${entry.businessType?`<span class="ac-tag">${escHtml(entry.businessType)}</span>`:''}
        ${entry.capacity?`<span class="ac-dev">⚡ ${escHtml(entry.capacity)}</span>`:''}
      </div>
    `;
    div.addEventListener('mousedown', e => {
      e.preventDefault();
      hideAc();
      if (entry.source === 'history' && entry._project) {
        // Load full dashboard from localStorage
        loadFromStorage(entry._project.id);
      } else {
        // Auto-fill form fields from initial data
        autoFillForm(entry);
      }
    });
    acDropdown.appendChild(div);
  });

  const footer = document.createElement('div');
  footer.className = 'ac-footer';
  footer.innerHTML = `<a href="list.html">전체 목록 보기 →</a>`;
  acDropdown.appendChild(footer);
  acDropdown.classList.remove('hidden');
}

function hideAc() { acDropdown?.classList.add('hidden'); }

// ── Auto-fill form from initial data ──────────────────────────
function autoFillForm(entry) {
  if (!entry) return;
  acInput.value = entry.projectName;

  const country = $('country');
  if (country && entry.country) {
    // Try exact match first
    const opt = [...country.options].find(o => o.value === entry.country);
    if (opt) country.value = entry.country;
  }

  const bType = $('businessType');
  if (bType && entry.businessType) {
    const opt = [...bType.options].find(o => o.value === entry.businessType);
    if (opt) bType.value = entry.businessType;
  }

  const participants = $('participants');
  if (participants && entry.participants) participants.value = entry.participants;

  const capacity = $('capacity');
  if (capacity && entry.capacity) capacity.value = entry.capacity;

  // Visual feedback
  acInput.style.borderColor = 'var(--green)';
  setTimeout(() => { acInput.style.borderColor = ''; }, 1200);
}

// ── Load from localStorage ─────────────────────────────────────
function loadFromStorage(id) {
  const project = EnergyProjects?.getProjectById(id);
  if (!project) { alert('저장된 프로젝트를 찾을 수 없습니다.'); return; }
  renderDashboard(project.data, project.searchParams, true);
}

// ── Prefill from initial data (URL param ?prefill=ID) ──────────
function handlePrefill(id) {
  const projects = window.INITIAL_PROJECTS || [];
  const found = projects.find(p => p.id === id);
  if (!found) return;
  autoFillForm(found);
  // Scroll to form and highlight
  const form = document.getElementById('searchSection');
  if (form) form.scrollIntoView({ behavior:'smooth' });
}

// ── URL param handling ─────────────────────────────────────────
function handleUrlParams() {
  const params  = new URLSearchParams(window.location.search);
  fromList = params.get('from') === 'list';

  const projectId = params.get('project');
  if (projectId) { loadFromStorage(projectId); return; }

  const prefillId = params.get('prefill');
  if (prefillId) { handlePrefill(prefillId); }
}

// ── Form submit ────────────────────────────────────────────────
document.getElementById('searchForm').addEventListener('submit', async e => {
  e.preventDefault();
  hideAc();

  const params = {
    projectName:  $('projectName').value.trim(),
    country:      $('country').value,
    businessType: $('businessType').value,
    participants: $('participants').value.trim(),
    capacity:     $('capacity').value.trim(),
  };
  searchParams = params;

  $('searchBtn').disabled = true;
  $('searchBtn').querySelector('.btn-text').textContent = '검색 중...';
  showSection('loadingSection');
  animateLoadingSteps();

  try {
    const res  = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `서버 오류 (${res.status})`);
    renderDashboard(data, params, false);
  } catch (err) {
    $('errorMessage').textContent = err.message;
    showSection('errorSection');
    $('searchBtn').disabled = false;
    $('searchBtn').querySelector('.btn-text').textContent = 'AI 검색 시작';
  }
});

// ── Init ───────────────────────────────────────────────────────
initAutocomplete();
handleUrlParams();
