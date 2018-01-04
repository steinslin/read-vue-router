import View from './components/view'
import Link from './components/link'

export let _Vue

export function install (Vue) {
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined

  // 实际效果是beforeCreate的时候注册  destroyed的时候销毁 -> undefined
  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance /* 这个在view.js中注册 */)) {
      i(vm, callVal)
    }
  }

  // 全局mixin 在vue实例上绑定_router(VueRouter对象)  并定义响应式的_route(当前route)
  Vue.mixin({
    beforeCreate () {
      // new Vue时给router
      // 根组件会有router
      if (isDef(this.$options.router)) {
        // _routerRoot保存当前实例
        this._routerRoot = this
        this._router = this.$options.router
        this._router.init(this)
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // 不是根组件的 从父那里拿 最开始的父便是root
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      // 销毁route matched.instances[name] = val -> undefined
      registerInstance(this)
    }
  })

  // vue原型上绑定$router和 $route
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

  // 注册组件
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
