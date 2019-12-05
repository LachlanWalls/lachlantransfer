(function() {

    let pagestart = Date.now()

    function setPage(p, qs = false) {
        document.querySelector("#nav>.pages").setAttribute("page", p)
        document.querySelector("body").setAttribute("page", p)

        if (qs) {
            document.querySelector("#upload").removeAttribute("hidden")
            document.querySelector("#download").removeAttribute("hidden")
            document.querySelector("#nav>.pages").removeAttribute("hidden")
            document.querySelector("#quickstart").setAttribute("hidden", "")
        }
    }

    document.querySelector("#quickstart>.upload").addEventListener("click", () => setPage("send", true))
    document.querySelector("#nav>.pages>.upload").addEventListener("click", () => setPage("send"))
    document.querySelector("#quickstart>.download").addEventListener("click", () => setPage("receive", true))
    document.querySelector("#nav>.pages>.download").addEventListener("click", () => setPage("receive"))

    function updateHoverState(e) {
        e.stopPropagation()
        e.preventDefault()
        if (e.type == "dragover") e.target.setAttribute("hovering", "")
        else e.target.removeAttribute("hovering")
    }

    function fileSelected(e) {
        updateHoverState(e)
        var files = e.target.files || e.dataTransfer.files
        if (files.length > 1) console.error("one file at a time. first file used.")
        addFile(files[0], files)
    }

    function addFile(file, files) {
        // file.name file.type file.size (bytes)
        // add the file to the thingo

        let div = document.createElement("div")
        div.className = "file"
        let id = Math.round(Math.random() * 10000)
        div.id = "upload_" + id

        let size = file.size
        let exts = ["bytes", "kilobytes", "megabytes"]
        let ei = 0
        while (size > 1000) {
            if (ei < 2) {
                ei += 1
                size = Math.round(size / 10) / 100
            } else break
        }

        div.innerHTML = "<h3>" + file.name + "</h3><p>type: " + file.type + "</p><p>" + size + " " + exts[ei] + "</p><input type='file' style='display: none'><button>UPLOAD</button><div class='loader' style='display: none;'><div class='progress'></div></div>"
        document.querySelector("#upload>.container").insertBefore(div, document.querySelector("#upload>.container>.addfile"))
        document.querySelector("#upload_" + id + ">input").files = files

        document.querySelector("#upload_" + id + ">button").addEventListener("click", e => {
            var data = new FormData()
            data.append('file', e.target.parentElement.querySelector("input").files[0])

            e.target.style.display = "none"
            e.target.parentElement.querySelector(".loader").style.display = "block"

            axios.request({
                method: "post",
                url: "/",
                data: data,
                onUploadProgress: p => {
                    e.target.parentElement.querySelector(".loader>.progress").style.width = (p.loaded / p.total) * 280 + "px"
                }
            }).then(data => {
                e.target.style.display = "block"
                e.target.parentElement.querySelector(".loader").style.display = "none"
                e.target.innerHTML = "UPLOADED SUCCESSFULLY"
                e.target.style.pointerEvents = "none"

                let download = document.createElement("a")
                download.className = "download"
                download.href = "/uploads/" + data.data.filename
                download.setAttribute("download", data.data.filename.split("/").pop())
                download.innerHTML = "download"
                e.target.parentElement.appendChild(download)

            }).catch(error => {
                e.target.style.display = "block"
                e.target.parentElement.querySelector(".loader").style.display = "none"
                e.target.innerHTML = "FAILED. TRY AGAIN?"
            })
        })

    }

    document.querySelector("#upload>.container>.addfile>.fileselect").addEventListener("change", fileSelected, false)
    document.querySelector("#upload>.container>.addfile").addEventListener("click", e => {
        document.querySelector("#upload>.container>.addfile>.fileselect").click()
    })

    var xhr = new XMLHttpRequest()
    if (xhr.upload) {
        var filedrag = document.querySelector("#upload>.container>.addfile")
        filedrag.addEventListener("dragover", updateHoverState, false)
        filedrag.addEventListener("dragleave", updateHoverState, false)
        filedrag.addEventListener("drop", fileSelected, false)
    }

    function checkForFiles() {
        fetch("/getfiles/" + pagestart, { method: "POST" }).then(res => res.text()).then(resp => {
            console.log(resp)
            window.setTimeout(checkForFiles, 5000)
        }).catch(e => {
            console.log(e)
            window.setTimeout(checkForFiles, 5000)
        })
    }

    checkForFiles()

})();