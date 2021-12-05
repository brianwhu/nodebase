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
    _: {
        messages: {
            invalid: "Invalid ${opt}: ${val}",
            unknown: "Unknown option: ${arg}",
            toomany: "Extra arguments not recognized",
            missing: "Missing required arguments"
        },
        contents: {
            prologue: null,
            epilogue: null
        }
    },

    on: (start) => {
        return {
            _: {
                messages: Object.assign({}, climate._.messages),
                contents: Object.assign({}, climate._.contents),
                version: start.constructor === String ? start : undefined,
                offset: start.constructor === String ? 2 : start._index + 1
            },

            configure: function (spec) {
                Object.assign(this._.messages, spec.messages);
                Object.assign(this._.contents, spec.contents);
                return this;
            },

            /**
             * returns {
             *  opts: { ... },
             *  args: [ ... ]
             * } -- if successful
             * or
             * null -- otherwise
             */
            parse: function (desc, opts, ...args) {
                // validate and prepare positional argument specification
                const compile = (args => {
                    args.variant = -1;
                    for (var i = 0; i < args.length; ++i) {
                        if (args[i].constructor === Array) {
                            if (args.variant < 0) {
                                if (compile(args[i])) {
                                    args.variant = i;
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        }
                    }
                    return true;
                }).bind(this);

                const scan = ((tokens, args, begin, end, results) => {
                    var positional = [];
                    if (args.variant < 0) {
                        if (args.length === 0) {
                            for (var i = begin; i < end; ++i) {
                                positional[i - begin] = tokens[i];
                            }
                        } else if (end - begin === args.length) {
                            // perfect match
                            for (var i = 0; i < args.length; ++i) {
                                positional[i] = tokens[begin + i];
                            }
                        } else if (end - begin < args.length) {
                            // missing arguments
                            results._error = eval("`" + this._.messages.missing + "`");
                        } else {
                            // too many arguments
                            results._error = eval("`" + this._.messages.toomany + "`");
                        }
                    } else if (end - begin < args.length - 1) {
                        results._error = eval("`" + this._.messages.missing + "`");
                    } else {
                        // before the variant
                        for (var i = 0; i < args.variant; ++i) {
                            positional[i] = tokens[begin + i];
                        }
                        // the variant
                        if (end - begin > args.length - 1) {
                            positional[args.variant] = scan(tokens, args[args.variant], begin + args.variant, end - args.length + args.variant + 1, results);
                        } else {
                            positional[args.variant] = [];
                        }
                        // after the variant
                        for (var i = args.variant + 1; i < args.length; ++i) {
                            positional[i] = tokens[end - args.length + i];
                        }
                    }
                    return positional;
                }).bind(this);

                function format(args) {
                    return args.map(e => e.constructor === Array ? (e.length === 0 ? "..." : "[ " + format(e) + " ]") : e).join(" ");
                }

                /*
                 * ENTRY POINT
                 */

                // Positional arguments specification check
                if (!compile(args)) {
                    console.error("*** Invalid positional argument specification");
                    return null;
                }

                // Boolean options take short forms
                var flags = {};
                Object.keys(opts).filter(k => opts[k].value != null && opts[k].value.constructor === Boolean).forEach(k => {
                    var brief = k.charAt(0);
                    if (!flags[brief]) {
                        opts[k].brief = brief;
                        flags[brief] = opts[k];
                    } else {
                        opts[k]._no_val = true;
                    }
                });

                var results = { opts: opts };

                // Options, with standard behavior baked in
                opts.help = { value: false, _no_val: true, doc: "Show this help information" };
                if (this._.version) opts.version = { value: false, _no_val: true, doc: "Show version" };
                for (results._index = this._.offset; results._index < process.argv.length && process.argv[results._index].charAt(0) === '-'; ++results._index) {
                    var arg = process.argv[results._index];
                    if (arg.charAt(1) === '-') {
                        if (arg.length === 2) {
                            ++results._index;
                            break; // stop at --
                        }

                        // long option
                        var equal = arg.indexOf('=');
                        var opt = equal > 0 ? arg.substring(2, equal) : arg.substring(2);
                        var key = opt.replace(/-./, s => s.charAt(1).toUpperCase());
                        var val = equal > 0 ? arg.substring(equal + 1) : null;
                        if (opts[key] === null) {
                            results._error = eval("`" + this._.messages.unknown + "`");
                            break;
                        } else {
                            if (val != null && opts[key].regex && !val.match(opts[key].regex)) {
                                results._error = eval("`" + this._.messages.invalid + "`");
                                break;
                            }
                            if (opts[key].value != null) {
                                if (opts[key].value.constructor === Boolean) {
                                    if (val === null) {
                                        opts[key].value = true;
                                    } else {
                                        opts[key].value = val.match(/(true|t|yes|y|on)/i);
                                    }
                                } else if (opts[key].value.constructor === Date) {
                                    if (val === null || Number.isNaN((opts[key].value = new Date(val)).getTime())) {
                                        results._error = eval("`" + this._.messages.invalid + "`");
                                        break;
                                    }
                                } else if (opts[key].value.constructor === Number) {
                                    if (val === null || Number.isNaN((opts[key].value = Number(val)))) {
                                        results._error = eval("`" + this._.messages.invalid + "`");
                                        break;
                                    }
                                } else {
                                    opts[key].value = val;
                                }
                            } else {
                                opts[key].value = val;
                            }
                            if (opts[key].check && !opts[key].check(opts[key].value)) {
                                results._error = eval("`" + this._.messages.invalid + "`");
                                break;
                            }
                        }
                    } else {
                        // short option(s)
                        for (var i = 1; i < arg.length; ++i) {
                            if (flags[arg.charAt(i)]) {
                                flags[arg.charAt(i)].value = true;
                            } else {
                                arg = arg.charAt(i);
                                results._error = eval("`" + this._.messages.unknown + "`");
                                break;
                            }
                        }
                    }
                }

                if (opts.version && opts.version.value) {
                    console.log(this._.version);
                    return null;
                }

                // Positional arguments
                if (!results._error && /*!opts.version.value &&*/ !opts.help.value && args.length > 0) {
                    results.args = scan(process.argv, args, results._index, process.argv.length, results);
                }

                if (results._error || opts.help.value) {
                    var program = process.argv[1].replace(/^.*[/\\]/, '');
                    if (results._error) {
                        console.error(`${program}: ${results._error}`);
                    } else {
                        console.log(`Usage:\t${program} [ options ] ${format(args)}`);

                        console.log(`\t${desc}`);
                        if (this._.contents.prologue) {
                            console.log(this._.contents.prologue);
                        }
                        console.log(`Available options:`);
                        Object.keys(opts)
                          .sort()
                          .filter(k => k.charAt(0) != '_')
                          .map(k => ({ k: k, t: k.replace(/[A-Z]/, s => '-' + s.toLowerCase()) }))
                          .forEach(e => {
                            var option = opts[e.k];
                            var placeholder = "<value>";
                            var usage = option.doc ? option.doc.replace(/<[^<>]+>/, s => { placeholder = s; return s.substring(1, s.length - 1); }) : "";
                            var label = option.brief != null ? `-${option.brief}, --${e.t}`: option._no_val ? `--${e.t}` : `--${e.t}=${placeholder}`;
                            if (label.length > 7) {
                                console.log(`\t${label}`);
                                console.log(`\t\t${usage}`);
                            } else {
                                console.log(`\t${label}\t${usage}`);
                            }
                          }
                        );
                        if (this._.contents.epilogue) {
                            console.log(this._.contents.epilogue);
                        }
                    }
                    return null;
                } else {
                    return results;
                }
            }
        }
    }
}

export default climate;
