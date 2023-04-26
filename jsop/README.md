# jp - A command line JSON processor using a native JavaScript lambda

## Usage

Use this small utitlity to process your JSON data from the standard input with a JavaScript lambda.

```
$ curl -s http://some.api.site/api/v1/data | jp 'o => o.filter(e => e.size < 10).map(e => ({ object: e, processed: true }))'
```

The output is pretty-printed to the standard out. If you prefer raw JSON output, provide `--format-indentation=0`.

Try the `--help` options to see the complete list of options you may want to use.

```
$ jp --help
```

