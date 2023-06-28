/*
    Reserved options:
        --help
        --version
    These options don't take short forms.

    Process:
        * regex
        * parse || type-based conversion
        * check
*/
const climate = {
    // -----------------------
    // configurable parameters
    // -----------------------
    _: {
        messages: {
            option: {
                invalid: (name, value) => `Invalid ${name}: ${value}`,
                unknown: name => `Unknown option: ${name}`,
            },
            argument: {
                toomany: () => "Extra arguments not recognized",
                missing: () => "Missing required arguments"
            },
            command: {
                missing: () => "Missing command",
                unknown: command => `Unknown command: ${command}`,
            }
        },
        contents: {
            prologue: null,
            epilogue: null
        },
        settings: {
            program: process.argv[1].replace(/^.*[/\\]/, ''),
            newline: /\s*<#>\s*/
        }
    },

    /**
     * Instantiates a parser, which is to be configured and then invoked later.
     * @param start - this is either the version of a simple/toplevel program, or a parent parser in the case of a sub-command
     */
    on: (start) => {
        return {
            _: {
                messages: {
                    option: Object.assign({}, climate._.messages.option),
                    argument: Object.assign({}, climate._.messages.argument),
                    command: Object.assign({}, climate._.messages.command),
                },
                contents: Object.assign({}, climate._.contents),
                settings: Object.assign({}, climate._.settings),
                version: start.constructor === String ? start : undefined,
                upper: start.constructor === String ? null : start
            },

            /**
             * Configures the parser with the spec object.
             * 
             * @param {*} spec 
             * @returns this parser
             */
            configure: function (spec) {
                if (spec.messages) {
                    Object.assign(this._.messages.option, spec.messages.option)
                    Object.assign(this._.messages.argument, spec.messages.argument)
                    Object.assign(this._.messages.command, spec.messages.command)
                }
                Object.assign(this._.contents, spec.contents)
                Object.assign(this._.settings, spec.settings)
                return this
            },

            /**
             * Defines the command line syntax, describing
             * <ol>
             * <li>A description of the program or command</li>
             * <li>Options</li>
             * <li>Positional arguments</li>
             * </ol>
             * @param {String} desc - a long description of this prgram or command
             * @param {Object} opts 
             * @param  {...any} args - a list of strings depicting the positional arguments, or a single object describing sub-commands
             * @returns this parser object
             */
            define: function (desc, opts, ...args) {
                // validate and prepare positional argument specification
                const compile = args => {
                    args.variant = -1
                    for (let i = 0; i < args.length; ++i) {
                        if (args[i].constructor === Array) {
                            if (args.variant < 0) {
                                if (compile(args[i])) {
                                    args.variant = i
                                } else {
                                    return false
                                }
                            } else {
                                return false
                            }
                        }
                    }
                    return true
                }

                // Positional arguments specification check
                if (args.length === 1 && args[0].constructor === Object) {
                    this.subs = args[0]
                } else if (compile(args)) {
                    this.args = args
                } else {
                    throw "*** Invalid positional argument specification"
                }

                this.desc = desc
                this.opts = opts
                this.flags = {}
                // Boolean options take short forms
                Object.keys(opts).filter(k => opts[k].value != null && opts[k].value.constructor === Boolean).forEach(k => {
                    let brief = k.charAt(0)
                    if (!this.flags[brief]) {
                        opts[k].brief = brief
                        this.flags[brief] = opts[k]
                    } else {
                        opts[k]._no_val = true
                    }
                })

                return this
            },

            /**
             * returns
             * {
             *  opts: { ... },
             *  args: [ ... ]
             * } -- if simple & successful
             * or
             * {
             *  opts: { ... },
             *  next: {
             *   command: '...',
             *   action: ...()
             *  }
             * } -- if umbrella & successful
             * or
             * null -- otherwise
             */
            parse: function () {
                const scan = ((tokens, args, begin, end, results) => {
                    let positional = []
                    if (args.variant < 0) {
                        if (args.length === 0) {
                            for (let i = begin; i < end; ++i) {
                                positional[i - begin] = tokens[i]
                            }
                        } else if (end - begin === args.length) {
                            // perfect match
                            for (let i = 0; i < args.length; ++i) {
                                positional[i] = tokens[begin + i]
                            }
                        } else if (end - begin < args.length) {
                            // missing arguments
                            results._error = this._.messages.argument.missing()
                        } else {
                            // too many arguments
                            results._error = this._.messages.argument.toomany()
                        }
                    } else if (end - begin < args.length - 1) {
                        results._error = this._.messages.argument.missing()
                    } else {
                        // before the variant
                        for (let i = 0; i < args.variant; ++i) {
                            positional[i] = tokens[begin + i]
                        }
                        // the variant
                        if (end - begin > args.length - 1) {
                            positional[args.variant] = scan(tokens, args[args.variant], begin + args.variant, end - args.length + args.variant + 1, results)
                        } else {
                            positional[args.variant] = []
                        }
                        // after the variant
                        for (let i = args.variant + 1; i < args.length; ++i) {
                            positional[i] = tokens[end - args.length + i]
                        }
                    }
                    return positional
                }).bind(this)

                const formatPositional = array => {
                    if (array) {
                        return array.map(e => e.constructor === Array ? (e.length === 0 ? "..." : `[ ${formatPositional(e)} ]`) : `<${e}>`).join(" ")
                    } else {
                        return "<command>"
                    }
                }

                const formatLabeledText = (label, text) => {
                    if (label.length > 7) {
                        console.error(`\t${label}`)
                        console.error(`\t\t${fitTextToTerminal(text, '\n\t\t', process.stdout.columns - 16)}`)
                    } else {
                        console.error(`\t${label}\t${fitTextToTerminal(text, '\n\t\t', process.stdout.columns - 16)}`)
                    }
                }

                const formatParagraphs = (text, tabs) => text.split(this._.settings.newline).map(
                    p => '\t'.repeat(tabs) + fitTextToTerminal(p, `\n${'\t'.repeat(tabs)}`, process.stdout.columns - 8*tabs)
                ).join('\n')

                const fitTextToTerminal = (text, separator, width) => {
                    let offset = -1
                    return text = text.replace(/\s+/g, ' ').replace(/ /g, (m, d, s) => {
                        let next = s.indexOf(' ', d + 1)
                        if (next === -1) next = s.length
                        if (next - offset >= width) {
                            offset = d
                            return separator
                        } else {
                            return m
                        }
                    })
                }

                const programName = this._.upper ? this._.upper.next.command : this._.settings.program

                /*
                 * ENTRY POINT
                 */
                let results = { $c: climate, opts: this.opts }

                // Options, with standard behavior baked in
                this.opts.help = { value: false, _no_val: true, doc: "Show this help information" }
                if (this._.version) this.opts.version = { value: false, _no_val: true, doc: "Show version" }

                results._index = this._.upper ? this._.upper._index + 1 : 2
                for (; results._index < process.argv.length && process.argv[results._index].charAt(0) === '-'; ++results._index) {
                    let arg = process.argv[results._index]
                    if (arg.charAt(1) === '-') {
                        if (arg.length === 2) {
                            ++results._index
                            break // stop at --
                        }

                        // a long option
                        let equal = arg.indexOf('=')
                        let opt = equal > 0 ? arg.substring(2, equal) : arg.substring(2)
                        let key = opt.replace(/-./g, s => s.charAt(1).toUpperCase())
                        let val = equal > 0 ? arg.substring(equal + 1) : null
                        if (!this.opts[key]) {
                            results._error = this._.messages.option.unknown(opt)
                            break
                        } else {
                            if (val != null && this.opts[key].regex && !val.match(this.opts[key].regex)) {
                                results._error = this._.messages.option.invalid(opt, val)
                                break
                            }
                            if (this.opts[key].parse != null) {
                                this.opts[key].value = this.opts[key].parse(val)
                            } else if (this.opts[key].value != null) {
                                if (this.opts[key].value.constructor === Boolean) {
                                    if (val === null) {
                                        this.opts[key].value = true
                                    } else {
                                        this.opts[key].value = val.match(/(true|t|yes|y|on)/i)
                                    }
                                } else if (this.opts[key].value.constructor === Date) {
                                    if (val === null || Number.isNaN((this.opts[key].value = new Date(val)).getTime())) {
                                        results._error = this._.messages.option.invalid(opt, val)
                                        break
                                    }
                                } else if (this.opts[key].value.constructor === Number) {
                                    if (val === null || Number.isNaN((this.opts[key].value = Number(val)))) {
                                        results._error = this._.messages.option.invalid(opt, val)
                                        break
                                    }
                                } else {
                                    this.opts[key].value = val
                                }
                            } else {
                                this.opts[key].value = val
                            }
                            if (this.opts[key].check && !this.opts[key].check(this.opts[key].value)) {
                                results._error = this._.messages.option.invalid(opt, val)
                                break
                            }
                            this.opts[key].provided = true
                        }
                    } else {
                        // short option(s)
                        for (let i = 1; i < arg.length; ++i) {
                            if (this.flags[arg.charAt(i)]) {
                                this.flags[arg.charAt(i)].value = true
                                this.flags[arg.charAt(i)].provided = true
                            } else {
                                results._error = this._.messages.option.unknown(arg.charAt(i))
                                break
                            }
                        }
                    }
                }

                if (this.opts.version && this.opts.version.value) {
                    console.error(this._.version)
                    return null
                }

                // Positional arguments
                if (!results._error && /*!opts.version.value &&*/ !this.opts.help.value) {
                    if (this.subs) {
                        if (results._index < process.argv.length) {
                            const command = process.argv[results._index]
                            let sub = this.subs[command]
                            if (!sub) {
                                results._error = this._.messages.command.unknown(command)
                            } else {
                                results.next = {
                                    command: `${programName} ${command}`,
                                    action: sub.action
                                }
                            }
                        } else {
                            results._error = this._.messages.command.missing()
                        }
                    } else if (this.args.length > 0) {
                        results.args = scan(process.argv, this.args, results._index, process.argv.length, results)
                    }
                }

                if (results._error || this.opts.help.value) {
                    if (results._error) {
                        console.error(`${programName}: ${results._error}`)
                    } else {
                        console.error(`Usage:\t${programName} [ options ] ${formatPositional(this.args)}`)
                        console.error(formatParagraphs(this.desc, 1))
                        if (this._.contents.prologue) {
                            console.error()
                            console.error(formatParagraphs(this._.contents.prologue, 1))
                        }
                        console.error(`\nAvailable options:`)
                        Object.keys(this.opts)
                          .sort()
                          .filter(k => k.charAt(0) != '_')
                          .map(k => ({ k: k, t: k.replace(/[A-Z]/g, s => '-' + s.toLowerCase()) }))
                          .forEach(e => {
                            let option = this.opts[e.k]
                            let placeholder = "<value>"
                            let usage = option.doc ? option.doc.replace(/<[^<>]+>/, s => { placeholder = s; return s.substring(1, s.length - 1) }) : ""
                            let label = option.brief != null ? `-${option.brief}, --${e.t}`: option._no_val ? `    --${e.t}` : `    --${e.t}=${placeholder}`
                            formatLabeledText(label, usage)
                          }
                        )
                        if (this.subs) {
                            console.error(`\nAvailable commands: (See '${programName} <command> --help' for usage information.)`)
                            Object.keys(this.subs).filter(c => !this.subs[c].hidden).forEach(command => formatLabeledText(command, this.subs[command].doc))
                        }
                        if (this._.contents.epilogue) {
                            console.error()
                            console.error(formatParagraphs(this._.contents.epilogue, 1))
                        }
                    }
                    return null
                } else {
                    results.program = programName
                    return results
                }
            }
        }
    }
}

export default climate
