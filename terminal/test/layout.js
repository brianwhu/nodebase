import assert from "assert"
import terminal from "../index.js"
import generate from "./generate.js"

const MAX_WORD_LENGTH = 16
const TEXT_WORD_COUNT = 160
const RANDOM_SPACE_BEFORE = 0.3
const RANDOM_SPACE_AFTER = 0.2
const RANDOM_NEWLINE = 0.05

const TERMINAL_WIDTH = 80
const NEWLINE = "\n"
const PREFIX = "####"
const RULER = "-".repeat(TERMINAL_WIDTH)


describe('Terminal', function () {
  describe('#layout()', function () {
    const sample = generate(TEXT_WORD_COUNT, MAX_WORD_LENGTH, RANDOM_SPACE_BEFORE, RANDOM_SPACE_AFTER, RANDOM_NEWLINE)
if (process.env.VERBOSE) {
    console.log("---- SAMPLE ----")
    console.log(sample)
    console.log(RULER)
}
    const formatted = terminal.layout(sample, NEWLINE + PREFIX, TERMINAL_WIDTH - PREFIX.length)
if (process.env.VERBOSE) {
    console.log(formatted)
}

    const lines = formatted.split(NEWLINE)

    it('should have the output content matching the input', function () {
      const originalCompacted = sample.trim().replace(/\s+/g, ' ')
      const formattedRestored = lines.map(l => l.replace(new RegExp('^' + PREFIX), '')).join(' ')
      assert.strictEqual(originalCompacted, formattedRestored, "Formatting loses contents")
    })

    it('should have no double spaces between words', function () {
      assert.equal(formatted.match(/  /), null, "Two or more consecutive spaces found")
    })

    it('should have first line fitted within terminal width minus PREFIX length', function () {
      assert(lines[0].length <= TERMINAL_WIDTH - PREFIX.length)
    })

    it('should have all subsequent lines starting with PREFIX and fitted within terminal width', () => {
      for (let i = 1; i < lines.length; ++i) {
        assert(lines[i].startsWith(PREFIX) && lines[i].length <= TERMINAL_WIDTH, `line ${i}: [${lines[i]}]`)
      }
    })

    it('should have maximized number of words in each line', function () {
      for (let i = 0; i < lines.length - 1; ++i) {
        const nextWord = lines[i+1].split(/\s/)[0].replace(PREFIX, '')
        // NOTE: the first line does not have PREFIX
        assert((i === 0 ? PREFIX.length : 0) + lines[i].length + 1 + nextWord.length > TERMINAL_WIDTH, `line ${i}: [${lines[i]}] + [${nextWord}]`)
      }
    })
  })
})
