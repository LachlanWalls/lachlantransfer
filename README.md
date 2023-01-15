# lachlantransfer

send files between devices over the interwebs

todo: sweep and delete files

**Features:**

- File uploads: up to 100Mb (cloudflare limit)
- Ephemeral file sharing: only shown to users already on the site
- Semi-anonymous: represented only by a cross-referencable animal icon
- Language support: 8 languages (only google translate, but i18n proof of concept)

**Dev stack:**

- Vite for dev server & bundling
- Preact for UI
- Express server for production backend
  - `multer` for `multipart/form-data` file uploading
  - `ws` for websocket server
- [Mutant](https://mutant.tech/) emoji for the animal icons

**Future improvements:**

- S3 storage bucket with pre-signed URLs for larger uploads (theoretically up to 1Gb, or even more?)
- Look into web workers for performance improvement, especially for the websocket
- See if the SVG animal icons can be loaded more efficiently
- Possibly allow users to delete their uploaded files

**Branches**

- `master` (current): v2 of lachlantransfer, as described above
- `v1`: previous v1 of lachlantransfer, less features, older UI and written in vanilla JS
- `v0`: original version, similar frontend to `v1` but with a python backend 
