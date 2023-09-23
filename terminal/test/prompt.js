import assert from "node:assert"
import terminal from "../index.js"
import generate from "./generate.js"

const get = async (keys, done) => {
    const prompt = terminal.prompt("")
    process.stdin.emit('data', keys)
    done()
    return await prompt;
}

describe('Terminal', function () {
  describe('#prompt()', function () {

    it('should receive all keyboard input', async done => {
/*
      const stderr_write = process.stderr._write
      process.stderr.write = function(chunk, encoding, callback) {
        callback();
      }
*/
      const keys = generate(1, 16, 0, 0)
if (process.env.VERBOSE) {
    console.log(`Sending keys '${keys}'`)
}
      let secret = await get(keys, done)
      assert.strictEqual(secret, keys, `Expecting '${keys}' but got '${secret}'`)
      //process.stderr.write = stderr_write
    })

  })
})

