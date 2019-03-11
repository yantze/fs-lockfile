const lockMap = new Map()
const waitCallbackQueue = []


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
            waitCallbackQueue: []
        }
        lockMap.set(fp, lockMeta)
    }

    if (lockMeta.writeInstance) {
        await lockMeta.writeInstance.obtain()
    } else {
        ++lockMeta.readCount
    }

    return lockMeta
}

async function obtainWriteLock(fp) {
    let lockMeta = lockMap.get(fp)
    if (!lockMeta) {
        lockMeta = {
            filePath: fp,
            readCount: 0,
            waitCallbackQueue: [],
            writeInstance: null
        }
        lockMap.set(fp, lockMeta)
        return lockMap
    }

    if (lockMeta.writeInstance) {
        await lockMeta.writeInstance.obtain()
    }

    lockMeta.writeInstance = genDict()

    return lockMeta
}

async function releaseReadLock(lockMeta) {
    if (lockMeta.writeInstance) {
        throw new Error('Had write lock.')
    }

    --lockMeta.readCount
}

async function releaseWriteLock(lockMeta) {
    if (lockMeta.writeInstance) {
        lockMeta.writeInstance.resolve()
    } else {
        throw new Error('No write lock.')
    }

    lockMap.delete(lockMeta.filePath)
}

function read(filePath) {
    console.log('filePath:', filePath)
}


let writeLockMeta = null
async function main() {
    const fp = 'argument'
    writeLockMeta = await obtainWriteLock(fp)
    console.log('writeLockMeta:', writeLockMeta)
}

async function second() {
    const fp = 'argument'
    const readLockMeta = await obtainReadLock(fp)
    console.log('readLockMeta', readLockMeta)
}

async function third() {
    await releaseWriteLock(writeLockMeta)
    console.log('release write lock')
}

// main()
// second()
// third()


