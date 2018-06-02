function steeringAngleDeg(rawValue) {
  const offset = -1440.11
  const quantifier = 0.04395
  return quantifier * rawValue + offset
}

function steeringAnglePercent(rawValue) {
  return rawValue / 65536 * 100 // 2^16
}

function signalSteeringAngle(data) {
  // byte 2 & 3 = AVL_STEA_DV
  return data.readUInt16LE(2) 
}

module.exports = { steeringAngleDeg, steeringAnglePercent, signalSteeringAngle }