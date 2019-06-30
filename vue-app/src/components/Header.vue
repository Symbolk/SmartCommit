<template>
  <div>
    <b-carousel
      :interval="4000"
      @sliding-end="onSlideEnd"
      @sliding-start="onSlideStart"
      background="#ababab"
      controls
      id="carousel-1"
      img-height="200"
      img-width="1024"
      indicators
      style="text-shadow: 1px 1px 2px #333;"
      v-model="slide"
    >
      <!-- Text slides with image -->
      <b-carousel-slide
        caption="Smart Commit"
        img-src="https://picsum.photos/1024/200/?image=52"
        text="An assistant to help you commit elegantly."
      ></b-carousel-slide>

      <!-- Slides with custom text -->
      <b-carousel-slide img-src="https://picsum.photos/1024/200/?image=54">
        <h1>Hello world!</h1>
      </b-carousel-slide>

      <!-- Slides with image only -->
      <b-carousel-slide img-src="https://picsum.photos/1024/200/?image=58"></b-carousel-slide>

      <!-- Slides with img slot -->
      <!-- Note the classes .d-block and .img-fluid to prevent browser default image alignment -->
      <b-carousel-slide>
        <img
          alt="image slot"
          class="d-block img-fluid w-100"
          height="200"
          slot="img"
          src="https://picsum.photos/1024/200/?image=55"
          width="1024"
        />
      </b-carousel-slide>

      <!-- Slide with blank fluid image to maintain slide aspect ratio -->
      <b-carousel-slide caption="Blank Image" img-alt="Blank image" img-blank>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse eros felis, tincidunt
          a tincidunt eget, convallis vel est. Ut pellentesque ut lacus vel interdum.
        </p>
      </b-carousel-slide>
    </b-carousel>
  </div>
</template>

<script>
export default {
  data() {
    return {
      slide: 0,
      sliding: null
    }
  },
  methods: {
    onSlideStart(slide) {
      this.sliding = true
    },
    onSlideEnd(slide) {
      this.sliding = false
    }
  }
}
</script>