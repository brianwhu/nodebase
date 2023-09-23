const generate = (count, length, before, after, newline) => {
    const text = []

    for (let i = 0; i < count; ++i) {
        const word = []
        const l = 1 + Math.floor(Math.random()*length)
        if (Math.random() < before) word.push(' ')
        for (let j = 0; j < l; ++j) {
            word.push(String.fromCharCode('a'.charCodeAt(0) + Math.floor(Math.random()*26)))
        }
        if (Math.random() < after) word.push(' ')
        if (Math.random() < newline ?? 0) word.push('\n')
        text.push(word.join(''))
    }

    return text.join(' ')
}

export default generate
