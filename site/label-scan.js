/* Tesseract.js 7.0.0 worker protocol, pinned with vendor checksums.
 * Own the native Worker from construction so even initialization is cancellable.
 * Only encoded, resized pixels cross the Worker boundary; no upload or storage. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dialog = $('label-scan');
  const base = new URL('vendor/ocr/', document.currentScript.src);
  const camera = $('scan-camera-input'), gallery = $('scan-gallery-input');
  const preview = $('scan-preview'), result = $('scan-result'), text = $('scan-text');
  let canvas = null, previewURL = null, inputURL = null, image = null;
  let generation = 0, busy = false, cancelDecode = null;
  let worker = null, ready = false, sequence = 0;
  const pending = new Map();
  const aborted = () => new DOMException('Cancelled', 'AbortError');

  function stopWorker() {
    if (worker) worker.terminate();
    worker = null;
    ready = false;
    for (const { reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(aborted());
    }
    pending.clear();
  }
  function releasePhoto() {
    if (cancelDecode) cancelDecode();
    cancelDecode = null;
    if (image) { image.onload = image.onerror = null; image.removeAttribute('src'); }
    image = null;
    if (inputURL) URL.revokeObjectURL(inputURL);
    if (previewURL) URL.revokeObjectURL(previewURL);
    inputURL = previewURL = null;
    preview.removeAttribute('src');
    preview.hidden = true;
    if (canvas) canvas.width = canvas.height = 0;
    canvas = null;
    camera.value = gallery.value = text.value = '';
    result.hidden = true;
    clearMatches();
  }
  function status(message, percentage) {
    $('scan-status').textContent = message;
    if (percentage !== undefined) $('scan-progress').value = percentage;
  }
  function controls() {
    $('scan-pickers').hidden = Boolean(canvas) || busy;
    $('scan-read').hidden = !canvas || busy;
    $('scan-retake').hidden = !canvas;
    $('scan-stop').hidden = !busy;
    $('scan-progress').hidden = !busy;
    $('scan-search').hidden = result.hidden || busy;
    dialog.setAttribute('aria-busy', String(busy));
  }
  function reset({ terminate = true } = {}) {
    generation++;
    if (terminate || busy) stopWorker();
    busy = false;
    releasePhoto();
    $('scan-error').hidden = true;
    $('scan-read').textContent = '글자 읽기';
    status('사진을 촬영하거나 선택해 주세요.', 0);
    controls();
  }
  function fail(message) {
    $('scan-error').textContent = message;
    $('scan-error').hidden = false;
  }
  function close() { reset(); dialog.close(); }

  function clearMatches() {
    $('scan-candidates').replaceChildren();
    $('scan-match-status').textContent = '';
    $('scan-copy-status').textContent = '';
    $('scan-request').hidden = true;
  }
  function choose(region) {
    text.blur();
    close();
    window.dispatchEvent(new CustomEvent('label-region-selected', { detail: region.id }));
  }
  function searchRegions() {
    if (busy) return;
    clearMatches();
    text.blur();
    const matches = window.RegionMatcher.match(text.value);
    if (matches.kind === 'exact') { choose(matches.candidates[0]); return; }
    $('scan-match-status').textContent = matches.kind === 'none'
      ? '일치하는 산지를 찾지 못했습니다.'
      : matches.kind === 'multiple' ? '여러 산지가 읽혔습니다. 찾는 산지를 선택해 주세요.' : '비슷한 이름을 찾았습니다. 라벨과 비교해 선택해 주세요.';
    for (const region of matches.candidates) {
      const button = document.createElement('button');
      button.type = 'button';
      const title = document.createElement('strong'), subtitle = document.createElement('span');
      title.textContent = region.display_name;
      subtitle.textContent = `${region.local_name} · 지도에서 보기`;
      button.append(title, subtitle);
      button.addEventListener('click', () => choose(region));
      $('scan-candidates').append(button);
    }
    $('scan-request').hidden = false;
    $('scan-match-status').focus({ preventScroll: true });
    $('scan-match-status').scrollIntoView({ block: 'start' });
  }

  async function selectPhoto(file) {
    if (!file) return;
    reset({ terminate: false });
    const ticket = generation;
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || !file.size) {
      fail('사진 파일을 선택해 주세요. JPG, PNG, WebP 사진을 권장합니다.'); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      fail('사진이 너무 큽니다. 20MB 이하 사진을 선택하거나 해상도를 낮춰 다시 촬영해 주세요.'); return;
    }
    busy = true;
    controls();
    status('사진 방향과 크기를 확인하고 있습니다.', 0);
    try {
      inputURL = URL.createObjectURL(file);
      file = null;
      const decoded = new Image();
      image = decoded;
      // Modern image decoding applies all EXIF orientations, including mirroring.
      // Draw once, without an additional rotation (which would double-rotate).
      await new Promise((resolve, reject) => {
        cancelDecode = () => reject(aborted());
        decoded.onload = resolve;
        decoded.onerror = () => reject(new Error('decode'));
        decoded.src = inputURL;
      });
      if (ticket !== generation) return;
      cancelDecode = null;
      const width = decoded.naturalWidth, height = decoded.naturalHeight;
      if (!width || !height || width * height > 48000000 || Math.max(width, height) > 16000) {
        throw new Error('dimensions');
      }
      const scale = Math.min(1, 2000 / Math.max(width, height));
      canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(decoded, 0, 0, canvas.width, canvas.height);
      decoded.removeAttribute('src');
      image = null;
      URL.revokeObjectURL(inputURL);
      inputURL = null;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (ticket !== generation) return;
      if (!blob) throw new Error('canvas');
      previewURL = URL.createObjectURL(blob);
      preview.src = previewURL;
      preview.hidden = false;
      status('사진을 확인한 뒤 글자 읽기를 눌러 주세요.');
    } catch (error) {
      if (ticket !== generation) return;
      releasePhoto();
      fail(error.message === 'dimensions'
        ? '사진 해상도가 너무 큽니다. 4,800만 화소 이하로 줄여 다시 선택해 주세요.'
        : '이 사진을 열 수 없습니다. JPG 또는 PNG로 저장하거나 다시 촬영해 주세요.');
      status('다른 사진으로 다시 시도할 수 있습니다.');
    } finally {
      if (ticket === generation) {
        camera.value = gallery.value = '';
        busy = false;
        controls();
      }
    }
  }

  function job(action, payload, transfers = []) {
    return new Promise((resolve, reject) => {
      const jobId = String(++sequence);
      const timer = setTimeout(() => {
        pending.delete(jobId);
        reject(new Error('timeout'));
        stopWorker();
      }, 120000);
      pending.set(jobId, { resolve, reject, timer });
      worker.postMessage({ workerId: 'label-scan', jobId, action, payload }, transfers);
    });
  }
  async function prepareWorker() {
    if (ready) return;
    worker = new Worker(new URL('worker.min.js', base));
    worker.onmessage = ({ data: message }) => {
      const item = pending.get(message.jobId);
      if (!item) return;
      if (message.status === 'progress') {
        const stages = {
          'loading tesseract core': '글자 읽기 도구를 준비하고 있습니다',
          'loading language traineddata': '영어·한국어 자료를 준비하고 있습니다',
          'initializing tesseract': '글자 읽기 도구를 시작하고 있습니다',
          'initializing api': '영어·한국어 인식을 준비하고 있습니다',
          'recognizing text': '사진의 글자를 읽고 있습니다',
        };
        const percent = Math.round(Math.max(0, Math.min(1, message.data.progress || 0)) * 100);
        status(`${stages[message.data.status] || '글자 읽기를 준비하고 있습니다'} · ${percent}%`, percent);
        return;
      }
      clearTimeout(item.timer);
      pending.delete(message.jobId);
      if (message.status === 'resolve') item.resolve(message.data);
      else item.reject(new Error('ocr'));
    };
    worker.onerror = event => {
      event.preventDefault();
      for (const item of pending.values()) { clearTimeout(item.timer); item.reject(new Error('worker')); }
      pending.clear();
      stopWorker();
    };
    await job('load', { options: { lstmOnly: true, corePath: new URL('tesseract-core-lstm.js', base).href, logging: false } });
    await job('loadLanguage', { langs: ['eng', 'kor'], options: { langPath: new URL('lang/', base).href, gzip: false, cacheMethod: 'none', lstmOnly: true } });
    await job('initialize', { langs: ['eng', 'kor'], oem: 1, config: {} });
    ready = true;
  }
  async function read() {
    if (!canvas || busy) return;
    const ticket = generation;
    busy = true;
    text.value = '';
    result.hidden = true;
    clearMatches();
    $('scan-error').hidden = true;
    controls();
    status('처음에는 글자 읽기 도구를 내려받습니다. 잠시 기다려 주세요.', 0);
    try {
      await prepareWorker();
      if (ticket !== generation) return;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (ticket !== generation) return;
      if (!blob) throw new Error('canvas');
      const pixels = new Uint8Array(await blob.arrayBuffer());
      if (ticket !== generation) return;
      const data = await job('recognize', { image: pixels, options: {}, output: { text: true } }, [pixels.buffer]);
      if (ticket !== generation) return;
      // Remove the encoded image from the worker's volatile filesystem.
      await job('FS', { method: 'unlink', args: ['/input'] });
      text.value = data.text || '';
      result.hidden = false;
      status(text.value.trim() ? '글자를 읽었습니다. 틀린 글자는 직접 고쳐 주세요.' : '읽은 글자가 없습니다. 직접 입력하거나 더 선명한 사진으로 다시 시도해 주세요.', 100);
      $('scan-read').textContent = '다시 읽기';
      // Match after busy is cleared below; do not summon the mobile keyboard.
    } catch (error) {
      if (ticket !== generation) return;
      stopWorker();
      fail('글자를 읽지 못했습니다. 연결 상태를 확인하고 다시 시도하거나 다른 사진을 선택해 주세요.');
      status('사진은 전송되지 않았습니다.');
      $('scan-read').textContent = '다시 시도';
    } finally {
      if (ticket === generation) {
        busy = false; controls();
        if (!result.hidden) searchRegions();
      }
    }
  }

  $('open-label-scan').addEventListener('click', () => { reset(); dialog.showModal(); });
  $('scan-camera').addEventListener('click', () => camera.click());
  $('scan-gallery').addEventListener('click', () => gallery.click());
  for (const input of [camera, gallery]) input.addEventListener('change', () => selectPhoto(input.files[0]));
  $('scan-read').addEventListener('click', read);
  $('scan-search').addEventListener('click', searchRegions);
  text.addEventListener('input', clearMatches);
  $('scan-copy').addEventListener('click', async () => {
    const ticket = generation;
    try {
      await navigator.clipboard.writeText(text.value);
      if (ticket === generation) $('scan-copy-status').textContent = '복사했습니다. GitHub 양식에 직접 붙여넣어 주세요.';
    } catch {
      if (ticket !== generation) return;
      text.focus(); text.select();
      $('scan-copy-status').textContent = '자동 복사가 차단되었습니다. 선택된 글자를 길게 눌러 복사해 주세요.';
    }
  });
  // Safari's keyboard shrinks the visual viewport, not always the layout viewport.
  function fitViewport() {
    if (!window.visualViewport || !dialog.open) return;
    dialog.style.setProperty('--scan-height', `${window.visualViewport.height}px`);
    dialog.style.setProperty('--scan-top', `${window.visualViewport.offsetTop}px`);
  }
  window.visualViewport?.addEventListener('resize', fitViewport);
  window.visualViewport?.addEventListener('scroll', fitViewport);
  $('open-label-scan').addEventListener('click', fitViewport);
  $('scan-retake').addEventListener('click', () => { reset({ terminate: false }); camera.click(); });
  $('scan-stop').addEventListener('click', () => {
    generation++;
    stopWorker();
    if (!canvas) releasePhoto();
    busy = false;
    status('글자 읽기를 취소했습니다. 다시 시도할 수 있습니다.', 0);
    controls();
  });
  $('scan-close').addEventListener('click', close);
  $('scan-cancel').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => reset());
  window.addEventListener('pagehide', close);
})();
