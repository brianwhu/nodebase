# Introduction

If you use `sed` and `awk` a lot and dream of writing processing logic in JavaScript, this tool is for you.

Usage is pretty straightforward. Type the following to see the full description.

```
$ each --help
```

Basically you get to define 3 JavaScript lambdas to process a text input line-by-line
1. A prologue lambda (optional)
2. A line-processing lambda (optional)
3. An epilogue lambda (optional)

If you only need the line-processing lambda, provide that as the sole argument to the command.

```
$ cat input.txt | each 't => t.replace(/,/g, ";")'
```

If you need at least 2 of the above, provide an array of 3 lambdas: `[ prelogue, processing, epilogue]`.
Please note that the positions are significant.

```
$ cat input.txt | each '[
    () => ({skipping: true}),

    (t, n, c) => {
        if (t.startsWith("begin")) {
            c.skipping = false
            return undefined
        }
        if (!c.skipping) return t
    },

    /* no need for an epilogue */
]'
```

# Usage

## Prologue Lambda

If provided, the prologue lambda is invoked only once, before any lines are processed. The return value of
this invocation is passed to the line processing lambda as the third argument, and the epilogue lambda as
the only argument.

```
() => ({ anything: "Any Value" })
```

## Line-processing Lambda

Each invocation of the line-processing lambda is passed 3 arguments:
1. the text line as a string
2. the line number as a number
3. the value returned from the prologue lambda or `undefined` if no prologue lambda
is provided.

Returned value from each invocation is printed to the stdout immediately unless it is
`undefined`.

If no line-processing lambda is defined, the input is copied to the output directly.

## Epilogue Lambda

If provided, the epilogue lambda is invoked only once, after all lines have been processed. It is passed
the value returned from the prologue lambda. Returned value from this invocation is printed to the stdout
unless it is `undefined`.

# Example Uses

## Joining lines together

```
$ cat README.md|each '[ () => ({s: ""}), (t,n,m) => (m.s+=t, undefined), m => m.s ]'
```

## Simple templating

Here we use shell environment variables but you can get more creative.
```
$ cat template.txt
Hello ${USER}
Your home is at ${HOME}
```

```
$ cat template.txt|each 't => t.replace(/\${([^{}]{1,})}/, (m,g) => process.env[g])'
Hello steve
Your home is at /Users/steve
```

