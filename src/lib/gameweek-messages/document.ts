export const GAMEWEEK_MESSAGE_CHARACTER_LIMIT = 1000;

type SerializedNode = {
  type: string;
  version: number;
  children?: SerializedNode[];
  text?: string;
  format?: number | string;
  listType?: string;
  tag?: string;
  [key: string]: unknown;
};

export interface RichTextDocument {
  root: SerializedNode;
}

export interface ParsedRichTextDocument {
  document: RichTextDocument;
  plainText: string;
}

export const EMPTY_RICH_TEXT_DOCUMENT: RichTextDocument = {
  root: {
    children: [],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateNode(value: unknown, parentType: string): value is SerializedNode {
  if (!isRecord(value) || typeof value.type !== 'string' || value.version !== 1) return false;

  if (value.type === 'text') {
    return (
      (parentType === 'paragraph' || parentType === 'listitem') &&
      typeof value.text === 'string' &&
      typeof value.format === 'number' &&
      value.format >= 0 &&
      (value.format & ~3) === 0
    );
  }
  if (value.type === 'linebreak') return parentType === 'paragraph' || parentType === 'listitem';
  if (!Array.isArray(value.children)) return false;

  const allowed =
    value.type === 'root'
      ? parentType === 'document'
      : value.type === 'paragraph'
        ? parentType === 'root' || parentType === 'listitem'
        : value.type === 'list'
          ? (parentType === 'root' || parentType === 'listitem') &&
            value.listType === 'bullet' &&
            value.tag === 'ul'
          : value.type === 'listitem' && parentType === 'list';

  return (
    allowed &&
    value.children.length <= 100 &&
    value.children.every((child) => validateNode(child, value.type as string))
  );
}

function nodeText(node: SerializedNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'linebreak') return '\n';
  const separator = node.type === 'root' || node.type === 'list' ? '\n' : '';
  return (node.children ?? []).map(nodeText).join(separator);
}

export function parseRichTextDocument(value: unknown): ParsedRichTextDocument | null {
  if (!isRecord(value) || !validateNode(value.root, 'document') || value.root.type !== 'root') {
    return null;
  }

  const document = value as unknown as RichTextDocument;
  const plainText = nodeText(document.root).replace(/\r\n?/g, '\n');
  if (plainText.length > GAMEWEEK_MESSAGE_CHARACTER_LIMIT) return null;
  return { document, plainText };
}

export type { SerializedNode };
