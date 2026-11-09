/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Select } from "@vencord/types/webpack/common";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./Settings";

export const DiscordBranchPicker: SettingsComponent = ({ settings }) => {
    return (
        <SimpleErrorBoundary>
            <Select
                placeholder="مستقر"
                options={[
                    { label: "مستقر", value: "stable", default: true },
                    { label: "Canary (تجريبية مبكرة)", value: "canary" },
                    { label: "نسخة الاختبار العامة (PTB)", value: "ptb" }
                ]}
                closeOnSelect={true}
                select={v => (settings.discordBranch = v)}
                isSelected={v => v === settings.discordBranch}
                serialize={s => s}
            />
        </SimpleErrorBoundary>
    );
};
