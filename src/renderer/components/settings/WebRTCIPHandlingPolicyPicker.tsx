/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Margins, Paragraph, Heading } from "@vencord/types/components";
import { Select } from "@vencord/types/webpack/common";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./Settings";

export const WebRTCIPHandlingPolicyPicker: SettingsComponent = ({ settings }) => {
    return (
        <SimpleErrorBoundary>
            <div>
                <Heading tag="h5" className={Margins.bottom8}>
                    سياسة التعامل مع عنوان IP في WebRTC
                </Heading>
                <Paragraph className={Margins.bottom8}>
                    قد يساعد تغيير هذا الخيار في حل مشكلات الاتصال الصوتي في بعض الشبكات، خصوصاً عند استخدام VPN مثل
                    Tailscale.
                </Paragraph>
                <Select
                    placeholder="افتراضي"
                    options={[
                        { label: "افتراضي", value: "default", default: true },
                        { label: "الواجهة العامة الافتراضية فقط", value: "default_public_interface_only" },

                        {
                            label: "الواجهات العامة والخاصة الافتراضية",
                            value: "default_public_and_private_interfaces"
                        },
                        { label: "تعطيل UDP غير المار عبر وسيط", value: "disable_non_proxied_udp" }
                    ]}
                    closeOnSelect={true}
                    select={v => (settings.webRTCIPHandlingPolicy = v)}
                    isSelected={v => v === settings.webRTCIPHandlingPolicy}
                    serialize={s => s}
                />
            </div>
        </SimpleErrorBoundary>
    );
};
