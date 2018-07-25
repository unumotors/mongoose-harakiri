const mongoose = require('mongoose')

const defaultLogger = {
  log: console.log,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  error: console.error
}

let logger = defaultLogger

mongoose.Promise = global.Promise

applyListenersToConnection(mongoose.connection)

/** DEFAULT OPTIONS
*
* Can be overwritten.
* Check README
*
*/
const ssl = process.env['NODE_ENV'] ? process.env['NODE_ENV'] != 'development' : true
let defaultOptions = {
  ssl,
  sslValidate: false,
  useNewUrlParser: true,
  killProcessOnDisconnect: false // Behavior on disconnect
}
let currentOptions

/**
 * Disconnect a mongo connection
 *
 * @returns {Promise<void>} Promise
 */
function disconnect() {
  logger.debug('**** mongoose-harakiri: Disconnecting...')
  if (mongoose.connection.readyState == 0) {
    return logger.info('**** mongoose-harakiri: Connection is already closed.')
  }
  return mongoose.connection.close()
}

/**
 * Connect to a mongodb
 *
 * @param {string} mongoConnectionString complete mongo connection string. e.g. user:password@mongodb:27017/database
 * @param {object} [options] mongo client options; see README
 *
 * @returns {Promise<Mongoose>} Returns the connection
 */
function connect(mongoConnectionString, options = {}) {
  // Generate options
  currentOptions = { ...defaultOptions, ...options }
  logger.info('**** mongoose-harakiri: Connecting with these options:')
  logger.info('**** mongoose-harakiri:', currentOptions)

  // Check if connection is already open
  if (mongoose.connection.readyState > 0) {
    logger.debug('**** mongoose-harakiri: Connection is already open.')
    return Promise.resolve(mongoose.connection)
  }

  // Prepare mongoose options
  const mongooseOptions = { ...currentOptions }
  delete mongooseOptions.killProcessOnDisconnect

  // Connect
  try {
    return mongoose.connect(mongoConnectionString, mongooseOptions)
  } catch (error) {
    logger.error('**** mongoose-harakiri: Failed connecting to the DB!')
    logger.error(error)
    process.exit(1)
  }
}

function applyListenersToConnection(connection) {
  connection.on('disconnected', () => {
    logger.info('**** mongoose-harakiri: Default connection disconnected.')
    if (currentOptions.killProcessOnDisconnect) return process.exit(1)
  })

  connection.on('connected', () => {
    logger.info('**** mongoose-harakiri: Successfully connected.')
  })

  connection.on('reconnected', () => {
    logger.info('**** mongoose-harakiri: Successfully reconnected.')
  })

  connection.on('error', (err) => {
    logger.error('**** mongoose-harakiri: Mongoose connection error!')
    logger.error(err)
    process.exit(1)
  })
}

function setLogger(newLogger) {
  const fns = Object.keys(defaultLogger)
  fns.forEach(fn => {
    if (typeof newLogger[fn] != 'function') {
      throw new Error(`Logger should have functions called ${fns.join(', ')}. Try using a winston instance.`)
    }
  })

  logger = newLogger
}

module.exports = {
  connect,
  disconnect,
  setLogger
}
