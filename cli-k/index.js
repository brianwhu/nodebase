/*
    Reserved options:
        --help
        --version
    These options don't take short forms.
*/
exports.parse = function(version, description, opts, args) {
    var messages = {
        invalid: "Invalid ${opt}: ${val}",
        unknown: "Unknown option: ${arg}"
    }
    function getString(opts, kay, val) {
        if (val == null || opts[key].regex && !val.match(opts[key].regex)) {
            opts._error = eval("`" + messages.invalid + "`");
            return false;
        }
        opts[key].value = val;
        return true;
    }

    // Boolean options take short forms
    var flags = {};
    Object.keys(opts).filter(k => opts[k].value != null && opts[k].value.constructor === Boolean).forEach(function(k) {
        var mnemonic = k.charAt(0);
        if (!flags[mnemonic]) {
            opts[k].mnemo = mnemonic;
            flags[mnemonic] = opts[k];
        } else {
            opts[k].standard = true;
        }
    });

    // Standard behavior
    opts.help = { value: false, standard: true, doc: "Show this help information" };
    opts.version = { value: false, standard: true, doc: "Show version" };

    for (var index = 2; index < process.argv.length; ++index) {
        var arg = process.argv[index];
        if (arg.charAt(0) == '-') {
            if (arg.charAt(1) == '-') {
                var equal = arg.indexOf('=');
                var opt = equal > 0 ? arg.substring(2, equal) : arg.substring(2);
                var key = opt.replace(/-./, s => s.charAt(1).toUpperCase());
                var val = equal > 0 ? arg.substring(equal + 1) : null;
                if (opts[key] == null) {
                    opts._error = eval("`" + messages.unknown + "`");
                    break;
                } else {
                    if (opts[key].value != null) {
                        if (opts[key].value.constructor === Boolean) {
                            if (val === null) {
                                opts[key].value = true;
                            } else {
                                opts[key].value = val.match(/(true|t|yes|y|on)/i);
                            }
                        } else if (opts[key].value.constructor === Date) {
                            if (val == null || Number.isNaN((opts[key].value = new Date(val)).getTime())) {
                                opts._error = eval("`" + messages.invalid + "`");
                                break;
                            }
                        } else if (opts[key].value.constructor === Number) {
                            if (val == null || Number.isNaN((opts[key].value = Number(val)))) {
                                opts._error = eval("`" + messages.invalid + "`");
                                break;
                            }
                        } else {
                            if (!getString(opts, key, val)) {
                                break;
                            }
                        }
                    } else {
                        if (!getString(opts, key, val)) {
                            break;
                        }
                    }
                    if (opts[key].check && !opts[key].check(opts[key].value)) {
                        opts._error = eval("`" + messages.invalid + "`");
                        break;
                    }
                }
            } else {
                for (var i = 1; i < arg.length; ++i) {
                    if (flags[arg.charAt(i)]) {
                        flags[arg.charAt(i)].value = true;
                    }
                }
            }
        } else {
            opts._stoppedAt = index;
            break;
        }
    }

    if (opts.version.value) {
        console.log(version);
    } else if (opts.help.value) {
        console.log(`Usage: ${process.argv[1]} [ options ] ${args.map(a => a.name).join(' ')}`);
        console.log(`\t${description}`);
        console.log(`where options are`);
        Object.keys(opts).sort().filter(k => k.charAt(0) != '_').map(k => ({k: k, t: k.replace(/[A-Z]/, s => '-' + s.toLowerCase())})).forEach(function(e) {
            var option = opts[e.k];
            var placeholder = "<value>";
            var document = option.doc ? option.doc.replace(/<[^<>]+>/, function(s) { placeholder = s; return s.substring(1, s.length-1); }) : "";
            var label = option.mnemo != null ? "-" + option.mnemo + ", --" + e.t : option.standard ? "--" + e.t : "--" + e.t + '=' + placeholder;
            if (label.length > 7) {
                console.log(`\t${label}`);
                console.log(`\t\t${document}`);
            } else {
                console.log(`\t${label}\t${document}`);
            }
        });
    }
//console.log(JSON.stringify(flags));
    return opts;
}
