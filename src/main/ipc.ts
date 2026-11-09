/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

if (process.platform === "linux") import("./venmic");

import { readFileSync, watch } from "fs";
import { readFile, stat } from "fs/promises";
import { release } from "os";
import { join } from "path";

import { app, BrowserWindow, clipboard, ClipboardItem, dialog, IpcMainInvokeEvent, session, shell } from "electron";

import { IpcEvents } from "../shared/IpcEvents";
import { setBadgeCount } from "./appBadge";
import { autoStart } from "./autoStart";
import { enableHardwareAcceleration } from "./main";
import { mainWin } from "./mainWindow";
import { Settings, State } from "./settings";
import { handle, handleSync } from "./utils/ipcWrappers";
import { PopoutWindows } from "./utils/popout";
import { relaunch } from "./utils/relaunch";
import { showWindow } from "./utils/showWindow";
import { isValidVencordInstall } from "./utils/vencordLoader";
import { VENCORD_FILES_DIR } from "./vencordFilesDir";

handleSync(IpcEvents.GET_VENCORD_PRELOAD_SCRIPT, () =>
    readFileSync(join(VENCORD_FILES_DIR, "vencordDesktopPreload.js"), "utf-8")
);
handleSync(IpcEvents.GET_VENCORD_RENDERER_SCRIPT, () =>
    readFileSync(join(VENCORD_FILES_DIR, "vencordDesktopRenderer.js"), "utf-8")
);

const VESKTOP_RENDERER_JS_PATH = join(__dirname, "renderer.js");
const VESKTOP_RENDERER_CSS_PATH = join(__dirname, "renderer.css");
handleSync(IpcEvents.GET_VESKTOP_RENDERER_SCRIPT, () => readFileSync(VESKTOP_RENDERER_JS_PATH, "utf-8"));
handle(IpcEvents.GET_VESKTOP_RENDERER_CSS, () => readFile(VESKTOP_RENDERER_CSS_PATH, "utf-8"));

if (IS_DEV) {
    watch(VESKTOP_RENDERER_CSS_PATH, { persistent: false }, async () => {
        mainWin?.webContents.postMessage(
            IpcEvents.VESKTOP_RENDERER_CSS_UPDATE,
            await readFile(VESKTOP_RENDERER_CSS_PATH, "utf-8")
        );
    });
}

handleSync(IpcEvents.GET_SETTINGS, () => Settings.plain);
handleSync(IpcEvents.GET_VERSION, () => app.getVersion());
handleSync(IpcEvents.GET_ENABLE_HARDWARE_ACCELERATION, () => enableHardwareAcceleration);

handleSync(
    IpcEvents.SUPPORTS_WINDOWS_TRANSPARENCY,
    () => process.platform === "win32" && Number(release().split(".").pop()) >= 22621
);

handleSync(IpcEvents.AUTOSTART_ENABLED, () => autoStart.isEnabled());
handle(IpcEvents.ENABLE_AUTOSTART, autoStart.enable);
handle(IpcEvents.DISABLE_AUTOSTART, autoStart.disable);

handle(IpcEvents.SET_SETTINGS, (_, settings: typeof Settings.store, path?: string) => {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
        throw new TypeError("Invalid settings payload");
    }

    if (
        path !== undefined &&
        (typeof path !== "string" ||
            path.length > 256 ||
            path.split(".").some(part => !part || ["__proto__", "prototype", "constructor"].includes(part)))
    ) {
        throw new TypeError("Invalid settings notification path");
    }

    Settings.setData(settings, path);
});

handle(IpcEvents.RELAUNCH, relaunch);

handleSync(IpcEvents.IS_USING_CUSTOM_VENCORD_DIR, () => !!State.store.vencordDir);
handle(IpcEvents.SHOW_CUSTOM_VENCORD_DIR, async () => {
    const { vencordDir } = State.store;
    if (!vencordDir) return;

    const stats = await stat(vencordDir);
    if (!stats.isDirectory()) return;

    shell.openPath(vencordDir);
});

function getWindow(e: IpcMainInvokeEvent, key?: string) {
    const senderWindow = BrowserWindow.fromWebContents(e.sender);
    if (!senderWindow || senderWindow.isDestroyed()) {
        throw new Error("IPC sender does not belong to an active application window");
    }

    if (!key) return senderWindow;

    const popout = PopoutWindows.get(key);
    if (!popout || popout.isDestroyed() || popout.webContents !== e.sender) {
        throw new Error("IPC sender is not the requested popout window");
    }

    return popout;
}

handle(IpcEvents.FOCUS, () => {
    showWindow(mainWin);
    mainWin.setSkipTaskbar(false);
});

handle(IpcEvents.CLOSE, (e, key?: string) => {
    getWindow(e, key).close();
});

handle(IpcEvents.MINIMIZE, (e, key?: string) => {
    getWindow(e, key).minimize();
});

handle(IpcEvents.MAXIMIZE, (e, key?: string) => {
    const win = getWindow(e, key);
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

handleSync(IpcEvents.SPELLCHECK_GET_AVAILABLE_LANGUAGES, e => {
    e.returnValue = session.defaultSession.availableSpellCheckerLanguages;
});

handle(IpcEvents.SPELLCHECK_REPLACE_MISSPELLING, (e, word: string) => {
    e.sender.replaceMisspelling(word);
});

handle(IpcEvents.SPELLCHECK_ADD_TO_DICTIONARY, (e, word: string) => {
    e.sender.session.addWordToSpellCheckerDictionary(word);
});

handle(IpcEvents.SELECT_VENCORD_DIR, async (_e, value?: null) => {
    if (value === null) {
        delete State.store.vencordDir;
        return "ok";
    }

    const res = await dialog.showOpenDialog(mainWin!, {
        properties: ["openDirectory"]
    });
    if (!res.filePaths.length) return "cancelled";

    const dir = res.filePaths[0];
    if (!(await isValidVencordInstall(dir))) return "invalid";

    State.store.vencordDir = dir;

    return "ok";
});

handle(IpcEvents.SET_BADGE_COUNT, (_, count: number) => {
    if (!Number.isInteger(count) || count < -1 || count > 9999) {
        throw new TypeError("Invalid notification badge count");
    }

    setBadgeCount(count);
});

handle(IpcEvents.FLASH_FRAME, (_, flag: boolean) => {
    if (typeof flag !== "boolean") throw new TypeError("Invalid taskbar flash state");
    if (!mainWin || mainWin.isDestroyed() || (flag && mainWin.isFocused())) return;
    mainWin.flashFrame(flag);
});

handle(IpcEvents.CLIPBOARD_COPY_IMAGE, async (_, buf: ArrayBuffer | Uint8Array, _src: string) => {
    const { byteLength } = buf;
    if (byteLength < 8 || byteLength > 20 * 1024 * 1024) {
        throw new TypeError("Invalid clipboard image size");
    }

    const bytes = buf instanceof ArrayBuffer ? Buffer.from(buf) : Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!bytes.subarray(0, pngSignature.length).equals(pngSignature)) {
        throw new TypeError("Clipboard image must be a PNG");
    }

    const imageData = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const dataUrl = `data:image/png;base64,${bytes.toString("base64")}`;

    clipboard.write([
        new ClipboardItem({
            "text/html": `<img src="${dataUrl}" />`,
            "image/png": new Blob([imageData], { type: "image/png" })
        })
    ]);
});

function openDebugPage(page: string) {
    const win = new BrowserWindow({
        autoHideMenuBar: true
    });

    win.loadURL(page);
}

handle(IpcEvents.DEBUG_LAUNCH_GPU, () => openDebugPage("chrome://gpu"));
handle(IpcEvents.DEBUG_LAUNCH_WEBRTC_INTERNALS, () => openDebugPage("chrome://webrtc-internals"));
