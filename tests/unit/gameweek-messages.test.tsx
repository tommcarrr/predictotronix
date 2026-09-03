import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextContent } from '@/components/gameweek-messages/RichTextContent';
import { GameweekMessageEditor } from '@/components/gameweek-messages/GameweekMessageEditor';
import {
  GAMEWEEK_MESSAGE_CHARACTER_LIMIT,
  parseRichTextDocument,
} from '@/lib/gameweek-messages/document';

const { saveMessageMock } = vi.hoisted(() => ({ saveMessageMock: vi.fn() }));

vi.mock('@/lib/gameweek-messages/actions', () => ({
  saveGameweekMessage: saveMessageMock,
}));

function richText(text: string, format = 0, style = '') {
  return {
    root: {
      children: [
        {
          children: [{ detail: 0, format, mode: 'normal', style, text, type: 'text', version: 1 }],
          direction: null,
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
}

describe('gameweek rich-text messages', () => {
  it('accepts the supported Lexical state and renders formatting without HTML injection', () => {
    const content = richText('<script>safe text</script>', 3);
    expect(parseRichTextDocument(content)?.plainText).toBe('<script>safe text</script>');

    const { container } = render(<RichTextContent document={content} />);
    expect(screen.getByText('<script>safe text</script>')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('strong em')).not.toBeNull();
  });

  it('rejects unsupported formatting and content over the visible limit', () => {
    expect(parseRichTextDocument(richText('underlined', 8))).toBeNull();
    expect(parseRichTextDocument(richText('unsafe size', 0, 'font-size: 100px;'))).toBeNull();
    expect(parseRichTextDocument(richText('unsafe colour', 0, 'color: red;'))).toBeNull();
    expect(
      parseRichTextDocument(richText('x'.repeat(GAMEWEEK_MESSAGE_CHARACTER_LIMIT + 1)))
    ).toBeNull();
  });

  it('renders the supported font sizes from validated Lexical state', () => {
    const content = richText('Large message', 0, 'font-size: 20px;');
    expect(parseRichTextDocument(content)).not.toBeNull();

    render(<RichTextContent document={content} />);
    expect(screen.getByText('Large message')).toHaveStyle({ fontSize: '20px' });
  });

  it('uses Lexical and shows the player the 1,000 character allowance', () => {
    render(<GameweekMessageEditor gameweekId="gameweek" initialContent={richText('Hello')} />);

    fireEvent.click(screen.getByText('Edit note to league admins'));
    expect(screen.getByRole('textbox', { name: 'Note to league admins' })).toHaveTextContent(
      'Hello'
    );
    expect(screen.getByText('5 / 1,000 characters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bulleted list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Small text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Normal text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Large text' })).toBeInTheDocument();
  });
});
