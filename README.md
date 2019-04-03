# fs-lockfile

Managing the reading and writing of files in the application.

Only one action can manipulate file in the mean time.

## Method of fs-lockfile

- read(filePath): Promise

- write(filePath, content): Promise

## Usage

Example:
```js
const path = require('path')
const { read, write } = require('fs-lockfile')

const filePath = path.join(__dirname, './test.txt')

write(filePath, 'test data').then(data => {
    console.log('data:', data.toString())
}).catch(err => {
    console.error('err:', err)
})
```

## LISENCE
MIT
