/*
 * Validate SaudiCord's reviewed Arabic message dictionary.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ARABIC_TRANSLATIONS } from "../../src/renderer/arabicTranslations";

const PLACEHOLDER = /\{([A-Za-z0-9_]+)\}/g;
const ARABIC = /[\u0600-\u06FF]/;

function placeholders(value: string): string[] {
    return [...value.matchAll(PLACEHOLDER)].map(match => match[1]).sort();
}

const errors: string[] = [];

for (const [source, translated] of Object.entries(ARABIC_TRANSLATIONS)) {
    if (!source.trim()) errors.push("An English source key is empty.");
    if (!translated.trim()) errors.push(`Empty Arabic translation for: ${source}`);
    if (!ARABIC.test(translated)) errors.push(`Translation has no Arabic characters: ${source}`);

    const sourceArgs = placeholders(source);
    const translatedArgs = placeholders(translated);

    if (sourceArgs.join("\0") !== translatedArgs.join("\0")) {
        errors.push(
            `Placeholder mismatch for "${source}": expected [${sourceArgs.join(", ")}], got [${translatedArgs.join(", ")}]`
        );
    }
}

if (errors.length) {
    console.error("SaudiCord Arabic translation validation failed:");
    for (const error of errors) console.error(` - ${error}`);
    process.exitCode = 1;
} else {
    console.log(`Validated ${Object.keys(ARABIC_TRANSLATIONS).length} Arabic translations.`);
}
