#!/usr/bin/env node --no-extra-info-on-fatal-exception

Error.stackTraceLimit = 0

import climate from '@streamyflow/cli-mate'

let cli = climate.on("1.0.1").configure({
  settings: {
    placeholder: "underline",
  },
  contents: {
    prologue: "\tIf at the end of the process the value is [undefined], nothing is printed."
  }
}).define("Evaluate a JSON input with a JavaScript lambda then pretty-print the result.", {
    verbose: {
      doc: "Display more information about the operations",
      value: false
    },
    nullAsUndefined: {
      doc: "Treat a [null] result as [undefined]",
      value: false
    },
    formatIndentation: {
      doc: "Use this <number> of space characters as indentation, which is passed to JSON.stringify as the 3rd argument",
      value: 2,
      regex: /^[0-9]+$/,
    },
  },
  [ "<lambda>" ]
).parse()

if (cli) {
  const lambda = cli.args[0].length === 0 ? o => o : eval(cli.args[0][0])
  const chunks = []

  process.stdin.on('end', () => {
    let result = lambda(JSON.parse(chunks.join('')))
    if (result === null && cli.opts.nullAsUndefined.value) result = undefined
    if (result !== undefined) console.log(JSON.stringify(result, null, cli.opts.formatIndentation.value))
  })

  process.stdin.on('readable', () => { for (let chunk; null !== (chunk = process.stdin.read()); chunks.push(chunk)); })
}
