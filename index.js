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

// Disable max-len because of long links
/* eslint max-len: 0 */

/** DEFAULT OPTIONS
*
* Can be overwritten. See these see
* https://mongodb.github.io/node-mongodb-native/1.4/driver-articles/mongoclient.html?highlight=server#db-a-hash-of-options-at-the-db-level-overriding-or-adjusting-functionality-not-supported-by-the-url
* Beware that this link may change its version when mongoose is updated
*/
const ssl = process.env['NODE_ENV'] ? process.env['NODE_ENV'] != 'development' : true
const defaultOptions = {
  useMongoClient: true,
  ssl,
  sslValidate: false
}

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
 * @param {object} [options] mongo client options see link below
 * https://mongodb.github.io/node-mongodb-native/1.4/driver-articles/mongoclient.html?highlight=server#db-a-hash-of-options-at-the-db-level-overriding-or-adjusting-functionality-not-supported-by-the-url
 *
 * @returns {Boolean} If a new connection has been established
 */
function connect(mongoConnectionString, options = {}) {
  // Generate options
  options = { ...defaultOptions, ...options }
  logger.info('**** mongoose-harakiri: Connecting with these options;', options)

  // Check if connection is already open
  if (mongoose.connection.readyState > 0) {
    logger.debug('**** mongoose-harakiri: Connection is already open.')
    return false
  }

  // Connect
  try {
    mongoose.connect(mongoConnectionString, options)
  } catch (error) {
    logger.error('**** mongoose-harakiri: Failed connecting to the DB!')
    logger.error(error)
    process.exit(1)
  }

  // apply listeners
  try {
    applyListenersToConnection(mongoose.connection)
  } catch (error) {
    logger.error('**** mongoose-harakiri: Could not apply listeners!')
    logger.error(error)
    process.exit(1)
  }
  return true
}

function applyListenersToConnection(connection) {
  connection.on('disconnected', () => {
    logger.info('**** mongoose-harakiri: Default connection disconnected.')
  })

  connection.on('connected', () => {
    logger.info('**** mongoose-harakiri: Successfully connected.')
  })

  connection.on('reconnectFailed', () => {
    // The mongo client will try to reconnect for 30 seconds and then emit this event
    // The 30 seconds are the default and can be changed using these settings:
    // https://mongodb.github.io/node-mongodb-native/1.4/driver-articles/mongoclient.html?highlight=server#db-a-hash-of-options-at-the-db-level-overriding-or-adjusting-functionality-not-supported-by-the-url
    logger.error('**** mongoose-harakiri: Reconnect failed.')
    process.exit(1)
  })

  connection.on('reconnected', () => {
    logger.debug('**** mongoose-harakiri: Successfully reconnected.')
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
