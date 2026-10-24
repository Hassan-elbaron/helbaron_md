const englishWelcomeMarkdown = `# Welcome to Helbaron

Helbaron is becoming a quiet, local-first Markdown editor with AI available only when you ask for it.

## Today

Every surface should disappear into the writing. Open a file, edit the page, save the draft.

> AI is a writing instrument here, not a second application competing for attention.

## Next

- Keep Markdown editing fast, local, and extensible
- Keep the default view as a single document
- Reveal AI actions only around selected text
`;

const arabicWelcomeMarkdown = `# مرحباً بك في Helbaron

Helbaron محرر **Markdown** يعمل على جهازك، بواجهة عربية كاملة وكتابة من اليمين إلى اليسار، مع ذكاء اصطناعي متاح فقط عندما تطلبه.

## ابدأ من هنا

- استخدم **شريط الأدوات** بالأعلى للتنسيق، تماماً مثل Word.
- كل فقرة تأخذ اتجاهها تلقائياً: العربية من اليمين، و English from the left.
- افتح ملفات **Word (.docx)** وحوّلها إلى Markdown، أو صدّر مستندك إلى Word بضغطة واحدة.

> ملفاتك تبقى ملفات \`.md\` نصية عادية على القرص، تفتحها بأي برنامج.

## اختصارات مفيدة

| الأمر | الاختصار |
| --- | --- |
| عريض | Ctrl + B |
| مائل | Ctrl + I |
| حفظ | Ctrl + S |
`;

/** English welcome document, kept for non-Arabic interface languages. */
export const initialMarkdown = englishWelcomeMarkdown;

/**
 * The welcome document follows the interface language: the Arabic edition
 * greets Arabic users in Arabic with right-to-left content.
 */
export function welcomeMarkdownForCurrentLanguage() {
  const language = typeof document === "undefined" ? "" : document.documentElement.lang;
  return language === "ar" ? arabicWelcomeMarkdown : englishWelcomeMarkdown;
}
