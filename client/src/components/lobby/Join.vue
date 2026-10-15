<template>
  <div class="join">
    <div v-if="joinState == State.Init">
      <p>Please enter the room code:</p>
      <b-field class="wide" expanded>
        <b-input
          v-model="roomCode"
          size="is-large"
          placeholder="AAAH"
          maxlength="4"
          autocomplete="off"
          @update:modelValue="setRoomCode"
        ></b-input>
        <div class="control">
          <b-button
            type="is-info"
            size="is-large"
            v-on:click="join(false)"
            :disabled="roomCode.length !== 4"
            :loading="buttonLoading"
          >Join</b-button>
        </div>
      </b-field>
      <div class="wide">
        <b-button
          type="is-primary"
          v-on:click="spectate()"
          :disabled="roomCode.length !== 4"
          :loading="buttonLoading"
          size="is-medium"
          outlined
          expanded
        >Join as Spectator</b-button>
      </div>
    </div>
    <div v-if="joinState == State.Joining">Joining {{roomCode}}.</div>
    <div v-if="joinState == State.Password">
      <br />Password:
      <input v-model="password" type="password" />
      <br />
      <p v-if="isPasswordInvalid">Password is invalid</p>
      <br />
      <button v-on:click="join(true)" :disabled="password.length == 0">Join game</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Events, Commands } from "../../../shared/events";
import { socket } from "../../socket";

enum State {
  Init,
  Joining,
  Password
}

export default defineComponent({
  mounted() {
    socket.on(Events.invalidRoomCode, this.onInvalidRoomCode)
    socket.on(Events.passwordNeeded, this.onPasswordNeeded)
    socket.on(Events.invalidPassword, this.onInvalidPassword)
  },
  beforeUnmount() {
    socket.off(Events.invalidRoomCode, this.onInvalidRoomCode)
    socket.off(Events.passwordNeeded, this.onPasswordNeeded)
    socket.off(Events.invalidPassword, this.onInvalidPassword)
  },
  data() {
    return {
      roomCode: "",
      joinState: State.Init,
      State,
      password: "",
      isPasswordInvalid: false
    }
  },

  computed: {
    isRoomInvalid(): boolean {
      return this.roomCode.length !== 4 || /[^A-Z]/.test(this.roomCode);
    }
  },

  methods: {
    setRoomCode(value: string) {
      this.roomCode = value.toUpperCase().replace(/\s/g, "").slice(0, 4)
    },
    onInvalidRoomCode() { alert("Invalid Room Code") },
    onPasswordNeeded() { this.askPassword(false) },
    onInvalidPassword() { this.askPassword(true) },
    join(withPassword: boolean) {
    this.roomCode = this.roomCode.toUpperCase().replace(/\s/g, "").slice(0, 4)
    if (this.isRoomInvalid) {
      alert("Room code is invalid.");
      return;
    }

    const payload = { gameId: this.roomCode };

    if (withPassword) {
      payload["password"] = this.password;
    }

    this.joinState = State.Joining;

    this.$socket.client.emit(Commands.joinGame, payload);
    },

    spectate() {
    this.roomCode = this.roomCode.toUpperCase().replace(/\s/g, "").slice(0, 4)
    if (this.isRoomInvalid) {
      alert("Room code is invalid.");
      return;
    }

    this.joinState = State.Joining;

    this.$socket.client.emit(Commands.joinGame, { gameId: this.roomCode, action: Commands.spectate});
    },

    askPassword(isRetry: boolean) {
    this.password = "";
    this.joinState = State.Password;
    this.isPasswordInvalid = isRetry;
    }
  }
})
</script>

<style lang="scss">
.join {
  .wide {
    width: 250px;
    max-width: 100%;
    margin: auto;

    .control {
      min-width: 0;
    }

    input {
      font-family: "HelveticaNeueBold", "HelveticaNeue-Bold",
        "Helvetica Neue Bold", "HelveticaNeue", "Helvetica Neue",
        "TeXGyreHerosBold", "Helvetica", "Tahoma", "Geneva", "Arial", sans-serif;
      font-weight: 600;
    }
  }
}
</style>
