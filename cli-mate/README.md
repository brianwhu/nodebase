# cli-mate - A compact command options and argument parser

## Usage

A small but complete example is shown below.

```
import cli from "cli-mate";

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
            doc: `Do not prompt for confirmation before overwriting the destination path.`,
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
```

Now excute the following

```
$ lab/mv-cli.mjs --help
```
Output

```
Usage:	mv-cli.mjs [ options ] source ... destination
	mv-cli file moving utility
Description:
        The mv-cli utility renames the file named by the source operand to the destination path named by the target operand.
        If the target operand names an existing directory, mv-cli moves each file named by a source operand to a destination file in the named
        destination directory.
Available options:
	-f, --force
		Do not prompt for confirmation before overwriting the destination path.  (The -f option overrides any previous -i or -n options.)
	--help	Show this help information
	-v, --verbose
		Cause mv-cli to be verbose, showing files after they are moved.
	--version
		Show version
The mv-cli utility is expected to be IEEE Std 1003.2 (''POSIX.2'') compatible.
```

## Reference

### Basic Usage

### Settings

 Parameter | Defintion | Value
--|--|--
`program`|The name of the program|Default to the name of the script
`newline`|The marker that represents a newline in documentations|`<#>`
`eager`|By default, if the command line fails to parse, only an error message is issued to the user. With `eager` set to true, `cli-mate` will also print the full usage.|`false*`<br>`true`
`placeholder`|Placeholder (e.g. `<params>`) decoration|`undefined*`<br>`underline`<br>`bold`<br>`invert`
`keyword`|Keyword (e.g. `[null]`) decoration|`undefined`<br>`underline`<br> `bold*`<br>`invert`

### Paragraph Formatting

All embedded whitespace sequences are each replaced with a single space. To introduce line breaks, use special sequence `<#>`, which can be overridden
if needed.

### Defining Optional Arguments

### Defining an Umbrella CLI
