# Third-party notices

## Leaflet

- Project: [Leaflet](https://leafletjs.com/)
- Included version: 1.9.4
- License: BSD 2-Clause License
- Included license text: `site/vendor/LICENSE-Leaflet.txt`

Leaflet is used for map projection, navigation, markers and vector layers. No external map tile service is used.

## Natural Earth

- Project: [Natural Earth](https://www.naturalearthdata.com/)
- Source repository: [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)
- Terms: public domain

The bundled map geography is derived from Natural Earth 1:10m land, boundary and river data and 1:50m United States state boundaries.

## GitHub Actions for Pages

The deployment workflow uses GitHub-maintained `actions/checkout`, `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`. Each action is pinned to an exact release in `.github/workflows/pages.yml`; its upstream repository contains the applicable license and notices.

## Browser OCR

- [Tesseract.js](https://github.com/naptha/tesseract.js/releases/tag/v7.0.0): **7.0.0**, Apache-2.0; `site/vendor/ocr/worker.min.js`, `LICENSE-Tesseract.js.txt`. The worker is from the official npm `tesseract.js-7.0.0.tgz`; only its trailing source-map reference was removed. Bundled dependency notices are retained in `worker.min.js.LICENSE.txt`.
- [tesseract.js-core](https://github.com/naptha/tesseract.js-core): **7.0.0**, Apache-2.0; `LICENSE-core.txt`. The baseline LSTM JavaScript loader and separate WASM come from official npm `tesseract.js-core-7.0.0.tgz`. This portable build does not require SIMD or relaxed SIMD support.
- [tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast/tree/87416418657359cb625c412a48b6e1d6d41c29bd): fixed commit **87416418657359cb625c412a48b6e1d6d41c29bd**, Apache-2.0; `LICENSE-tessdata.txt`. The original `eng.traineddata` and `kor.traineddata` are included unchanged.
- English model SHA-256: `7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2`.
- Korean model SHA-256: `6b85e11d9bbf07863b97b3523b1b112844c43e713df8b66418a081fd1060b3b2`.

All OCR runtime files are hosted with the site; the application sets explicit same-origin paths and disables language caching and diagnostic logging. The source project's asset lock verifies every OCR file, including binaries, before publication. No CDN or cloud OCR service is used.

## Fuse.js

- Version: 7.1.0, basic browser build (about 18 KB, no dependencies).
- Source: https://github.com/krisk/Fuse/releases/tag/v7.1.0
- Distribution: https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.basic.min.js
- Copyright (c) 2025 Kiro Risk. Apache License 2.0; full text: `site/vendor/LICENSE-Fuse.txt`.
- Used only for spelling suggestions after exact matching fails. Self-hosted; no search text is sent to a service.
