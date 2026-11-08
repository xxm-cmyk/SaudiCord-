/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { join } from "path";

import type { LinkData, Node, PatchBay as PatchBayType } from "@vencord/venmic";
import { app } from "electron";
import { IpcEvents } from "shared/IpcEvents";
import { STATIC_DIR } from "shared/paths";

import { Settings } from "./settings";
import { isScreenShareAudioActive, isScreenShareRequestActive, setScreenShareAudioActive } from "./screenShareState";
import { handle } from "./utils/ipcWrappers";

let PatchBay: typeof PatchBayType | undefined;
let patchBayInstance: PatchBayType | undefined;

let imported = false;
let initialized = false;

let hasPipewirePulse = false;
let isGlibCxxOutdated = false;

function importVenmic() {
    if (imported) {
        return;
    }

    imported = true;

    try {
        PatchBay = (require(join(STATIC_DIR, `dist/venmic-${process.arch}.node`)) as typeof import("@vencord/venmic"))
            .PatchBay;

        hasPipewirePulse = PatchBay.hasPipeWire();
    } catch (e: any) {
        console.error("Failed to import venmic", e);
        isGlibCxxOutdated = (e?.stack || e?.message || "").toLowerCase().includes("glibc");
    }
}

function obtainVenmic() {
    if (!imported) {
        importVenmic();
    }

    if (PatchBay && !initialized) {
        initialized = true;

        try {
            patchBayInstance = new PatchBay();
        } catch (e: any) {
            console.error("Failed to instantiate venmic", e);
        }
    }

    return patchBayInstance;
}

function getRendererAudioServicePid() {
    return (
        app
            .getAppMetrics()
            .find(proc => proc.name === "Audio Service")
            ?.pid?.toString() ?? "owo"
    );
}

function buildLinkData({ include, exclude }: { include?: Node[]; exclude?: Node[] }) {
    const pid = getRendererAudioServicePid();

    const { mute, ignoreDevices, ignoreInputMedia, ignoreVirtual, workaround, onlySpeakers, onlyDefaultSpeakers } =
        Settings.store.audio ?? {};

    const data: LinkData = {
        mute: mute ?? true,
        include: include ?? [],
        exclude: exclude ?? [],
        only_speakers: onlySpeakers,
        ignore_devices: ignoreDevices,
        only_default_speakers: onlyDefaultSpeakers
    };

    data.exclude.push({ "application.process.id": pid });

    if (ignoreInputMedia ?? true) {
        data.exclude.push({ "media.class": "Stream/Input/Audio" });
    }

    if (ignoreVirtual) {
        data.exclude.push({ "node.virtual": "true" });
    }

    if (workaround) {
        data.workaround = [{ "application.process.id": pid, "media.name": "RecordStream" }];
    }

    return data;
}

const FORBIDDEN_AUDIO_NODE_PROPERTIES = new Set(["__proto__", "prototype", "constructor"]);

function isValidAudioNodeList(value: unknown): value is Node[] {
    return (
        Array.isArray(value) &&
        value.length <= 128 &&
        value.every(node => {
            if (!node || typeof node !== "object" || Array.isArray(node)) return false;

            const entries = Object.entries(node);
            return (
                entries.length > 0 &&
                entries.length <= 64 &&
                entries.every(
                    ([key, fieldValue]) =>
                        /^[a-z0-9._-]{1,128}$/i.test(key) &&
                        !FORBIDDEN_AUDIO_NODE_PROPERTIES.has(key) &&
                        typeof fieldValue === "string" &&
                        fieldValue.length <= 512
                )
            );
        })
    );
}

handle(IpcEvents.VIRT_MIC_LIST, () => {
    if (!isScreenShareRequestActive()) {
        return { ok: true, targets: [], hasPipewirePulse };
    }

    const audioPid = getRendererAudioServicePid();
    const { granularSelect } = Settings.store.audio ?? {};
    const targets = obtainVenmic()
        ?.list(granularSelect ? [] : ["application.name", "node.name"])
        .filter(s => s["application.process.id"] !== audioPid);

    return targets ? { ok: true, targets, hasPipewirePulse } : { ok: false, isGlibCxxOutdated };
});

handle(IpcEvents.VIRT_MIC_START, async (_, include: Node[]) => {
    if (!isScreenShareRequestActive()) throw new Error("Audio capture requires an active screen-share request");
    if (!isValidAudioNodeList(include)) throw new TypeError("Invalid audio source selection");

    const patchBay = obtainVenmic();
    if (!patchBay) return;

    try {
        await patchBay.link(buildLinkData({ include }));
        setScreenShareAudioActive(true);
    } catch (error) {
        setScreenShareAudioActive(false);
        throw error;
    }
});

handle(IpcEvents.VIRT_MIC_START_SYSTEM, async (_, exclude: Node[]) => {
    if (!isScreenShareRequestActive()) throw new Error("Audio capture requires an active screen-share request");
    if (!isValidAudioNodeList(exclude)) throw new TypeError("Invalid audio source selection");

    const patchBay = obtainVenmic();
    if (!patchBay) return;

    try {
        await patchBay.link(buildLinkData({ exclude }));
        setScreenShareAudioActive(true);
    } catch (error) {
        setScreenShareAudioActive(false);
        throw error;
    }
});

handle(IpcEvents.VIRT_MIC_UNMUTE, async () => {
    if (!isScreenShareAudioActive()) return;
    await obtainVenmic()?.unmute();
});

handle(IpcEvents.VIRT_MIC_STOP, async () => {
    setScreenShareAudioActive(false);
    await obtainVenmic()?.unlink();
});
