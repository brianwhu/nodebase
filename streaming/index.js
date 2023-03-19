#!/usr/bin/env node

import transcode from './transcode.js'
import serve from './serve.js'
import climate from '@streamyflow/cli-mate'

let toplevel = climate.on("1.0.0").configure({
    settings: {
        program: "streaming"
    }
}).define("Manage and serve streaming videos", {
        verbose: {
            doc: "Display more information about the operations",
            value: false
        },
    }, {
        transcode: {
            action: transcode,
            doc: "Transcode video input for streaming"
        },
        serve: {
            action: serve,
            doc: "Stream a video content over HTTP"
        }
    }
).parse()

if (toplevel) {
    toplevel.next.action(toplevel);
}

