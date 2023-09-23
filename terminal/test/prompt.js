import assert from "node:assert"
import terminal from "../index.js"
import generate from "./generate.js"

const get = async (keys, done) => {
    const prompt = terminal.prompt("")
    keys.split('').forEach(key => process.stdin.emit('data', key))
    process.stdin.emit('data', '\n')
    done()
    return await prompt;
}

describe('Terminal', () => {
  describe('#prompt()', () => {

    it('should receive all keyboard input', async done => {
      const keys = generate(1, 16, 0, 0)
      if (process.env.VERBOSE) {
        console.log(`Sending keys '${keys}'`)
      }
      let secret = await get(keys, done)
      assert.strictEqual(secret, keys, `Expecting '${keys}' but got '${secret}'`)
    })

  })
})

