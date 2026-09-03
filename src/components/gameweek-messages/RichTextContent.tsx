import {
  getGameweekMessageFontSize,
  parseRichTextDocument,
  type SerializedNode,
} from '@/lib/gameweek-messages/document';

function renderNode(node: SerializedNode, key: string): React.ReactNode {
  if (node.type === 'text') {
    let content: React.ReactNode = node.text ?? '';
    const format = typeof node.format === 'number' ? node.format : 0;
    if (format & 2) content = <em>{content}</em>;
    if (format & 1) content = <strong>{content}</strong>;
    return (
      <span key={key} style={{ fontSize: getGameweekMessageFontSize(node.style) }}>
        {content}
      </span>
    );
  }
  if (node.type === 'linebreak') return <br key={key} />;

  const children = (node.children ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`)
  );
  if (node.type === 'paragraph') return <p key={key}>{children}</p>;
  if (node.type === 'list') return <ul key={key}>{children}</ul>;
  if (node.type === 'listitem') return <li key={key}>{children}</li>;
  return children;
}

export function RichTextContent({
  document,
  className = '',
}: {
  document: unknown;
  className?: string;
}) {
  const parsed = parseRichTextDocument(document);
  if (!parsed || !parsed.plainText.trim()) return null;

  return (
    <div className={`gameweek-message-content ${className}`}>
      {parsed.document.root.children?.map((node, index) => renderNode(node, String(index)))}
    </div>
  );
}
