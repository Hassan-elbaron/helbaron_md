const englishWelcomeMarkdown = `# Welcome to Helbaron

Helbaron is a local-first **Markdown** editor, with AI available only when you ask for it.

## Start here

- Format with the **toolbar** above. Everything else is in its **Insert** and **View** menus.
- Open **Word (.docx)** files as Markdown, or export your document to Word in one click.
- Click the **logo** for files, export and **Appearance**. Each interface style has a light and a dark version.

## Arabic, built in

Every paragraph finds its own direction, so Arabic and English sit side by side without any settings:

مرحباً! هذه الفقرة مكتوبة بالعربية، فتظهر من اليمين إلى اليسار تلقائياً، حتى لو احتوت على كلمات إنجليزية مثل Markdown أو أرقام مثل 2026.

> Exported Word files keep Arabic paragraphs right-to-left, too.
`;

const arabicWelcomeMarkdown = `# مرحباً بك في Helbaron

Helbaron محرر **Markdown** يعمل على جهازك، بواجهة عربية كاملة وكتابة من اليمين إلى اليسار، مع ذكاء اصطناعي متاح فقط عندما تطلبه.

## ابدأ من هنا

- استخدم **شريط الأدوات** بالأعلى للتنسيق.
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
