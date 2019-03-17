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

    // 循环等待最后一个写锁
    while(lockMeta.writeInstance.length) {
        await lockMeta.writeInstance[lockMeta.writeInstance.length - 1].obtain()
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

    let prevLock = null
    const lockNum = lockMeta.writeInstance.length
    if (lockNum >= 1) {
        prevLock = lockMeta.writeInstance[lockNum-1]
    }

    // 先放进队列中，让其它请求都能获取这个队列
    lockMeta.writeInstance.push(getLock())

    // 检查当前是否有读锁
    if (lockMeta.readLock) {
        console.log('------ Had read lock')
        await lockMeta.readLock.obtain()
        console.log('====== Release read lock, len:', lockMeta.writeInstance.length)
    }

    if (prevLock) {
        // 等待最后一个锁释放
        await prevLock.obtain()
    }

    return lockMeta
}

async function releaseReadLock(lockMeta) {
    if (lockMeta.readLock) {
        --lockMeta.readCount
    } else {
        throw new Error('No read lock found')
    }

    if (lockMeta.readCount === 0) {
        lockMeta.readLock.resolve()
        lockMeta.readLock = null
    }

    if (lockMeta.readCount === 0 && lockMeta.writeInstance.length === 0) {
        lockMap.delete(lockMeta.filePath)
    }
}

async function releaseWriteLock(lockMeta) {
    if (lockMeta.writeInstance.length) {
        lockMeta.writeInstance[0].resolve()
    } else {
        throw new Error('No write lock.')
    }

    lockMeta.writeInstance.shift()
    if (lockMeta.readCount === 0 && lockMeta.writeInstance.length === 0) {
        lockMap.delete(lockMeta.filePath)
    }
}


async function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}


let writeLockMeta = null
let readLockMeta = null
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
    console.log('got read lock meta', readLockMeta.readCount)

    await sleep(timeout)
    console.log('request release read lock')
    await releaseReadLock(readLockMeta)
    console.log('release read lock', readLockMeta.readCount)
}

async function testRead() {
    console.time('testRead')
    read(fp, 1000)
    read(fp, 2000)
    read(fp, 3000)
    read(fp, 4000)
    await read(fp, 4000) // +4s
    console.timeEnd('testRead')
}

async function testWrite() {
    console.time('testWrite')
    await write(fp, 4000) // +4s
    console.timeEnd('testWrite')
}

async function testReadWrite() {
    // console.time('testReadWrite')
    read(fp, 4000) // +4s
    write(fp, 4000) // +4s
    read(fp, 1000) // +1s
    // console.timeEnd('testReadWrite')
}

async function testWriteRead() {
    write(fp, 4000) // +4s
    read(fp, 1000) // +1s
    write(fp, 4000) // +4s
    read(fp, 4000) // +4s
}

async function testReadWriteComplex() {
    read(fp, 4000) // +4s
    write(fp, 4000) // +4s
    read(fp, 4000) // 因为后面有写锁，所以会被写锁插队
    write(fp, 4000) // +4s
    write(fp, 4000) // +4s
    write(fp, 4000) // +4s
    read(fp, 3000)
    read(fp, 4000)
    read(fp, 4000) // +4s
    // wait 4*6 = 24s
    console.log('==== Request all completed! ====')
}


const fp = 'argument'
// testWrite()
// testRead()
// testReadWrite()
testReadWriteComplex()
// testWriteRead()

// sleep(4500).then(() => {
//     console.log('map:', lockMap)
// })
