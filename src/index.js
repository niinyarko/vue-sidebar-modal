import Modal from './Modal.vue'
import ModalsContainer from './ModalsContainer.vue'

const defaultComponentName = 'SidebarModal'

const Plugin = {
  install(Vue, options = {}) {
    /**
     * Makes sure that plugin can be installed only once
     */
    if (this.installed) {
      return
    }

    this.installed = true
    this.event = new Vue()
    this.rootInstance = null
    this.componentName = options.componentName || defaultComponentName
    /**
     * Plugin API
     */
    Vue.prototype.$sidebarModal = {
      show(modal, paramsOrProps, params, events = {}) {
        if (typeof modal === 'string') {
          Plugin.event.$emit('toggle', modal, true, paramsOrProps)
          return
        }

        const root = Plugin.rootInstance
        const container = root._dynamicContainer

        if (container) {
          container.add(modal, paramsOrProps, params, events)
        }
      },
      hide(name, params) {
        Plugin.event.$emit('toggle', name, false, params)
      },

      toggle(name, params) {
        Plugin.event.$emit('toggle', name, undefined, params)
      }
    }
    
    Vue.component(this.componentName, Modal)
    Vue.component('SidebarModalsContainer', ModalsContainer)
    Vue.mixin({
      beforeMount() {
        if (Plugin.rootInstance === null) {
          Plugin.rootInstance = this.$root
        }
      }
    })
  }
}

export default Plugin
