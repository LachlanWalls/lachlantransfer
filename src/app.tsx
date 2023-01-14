import { useCallback, useEffect, useState } from 'preact/hooks'
import './app.css'
import { File as IFile, User } from '../backend/src/server.js'
import { Animal } from './components/Animal.js'
import { Loader } from './components/Loader.js'
import { Upload } from './components/Upload.js'
import { createRef } from 'preact'
import { Download } from './components/Download.js'
import i18n from './i18n.js'

enum States { Connecting, Connected, Errored }
export const languages = ['en', 'de', 'es', 'fr', 'ja', 'it', 'pt', 'zh', 'en-AU', 'en-PR'] as const
type Language = typeof languages[number]
export type LanguageSet = typeof i18n[Language]

function getLanguage() {
  const langParam = new URLSearchParams(window.location.search).get('lang') as Language | null
  if (langParam && languages.includes(langParam)) return langParam
  const langCookie = decodeURIComponent(document.cookie).split('lang=')[1]?.split(';')[0] as Language | undefined
  if (langCookie && languages.includes(langCookie)) return langCookie
  return 'en'
}

export function App() {
  const [language, setLanguage] = useState(getLanguage())
  const l = i18n[language]
  useEffect(() => {
    const d = new Date(Date.now() + (100000 * 24 * 60 * 60 * 1000))
    document.cookie = `lang=${language};expires=${d.toUTCString()};path=/`
    document.title = `lachlan${l.TRANSFER}`
  }, [language])

  const [state, setState] = useState(States.Connecting)
  const [self, setSelf] = useState<User | null>()

  const [uploads, setUploads] = useState<File[]>([])
  const [downloads, setDownloads] = useState<IFile[]>([])

  const fileSelectRef = createRef<HTMLInputElement>()
  const dragAndDropRef = createRef<HTMLDivElement>()
  const [dragAndDropHovering, setDragAndDropHovering] = useState(false)

  useEffect(() => {
    let ws: WebSocket
    try {
      const url = location.origin.replace('https', 'wss').replace('http', 'ws')
      ws = new WebSocket(import.meta.env.DEV ? url.replace('5173', '5174') : url)
    } catch {
      setState(States.Errored)
      return
    }

    ws.onmessage = event => {
      const str = String(event.data)
      const payload = JSON.parse(str)
      
      if (payload.op === 'hello') {
        setState(States.Connected)
        setSelf(payload.u as User | null)
      }

      if (payload.op === 'add-file') {
        setDownloads(downloads => [...downloads, payload.f as IFile])
      }
    }

    ws.onclose = event => {
      console.error('ws closed', event)
      setState(States.Connecting)
      setSelf(undefined)
    }

    return () => ws.close()
  }, [])

  const addFiles = useCallback((f: FileList) => {
    for (const file of f) {
      setUploads(uploads => [...uploads, file])
    }
  }, [])

  useEffect(() => {
    const dragAndDrop = dragAndDropRef.current, fileSelect = fileSelectRef.current

    function updateDragAndDropState (e: MouseEvent) {
      e.stopPropagation()
      e.preventDefault()
      setDragAndDropHovering(e.type === 'dragover')
    }

    function onDrop (e: DragEvent) {
      updateDragAndDropState(e)
      const files = e.dataTransfer?.files
      if (files) addFiles(files)
    }

    function onClick () {
      fileSelectRef.current?.click()
    }

    function onFilesChange (e: Event) {
      const target = e.target as HTMLInputElement
      if (target.files) addFiles(target.files)
      target.files = null
    }

    dragAndDrop?.addEventListener('dragover', updateDragAndDropState)
    dragAndDrop?.addEventListener('dragleave', updateDragAndDropState)
    dragAndDrop?.addEventListener('drop', onDrop)
    dragAndDrop?.addEventListener('click', onClick)
    fileSelect?.addEventListener('change', onFilesChange)

    return () => {
      dragAndDrop?.removeEventListener('dragover', updateDragAndDropState)
      dragAndDrop?.removeEventListener('dragleave', updateDragAndDropState)
      dragAndDrop?.removeEventListener('drop', onDrop)
      dragAndDrop?.removeEventListener('click', onClick)
      fileSelect?.removeEventListener('change', onFilesChange)
    }
  }, [dragAndDropRef, fileSelectRef, addFiles])

  const ghost = self === null

  return (
    <>
      <div class='header group'>
        <div class='group'>
          <div class='icon'>
            <Loader loaded={state === States.Connecting}/>
            {self && <Animal name={self.animal} rotation={self.rotation} size={2} animateIn={100}/>}
            {ghost && <Animal name={'ghost'} rotation={0} size={2} animateIn={100}/>}
          </div>
          <div class={`vert${ghost ? ' ghost' : ''}`}>
            <h1>lachlan{l.TRANSFER}</h1>
            <p>{l.GHOST_MODE_NOTICE}</p>
          </div>
        </div>

        <select value={language} onChange={e => setLanguage((e.target as HTMLSelectElement).value as Language)}>
          {languages.map(lang => <option key={lang} value={lang}>{i18n[lang].THIS}</option>)}
        </select>
      </div>

      <div class='grid' style={{ display: self ? 'flex' : 'none' }}>
        {uploads.map((upload, i) => <Upload key={i} file={upload} token={self?.token!} l={l}/>)}

        <div class={`upload select${dragAndDropHovering ? ' hovering' : ''}`} ref={dragAndDropRef}>
          <p><span>{l.CLICK_TO_SELECT}</span>{l.DROP_FILES}</p>
          <input type='file' multiple style={{ display: 'none' }} ref={fileSelectRef}/>
        </div>
      </div>

      <div class='grid' style={{ borderColor: self ? null : 'transparent' }}>
        {downloads.map((download, i) => <Download key={i} file={download} l={l}/>)}
        {downloads.length === 0 && <p>{l.NO_DOWNLOADS_YET}</p>}
      </div>
    </>
  )
}
