export interface EmailImportFixture {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
}

export interface ExtractedEmailPrediction {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  method: 'deterministic' | 'llm';
}

export interface EmailParseResult {
  predictions: ExtractedEmailPrediction[];
  unmatchedFixtureIds: string[];
  warnings: string[];
}

// Canonical provider names plus the common names, abbreviations and punctuation
// variants used in UK football emails. Extra historical Premier League clubs are
// harmless: aliases are only activated when that club appears in the fixtures.
const PREMIER_LEAGUE_TEAM_ALIASES: string[][] = [
  ['Arsenal', 'Arsenal FC', 'AFC', 'The Gunners'],
  ['Aston Villa', 'Aston Villa FC', 'Villa', 'AVFC'],
  ['AFC Bournemouth', 'Bournemouth', 'Bournemouth AFC', 'The Cherries'],
  ['Brentford', 'Brentford FC', 'BFC', 'The Bees'],
  [
    'Brighton & Hove Albion',
    'Brighton and Hove Albion',
    'Brighton Hove Albion',
    'Brighton',
    'BHA',
    'BHAFC',
    'The Seagulls',
  ],
  ['Chelsea', 'Chelsea FC', 'CFC'],
  ['Coventry City', 'Coventry', 'Cov', 'CCFC', 'The Sky Blues'],
  ['Crystal Palace', 'Crystal Palace FC', 'Palace', 'CPFC'],
  ['Everton', 'Everton FC', 'EFC', 'The Toffees'],
  ['Fulham', 'Fulham FC', 'FFC', 'The Cottagers'],
  ['Hull City', 'Hull', 'Hull City AFC', 'HCAFC', 'The Tigers'],
  ['Ipswich Town', 'Ipswich', 'ITFC', 'The Tractor Boys'],
  ['Leeds United', 'Leeds', 'Leeds Utd', 'LUFC'],
  ['Liverpool', 'Liverpool FC', 'LFC'],
  ['Manchester City', 'Man City', 'Man. City', 'Manchester C', 'MCFC'],
  ['Manchester United', 'Man United', 'Man Utd', 'Man. United', 'Man. Utd', 'Manchester U', 'MUFC'],
  ['Newcastle United', 'Newcastle', 'Newcastle Utd', 'NUFC'],
  ['Nottingham Forest', "Nott'm Forest", 'Nottm Forest', 'Notts Forest', 'Forest', 'NFFC'],
  ['Sunderland', 'Sunderland AFC', 'SAFC', 'The Mackems'],
  ['Tottenham Hotspur', 'Tottenham', 'Spurs', 'THFC'],
  ['Burnley', 'Burnley FC', 'BFC', 'The Clarets'],
  ['Leicester City', 'Leicester', 'LCFC', 'The Foxes'],
  ['Luton Town', 'Luton', 'LTFC', 'The Hatters'],
  ['Sheffield United', 'Sheffield Utd', 'Sheff United', 'Sheff Utd', 'SUFC', 'The Blades'],
  ['Southampton', 'Southampton FC', 'Saints', 'SFC'],
  ['West Ham United', 'West Ham', 'West Ham Utd', 'WHU', 'WHUFC', 'The Hammers'],
  ['Wolverhampton Wanderers', 'Wolverhampton', 'Wolves', 'Wolverhampton W', 'WWFC'],
  ['Blackburn Rovers', 'Blackburn', 'Blackburn Rovers FC', 'BRFC'],
  ['Bolton Wanderers', 'Bolton', 'BWFC'],
  ['Cardiff City', 'Cardiff', 'CCFC'],
  ['Derby County', 'Derby', 'DCFC'],
  ['Middlesbrough', 'Middlesbrough FC', 'Boro', 'MFC'],
  ['Norwich City', 'Norwich', 'NCFC', 'The Canaries'],
  ['Queens Park Rangers', 'QPR', 'Queens Park Rangers FC'],
  ['Reading', 'Reading FC', 'RFC'],
  ['Stoke City', 'Stoke', 'SCFC'],
  ['Swansea City', 'Swansea', 'Swansea City AFC', 'Swans'],
  ['Watford', 'Watford FC', 'WFC'],
  ['West Bromwich Albion', 'West Brom', 'West Bromwich', 'WBA', 'WBAFC'],
  ['Wigan Athletic', 'Wigan', 'WAFC'],
];

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[.–—]/g, (character) => (character === '.' ? '' : '-'))
    .toLocaleLowerCase('en-GB')
    .replace(/[^a-z0-9:\-\n]+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function generatedAliases(teamName: string): string[] {
  const canonical = normalize(teamName);
  return [
    canonical,
    canonical
      .replace(/\bfootball club\b/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
    canonical
      .replace(/\b(?:afc|fc)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  ];
}

function aliasesFor(teamName: string): string[] {
  const canonical = normalize(teamName);
  const catalogue =
    PREMIER_LEAGUE_TEAM_ALIASES.find((aliases) =>
      aliases.some((alias) => normalize(alias) === canonical)
    ) ?? [];

  return [...new Set([...generatedAliases(teamName), ...catalogue.map(normalize)])]
    .filter((alias) => alias.length >= 3)
    .sort((a, b) => b.length - a.length);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function aliasPattern(aliases: string[]): string {
  return `(?:${aliases.map(escapeRegExp).join('|')})`;
}

function candidateSegments(email: string): string[] {
  const normalized = normalize(email);
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const segments = new Set(lines.flatMap((line) => line.split(/\s*;\s*/).filter(Boolean)));

  for (let index = 0; index < lines.length; index++) {
    if (lines[index + 1]) segments.add(`${lines[index]} ${lines[index + 1]}`);
    if (lines[index + 1] && lines[index + 2]) {
      segments.add(`${lines[index]} ${lines[index + 1]} ${lines[index + 2]}`);
    }
  }

  return [...segments];
}

function collectFixtureScores(
  segments: string[],
  homeAliases: string[],
  awayAliases: string[]
): Array<{ homeScore: number; awayScore: number }> {
  const home = aliasPattern(homeAliases);
  const away = aliasPattern(awayAliases);
  const connector = String.raw`\s*(?:v|vs|versus|against|-)\s*`;
  const optionalLabel = String.raw`\s*(?:(?:prediction|predict|score|is|will be)\s*)?(?::|-)?\s*`;
  const scorePair = String.raw`(\d{1,2})\s*[-:]\s*(\d{1,2})`;
  const patterns = [
    {
      regex: new RegExp(String.raw`\b${home}\b\s*${scorePair}\s*\b${away}\b`, 'g'),
      reverse: false,
    },
    { regex: new RegExp(String.raw`\b${away}\b\s*${scorePair}\s*\b${home}\b`, 'g'), reverse: true },
    {
      regex: new RegExp(
        String.raw`\b${home}\b${connector}\b${away}\b${optionalLabel}${scorePair}`,
        'g'
      ),
      reverse: false,
    },
    {
      regex: new RegExp(
        String.raw`\b${away}\b${connector}\b${home}\b${optionalLabel}${scorePair}`,
        'g'
      ),
      reverse: true,
    },
    {
      regex: new RegExp(
        String.raw`${scorePair}${optionalLabel}\b${home}\b${connector}\b${away}\b`,
        'g'
      ),
      reverse: false,
    },
    {
      regex: new RegExp(
        String.raw`${scorePair}${optionalLabel}\b${away}\b${connector}\b${home}\b`,
        'g'
      ),
      reverse: true,
    },
  ];

  const separatedScorePatterns = [
    {
      regex: new RegExp(
        String.raw`\b${home}\b\s*(\d{1,2})\s*[,/-]?\s*\b${away}\b\s*(\d{1,2})\b`,
        'g'
      ),
      reverse: false,
    },
    {
      regex: new RegExp(
        String.raw`\b${away}\b\s*(\d{1,2})\s*[,/-]?\s*\b${home}\b\s*(\d{1,2})\b`,
        'g'
      ),
      reverse: true,
    },
  ];

  const results: Array<{ homeScore: number; awayScore: number }> = [];
  for (const segment of segments) {
    for (const { regex, reverse } of [...patterns, ...separatedScorePatterns]) {
      regex.lastIndex = 0;
      for (const match of segment.matchAll(regex)) {
        const first = Number.parseInt(match[1], 10);
        const second = Number.parseInt(match[2], 10);
        results.push(
          reverse
            ? { homeScore: second, awayScore: first }
            : { homeScore: first, awayScore: second }
        );
      }
    }
  }
  return results;
}

export function parsePredictionEmail(
  email: string,
  fixtures: EmailImportFixture[]
): EmailParseResult {
  const segments = candidateSegments(email);
  const predictions: ExtractedEmailPrediction[] = [];
  const warnings: string[] = [];
  const teamNames = [
    ...new Set(fixtures.flatMap((fixture) => [fixture.homeTeamName, fixture.awayTeamName])),
  ];
  const rawAliases = new Map(teamNames.map((teamName) => [teamName, aliasesFor(teamName)]));
  const aliasOwners = new Map<string, Set<string>>();
  for (const [teamName, aliases] of rawAliases) {
    for (const alias of aliases) {
      const owners = aliasOwners.get(alias) ?? new Set<string>();
      owners.add(teamName);
      aliasOwners.set(alias, owners);
    }
  }
  const safeAliases = new Map(
    [...rawAliases].map(([teamName, aliases]) => [
      teamName,
      aliases.filter(
        (alias) => alias === normalize(teamName) || aliasOwners.get(alias)?.size === 1
      ),
    ])
  );

  for (const fixture of fixtures) {
    const scores = collectFixtureScores(
      segments,
      safeAliases.get(fixture.homeTeamName) ?? generatedAliases(fixture.homeTeamName),
      safeAliases.get(fixture.awayTeamName) ?? generatedAliases(fixture.awayTeamName)
    );
    const uniqueScores = [
      ...new Map(scores.map((score) => [`${score.homeScore}:${score.awayScore}`, score])).values(),
    ];

    if (uniqueScores.length === 1) {
      predictions.push({ fixtureId: fixture.id, ...uniqueScores[0], method: 'deterministic' });
    } else if (uniqueScores.length > 1) {
      warnings.push(
        `${fixture.homeTeamName} v ${fixture.awayTeamName} has conflicting scores in the pasted email.`
      );
    }
  }

  const matchedIds = new Set(predictions.map((prediction) => prediction.fixtureId));
  return {
    predictions,
    unmatchedFixtureIds: fixtures
      .filter((fixture) => !matchedIds.has(fixture.id))
      .map((fixture) => fixture.id),
    warnings,
  };
}
