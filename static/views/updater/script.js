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
    heading.textContent = `الإصدار ${version ?? update.version}`;
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

// electron-updater does not support portable installs. Portable users get the GitHub release page.
if (portable) {
    updateButton.textContent = "تنزيل التحديث";
} else {
    updateButton.disabled = true;
    updateButton.textContent = "جارٍ تنزيل التحديث تلقائياً...";
    updateDialog.showModal();

    VesktopUpdaterNative.onDownloaded(() => {
        downloadProgress.value = 100;
        updateDialog.close();
        updateButton.disabled = false;
        updateButton.textContent = "إعادة التشغيل وتثبيت التحديث";
    });
}

updateButton.addEventListener("click", () => {
    if (portable) {
        window.open(`https://github.com/xxm-cmyk/SaudiCord-/releases/tag/v${encodeURIComponent(update.version)}`);
        return;
    }

    errorText.textContent = "";
    installingDialog.showModal();
    VesktopUpdaterNative.installUpdate().catch(error => {
        installingDialog.close();
        errorText.textContent = `تعذر تثبيت التحديث: ${String(error?.message ?? error)}`;
        if (!updateDialog.open) updateDialog.showModal();
    });
});

document.getElementById("later-button").addEventListener("click", () => VesktopUpdaterNative.snoozeUpdate());
document.getElementById("ignore-button").addEventListener("click", () => {
    const confirmed = confirm(
        "هل تريد تجاهل هذا التحديث؟ لن تتلقى إشعاراً به مرة أخرى. التحديثات مهمة للأمان والاستقرار."
    );
    if (confirmed) VesktopUpdaterNative.ignoreUpdate();
});

VesktopUpdaterNative.onProgress(percent => (downloadProgress.value = percent));
VesktopUpdaterNative.onError(message => {
    updateDialog.closedBy = "any";
    errorText.textContent = `حدث خطأ أثناء تنزيل التحديث: ${message}`;
    installingDialog.close();
    updateDialog.classList.remove("hidden");
});
