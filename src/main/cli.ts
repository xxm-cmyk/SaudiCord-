/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { basename } from "path";
import { parseArgs, ParseArgsOptionDescriptor } from "util";

import { app } from "electron";
import { stripIndent } from "shared/utils/text";

type Option = ParseArgsOptionDescriptor & {
    description: string;
    hidden?: boolean;
    options?: string[];
    argumentName?: string;
};

const options = {
    "start-minimized": {
        default: false,
        type: "boolean",
        short: "m",
        description: "تشغيل التطبيق في وضع مصغّر إلى شريط النظام"
    },
    version: {
        type: "boolean",
        short: "v",
        description: "عرض إصدار التطبيق ثم الخروج"
    },
    help: {
        type: "boolean",
        short: "h",
        description: "عرض المساعدة ثم الخروج"
    },
    "user-agent": {
        type: "string",
        argumentName: "ua",
        description: "تعيين User-Agent مخصص. قد يؤدي إلى تفعيل أنظمة مكافحة الإزعاج أو تعطيل المحادثة الصوتية"
    },
    "user-agent-os": {
        type: "string",
        description: "تعيين نظام تشغيل محدد في User-Agent",
        options: ["windows", "linux", "darwin"]
    },
    repair: {
        type: "boolean",
        description: "إصلاح التطبيق عبر إعادة تنزيل أحدث ملفات Vencord"
    }
} satisfies Record<string, Option>;

// خيارات إضافية تظهر في شاشة المساعدة فقط
const extraOptions = {
    "enable-features": {
        type: "string",
        description: "تفعيل ميزات Chromium محددة",
        argumentName: "feature1,feature2,…"
    },
    "disable-features": {
        type: "string",
        description: "تعطيل ميزات Chromium محددة",
        argumentName: "feature1,feature2,…"
    },
    "ozone-platform": {
        hidden: process.platform !== "linux",
        type: "string",
        description: "اختيار تشغيل سعودي كورد عبر Wayland أو X11 (XWayland)",
        options: ["x11", "wayland"]
    }
} satisfies Record<string, Option>;

const args = basename(process.argv[0]).toLowerCase().startsWith("electron")
    ? process.argv.slice(2)
    : process.argv.slice(1);

export const CommandLine = parseArgs({
    args,
    options,
    strict: false as true, // we manually check later, so cast to true to get better types
    allowPositionals: true
});

export function checkCommandLineForHelpOrVersion() {
    const { help, version } = CommandLine.values;

    if (version) {
        console.log(`SaudiCord v${app.getVersion()}`);
        app.exit(0);
    }

    if (help) {
        const base = stripIndent`
            سعودي كورد v${app.getVersion()}

            طريقة الاستخدام: ${basename(process.execPath)} [options] [url]

            خيارات Electron:
              راجع <https://www.electronjs.org/docs/latest/api/command-line-switches#electron-cli-flags>

            خيارات Chromium:
              راجع <https://peter.sh/experiments/chromium-command-line-switches> — بعض الخيارات فقط تعمل

            خيارات سعودي كورد:
        `;

        const optionLines = Object.entries(options)
            .sort(([a], [b]) => a.localeCompare(b))
            .concat(Object.entries(extraOptions))
            .filter(([, opt]) => !("hidden" in opt && opt.hidden))
            .map(([name, opt]) => {
                const flags = [
                    "short" in opt && `-${opt.short}`,
                    `--${name}`,
                    opt.type !== "boolean" &&
                        ("options" in opt ? `<${opt.options.join(" | ")}>` : `<${opt.argumentName ?? opt.type}>`)
                ]
                    .filter(Boolean)
                    .join(" ");

                return [flags, opt.description];
            });

        const padding = optionLines.reduce((max, [flags]) => Math.max(max, flags.length), 0) + 4;

        const optionsHelp = optionLines
            .map(([flags, description]) => `  ${flags.padEnd(padding, " ")}${description}`)
            .join("\n");

        console.log(base + "\n" + optionsHelp);
        app.exit(0);
    }

    for (const [name, def] of Object.entries(options)) {
        const value = CommandLine.values[name];
        if (value == null) continue;

        if (typeof value !== def.type) {
            console.error(`خيارات غير صالحة. ${def.type === "boolean" ? "لا يجب إضافة قيمة" : "يجب إضافة قيمة"} للخيار --${name}`);
            app.exit(1);
        }

        if ("options" in def && !def.options?.includes(value as string)) {
            console.error(`قيمة غير صالحة للخيار --${name}: ${value}\nالقيم المتاحة: ${def.options.join(", ")}`);
            app.exit(1);
        }
    }
}

checkCommandLineForHelpOrVersion();
