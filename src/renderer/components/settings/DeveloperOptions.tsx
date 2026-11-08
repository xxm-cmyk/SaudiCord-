/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, Heading, Paragraph, TextButton } from "@vencord/types/components";
import { Margins, promptToRestart, useForceUpdater } from "@vencord/types/utils";
import { Modal, openModal, showToast } from "@vencord/types/webpack/common";
import { Settings } from "shared/settings";

import { cl, SettingsComponent } from "./Settings";

export const DeveloperOptionsButton: SettingsComponent = ({ settings }) => {
    return <Button onClick={() => openDeveloperOptionsModal(settings)}>فتح إعدادات المطور</Button>;
};

function openDeveloperOptionsModal(settings: Settings) {
    openModal(props => (
        <Modal {...props} size="lg" title="خيارات مطور سعودي كورد">
            <Heading tag="h4">موقع ملفات Vencord</Heading>
            <VencordLocationPicker settings={settings} />

            <Heading tag="h4" className={Margins.top16}>
                استكشاف الأخطاء
            </Heading>
            <div className={cl("button-grid")}>
                <Button onClick={() => VesktopNative.debug.launchGpu()}>Open chrome://gpu</Button>
                <Button onClick={() => VesktopNative.debug.launchWebrtcInternals()}>
                    Open chrome://webrtc-internals
                </Button>
            </div>
        </Modal>
    ));
}

const VencordLocationPicker: SettingsComponent = () => {
    const forceUpdate = useForceUpdater();
    const usingCustomVencordDir = VesktopNative.fileManager.isUsingCustomVencordDir();

    return (
        <>
            <Paragraph>
                Vencord files are loaded from{" "}
                {usingCustomVencordDir ? (
                    <TextButton
                        variant="link"
                        onClick={e => {
                            e.preventDefault();
                            VesktopNative.fileManager.showCustomVencordDir();
                        }}
                    >
                        مجلد مخصص
                    </TextButton>
                ) : (
                    "المجلد الافتراضي"
                )}
            </Paragraph>
            <div className={cl("button-grid")}>
                <Button
                    onClick={async () => {
                        const choice = await VesktopNative.fileManager.selectVencordDir();
                        switch (choice) {
                            case "cancelled":
                                break;
                            case "ok":
                                promptToRestart("relaunch");
                                break;
                            case "invalid":
                                showToast({
                                    text: "المجلد المحدد لا يحتوي على تثبيت Vencord صالح. تأكد من اختيار مجلد dist.",
                                    variant: "critical"
                                });
                                break;
                        }
                        forceUpdate();
                    }}
                >
                    تغيير
                </Button>
                <Button
                    variant="dangerPrimary"
                    onClick={async () => {
                        await VesktopNative.fileManager.selectVencordDir(null);
                        forceUpdate();
                    }}
                >
                    إعادة ضبط
                </Button>
            </div>
        </>
    );
};
