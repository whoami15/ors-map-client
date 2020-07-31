import settingsOptions from '@/resources/settings-options.js'
import defaultMapSettings from '@/resources/default-map-settings'
import utils from '@/support/utils'
import lodash from 'lodash'

export default {
  data: () => ({
    mapSettingsTransient: {
      endpoints: {}
    },
    appLocales: [],
    availableUnits: [],
    availableAreaUnits: []
  }),
  computed: {
    routingLocales () {
      return settingsOptions.routingInstructionsLocales
    },
    availableTileServices () {
      let services = settingsOptions.tileServices
      if (this.mapSettingsTransient.customTileProviderUrl === null || this.mapSettingsTransient.customTileProviderUrl.length === 0) {
        services = lodash.filter(services, function (s) {
          return s.value !== 'custom'
        })
      }
      return services
    }
  },
  methods: {
    save () {
      this.$store.commit('mapSettings', this.mapSettingsTransient)
      localStorage.removeItem('mapSettings')
      if (this.mapSettingsTransient.saveToLocalStorage) {
        let savingSettings = utils.clone(this.mapSettingsTransient)

        // The apiKey must not be saved if is the default one (if is not a custom one)
        if (savingSettings.apiKey === defaultMapSettings.apiKey) {
          delete savingSettings.apiKey
        }
        localStorage.setItem('mapSettings', JSON.stringify(savingSettings))
      }
      // Dispatch an event about the locale change
      this.eventBus.$emit('localeChanged', this.mapSettingsTransient.locale)
    },
    saveAll () {
      if (!this.validateSettings()) {
        this.showError(this.$t('settings.invalidSettingsValue'))
      } else {
        this.save()
        this.showSuccess(this.$t('settings.mapSettingsSaved'))
      }

    },
    restoreDefaultMapSettings () {
      this.mapSettingsTransient = this.mapSettingsTransient = utils.clone(defaultMapSettings)
      this.save()
      this.showSuccess(this.$t('settings.defaultMapSettingsRestored'))
    },
    validateSettings () {
      let valid = true
      if (!this.mapSettingsTransient.locale || !this.mapSettingsTransient.unit || !this.mapSettingsTransient.apiKey || this.mapSettingsTransient.apiKey === '') {
        valid = false
      }
      for (let key in this.mapSettingsTransient.endpoints) {
        if (!this.mapSettingsTransient.endpoints[key] || this.mapSettingsTransient.endpoints[key] === '') {
          valid = false
        }
      }
      return valid
    },
    saveMapSettings () {
      this.$store.commit('mapSettings', this.mapSettingsTransient)
      this.showSuccess(this.$t('settings.mapSettingsSaved'))
    }
  },

  created () {
    this.appLocales = settingsOptions.appLocales
    this.availableUnits = settingsOptions.units
    this.availableAreaUnits = settingsOptions.areUnits
    this.mapSettingsTransient = utils.clone(this.$store.getters.mapSettings)
  }
}