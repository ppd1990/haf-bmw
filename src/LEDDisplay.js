const SerialPort = require("serialport")
const Readline = SerialPort.parsers.Readline

const wait = async ms => new Promise(resolve => setTimeout(resolve, ms))

class LEDDisplay {
  constructor(device, baudRate) {
    this.device = device
    this.baudRate = baudRate
    this.ready = false
    this.queue = []
    this.sending = false
    this.watchdog = null
    this.lastSent = 0
  }

  connect() {
    this.port = new SerialPort(this.device, { baudRate: this.baudRate })
    this.parser = new Readline({ delimiter: "\n" })
    this.port.pipe(this.parser)

    return new Promise(resolve => {
      this.parser.on("data", async line => {
        if (line === "k") {
          this._sendNext()
        } else if (line === "ready") {
          await wait(10)
          this.ready = true
          console.log("LED Display ready")
          this._sendNext()
          this._startWatchdog()
          resolve()
        }
      })
    })
  }

  _watchdog() {
    if (this.sending && this.queue.length > 0 && (Date.now() - this.lastSent) > 50) {
      console.log("watchdog sends next")
      this._sendNext()
    }
  }

  _startWatchdog() {
    this.watchdog = setInterval(() => this._watchdog(), 50) // latency: [0;100)
  }

  sendCmd(cmd) {
    this.queue.push(cmd)
    if (this.queue.length > 10) {
      this.queue.shift()
    }
    if (!this.sending && this.ready) {
      this._sendNext()
    }
  }

  _sendNext() {
    if (!this.ready) {
      return
    }
    if (this.queue.length > 0) {
      this.sending = true
      const cmd = this.queue.shift()
      this._sendCmd(cmd)
    } else {
      this.sending = false
    }
  }

  _sendCmd(cmd) {
    return new Promise((resolve, reject) => {
      this.lastSent = Date.now()
      this.port.write(`${cmd}#\n`, e => {
        if (e) {
          return reject(e)
        }
        this.port.drain(async e => {
          if (e) {
            return reject(e)
          }
          resolve()
        })
      })
    })
  }
}

module.exports = LEDDisplay