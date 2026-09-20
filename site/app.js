'use strict';

const data = window.ATLAS_DATA;
const nodeMap = new Map(data.nodes.map((node) => [node.region_id, node]));
const basicMap = new Map((data.display_basics?.regions || []).map((item) => [item.region_id, item]));
const descriptionMap = new Map((data.display_descriptions?.regions || []).map((item) => [item.region_id, item]));
const selectable = data.nodes.filter((node) => !node.mvp_exposure || node.mvp_exposure === 'selectable');

const sceneMeta = {
  west: { title: '미국 서부 산지', kicker: 'WEST COAST', countries: ['united-states'] },
  europe: { title: '유럽 산지', kicker: 'EUROPE', countries: ['france', 'italy', 'spain', 'hungary'] },
  other: { title: '남미 · 호주 산지', kicker: 'SOUTHERN HEMISPHERE', countries: ['argentina', 'australia'] }
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const countryOf = (node) => [node.region_id, ...(node.ancestor_ids || [])].find((id) => ['united-states', 'france', 'italy', 'spain', 'hungary', 'argentina', 'australia'].includes(id));
const sceneOf = (node) => node.scene || Object.entries(sceneMeta).find(([, meta]) => meta.countries.includes(countryOf(node)))?.[0] || 'other';
const nodesByScene = Object.fromEntries(Object.keys(sceneMeta).map((scene) => [scene, selectable.filter((node) => sceneOf(node) === scene)]));

const select = document.querySelector('#region-select');
const search = document.querySelector('#region-search');
const results = document.querySelector('#search-results');
const zoomButton = document.querySelector('#toggle-zoom');
const detail = document.querySelector('#detail');
let currentScene = 'west';
let currentRegion = 'bordeaux';
const wineMap = new WineMap(selectable, (id) => showRegion(id));

for (const scene of Object.keys(sceneMeta)) {
  const group = document.createElement('optgroup');
  group.label = `${sceneMeta[scene].title} · ${nodesByScene[scene].length}`;
  nodesByScene[scene].sort((a, b) => a.name_ko.localeCompare(b.name_ko, 'ko')).forEach((node) => {
    const option = document.createElement('option');
    option.value = node.region_id;
    option.textContent = `${node.name_ko} · ${node.canonical_name}`;
    group.append(option);
  });
  select.append(group);
}

function renderScene(scene) {
  currentScene = scene;
  document.querySelectorAll('[data-scene]').forEach((button) => {
    const active = button.dataset.scene === scene;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelector('#scene-title').textContent = sceneMeta[scene].title;
  document.querySelector('#scene-kicker').textContent = sceneMeta[scene].kicker;
  wineMap.view(scene === 'other' ? 'argentina' : scene === 'europe' ? 'france' : scene);
}

function sourceLinks(items, blocks = []) {
  const unique = new Map(items.filter(Boolean).map((source) => [source.url, source]));
  if (!unique.size && !blocks.length) return '';
  const provenance = blocks.length ? '<div class="description-provenance"><h4>묘사에 사용한 기록</h4><p>작품에서 수집한 짧은 기록을 요약·재구성한 표현입니다. 직접 인용이나 새로운 외부 검증 결과가 아닙니다. 시음 예시는 작품 안의 특정 와인 묘사이며 실제 시음 기록을 뜻하지 않습니다.</p></div>' : '';
  return `<details class="source-box"><summary>${blocks.length ? '자료 출처 · 묘사 근거' : `자료 출처 ${unique.size}곳`}</summary>${[...unique.values()].map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(source.publisher)}</span>${esc(source.title || '산지 자료')} ↗</a>`).join('')}${provenance}</details>`;
}

function displayData(node) {
  const basic = basicMap.get(node.region_id);
  return { ...basic, sources: basic.sources || [basic.source] };
}

function showRegion(regionId) {
  const node = nodeMap.get(regionId);
  if (!node || (node.mvp_exposure && node.mvp_exposure !== 'selectable')) return;
  currentRegion = regionId;
  const scene = sceneOf(node);
  if (scene !== currentScene) renderScene(scene);
  wineMap.select(node);
  select.value = regionId;
  const info = displayData(node);
  const blocks = descriptionMap.get(regionId)?.blocks || [];
  const landscape = blocks.find(block => block.kind === 'landscape');
  const sensory = blocks.find(block => block.kind === 'sensory');
  const example = blocks.find(block => block.kind === 'example');
  const parents = node.breadcrumb || [...(node.ancestor_ids || []), node.region_id].map((id) => nodeMap.get(id)?.name_ko).filter(Boolean);
  detail.innerHTML = `
    <div class="detail-top">
      <p class="breadcrumb">${parents.map(esc).join(' / ')}</p>
      <p class="eyebrow">${esc(sceneMeta[scene].kicker)}</p>
      <h2>${esc(node.name_ko)}</h2>
      <p class="latin-name">${esc(node.canonical_name)}</p>
    </div>
    <section class="info-section location-section">
      <h3><span>01</span>산지 위치</h3>
      <p>${esc(info.location)}</p>
    </section>
    <section class="info-section">
      <h3><span>02</span>산지 특징</h3>
      ${landscape ? `<p class="landscape-description">${esc(landscape.text)}</p>` : ''}
      <ul>${info.features.slice(0, 4).map((feature) => `<li>${esc(feature)}</li>`).join('')}</ul>
    </section>
    <section class="info-section">
      <h3><span>03</span>주요 포도</h3>
      <div class="grape-list">${info.grapes.map((grape) => `<span>${esc(grape)}</span>`).join('')}</div>
    </section>
    <section class="info-section memory-section">
      <h3><span>04</span>와인에서 기억할 점</h3>
      <p>${esc(info.wine_note)}</p>
      ${sensory ? `<div class="sensory-description"><h4>맛을 떠올려 보면</h4><p>${esc(sensory.text)}</p></div>` : ''}
      ${example ? `<div class="tasting-example"><h4>시음 묘사 예시</h4><p class="example-label">${esc(example.label)}</p><p>${esc(example.text)}</p></div>` : ''}
    </section>
    ${sourceLinks(info.sources, blocks)}
    <p class="detail-note">산지의 일반 경향입니다. 포도를 수확한 해와 생산자, 와인을 만드는 방식에 따라 실제 와인은 달라질 수 있습니다.</p>`;
  history.replaceState(null, '', `#${encodeURIComponent(regionId)}`);
}

function runSearch(query) {
  const term = query.trim().toLocaleLowerCase('ko');
  results.replaceChildren();
  if (!term) return;
  const matches = selectable.filter((node) => [node.name_ko, node.canonical_name, ...(node.aliases || [])].join(' ').toLocaleLowerCase('ko').includes(term)).slice(0, 9);
  matches.forEach((node) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<strong>${esc(node.name_ko)}</strong><small>${esc(node.canonical_name)}</small>`;
    button.addEventListener('click', () => { showRegion(node.region_id); search.value = node.name_ko; results.replaceChildren(); });
    results.append(button);
  });
  if (!matches.length) results.innerHTML = '<p>일치하는 산지를 찾지 못했습니다.</p>';
}

document.querySelectorAll('[data-scene]').forEach((button) => button.addEventListener('click', () => {
  const scene = button.dataset.scene;
  renderScene(scene);
  showRegion({west:'napa-valley',europe:'bordeaux',other:'mendoza'}[scene]);
}));
select.addEventListener('change', () => showRegion(select.value));
search.addEventListener('input', () => runSearch(search.value));
zoomButton.addEventListener('click', () => {
  wineMap.focus(nodeMap.get(currentRegion));
});
window.addEventListener('hashchange', () => {
  try { showRegion(decodeURIComponent(location.hash.slice(1))); } catch {}
});

try {
  const hash = decodeURIComponent(location.hash.slice(1));
  const hashNode = nodeMap.get(hash);
  if (hashNode && (!hashNode.mvp_exposure || hashNode.mvp_exposure === 'selectable')) currentRegion = hash;
} catch {}

currentScene = sceneOf(nodeMap.get(currentRegion));
renderScene(currentScene);
showRegion(currentRegion);
