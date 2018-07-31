import mongoose from 'mongoose'
import test from 'ava'
import { connect, disconnect } from '../'

const mongoConnectionString = process.env['MONGO_CONNECTION_STRING'] ||
    'mongodb://localhost:27017/test-mongo-connection'


test('mongodb should be able to connect', async t => {
  const connection = connect(mongoConnectionString, { ssl: false, killProcessOnDisconnect: false })
  t.truthy(typeof connection, 'Promise', 'should return a promise')
  await connection
  t.truthy(mongoose.connection.readyState > 0, 'mongo should be connected')
  await disconnect()
})


test('should be able to disconnect', async t => {
  await connect(mongoConnectionString, { ssl: false, killProcessOnDisconnect: false })

  await disconnect()
  t.truthy(mongoose.connection.readyState == 0, 'mongo should be disconnected')
})

test('should reuse a connection', async t => {
  const firstConnection = await connect(mongoConnectionString, { ssl: false, killProcessOnDisconnect: false })
  firstConnection.isReused = true
  let secondConnection = connect(mongoConnectionString)
  t.truthy(typeof secondConnection, 'Promise', 'should return a promise')
  secondConnection = await secondConnection
  t.falsy(secondConnection.isReused, 'should reuse connection')
})
