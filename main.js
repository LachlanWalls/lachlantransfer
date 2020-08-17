#!/usr/bin/env nodejs

// HTTP
var express = require('express')
var app = express()
var fs = require('fs')

// IMPORTS
const fu = require('express-fileupload')
const config = require('./config.json')

const sitename = config.sitename

// REQUEST HANDLING
app.use(express.static('public'))
app.use('/uploads', express.static('uploads'))
app.use(express.json({limit: '50mb'}))
app.use(fu({ limits: { fileSize: config.max_file_size_mb * 1024 * 1024 } }))
app.set('trust proxy', 1)

app.get('/', (req, res) => {
    let html = fs.readFileSync('./html/home.html', 'utf-8')
    res.send(html.split('%SITENAME%').join(sitename).replace("true//KEEPTRANSFER", config.transfersuffix).replace('0//MAXSIZE', config.max_file_size_mb))
})

app.post('/', (req, res) => {
    if (!req.files['file']) return res.send({'err': 'no-file'})

    let file = req.files['file']

    if (!file.name) return res.send({'err': 'filename-blank'})

    let filename = Math.round(new Date().getTime()) + "__" + file.name

    if (!fs.existsSync('./uploads/')) fs.mkdirSync('./uploads/')
    file.mv(__dirname + '/uploads/' + filename, err => {
        if (err) return res.send({'err': 'saving-err'})
        return res.send({'filename': filename})
    })
})

app.post('/getfiles/:since', (req, res) => {
    if (!fs.existsSync('./uploads/')) fs.mkdirSync('./uploads/')
    let files = fs.readdirSync('./uploads/')
    let since = Number(req.params.since)
    if (isNaN(since)) return res.send({'err': 'invalid-since'})

    let retfiles = []

    files.map(f => {
        if (Number(f.split("__")[0]) > since) {
            let sz = fs.statSync('./uploads/' + f).size
            retfiles.push([f, sz])
        }
    })

    res.send({'files': retfiles})
})

let clearout = () => {
    if (!fs.existsSync('./uploads/')) fs.mkdirSync('./uploads/')
    let files = fs.readdirSync('./uploads/')

    let maxage = config.max_file_age
    let filter = f => (Number(f.split("__")[0]) < (new Date().getTime() - maxage))

    files.filter(filter).forEach(f => fs.unlinkSync('./uploads/' + f))

    setTimeout(clearout, config.sweep_interval)
}

app.listen(config.port, () => console.log('listening on localhost:' + config.port))
clearout()
