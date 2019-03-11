/*
 * 一个只有 resolve 后，所有的 promise 才能继续进行
 */

// Ver.1
// const dict = {
//     obtain: function() { return this.promise },
//     promise: null,
//     resolve: null,
// }
//
// dict.promise = new Promise(resolve => dict.resolve = resolve)

// Ver.2
function genDict() {
    this.resolve = null
    this.promise = new Promise(resolve => this.resolve = resolve)
    this.obtain = () => this.promise
    return this
}
const dict = genDict()


async function a() {
    try {
        const ret = await dict.obtain()
        console.log('in a', ret)
    } catch(err) {
        console.log('err:', err)
    }
}

async function b() {
    try {
        const ret = await dict.obtain()
        console.log('in b', ret)
    } catch(err) {
        console.log('err:', err)
    }
}

a()
b()
b()
b()
b()
b()
b()
a()
setTimeout(() => {
    dict.resolve('cccc')
}, 913)
