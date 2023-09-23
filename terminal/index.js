/**
 * Layout text within a given width
 *
 * @param text - the paragraph to layout
 * @param separator - the character sequence to separate lines
 * @param width - the width of the terminal window
 * @param sizer - placeholder/keyword handling
 */
const layout = (text, separator, width, sizer) => {
    let offset = -1
    return text.trim().replace(/\s+/g, ' ').replace(/ /g, (m, d, s) => {
//console.error(`width:${width}, space:${d}, offset:${offset}`)
        let next = s.indexOf(' ', d + 1)
//console.error('-'.repeat(width))
//console.error(s)
        if (next === -1) next = s.length
//console.error(' '.repeat(next) + '^')
//console.error(next - offset)
        let size = sizer ? sizer(s.substring(d + 1, next)) : next - d - 1;
        if (size + d - offset > width) {
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
