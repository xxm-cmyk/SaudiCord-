/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading, Paragraph } from "@vencord/types/components";
import { Margins } from "@vencord/types/utils";
import { Select } from "@vencord/types/webpack/common";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./Settings";

export const WindowsTransparencyControls: SettingsComponent = ({ settings }) => {
    if (!VesktopNative.app.supportsWindowsTransparency()) return null;

    return (
        <div>
            <Heading tag="h5" className={Margins.bottom8}>
                خيارات الشفافية
            </Heading>
            <Paragraph className={Margins.bottom8}>
                يتطلب إعادة تشغيل التطبيق واستخدام سمة تدعم الشفافية.
            </Paragraph>

            <SimpleErrorBoundary>
                <Select
                    placeholder="بدون"
                    options={[
                        {
                            label: "بدون",
                            value: "none",
                            default: true
                        },
                        {
                            label: "Mica (دمج سمة النظام وخلفية سطح المكتب)",
                            value: "mica"
                        },
                        { label: "Tabbed (نسخة Mica بتلوين أقوى للخلفية)", value: "tabbed" },
                        {
                            label: "Acrylic (تمويه النافذة خلف سعودي كورد)",
                            value: "acrylic"
                        }
                    ]}
                    closeOnSelect={true}
                    select={v => (settings.transparencyOption = v)}
                    isSelected={v => v === settings.transparencyOption}
                    serialize={s => s}
                />
            </SimpleErrorBoundary>
        </div>
    );
};
