const { update, version: currentVersion, portable } = await VesktopUpdaterNative.getData();

document.getElementById("current-version").textContent = currentVersion;
document.getElementById("new-version").textContent = update.version;

const allowedTags = new Set([
    "A", "P", "UL", "OL", "LI", "CODE", "PRE", "BLOCKQUOTE", "STRONG", "EM", "B", "I",
    "BR", "HR", "H1", "H2", "H3", "H4", "H5", "H6", "TABLE", "THEAD", "TBODY", "TR",
    "TH", "TD", "DEL"
]);
const droppedTags = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "FORM"]);

function sanitizeReleaseNote(html) {
    const template = document.createElement("template");
    template.innerHTML = typeof html === "string" ? html : "";

    for (const element of [...template.content.querySelectorAll("*")]) {
        if (droppedTags.has(element.tagName)) {
            element.remove();
            continue;
        }

        if (!allowedTags.has(element.tagName)) {
            element.replaceWith(...element.childNodes);
            continue;
        }

        for (const attribute of [...element.attributes]) {
            if (element.tagName === "A" && attribute.name === "href") {
                try {
                    const url = new URL(attribute.value, "https://github.com");
                    if (url.protocol !== "https:" && url.protocol !== "http:") {
                        element.removeAttribute(attribute.name);
                    } else {
                        element.setAttribute("href", url.href);
                    }
                } catch {
                    element.removeAttribute(attribute.name);
                }
            } else if (attribute.name !== "title") {
                element.removeAttribute(attribute.name);
            }
        }

        if (element.tagName === "A") {
            element.setAttribute("target", "_blank");
            element.setAttribute("rel", "noopener noreferrer");
        }
    }

    return template.content;
}

const releaseNotes = document.getElementById("release-notes");
const notes = Array.isArray(update.releaseNotes)
    ? update.releaseNotes
    : [{ version: update.version, note: update.releaseNotes ?? "" }];

for (const { version, note } of notes) {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    heading.textContent = `Version ${version ?? update.version}`;
    section.append(heading, sanitizeReleaseNote(note));
    releaseNotes.append(section);
}

// remove useless headings
document.querySelectorAll("h3, h4, h5, h6").forEach(h => {
    if (h.textContent.trim().toLowerCase() === "what's changed") {
        h.remove();
    }
});

/** @type {HTMLDialogElement} */
const updateDialog = document.getElementById("update-dialog");
/** @type {HTMLDialogElement} */
const installingDialog = document.getElementById("installing-dialog");
/** @type {HTMLProgressElement} */
const downloadProgress = document.getElementById("download-progress");
/** @type {HTMLElement} */
const errorText = document.getElementById("error");

const updateButton = document.getElementById("update-button");

// electron-updater doesn't support portable installs, so link to this fork's releases instead
if (portable) updateButton.textContent = "Download update";

updateButton.addEventListener("click", () => {
    if (portable) {
        window.open(`https://github.com/xxm-cmyk/SaudiCord-/releases/tag/v${encodeURIComponent(update.version)}`);
        return;
    }

    downloadProgress.value = 0;
    errorText.textContent = "";

    if (navigator.platform.startsWith("Linux")) {
        document.getElementById("linux-note").classList.remove("hidden");
    }

    updateDialog.showModal();

    VesktopUpdaterNative.installUpdate().then(() => {
        downloadProgress.value = 100;
        updateDialog.closedBy = "any";

        installingDialog.showModal();
        updateDialog.classList.add("hidden");
    }).catch(error => {
        updateDialog.closedBy = "any";
        errorText.textContent = `An error occurred while downloading the update: ${String(error?.message ?? error)}`;
    });
});

document.getElementById("later-button").addEventListener("click", () => VesktopUpdaterNative.snoozeUpdate());
document.getElementById("ignore-button").addEventListener("click", () => {
    const confirmed = confirm(
        "Are you sure you want to ignore this update? You will not be notified about this update again. Updates are important for security and stability."
    );
    if (confirmed) VesktopUpdaterNative.ignoreUpdate();
});

VesktopUpdaterNative.onProgress(percent => (downloadProgress.value = percent));
VesktopUpdaterNative.onError(message => {
    updateDialog.closedBy = "any";
    errorText.textContent = `An error occurred while downloading the update: ${message}`;
    installingDialog.close();
    updateDialog.classList.remove("hidden");
});
