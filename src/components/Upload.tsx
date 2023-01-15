import { useEffect, useMemo, useState } from 'preact/hooks'
import * as mime from 'mime'
import './upload.css'
import axios from 'axios'
import { LanguageSet } from '../app.js'

export function formatSize (size: number) {
  let isize = size, names = ['B', 'kB', 'MB', 'GB']
  while (isize > 1000 && names.length > 1) {
    isize = Math.round(isize / 10) / 100
    names.shift()
  }
  return `${isize}${names[0]}`
}

const maxFileSize = Number(import.meta.env.VITE_MAX_FILE_SIZE_BYTES)

export function Upload ({ file, token, l }: { file: File, token: string, l: LanguageSet }) {
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<keyof LanguageSet>()

  useEffect(() => {
    if (file.size > maxFileSize) return setError('ERROR_FILE_TOO_LARGE') 

    const data = new FormData()
    data.append('token', token)
    data.append('upload', file)

    axios.request({
      method: 'post',
      url: '/upload',
      data,
      onUploadProgress: p => setProgress((p.progress || 0) * 0.9)
    }).then(data => {
      const result = data.data as 'weird-upload' | 'file-too-large' | 'invalid-auth' | 'success'
      if (result === 'success') {
        setProgress(1)
      } else {
        setError(({
          'weird-upload': 'ERROR_WEIRD_UPLOAD',
          'file-too-large': 'ERROR_FILE_TOO_LARGE',
          'invalid-auth': 'ERROR_INVALID_AUTH'
        } as const)[result])
      }
    }).catch(error => {
      setError('ERROR_NETWORK')
      console.error(error)
    })
  }, [])

  const type = useMemo(() => mime.getType(file.name) || l.UNKNOWN, [l.UNKNOWN])
  const size = useMemo(() => formatSize(file.size), [])

  return <div class='upload'>
    <h3>{file.name}</h3>
    <p>{l.TYPE}: <span>{type}</span>, {size}</p>

    {error !== undefined
      ? <p class='error'>
          {error === 'ERROR_FILE_TOO_LARGE'
            ? `${l.ERROR_FILE_TOO_LARGE} ${formatSize(maxFileSize)}`
            : l[error]}
        </p>
      : <div class='group'>
          <div class='progress'>
            <div class='fill' style={{
              width: Math.round(progress * 100) + '%',
              backgroundColor: progress < 1 ? 'white' : '#c97ba0'
            }}/>
          </div>
          {progress === 1 && <p>&#10003;</p>}
        </div>}
  </div>
}
