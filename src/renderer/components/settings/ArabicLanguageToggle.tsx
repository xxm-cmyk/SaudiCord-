/*
 * SaudiCord Arabic language controls.
 * Original implementation maintained by SaudiCord contributors.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, FormSwitch, Text } from "@vencord/types/components";
import { showToast, UserSettingsActionCreators } from "@vencord/types/webpack/common";
import { useState } from "@vencord/types/webpack/common";

import { SettingsComponent } from "./Settings";

interface ArabicCoverage {
    liveKeys: number;
    translated: number;
    untranslated: Record<string, string>;
}

function getCoverage(): ArabicCoverage {
    try {
        const read = (window as Window & { SaudiCordArabicCoverage?: () => ArabicCoverage }).SaudiCordArabicCoverage;
        return read?.() ?? { liveKeys: 0, translated: 0, untranslated: {} };
    } catch {
        return { liveKeys: 0, translated: 0, untranslated: {} };
    }
}

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
    const [coverage, setCoverage] = useState<ArabicCoverage>(getCoverage);

    const missing = Object.keys(coverage.untranslated).length;

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

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <Text>
                    تغطية التعريب للنصوص التي حمّلها Discord في هذه الجلسة:
                    {" "}{coverage.translated.toLocaleString()} من {coverage.liveKeys.toLocaleString()}.
                </Text>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button variant="secondary" onClick={() => setCoverage(getCoverage())}>
                        تحديث الإحصائية
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={missing === 0}
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(JSON.stringify(coverage.untranslated, null, 2));
                                showToast({
                                    text: `تم نسخ ${missing.toLocaleString()} نصاً غير معرّب.`,
                                    variant: "success"
                                });
                            } catch {
                                showToast({
                                    text: "تعذر نسخ القائمة. حاول مرة أخرى.",
                                    variant: "critical"
                                });
                            }
                        }}
                    >
                        نسخ النصوص غير المعرّبة ({missing.toLocaleString()})
                    </Button>
                </div>
                <div style={{ opacity: 0.65, fontSize: 12 }}>
                    الإحصائية تتحدث مع فتح الأقسام داخل Discord؛ النصوص التي لم تُحمّل بعد لا تدخل في الحساب.
                </div>
            </div>
        </div>
    );
};
