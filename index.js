const fs = require('fs')
const path = require('path')

const { promisify } = require('util')

const fsp = {
    readFile : promisify(fs.readFile),
    writeFile : promisify(fs.writeFile),
}

const lockMap = new Map()

function generateLock() {
    const lock = {
        resolve: null,
        obtain: null,
    }
    const promise = new Promise(resolve => lock.resolve = resolve)
    lock.obtain = () => promise
    return lock
}

async function obtainReadLock(fp) {
    let lockMeta = lockMap.get(fp)
    if (!lockMeta) {
        lockMeta = {
            filePath: fp,
            readCount: 0,
            writeQueue: [],
            readLock: null,
        }
        lockMap.set(fp, lockMeta)
    }

    // 循环等待最后一个写锁
    while(lockMeta.writeQueue.length) {
        await lockMeta.writeQueue[lockMeta.writeQueue.length - 1].obtain()
    }

    if (!lockMeta.readLock) {
        lockMeta.readLock = generateLock()
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
            writeQueue: [],
            readLock: null,
        }
        lockMap.set(fp, lockMeta)
    }

    let prevLock = null
    const lockNum = lockMeta.writeQueue.length
    if (lockNum >= 1) {
        prevLock = lockMeta.writeQueue[lockNum-1]
    }

    // 先放进队列中，让其它请求都能获取这个队列
    lockMeta.writeQueue.push(generateLock())

    // 检查当前是否有读锁
    if (lockMeta.readLock) {
        await lockMeta.readLock.obtain()
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

    if (lockMeta.readCount === 0 && lockMeta.writeQueue.length === 0) {
        lockMap.delete(lockMeta.filePath)
    }
}

async function releaseWriteLock(lockMeta) {
    if (lockMeta.writeQueue.length) {
        lockMeta.writeQueue[0].resolve()
    } else {
        throw new Error('No write lock.')
    }

    lockMeta.writeQueue.shift()
    if (lockMeta.readCount === 0 && lockMeta.writeQueue.length === 0) {
        lockMap.delete(lockMeta.filePath)
    }
}

async function read(fp) {
    if (!path.isAbsolute(fp)) throw new Error('Must be an absolute path.')

    const lockMeta = await obtainReadLock(fp)

    try {
        return await fsp.readFile(fp)
    } finally {
        await releaseReadLock(lockMeta)
    }
}

async function write(fp, content) {
    if (!path.isAbsolute(fp)) throw new Error('Must be an absolute path.')

    if (content === undefined || content === null) throw new Error('Content can not be undefined or null.')

    const lockMeta = await obtainWriteLock(fp)

    try {
        return await fsp.writeFile(fp, content)
    } finally {
        await releaseWriteLock(lockMeta)
    }
}

module.exports = {
    read,
    write,
    obtainReadLock,
    obtainWriteLock,
    releaseReadLock,
    releaseWriteLock,
}
