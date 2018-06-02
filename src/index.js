const g = require("logitech-g29")
const can = require("socketcan")
const config = require("config")
const SteeringWheel = require("./SteeringWheel")
const { steeringAngleDeg, signalSteeringAngle } = require("./canBMW")

const steeringWheel = new SteeringWheel()

class LEDController {
  constructor(port, baudrate) {
    this.port = port
    this.baudrate = baudrate
  }

  connect() {

  }
}

g.on("wheel-button_spinner", on => {
  console.log("haf an & aus", on)
})

g.on("wheel-button_l3", on => {
  console.log("links blinken")
})

g.on("wheel-button_r3", on => {
  console.log("rechts blinken")
})

g.on("pedals-gas", pressure => {
  console.log("gas")
})

g.on("pedals-brake", pressure => {
  console.log("brake")
})

g.on("wheel-turn", angle => {
  // console.log(steeringWheel.currentAngleDeg)
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

steeringWheel.connect().then(() => channel.start())
