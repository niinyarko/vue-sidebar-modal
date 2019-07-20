<template>
  <div>
    <transition
      name="slide-fade"
      @before-enter="beforeTransitionEnter"
      @after-enter="afterTransitionEnter"
      @after-leave="afterTransitionLeave"
    >
      <div
        v-if="visibility.modal"
        ref="modal"
        :class="modalClass"
        :style="modalStyle"
      >
        <slot />
      </div>
    </transition>
    <transition name="slide-fade">
      <div
        ref="overlay"
        :class="modalClass"
        class="modal-mask modal-module__modal-mask___3xH2Q"
        @mousedown.self="handleBackgroundClick"
        @touchstart.self="handleBackgroundClick"
      />
    </transition>
  </div>
</template>
<script>
import { createModalEvent } from './utils'
import { parseNumber, validateNumber } from './parser'
import Modal from './index'

export default {
  name: 'SidebarModal',
  props: {
    name: {
      type: String
    },
    clickToClose: {
      type: Boolean,
      default: true
    },
    width: {
      type: [Number, String],
      default: 600,
      validator: validateNumber
    },
    height: {
      type: [Number, String],
      default: '100%',
      validator(value) {
        return value === 'auto' || validateNumber(value)
      }
    },
    classes: {
      type: [Array],
      default() {
        return []
      }
    }
  },
  data() {
    return {
      visible: false,
      visibility: {
        modal: false,
        overlay: false
      },
      mutationObserver: null,
      delay: {
        type: Number,
        default: 0
      },
      modal: {
        width: 0,
        widthType: 'px',
        height: 0,
        heightType: '%',
        renderedHeight: 0
      },
      window: {
        width: 0,
        height: 0
      }
    }
  },
  computed: {
    modalClass() {
      const classes = this.classes.reduce(function(result, item, index) {
        result[index] = true
        return result
      }, {})
      return {
        'modal-module__is-visible___2wKcA': this.visibility.modal,
        'is-visible': this.visibility.modal,
        'side-modal': true,
        'modal-module__side-modal___3cUif': true,
        ...classes
      }
    },
    modalStyle() {
      const heightValue = parseNumber(this.height)
      return {
        width: this.width + 'px',
        height: `${heightValue.value}${heightValue.type}`
      }
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.visibility.overlay = true
        setTimeout(() => {
          this.visibility.modal = true
          this.$nextTick(() => {
            this.callAfterEvent(true)
          })
        }, this.delay)
      } else {
        this.visibility.modal = false
        setTimeout(() => {
          this.visibility.overlay = false
          this.$nextTick(() => {
            this.callAfterEvent(false)
          })
        }, this.delay)
      }
    }
  },
  created() {
    this.setInitialSize()
  },
  /**
   * Sets global listeners
   */
  beforeMount() {
    Modal.event.$on('toggle', this.handleToggleEvent)

    if (this.clickToClose) {
      window.addEventListener('keyup', this.handleEscapeKeyUp)
    }
  },
  /**
   * Removes global listeners
   */
  beforeDestroy() {
    Modal.event.$off('toggle', this.handleToggleEvent)
    if (this.clickToClose) {
      window.removeEventListener('keyup', this.handleEscapeKeyUp)
    }
  },
  methods: {
    setInitialSize() {
      const { modal } = this
      const width = parseNumber(this.width)
      const height = parseNumber(this.height)
      modal.width = width.value
      modal.widthType = width.type
      modal.height = height.value
      modal.heightType = height.type
    },
    handleToggleEvent(name, state, params) {
      if (this.name === name) {
        const nextState = typeof state === 'undefined' ? !this.visible : state
        this.toggle(nextState, params)
      }
    },
    handleEscapeKeyUp(event) {
      if (event.which === 27 && this.visible) {
        this.$modal.hide(this.name)
      }
    },
    /**
     *'opened' and 'closed' events are `$emit`ed here.
     * This is called in watch.visible.
     * Because modal DOM updates are async,
     * wrapping afterEvents in `$nextTick` fixes `$refs.modal` undefined bug.
     * (fixes #15)
     */
    callAfterEvent(state) {
      if (state) {
        this.connectObserver()
      } else {
        this.disconnectObserver()
      }
      const eventName = state ? 'opened' : 'closed'
      const event = this.createModalEvent({ state })
      this.$emit(eventName, event)
    },
    /**
     * Generates event object
     */
    createModalEvent(args = {}) {
      return createModalEvent({
        name: this.name,
        ref: this.$refs.modal,
        ...args
      })
    },
    /**
     * Event handler which is triggered on $modal.show and $modal.hide
     * BeforeEvents: ('before-close' and 'before-open') are `$emit`ed here,
     * but AfterEvents ('opened' and 'closed') are moved to `watch.visible`.
     */
    toggle(nextState, params) {
      const { visible } = this
      if (visible === nextState) {
        return
      }
      const beforeEventName = visible ? 'before-close' : 'before-open'
      if (beforeEventName === 'before-open') {
        /**
         * Need to unfocus previously focused element, otherwise
         * all keypress events (ESC press, for example) will trigger on that element.
         */
        if (
          document.activeElement &&
          document.activeElement.tagName !== 'BODY' &&
          document.activeElement.blur
        ) {
          document.activeElement.blur()
        }
        document.body.classList.add('modal-open')
      } else {
        document.body.classList.remove('modal-open')
      }

      let stopEventExecution = false
      const stop = () => {
        stopEventExecution = true
      }
      const beforeEvent = this.createModalEvent({
        stop,
        state: nextState,
        params
      })

      this.$emit(beforeEventName, beforeEvent)
      if (!stopEventExecution) {
        this.visible = nextState
      }
    },
    /**
     * Event handler that is triggered when background overlay is clicked
     */
    handleBackgroundClick() {
      if (this.clickToClose) {
        this.toggle(false)
      }
    },
    /**
     * Start observing modal's DOM, if childList or subtree changes,
     * the callback (registered in beforeMount) will be called.
     */
    connectObserver() {
      if (this.mutationObserver) {
        this.mutationObserver.observe(this.$refs.overlay, {
          childList: true,
          attributes: true,
          subtree: true
        })
      }
    },
    /**
     * Disconnects MutationObserver
     */
    disconnectObserver() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect()
      }
    },
    beforeTransitionEnter() {
      this.connectObserver()
    },
    afterTransitionEnter() {
      // console.log('after transition enter')
    },
    afterTransitionLeave() {
      // console.log('after transition leave')
    }
  }
}
</script>
<style>
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-to,
.slide-fade-leave {
  opacity: 1;
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter,
.slide-fade-leave-to {
  opacity: 0;
  -webkit-transform: translate3d(100%, 0, 0);
  transform: translate3d(100%, 0, 0);
}

#sidebar-modals-container .sidemodal {
  top: 0;
  overflow: hidden;
}
#sidebar-modals-container .sidemodal .modal-header {
  border-bottom-width: 2px;
  height: 72px;
  padding: 16px 16px 25px 25px;
  white-space: nowrap;
}
#sidebar-modals-container .sidemodal .modal-actions {
  width: 50%;
  float: right;
  text-align: right;
}
#sidebar-modals-container .sidemodal .modal-actions .btn {
  margin-left: 15px;
}
#sidebar-modals-container .sidemodal .modal-actions .btn-group {
  margin-left: 15px;
}
#sidebar-modals-container .sidemodal .modal-actions .btn-group .btn {
  box-sizing: border-box;
  margin-left: -2px;
  width: 51px;
}
#sidebar-modals-container .sidemodal .modal-body {
  bottom: 0;
  left: 0;
  overflow: auto;
  padding: 33px;
  position: absolute;
  right: 0;
  top: 72px;
}
#sidebar-modals-container .sidemodal .modal-body .tab-content {
  position: absolute;
  top: 70px;
  bottom: 33px;
  right: 33px;
  left: 33px;
}
#sidebar-modals-container .sidemodal .modal-body .tab-content .tab-pane {
  height: 100%;
}
#sidebar-modals-container .sidemodal .modal-dialog {
  padding: 0;
  margin-right: 0;
  height: 100%;
  width: 680px;
}
#sidebar-modals-container .sidemodal.fade .modal-dialog {
  transform: 100% 0;
  transition: transform 0.3s ease-out;
}
#sidebar-modals-container .sidemodal.in .modal-dialog .sidemodal:focus {
  outline: none;
}
#sidebar-modals-container .side-modal {
  position: fixed;
  top: 0;
  right: -720px;
  z-index: 9998;
  padding: 45px 105px 90px;
  overflow: scroll;
  background-color: #fff;
  box-shadow: -2px 0 6px rgba(41, 70, 97, 0.1);
  transition: right 0.5s;
}
#sidebar-modals-container .side-modal .alert, #sidebar-modals-container .side-modal .input-select-wrap, #sidebar-modals-container .side-modal .input-text-wrap, #sidebar-modals-container .side-modal fieldset, #sidebar-modals-container .side-modal h2, #sidebar-modals-container .side-modal p {
  margin-bottom: 30px;
}
#sidebar-modals-container .side-modal fieldset:last-of-type {
  margin-bottom: 45px;
}
#sidebar-modals-container .side-modal fieldset :last-child {
  margin-bottom: 0;
}
#sidebar-modals-container .side-modal .alert {
  margin: 0 -105px;
}
#sidebar-modals-container .side-modal .alert p {
  margin-bottom: 0;
}
#sidebar-modals-container .side-modal .tab-wrapper.is-ab-testing {
  padding-bottom: 1px;
  margin: 0 -105px 20px;
  border-top: 1px solid #e9ecef;
}
#sidebar-modals-container .side-modal .btn-list {
  display: flex;
  justify-content: flex-end;
}
#sidebar-modals-container .modal-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 998;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.5s;
}
#sidebar-modals-container .modal-mask.is-visible {
  pointer-events: all;
  opacity: 1;
}
#sidebar-modals-container .side-modal {
  right: -100%;
  padding-left: 90px;
  padding-right: 90px;
}
#sidebar-modals-container .side-modal.wide {
  min-width: 800px;
  width: auto;
  right: -200%;
  max-width: 1024px;
}
#sidebar-modals-container .side-modal.is-visible {
  right: 0;
}
#sidebar-modals-container .sidemodal {
  overflow: auto;
}
#sidebar-modals-container .sidemodal .modal-dialog {
  margin-top: 0;
  margin-bottom: 0;
}
#sidebar-modals-container .sidemodal .modal-body {
  line-height: 27px;
}

</style>
