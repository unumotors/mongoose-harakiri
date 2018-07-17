import mongoose from 'mongoose'
import test from 'ava'
import { connect, disconnect } from '../'

const mongoConnectionString = process.env['MONGO_CONNECTION_STRING'] ||
    'mongodb://localhost:27017/test-mongo-connection'

test('mongodb should be able to connect', async t => {
  await connect(mongoConnectionString, { ssl: false })
  t.truthy(mongoose.connection.readyState > 0, 'mongo should be connected')

  await disconnect()
})


test('should be able to disconnect', async t => {
  await connect(mongoConnectionString, { ssl: false })

  await disconnect()
  t.truthy(mongoose.connection.readyState == 0, 'mongo should be disconected')
})

test('should reuse a connection', async t => {
  await connect(mongoConnectionString, { ssl: false })

  const secondConnection = await connect(mongoConnectionString)

  t.falsy(secondConnection, 'should not establish a second connection')
})
