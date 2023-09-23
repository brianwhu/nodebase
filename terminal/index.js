/**
 * Layout text within a given width
 */

const layout = (text, separator, width) => {
    let offset = -1
    return text = text.replace(/\s+/g, ' ').replace(/ /g, (m, d, s) => {
//console.error(`width:${width}, space:${d}, offset:${offset}`)
        let next = s.indexOf(' ', d + 1)
//console.error('-'.repeat(width))
//console.error(s)
        if (next === -1) next = s.length
//console.error(' '.repeat(next) + '^')
//console.error(next - offset)
        if (next - offset > width + 1) {
            offset = d
//console.error('\tnewline')
            return separator
        } else {
            return m
        }
    })
}

/**
 * Prompt for a password - echo off
 */

const CONTROL_C = '\u0003'
const CONTROL_D = '\u0004'
const BACKSPACE = '\u007f'
const CR = '\r'
const LF = '\n'

const prompt = text => new Promise((resolver, rejector) => {
    let input = []

    const listener = key => {
        switch (key) {
        case CONTROL_D:
        case CR:
        case LF:
            stop()
            process.stderr.write('\n')
            resolver(input.join(''))
            break
        case CONTROL_C:
            stop()
            process.stderr.write('^C')
            process.kill(0, 'SIGINT')
            break
        case BACKSPACE:
            input.pop()
            break
        default:
            input.push(key)
            break
        }
    }

    const stop = () => {
        process.stdin.removeListener('data', listener)
        process.stdin.setRawMode(false)
        process.stdin.pause()
    }

    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf-8')
    process.stderr.write(text)
    process.stdin.on("data", listener)
})

export default {
    layout,
    prompt,
}
