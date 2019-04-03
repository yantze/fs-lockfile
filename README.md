# fs-lockfile

Managing the reading and writing of files in the application.

Only one action can manipulate file in the mean time.

No Dependencies.

## Installation
```
npm i --save fs-lockfile
```

## Method of fs-lockfile

- **read(filePath): Promise**

- **write(filePath, content): Promise**

## Usage

**Example:**
```js
const path = require('path')
const { read, write } = require('fs-lockfile')

async function demo(filePath) {

    await write(filePath, 'test data')

    const content = await read(filePath)

    console.log('File content:', content.toString())
}
 
const filePath = path.join(__dirname, './test.txt')
demo(filePath)
```

## LISENCE
MIT
