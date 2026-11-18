import { Fragment, type ReactNode } from "react";

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;
const TRAILING_PUNCT = /[.,;:!?)]+$/;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      // Не «съедаем» хвостовую пунктуацию в ссылку
      const trailing = part.match(TRAILING_PUNCT)?.[0] ?? "";
      const href = trailing ? part.slice(0, -trailing.length) : part;
      return (
        <Fragment key={`${keyPrefix}-l-${index}`}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="break-all font-medium text-orange-700 underline underline-offset-2 hover:text-orange-800"
          >
            {href}
          </a>
          {trailing}
        </Fragment>
      );
    }
    return <Fragment key={`${keyPrefix}-t-${index}`}>{part}</Fragment>;
  });
}

/**
 * Безопасный рендер «маркдаун-лайт» контента постов (чистый текст):
 *  - двойной перенос → новый абзац;
 *  - одиночный перенос → <br />;
 *  - строки, начинающиеся с «- », группируются в маркированный список;
 *  - URL автоматически становятся ссылками (rel="noopener nofollow");
 *  - HTML НЕ интерпретируется — защита от XSS; текст экранируется React.
 */
export function PostContent({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-3 leading-relaxed text-stone-800">
      {paragraphs.map((paragraph, pIndex) => {
        const lines = paragraph.split("\n");
        const isList = lines.every((line) => line.trim() === "" || /^- /.test(line.trim()));

        if (isList) {
          const items = lines
            .map((line) => line.trim())
            .filter((line) => line.startsWith("- "))
            .map((line) => line.slice(2));
          return (
            <ul key={pIndex} className="list-disc space-y-1 pl-6">
              {items.map((item, i) => (
                <li key={i}>{renderInline(item, `p${pIndex}-i${i}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={pIndex}>
            {lines.map((line, lIndex) => (
              <Fragment key={lIndex}>
                {lIndex > 0 && <br />}
                {renderInline(line, `p${pIndex}-l${lIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
