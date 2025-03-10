// Map<Service, Map<Style, Map<Category, Array<Extension>>>
// Map<String, Map<String, Map<String, Array<String>>]>>
let tree = new Map();

let serviceSelector = document.getElementById("services");
let badges = document.getElementById("badges");
let link = document.getElementById("link");

fetch("cached.json").then((r) => r.json()).then((data) => {
    let services = [];
    for (const item of data.tree) {
        if (item.path.includes("assets/") && !item.path.includes("assets/branding") && (item.path.includes(".png") || item.path.includes(".svg"))) {
            let split = item.path.split("/");

            const style = split[1];
            const category = split[2];
            let arr = split[3].split("_");
            const serviceName = arr[0];
            const extension = "_" + arr[1];

            if (!tree.has(serviceName)) {
                tree.set(serviceName, new Map());
                services.push(serviceName);
            }

            if (!tree.get(serviceName).has(style)) {
                tree.get(serviceName).set(style, new Map())
            }

            if (!tree.get(serviceName).get(style).has(category)) {
                tree.get(serviceName).get(style).set(category, []);
            }
            tree.get(serviceName).get(style).get(category).push(extension);
        }
    }
    //console.log(tree);

    services.sort((a, b) => a.localeCompare(b))
    for (const service of services) {
        document.getElementById("services").appendChild(new Option(getServiceDisplayName(service), service))
    }
});

function getServiceDisplayName(s) {
    let split = s.split("-");

    let name = "";

    for (const word of split) {
        if (split.indexOf(word) == split.length - 1) {
            name += capitalizeFirstLetter(word);
            continue;
        }
        name += capitalizeFirstLetter(word) + " ";
    }

    if (name.endsWith("Api")) {
        name = name.replace("Api", "API");
    }
    else if (name.endsWith("Plural")) {
        name = name.replace("Plural", "(Plural)")
    }
    else if (name.endsWith("Singular")) {
        name = name.replace("Singular", "(Singular)")
    }
    else if (name.endsWith("Plural Alt")) {
        name = name.replace("Plural Alt", "(Plural) [ALT]")
    }
    else if (name.endsWith("Singular Alt")) {
        name = name.replace("Singular Alt", "(Singular) [ALT]")
    }

    return name;
}

// https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

link.addEventListener("keyup", (ev) => {
    document.querySelectorAll(".badge-link").forEach((a) => {
        updateLinks();
    })
});

function updateLinks() {
    let url = getURL();
    if (url == "") url = "#\\";
    document.querySelectorAll(".badge-link").forEach((a) => {
        a.href = url;
    })
}

function getURL() {
    if (link.value == '') {
        return "";
    }
    try {
        return new URL(link.value).toString();
    }
    catch {
        try {
            return new URL("http:" + link.value).toString();
           
        }
        catch {
            return "";
        }
    }
}

serviceSelector.addEventListener("change", (ev) => {
    badges.innerText = '';
    if (serviceSelector.value == "unselected") {
        return;
    }
    if (document.getElementById("remove_on_select") != null) {
        document.getElementById("remove_on_select").remove();
    }
    let urls = buildServiceBadgeURLS(serviceSelector.value);
    urls.forEach((url) => {
        let badge = document.getElementById("template").cloneNode(true);
        badge.setAttribute("id", "");
        if (badge instanceof HTMLDivElement) {
            let info = badge.querySelector(".badge-info");
            info.innerText = url.style + " | " + url.category + " | " + url.extension.slice(1);

            let image = badge.querySelector(".badge-image");
            image.src = url.url;

            let markdownButton = badge.querySelector(".markdown-copy");
            if (markdownButton instanceof HTMLButtonElement) {
                markdownButton.addEventListener("click",(ev)=>{
                    // todo
                    navigator.clipboard.writeText(`[![${url.service}](${url.url})](${getURL()})`)
                });
            }

            badges.appendChild(badge);
        }
    });
    updateLinks();
});

let badge = {
    service: "",
    style: "",
    category: "",
    url: "",
    extension: "",

}


function buildServiceBadgeURLS(s) {
    let styles = tree.get(s);
    let prefix = "https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3/assets/";
    let urls = [];
    for (const [style, categories] of styles.entries()) {
        let url = prefix + style + "/";

        for (const [category, extensions] of categories.entries()) {
            let url2 = url + category + "/" + s;
            for (const extension of extensions) {
                urls.push({
                    service: s,
                    style: getServiceDisplayName(style),
                    category: getServiceDisplayName(category),
                    url: url2 + extension,
                    extension: extension
                });
            }
        }
    }
    return urls;
}