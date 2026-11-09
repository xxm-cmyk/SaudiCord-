/*
 * SaudiCord virtual microphone type contracts.
 * The native venmic module is Linux-only; shared types keep cross-platform builds independent.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type Node = Record<string, string>;

export interface LinkData {
    include: Node[];
    exclude: Node[];
    only_speakers?: boolean;
    only_default_speakers?: boolean;
    ignore_devices?: boolean;
    mute?: boolean;
    workaround?: Node[];
}

export interface PatchBayInstance {
    unlink(): void;
    unmute(): void;
    list(props?: string[]): Node[];
    link(data: Partial<LinkData> & ({ include: Node[] } | { exclude: Node[] })): boolean;
}

export interface PatchBayConstructor {
    new (): PatchBayInstance;
    hasPipeWire(): boolean;
}
