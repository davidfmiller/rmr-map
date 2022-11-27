/* global document,window,Element,module,require */


(function() {

  'use strict';

  const
  Mapbox = require('mapbox-gl/dist/mapbox-gl.js'),
  RMR = require('rmr-util'),
  Popover = require('../../node_modules/rmr-popover/src/scripts/rmr-popover.js');

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
    coords = options.pins.map(p => { return [p.location.lon, p.location.lat]; }),
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

        const p = options.pins[i];

        marker.setAttribute('title', p.title);
        marker.setAttribute('data-popover', p.title);
        marker.addEventListener('click', e => {
          self.selectPin(
            parseInt(e.target.getAttribute('rmr-map-index'), 10),
            true
          );
        });

        const m = new Mapbox.Marker({
          element: marker,
          offset: [0, 0],
        }).setLngLat(c)

        if (options.popup) {
          const popup = new Mapbox.Popup({ offset: 15 }).setHTML(
            options.popup(i)
          );
          m.setPopup(popup);
        }

        m.addTo(self.Box);
        i++;
      }

      const popover = new Popover({
        root : element,
        debug: false,
        delay: {
          pop: 200,
          unpop: 0
        }
//         factory : function(node) {
//           console.log(node);
//           return { 'content' : node.getAttribute('rmr-map-index') };
//         }
      });

//      self.center();

      self.Box.on('drag', () => {
        // mark as dirty
      });
    });

    this.selectPin = function(index, center) {
      const markers = element.querySelectorAll('.rmr-map-point');
      markers.forEach(m => {
        if (m.getAttribute('rmr-map-index') == index) {
          m.classList.add('rmr-selected');
        } else {
          m.classList.remove('rmr-selected');
        }
      });

      if (center) {
        this.Box.flyTo({
          center: coords[index],
          zoom: 11,
          speed: 3,
          curve: 1,
          easing(t) {
            return t;
          }
        });
      }

      if (options.onSelect) {
        options.onSelect(index);
      }
    };

    this.zoomTo = function(lat, lon) {

      this.Box.flyTo({
        center: [lon, lat],
        zoom: 11
      });
    };

    this.zoomIn = function() {
      this.Box.zoomIn();
    };

    this.zoomOut = function() {
      this.Box.zoomOut();
    };

    this.center = function() {

      if (options.pins.length > 1) {
        this.Box.fitBounds(bounds, {
          padding: 30
        });
      } else {
        this.Box.flyTo({
          center: coords[0],
          zoom: 11
        });
      }

    };
  };

  module.exports = RMRMap;

})();
