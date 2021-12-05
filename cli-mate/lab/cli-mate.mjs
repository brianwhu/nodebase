#!/usr/bin/env node
/* vim:set filetype=javascript: */

import cli from "../index.js";

var invocation = cli.on("1.0.1").configure({
        messages: {
            invalid: "BAD ${opt}: ${val}",
            unknown: "UNRECOGNIZED: ${arg}"
        },
        contents: {
            prologue: `Examples:
        cli-mate --debug --date-value=2018 --positive=12
        cli-mate --debug --date-value=2018-09-03 --integer-value=-10`,
            epilogue: "See http://www.oracle.com/technetwork/java/javase/documentation/index.html for more details."
        }
    }).parse("cli-mate sample program", {
        binary: { value: false, doc: "Using binary encoding" },
        stringValue: { value: "defaultString", doc: "A <string> value" },
        backwards: { value: false, doc: "Going backwards" },
        identifier: { value: "", doc: "A valid <identifier>", regex: /^[a-zA-Z][a-zA-Z0-9]*$/ },
        integerValue: { value: 0, doc: "An arbitrary <integer> value" },
        force: {
            value: false,
            doc: `If the destination file cannot be opened, remove it and create a new file, without
                prompting for confirmation regardless of its permissions.  (The -f option overrides
                any previous -n option.)`
            },
        forward: { value: false, doc: "Forwarding the results" },
        positive: { value: 1, doc: "A <positive integer> value", regex: /^[0-9]+$/, check: function(v) { return v > 0; } },
        nonNegative: { value: 0, doc: "A <non-negative integer> value", regex: /^[0-9]+$/ },
        dateValue: { value: new Date(""), doc: "The starting <date> of the operation" },
        verbose: { value: false, doc: "Show more information" },
        debug: { value: false, doc: "Print options as JSON" }
    },
    "source", "[[user@]host:]path", [ "partical-count", "partical-id", [] ], "[[user@]host:]path"
);
console.log(`${process.stdout.columns}x${process.stdout.rows}`);
if (invocation && invocation.opts.debug.value) {
    console.log(JSON.stringify(invocation, null, 2));
}
