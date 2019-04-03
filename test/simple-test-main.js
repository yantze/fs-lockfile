const path = require('path')
const { read, write } = require('../main.js')

const filePath = path.join(__dirname, './test.txt')

write(filePath, 'test data').then(data => {
    console.log('data:', data.toString())
}).catch(err => {
    console.error('err:', err)
})
