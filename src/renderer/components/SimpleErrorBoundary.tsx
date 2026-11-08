/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Card, ErrorBoundary, Heading, Paragraph, TextButton } from "@vencord/types/components";
import type { PropsWithChildren } from "react";

function openSupportChannel() {
    window.open("https://github.com/xxm-cmyk/SaudiCord-/issues", "_blank");
}

function Fallback() {
    return (
        <Card variant="danger">
            <Heading tag="h4">حدث خطأ غير متوقع.</Heading>
            <Paragraph>
                تأكد من تحديث سعودي كورد وVencord. يمكنك الإبلاغ عن المشكلة عبر{" "}
                <TextButton variant="link" onClick={openSupportChannel}>
                    صفحة المشكلات
                </TextButton>
            </Paragraph>
        </Card>
    );
}

export function SimpleErrorBoundary({ children }: PropsWithChildren<{}>) {
    return <ErrorBoundary fallback={Fallback}>{children}</ErrorBoundary>;
}
