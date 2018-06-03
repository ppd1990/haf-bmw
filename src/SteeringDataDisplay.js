class SteeringDataDisplay {
  constructor(display, fps) {
    this.display = display
    this.interval = 1000 / fps
    this.timer = null

    this.wheelPosition = 0
    this.acceleration = 0
    this.blinkerLeft = 0
    this.blinkerRight = 0
  }

  start() {
    if (this.timer !== null) {
      return
    }
    this.timer = setInterval(() => this.refresh(), this.interval)
  }

  stop() {
    if (this.timer === null) {
      return
    }
    clearInterval(this.timer)
    this.timer = null
  }

  refresh() {
    const blinker = this.blinkerLeft ? 1 : 0  + this.blinkerRight ? 2 : 0

    const cmd = `${this.wheelPosition},${this.acceleration},${blinker}`
    this.display.sendCmd(cmd)
  }
}

module.exports = SteeringDataDisplay