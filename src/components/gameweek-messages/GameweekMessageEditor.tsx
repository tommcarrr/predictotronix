'use client';

import { useRef, useState, useTransition } from 'react';
import { Bold, Italic, List, MessageSquareText, Trash2 } from 'lucide-react';
import { $getRoot, FORMAT_TEXT_COMMAND, type LexicalEditor } from 'lexical';
import { ListItemNode, ListNode, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { OverflowNode } from '@lexical/overflow';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { saveGameweekMessage } from '@/lib/gameweek-messages/actions';
import {
  EMPTY_RICH_TEXT_DOCUMENT,
  GAMEWEEK_MESSAGE_CHARACTER_LIMIT,
  parseRichTextDocument,
} from '@/lib/gameweek-messages/document';

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  return (
    <div className="gameweek-message-toolbar" role="toolbar" aria-label="Note formatting">
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        aria-label="Bold"
      >
        <Bold aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        aria-label="Italic"
      >
        <Italic aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        aria-label="Bulleted list"
      >
        <List aria-hidden="true" />
      </button>
    </div>
  );
}

export function GameweekMessageEditor({
  gameweekId,
  initialContent,
}: {
  gameweekId: string;
  initialContent: unknown;
}) {
  const initial = parseRichTextDocument(initialContent);
  const editorRef = useRef<LexicalEditor | null>(null);
  const currentContent = useRef<unknown>(initial?.document ?? EMPTY_RICH_TEXT_DOCUMENT);
  const [characterCount, setCharacterCount] = useState(initial?.plainText.length ?? 0);
  const [hasSavedNote, setHasSavedNote] = useState(Boolean(initial?.plainText.trim()));
  const [hasOpened, setHasOpened] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function persist(content: unknown) {
    setStatus(null);
    startTransition(async () => {
      const result = await saveGameweekMessage(gameweekId, content);
      if (result.success) setHasSavedNote(!result.deleted);
      setStatus(
        result.success
          ? result.deleted
            ? '✓ Note removed.'
            : '✓ Note saved for your league admins.'
          : (result.error ?? 'The note could not be saved.')
      );
    });
  }

  function clear() {
    editorRef.current?.update(() => $getRoot().clear());
    currentContent.current = EMPTY_RICH_TEXT_DOCUMENT;
    setCharacterCount(0);
    persist(EMPTY_RICH_TEXT_DOCUMENT);
  }

  const initialConfig = {
    namespace: `GameweekMessage-${gameweekId}`,
    nodes: [ListNode, ListItemNode, OverflowNode],
    editorState: initial ? JSON.stringify(initial.document) : undefined,
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <details
      className="participant-gameweek-message"
      onToggle={(event) => {
        if (event.currentTarget.open) setHasOpened(true);
      }}
    >
      <summary onClick={() => setHasOpened(true)}>
        <MessageSquareText aria-hidden="true" />
        <span>{hasSavedNote ? 'Edit note to league admins' : 'Add a note for league admins'}</span>
        {hasSavedNote && <span className="participant-gameweek-message__saved">Saved</span>}
      </summary>
      {hasOpened && (
        <div className="participant-gameweek-message__body">
          <p className="participant-gameweek-message__help">
            Optional. All league admins can read this note for the gameweek.
          </p>
          <LexicalComposer initialConfig={initialConfig}>
            <Toolbar />
            <div className="gameweek-message-editor-shell">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="gameweek-message-editor"
                    aria-label="Note to league admins"
                    aria-placeholder="Anything your league admins should know?"
                    placeholder={
                      <div className="gameweek-message-editor__placeholder">
                        Anything your league admins should know?
                      </div>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
            <HistoryPlugin />
            <ListPlugin />
            <EditorRefPlugin editorRef={editorRef} />
            <OnChangePlugin
              onChange={(editorState) => {
                currentContent.current = editorState.toJSON();
                editorState.read(() => setCharacterCount($getRoot().getTextContentSize()));
                setStatus(null);
              }}
            />
            <CharacterLimitPlugin
              charset="UTF-16"
              maxLength={GAMEWEEK_MESSAGE_CHARACTER_LIMIT}
              renderer={({ remainingCharacters }) => (
                <div className="participant-gameweek-message__footer">
                  <span className={remainingCharacters < 0 ? 'text-[--color-error]' : ''}>
                    {(GAMEWEEK_MESSAGE_CHARACTER_LIMIT - remainingCharacters).toLocaleString()} /{' '}
                    {GAMEWEEK_MESSAGE_CHARACTER_LIMIT.toLocaleString()} characters
                  </span>
                  <div>
                    {(hasSavedNote || characterCount > 0) && (
                      <button
                        type="button"
                        onClick={clear}
                        disabled={isPending}
                        className="participant-gameweek-message__clear"
                      >
                        <Trash2 aria-hidden="true" /> Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => persist(currentContent.current)}
                      disabled={isPending || remainingCharacters < 0}
                      className="participant-gameweek-message__save"
                    >
                      {isPending ? 'Saving…' : 'Save note'}
                    </button>
                  </div>
                </div>
              )}
            />
          </LexicalComposer>
          {status && (
            <p role="status" className="participant-gameweek-message__status">
              {status}
            </p>
          )}
        </div>
      )}
    </details>
  );
}
