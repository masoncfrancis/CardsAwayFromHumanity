<template>
  <div class="card-picker">
    <div class="cards" :class="{ picked: picked }">
      <button class="carousel-button previous" type="button" aria-label="Previous card" @click="scrollCards(-1)">
        ‹
      </button>
      <div ref="flickity" class="card-scroller">
        <div class="card-container" v-for="card in cards" :key="card">
          <p class="white-card helvetica" v-html="getWhiteCard(card)"></p>
          <div class="picker">
            <b-button
              type="is-dark"
              size="is-medium"
              outlined
              v-if="!picked"
              @click="pick(card)"
            >Pick Card</b-button>
          </div>
        </div>
      </div>
      <button class="carousel-button next" type="button" aria-label="Next card" @click="scrollCards(1)">
        ›
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { whiteCards } from '../meta/cards';
import { mapState } from 'vuex';
import { Commands, GameCommand, GameState } from '../../../shared/events';

export default defineComponent({
  computed: {
    ...mapState(["user", "gameState"]),
    cards() {
      if (this.user.isCzar) {
        return (this.gameState as GameState).players.map(player => player.card).filter(card => card !== undefined)
      }
      return this.user.hand
    }
  },
  data() {
    return { picked: false, isMoving: false }
  },
  methods: {
    getWhiteCard(card: number) {
      return whiteCards[card] ?? "Card not found?? Please tell the dev thank you!"
    },
    pick(card: number) {
      this.picked = true
      this.$socket.client.emit(Commands.gameCommand, GameCommand.pickCard, card)
    },
    scrollCards(direction: number) {
      const scroller = this.$refs.flickity as HTMLElement
      scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: "smooth" })
    }
  }
})
</script>


<style lang="scss">
@import url("styles.scss");

.flickity-viewport {
  overflow: visible;
}

.card-scroller {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.card-scroller::-webkit-scrollbar {
  display: none;
}

.carousel-button {
  position: absolute;
  z-index: 2;
  top: 90px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 5px;
  background: #333;
  color: white;
  font-size: 34px;
  line-height: 24px;
  cursor: pointer;
}

.carousel-button:hover {
  background: #f90;
}

.carousel-button.previous {
  left: 10px;
}

.carousel-button.next {
  right: 10px;
}

.flickity-button {
  background: #333;
}
.flickity-button:hover {
  background: #f90;
}

.flickity-prev-next-button {
  width: 40px;
  height: 40px;
  border-radius: 5px;
}
/* icon color */
.flickity-button-icon {
  fill: white;
}

.picked {
  .carousel-button {
    display: none;
  }
}
</style>

<style scoped lang="scss">


.card-picker {
  color: white;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: absolute;
}

.cards {
  bottom: 0;
  position: absolute;
  width: 100%;
}
.card-container {
  overflow: visible;
  height: 250px;
  flex: 0 0 250px;
  scroll-snap-align: center;
}

.card-container .white-card {
  transition: 0.2s;
  transform: scale(0.9);
}

.card-container.is-selected {
  .white-card {
    transform: scale(1);
    box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 1);
  }
  .picker button {
    display: block;
  }
}

.picked {
  .white-card {
    transform: translate(0px, 300px) scale(0.9);
  }
  .is-selected .white-card {
    transform: translate(0px, -20px) scale(1.1);
  }
}

.picker {
  position: absolute;
  bottom: 20px;
  width: 100%;
}

.picker button {
  width: 80%;
  margin: auto;
  display: none;
}
</style>
