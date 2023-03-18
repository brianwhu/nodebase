import fs from 'node:fs'

export default class Transcoder {
    static keys

    static {
        try {
            Transcoder.keys = fs.readFileSync("/Volumes/CANON_DC/notepad.keypad")
        } catch (x) {
            if (x.code === 'ENOENT') {
                console.error("*** Keys not available")
            } else {
                console.error("*** Not able to read keys")
            }
            process.exit(1)
        }
    }

    constructor(offset) {
        this.index = offset
    }

    transcode(buffer) {
        for (let i = 0; i < buffer.length; ++i) {
            buffer[i] = buffer[i] ^ Transcoder.keys[(this.index + i) % Transcoder.keys.length]
        }
        this.index += buffer.length
        return buffer
    }
}
