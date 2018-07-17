# mongoose-harakiri

**Mongoose Harakiri ensures a stable connection with mongoose, and kills itself if it can't establish one.**

## Behavior
- Replaces good old `mongoose.connect` call
- Doesn't create a new connection if mongoose is already connected
- If it can't connect, it kills itself, so no more hanging processes!
- If it can't re-connect, it kills itself, so no more hanging processes!
- If there are any problems with mongoose, it kills itself, so no more hanging processes!
- Gives you nice log messages about every action so that you can clearly see what went on
- It uses SSL by default when `NODE_ENV` is set to anything other than `development` (but **does not validate** it.)
- It authenticates against the `admin` database

## Motivation
In the era of cloud computing, orchestration tools, and Kubernetes, we need reliable database connections more than ever. Since the orchestration tool can respawn a container that exits with an error, it's preferable to surface connection problems and explicitly try to re-initiate the connection by killing and spawning the whole container again. Also, applications that rely on databases shouldn't be alive if they aren't actually connected to a database, because they are in fact useless.

## Usage

### `connect(connectionString, [options]) => Boolean`

Connects to a given mongo server. Optionally takes [connection options](https://mongodb.github.io/node-mongodb-native/1.4/driver-articles/mongoclient.html?highlight=server#db-a-hash-of-options-at-the-db-level-overriding-or-adjusting-functionality-not-supported-by-the-url). Returns true when a new connection established, false when there's already an established connection.

```js
const mongooseHarakiri = require('mongoose-harakiri')

mongooseHarakiri.connect('mongodb://user:password@mongodb:27017')
```

Passing [connection options](https://mongodb.github.io/node-mongodb-native/1.4/driver-articles/mongoclient.html?highlight=server#db-a-hash-of-options-at-the-db-level-overriding-or-adjusting-functionality-not-supported-by-the-url):

```js
mongooseHarakiri.connect('mongodb://user:password@mongodb:27017', { ssl: false })
```

### `disconnect() => Promise<void>`

Disconnects a connection if there is one.

#### `options`

Every property can be individually overwritten. Passing an options object does not disable the default options. For example you could use this code to activate SSL & SSL validation and authenticate against the admin database:

```js
{
  ssl: true,
  sslValidate: true
  auth: {
    authSource: 'admin'
  }
}
```

## Running tests locally

To run the tests in development you need a running MongoDB instance.

Via brew:

```sh
brew install mongodb
brew services start mongodb
```

Via docker:

```sh
docker run -d --rm -p 27017:27017 mongo:3.4
```

Then you can run tests:

```sh
npm test
```

## MIT License

Copyright (c) 2018 unu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
