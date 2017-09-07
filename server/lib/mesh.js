//
// Mesh Network PoC
//

'use strict'

const log = require('./log')
const dgram = require('dgram')
const crypto = require('crypto')
const sha1 = crypto.createHash('sha1')

const MODE_DISCOVER = 'DISCOVER'         // THERE?
const MODE_ACK_DISCOVER = 'ACK_DISCOVER' // YES, HERE
const MODE_ACCEPT_ACK = 'ACCEPT_ACK'     // OK COOL, ME TOO

function Mesh() {}

Mesh.prototype.begin = function (address, port) {
  this._activeNodes = {}
  this._staleNodes = {}
  this._address = address
  this._port = port
  this._socket = dgram.createSocket('udp4')
  this._socket.on('error', this.onError.bind(this))
  this._socket.on('message', this.onMessage.bind(this))
  this._socket.on('listening', this.onListening)
  this._socket.bind(port)
  
  this.generateId()
  this.autodiscover()
  this.keepAlive()
}

Mesh.prototype.keepAlive = function () {
  const fn = () => {
    const ids = Object.keys(this._activeNodes)
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const node = this._activeNodes[id]
      const oneMinuteAgo = Date.now() - 60*1000
      if (node.lastActive < oneMinuteAgo) {
        if (node.polls > 3) {
          log.write(`setting ${id} as stale node`)
          this._staleNodes[id] = {
            address: node.address,
            port: node.port,
            lastActive: node.lastActive
          }
          delete this._activeNodes[id]
          break
        }
        
        log.write(`polling ${id} for activity`)
        this.sendMode(MODE_DISCOVER, node.address, node.port)
        node.polls = node.polls ? node.polls + 1 : 1
      }
    }
    setTimeout(fn, 5000)
  }
  setTimeout(fn, 5000)
}

Mesh.prototype.autodiscover = function () {
  if (!this._socket) return
  log.write('autodiscovering permanent nodes')
  for (let i = 1; i < 4; i++) {
    const address = `n${i}.mesh.project`
    if (this._address !== address) {
      this.sendMode(MODE_DISCOVER, address, 12000)
    }
  }
}

Mesh.prototype.sendMessage = function (payload, address, port) {
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const buffer = Buffer.from(message)
  this._socket.send(buffer, port, address)
  log.write(`--> ${address}:${port}: ${message}`)
}

Mesh.prototype.sendMode = function (mode, address, port) {
  this.sendMessage({
    id: this._id,
    mode: mode
  }, address, port)
}

Mesh.prototype.onMessage = function (data, remote) {
  log.write(`<-- ${remote.address}:${remote.port}: ${data}`)
  
  const message = this.safeJsonParse(data)
  
  if (!message.id) {
    log.write(`invalid message: 'id' missing`)
    return
  }
  
  switch (message.mode) {
    case MODE_DISCOVER:
      this.sendMode(MODE_ACK_DISCOVER, remote.address, remote.port)
      break
    case MODE_ACK_DISCOVER:
      this.sendMode(MODE_ACCEPT_ACK, remote.address, remote.port)
    case MODE_ACCEPT_ACK:
      if (!this._activeNodes[message.id]) this._activeNodes[message.id] = {}
      this._activeNodes[message.id].address = remote.address
      this._activeNodes[message.id].port = remote.port
      this._activeNodes[message.id].lastActive = Date.now()
      this._activeNodes[message.id].polls = 0
      
      console.log(this._activeNodes)
      break
  }
}

Mesh.prototype.onError = function (err) {
  if (err.code === 'ENOTFOUND') {
    log.write(`host not found: ${err.hostname}`)
  } else {
    log.write(`socket error:\n${err.code}`)
  }
}

Mesh.prototype.onListening = function () {
  log.write(`listening on ${this.address().address}:${this.address().port}/udp`)
}

Mesh.prototype.generateId = function () {
  // const idString = `${this._address}:${this._port}:${Date.now()}`
  // this._id = this.hashString(idString)
  // DEBUG: use hostname
  this._id = this._address
  log.write(`id set ${this._id}`)
}

Mesh.prototype.hashString = function (string) {
  return crypto.createHash('sha1').update(string).digest('hex')
}

Mesh.prototype.safeJsonParse = function (string) {
  try {
    return JSON.parse(string)
  } catch (e) {
    log.write(`error parsing message: ${string}`)
  }
}

module.exports = exports = new Mesh()