/* global document,window,Element,module,require */


(function() {

  'use strict';

  const
  Mapbox = require('mapbox-gl/dist/mapbox-gl.js'),
  RMR = require('rmr-util'),
  Popover = require('rmr-popover');

  let coords = [], bounds = null;

  const
  styles = {
    dark: 'mapbox://styles/mapbox/dark-v10',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    night: 'mapbox://styles/mapbox/navigation-night-v1',
  };

  const RMRMap = function(options) {

    this.marker = null;

    const element = RMR.Node.get(options.element);
    if (! element) {
      console.error('No Mapbox container provided', element);
      return;
    }

    if (! options.key) {
      console.error('No Mapbox key provided');
      return;
    }

    if (! options.hasOwnProperty('interactive')) {
      options.interactive = true;
    }

    if (options.interactive) {
      element.classList.add('rmr-interactive');
    }

    if (! options.pins && ! options.route) {
      console.error('No data provided');
      return;
    }

    if (! options.styles) {
      options.styles = 'outdoors';
    }

    coords = options.pins ? options.pins.map(p => { return [p.location.lon, p.location.lat]; }) : options.route.map(p => { return [p.location.lon, p.location.lat]; });
    bounds = new Mapbox.LngLatBounds(
      coords[0],
      coords[0]
    );

    for (const c of coords) {
      bounds.extend(c);
    }

    Mapbox.accessToken = options.key;

    const args = {
      container: element,
      style: styles[options.styles],
      center: bounds.getCenter(),
      interactive: !options.hasOwnProperty('interactive') || options.interactive ? true : false
    };

    if (options.zoom) {
      args.zoom = options.zoom;
    }

    this.Box = new Mapbox.Map(args);

    element.classList.add('rmr-map');

    const self = this;
    this.Box.on('load', () => {

      element.classList.add('rmr-load');

      if (options.route) {

        if (! options.line) {
          options.line = {
            'line-color': '#0572f8',
            'line-width': 5
          };
        }

        self.Box.addSource(
          'route',
          {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coords
              }
            }
          }
        );

        self.Box.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: options.line
        });

        const e = document.createElement('div');
        e.className = 'rmr-map-point';
        e.setAttribute('rmr-map-index', 0);

        this.marker = new Mapbox.Marker({
          element: e,
          offset: [0, -15],
        }).setLngLat(coords[0]);

        this.marker.addTo(self.Box);
        self.center(false);

        return;
      }

      // pins

      let
      i = 0,
      m = null;

      for (const c of coords) {
        const marker = document.createElement('div');
        marker.className = 'rmr-map-point';
        marker.setAttribute('rmr-map-index', i);

        const p = options.pins[i];

        marker.setAttribute('title', p.title);
        marker.setAttribute('data-popover', p.title);
        marker.addEventListener('click', e => {
          self.selectPoint(
            parseInt(e.target.getAttribute('rmr-map-index'), 10),
            options.popup ? 11: 0
          );
        });

        m = new Mapbox.Marker({
          element: marker,
          offset: [0, 0],
        }).setLngLat(c)

        if (options.popup) {
          const popupArgs = {
            offset: 15,
            closeOnClick: true
          };

          m.setPopup(new Mapbox.Popup(popupArgs).setHTML(
            options.popup(i)
          ));
        }

        m.addTo(self.Box);
        i++;
      }

      if (options.pins.length > 1) {
        const popover = new Popover({
            root : element,
            delay: { pop: 200, unpop: 0 }
          },
          { position: 'side' }
        );
      } else {
        self.selectPoint(0);
      }

      self.center(false);
    });

    /**
      @param index {int} : 0-based index of pin to be selected
      @param @optional center {bool} : if true map will center on selected pin
      */
    this.selectPoint = function(index, center) {

      if (options.route) {
        this.marker.setLngLat(coords[index]);
      } else {

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
            zoom: center,
            speed: 3,
            curve: 1,
            easing(t) {
              return t;
            }
          });
        }
      }

      if (options.onSelect) {
        options.onSelect(index);
      }
    };

    this.zoomTo = function(lat, lon) {

      let loc = null;
      if (arguments.length == 2) {
        loc = [lon, lat];
      } else {
        loc = coords[arguments[0]];
      }
      console.log(loc);

      const args = {
        center: loc
      }

      if (options.zoom) {
        args.zoom = options.zoom;
      }

      this.Box.flyTo(args);
    };

    this.zoomIn = function() {
      this.Box.zoomIn();
    };

    this.zoomOut = function() {
      this.Box.zoomOut();
    };

    /**
     * @param @optional animated {bool} -
     */
    this.center = function(animated) {
      if (coords.length > 1) {
          this.Box.fitBounds(bounds, {
            padding: 30,
            animate: animated
          });
      } else {
        if (animated) {
          this.Box.flyTo({
            center: coords[0],
            zoom: options.zoom
          },
          { animate: animated });
        }
      }

    };
  };

  module.exports = RMRMap;

})();
