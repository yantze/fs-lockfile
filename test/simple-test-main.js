const { read, write } = require('../main.js')

const fp = './test.txt'

write(fp, 'bbbb').then(data => {
    console.log('data:', data)
}).catch(err => {
    console.log('err:', err)
})
