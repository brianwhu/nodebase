# Introduction

This is a small module to provide some basic terminal related operations to help build better CLI tools.

# Functions

## Text Layout to Fit the Width of the Terminal

Basic usage:

```
import terminal from "@streamyflow/terminal"

const paragraph = `As an asynchronous event-driven JavaScript runtime,
    Node.js is designed to build scalable network applications.
    In the following "hello world" example, many connections can be handled concurrently.
    Upon each connection, the callback is fired, but if there is no work to be done,
    Node.js will sleep.`

const formatted = terminal.layout(paragraph, '\n', 60)
console.log('-'.repeat(60))
console.log(formatted)
console.log('-'.repeat(60))
```

This produces

```
------------------------------------------------------------
As an asynchronous event-driven JavaScript runtime, Node.js
is designed to build scalable network applications. In the
following "hello world" example, many connections can be
handled concurrently. Upon each connection, the callback is
fired, but if there is no work to be done, Node.js will
sleep.
------------------------------------------------------------
```

## Prompt for a Password

Basic usage:

```
import terminal from "@streamyflow/terminal"

const password = await terminal.prompt("Password: ")
console.log(password)

// alternatively
terminal.prompt("Secret: ").then(secret => console.log(secret))
```

This function properly handles CR, LF, Ctrl-D as input terminators, and propagates Ctrl-C as a SIGINT to the
process itself.
