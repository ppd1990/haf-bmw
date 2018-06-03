class Blinker {
  constructor(cfg = {}) {
    const {
      display,
      resetInterval = 6000
    } = cfg

    this.display = display
    this.resetInterval = resetInterval
    this.blinking = false
    this.timer = null
  }

  start(which) {
    if (which === "left") {
      this.display.blinkerLeft = true
      this.display.blinkerRight = false
    } else if (which === "right") {
      this.display.blinkerRight = true
      this.display.blinkerLeft = false
    } else {
      this.display.blinkerRight = true
      this.display.blinkerLeft = true
    }
    this.blinking = true
    this.resetTimer()
  }

  stop() {
    this.blinking = false
    if (this.timer !== null) {
      clearTimeout(this.timer)
    }
    this.timer = null
    this.display.blinkerLeft = false
    this.display.blinkerRight = false
  }

  resetTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(() => this.stop(), this.resetInterval)
  }
}

module.exports = Blinker