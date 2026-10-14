/** Генератор техзадания Quizzical Club (DOCX) — двуязычный: RU + EN.
 *  Запуск: node generate_tz.js  →  ТЗ_Quizzical_Club.docx + TZ_Quizzical_Club_EN.docx */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, TableOfContents,
} = require("docx");

const B = { style: BorderStyle.SINGLE, size: 1, color: "C9CFC9" };
const BORDERS = { top: B, bottom: B, left: B, right: B };
const HEAD_FILL = { fill: "E3EFE4", type: ShadingType.CLEAR };
const CW = 9026; // A4 content width

const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const P = (text, opts = {}) =>
  new Paragraph({ spacing: { after: 120 }, ...opts, children: [new TextRun({ text, ...(opts.run || {}) })] });
const bullet = (text) =>
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun(text)] });
const num = (text) =>
  new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 }, children: [new TextRun(text)] });
const code = (text) =>
  new Paragraph({
    spacing: { after: 60 }, shading: { fill: "F2F0E6", type: ShadingType.CLEAR }, indent: { left: 240 },
    children: [new TextRun({ text, font: "Consolas", size: 20 })],
  });

function table(headers, rows, widths) {
  const w = widths || headers.map(() => Math.floor(CW / headers.length));
  const mkRow = (cells, isHead) =>
    new TableRow({
      children: cells.map(
        (c, i) =>
          new TableCell({
            borders: BORDERS,
            width: { size: w[i], type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            ...(isHead ? { shading: HEAD_FILL } : {}),
            children: [new Paragraph({ children: [new TextRun({ text: c, bold: !!isHead })] })],
          }),
      ),
    });
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: w,
    rows: [mkRow(headers, true), ...rows.map((r) => mkRow(r, false))],
  });
}

/* ===================== ЛОКАЛИ ===================== */
const L = {
  ru: {
    file: "../../ТЗ_Quizzical_Club.docx",
    docTitle: "Quizzical Club — Техническое задание",
    titleMain: "Техническое задание проекта",
    titleSub: "Командная игра-викторина + тренажёр для олимпиадной подготовки · веб, Android, iOS",
    metaField: "Поле", metaValue: "Значение",
    meta: [
      ["Версия документа", "2.0 (шаблон для развития)"],
      ["Дата", "14 октября 2026"],
      ["Продакшн", "https://jeopardizzy.github.io/Jeopardizzy-/"],
      ["Репозиторий", "https://github.com/jeopardizzy/Jeopardizzy-"],
      ["Мобильные оболочки", "Capacitor 8: android/ + ios/ (appId com.quizzicalclub.app)"],
      ["Статус", "В эксплуатации, активная разработка"],
      ["Стек", "Vite 8 · React 19 · TS strict · Tailwind 4 · Zustand · Zod · Motion · Vitest · Playwright · Capacitor 8"],
    ],
    toc: "Содержание",
    s1: "1. Общие сведения",
    s1intro: "Quizzical Club — игра-викторина в формате Jeopardy для семейных и учебных сессий. Одна кодовая база работает как сайт (GitHub Pages) и как мобильное приложение (Capacitor-оболочки Android/iOS). Без сервера и аккаунтов; все сейвы — локально на устройстве.",
    s1intro2: "Проект вырос из книжного контента (сборники головоломок и викторин) и серии игр «Use of English Jeopardy». Аудитория — семья и ученики, готовящиеся к олимпиадам по английскому языку.",
    s11: "1.1. Цели проекта",
    goals: [
      "Командная игра за одним устройством: ведущий читает вопрос, команды отвечают, очки начисляются вручную.",
      "Соло-тренировка по типам заданий с нечёткой проверкой ответов и рекордами.",
      "Справочник стратегий (Guides) по каждому типу головоломок.",
      "Статистика трудных категорий (Training notes) для подготовки к олимпиадам.",
      "Короткие сессии: длинные игры разбиты на части ≤ 3 досок, возможен досрочный выход к итогам.",
    ],
    s12: "1.2. Ключевые факты",
    factMetric: "Метрика", factValue: "Значение",
    facts: [
      ["Игр (источники)", "17 — арены I–IV, Arena Mix, 5 книжных сетов, 7 классических"],
      ["Игр на экране выбора", "26 частей (длинные игры разбиты по ≤ 3 доски)"],
      ["Вопросов в хранилище", "≈ 1 690 (540 книжных + 275 UoE + 870 классических)"],
      ["Тестов", "53 юнит (vitest) + 88 e2e (playwright, десктоп + мобильный)"],
      ["CI/CD", "Pages-деплой с e2e-гейтом · Android APK+AAB · iOS build check (macOS)"],
    ],

    s2: "2. Текущая функциональность (что уже сделано)",
    s21: "2.1. Team Jeopardy (командный режим)",
    team: [
      "Экран выбора игры списком по сериям (Idiom Arenas / Book Club / Classic Vault); длинные игры показаны частями «Часть N из M» с точным числом досок и вопросов.",
      "Настройка команд: 1–4 команды, имена запоминаются; переключатель «Final wager round» с дефолтом по игре и сохранением выбора.",
      "Доска 5×5 (поддерживаются 4-колоночные раунды классики); ценности растут по номеру раунда внутри части (100–500 × 1–3).",
      "Окна активности (вопрос, ставка) на десктопе прижаты к левому краю (≤ 46% ширины) — доска и табло остаются видны; на мобильном — во всю ширину.",
      "Ведущий: плитка → вопрос → Reveal → очки команде или «Nobody». У классических вопросов под ответом есть заметки для ведущего.",
      "Кнопка «Завершить игру» на доске (неактивна, пока открыт вопрос) → подтверждение: «К финалу» / «Сразу к итогам» / «Отмена»; на экране победителя — пометка «Завершено досрочно», нераскрытые плитки не считаются промахами.",
      "Финал со ставками; экран победителя с турнирной таблицей и «Training notes»: трудные категории игры + all-time drill list.",
      "Звук синтезируется Web Audio (без файлов), отключается; поддерживается reduced motion.",
    ],
    s22: "2.2. Workbook (тренажёр)",
    wb: [
      "10 типов заданий + «Everything»; фильтр сложности Easy / Medium / Hard.",
      "Выбор длины теста: 5 / 10 / 20 вопросов (по умолчанию 10), запоминается; если пул меньше — вариант неактивен с подсказкой.",
      "Нечёткая проверка ответов (опечатки, артикли, варианты через «/»); результаты «X из N» + процент; рекорды по ключу «тип × уровень × длина», старые рекорды мигрируют как N=10.",
    ],
    s23: "2.3. Guides (гайды)",
    guides: ["13 гайдов: правила, разобранный пример, стратегии; «Practice this type» ведёт в воркбук."],
    s24: "2.4. Контент и игры",
    seriesHead: ["Серия", "Игры", "Источник"],
    series: [
      ["Idiom Arenas", "Arena I–IV (по 2 части), Arena Mix (3 случайные доски из 21)", "Use of English Jeopardy + сборки классики"],
      ["Book Club", "5 сетов (2 доски + финал)", "Книжный датасет (63 категории, 540 вопросов)"],
      ["Classic Vault", "7 сетов → части по ≤ 3 доски; Grand Marathon → 5 частей", "Классические сеты (38 досок, 174 категории)"],
    ],
    anon: "Весь контент анонимизирован: названия и авторы исходных книг в приложении не упоминаются (регрессионный тест).",
    s25: "2.5. Мобильное приложение",
    mob: [
      "Capacitor 8: нативные проекты android/ и ios/ поверх общей кодовой базы; appId com.quizzicalclub.app (смена задокументирована).",
      "Брендовые иконки (шалфейная плитка Q) сгенерированы для обеих платформ; safe-area отступы для чёлок.",
      "CI: android.yml собирает debug APK + release AAB артефактами; ios.yml проверяет сборку на macOS (unsigned).",
      "Гайд по сторам и монетизации: docs/STORE_GUIDE.md (подпись, Data safety = no data collected, рейтинг, варианты монетизации).",
    ],
  },
  en: {
    file: "../../TZ_Quizzical_Club_EN.docx",
    docTitle: "Quizzical Club — Technical Specification",
    titleMain: "Project Technical Specification",
    titleSub: "Team trivia game + olympiad training workbook · web, Android, iOS",
    metaField: "Field", metaValue: "Value",
    meta: [
      ["Document version", "2.0 (living template)"],
      ["Date", "October 14, 2026"],
      ["Production", "https://jeopardizzy.github.io/Jeopardizzy-/"],
      ["Repository", "https://github.com/jeopardizzy/Jeopardizzy-"],
      ["Mobile shells", "Capacitor 8: android/ + ios/ (appId com.quizzicalclub.app)"],
      ["Status", "In production, active development"],
      ["Stack", "Vite 8 · React 19 · strict TS · Tailwind 4 · Zustand · Zod · Motion · Vitest · Playwright · Capacitor 8"],
    ],
    toc: "Contents",
    s1: "1. Overview",
    s1intro: "Quizzical Club is a Jeopardy-style trivia game for family and classroom sessions. One codebase powers the website (GitHub Pages) and the mobile apps (Capacitor Android/iOS shells). No server, no accounts; all saves stay on the device.",
    s1intro2: "Content grew out of puzzle & trivia books and the 'Use of English Jeopardy' series. Audience: families and students preparing for English olympiads (idioms, wordplay, proverbs).",
    s11: "1.1. Goals",
    goals: [
      "Team play on one device: a host reads the clue, teams answer, points are awarded manually.",
      "Solo practice by puzzle type with fuzzy answer checking and local best scores.",
      "A strategy guide for every puzzle type.",
      "Training notes on the hardest categories to plan olympiad prep.",
      "Short sessions: long games split into parts of ≤ 3 boards; early finish to results at any time.",
    ],
    s12: "1.2. Key facts",
    factMetric: "Metric", factValue: "Value",
    facts: [
      ["Games (source)", "17 — arenas I–IV, Arena Mix, 5 book sets, 7 classic sets"],
      ["Playable entries", "26 parts (long games split into ≤ 3 boards)"],
      ["Clue vault", "≈ 1,690 (540 book + 275 UoE + 870 classic)"],
      ["Tests", "53 unit (vitest) + 88 e2e (playwright, desktop + mobile)"],
      ["CI/CD", "Pages deploy with e2e gate · Android APK+AAB · iOS build check (macOS)"],
    ],

    s2: "2. Current functionality",
    s21: "2.1. Team Jeopardy",
    team: [
      "Game list grouped by series (Idiom Arenas / Book Club / Classic Vault); long games appear as parts ('Part N of M') with exact board and clue counts.",
      "Team setup: 1–4 teams, remembered names; 'Final wager round' toggle with per-game default, persisted choice.",
      "5×5 board (4-column classic rounds supported); values escalate by round within a part (100–500 × 1–3).",
      "On desktop, activity windows (clue, wager) hug the left edge (≤ 46% width) so the board and scoreboard stay visible; full width on mobile.",
      "Host flow: tile → clue → Reveal → award a team or 'Nobody'. Classic clues carry host notes under the answer.",
      "'Завершить игру' (finish early) button on the board (disabled while a clue is open) → confirm: to the final / straight to results / cancel; winner screen marks 'Завершено досрочно'; unplayed tiles never count as misses.",
      "Wagered final round; winner screen with standings and Training notes: this game's hardest categories plus the all-time drill list.",
      "Web Audio synthesized SFX (no assets), mutable; reduced-motion supported.",
    ],
    s22: "2.2. Workbook",
    wb: [
      "10 puzzle types + 'Everything'; Easy / Medium / Hard level filter.",
      "Test length 5 / 10 / 20 (default 10), remembered; options larger than the pool are disabled with a hint.",
      "Fuzzy answer checking (typos, articles, '/' alternates); results 'X of N' + percentage; best scores keyed by type × level × length; legacy bests migrate as N=10.",
    ],
    s23: "2.3. Guides",
    guides: ["13 guides: rules, a worked example, strategy tips; 'Practice this type' jumps into the workbook."],
    s24: "2.4. Content & games",
    seriesHead: ["Series", "Games", "Content source"],
    series: [
      ["Idiom Arenas", "Arena I–IV (2 parts each), Arena Mix (3 random boards of 21)", "Use of English Jeopardy + classic remixes"],
      ["Book Club", "5 sets (2 boards + final)", "Book dataset (63 categories, 540 clues)"],
      ["Classic Vault", "7 sets → parts of ≤ 3 boards; Grand Marathon → 5 parts", "Classic sets (38 boards, 174 categories)"],
    ],
    anon: "All content is anonymized: no source book titles or author names appear in the app (regression-tested).",
    s25: "2.5. Mobile app",
    mob: [
      "Capacitor 8: native android/ and ios/ projects over the shared codebase; appId com.quizzicalclub.app (renaming documented).",
      "Brand icons (sage Q tile) generated for both platforms; safe-area insets for notches.",
      "CI: android.yml builds debug APK + release AAB artifacts; ios.yml verifies the build compiles on macOS (unsigned).",
      "Store & monetization guide: docs/STORE_GUIDE.md (signing, Data safety = no data collected, ratings, pricing options).",
    ],
  },
};

/* ====== разделы 3–8 (архитектура, тесты, руководство, шаблон, бэклог, глоссарий) ====== */
Object.assign(L.ru, {
  s3: "3. Архитектура",
  s31: "3.1. Принципы",
  arch: [
    "Статический SPA: хэш-роутинг, base './' — работает на любом подпути Pages и внутри WebView.",
    "Правила отделены от рендера: логика в zustand-сторах и чистых функциях lib/; анимации не могут повредить состояние.",
    "Данные валидируются Zod при загрузке; сейвы версионируются, повреждённые сбрасываются к дефолтам; миграции ключей — в loadRecords().",
    "Доски строятся seeded-рандомом (mulberry32); порядок вопросов в категории = возрастание сложности из источника.",
  ],
  s32: "3.2. Структура репозитория",
  tree: [
    "app/src/data/     — контент: quizJson.ts, uoeGames.ts, legacyBoards.ts, arena3/4Boards.ts, games.ts, guides.ts",
    "app/src/lib/      — движок: board.ts (доски, миксы, разбиение на части), random.ts, answerMatch.ts,",
    "                    saves.ts (сейвы + миграции), stats.ts (drill list), schema.ts (Zod)",
    "app/src/store/    — teamStore.ts (командная игра), workbookStore.ts (тренажёр)",
    "app/src/pages/    — Home, Sets, TeamSetup, TeamGame, Workbook, Guides",
    "app/src/components/ — BoardGrid, HostClueModal, FinalWager, WinnerScreen (+Training notes), Scoreboard",
    "app/android/ · app/ios/ — нативные проекты Capacitor;  docs/STORE_GUIDE.md — публикация",
    "app/tests/unit/ — vitest;  app/e2e/ — playwright (club, arenas, marathon, allGames)",
  ],
  s33: "3.3. Жизненный цикл командной игры",
  flow1: "sets → setup (команды + переключатель финала) → board → clue (reveal + award) → … → last board →",
  flow2: "final (если включён) → winner (таблица + Training notes). В любой точке доски: «Завершить игру» → к финалу или сразу к итогам.",
  flow3: "Длинные игры автоматически делятся на части ≤ 3 досок (splitGameIntoParts); Arena Mix материализует 3 случайные доски при старте (materializeGame).",

  s4: "4. Тестирование и качество",
  tests: [
    "Юнит (53): доски, разбиение на части (без потерь и дублей, мультиплаеры 1–3), валидность сетов, пулы воркбука, матчер, сейвы и миграции, статистика, анонимизация.",
    "E2E (88): командный цикл, тренажёр (включая длину 5/10/20 и сохранение выбора), гайды, переключатель финала, досрочное завершение (отмена/к итогам/к финалу), марафон части 1 с точным счётом 45 000, прохождение всех 26 частей до подиума с независимо вычисленной суммой — на десктопе и мобильном.",
    "Тестовый хук: window.__teamStore доступен только на localhost; в проде его нет.",
  ],
  s41: "4.1. CI/CD",
  cicd: "Пуш в main: npm ci → tsc → vitest → playwright (десктоп-гейт) → vite build → deploy-pages. Отдельно: android.yml (APK+AAB артефакты) и ios.yml (проверка сборки на macos-latest). Регрессия правил или контента блокирует деплой.",
  cicdCode: ".github/workflows/: deploy.yml (Pages+e2e), android.yml, ios.yml",

  s5: "5. Как добавлять фичи (руководство разработчика)",
  s51: "5.1. Новая игра из существующих досок",
  newGame: [
    "Добавьте запись GameDef в app/src/data/games.ts (bookRounds по именам категорий и/или boardRounds по id досок).",
    "Длиннее 3 досок — разбиение на части произойдёт автоматически, ничего дополнительно не нужно.",
    "npm test проверит ссылки, полноту 5×5 и дубли; allGames.spec.ts подхватит игру в e2e автоматически.",
  ],
  s52: "5.2. Новый контент (доска/категории)",
  newContent: [
    "Массив BoardGame: { id, title, categories: [{ name, clues: [{ clue, answer, note? }] }] } — 5 вопросов на категорию.",
    "Зарегистрируйте в ALL_BOARDS в app/src/lib/board.ts; проверьте пересечения вопросов с существующими аренами.",
    "Для мобильных артефактов после правок: npm run sync; сборка нативных проектов — в CI.",
  ],
  s53: "5.3. Новый тип задания для воркбука",
  newType: [
    "TaskType + TASK_TYPE_LABELS (categoryTypes.ts), разметка CATEGORY_TYPES; гайд в guides.ts с тем же type.",
    "Тесты покрытия типов и пулов — в tests/unit/workbook.test.ts.",
  ],
  s54: "5.4. Новая механика движка",
  newMech: [
    "Логика — в store (действия) или lib (чистые функции), не в компонентах.",
    "Сначала юнит-тест, затем e2e; CI повторит оба на пуше (деплой блокируется при падении).",
  ],
  s55: "5.5. Правила кода",
  codeRules: [
    "TypeScript strict + verbatimModuleSyntax (import type для типов).",
    "Цвета — только из темы (src/index.css); новые окна активностей — левое позиционирование на lg по образцу HostClueModal.",
    "Анимации — motion/react; всегда учитывать useMotionSafe().",
  ],

  s6: "6. Шаблон постановки будущей фичи",
  cardIntro: "Для каждой новой задачи заполняйте карточку (так написаны ТЗ 1–3 этой версии):",
  cardHead: ["Поле", "Содержание"],
  card: [
    ["Название", "Коротко: «Таймер на ответ в командной игре»"],
    ["Цель", "Зачем (для кого и что улучшит)"],
    ["Затронутые модули", "Например: store/teamStore.ts, components/HostClueModal.tsx"],
    ["Данные/контент", "Нужны ли новые доски/категории/поля в схемах Zod"],
    ["Критерии приёмки", "Проверяемые утверждения (и как это тестировать)"],
    ["Тесты", "Юнит: … · E2E: …"],
    ["Риски", "Обратная совместимость сейвов, производительность, a11y"],
  ],

  s7: "7. Открытые направления (бэклог)",
  backlog: [
    "Кнопка «Practice these» из drill list → тест по проваленным категориям.",
    "Подписанный релизный AAB через секреты репозитория; TestFlight-архив для iOS из CI.",
    "Экспорт/импорт статистики (JSON) между устройствами.",
    "Печатные карточки для офлайн-игры (генерация PDF из досок).",
    "Таймер на ответ в командном режиме (опционально).",
  ],

  s8: "8. Глоссарий",
  glosHead: ["Термин", "Значение"],
  glossary: [
    ["Доска (board)", "Один раунд: 4–5 категорий × 5 вопросов"],
    ["Часть (part)", "Игра после разбиения: ≤ 3 досок; ценности заново от 100–500"],
    ["Арена", "Игра из идиомных досок (UoE / сборки классики)"],
    ["Nobody", "Плитка без ответа — сигнал для drill list"],
    ["Drill list", "Категории с наибольшим числом промахов (игра и all-time)"],
    ["Материализация", "Сэмплирование досок микс-игры при старте"],
    ["Capacitor", "Нативная оболочка над веб-приложением (Android/iOS)"],
  ],
  outro: "Конец документа. Шаблон расширяется: новые разделы добавляются после раздела 6; версии нумеруются.",
  footer: "Quizzical Club — ТЗ · стр. ",
});

Object.assign(L.en, {
  s3: "3. Architecture",
  s31: "3.1. Principles",
  arch: [
    "Static SPA: hash routing, base './' — works on any Pages subpath and inside a WebView.",
    "Rules are separate from rendering: logic lives in zustand stores and pure lib/ functions; animation cannot corrupt state.",
    "Data is Zod-validated at load; saves are versioned, corrupt saves reset to defaults; key migrations live in loadRecords().",
    "Boards are built with a seeded rng (mulberry32); clue order within a category = source difficulty order.",
  ],
  s32: "3.2. Repository layout",
  tree: [
    "app/src/data/     — content: quizJson.ts, uoeGames.ts, legacyBoards.ts, arena3/4Boards.ts, games.ts, guides.ts",
    "app/src/lib/      — engine: board.ts (boards, mixes, part splitting), random.ts, answerMatch.ts,",
    "                    saves.ts (saves + migrations), stats.ts (drill list), schema.ts (Zod)",
    "app/src/store/    — teamStore.ts (team game), workbookStore.ts (practice tests)",
    "app/src/pages/    — Home, Sets, TeamSetup, TeamGame, Workbook, Guides",
    "app/src/components/ — BoardGrid, HostClueModal, FinalWager, WinnerScreen (+Training notes), Scoreboard",
    "app/android/ · app/ios/ — Capacitor native projects;  docs/STORE_GUIDE.md — store submission",
    "app/tests/unit/ — vitest;  app/e2e/ — playwright (club, arenas, marathon, allGames)",
  ],
  s33: "3.3. Team game lifecycle",
  flow1: "sets → setup (teams + final toggle) → board → clue (reveal + award) → … → last board →",
  flow2: "final (if enabled) → winner (standings + Training notes). Anywhere on the board: early finish → to the final or straight to results.",
  flow3: "Long games auto-split into parts of ≤ 3 boards (splitGameIntoParts); Arena Mix samples 3 random boards at start (materializeGame).",

  s4: "4. Testing & quality",
  tests: [
    "Unit (53): boards, part splitting (no losses/dupes, ×1–3 multipliers), set validity, workbook pools, matcher, saves & migrations, stats, content anonymization.",
    "E2E (88): team loop, workbook (incl. 5/10/20 lengths and persisted choice), guides, final toggle, early finish (cancel/results/final), marathon part 1 with exact 45,000 score, all 26 parts played to the podium with independently computed totals — desktop and mobile.",
    "Test hook: window.__teamStore exists on localhost only; production never ships it.",
  ],
  s41: "4.1. CI/CD",
  cicd: "Push to main: npm ci → tsc → vitest → playwright (desktop gate) → vite build → deploy-pages. Separately: android.yml (APK+AAB artifacts) and ios.yml (macOS build check). Rule or content regressions block deploys.",
  cicdCode: ".github/workflows/: deploy.yml (Pages+e2e), android.yml, ios.yml",

  s5: "5. How to add features",
  s51: "5.1. New game from existing boards",
  newGame: [
    "Add a GameDef entry in app/src/data/games.ts (bookRounds by category names and/or boardRounds by board ids).",
    "Longer than 3 boards? The part split happens automatically — nothing else to do.",
    "npm test validates references, 5×5 completeness and dupes; allGames.spec.ts picks the game up in e2e automatically.",
  ],
  s52: "5.2. New content (a board / categories)",
  newContent: [
    "BoardGame array: { id, title, categories: [{ name, clues: [{ clue, answer, note? }] }] } — 5 clues per category.",
    "Register it in ALL_BOARDS in app/src/lib/board.ts; check clue overlap with existing arenas.",
    "For mobile artifacts after edits: npm run sync; native builds run in CI.",
  ],
  s53: "5.3. New workbook puzzle type",
  newType: [
    "TaskType + TASK_TYPE_LABELS (categoryTypes.ts), tag CATEGORY_TYPES; add a guide in guides.ts with the same type.",
    "Type/pool coverage tests live in tests/unit/workbook.test.ts.",
  ],
  s54: "5.4. New engine mechanic",
  newMech: [
    "Logic goes into a store (actions) or lib (pure functions) — never components.",
    "Unit test first, then e2e; CI repeats both on push (deploys block on failure).",
  ],
  s55: "5.5. Code rules",
  codeRules: [
    "TypeScript strict + verbatimModuleSyntax (import type for types).",
    "Colors only from the theme (src/index.css); new activity windows follow HostClueModal's left alignment on lg.",
    "Animations via motion/react; always respect useMotionSafe().",
  ],

  s6: "6. Feature card template",
  cardIntro: "Fill this card for every new task (TZ 1–3 of this version were written this way):",
  cardHead: ["Field", "Content"],
  card: [
    ["Name", "Short: 'Answer timer in team mode'"],
    ["Goal", "Why (for whom, what it improves)"],
    ["Affected modules", "E.g.: store/teamStore.ts, components/HostClueModal.tsx"],
    ["Data/content", "New boards/categories? Zod schema fields?"],
    ["Acceptance criteria", "Testable statements (and how to test them)"],
    ["Tests", "Unit: … · E2E: …"],
    ["Risks", "Save compatibility, performance, a11y"],
  ],

  s7: "7. Backlog ideas",
  backlog: [
    "'Practice these' button from the drill list → workbook test on the missed categories.",
    "Signed release AAB via repository secrets; TestFlight archive for iOS from CI.",
    "Export/import stats (JSON) between devices.",
    "Printable cards for offline play (PDF generated from boards).",
    "Optional answer timer in team mode.",
  ],

  s8: "8. Glossary",
  glosHead: ["Term", "Meaning"],
  glossary: [
    ["Board", "One round: 4–5 categories × 5 clues"],
    ["Part", "A split game: ≤ 3 boards; values restart at 100–500"],
    ["Arena", "An idiom-board game (UoE / classic remixes)"],
    ["Nobody", "A tile nobody answered — feeds the drill list"],
    ["Drill list", "Categories with the most misses (per game and all-time)"],
    ["Materialization", "Sampling a mix game's boards at start"],
    ["Capacitor", "Native shell over the web app (Android/iOS)"],
  ],
  outro: "End of document. The template grows with the project: new sections go after section 6; versions are numbered.",
  footer: "Quizzical Club — TS · p. ",
});

/* ===================== СБОРКА ===================== */
function build(t) {
  return new Document({
    creator: "Quizzical Club",
    title: t.docTitle,
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: "2E3A33" },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "4F7A5D" },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        footers: {
          default: new Footer({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: t.footer, size: 18, color: "7A857D" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "7A857D" }),
            ] })],
          }),
        },
        children: [
          // Титул
          new Paragraph({ spacing: { before: 2400 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "QUIZZICAL CLUB", font: "Arial", size: 56, bold: true, color: "4F7A5D" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: t.titleMain, size: 36, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: t.titleSub, size: 24, color: "7A857D" })] }),
          new Paragraph({ spacing: { before: 1200 } }),
          table([t.metaField, t.metaValue], t.meta, [2800, 6226]),
          new Paragraph({ children: [new PageBreak()] }),

          new TableOfContents(t.toc, { hyperlink: true, headingStyleRange: "1-2" }),
          new Paragraph({ children: [new PageBreak()] }),

          H1(t.s1), P(t.s1intro), P(t.s1intro2),
          H2(t.s11), ...t.goals.map(bullet),
          H2(t.s12), table([t.factMetric, t.factValue], t.facts, [3400, 5626]),
          new Paragraph({ children: [new PageBreak()] }),

          H1(t.s2),
          H2(t.s21), ...t.team.map(bullet),
          H2(t.s22), ...t.wb.map(bullet),
          H2(t.s23), ...t.guides.map(bullet),
          H2(t.s24), table(t.seriesHead, t.series, [2400, 3800, 2826]), P(""), P(t.anon),
          H2(t.s25), ...t.mob.map(bullet),
          new Paragraph({ children: [new PageBreak()] }),

          H1(t.s3),
          H2(t.s31), ...t.arch.map(bullet),
          H2(t.s32), ...t.tree.map(code),
          H2(t.s33), num(t.flow1), num(t.flow2), P(t.flow3),
          new Paragraph({ children: [new PageBreak()] }),

          H1(t.s4), ...t.tests.map(bullet),
          H2(t.s41), P(t.cicd), code(t.cicdCode),
          new Paragraph({ children: [new PageBreak()] }),

          H1(t.s5),
          H2(t.s51), ...t.newGame.map(num),
          H2(t.s52), ...t.newContent.map(num),
          H2(t.s53), ...t.newType.map(num),
          H2(t.s54), ...t.newMech.map(num),
          H2(t.s55), ...t.codeRules.map(bullet),
          new Paragraph({ children: [new PageBreak()] }),

          H1(t.s6), P(t.cardIntro), table(t.cardHead, t.card, [2600, 6426]),
          H1(t.s7), ...t.backlog.map(bullet),
          H1(t.s8), table(t.glosHead, t.glossary, [3000, 6026]),
          P(""),
          P(t.outro, { run: { italics: true, color: "7A857D" } }),
        ],
      },
    ],
  });
}

(async () => {
  for (const lang of ["ru", "en"]) {
    const buf = await Packer.toBuffer(build(L[lang]));
    fs.writeFileSync(L[lang].file, buf);
    console.log("written:", L[lang].file, buf.length, "bytes");
  }
})();
