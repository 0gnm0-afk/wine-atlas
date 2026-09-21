/* Public names only. All matching stays in this browser. */
(() => {
  'use strict';
  const normalize = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '')
    .normalize('NFC').toLowerCase().replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const generic = new Set(normalize('wine wines estate estates france italy spain australia argentina hungary usa us united states america korea germany portugal vin vino chateau domaine winery bottled bottle product produce imported importer export reserve red white grand cru appellation controlee aoc aop doc docg ava valley county district bank left right 프랑스 이탈리아 스페인 호주 미국 아르헨티나 헝가리 한국 독일 포르투갈 와인 산지 생산자 좌안 우안').split(' '));
  const meaningful = value => value.split(' ').some(word => !generic.has(word) && !/^\d+$/.test(word));
  const names = window.REGION_SEARCH.flatMap(region => [...new Set([
    region.display_name, region.english_name, region.local_name, ...region.aliases,
  ].map(normalize))].filter(name => name && meaningful(name)).map(name => ({ region, name })));
  let fuzzy;
  function match(value) {
    const query = normalize(value).slice(0, 12000);
    if (!query || !meaningful(query)) return { kind: 'none', candidates: [] };
    const whole = names.filter(item => item.name === query);
    let exact = whole;
    if (!whole.length) {
      const padded = ` ${query} `;
      const hits = names.flatMap(item => {
        const needle = ` ${item.name} `, spans = [];
        let start = padded.indexOf(needle);
        while (start !== -1) {
          spans.push({ ...item, start, end: start + needle.length });
          start = padded.indexOf(needle, start + 1);
        }
        return spans;
      });
      // Rioja Alta should not also select Rioja merely because it is a substring.
      exact = hits.filter(hit => !hits.some(other => other.name.length > hit.name.length && other.start <= hit.start && other.end >= hit.end));
    }
    const regions = [...new Map(exact.map(item => [item.region.id, item.region])).values()];
    if (regions.length) return { kind: regions.length === 1 ? 'exact' : 'multiple', candidates: regions.slice(0, 3) };

    // Only now use Fuse. Compare full token windows, not arbitrary substrings.
    fuzzy ||= new Fuse(names, { keys: ['name'], includeScore: true, threshold: 0.25, ignoreLocation: true, ignoreFieldNorm: true });
    const words = query.split(' ').slice(0, 350), candidates = new Map();
    const sizes = new Set(names.map(item => item.name.split(' ').length));
    for (const size of sizes) for (let i = 0; i + size <= words.length; i++) {
      const fragment = words.slice(i, i + size).join(' ');
      if (fragment.length < 4 || !meaningful(fragment)) continue;
      for (const hit of fuzzy.search(fragment, { limit: 6 })) {
        if (hit.item.name.length < 4 || Math.min(fragment.length, hit.item.name.length) / Math.max(fragment.length, hit.item.name.length) < 0.75) continue;
        if (hit.item.name.split(' ').length !== size) continue;
        const previous = candidates.get(hit.item.region.id);
        if (!previous || hit.score < previous.score) candidates.set(hit.item.region.id, { region: hit.item.region, score: hit.score });
      }
    }
    const ranked = [...candidates.values()].sort((a, b) => a.score - b.score).slice(0, 3).map(item => item.region);
    // OCR spelling suggestions always require a user choice.
    return { kind: ranked.length ? 'fuzzy' : 'none', candidates: ranked };
  }
  window.RegionMatcher = { normalize, match };
})();
