<template>
  <div id="app">
    <transition name="slide-fade">
      <Error v-if="error" />
    </transition>
    <transition name="slide-fade" v-if="$store.state.currentState == ClientState.disconnected">
      <Disconnected />
    </transition>
    <!-- <Spectator />-->
    <Home v-else-if="$store.state.currentState == ClientState.inLobby" />

    <Game v-else-if="currentState == ClientState.inRoom || currentState == ClientState.spectating" />
    <Welcome v-else></Welcome>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
import Welcome from "./components/Welcome.vue";
import Home from "./components/lobby/Home.vue";
import Game from "./components/game/Game.vue";
import Error from "./components/meta/Error.vue";
import Disconnected from "./components/meta/Disconnected.vue";
import Spectator from "./components/game/Spectator.vue";
import { ClientState } from "./store/index";
import { Events, Commands } from "../shared/events";
import { mapState } from "vuex";
import { socket } from "./socket";

export default defineComponent({
  components: {
    Welcome,
    Game,
    Home,
    Error,
    Spectator,
    Disconnected
  },
  mounted() {
    socket.on("connect", this.onSocketConnect)
    socket.on("disconnect", this.onSocketDisconnect)
    socket.on(Events.unknownError, this.onUnknownError)
  },
  beforeUnmount() {
    socket.off("connect", this.onSocketConnect)
    socket.off("disconnect", this.onSocketDisconnect)
    socket.off(Events.unknownError, this.onUnknownError)
  },
  methods: {
    onSocketConnect() {
      // TODO: make this not burn my eyes
      console.log("socket connected");
      if (this.reconnecting) {
        console.log("Reconnecting");
        setTimeout(() => {
          this.$socket.client.emit(
            Commands.rejoin,
            {
              id: this.$store.state.user.userId,
              name: this.$store.state.user.username
            },
            (newId?: string, location?: string, room?: string) => {
              if (newId == null || newId == undefined || location == null) {
                alert("Could not authenticate. Sorry!");
                return;
              }
              this.$store.dispatch("rejoined", {
                location: location,
                room: room
              });
            }
          );
        }, 2000);
      }
    },
    onSocketDisconnect(whyyyyy: string) {
      if (whyyyyy === "io server disconnect") {
        alert("Looks like you got disconnected. Did you open another tab?");
        this.error = true;
      } else {
        this.$buefy.toast.open({
          message: `Lost connection, trying again...`,
          type: "is-danger"
        });
        this.$store.dispatch("disconnected");
        this.reconnecting = true;
      }
    },
    onUnknownError() {
      this.error = true;
    }
  },
  computed: {
    ...mapState(["currentState"])
  },
  data() {
    return {
      ClientState,
      error: false,
      reconnecting: false
    }
  }
})
</script>

<style lang="scss">
@use "bulma/sass" with (
  $primary: #fa8b02,
  $info: #209cee,
  $success: #23d160,
  $warning: #ffdd57,
  $danger: #ff3860,
  $light: #f5f5f5,
  $dark: #363636,
  $link: #3273dc
);
@use "buefy/src/scss/buefy";

html,
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  margin-top: 60px;
  background-color: #242424;
  width: 100%;
  min-height: 100%;
}

.helvetica {
  font-family: "HelveticaNeueBold", "HelveticaNeue-Bold", "Helvetica Neue Bold",
    "HelveticaNeue", "Helvetica Neue", "TeXGyreHerosBold", "Helvetica", "Tahoma",
    "Geneva", "Arial", sans-serif;
  font-weight: 600;
  font-stretch: normal;
}

.slide-fade-enter-active {
  transition: all 0.2s ease;
}
.slide-fade-enter,
.slide-fade-leave-to {
  padding-top: 40px;
  opacity: 0;
}

.button.is-primary {
  background-color: #fa8b02;
  border-color: #fa8b02;
  color: #fff;
}

.button.is-primary:hover,
.button.is-primary.is-hovered {
  background-color: #d97600;
  border-color: #d97600;
  color: #fff;
}

.button.is-primary.is-outlined {
  background-color: transparent;
  border-color: #fa8b02;
  color: #fa8b02;
}

.button.is-primary.is-outlined:hover,
.button.is-primary.is-outlined.is-hovered {
  background-color: #fa8b02;
  border-color: #fa8b02;
  color: #fff;
}

.button.is-info,
.button.is-success,
.button.is-warning,
.button.is-danger,
.button.is-light,
.button.is-dark {
  border-width: 1px;
}

.button.is-info {
  background-color: #209cee;
  border-color: #209cee;
  color: white;
}

.button.is-success {
  background-color: #23d160;
  border-color: #23d160;
  color: white;
}

.button.is-warning {
  background-color: #ffdd57;
  border-color: #ffdd57;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-danger {
  background-color: #ff3860;
  border-color: #ff3860;
  color: white;
}

.button.is-light {
  background-color: #f5f5f5;
  border-color: #dbdbdb;
  color: #363636;
}

.button.is-dark {
  background-color: #363636;
  border-color: #363636;
  color: white;
}

.button.is-info:hover,
.button.is-info.is-hovered {
  background-color: #118fe4;
  border-color: #118fe4;
  color: white;
}

.button.is-success:hover,
.button.is-success.is-hovered {
  background-color: #20bc56;
  border-color: #20bc56;
  color: white;
}

.button.is-danger:hover,
.button.is-danger.is-hovered {
  background-color: #ff1f4b;
  border-color: #ff1f4b;
  color: white;
}

.button.is-light:hover,
.button.is-light.is-hovered {
  background-color: #eeeeee;
  border-color: #d2d2d2;
  color: #363636;
}

.button.is-dark:hover,
.button.is-dark.is-hovered {
  background-color: #292929;
  border-color: #292929;
  color: white;
}

.message.is-info {
  background-color: #eef6fc;
  color: #1d72aa;
}

.message.is-success {
  background-color: #effaf3;
  color: #257942;
}

.message.is-warning {
  background-color: #fffbeb;
  color: #947600;
}

.message.is-danger {
  background-color: #feecf0;
  color: #cc0f35;
}
</style>
