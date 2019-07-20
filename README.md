# vue-sidebar-modal

##### Simple to use sidebar modal based on the [Vue JS Modal Plugin](https://github.com/euvl/vue-js-modal)

### Install
```bash
npm install vue-sidebar-modal --save
```

### How to use

Include plugin in your `main.js` file.

```javascript
import SidebarModal from 'vue-sidebar-modal'

Vue.use(SidebarModal)
```

Create modal:

```vue
<sidebar-modal name="hello-world">
  hello, world!
</sidebar-modal>
```
Call it from anywhere in the app:

```javascript
methods: {
  show () {
    this.$sidebarModal.show('hello-world');
  },
  hide () {
    this.$sidebarModal.hide('hello-world');
  }
}
```
---

You can easily send data into the modal:

```javascript
this.$sidebarModal.show('hello-world', { foo: 'bar' })
```

And receive it in `beforeOpen` event handler:

```vue
<sidebar-modal name="hello-world" @before-open="beforeOpen"/>
```
```javascript
methods: {
  beforeOpen (event) {
    console.log(event.params.foo);
  }
}
```

### Dynamic Modals

In order to instantiate modals at runtime (for lazy-loading or decluttering templates), it is possible to create modals dynamically.

To start using this feature just include the `<sidebar-modals-container />` component it in your project:

```vue
<sidebar-modals-container />
```
Call it (the first argument is the component definition, the second are component properties, the third modal parameters, and the fourth the modal event listeners):

```javascript
this.$sidebarModal.show({
  template: `
    <div>
      <h1>This is created inline</h1>
      <p>{{ text }}</p>
    </div>
  `,
  props: ['text']
}, {
  text: 'This text is passed as a property'
}, {
  height: 'auto'
}, {
  'before-close': (event) => { console.log('this will be called before the modal closes'); }
})
```

It can also be used with `.vue` files:

```javascript
import MyComponent from './MyComponent.vue'

this.$sidebarModal.show(MyComponent, {
  text: 'This text is passed as a property'
}, {
  height: 'auto'
})
```

You can close dynamic modals by emitting a `'close'` event:

```javascript
this.$sidebarModal.show({
  template: `
    <div>
      <p>Close using this button:</p>
      <button @click="$emit('close')">Close</button>
    </div>
  `
})
```