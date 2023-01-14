import express from 'express'
import multer from 'multer'
import { WebSocket, WebSocketServer } from 'ws'
import http from 'http'
import crypto from 'crypto'
import fs from 'fs'

import dotenv from 'dotenv'
// @ts-expect-error allow assigning, will be present after this point
import.meta.env = dotenv.config().parsed
const maxFileSize = Number(import.meta.env.VITE_MAX_FILE_SIZE_BYTES)
const maxUsers = Number(import.meta.env.VITE_MAX_USERS_OVERRIDE)

import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DIRS = process.env.NODE_ENV === 'development'
  ? { ANIMALS: '../../public/animals', UPLOADS: '../../public/uploads' }
  : { ANIMALS: './animals', UPLOADS: './uploads' }
if (!fs.existsSync(path.join(__dirname, DIRS.UPLOADS))) fs.mkdirSync(path.join(__dirname, DIRS.UPLOADS))

const animals = fs.readdirSync(path.join(__dirname, DIRS.ANIMALS)).map(a => a.replace('.svg', ''))

export type User = {
  token: string,
  animal: string,
  rotation: number
}

export type File = {
  path: string,
  name: string,
  size: number,
  user: { animal: string, rotation: number },
  uploadedAt: number
}

const allUsers: User[] = []
const allFiles: File[] = []

export const router = express.Router()
const upload = multer({
  dest: path.join(__dirname, DIRS.UPLOADS),
  fileFilter (req, _file, callback) {
    const shouldAccept = Number(req.headers['content-length']) <= maxFileSize * 1.1
    return shouldAccept ? callback(null, true) : callback(new Error('file-too-large'))
  },
})

router.post('/', (req, res, next) => {
  upload.single('upload')(req, res, d => {
    if (d && d.message === 'file-too-large') {
      req.pause()
      req.socket.end()
      return res.send('file-too-large')
    }

    return next(d)
  })
}, (req, res) => {
  const file = req.file

  if (!file) return res.send('weird-upload')
  if (file.size > maxFileSize) return res.send('file-too-large')
  const user = allUsers.find(u => u.token === req.body.token)
  if (!user) return res.send('invalid-auth')

  const f = {
    path: '/uploads' + file.path.split('/uploads')[1],
    name: file.originalname,
    size: file.size,
    user: { animal: user.animal, rotation: user.rotation },
    uploadedAt: Date.now()
  }

  allFiles.push(f)
  const pld = JSON.stringify({ op: 'add-file', f })
  Array.from(wss.clients.values()).filter(c => c.readyState === WebSocket.OPEN).forEach(c => c.send(pld))
  return res.send('success')
})

export const wss = new WebSocketServer({ clientTracking: true, noServer: true })
wss.on('connection', socket => {
  let user: User | null = null

  const override = maxUsers > -1 && allUsers.length >= maxUsers
  if (allUsers.length < animals.length * 8 && !override) {
    let animal = animals[crypto.randomInt(animals.length)]!
    let users = allUsers.filter(u => u.animal === animal)
    while (users.length >= 8) animal = animals[crypto.randomInt(animals.length)]!
    const rotation = [0, 4, 2, 6, 1, 5, 3, 7].find(r => !users.find(u => u.rotation === r))!

    user = { token: crypto.randomUUID(), animal, rotation }
    allUsers.push(user)
  }

  socket.send(JSON.stringify({ op: 'hello', u: user }))

  function onClose () {
    clearInterval(pinger)
    const idx = allUsers.findIndex(u => user && u.token === user.token)
    if (idx >= 0) allUsers.splice(idx, 1)
  }

  const pinger = setInterval(() => {
    if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) onClose()
    else if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 'ping' }))
  }, 5000)

  socket.on('close', onClose)
})

if (process.env.NODE_ENV !== 'development') {
  /*
   * When running in production (without vite), we need to create the server ourselves
   * This includes returning the compiled files
   */
  const app = express()
  app.use(express)
  app.use('/upload', router)
  
  app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')))
  app.use('/animals', express.static(path.join(__dirname, 'animals')))
  app.use('/assets', express.static(path.join(__dirname, 'assets')))
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

  const server = http.createServer(app)
  server.on('upgrade', (req, s, h) => wss.handleUpgrade(req, s, h, ws => wss.emit('connection', ws, req)))
  server.listen(Number(import.meta.env.PROD_PORT), () => console.log('lachlantransfer online'))
} else {
  /**
   * When running in development mode (with vite), we only need to start the websocket server
   */
  const server = http.createServer()
  server.on('upgrade', (req, s, h) => wss.handleUpgrade(req, s, h, ws => wss.emit('connection', ws, req)))
  server.listen(5174)
}
