import assert from "assert"
import climate from "../index.js"

const CLI_DESIGNATED_NAME = "cli-mate-demo"

const CLI_MAIN_DESCRIPTION = "Main longString"

const CLI_VERSION = "1.0.1"

const CUSTOMIZATION = {
    messages: {
        option: {
            invalid: (opt, val) => `BAD ${opt}: ${val}`,
            unknown: arg => `UNRECOGNIZED: ${arg}`
        }
    },
    contents: {
        prologue: "~prologue~",
        epilogue: "~epilogue~",
    },
    settings: {
        program: CLI_DESIGNATED_NAME,
        //placeholder: 'underline', // placeholder decoration
        //eager: true
    }
}

const OPT_DESCRIPTION = "A long description"

describe('cli-mate', function () {
  let text = ""
  const stderr_write = process.stderr.write
  process.stderr.write = string => text += string

  describe('#define()', function () {
    it('should reject positional specification with more than one variable list', function () {
     assert.throws(() => climate.on(CLI_VERSION).define(CLI_MAIN_DESCRIPTION, {
        },
          "<arg1>", [ "var1", [], [] ], "<arg2>"
        ),
        undefined,
        "*** Invalid positional argument specification"
      )
    })
  })

  describe('#parse-fixed()', function () {
    const argument1 = "arg1"
    const argument2 = "arg2"
    const parser = climate.on(CLI_VERSION).configure(CUSTOMIZATION).define(CLI_MAIN_DESCRIPTION, {
            noValueDefaultType: { value: null, doc: "Provide a String <value>" },
            numberValue: { value: 0, doc: "Use given <ratio>" },
            longString: { value: "", doc: "Provide a long <description>" },
            booleanValue: { value: false, doc: "Use open format" },
            booleanValue2: { value: false, doc: "Use alternative format" },
            dateValue: { value: new Date, doc: "Use given date instead" },
            checkFunction: { value: "", check: text => text && text.startsWith("F:"), doc: "Use a format, which must start with 'F:'" },
            duration: {
                value: undefined,
                regex: /[1-9][0-9]*:[1-9][0-9]*:[1-9][0-9]*/,
                parse: t => t.split(':').reduce((s, e, i) => s += e * Math.pow(10, 2-i), 0),
                doc: "Set the duration of the operation"
            },
        },
        "<arg1>", "<arg2>"
    )

    it('should have the two required arguments recognized', function () {
      process.argv = [ process.argv[0], process.argv[1], argument1, argument2 ]
      const cli = parser.parse()
//console.log(JSON.stringify(cli, undefined, 2))
      assert.strictEqual(cli.opts.help.value, false)
      assert.strictEqual(cli.opts.version.value, false)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should reject too many arguments', function () {
      process.argv = [ process.argv[0], process.argv[1], argument1, argument2, "extra" ]
      text = ""
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(JSON.stringify(cli, undefined, 2))
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${parser._.messages.argument.toomany()}`)
      assert.strictEqual(lines[1], '')
    })

    it('should reject too few arguments', function () {
      process.argv = [ process.argv[0], process.argv[1], argument1 ]
      text = ""
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(JSON.stringify(cli, undefined, 2))
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${parser._.messages.argument.missing()}`)
      assert.strictEqual(lines[1], '')
    })

    it('should have the usage printed upon --help', function () {
      text = ""
      process.argv = [ process.argv[0], process.argv[1], "--help" ]
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(text)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines[0], `Usage:\t${CLI_DESIGNATED_NAME} [ <options> ... ] <${argument1}> <${argument2}>`)
      assert.strictEqual(lines[1], `\t${CLI_MAIN_DESCRIPTION}`)
      assert.strictEqual(lines[2], '')
      assert.strictEqual(lines[3], `\t${CUSTOMIZATION.contents.prologue}`)
      assert.strictEqual(lines[lines.length-2], `\t${CUSTOMIZATION.contents.epilogue}`)

    })

    it('should have the version printed upon --version', function () {
      text = ""
      process.argv = [ process.argv[0], process.argv[1], "--version" ]
      const cli = parser.parse()
      assert.strictEqual(cli, null)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], CLI_VERSION)
      assert.strictEqual(lines[1], '')
    })

    it('should report errors with no args provided', function () {
      text = ""
      process.argv = [ process.argv[0], process.argv[1] ]
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(parser)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${parser._.messages.argument.missing()}`)
      assert.strictEqual(lines[1], '')
    })

    it('should report errors on wrong option names - long form', function () {
      const OPTION_NAME = "note"
      text = ""
      process.argv = [ process.argv[0], process.argv[1], `--${OPTION_NAME}=something`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(text)
//console.log(parser)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${CUSTOMIZATION.messages.option.unknown(OPTION_NAME)}`)
      assert.strictEqual(lines[1], '')
    })

    it('should report errors on wrong option names - short form', function () {
      const OPTION_NAME = "x"
      text = ""
      process.argv = [ process.argv[0], process.argv[1], `-${OPTION_NAME}=something`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(text)
//console.log(parser)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${CUSTOMIZATION.messages.option.unknown(OPTION_NAME)}`)
      assert.strictEqual(lines[1], '')
    })

    it('should handle double-dash', function () {
      process.argv = [ process.argv[0], process.argv[1], "--", "-A", "-B" ]
      const cli = parser.parse()
      assert.strictEqual(cli.args[0], "-A")
      assert.strictEqual(cli.args[1], "-B")
    })

    it('should default no value option to String type', function () {
      const STRING_VALUE = 'A string value'
      process.argv = [ process.argv[0], process.argv[1], `--no-value-default-type=${STRING_VALUE}`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.noValueDefaultType.value.constructor, String)
      assert.strictEqual(cli.opts.noValueDefaultType.value, STRING_VALUE)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept String option value', function () {
      process.argv = [ process.argv[0], process.argv[1], `--long-string=${OPT_DESCRIPTION}`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.longString.value, OPT_DESCRIPTION)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept good Date option value', function () {
      const DATE_STRING = "2020-02-05"
      const EXPECTED = new Date(DATE_STRING)
      process.argv = [ process.argv[0], process.argv[1], `--date-value=${DATE_STRING}`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.dateValue.value.getTime(), EXPECTED.getTime(), `Expecting ${EXPECTED} but have ${cli.opts.dateValue.value}`)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should reject bad Date option value', function () {
      const BAD_DATE = "xyz"
      text = ""
      process.argv = [ process.argv[0], process.argv[1], `--date-value=${BAD_DATE}`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli, null)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${CUSTOMIZATION.messages.option.invalid("date-value", BAD_DATE)}`)
      assert.strictEqual(lines[1], '')
    })

    it('should accept good Number option value', function () {
      const NUMBER_VALUE = "3.14156265"
      const EXPECTED = Number(NUMBER_VALUE)
      process.argv = [ process.argv[0], process.argv[1], `--number-value=${NUMBER_VALUE}`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.numberValue.value, EXPECTED, `Expecting ${EXPECTED} but have ${cli.opts.dateValue.value}`)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should reject bad Number option value', function () {
      const BAD_NUMBER = "xyz"
      text = ""
      process.argv = [ process.argv[0], process.argv[1], `--number-value=${BAD_NUMBER}`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli, null)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${CUSTOMIZATION.messages.option.invalid("number-value", BAD_NUMBER)}`)
      assert.strictEqual(lines[1], '')
    })

    it('should accept Boolen option value - long form, no value', function () {
      process.argv = [ process.argv[0], process.argv[1], `--boolean-value`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue.value, true)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept Boolen option value - long form, "true" value', function () {
      process.argv = [ process.argv[0], process.argv[1], `--boolean-value=true`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue.value, true)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept Boolen option value - long form, "t" value', function () {
      process.argv = [ process.argv[0], process.argv[1], `--boolean-value=t`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue.value, true)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept Boolen option value - long form, "yes" value', function () {
      process.argv = [ process.argv[0], process.argv[1], `--boolean-value=yes`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue.value, true)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept Boolen option value - long form, "y" value', function () {
      process.argv = [ process.argv[0], process.argv[1], `--boolean-value=y`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue.value, true)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept Boolen option value - long form, "on" value', function () {
      process.argv = [ process.argv[0], process.argv[1], `--boolean-value=on`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue.value, true)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept Boolen option value - long form, other (false) value', function () {
      process.argv = [ process.argv[0], process.argv[1], `--boolean-value=okay`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue.value, false)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept Boolen option value - short form', function () {
      process.argv = [ process.argv[0], process.argv[1], `-b`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue.value, true)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should accept Boolen option with same first-letter as one before - long form', function () {
      process.argv = [ process.argv[0], process.argv[1], `--boolean-value2`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.booleanValue2.value, true)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should handle option "check" functions - accepted', function () {
      const FORMAT = "F:format-expression"
      process.argv = [ process.argv[0], process.argv[1], `--check-function=${FORMAT}`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.checkFunction.value, FORMAT)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should handle option "check" functions - rejected', function () {
      const FORMAT = "G:format-expression"
      process.argv = [ process.argv[0], process.argv[1], `--check-function=${FORMAT}`, argument1, argument2 ]
      text = ""
      const cli = parser.parse()
      assert.strictEqual(cli, null)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${CUSTOMIZATION.messages.option.invalid("check-function", `${FORMAT}`)}`)
      assert.strictEqual(lines[1], '')
    })

    it('should handle option pattern "regex" and "parse" functions - accepted', function () {
      const HUNDREDS = 14
      const TENS = 45
      const ONES = 28
      const DURATION = HUNDREDS*100 + TENS*10 + ONES
      process.argv = [ process.argv[0], process.argv[1], `--duration=${HUNDREDS}:${TENS}:${ONES}`, argument1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli.opts.duration.value, DURATION)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1], argument2)
    })

    it('should handle option pattern "regex" and "parse" functions - rejected', function () {
      const HUNDREDS = 'a'
      const TENS = 45
      const ONES = 28
      const DURATION = HUNDREDS*100 + TENS*10 + ONES
      process.argv = [ process.argv[0], process.argv[1], `--duration=${HUNDREDS}:${TENS}:${ONES}`, argument1, argument2 ]
      text = ""
      const cli = parser.parse()
      assert.strictEqual(cli, null)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${CUSTOMIZATION.messages.option.invalid("duration", `${HUNDREDS}:${TENS}:${ONES}`)}`)
      assert.strictEqual(lines[1], '')
    })

    //process.stderr.write = stderr_write
  })

  describe('#parse-variant()', function () {
    const argument1 = "arg1"
    const argument2 = "arg2"
    const variant1 = "var1"
    const variant2 = "var2"
    const parser = climate.on(CLI_VERSION).configure(CUSTOMIZATION).define(CLI_MAIN_DESCRIPTION, {
        },
        "<arg1>", [ "<var1>", "<var2>", [] ], "<arg2>"
    )

    it('should have the two required arguments recognized', function () {
      process.argv = [ process.argv[0], process.argv[1], argument1, argument2 ]
      const cli = parser.parse()
//console.log(JSON.stringify(cli, undefined, 2))
      assert.strictEqual(cli.opts.help.value, false)
      assert.strictEqual(cli.opts.version.value, false)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[2], argument2)
    })

    it('should reject too few arguments', function () {
      process.argv = [ process.argv[0], process.argv[1], argument1 ]
      text = ""
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(JSON.stringify(cli, undefined, 2))
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${parser._.messages.argument.missing()}`)
      assert.strictEqual(lines[1], '')
    })

    it('should have the optional and the required arguments recognized', function () {
      process.argv = [ process.argv[0], process.argv[1], argument1, variant1, variant2, argument2 ]
      const cli = parser.parse()
//console.log(JSON.stringify(cli, undefined, 2))
      assert.strictEqual(cli.opts.help.value, false)
      assert.strictEqual(cli.opts.version.value, false)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1].length, 3)
      assert.strictEqual(cli.args[1][0], variant1)
      assert.strictEqual(cli.args[1][1], variant2)
      assert.strictEqual(cli.args[1][2].length, 0)
      assert.strictEqual(cli.args[2], argument2)
    })

    it('should have wrong number of optional arguments rejected', function () {
      text = ""
      process.argv = [ process.argv[0], process.argv[1], argument1, variant1, argument2 ]
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(text)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${parser._.messages.argument.missing()}`)
      assert.strictEqual(lines[1], '')
    })

    it('should recognized additional optional arguments', function () {
      const extra1 = "extra1"
      const extra2 = "extra2"
      process.argv = [ process.argv[0], process.argv[1], argument1, variant1, variant2, extra1, extra2, argument2 ]
      const cli = parser.parse()
//console.log(JSON.stringify(cli, undefined, 2))
      assert.strictEqual(cli.opts.help.value, false)
      assert.strictEqual(cli.opts.version.value, false)
      assert.strictEqual(cli.args[0], argument1)
      assert.strictEqual(cli.args[1].length, 3)
      assert.strictEqual(cli.args[1][0], variant1)
      assert.strictEqual(cli.args[1][1], variant2)
      assert.strictEqual(cli.args[1][2].length, 2)
      assert.strictEqual(cli.args[1][2][0], extra1)
      assert.strictEqual(cli.args[1][2][1], extra2)
      assert.strictEqual(cli.args[2], argument2)
    })

  })

  describe('#parse-umbrella()', function () {
    const box = () => console.log("box")
    const bag = () => console.log("bag")
    const stash = () => console.log("stash")
    const parser = climate.on(CLI_VERSION).configure(CUSTOMIZATION).define(CLI_MAIN_DESCRIPTION, {
      },
      {
        box: {
            action: box,
            doc: "Box operations"
        },
        bag: {
            action: bag,
            doc: "Bag operations"
        },
        stash: {
            action: stash,
            hidden: true, // not visible in the usage info
            doc: "Stash operations"
        }
      }
    ) 
      
    it('should produce sub-commands in usage', function () {
      process.argv = [ process.argv[0], process.argv[1], "--help" ]
      text = ""
      const cli = parser.parse()
//console.log(JSON.stringify(cli, undefined, 2))
//console.log(text)
      //assert.strictEqual(cli._index, 2)
      //assert.strictEqual(cli.next.action, box)
    })          
                
    it('should require presence of a sub-command', function () {
      process.argv = [ process.argv[0], process.argv[1] ]
      text = ""
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(text)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${parser._.messages.command.missing()}`)
      assert.strictEqual(lines[1], '')
    })

    it('should recognized correct sub-commands', function () {
      process.argv = [ process.argv[0], process.argv[1], "box", "arg1", "arg2" ]
      const cli = parser.parse()
//console.log(JSON.stringify(cli, undefined, 2))
      assert.strictEqual(cli._index, 2)
      assert.strictEqual(cli.next.action, box)
    })

    it('should reject incorrect sub-commands', function () {
      const BAD_COMMAND = "beg"
      process.argv = [ process.argv[0], process.argv[1], BAD_COMMAND, "arg1", "arg2" ]
      text = ""
      const cli = parser.parse()
      assert.strictEqual(cli, null)
//console.log(text)
      const lines = text.split(/[\n\r]/)
      assert.strictEqual(lines.length, 2)
      assert.strictEqual(lines[0], `${CLI_DESIGNATED_NAME}: ${parser._.messages.command.unknown(BAD_COMMAND)}`)
      assert.strictEqual(lines[1], '')
    })

  })

})

