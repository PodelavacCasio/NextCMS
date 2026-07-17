import React from "react";

// A deliberately small markdown renderer covering the subset the CMS editor
// documents: ## / ### headings, paragraphs, - lists, > quotes, **bold**,
// *italic*, `code`, [links](url) and ![images](url). Output is built as React
// elements (never dangerouslySetInnerHTML), so user content can't inject HTML.

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // image | link | bold | italic | code
  const pattern =
    /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyBase}-${i++}`;
    if (match[2] !== undefined) {
      nodes.push(<img key={key} src={match[2]} alt={match[1]} className="md-img" />);
    } else if (match[4] !== undefined) {
      nodes.push(
        <a key={key} href={match[4]}>
          {match[3]}
        </a>
      );
    } else if (match[5] !== undefined) {
      nodes.push(<strong key={key}>{renderInline(match[5], key)}</strong>);
    } else if (match[6] !== undefined) {
      nodes.push(<em key={key}>{renderInline(match[6], key)}</em>);
    } else if (match[7] !== undefined) {
      nodes.push(<code key={key}>{match[7]}</code>);
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const out: React.ReactNode[] = [];

  blocks.forEach((block, bi) => {
    const trimmed = block.trim();
    if (!trimmed) return;
    const lines = trimmed.split("\n");

    if (lines.every((l) => /^\s*-\s+/.test(l))) {
      out.push(
        <ul key={bi}>
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*-\s+/, ""), `${bi}-${li}`)}</li>
          ))}
        </ul>
      );
      return;
    }

    if (lines.every((l) => /^\s*>\s?/.test(l))) {
      const quote = lines.map((l) => l.replace(/^\s*>\s?/, "")).join(" ");
      out.push(<blockquote key={bi}>{renderInline(quote, `${bi}`)}</blockquote>);
      return;
    }

    if (/^###\s+/.test(trimmed)) {
      out.push(<h3 key={bi}>{renderInline(trimmed.replace(/^###\s+/, ""), `${bi}`)}</h3>);
      return;
    }
    if (/^##\s+/.test(trimmed)) {
      out.push(<h2 key={bi}>{renderInline(trimmed.replace(/^##\s+/, ""), `${bi}`)}</h2>);
      return;
    }
    if (/^#\s+/.test(trimmed)) {
      out.push(<h2 key={bi}>{renderInline(trimmed.replace(/^#\s+/, ""), `${bi}`)}</h2>);
      return;
    }

    // Paragraph; single newlines inside a block become line breaks.
    const parts: React.ReactNode[] = [];
    lines.forEach((l, li) => {
      if (li > 0) parts.push(<br key={`br-${li}`} />);
      parts.push(...renderInline(l, `${bi}-${li}`));
    });
    out.push(<p key={bi}>{parts}</p>);
  });

  return <div className="prose">{out}</div>;
}
