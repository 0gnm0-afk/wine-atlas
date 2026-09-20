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
