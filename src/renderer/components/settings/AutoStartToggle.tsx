/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useState } from "@vencord/types/webpack/common";

import { SettingsComponent } from "./Settings";
import { VesktopSettingsSwitch } from "./VesktopSettingsSwitch";

export const AutoStartToggle: SettingsComponent = ({ settings }) => {
    const [autoStartEnabled, setAutoStartEnabled] = useState(VesktopNative.autostart.isEnabled());

    return (
        <>
            <VesktopSettingsSwitch
                title="التشغيل مع بدء النظام"
                description="تشغيل سعودي كورد تلقائياً عند بدء تشغيل الكمبيوتر"
                value={autoStartEnabled}
                onChange={async v => {
                    await VesktopNative.autostart[v ? "enable" : "disable"]();
                    setAutoStartEnabled(v);
                }}
            />

            <VesktopSettingsSwitch
                title="بدء التشغيل في وضع مصغّر"
                description={"تشغيل سعودي كورد مصغّراً عند بدء النظام"}
                value={settings.autoStartMinimized}
                onChange={v => (settings.autoStartMinimized = v)}
                disabled={!autoStartEnabled}
            />
        </>
    );
};
