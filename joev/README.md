# jsoe - JavaScript Object Evaluator

## Usage

Use this small utitlity to process your JSON data from the standard input with a real JavaScript lambda.

```
$ curl -s https://jsonplaceholder.typicode.com/todos|jsoe 'o => o.filter(i => !i.completed).length'
```

The output is pretty-printed to the standard out. If you prefer raw JSON output, provide `--format-indentation=0`.

Try the `--help` options to see the complete list of options you may want to use.

```
$ jsoe --help
```

