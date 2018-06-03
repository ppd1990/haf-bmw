const g = require("logitech-g29")
const can = require("socketcan")
const config = require("config")
const SteeringWheel = require("./SteeringWheel")
const LEDDisplay = require("./LEDDisplay")
const SteeringDataDisplay = require("./SteeringDataDisplay")
const Blinker = require("./Blinker")
const { steeringAngleDeg, signalSteeringAngle } = require("./canBMW")

const accelerationLEDs = config.get("accelerationLEDs")
const steeringWheelLEDs = config.get("steeringWheelLEDs")

const steeringWheelConfig = config.get("steeringWheel")
const steeringWheel = new SteeringWheel(steeringWheelConfig) // config.get("steeringWheel")

const ledDisplay = new LEDDisplay(
  config.get("serialPort"),
  config.get("baudRate")
)

const steeringDataDisplay = new SteeringDataDisplay(ledDisplay, 30)

const blinker = new Blinker({
  display: steeringDataDisplay
})

let hafEnabled = false
g.on("wheel-button_spinner", async pressed => {
  if (pressed) {
    return
  }
  hafEnabled = !hafEnabled;
  if (hafEnabled) {
    g.leds(0)
    steeringDataDisplay.acceleration = 0
    steeringDataDisplay.blinkerLeft = false
    steeringDataDisplay.blinkerRight = false
    steeringDataDisplay.wheelPosition = -1
  } else {
    g.leds(1)
    steeringDataDisplay.wheelPosition = lastWheelPosition
  }
})


g.on("wheel-button_l3", on => {
  if (hafEnabled) {
    return
  }
  if (on) {
    blinker.start("left")
  }
})

g.on("wheel-button_r3", on => {
  if (hafEnabled) {
    return
  }
  if (on) {
    blinker.start("right")
  }
})

g.on("pedals-gas", pressure => {
  if (hafEnabled) {
    return
  }
  const leds = Math.round(pressure * (accelerationLEDs + 1))
  steeringDataDisplay.acceleration = +leds
})

g.on("pedals-brake", pressure => {
  if (hafEnabled) {
    return
  }
  const leds = Math.round(pressure * (accelerationLEDs + 1))
  steeringDataDisplay.acceleration = -leds
})

const { range = 900 } = steeringWheelConfig
let lastWheelPosition = null
g.on("wheel-turn", angle => {
  const degrees = (angle / 100 * range ) % 360
  const position = Math.round(degrees / 360 * steeringWheelLEDs)
  lastWheelPosition = position
  if (hafEnabled) {
    return
  }
  steeringDataDisplay.wheelPosition = position
})

const channel = can.createRawChannel(config.get("canInterface"), true)

channel.addListener("onMessage", msg => {
  const { id, data } = msg
  if (id !== 769) { // 0x301
    return
  }
  const steeringAngleBMW = steeringAngleDeg(signalSteeringAngle(data))
  steeringWheel.turnToDeg(steeringAngleBMW)
})

const init = async () => {
  console.log("HAF marionette system")
  await Promise.all([
    steeringWheel.connect(),
    ledDisplay.connect()
  ])
  g.leds(1)
  steeringDataDisplay.start()
  channel.start()
}

init().catch(e => console.error(e))