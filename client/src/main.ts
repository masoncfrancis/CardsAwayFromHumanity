import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

import Buefy from 'buefy'
import { socket } from './socket'
import { Events, GameEvents } from '../shared/events'

const app = createApp(App)

app.use(store)
app.use(Buefy, {
  defaultIconPack: 'fas'
})
app.config.globalProperties.$socket = { client: socket }

socket.on(Events.joinedGame, (...payload) => {
  store.commit('SOCKET_JOINED', payload)
})
socket.on(Events.startedSpectating, (...payload) => {
  store.commit(`SOCKET_${Events.startedSpectating.toUpperCase()}`, payload)
})
socket.on(GameEvents.stateChanged, payload => {
  store.commit(`SOCKET_${GameEvents.stateChanged.toUpperCase()}`, payload)
})
socket.on(GameEvents.timer, time => {
  store.commit(`SOCKET_${GameEvents.timer.toUpperCase()}`, time)
})
socket.on(GameEvents.becomeCzar, () => {
  store.commit(`SOCKET_${GameEvents.becomeCzar.toUpperCase()}`)
})
socket.on(GameEvents.updateHand, hand => {
  store.commit(`SOCKET_${GameEvents.updateHand.toUpperCase()}`, hand)
})

app.mount('#app')
