//
// Mesh Network PoC
//

'use strict'

function Log() {}

Log.prototype.write = function (string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${string}`)
}

module.exports = exports = new Log()