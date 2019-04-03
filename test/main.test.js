const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const expect = require('chai').expect

const { dump } = require('dumper.js')

const { read, write, obtainReadLock, obtainWriteLock, releaseReadLock, releaseWriteLock } = require('../main.js')

const filePath = path.join(__dirname, './test.txt')
const content = 'content test'




describe('Simple write & read test', () => {

    // 这个方法如何重用
    it('should write without error', async () => {
        await write(filePath, content)
    })


    it('should return file content', async () => {
        const readCotnent = await read(filePath)
        expect(content).to.equal(content.toString())
    })

    it('should throw out an error when read file not found', () => {
        read(filePath+'1').catch(e => {
            expect(e).to.be.an('error')
        })
    })

    it('should throw out an error when write file fail', done => {
        // no privilege access file
        write(filePath+'2', content).catch(e => {
            expect(e).to.be.an('error')
            done()
        })
    })

    it('should throw out an error when content is undefined', () => {
        write(filePath, undefined).catch(e => {
            expect(e).to.be.an('error')
        })
    })

    it('should throw out an error when content is null', () => {
        write(filePath, null).catch(e => {
            expect(e).to.be.an('error')
        })
    })

})

describe('Simple continue write lock', () => {

    it('should write & write without error', async function () {
        await write(filePath, content)
        await write(filePath, content)
    })
})

describe('Simple continue read lock', () => {

    it('should read & read & read without error', async function () {
        await read(filePath)
        await read(filePath)
        await read(filePath)
    })
})

describe('Read & Write by turns', () => {
    it('should read & write, result to origin content', done => {
        read(filePath).then((data) => {
            expect(data.toString()).to.equal(content)
            done()
        })
        write(filePath, content+'1')
    })

    it('should write & read & write, result to final write content', function (done) {
        write(filePath, content)
        read(filePath).then((data) => {
            expect(data.toString()).to.equal(content + '2')
            done()
        })
        write(filePath, content+'1')
        write(filePath, content+'2')
    })
})

describe('Time spent of Read & Write', function () {
    const fsp = {
        readFile : promisify(fs.readFile),
        writeFile : promisify(fs.writeFile),
    }

    const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))

    async function mock_read(fp, delay) {
        if (!path.isAbsolute(fp)) throw new Error('Must be an absolute path.')

        const lockMeta = await obtainReadLock(fp)

        try {
            return await fsp.readFile(fp)
        } catch (readError) {
            throw readError
        } finally {
            await sleep(delay)
            await releaseReadLock(lockMeta)
        }
    }

    async function mock_write(fp, content, delay) {
        if (!path.isAbsolute(fp)) throw new Error('Must be an absolute path.')

        const lockMeta = await obtainWriteLock(fp)

        try {
            return await fsp.writeFile(fp, content)
        } catch (writeError) {
            throw writeError
        } finally {
            await sleep(delay)
            await releaseWriteLock(lockMeta)
        }
    }

    it('should cost 1 second: 3 read 500ms & write 500ms', async function () {
        const timestamp = Date.now()
        mock_read(filePath, 500)
        mock_read(filePath, 500)
        mock_read(filePath, 500)
        await mock_write(filePath, content, 500)

        const cost = Date.now() - timestamp
        expect(cost > 1000 && cost < 1100).to.be.true
    })

    it('should cost 1.5 second: write 500ms & read 500ms & write 500ms', function (done) {
        const timestamp = Date.now()
        mock_write(filePath, content, 500)
        mock_read(filePath, 500).then(() => {
            const cost = Date.now() - timestamp
            expect(cost > 1500 && cost < 1600).to.be.true
            done()
        })
        mock_write(filePath, content, 500)
    })
})

