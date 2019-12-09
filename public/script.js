function getCookie(cname) {
    var ca = decodeURIComponent(document.cookie).split(';')
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i]
        while (c.charAt(0) == ' ') c = c.substring(1)
        if (c.indexOf(cname + "=") == 0) return c.substring((cname + "=").length, c.length)
    }
    return ""
}

function setCookie(cname, cvalue, exdays = 100000) {
    var d = new Date()
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
    document.cookie = cname + "=" + cvalue + ";expires=" + d.toUTCString() + ";path=/";
}

let txt = LANGS["en"]

function setLanguage(code) {
    let lang = code || "en"
    document.querySelector("html").setAttribute("lang", lang)
    document.querySelector("#nav>select>option[value='" + lang + "']").setAttribute("selected", "")
    txt = LANGS[lang]

    setCookie("lang", code)

    document.title = txt.title
    document.querySelector("#nav>h4").innerHTML = txt.title
    document.querySelector("#nav>.pages>.upload").innerHTML = txt.UPLOAD
    document.querySelector("#nav>.pages>.download").innerHTML = txt.DOWNLOAD
    document.querySelector("#quickstart>.upload").innerHTML = txt.UPLOAD
    document.querySelector("#quickstart>.download").innerHTML = txt.DOWNLOAD
    document.querySelector("#upload>.container>.addfile>.filedrag").innerHTML = "<strong>" + txt.choose + "</strong>" + txt.drop
    document.querySelector("#download>.container>p").innerHTML = txt.nofiles

    document.querySelector("#nav").setAttribute("show", "")
    document.querySelector("#quickstart").setAttribute("show", "")
    document.querySelector("#maincontainer").setAttribute("show", "")
}

(function() {

    let pagestart = Date.now()

    // multilingual support
    // the highest priority goes to parameters in the url
    const urlParams = new URLSearchParams(window.location.search)
    const langParam = urlParams.get('lang')
    if (langParam && LANGS[langParam]) setLanguage(langParam)
    else {
        // second priority goes to COOKIES!!! i like cookie
        let langcookie = getCookie("lang")
        if (langcookie && LANGS[langcookie]) setLanguage(langcookie)
        else {
            // otherwise default to english
            setLanguage("en")
        }
    }

    // change language if the dropdown is changed, this will also update the cookie for future visits
    document.querySelector("select").addEventListener("change", () => setLanguage(document.querySelector("select").value))

    function setPage(p, qs = false) {
        document.querySelector("#nav>.pages").setAttribute("page", p)
        document.querySelector("body").setAttribute("page", p)

        if (qs) {
            document.querySelector("#upload").removeAttribute("hidden")
            document.querySelector("#download").removeAttribute("hidden")
            document.querySelector("#nav>.pages").removeAttribute("hidden")
            document.querySelector("#quickstart").removeAttribute("show")
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
        let div = document.createElement("div")
        div.className = "file"
        let id = Math.round(Math.random() * 10000)
        div.id = "upload_" + id

        let size = file.size
        let exts = [txt.bytes, txt.kilobytes, txt.megabytes]
        let ei = 0
        while (size > 1000) {
            if (ei < 2) {
                ei += 1
                size = Math.round(size / 10) / 100
            } else break
        }

        div.innerHTML = "<h3>" + file.name + "</h3><p>" + txt.type + ": " + file.type + "</p><p>" + size + " " + exts[ei] + "</p><input type='file' style='display: none'><button>" + txt.UPLOAD + "</button><div class='loader' style='display: none;'><div class='progress'></div></div>"
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
                e.target.innerHTML = txt.UPLOADsucc
                e.target.style.pointerEvents = "none"

                let download = document.createElement("a")
                download.className = "download"
                download.href = "/uploads/" + data.data.filename
                download.setAttribute("download", data.data.filename.split("/").pop())
                download.innerHTML = txt.download
                e.target.parentElement.appendChild(download)

            }).catch(error => {
                e.target.style.display = "block"
                e.target.parentElement.querySelector(".loader").style.display = "none"
                e.target.innerHTML = txt.UPLOADfail
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

    function displayReceivingFiles(files) {
        document.querySelector("#download>.container").innerHTML = (files.length == 0) ? "<p>" + txt.nofiles + "</p>" : ""
        files.forEach(file => {
            let div = document.createElement("div")
            div.className = "file"
            div.innerHTML = "<h3>" + file.split("__")[1] + "</h3><a href='/uploads/" + file + "' download='" + file + "'>" + txt.download + "</a>"
            document.querySelector("#download>.container").appendChild(div)
        })
    }

    function checkForFiles() {
        fetch("/getfiles/" + pagestart, { method: "POST" }).then(res => res.text()).then(resp => {
            let response = JSON.parse(resp)
            displayReceivingFiles(response.files)
            window.setTimeout(checkForFiles, 5000)
        }).catch(e => {
            console.log(e)
            window.setTimeout(checkForFiles, 5000)
        })
    }

    checkForFiles()

})();