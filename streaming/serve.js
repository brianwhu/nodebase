import express from "express"
import fs from "fs"
import climate from "@streamyflow/cli-mate"
import Transcoder from './transcoder.js'
import ChromeWindow from "@streamyflow/chrome-window"

const CHUNK_SIZE = 10**6 // 1MB
const MEDIA_PORT = 8000

export default toplevel => {
    let cli = climate.on(toplevel).define("Serve contents", {
        open: {
            doc: "Open a Chrome window to consume the contents",
            value: false
        },
        port: {
            doc: `Content streaming port number, default to ${MEDIA_PORT}`,
            value: MEDIA_PORT
        }
    }, "video-file").parse()

    if (cli) {
        const app = express()

        app.get("/", function (req, res) {
          res.sendFile(new URL('index.html', import.meta.url).pathname)
        })

        app.get("/video", function (req, res) {
          // Ensure there is a range given for the video
          const range = req.headers.range
          if (!range) {
            res.status(400).send("Requires Range header")
          }
          if (toplevel.opts.verbose.value) console.log(range)

          const videoPath = cli.args[0]
          const videoSize = fs.statSync(videoPath).size
          if (videoSize === 0) {
            console.error(`*** Invalid content: ${videoPath}`)
            process.exit(1)
          }

          const start = Number(range.replace(/\D/g, ""))
          const end = Math.min(start + CHUNK_SIZE, videoSize - 1)

          // Create headers
          const contentLength = end - start + 1
          const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
          }
          if (toplevel.opts.verbose.value) console.log(headers)

          // HTTP Status 206 for Partial Content
          res.writeHead(206, headers)

          // create video read stream for this particular chunk and stream to the client
          const transcoder = new Transcoder(start)
          fs.createReadStream(videoPath, { start, end }).map(data => transcoder.transcode(data)).pipe(res)
        })

        app.listen(cli.opts.port.value, function () {
            console.log(`Streaming live at http://localhost:${cli.opts.port.value}/`)
        })

        if (cli.opts.open.value) {
            ChromeWindow.open(`http://localhost:${cli.opts.port.value}/`)
        }
    }
}

