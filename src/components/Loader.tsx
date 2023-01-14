import './loader.css'

export function Loader ({ loaded }: { loaded: boolean }) {
  return <div class={`loader${loaded ? '' : ' loaded'}`}><div/><div/></div>
}
