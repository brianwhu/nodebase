import fs from 'fs'
import climate from '@streamyflow/cli-mate'
import Transcoder from './transcoder.js'

export default toplevel => {
    let cli = climate.on(toplevel).define("Transcode contents", {
    }, "video-input", "video-output").parse()

    if (cli) {
        const transcoder = new Transcoder(0)
        fs.createReadStream(cli.args[0]).map(data => transcoder.transcode(data)).pipe(fs.createWriteStream(cli.args[1]))
    }
}

