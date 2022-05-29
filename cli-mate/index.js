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
            program: process.argv[1].replace(/^.*[/\\]/, '')
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
                    for (var i = 0; i < args.length; ++i) {
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
                    var brief = k.charAt(0)
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
                    var positional = []
                    if (args.variant < 0) {
                        if (args.length === 0) {
                            for (var i = begin; i < end; ++i) {
                                positional[i - begin] = tokens[i]
                            }
                        } else if (end - begin === args.length) {
                            // perfect match
                            for (var i = 0; i < args.length; ++i) {
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
                        for (var i = 0; i < args.variant; ++i) {
                            positional[i] = tokens[begin + i]
                        }
                        // the variant
                        if (end - begin > args.length - 1) {
                            positional[args.variant] = scan(tokens, args[args.variant], begin + args.variant, end - args.length + args.variant + 1, results)
                        } else {
                            positional[args.variant] = []
                        }
                        // after the variant
                        for (var i = args.variant + 1; i < args.length; ++i) {
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
                        console.error(`\t\t${text}`)
                    } else {
                        console.error(`\t${label}\t${text}`)
                    }
                }

                const programName = this._.upper ? this._.upper.next.command : this._.settings.program

                /*
                 * ENTRY POINT
                 */
                var results = { opts: this.opts }

                // Options, with standard behavior baked in
                this.opts.help = { value: false, _no_val: true, doc: "Show this help information" }
                if (this._.version) this.opts.version = { value: false, _no_val: true, doc: "Show version" }

                results._index = this._.upper ? this._.upper._index + 1 : 2
                for (; results._index < process.argv.length && process.argv[results._index].charAt(0) === '-'; ++results._index) {
                    var arg = process.argv[results._index]
                    if (arg.charAt(1) === '-') {
                        if (arg.length === 2) {
                            ++results._index
                            break // stop at --
                        }

                        // a long option
                        var equal = arg.indexOf('=')
                        var opt = equal > 0 ? arg.substring(2, equal) : arg.substring(2)
                        var key = opt.replace(/-./, s => s.charAt(1).toUpperCase())
                        var val = equal > 0 ? arg.substring(equal + 1) : null
                        if (!this.opts[key]) {
                            results._error = this._.messages.option.unknown(key)
                            break
                        } else {
                            if (val != null && this.opts[key].regex && !val.match(this.opts[key].regex)) {
                                results._error = this._.messages.option.invalid(arg, val)
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
                                        results._error = this._.messages.option.invalid(arg, val)
                                        break
                                    }
                                } else if (this.opts[key].value.constructor === Number) {
                                    if (val === null || Number.isNaN((this.opts[key].value = Number(val)))) {
                                        results._error = this._.messages.option.invalid(arg, val)
                                        break
                                    }
                                } else {
                                    this.opts[key].value = val
                                }
                            } else {
                                this.opts[key].value = val
                            }
                            if (this.opts[key].check && !this.opts[key].check(this.opts[key].value)) {
                                results._error = this._.messages.option.invalid(arg, val)
                                break
                            }
                        }
                    } else {
                        // short option(s)
                        for (var i = 1; i < arg.length; ++i) {
                            if (this.flags[arg.charAt(i)]) {
                                this.flags[arg.charAt(i)].value = true
                            } else {
                                arg = arg.charAt(i)
                                results._error = this._.messages.option.unknown(arg)
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
                            var sub = this.subs[command]
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
                        console.error(`\t${this.desc}`)
                        if (this._.contents.prologue) {
                            console.error(this._.contents.prologue)
                        }
                        console.error(`Available options:`)
                        Object.keys(this.opts)
                          .sort()
                          .filter(k => k.charAt(0) != '_')
                          .map(k => ({ k: k, t: k.replace(/[A-Z]/, s => '-' + s.toLowerCase()) }))
                          .forEach(e => {
                            var option = this.opts[e.k]
                            var placeholder = "<value>"
                            var usage = option.doc ? option.doc.replace(/<[^<>]+>/, s => { placeholder = s; return s.substring(1, s.length - 1) }) : ""
                            var label = option.brief != null ? `-${option.brief}, --${e.t}`: option._no_val ? `--${e.t}` : `--${e.t}=${placeholder}`
                            formatLabeledText(label, usage)
                          }
                        )
                        if (this.subs) {
                            console.error(`Available commands. (See '${programName} <command> --help' for usage information.)`)
                            Object.keys(this.subs).forEach(command => formatLabeledText(command, this.subs[command].doc))
                        }
                        if (this._.contents.epilogue) {
                            console.error(this._.contents.epilogue)
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
