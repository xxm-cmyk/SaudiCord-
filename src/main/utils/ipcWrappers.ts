/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ipcMain, IpcMainEvent, IpcMainInvokeEvent, WebContents, WebFrameMain } from "electron";
import { DISCORD_HOSTNAMES } from "main/constants";
import { IpcEvents, UpdaterIpcEvents } from "shared/IpcEvents";

export function validateSender(frame: WebFrameMain | null, event: string) {
    if (!frame) throw new Error(`ipc[${event}]: No sender frame`);
    if (frame !== frame.top) throw new Error(`ipc[${event}]: Subframe IPC is not allowed`);

    let url: URL;
    try {
        url = new URL(frame.url);
    } catch {
        throw new Error(`ipc[${event}]: Invalid sender URL`);
    }

    // Never trust an empty URL or an arbitrary page using the app's custom scheme.
    if (url.username || url.password || url.port) {
        throw new Error(`ipc[${event}]: Sender URL contains forbidden authority fields`);
    }

    if (url.protocol === "vesktop:") {
        if (url.hostname === "assets" || url.hostname === "static") return;
        throw new Error(`ipc[${event}]: Disallowed internal origin ${url.origin}`);
    }

    if (url.protocol !== "https:" || !DISCORD_HOSTNAMES.includes(url.hostname)) {
        throw new Error(`ipc[${event}]: Disallowed sender origin ${url.origin}`);
    }
}

export function handleSync(event: IpcEvents | UpdaterIpcEvents, cb: (e: IpcMainEvent, ...args: any[]) => any) {
    ipcMain.on(event, (e, ...args) => {
        validateSender(e.senderFrame, event);
        e.returnValue = cb(e, ...args);
    });
}

export function handle(event: IpcEvents | UpdaterIpcEvents, cb: (e: IpcMainInvokeEvent, ...args: any[]) => any) {
    ipcMain.handle(event, (e, ...args) => {
        validateSender(e.senderFrame, event);
        return cb(e, ...args);
    });
}

/**
 * Register an IPC handler that is restricted to one specific BrowserWindow.
 * This is intended for privileged auxiliary windows such as the updater.
 */
export function handleForWebContents(
    event: UpdaterIpcEvents,
    getExpectedWebContents: () => WebContents | null,
    cb: (e: IpcMainInvokeEvent, ...args: any[]) => any
) {
    ipcMain.handle(event, (e, ...args) => {
        const expected = getExpectedWebContents();
        if (!expected || e.sender !== expected || e.senderFrame !== e.sender.mainFrame) {
            throw new Error(`ipc[${event}]: Disallowed sender WebContents`);
        }

        validateSender(e.senderFrame, event);
        return cb(e, ...args);
    });
}
