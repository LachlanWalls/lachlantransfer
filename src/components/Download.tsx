import { useMemo } from 'preact/hooks'
import * as mime from 'mime'
import './download.css'
import { File as IFile } from '../../backend/src/server.js'
import { formatSize } from './Upload.js'
import { Animal } from './Animal.js'
import { LanguageSet } from '../app.js'

export function Download ({ file, l }: { file: IFile, l: LanguageSet }) {
  const type = useMemo(() => mime.getType(file.name) || l.UNKNOWN, [l.UNKNOWN])
  const size = useMemo(() => formatSize(file.size), [])

  return <a class='download' href={file.path} download={file.name}>
    <div class='group'>
      <Animal name={file.user.animal} rotation={file.user.rotation} size={1}/>
      <h3>{file.name}</h3>
    </div>
    <p>{l.TYPE}: <span>{type}</span>, {size}</p>
    <p>{l.DOWNLOAD}</p>
  </a>
}
