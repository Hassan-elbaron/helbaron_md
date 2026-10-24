import fs from "node:fs";

const marker = "<!-- helbaron-macos-unsigned-notice -->";
const notesPath = process.env.RELEASE_NOTES_PATH || "release-notes.md";

if (!fs.existsSync(notesPath)) {
  throw new Error(`Release notes file not found: ${notesPath}`);
}

const notes = fs.readFileSync(notesPath, "utf8");

if (notes.includes(marker)) {
  process.exit(0);
}

const notice = `${marker}
## macOS Notice

Helbaron's macOS build is currently unsigned. If macOS blocks the first launch, Control-click \`Helbaron.app\`, choose \`Open\`, then confirm \`Open\`.

If macOS says the app is damaged, drag \`Helbaron.app\` to \`/Applications\`, then run \`Helbaron-macOS-Open-Anyway.command\` inside the macOS DMG. The helper only removes the quarantine flag from \`/Applications/Helbaron.app\`.

`;

fs.writeFileSync(notesPath, `${notice}${notes}`);
