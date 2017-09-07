//
// Mesh Network PoC
//

'use strict'

const mesh = require('./lib/mesh')
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 12000

mesh.begin(hostname, port)