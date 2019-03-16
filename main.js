const lockMap = new Map()


function getLock() {
    const lock = {
        _promise: null,
        resolve: null,
        obtain: null,
    }
    lock._promise = new Promise(resolve => lock.resolve = resolve)
    lock.obtain = () => lock._promise
    return lock
}

async function obtainReadLock(fp) {
    let lockMeta = lockMap.get(fp)
    if (!lockMeta) {
        lockMeta = {
            filePath: fp,
            readCount: 0,
            writeInstance: [],
            readLock: null,
        }
        lockMap.set(fp, lockMeta)
    }

    const lockNum = lockMeta.writeInstance.length
    if (lockNum > 1) {
        // 每次都等待最后一个写锁
        await lockMeta.writeInstance[lockNum-2].obtain()
    }

    if (!lockMeta.readLock) {
        lockMeta.readLock = getLock()
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
            writeInstance: [],
            readLock: null,
        }
        lockMap.set(fp, lockMeta)
    }

    // 先放进队列中，让其它请求都能获取这个队列
    lockMeta.writeInstance.push(getLock())

    // 检查当前是否有读锁
    if (lockMeta.readLock) {
        console.log('---- had read lock')
        await lockMeta.readLock.obtain()
    }

    const lockNum = lockMeta.writeInstance.length
    if (lockNum > 1) {
        // 每次都等待最后一个写锁
        await lockMeta.writeInstance[lockNum-2].obtain()
    }

    return lockMeta
}

async function releaseReadLock(lockMeta) {
    // if (lockMeta.writeInstance.length) {
    //     throw new Error('Had write lock.')
    // }
    if (lockMeta.readLock) {
        --lockMeta.readCount
    } else {
        throw new Error('No read lock found')
    }

    if (lockMeta.readCount === 0) {
        lockMeta.readLock.resolve()
        lockMeta.readLock = null
    }
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

// main()
//
// setTimeout(() => {
//     second()
//     second()
//     second()
//     second()
// }, 100)
//
// setTimeout(() => {
//     fouth()
//     fouth()
//     fouth()
//     fouth()
// }, 1100)
//
// setTimeout(() => {
//     third()
// }, 1000)


// const write = await obtainWriteLock(fp)
// second()
// second()
// second()
// releaseWriteLock(write)

async function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

async function write(fp, timeout = 0) {
    console.log('request write lock meta')
    writeLockMeta = await obtainWriteLock(fp)
    console.log('got write lock meta')

    await sleep(timeout)
    console.log('request release write lock')
    await releaseWriteLock(writeLockMeta)
    console.log('release write lock')
}

async function read(fp, timeout = 0) {
    console.log('request readLockMeta')
    readLockMeta = await obtainReadLock(fp)
    console.log('got read lock meta', readLockMeta)

    await sleep(timeout)
    console.log('request release read lock')
    await releaseReadLock(readLockMeta)
    console.log('release read lock', readLockMeta)
}


const fp = 'argument'
read(fp, 1000)
read(fp, 2000)
read(fp, 3000)
read(fp, 4000)
read(fp, 4000) // +4s
// console.log('开始。。。。')
write(fp, 4000) // +4s
// console.log('第一个写锁。。。。')
read(fp, 1000)
read(fp, 2000)
read(fp, 3000)
read(fp, 4000)
read(fp, 4000) // +4s
write(fp, 4000) // +4s
write(fp, 4000) // +4s
write(fp, 4000) // +4s
// read(fp, 3000)
// read(fp, 4000)
// read(fp, 4000) // +4s
// wait 4*7 = 28s

// 可以这样设计测试
// 写锁是独占的，所以有多少个写锁，应该就至少要有这么长的时间
