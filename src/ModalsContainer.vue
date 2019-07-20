<template>
  <div id="sidebar-modals-container">
    <sidebar-modal
      v-for="modal in modals"
      :key="modal.id"
      v-bind="modal.modalAttrs"
      v-on="modal.modalListeners"
      @closed="remove(modal.id)"
    >
      <component
        :is="modal.component"
        v-bind="modal.componentAttrs"
        v-on="$listeners"
        @close="$sidebarModal.hide(modal.modalAttrs.name)"
      />
    </sidebar-modal>
  </div>
</template>
<script>
import { generateId } from './utils'

const PREFIX = '_dynamic_modal_'

export default {
  data() {
    return {
      modals: []
    }
  },
  created() {
    this.$root._dynamicContainer = this
  },
  methods: {
    add(component, componentAttrs = {}, modalAttrs = {}, modalListeners) {
      const id = generateId()
      const name = modalAttrs.name || PREFIX + id

      this.modals.push({
        id,
        modalAttrs: { ...modalAttrs, name },
        modalListeners,
        component,
        componentAttrs
      })

      this.$nextTick(() => {
        this.$sidebarModal.show(name)
      })
    },
    remove(id) {
      for (const i in this.modals) {
        if (this.modals[i].id === id) {
          this.modals.splice(i, 1)
          return
        }
      }
    }
  }
}
</script>
