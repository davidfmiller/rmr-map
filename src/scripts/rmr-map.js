/* global document,window,Element,module,require */


(function() {

  'use strict';

  const
  Mapbox = require('mapbox-gl/dist/mapbox-gl.js'),
  RMR = require('rmr-util');

  const
  styles = {
    dark: 'mapbox://styles/mapbox/dark-v10',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    night: 'mapbox://styles/mapbox/navigation-night-v1',
  };

  const RMRMap = function(options) {

    const element = document.querySelector(options.element);
    if (! element) {
      console.error('No Mapbox container provided', element);
      return;
    }

    if (! options.key) {
      console.error('No Mapbox key provided');
      return;
    }

    if (! options.styles) {
      options.styles = 'outdoors';
    }

    const
    coords = options.data.map(p => { return [p.location.lon, p.location.lat]; }),
    bounds = new Mapbox.LngLatBounds(
      coords[0],
      coords[0]
    );

    for (const c of coords) {
      bounds.extend(c);
    }

    Mapbox.accessToken = options.key;
    this.Box = new Mapbox.Map({
      container: element,
      style: styles[options.styles],
      center: bounds.getCenter(),
      zoom: options.zoom ? options.zoom : 11
    });

    const self = this;
    this.Box.on('load', () => {

      let i = 0;
      for (const c of coords) {

        const marker = document.createElement('div');
        marker.className = 'rmr-map-point';
        marker.setAttribute('rmr-map-index', i);
        marker.setAttribute('title', 'hi');
        marker.addEventListener('click', e => {
          self.selectPoint(
            parseInt(e.target.getAttribute('rmr-map-index'), 10)
          );
        });

        const m = new Mapbox.Marker({
          element: marker,
          offset: [0, -15],
        }).setLngLat(c);

        m.addTo(self.Box);
        i++;
      }

      self.center();

      self.Box.on('drag', () => {
        // mark as dirty
      });
    });

    this.selectPoint = (index) => {
      const markers = element.querySelectorAll('.rmr-map-point');
      markers.forEach(m => {
        if (m.getAttribute('rmr-map-index') == index) {
          m.classList.add('rmr-selected');
        } else {
          m.classList.remove('rmr-selected');
        }
      });
    };

    this.zoomIn = () => {
      this.Box.zoomIn();
    };

    this.zoomOut = () => {
      this.Box.zoomOut();
    };

    this.center = () => {

      if (options.data.length > 1) {
        this.Box.fitBounds(bounds, {
          padding: 45
        });
      } else {
        this.Box.flyTo({
          center: coords[0]
        });
      }

    };
  };

  module.exports = RMRMap;

})();
