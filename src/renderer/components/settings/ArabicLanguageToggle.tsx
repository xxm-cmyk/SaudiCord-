/*
 * SaudiCord Arabic language controls.
 * Original implementation maintained by SaudiCord contributors.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FormSwitch } from "@vencord/types/components";
import { showToast, UserSettingsActionCreators } from "@vencord/types/webpack/common";
import { useState } from "react";

import { SettingsComponent } from "./Settings";

function getCurrentLocale(): string {
    try {
        return (
            UserSettingsActionCreators.PreloadedUserSettingsActionCreators.getCurrentValue().localization.locale
                .value ?? "en-US"
        );
    } catch {
        return "en-US";
    }
}

async function updateLocale(locale: string): Promise<void> {
    await UserSettingsActionCreators.PreloadedUserSettingsActionCreators.updateAsync(
        "localization",
        (settings: any) => {
            settings.locale.value = locale;
        },
        0
    );
}

export const ArabicLanguageToggle: SettingsComponent = () => {
    const [enabled, setEnabled] = useState(() => getCurrentLocale() === "ar");
    const [pending, setPending] = useState(false);

    return (
        <div lang="ar" dir="rtl">
            <FormSwitch
                title="استخدام العربية في Discord"
                description="يحوّل لغة واجهة Discord إلى العربية. عند إيقافه تعود اللغة إلى الإنجليزية."
                value={enabled}
                disabled={pending}
                hideBorder
                onChange={async value => {
                    setPending(true);
                    try {
                        await updateLocale(value ? "ar" : "en-US");
                        setEnabled(value);
                        showToast({
                            text: value ? "تم تفعيل العربية في Discord." : "تمت إعادة Discord إلى الإنجليزية.",
                            variant: "success"
                        });
                    } catch {
                        showToast({
                            text: "تعذر تغيير اللغة. حاول مرة أخرى.",
                            variant: "critical"
                        });
                    } finally {
                        setPending(false);
                    }
                }}
            />
        </div>
    );
};
