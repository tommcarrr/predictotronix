'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquareText } from 'lucide-react';
import { adminExtractEmailPredictions, adminSubmitPredictions } from '@/lib/predictions/actions';
import { markGameweekMessagesRead } from '@/lib/gameweek-messages/actions';
import { RichTextContent } from '@/components/gameweek-messages/RichTextContent';

interface Option {
  id: string;
  label: string;
}

interface ParticipantOption extends Option {
  completed: number;
  total: number;
  status: 'awaiting' | 'in_progress' | 'ready';
  isOffline: boolean;
}

interface Fixture {
  id: string;
  home_team_name: string;
  away_team_name: string;
  kickoff: string;
  result_confirmed: boolean;
  prediction: {
    home_score: number;
    away_score: number;
    points_awarded: number | null;
  } | null;
}

interface Props {
  participants: ParticipantOption[];
  gameweeks: Option[];
  selectedParticipantId: string;
  selectedGameweekId: string;
  initialTab?: 'predictions' | 'messages';
  messages?: Array<{
    id: string;
    participantId: string;
    participantName: string;
    content: unknown;
    plainText: string;
    createdAt: string;
    updatedAt: string;
    unread: boolean;
  }>;
  unreadMessageCount?: number;
  llmFallbackConfigured: boolean;
  fixtures: Fixture[];
}

export function AdminPredictionsForm({
  participants,
  gameweeks,
  selectedParticipantId,
  selectedGameweekId,
  initialTab = 'predictions',
  messages = [],
  unreadMessageCount = 0,
  llmFallbackConfigured,
  fixtures,
}: Props) {
  const router = useRouter();
  const [gameweekId, setGameweekId] = useState(selectedGameweekId);
  const [tab, setTab] = useState(initialTab);
  const [messagesAreRead, setMessagesAreRead] = useState(false);
  const [inputs, setInputs] = useState<Record<string, { home: string; away: string }>>(
    Object.fromEntries(
      fixtures.map((fixture) => [
        fixture.id,
        {
          home: fixture.prediction?.home_score.toString() ?? '',
          away: fixture.prediction?.away_score.toString() ?? '',
        },
      ])
    )
  );
  const [message, setMessage] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [hideReady, setHideReady] = useState(false);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [emailText, setEmailText] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importedBy, setImportedBy] = useState<Record<string, 'deterministic' | 'llm'>>({});
  const [isExtracting, startExtraction] = useTransition();
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    if (tab !== 'messages' || !gameweekId || unreadMessageCount === 0 || messagesAreRead) return;
    let active = true;
    void markGameweekMessagesRead(gameweekId).then((result) => {
      if (active && result.success) setMessagesAreRead(true);
    });
    return () => {
      active = false;
    };
  }, [gameweekId, messagesAreRead, tab, unreadMessageCount]);

  const normalizedParticipantName = participantName.trim().toLocaleLowerCase();
  const filteredParticipants = participants.filter(
    (participant) =>
      (!normalizedParticipantName ||
        participant.label.toLocaleLowerCase().includes(normalizedParticipantName)) &&
      (!hideReady || participant.status !== 'ready') &&
      (!offlineOnly || participant.isOffline)
  );

  function navigationHref(
    nextParticipantId: string,
    nextGameweekId: string,
    nextTab: 'predictions' | 'messages' = tab
  ) {
    const params = new URLSearchParams();
    if (nextParticipantId) params.set('participantId', nextParticipantId);
    if (nextGameweekId) params.set('gameweekId', nextGameweekId);
    if (nextTab === 'messages') params.set('tab', 'messages');
    const query = params.toString();
    return `/admin/predictions${query ? `?${query}` : ''}`;
  }

  function navigate(nextParticipantId: string, nextGameweekId: string) {
    router.push(navigationHref(nextParticipantId, nextGameweekId));
  }

  function changeScore(fixtureId: string, side: 'home' | 'away', value: string) {
    const numeric = value.replace(/[^0-9]/g, '').slice(0, 2);
    setInputs((current) => ({
      ...current,
      [fixtureId]: { ...current[fixtureId], [side]: numeric },
    }));
  }

  function extractEmail() {
    setImportMessage(null);
    setImportWarnings([]);
    startExtraction(async () => {
      const result = await adminExtractEmailPredictions(gameweekId, emailText);
      if (!result.success) {
        setImportedBy({});
        setImportMessage(result.error ?? 'The email could not be processed.');
        return;
      }

      setInputs((current) => {
        const next = { ...current };
        for (const prediction of result.predictions) {
          next[prediction.fixtureId] = {
            home: prediction.homeScore.toString(),
            away: prediction.awayScore.toString(),
          };
        }
        return next;
      });
      setImportedBy(
        Object.fromEntries(
          result.predictions.map((prediction) => [prediction.fixtureId, prediction.method])
        )
      );

      const missingNames = fixtures
        .filter((fixture) => result.unmatchedFixtureIds.includes(fixture.id))
        .map((fixture) => `${fixture.home_team_name} v ${fixture.away_team_name}`);
      setImportWarnings([
        ...result.warnings,
        ...(missingNames.length ? [`Still missing: ${missingNames.join(', ')}.`] : []),
      ]);
      setImportMessage(
        result.predictions.length
          ? `Extracted ${result.predictions.length} of ${fixtures.length} fixtures${result.usedLlm ? ' using the parser and LLM fallback' : ' using the deterministic parser'}. Review the highlighted scores before saving.`
          : 'No predictions were recognised. Enter the scores manually or adjust the pasted text.'
      );
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const predictions = fixtures
      .map((fixture) => ({
        fixtureId: fixture.id,
        homeScore: Number.parseInt(inputs[fixture.id]?.home ?? '', 10),
        awayScore: Number.parseInt(inputs[fixture.id]?.away ?? '', 10),
      }))
      .filter(
        (prediction) =>
          Number.isInteger(prediction.homeScore) && Number.isInteger(prediction.awayScore)
      );

    if (!selectedParticipantId || predictions.length === 0) {
      setMessage('Enter at least one complete prediction.');
      return;
    }

    startSaving(async () => {
      const result = await adminSubmitPredictions(selectedParticipantId, predictions);
      setMessage(
        result.success
          ? `Saved ${result.saved} prediction${result.saved === 1 ? '' : 's'}.`
          : `Saved ${result.saved}. ${result.errors.join('; ')}`
      );
      if (result.success) setImportedBy({});
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <label className="space-y-1 text-sm font-medium">
          <span>Gameweek</span>
          <select
            value={gameweekId}
            onChange={(event) => {
              const value = event.target.value;
              setGameweekId(value);
              navigate('', value);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="">Select a gameweek</option>
            {gameweeks.map((gameweek) => (
              <option key={gameweek.id} value={gameweek.id}>
                {gameweek.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Gameweek details"
      >
        <Link
          href={navigationHref(selectedParticipantId, gameweekId, 'predictions')}
          role="tab"
          aria-selected={tab === 'predictions'}
          onClick={() => setTab('predictions')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${
            tab === 'predictions'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Predictions
        </Link>
        <Link
          href={navigationHref(selectedParticipantId, gameweekId, 'messages')}
          role="tab"
          aria-selected={tab === 'messages'}
          onClick={() => setTab('messages')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold ${
            tab === 'messages'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Messages
          {unreadMessageCount > 0 && !messagesAreRead && (
            <span
              className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white"
              aria-label={`${unreadMessageCount} new messages`}
            >
              {unreadMessageCount} new
            </span>
          )}
        </Link>
      </div>

      <div hidden={tab !== 'predictions'}>
        {gameweekId && fixtures.length === 0 && (
          <p className="text-sm text-muted-foreground">This gameweek has no fixtures.</p>
        )}

        {gameweekId && fixtures.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Participants</h2>
              <p className="text-sm text-muted-foreground">
                Select someone to enter or amend their picks.
              </p>
            </div>
            <div className="space-y-3 rounded-lg border border-border p-3">
              <label className="block space-y-1 text-sm font-medium">
                <span>Filter by name</span>
                <input
                  type="search"
                  value={participantName}
                  onChange={(event) => setParticipantName(event.target.value)}
                  placeholder="Search participants"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-normal"
                />
              </label>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hideReady}
                    onChange={(event) => setHideReady(event.target.checked)}
                    className="size-4 rounded border-border accent-primary"
                  />
                  <span>Hide ready</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={offlineOnly}
                    onChange={(event) => setOfflineOnly(event.target.checked)}
                    className="size-4 rounded border-border accent-primary"
                  />
                  <span>Offline only</span>
                </label>
              </div>
            </div>
            {filteredParticipants.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredParticipants.map((participant) => {
                  const active = participant.id === selectedParticipantId;
                  const status =
                    participant.status === 'ready'
                      ? {
                          label: 'Ready',
                          className:
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                        }
                      : participant.status === 'in_progress'
                        ? {
                            label: 'In progress',
                            className:
                              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                          }
                        : { label: 'Awaiting picks', className: 'bg-muted text-muted-foreground' };

                  return (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => navigate(participant.id, gameweekId)}
                      className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{participant.label}</span>
                        {participant.isOffline && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-semibold text-muted-foreground">
                            Offline
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {participant.completed}/{participant.total}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No participants match these filters.
              </p>
            )}
          </section>
        )}

        {selectedParticipantId && gameweekId && fixtures.length > 0 && (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="border-b border-border pb-2 text-lg font-semibold">
              {participants.find((participant) => participant.id === selectedParticipantId)?.label}
            </h2>
            <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <div>
                <h3 className="font-semibold">Paste prediction email</h3>
                <p className="text-sm text-muted-foreground">
                  The built-in parser runs first. The optional LLM fallback is{' '}
                  <span className="font-medium">
                    {llmFallbackConfigured ? 'configured' : 'not configured'}
                  </span>
                  . Nothing is saved until you review the scores and select Save predictions.
                </p>
              </div>
              <label className="block space-y-1 text-sm font-medium">
                <span>Email text</span>
                <textarea
                  value={emailText}
                  onChange={(event) => setEmailText(event.target.value)}
                  rows={8}
                  maxLength={50_000}
                  placeholder={'Arsenal 2-1 Chelsea\nMan Utd v Liverpool: 1-2'}
                  className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-normal"
                />
              </label>
              <button
                type="button"
                onClick={extractEmail}
                disabled={isExtracting || !emailText.trim()}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isExtracting ? 'Extracting…' : 'Extract predictions'}
              </button>
              {importMessage && (
                <p className="text-sm" role="status">
                  {importMessage}
                </p>
              )}
              {importWarnings.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700 dark:text-amber-300">
                  {importWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </section>
            <div className="space-y-2">
              {fixtures.map((fixture) => {
                const importMethod = importedBy[fixture.id];
                const importedHome = Number.parseInt(inputs[fixture.id]?.home ?? '', 10);
                const importedAway = Number.parseInt(inputs[fixture.id]?.away ?? '', 10);
                const overwritesExisting = Boolean(
                  importMethod &&
                  fixture.prediction &&
                  (fixture.prediction.home_score !== importedHome ||
                    fixture.prediction.away_score !== importedAway)
                );

                return (
                  <div
                    key={fixture.id}
                    className={`rounded-lg border p-4 ${importMethod ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(fixture.kickoff).toLocaleString('en-GB', {
                          timeZone: 'Europe/London',
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-2">
                        {importMethod && (
                          <span className="font-medium text-primary">
                            {importMethod === 'llm' ? 'LLM suggestion' : 'Parser match'}
                          </span>
                        )}
                        {fixture.result_confirmed && <span>Result confirmed</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex-1 text-right font-medium">
                        {fixture.home_team_name}
                      </span>
                      <input
                        aria-label={`${fixture.home_team_name} score`}
                        value={inputs[fixture.id]?.home ?? ''}
                        onChange={(event) => changeScore(fixture.id, 'home', event.target.value)}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        className="w-12 rounded border border-border bg-background p-2 text-center"
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        aria-label={`${fixture.away_team_name} score`}
                        value={inputs[fixture.id]?.away ?? ''}
                        onChange={(event) => changeScore(fixture.id, 'away', event.target.value)}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        className="w-12 rounded border border-border bg-background p-2 text-center"
                      />
                      <span className="flex-1 font-medium">{fixture.away_team_name}</span>
                    </div>
                    {fixture.prediction?.points_awarded != null && (
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Current points: {fixture.prediction.points_awarded}
                      </p>
                    )}
                    {overwritesExisting && (
                      <p className="mt-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
                        Will replace existing prediction {fixture.prediction?.home_score}–
                        {fixture.prediction?.away_score}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={isSaving || isExtracting}
              className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
            >
              {isSaving
                ? 'Saving…'
                : importedBy && Object.keys(importedBy).length > 0
                  ? 'Review and save predictions'
                  : 'Save predictions'}
            </button>
            {message && (
              <p className="text-center text-sm" role="status">
                {message}
              </p>
            )}
          </form>
        )}
      </div>

      {tab === 'messages' && (
        <section className="space-y-4" aria-label="Player messages">
          <div>
            <h2 className="text-lg font-semibold">Player messages</h2>
            <p className="text-sm text-muted-foreground">
              Every note for this gameweek is shown here, newest first.
            </p>
          </div>
          {!gameweekId ? (
            <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
              Select a gameweek to see its messages.
            </p>
          ) : messages.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
              No players have left a message for this gameweek.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((playerMessage) => (
                <article
                  key={playerMessage.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-xs"
                >
                  <header className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MessageSquareText className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-semibold">{playerMessage.participantName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(playerMessage.updatedAt).toLocaleString('en-GB', {
                            timeZone: 'Europe/London',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                    {playerMessage.unread && !messagesAreRead && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                        New
                      </span>
                    )}
                  </header>
                  <RichTextContent document={playerMessage.content} />
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
