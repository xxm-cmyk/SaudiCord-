/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { createHash } from "crypto";
import { mkdirSync } from "fs";
import { access, constants as FsConstants, readFile, rename, rm, writeFile } from "fs/promises";
import { join } from "path";

import { VENCORD_FILES_DIR } from "main/vencordFilesDir";

import { USER_AGENT } from "../constants";
import { downloadFile, fetchie } from "./http";

const API_BASE = "https://api.github.com";

export const FILES_TO_DOWNLOAD = [
    "vencordDesktopMain.js",
    "vencordDesktopPreload.js",
    "vencordDesktopRenderer.js",
    "vencordDesktopRenderer.css"
];

export interface ReleaseData {
    name: string;
    tag_name: string;
    html_url: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
        digest?: string | null;
    }>;
}

export async function githubGet(endpoint: string) {
    const opts: RequestInit = {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": USER_AGENT
        }
    };

    if (process.env.GITHUB_TOKEN) (opts.headers! as any).Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    return fetchie(API_BASE + endpoint, opts, { retryOnNetworkError: true });
}

export async function downloadVencordFiles() {
    const release = await githubGet("/repos/Vendicated/Vencord/releases/latest");
    const releaseData: ReleaseData = await release.json();
    const files = releaseData.assets.filter(({ name }) => FILES_TO_DOWNLOAD.includes(name));

    if (files.length !== FILES_TO_DOWNLOAD.length) {
        throw new Error("The latest Vencord release is missing one or more required desktop files");
    }

    for (const file of files) {
        if (!file.digest || !/^sha256:[a-f0-9]{64}$/i.test(file.digest)) {
            throw new Error(`The Vencord release does not provide a valid SHA-256 digest for ${file.name}`);
        }

        const url = new URL(file.browser_download_url);
        if (
            url.protocol !== "https:" ||
            url.hostname !== "github.com" ||
            !url.pathname.startsWith("/Vendicated/Vencord/releases/download/")
        ) {
            throw new Error(`Refusing an unexpected Vencord asset URL for ${file.name}`);
        }
    }

    mkdirSync(VENCORD_FILES_DIR, { recursive: true });

    // Download into temporary files, then verify every digest before replacing the active install.
    const temporaryFiles = files.map(({ name }) => join(VENCORD_FILES_DIR, name + ".tmp"));

    try {
        const results = await Promise.allSettled(
            files.map(({ name, browser_download_url }) =>
                downloadFile(
                    browser_download_url,
                    join(VENCORD_FILES_DIR, name + ".tmp"),
                    {},
                    { retryOnNetworkError: true }
                )
            )
        );
        const failed = results.find(r => r.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;

        await Promise.all(
            files.map(async ({ name, digest }) => {
                const filePath = join(VENCORD_FILES_DIR, name + ".tmp");
                const contents = await readFile(filePath);
                const actualDigest = createHash("sha256").update(contents).digest("hex");
                const expectedDigest = digest!.slice("sha256:".length).toLowerCase();

                if (actualDigest !== expectedDigest) {
                    throw new Error(`SHA-256 verification failed for ${name}`);
                }
            })
        );

        await Promise.all(
            files.map(({ name }) => rename(join(VENCORD_FILES_DIR, name + ".tmp"), join(VENCORD_FILES_DIR, name)))
        );
        await writeFile(join(VENCORD_FILES_DIR, "package.json"), "{}");
    } catch (error) {
        await Promise.all(temporaryFiles.map(file => rm(file, { force: true }).catch(() => {})));
        throw error;
    }
}

const existsAsync = (path: string) =>
    access(path, FsConstants.F_OK)
        .then(() => true)
        .catch(() => false);

export async function isValidVencordInstall(dir: string) {
    const results = await Promise.all(FILES_TO_DOWNLOAD.map(f => existsAsync(join(dir, f))));
    return !results.includes(false);
}
