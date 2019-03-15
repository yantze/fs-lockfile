const lockMap = new Map()


function genDict() {
    this.resolve = null
    this.promise = new Promise(resolve => this.resolve = resolve)
    this.obtain = () => this.promise
    return this
}

async function obtainReadLock(fp) {
    let lockMeta = lockMap.get(fp)
    if (!lockMeta) {
        lockMeta = {
            filePath: fp,
            readCount: 0,
            waitCallbackQueue: [],
            writeInstance: [],
        }
        lockMap.set(fp, lockMeta)
    }

    if (lockMeta.writeInstance.length) {
        await lockMeta.writeInstance[0].obtain()
    }
    ++lockMeta.readCount

    return lockMeta
}

async function obtainWriteLock(fp) {
    let lockMeta = lockMap.get(fp)
    if (!lockMeta) {
        lockMeta = {
            filePath: fp,
            readCount: 0,
            waitCallbackQueue: [],
            writeInstance: [],
        }
        lockMap.set(fp, lockMeta)
    }

    // 先放进队列中，让其它请求都能获取这个队列
    lockMeta.writeInstance.push(genDict())

    if (lockMeta.writeInstance.length > 1) {
        await lockMeta.writeInstance[0].obtain()
    }

    return lockMeta
}

async function releaseReadLock(lockMeta) {
    if (lockMeta.writeInstance.length) {
        throw new Error('Had write lock.')
    }

    --lockMeta.readCount
}

async function releaseWriteLock(lockMeta) {
    if (lockMeta.writeInstance.length) {
        lockMeta.writeInstance[0].resolve()
    } else {
        throw new Error('No write lock.')
    }

    lockMeta.writeInstance.shift()
    if (!lockMeta.writeInstance.length) {
        lockMap.delete(lockMeta.filePath)
    }

}

let writeLockMeta = null
let readLockMeta = null
async function main() {
    const fp = 'argument'
    console.log('request write lock meta')
    writeLockMeta = await obtainWriteLock(fp)
    console.log('got write lock meta')
}

async function second() {
    const fp = 'argument'
    console.log('request readLockMeta')
    readLockMeta = await obtainReadLock(fp)
    console.log('got read lock meta', readLockMeta)
}

async function third() {
    console.log('request release write lock')
    await releaseWriteLock(writeLockMeta)
    console.log('release write lock')
}

async function fouth() {
    console.log('request release read lock')
    await releaseReadLock(readLockMeta)
    console.log('release read lock', readLockMeta)
}

main()

setTimeout(() => {
    second()
    second()
    second()
    second()
}, 100)

setTimeout(() => {
    fouth()
    fouth()
    fouth()
    fouth()
}, 1100)

setTimeout(() => {
    third()
}, 1000)



