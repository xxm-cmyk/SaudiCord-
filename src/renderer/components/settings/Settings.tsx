/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./settings.css";
import { classNameFactory } from "@vencord/types/api/Styles";
import { Divider, ErrorBoundary, Text } from "@vencord/types/components";
import { ComponentType } from "react";
import { WebRTCIPHandlingPolicyPicker } from "renderer/components/settings/WebRTCIPHandlingPolicyPicker";
import { getValueAndOnChange, Settings, useSettings } from "renderer/settings";
import { isMac } from "renderer/utils";

import { AutoStartToggle } from "./AutoStartToggle";
import { DeveloperOptionsButton } from "./DeveloperOptions";
import { DiscordBranchPicker } from "./DiscordBranchPicker";
import { NotificationBadgeToggle } from "./NotificationBadgeToggle";
import { OutdatedVesktopWarning } from "./OutdatedVesktopWarning";
import { UserAssetsButton } from "./UserAssets";
import { VesktopSettingsSwitch } from "./VesktopSettingsSwitch";
import { WindowsTransparencyControls } from "./WindowsTransparencyControls";

interface BooleanSetting {
    key: keyof typeof Settings.store;
    title: string;
    description: string;
    disabled?(): boolean;
    invisible?(): boolean;
}

export const cl = classNameFactory("vcd-settings-");

export type SettingsComponent = ComponentType<{ settings: typeof Settings.store }>;

const SettingsOptions: Record<string, Array<BooleanSetting | SettingsComponent>> = {
    "فرع Discord": [DiscordBranchPicker],
    "بدء التشغيل والأداء": [
        AutoStartToggle,
        {
            key: "hardwareAcceleration",
            title: "تسريع الأجهزة",
            description: "تفعيل تسريع الأجهزة"
        },
        {
            key: "hardwareVideoAcceleration",
            title: "فك ترميز الفيديو عبر بطاقة الرسوميات",
            description:
                "استخدام بطاقة الرسوميات لفك ترميز الفيديو، وقد يحسن الأداء لكنه قد يسبب مشكلات رسومية.",
            disabled: () => !Settings.store.hardwareAcceleration
        },
        {
            key: "hardwareVideoEncoding",
            title: "ترميز الفيديو عبر بطاقة الرسوميات",
            description:
                "استخدام بطاقة الرسوميات لترميز مشاركة الشاشة وتقليل استهلاك المعالج، وقد لا يعمل مع بعض التعريفات.",
            disabled: () => !Settings.store.hardwareAcceleration
        }
    ],
    "واجهة المستخدم": [
        {
            key: "nativeTitleBar",
            title: "شريط عنوان النظام",
            description: "إظهار شريط عنوان النظام بدلاً من شريط Discord المخصص. يتطلب إعادة تشغيل التطبيق."
        },
        {
            key: "staticTitle",
            title: "عنوان ثابت",
            description: "إظهار اسم سعودي كورد في عنوان النافذة بدلاً من اسم الصفحة الحالية."
        },
        {
            key: "enableMenu",
            title: "إظهار شريط القوائم",
            description: "إظهار قائمة التطبيق. اضغط ALT لإظهارها أو إخفائها.",
            disabled: () => !Settings.store.nativeTitleBar
        },
        {
            key: "enableShadow",
            title: "ظل النافذة",
            description: "إظهار ظل حول النافذة. يتطلب إعادة التشغيل.",
            disabled: () => Settings.store.nativeTitleBar
        },
        {
            key: "enableRoundedCorners",
            title: "زوايا مستديرة",
            description: "تدوير زوايا النافذة. يتطلب إعادة التشغيل.",
            disabled: () => Settings.store.nativeTitleBar
        },
        {
            key: "enableSplashScreen",
            title: "شاشة البداية",
            description:
                "إظهار شاشة البداية أثناء تشغيل سعودي كورد. عند تعطيلها ستظهر النافذة الرئيسية قبل اكتمال التحميل."
        },
        {
            key: "splashTheming",
            title: "تناسق ألوان شاشة البداية",
            description: "تكييف ألوان شاشة البداية مع السمة المستخدمة."
        },
        WindowsTransparencyControls,
        UserAssetsButton
    ],
    السلوك: [
        {
            key: "tray",
            title: "أيقونة شريط النظام",
            description: "إضافة أيقونة سعودي كورد إلى شريط النظام.",
            invisible: () => isMac
        },
        {
            key: "minimizeToTray",
            title: "التصغير إلى شريط النظام",
            description: "تصغير سعودي كورد إلى شريط النظام عند الضغط على زر الإغلاق.",
            invisible: () => isMac,
            disabled: () => !Settings.store.tray
        },
        {
            key: "clickTrayToShowHide",
            title: "إظهار أو إخفاء التطبيق بالنقر",
            description: "النقر على أيقونة شريط النظام يبدّل ظهور نافذة التطبيق."
        },
        {
            key: "disableMinSize",
            title: "إلغاء الحد الأدنى لحجم النافذة",
            description: "السماح بتصغير النافذة إلى أي حجم."
        },
        {
            key: "disableSmoothScroll",
            title: "تعطيل التمرير السلس",
            description: "إيقاف تأثير التمرير السلس."
        }
    ],
    الإشعارات: [
        NotificationBadgeToggle,
        {
            key: "enableTaskbarFlashing",
            title: "وميض شريط المهام",
            description: "وميض أيقونة التطبيق في شريط المهام عند وصول إشعارات جديدة."
        }
    ],
    متفرقات: [
        {
            key: "arRPC",
            title: "الحالة والنشاط",
            description: "السماح للألعاب والتطبيقات بعرض نشاطها واكتشاف الألعاب عبر سعودي كورد."
        },

        {
            key: "openLinksWithElectron",
            title: "فتح الروابط داخل التطبيق (تجريبي)",
            description: "فتح الروابط في نافذة جديدة بدلاً من المتصفح الخارجي."
        },

        WebRTCIPHandlingPolicyPicker
    ],

    "خيارات المطور": [DeveloperOptionsButton]
};

function SettingsSections() {
    const Settings = useSettings();

    const sections = Object.entries(SettingsOptions).map(([title, settings], i, arr) => (
        <div key={title} className={cl("category")}>
            <Text size="lg" weight="semibold" tag="h3" className={cl("category-title")}>
                {title}
            </Text>

            <div className={cl("category-content")}>
                {settings.map((Setting, i) => {
                    if (typeof Setting === "function") return <Setting key={`Custom-${i}`} settings={Settings} />;

                    const { title, description, key, disabled, invisible } = Setting;
                    if (invisible?.()) return null;

                    return (
                        <VesktopSettingsSwitch
                            title={title}
                            description={description}
                            disabled={disabled?.()}
                            {...getValueAndOnChange(key)}
                            key={key}
                        />
                    );
                })}
            </div>

            {i < arr.length - 1 && <Divider className={cl("category-divider")} />}
        </div>
    ));

    return <>{sections}</>;
}

export default ErrorBoundary.wrap(
    function SettingsUI() {
        return (
            <section lang="ar" dir="rtl">
                <OutdatedVesktopWarning />
                <SettingsSections />
            </section>
        );
    },
    {
        message:
            "تعذر عرض إعدادات سعودي كورد. إذا استمرت المشكلة، استخدم خيار إصلاح Vencord من قائمة التطبيق وتأكد من تحديثه."
    }
);
