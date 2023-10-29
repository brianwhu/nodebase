#!/usr/bin/env node --no-extra-info-on-fatal-exception

Error.stackTraceLimit = 0

import climate from '@streamyflow/cli-mate'
import readln from 'node:readline'

let cli = climate.on("1.0.0").configure({
  settings: {
    placeholder: "underline",
  },
  contents: {
    prologue: `Each invocation of the line-processing lambda is passed 3 arguments: the text line as a string, the line number as a number, and the
               value returned from the prologue lambda or 'undefined' if no prologue lambda is provided. Returned value from each invocation is printed
               to the stdout immediately unless it is [undefined].<#>
               <#>
               If no line-processing lambda is defined, the input is copied to the output directly.<#>
               <#>
               If provided, the prologue lambda is invoked only once, before any lines are processed. The return value of this invocation is passed
               to the line processing lambda as the third argument, and the epilogue lambda as the only argument.<#>
               <#>
               If provided, the epilogue lambda is invoked only once, after all lines have been processed. It is passed the value returned from the
               prologue lambda. Returned value from this invocation is printed to the stdout unless it is [undefined].`
  }
}).define(`Process a text input line by line with a JavaScript lambda (the line-processing lambda).<#>
           <#>
           Two more optional lambdas can also be provided, which are invoked before and after the process, respectively, to allow context-sensitive
           processing. In this case, specify all 3 lambdas in a JavaScript array: [ <prologue-lambda>, <line-processing-lambda>, <epilogue-lambda> ]`, {
    nullAsUndefined: {
      doc: "Treat a [null] result as [undefined]",
      value: false
    },
  },
  [ "<line-processing-lambda> | '[' <prologue-lambda> ',' <line-processing-lambda> ',' <epilogue-lambda> ']'" ]
).parse()

if (cli) {
  const print = value => {
    if (value === null && cli.opts.nullAsUndefined.value) value = undefined
    if (value !== undefined) console.log(value)
  }

  let prologue, lambda, epilogue;

  lambda = cli.args[0].length === 0 ? o => o : eval(cli.args[0][0])
  if (lambda.constructor === Function) {
    prologue = epilogue = null
  } else if (lambda.constructor === Array) {
    prologue = lambda[0]
    epilogue = lambda[2]
    lambda = lambda[1]
  } else {
    console.error("*** Expecting a lambda or an array")
    process.exit(1)
  }

  const chunks = []
  const reader = readln.createInterface({
    input: process.stdin,
    crlfDelay: Infinity
  })

  let number = 0
  const memory = prologue ? prologue() : undefined
  process.stdin.on('end', () => {
    if (epilogue) print(epilogue(memory))
  })
  reader.on('line', line => {
    print(lambda(line, ++number, memory))
  })
}
