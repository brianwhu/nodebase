import assert from "node:assert"
import terminal from "../index.js"
import generate from "./generate.js"

const get = async (keys, terminator, done) => {
    const prompt = terminal.prompt("")
    keys.split('').forEach(key => process.stdin.emit('data', key))
    process.stdin.emit('data', terminator)
    done()
    return await prompt;
}

describe('Terminal', () => {
  describe('#prompt()', () => {

    process.stderr.write = string => {}

    it('should receive all keyboard input', async done => {
      const keys = generate(1, 16, 0, 0)
      if (process.env.VERBOSE) {
        console.log(`Sending keys '${keys}'`)
      }
      let secret = await get(keys, '\n', done)
      assert.strictEqual(secret, keys, `Expecting '${keys}' but got '${secret}'`)
      assert.strictEqual(process.stdin.isRaw, false)
    })

    it('should handle explicit ^D and ignore the rest of the input', async done => {
      const keys = generate(1, 16, 0, 0) + '\u0004'
      const extra = generate(1, 16, 0, 0)
      if (process.env.VERBOSE) {
        console.log(`Sending keys '${keys + extra}'`)
      }
      let secret = await get(keys + extra, '\n', done)
      assert.strictEqual(secret, keys, `Expecting ${keys} but got '${secret}'`)
    })

    it('should handle BACKSPACE', async done => {
      const keys = generate(1, 16, 0, 0) + '\u007f'
      if (process.env.VERBOSE) {
        console.log(`Sending keys '${keys}'`)
      }
      let secret = await get(keys, '\n', done)
      assert.strictEqual(secret, keys.substring(1, key.length - 1), `Expecting ${keys.substring(1, key.length - 1)} but got '${secret}'`)
    })

    it('should handle explicit ^C, get interrupted, and receive nothing', async done => {
      const keys = generate(1, 16, 0, 0)
      if (process.env.VERBOSE) {
        console.log(`Sending keys '${keys}' then ^C`)
      }
      let interrupted = false

      process.on('SIGINT', () => interrupted = true)
      let secret = await get(keys, '\u0003', done)
      assert.strictEqual(interrupted, true)
      assert.strictEqual(secret, "", `Expecting <nothing> but got '${secret}'`)
    })

  })
})

