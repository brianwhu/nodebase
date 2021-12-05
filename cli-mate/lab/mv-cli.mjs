#!/usr/bin/env node
/* vim:set filetype=javascript: */

import cli from "../index.js";

var invocation = cli.on("1.0.1").configure({
        contents: {
            prologue: `Description:
        The mv-cli utility renames the file named by the source operand to the destination path named by the target operand.
        If the target operand names an existing directory, mv-cli moves each file named by a source operand to a destination file in the named
        destination directory.`,
            epilogue: "The mv-cli utility is expected to be IEEE Std 1003.2 (''POSIX.2'') compatible."
        }
    }).parse("mv-cli file moving utility", {
        force: {
            value: false,
            doc: `Do not prompt for confirmation before overwriting the destination path.  (The -f option overrides any previous -i or -n options.)`,
        },
        verbose: {
            value: false,
            doc: `Cause mv-cli to be verbose, showing files after they are moved.`
        },
    },
    "source", [], "destination"
);
if (invocation) {
    console.log(`  Force flag: ${invocation.opts.force.value}`);
    console.log(`Verbose flag: ${invocation.opts.verbose.value}`);
    console.log(`   Source(s): ${invocation.args.filter((e, i, a) => i < a.length - 1)}`);
    console.log(` Destination: ${invocation.args[2]}`);
}
