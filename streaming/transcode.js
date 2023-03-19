import fs from 'fs'
import climate from '@streamyflow/cli-mate'

export default toplevel => {
    let cli = climate.on(toplevel).define("Transcode contents", {
    }, "video-input", "video-output").parse()

    if (cli) {
        import('@streamyflow/mpx-transcoder').then(module => {
            const transcoder = new module.default(0)
            fs.createReadStream(cli.args[0]).map(data => transcoder.transcode(data)).pipe(fs.createWriteStream(cli.args[1]))
        })
    }
}

