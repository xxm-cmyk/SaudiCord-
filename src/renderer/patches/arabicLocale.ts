/*
 * SaudiCord Arabic locale integration.
 * Original implementation maintained by SaudiCord contributors.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ARABIC_TRANSLATIONS } from "../arabicTranslations";
import { addPatch } from "./shared";

type MessageTable = Record<string, unknown>;

const RTL_START = "\u2067";
const RTL_END = "\u2069";
const PLACEHOLDER = /\{([A-Za-z0-9_]+)\}/g;

function isSimpleArgument(value: unknown): value is readonly [number, string, ...unknown[]] {
    return (
        Array.isArray(value) &&
        typeof value[0] === "number" &&
        [1, 2, 3, 4].includes(value[0]) &&
        typeof value[1] === "string"
    );
}

function toTemplate(parts: readonly unknown[]): { template: string; arguments: Map<string, readonly unknown[]> } | null {
    let template = "";
    const argumentsMap = new Map<string, readonly unknown[]>();

    for (const part of parts) {
        if (typeof part === "string") {
            template += part;
        } else if (isSimpleArgument(part)) {
            const name = part[1];
            argumentsMap.set(name, part);
            template += `{${name}}`;
        } else {
            // Leave plural/select branches and rich Discord components untouched.
            return null;
        }
    }

    return { template, arguments: argumentsMap };
}

function fromTemplate(
    translated: string,
    originalArguments: Map<string, readonly unknown[]>
): readonly unknown[] | null {
    const result: unknown[] = [];
    const used = new Set<string>();
    let cursor = 0;

    for (const match of translated.matchAll(PLACEHOLDER)) {
        const name = match[1];
        const argument = originalArguments.get(name);
        if (!argument) return null;

        const index = match.index ?? 0;
        if (index > cursor) result.push(translated.slice(cursor, index));
        result.push(argument);
        used.add(name);
        cursor = index + match[0].length;
    }

    if (cursor < translated.length) result.push(translated.slice(cursor));
    if (used.size !== originalArguments.size) return null;

    return result;
}

function containsArabic(value: unknown): boolean {
    if (typeof value === "string") return /[\\u0600-\\u06FF]/.test(value);
    if (Array.isArray(value)) return value.some(containsArabic);
    if (value && typeof value === "object") return Object.values(value).some(containsArabic);
    return false;
}

function isolateRtl(value: unknown): unknown {
    if (!containsArabic(value)) return value;

    if (typeof value === "string") {
        return value.startsWith(RTL_START) && value.endsWith(RTL_END)
            ? value
            : `${RTL_START}${value}${RTL_END}`;
    }

    if (Array.isArray(value)) {
        if (value[0] === RTL_START && value[value.length - 1] === RTL_END) return value;
        return [RTL_START, ...value, RTL_END];
    }

    return value;
}

/**
 * Translate exact reviewed templates at every level of Discord's message AST.
 * Nested plural/select/rich-text branches are traversed instead of being
 * abandoned when a complex argument is encountered.
 */
function translateValue(value: unknown): unknown {
    if (typeof value === "string") return ARABIC_TRANSLATIONS[value] ?? value;

    if (Array.isArray(value)) {
        const parsed = toTemplate(value);
        if (parsed) {
            const translated = ARABIC_TRANSLATIONS[parsed.template];
            if (translated) return fromTemplate(translated, parsed.arguments) ?? value;
        }

        let changed = false;
        const result = value.map(part => {
            const next = translateValue(part);
            if (next !== part) changed = true;
            return next;
        });
        return changed ? result : value;
    }

    if (value && typeof value === "object") {
        let changed = false;
        const result: Record<string, unknown> = {};
        for (const [key, part] of Object.entries(value)) {
            const next = translateValue(part);
            if (next !== part) changed = true;
            result[key] = next;
        }
        return changed ? result : value;
    }

    return value;
}

/**
 * Convert only exact, reviewed message matches. Unknown messages and complex
 * ICU structures remain untouched rather than risking broken formatting.
 */
function translateMessageTable(input: unknown): MessageTable {
    if (input === null || typeof input !== "object") return input as MessageTable;

    const translated: MessageTable = {};
    for (const [key, value] of Object.entries(input)) {
        const template = messageTemplate(value);
        if (template !== null) seenMessages.set(key, template);

        const translatedValue = translateValue(value);
        const next = isolateRtl(translatedValue);
        if (next !== value) translatedMessages.add(key);
        translated[key] = next;
    }
    return translated;
}

const seenMessages = new Map<string, string>();
const translatedMessages = new Set<string>();

function messageTemplate(value: unknown): string | null {
    if (typeof value === "string") return value;
    if (!Array.isArray(value)) return null;
    return toTemplate(value)?.template ?? null;
}

const bridge = window as Window & {
    SaudiCordTranslateMessages?: (table: unknown) => MessageTable;
    SaudiCordArabicCoverage?: () => {
        liveKeys: number;
        translated: number;
        untranslated: Record<string, string>;
    };
};

bridge.SaudiCordTranslateMessages = translateMessageTable;
bridge.SaudiCordArabicCoverage = () => {
    const untranslated: Record<string, string> = {};
    for (const [key, template] of seenMessages) {
        if (!translatedMessages.has(key)) untranslated[key] = template;
    }
    return {
        liveKeys: seenMessages.size,
        translated: translatedMessages.size,
        untranslated
    };
};

const messageLoaderPattern =
    /("en-US":\(\)=>([A-Za-z_$][\w$]*)\.e\("(\d+)"\)\.then\(\2\.bind\(\2,(\d+)\)\))\}/g;

addPatch({
    patches: [
        {
            // Discord's Arabic locale is present but disabled in its locale catalog.
            find: '"englishName":"Arabic"',
            all: true,
            noWarn: true,
            replacement: {
                match: /("code":"ar"(?:,"[A-Za-z]+":"[^"]*")*,"enabled":)false/g,
                replace: "$1true"
            }
        },
        {
            // Add a local Arabic loader beside the existing English message loader.
            find: "makeMessagesProxy",
            all: true,
            noWarn: true,
            replacement: {
                match: messageLoaderPattern,
                replace:
                    '$1,"ar":()=>{$self.ensureTranslator();return $2.e("$3").then($2.bind($2,$4)).then(m=>({default:window.SaudiCordTranslateMessages(m.default)}))}'
            }
        }
    ],
    ensureTranslator() {
        if (typeof bridge.SaudiCordTranslateMessages !== "function") {
            bridge.SaudiCordTranslateMessages = translateMessageTable;
        }
        if (typeof document !== "undefined") {
            document.documentElement.lang = "ar";
            document.documentElement.dir = "rtl";
            document.body?.setAttribute("dir", "rtl");
        }
    }
});
