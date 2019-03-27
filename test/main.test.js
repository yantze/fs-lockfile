const expect = require('chai').expect
const assert = require('assert')

const { read, write } = require('../main.js')

const filePath = '/Users/yantze/a.txt'
const content = 'content test'

describe('Simple write & read test', () => {

    // 这个方法如何重用
    it('should write without error', async () => {
        await write(filePath, content)
    })


    it('should return file content', async () => {
        const readCotnent = await read(filePath)
        assert.equal(content, content.toString())
    })

    it('should throw error when read file not found', () => {
        return read(filePath+'1')
    })

    it('should throw error when write file fail', () => {
        return write(filePath+'2', NaN)
    })
})

describe('Simple continue write lock', () => {
    it('should write & write without error', async () => {
        await write(filePath, content)
        await write(filePath, content)
    })
})

describe('Simple continue read lock', () => {
    it('should read & read & read without error', async () => {
        await read(filePath)
        await read(filePath)
        await read(filePath)
    })
})

describe('Read & Write by turns', () => {
    it('should read & write, result to origin content', done => {
        read(filePath).then((data) => {
            assert.equal(data.toString(), content)
            done()
        })
        write(filePath, content+'1')
    })

    it('should write & read & write, result to final write content', done => {
        write(filePath, content)
        read(filePath).then((data) => {
            assert.equal(data.toString(), (content + '2'))
            done()
        })
        write(filePath, content+'1')
        write(filePath, content+'2')
    })
})

describe('Time spent of Read & Write', () => {
    it('should cost 1 second: 3 read 500ms & write 500ms', () => {
    
    })

    it('should cost 1.5 second: write 500ms & read 500ms & write 500ms', () => {
    
    })
})


/**
 * 插入代码测试耗费时长
 * 并发测试的方法
 * 中间件文件写入是否要判断 undefined 或者 null
 * expect 和 assert 区别
 */


/*
async function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}


let writeLockMeta = null
let readLockMeta = null
async function writeCase(fp, timeout = 0) {
    console.log('request write lock meta')
    writeLockMeta = await obtainWriteLock(fp)
    console.log('got write lock meta')

    await sleep(timeout)
    console.log('request release write lock')
    await releaseWriteLock(writeLockMeta)
    console.log('release write lock')
}

async function readCase(fp, timeout = 0) {
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
    readCase(fp, 1000)
    readCase(fp, 2000)
    readCase(fp, 3000)
    readCase(fp, 4000)
    await readCase(fp, 4000) // +4s
    console.timeEnd('testRead')
}

async function testWrite() {
    console.time('testWrite')
    await writeCase(fp, 4000) // +4s
    console.timeEnd('testWrite')
}

async function testReadWrite() {
    // console.time('testReadWrite')
    readCase(fp, 4000) // +4s
    writeCase(fp, 4000) // +4s
    readCase(fp, 1000) // +1s
    // console.timeEnd('testReadWrite')
}

async function testWriteRead() {
    writeCase(fp, 4000) // +4s
    readCase(fp, 1000) // +1s
    writeCase(fp, 4000) // +4s
    readCase(fp, 4000) // +4s
}

async function testReadWriteComplex() {
    readCase(fp, 4000) // +4s
    writeCase(fp, 4000) // +4s
    readCase(fp, 4000) // 因为后面有写锁，所以会被写锁插队
    writeCase(fp, 4000) // +4s
    writeCase(fp, 4000) // +4s
    writeCase(fp, 4000) // +4s
    readCase(fp, 3000)
    readCase(fp, 4000)
    readCase(fp, 4000) // +4s
    // wait 4*6 = 24s
    console.log('==== Request all completed! ====')
}
*/
