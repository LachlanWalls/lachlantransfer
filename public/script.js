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
    document.querySelector("#nav>.pages>.upload").innerHTML = txt.send
    document.querySelector("#nav>.pages>.download").innerHTML = txt.receive
    document.querySelector("#quickstart>.upload").innerHTML = txt.send
    document.querySelector("#quickstart>.download").innerHTML = txt.receive
    document.querySelector("#upload>.container>.addfile>.filedrag").innerHTML = "<strong>" + txt.choose + "</strong>" + txt.drop
    document.querySelector("#download>.container>p").innerHTML = txt.nofiles
}

(function() {

    let pagestart = Date.now()
    let tokens = []

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

    document.querySelector("#nav").setAttribute("show", "")
    document.querySelector("#quickstart").setAttribute("show", "")
    document.querySelector("#maincontainer").setAttribute("show", "")
    document.querySelector("#footer").setAttribute("show", "")

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

    function addToken() {
        let token = prompt("Adding a token will allow you to see private uploads from people who submit that token with their upload.", "mytoken")
        if (token && tokens.indexOf(token) == -1) tokens.push(token)
        document.querySelector("#footer>p").innerHTML = "Private Tokens: " + tokens.join(", ") + "<span>+</span>"
        document.querySelector("#footer>p>span").addEventListener("click", addToken)
    }

    document.querySelector("#footer>p>span").addEventListener("click", addToken)

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
            data.append('token', prompt("would yee liek token?"))

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
                e.target.innerHTML = txt.uploadsucc
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
                e.target.innerHTML = txt.uploadfail
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

            let size = file[1]
            let exts = [txt.bytes, txt.kilobytes, txt.megabytes]
            let ei = 0
            while (size > 1000) {
                if (ei < 2) {
                    ei += 1
                    size = Math.round(size / 10) / 100
                } else break
            }

            div.innerHTML = "<h3>" + file[0].split("__")[1] + "</h3><p>" + MimeType.lookup(file[0]) + "</p><p>" + size + " " + exts[ei] + "</p><a href='/uploads/" + file[0] + "' download='" + file[0] + "'>" + txt.download + "</a>"
            document.querySelector("#download>.container").appendChild(div)
        })
    }

    function checkForFiles() {
        fetch("/getfiles/" + pagestart, { method: "POST", body: { 'tokens': tokens } }).then(res => res.text()).then(resp => {
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