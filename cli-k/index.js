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
exports._ = {
    messages: {
        invalid: "Invalid ${opt}: ${val}",
        unknown: "Unknown option: ${arg}",
        missing: "Missing required arguments"
    },
    contents: {
        prologue: null,
        epilogue: null
    }
}

exports.configure = function(spec) {
    Object.assign(exports._.messages, spec.messages);
    Object.assign(exports._.contents, spec.contents);
    return exports;
}

exports.parse = function(version, desc, opts, ...args) {
    function compile(args) {
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
    }

    function scan(args, begin, end, results) {
        var positional = [];
        if (args.variant < 0) {
            if (args.length == 0) {
                for (var i = begin; i < end; ++i) {
                    positional[i - begin] = process.argv[i];
                }
            } else if (end - begin == args.length) {
                // perfect
                for (var i = 0; i < args.length; ++i) {
                    positional[i] = process.argv[begin + i];
                }
            } else {
                // missing arguments
                results._error = eval("`" + exports._.messages.missing + "`");
            }
        } else if (end - begin < args.length - 1) {
            results._error = eval("`" + exports._.messages.missing + "`");
        } else {
            // ... [index]      [index+variant-1]         ...              x             [argv.length-1]
            // ... [  0  ]          [variant-1]        [variant]      [variant+1]        [args.length-1]
            for (var i = 0; i < args.variant; ++i) {
                positional[i] = process.argv[begin + i];
            }
            for (var i = args.variant + 1; i < args.length; ++i) {
                positional[i] = process.argv[end - args.length + i];
            }
            positional[args.variant] = scan(args[args.variant], begin + args.variant, end - args.length + args.variant + 1, results);
        }
        return positional;
    }

    function format(args) {
        return args.map(e => e.constructor === Array ? (e.length == 0 ? "..." : "[ " + format(e) + " ]") : e).join(" ");
    }

    // Positional arguments specification check
    if (!compile(args)) {
        console.log("*** Invalid positional argument specification");
        return null;
    }
//console.log("Positional: ", JSON.stringify(args, 2));

    // Boolean options take short forms
    var flags = {};
    Object.keys(opts).filter(k => opts[k].value != null && opts[k].value.constructor === Boolean).forEach(function(k) {
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
    opts.version = { value: false, _no_val: true, doc: "Show version" };
    for (results._index = 2; results._index < process.argv.length && process.argv[results._index].charAt(1) == '-'; ++results._index) {
        var arg = process.argv[results._index];
        if (arg.charAt(1) == '-') {
            if (arg.length == 2) {
                ++results._index;
                break; // stop at --
            }

            // long option
            var equal = arg.indexOf('=');
            var opt = equal > 0 ? arg.substring(2, equal) : arg.substring(2);
            var key = opt.replace(/-./, s => s.charAt(1).toUpperCase());
            var val = equal > 0 ? arg.substring(equal + 1) : null;
            if (opts[key] == null) {
                results._error = eval("`" + exports._.messages.unknown + "`");
                break;
            } else {
                if (val != null && opts[key].regex && !val.match(opts[key].regex)) {
                    results._error = eval("`" + exports._.messages.invalid + "`");
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
                            results._error = eval("`" + exports._.messages.invalid + "`");
                            break;
                        }
                    } else if (opts[key].value.constructor === Number) {
                        if (val === null || Number.isNaN((opts[key].value = Number(val)))) {
                            results._error = eval("`" + exports._.messages.invalid + "`");
                            break;
                        }
                    } else {
                        opts[key].value = val;
                    }
                } else {
                    opts[key].value = val;
                }
                if (opts[key].check && !opts[key].check(opts[key].value)) {
                    results._error = eval("`" + exports._.messages.invalid + "`");
                    break;
                }
            }
        } else {
            // short option(s)
            for (var i = 1; i < arg.length; ++i) {
                if (flags[arg.charAt(i)]) {
                    flags[arg.charAt(i)].value = true;
                }
            }
        }
    }

    // Positional arguments
    if (!results._error && !opts.version.value && !opts.help.value && args.length > 0) {
        results.args = scan(args, results._index, process.argv.length, results);
    }

    if (opts.version.value) {
        console.log(version);
    } else if (results._error || opts.help.value) {
        var program = process.argv[1].replace(/^.*[/\\]/, '');
        if (results._error) {
            console.log(`${program}: ${results._error}`);
        }
        console.log(`Usage: ${program} [ options ] ${format(args)}`);

        console.log(`\t${desc}`);
        if (exports._.contents.prologue) {
            console.log(exports._.contents.prologue);
        }
        console.log(`Valid options are`);
        Object.keys(opts).sort().filter(k => k.charAt(0) != '_').map(k => ({k: k, t: k.replace(/[A-Z]/, s => '-' + s.toLowerCase())})).forEach(function(e) {
            var option = opts[e.k];
            var placeholder = "<value>";
            var document = option.doc ? option.doc.replace(/<[^<>]+>/, function(s) { placeholder = s; return s.substring(1, s.length-1); }) : "";
            var label = option.brief != null ? "-" + option.brief + ", --" + e.t : option._no_val ? "--" + e.t : "--" + e.t + '=' + placeholder;
            if (label.length > 7) {
                console.log(`\t${label}`);
                console.log(`\t\t${document}`);
            } else {
                console.log(`\t${label}\t${document}`);
            }
        });
        if (exports._.contents.epilogue) {
            console.log(exports._.contents.epilogue);
        }
    }
    return results;
}
