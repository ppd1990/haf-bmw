const g = require("logitech-g29")
const PIDController = require("node-pid-controller")

class SteeringWheel {
  constructor(cfg = {}) {
    const defaults = {
      range: 900, // in degrees
      autocenter: false,
      k_p: 0.38 / 10,
      k_i: 0.0003,
      k_d: 0.0001,
      angleTolerance: 1, // in percent 
      controllerThreshold: 10, // in percent
      highSpeedTurningForce: 0.45, // Fmax = 0.5
      friction: 0.3
    }
    this.cfg = Object.assign({}, defaults, cfg)
    this.connected = false
    this.targetAngle = 50
    this.currentAngle = 50
    this.turningDirection = 0

    const { k_p, k_i, k_d } = this.cfg
    this.steeringAngleController = new PIDController({
      k_p,
      k_i,
      k_d
    })
    this.steeringAngleController.setTarget(0)

    g.on("wheel-turn", angle => {
      this.currentAngle = angle
      this._turn()
    })
  }

  set currentAngle(angle) {
    this._currentAngle = angle
    this.currentAngleDeg = this.convertPercentToDegrees(this._currentAngle) 
  }

  get currentAngle() {
    return this._currentAngle
  }

  connect() {
    const { autocenter, range, friction } = this.cfg
    return new Promise((resolve, reject) => {
      g.connect(
        { autocenter, range },
        err => {
          if (err) {
            return reject(err)
          }
          g.forceConstant()
          g.forceFriction(friction)
          console.log("Steering wheel connected")
          this.connected = true
          resolve()
        }
      )
    })
  }

  turnTo(toAngle) {
    this.targetAngle = toAngle
    this._turn()
  }

  turnToDeg(toAngleDeg) {
    this.turnTo(this.convertDegreesToPercent(toAngleDeg))
  }

  convertPercentToDegrees(percent) {
    const { range } = this.cfg
    return percent / 100 * range - range / 2
  }
  
  convertDegreesToPercent(degrees) {
    const { range } = this.cfg
    return (degrees + range / 2) / range * 100
  }

  _turn() {
    const { angleTolerance, controllerThreshold, highSpeedTurningForce } = this.cfg
    const diffAngle = this.targetAngle - this.currentAngle
    const absDiffAngle = Math.abs(diffAngle)
    this.turningDirection = diffAngle <= 0 ? 1 : -1 // 1 ist left, -1 is right
    const force = this.steeringAngleController.update(absDiffAngle)
    if (absDiffAngle < angleTolerance) {
      this.turningDirection = 0
      return g.forceConstant()
    } else if (absDiffAngle < controllerThreshold) {
      g.forceConstant(0.5 + this.turningDirection * force)
    } else {
      g.forceConstant(0.5 - this.turningDirection * highSpeedTurningForce)
    }
  }
}

module.exports = SteeringWheel