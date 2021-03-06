
import Leaflet from 'leaflet'
import GeoUtils from '@/support/geo-utils'
import { ReverseGeocode } from '@/support/ors-api-runner'
import Place from '@/models/place'

export default {
  data () {
    return {
      showLeftClickPopup: false,
      clickPoint: null,
      clickLatlng: null,
      clickInsidePolygon: false,
      data: null
    }
  },
  props: {
    currentZoom: {
      required: true,
      type: Number
    }
  },
  computed: {
    placeInfo () {
      if (this.clickPoint) {
        return this.clickPoint
      }
    },
    hasPlaceInfo () {
      if (this.clickPoint) {
        return true
      }
      return false
    },
    placeInfoTitle () {
      const title = this.clickInsidePolygon ? this.$t('mapView.placeInsidePolygon') : this.$t('mapView.placeInfo')
      return title
    }
  },
  methods: {
    /**
     * Close the place info pop up
     */
    closePlaceInfo () {
      this.clickLatlng = null
      this.$emit('closed')
    },
    /**
     * Deal wth the map rigt click, preparing the data and displaying the modal
     * @param {*} data
     */
    mapLeftClick (data) {
      this.clickInsidePolygon = data.insidePolygon
      this.showLeftClickPopup = true
      this.clickLatlng = data.event.latlng
      this.clickPoint = { latlng: data.event.latlng }

      // Calculate and set polygon area
      if (this.clickInsidePolygon !== false) {
        const latlngs = []
        for (const key in this.clickInsidePolygon) {
          latlngs.push(GeoUtils.buildLatLong(this.clickInsidePolygon[key][1], this.clickInsidePolygon[key][0]))
        }
        const area = Leaflet.GeometryUtil.geodesicArea(latlngs)
        this.clickPoint.containerArea = Leaflet.GeometryUtil.readableArea(area, this.$store.getters.mapSettings.areaUnit)
        this.clickInsidePolygon = true
      }

      if (this.$refs.placeInfoBox) {
        this.$refs.placeInfoBox.show()
      }

      const context = this
      this.resolvePoint(data.event.latlng.lat, data.event.latlng.lng).then((place) => {
        if (place) {
          context.clickPoint.placeName = place.placeName
          context.$forceUpdate()
        }
      })
    },
    /**
     * Resolve the coordinates of a point to a qualified location
     * @param lar
     * @param lng
     * @param options
     * @returns {Promise}
     * @emits showLoading (via eventBus)
     */
    resolvePoint (lat, lng) {
      return new Promise((resolve, reject) => {
        this.eventBus.$emit('showLoading', true)
        const context = this
        ReverseGeocode(lat, lng).then(places => {
          if (places.length > 0) {
            const selectedPlace = Place.selectPlaceByZoomLevel(context.currentZoom, places)
            resolve(selectedPlace)
          } else {
            const place = new Place(lat, lng)
            resolve(place)
          }
        }).catch(response => {
          console.log(response)
          reject(response)
        }).finally(() => {
          this.eventBus.$emit('showLoading', false)
        })
      })
    },
    /**
     * Copy latitude.longitude to clipboard
     *
     */
    copyLatlng () {
      const latlng = `${this.clickLatlng.lat}, ${this.clickLatlng.lng}`
      if (this.copyToClipboard(latlng)) {
        this.showSuccess(this.$t('mapView.latlngCopied'), { timeout: 2000 })
      }
    },
    /**
     * Copy longitude, latitude to clipboard
     *
     */
    copyLnglat () {
      const lnglat = `${this.clickLatlng.lng}, ${this.clickLatlng.lat}`
      if (this.copyToClipboard(lnglat)) {
        this.showSuccess(this.$t('mapView.lnglatCopied'), { timeout: 2000 })
      }
    },
    /**
     * Copy the string to chipboard by creating a temporary textarea element
     *
     * @param {*} str
     * @returns {Boolean}
     */
    copyToClipboard (str) {
      const el = document.createElement('textarea')
      el.value = str
      document.body.appendChild(el)
      el.select()
      const result = document.execCommand('copy')
      document.body.removeChild(el)
      return result
    }
  },
  created () {
    const context = this
    this.eventBus.$on('mapLeftClicked', (data) => {
      context.mapLeftClick(data)
    })
    this.eventBus.$on('mapRightClicked', () => {
      context.showLeftClickPopup = false
    })
  }
}
