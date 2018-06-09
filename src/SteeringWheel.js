const g = require("logitech-g29")

class SteeringWheel {
  constructor(cfg = {}) {
    const defaults = {
      range: 900, // in degrees
      autocenter: false,
      angleTolerance: 1, // in percent 
      maxTurningForce: 0.5,
      turningForceBase: Math.E,
      turningForceExpCoeff: 0.3,
      friction: 0
    }
    this.cfg = Object.assign({}, defaults, cfg)
    this.connected = false
    this.targetAngle = 50
    this.currentAngle = 50
    this.turningDirection = 0

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
    const { angleTolerance, maxTurningForce, turningForceBase, turningForceExpCoeff } = this.cfg
    const diffAngle = this.targetAngle - this.currentAngle
    const absDiffAngle = Math.abs(diffAngle)
    this.turningDirection = diffAngle <= 0 ? 1 : -1 // 1 ist left, -1 is right
    if (absDiffAngle < angleTolerance) {
      this.turningDirection = 0
      return g.forceConstant()
    } else {
      const force = maxTurningForce * (1 - Math.pow(turningForceBase, turningForceExpCoeff * absDiffAngle))
      g.forceConstant(0.5 - this.turningDirection * force)
    }
  }
}

module.exports = SteeringWheel