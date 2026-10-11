/** Генератор техзадания проекта Quizzical Club (DOCX). */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TableOfContents,
} = require("docx");

const B = { style: BorderStyle.SINGLE, size: 1, color: "C9CFC9" };
const BORDERS = { top: B, bottom: B, left: B, right: B };
const HEAD_FILL = { fill: "E3EFE4", type: ShadingType.CLEAR };
const CW = 9026; // A4 content width

const H1 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const H2 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const P = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: [new TextRun({ text, ...(opts.run || {}) })],
  });
const bullet = (text) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun(text)],
  });
const num = (text) =>
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun(text)],
  });
const code = (text) =>
  new Paragraph({
    spacing: { after: 60 },
    shading: { fill: "F2F0E6", type: ShadingType.CLEAR },
    indent: { left: 240 },
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
            children: [
              new Paragraph({
                children: [new TextRun({ text: c, bold: !!isHead })],
              }),
            ],
          }),
      ),
    });
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: w,
    rows: [mkRow(headers, true), ...rows.map((r) => mkRow(r, false))],
  });
}

const doc = new Document({
  creator: "Quizzical Club",
  title: "Quizzical Club — Техническое задание",
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
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Quizzical Club — ТЗ · стр. ", size: 18, color: "7A857D" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "7A857D" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ===== Титул =====
        new Paragraph({ spacing: { before: 2400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "QUIZZICAL CLUB", font: "Arial", size: 56, bold: true, color: "4F7A5D" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Техническое задание проекта", size: 36, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "Командная игра-викторина + тренажёр для олимпиадной подготовки", size: 24, color: "7A857D" })],
        }),
        new Paragraph({ spacing: { before: 1200 } }),
        table(
          ["Поле", "Значение"],
          [
            ["Версия документа", "1.0 (шаблон для развития)"],
            ["Дата", "11 октября 2026"],
            ["Продакшн", "https://jeopardizzy.github.io/Jeopardizzy-/"],
            ["Репозиторий", "https://github.com/jeopardizzy/Jeopardizzy-"],
            ["Статус", "В эксплуатации, активная разработка"],
            ["Стек", "Vite 8 · React 19 · TypeScript (strict) · Tailwind 4 · Zustand · Zod · Motion · Vitest · Playwright"],
          ],
          [2800, 6226],
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== Оглавление =====
        new TableOfContents("Содержание", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 1. Общие сведения =====
        H1("1. Общие сведения"),
        P("Quizzical Club — браузерная игра-викторина в формате Jeopardy для семейных и учебных сессий. Сайт полностью статический, работает на GitHub Pages, не требует сервера, аккаунтов и интернет-зависимостей после первой загрузки."),
        P("Проект вырос из книжного контента (сборники головоломок и викторин) и серии игр «Use of English Jeopardy». Основная аудитория — семья и ученики, готовящиеся к олимпиадам по английскому языку (идиомы, словесные игры, пословицы)."),
        H2("1.1. Цели проекта"),
        bullet("Командная игра за одним устройством: ведущий читает вопрос, команды отвечают, очки начисляются вручную."),
        bullet("Соло-тренировка по типам заданий с проверкой ответов и историей лучших результатов."),
        bullet("Справочник стратегий (Guides) по каждому типу головоломок."),
        bullet("Статистика трудных категорий для планирования подготовки к олимпиадам."),
        H2("1.2. Ключевые факты о текущей версии"),
        table(
          ["Метрика", "Значение"],
          [
            ["Игр на выбор", "17 (4 арены + микс + 5 книжных сетов + 7 классических)"],
            ["Вопросов в хранилище", "≈ 1 690 (540 книжных + 275 UoE + 870 классических, с пересечениями)"],
            ["Досок в игре", "от 2 до 14 (Гранд-Марафон)"],
            ["Тестов", "47 юнит (vitest) + 56 e2e (playwright)"],
            ["CI", "GitHub Actions: typecheck → юнит → e2e-гейт → деплой на Pages"],
          ],
          [3400, 5626],
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 2. Текущая функциональность =====
        H1("2. Текущая функциональность (что уже сделано)"),
        H2("2.1. Team Jeopardy (командный режим)"),
        bullet("Экран выбора игры списком, сгруппированный по сериям: Idiom Arenas / Book Club / Classic Vault. На карточке — уровень сложности, число досок и точное число вопросов."),
        bullet("Настройка команд: 1–4 команды, имена запоминаются между сессиями; переключатель «Final wager round» (финальная ставка) с дефолтом по типу игры и сохранением выбора."),
        bullet("Доска 5×5 (поддерживаются и 4-колоночные раунды классики): значения растут с номером раунда (100–500 × N)."),
        bullet("Ведущий открывает плитку → читает вопрос → Reveal → начисляет очки команде или «Nobody». Заметки для ведущего показываются под ответом у классических вопросов."),
        bullet("Активная команда подсвечена и пульсирует; очки анимируются; звуковые эффекты синтезируются через Web Audio (без файлов), есть отключение звука и reduced-motion."),
        bullet("Финал со ставками (для книжных сетов и по переключателю для остальных): каждая команда ставит до своей суммы, ведущий отмечает верно/неверно по каждой."),
        bullet("Экран победителя: турнирная таблица, блок «Training notes» — самые трудные категории этой игры и all-time drill list."),
        H2("2.2. Workbook (тренажёр)"),
        bullet("10 типов заданий + «Everything»: Homonyms, Compound Words, Word Parts, Backwords, Heteronyms, Letter Trivia, Initials, Hidden Words, Title Swap, Geography, General Knowledge."),
        bullet("Фильтр сложности (Easy / Medium / Hard), тест из 10 вопросов, нечёткая проверка ответов (опечатки, артикли, варианты через «/»)."),
        bullet("Экран результатов с разбором ошибок; лучший результат по каждой паре «тип × уровень» хранится локально."),
        H2("2.3. Guides (гайды)"),
        bullet("13 гайдов по типам заданий: правила, разобранный пример, стратегические советы; кнопка «Practice this type» ведёт в тренажёр."),
        H2("2.4. Контент и игры"),
        table(
          ["Серия", "Игры", "Источник контента"],
          [
            ["Idiom Arenas", "Arena I–IV (5–6 досок), Arena Mix (5 случайных досок из 21)", "Use of English Jeopardy + сборка из классики"],
            ["Book Club", "First Words, Around the World, Names & Faces, Brain Stretchers, Championship", "Книжный датасет (63 категории, 540 вопросов)"],
            ["Classic Vault", "Wordplay Classics … Grand Marathon (14 досок, 345 вопросов)", "Классические сеты первого сайта (38 досок, 174 категории)"],
          ],
          [2400, 3800, 2826],
        ),
        P(""),
        P("Весь контент анонимизирован: названия и авторы исходных книг в приложении не упоминаются (есть регрессионный тест)."),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 3. Архитектура =====
        H1("3. Архитектура"),
        H2("3.1. Принципы"),
        bullet("Статический SPA: хэш-роутинг (#/sets, #/game, #/workbook, #/guides), base './' — работает на любом подпути GitHub Pages."),
        bullet("Игровые правила отделены от рендера: вся логика в zustand-сторах и чистых функциях lib/, анимации не могут повредить состояние."),
        bullet("Данные валидируются Zod-схемами при загрузке модуля; сейвы версионируются и восстанавливаются после повреждений."),
        bullet("Определённость где важно: доски строятся seeded-рандомом (mulberry32), порядок вопросов в категории = возрастание сложности из источника."),
        H2("3.2. Структура репозитория"),
        code("app/src/data/     — контент: quizJson.ts (книги), uoeGames.ts, legacyBoards.ts,"),
        code("                    arena3Boards.ts, arena4Boards.ts, games.ts, guides.ts, categoryTypes.ts"),
        code("app/src/lib/      — движок: board.ts (генерация досок, миксы), random.ts,"),
        code("                    answerMatch.ts (нечёткая проверка), saves.ts (сейвы), stats.ts, schema.ts (Zod)"),
        code("app/src/store/    — teamStore.ts (командная игра), workbookStore.ts (тренажёр)"),
        code("app/src/pages/    — Home, Sets, TeamSetup, TeamGame, Workbook, Guides"),
        code("app/src/components/ — BoardGrid, HostClueModal, FinalWager, WinnerScreen, Scoreboard, Toggles"),
        code("app/tests/unit/   — vitest;  app/e2e/ — playwright (club, arenas, marathon, allGames)"),
        H2("3.3. Жизненный цикл командной игры"),
        num("sets → setup (команды + переключатель финала) → board (раунд N) → clue (reveal + award) → … → last board →"),
        num("final-wager/final-clue (если включено) → winner (таблица + Training notes)."),
        P("Микс-игры (Arena Mix) материализуются при старте: materializeGame() сэмплирует 5 досок seeded-рандомом, дальше игра идёт как обычная."),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 4. Тестирование и CI/CD =====
        H1("4. Тестирование и качество"),
        bullet("Юнит (47): генерация досок, валидность сетов против датасета, пулы воркбука, покрытие гайдов, матчер ответов, сейвы (включая восстановление после повреждённого JSON), статистика, анонимизация контента."),
        bullet("E2E (56): полный командный цикл, тренажёр до результатов, гайды, переключатель финальной ставки, марафон из 14 досок с точным счётом (766 500), прохождение ВСЕХ 17 игр до подиума с независимо вычисленной суммой очков — на десктопе и мобильном вьюпорте."),
        bullet("Тестовый хук: стор доступен как window.__teamStore только на localhost — продакшн его не содержит."),
        H2("4.1. CI/CD"),
        P("Каждый пуш в main запускает: npm ci → tsc -b → vitest → playwright (desktop) → vite build → deploy-pages. Сломанный контент или регрессия правил блокируют деплой."),
        code(".github/workflows/deploy.yml — единственный пайплайн; gh-pages не используется, Pages source = GitHub Actions."),

        // ===== 5. Руководство разработчика =====
        new Paragraph({ children: [new PageBreak()] }),
        H1("5. Как добавлять фичи (руководство разработчика)"),
        H2("5.1. Новая игра из существующих досок"),
        num("Откройте app/src/data/games.ts и добавьте запись GameDef: id, name, emoji, blurb, level, bookRounds (категории из quizJson по имени) и/или boardRounds (id досок из uoeGames/legacyBoards/arena*), final, series."),
        num("Запустите npm test — тесты проверят ссылки на категории/доски, полноту 5×5 и отсутствие повторов категорий внутри игры."),
        num("E2E-прогон всех игр (allGames.spec.ts) подхватит новую игру автоматически."),
        H2("5.2. Новый контент (доска/категории)"),
        num("Сформируйте массив BoardGame: { id, title, categories: [{ name, clues: [{ clue, answer, note? }] }] } — по 5 вопросов на категорию."),
        num("Положите в app/src/data/ (по образцу arena4Boards.ts) и зарегистрируйте в ALL_BOARDS в app/src/lib/board.ts."),
        num("Проверьте пересечения вопросов с существующими аренами (скрипт-анализ на основе нормализованного текста вопроса)."),
        H2("5.3. Новый тип задания для воркбука"),
        num("Добавьте тип в TaskType + TASK_TYPE_LABELS (categoryTypes.ts) и разметьте категории в CATEGORY_TYPES."),
        num("Добавьте гайд в guides.ts (type должен совпадать) — тест «есть гайд для каждого типа» это проверит."),
        H2("5.4. Новая фича в игровом движке"),
        num("Логику добавляйте в store (действия) или lib (чистые функции) — не в компоненты."),
        num("Сначала юнит-тест в tests/unit/, затем e2e-сценарий в e2e/ (для полного цикла есть хук window.__teamStore)."),
        num("Проверьте npm test && npx playwright test локально; CI повторит это на пуше."),
        H2("5.5. Правила оформления кода"),
        bullet("TypeScript strict, verbatimModuleSyntax: типы импортируются через import type."),
        bullet("Цвета только из темы (src/index.css, палитра sage/butter/cream) — не хардкодить hex в компонентах, кроме командных цветов."),
        bullet("Анимации — через motion/react; уважать useMotionSafe() (reduced motion)."),

        // ===== 6. Шаблон карточки фичи =====
        new Paragraph({ children: [new PageBreak()] }),
        H1("6. Шаблон постановки будущей фичи"),
        P("Для каждой новой задачи заполняйте карточку:"),
        table(
          ["Поле", "Содержание"],
          [
            ["Название", "Коротко: «Таймер на ответ в командной игре»"],
            ["Цель", "Зачем (для кого и что улучшит)"],
            ["Затронутые модули", "Например: store/teamStore.ts, components/HostClueModal.tsx"],
            ["Данные/контент", "Нужны ли новые доски/категории/поля в схемах Zod"],
            ["Критерии приёмки", "Проверяемые утверждения (и как это тестировать)"],
            ["Тесты", "Юнит: … · E2E: …"],
            ["Риски", "Обратная совместимость сейвов, производительность, a11y"],
          ],
          [2600, 6426],
        ),

        // ===== 7. Открытые направления =====
        H1("7. Открытые направления (бэклог-идеи)"),
        bullet("Кнопка «Practice these» из drill list → тест в воркбуке по проваленным категориям."),
        bullet("Таймер на ответ в командном режиме (опционально)."),
        bullet("Экспорт/импорт статистики (JSON) для переноса между устройствами."),
        bullet("Печатные карточки для офлайн-игры (генерация PDF из досок)."),
        bullet("Новые арены из дополнительных источников заданий."),

        // ===== 8. Глоссарий =====
        H1("8. Глоссарий"),
        table(
          ["Термин", "Значение"],
          [
            ["Доска (board)", "Один раунд: 4–5 категорий × 5 вопросов"],
            ["Сет / игра (game)", "Несколько досок подряд + опциональный финал со ставкой"],
            ["Арена", "Игра из идиомных досок (UoE / сборки классики)"],
            ["Nobody", "Плитка, которую не ответила ни одна команда (сигнал для drill list)"],
            ["Drill list", "Список категорий с наибольшим числом промахов"],
            ["Материализация", "Превращение микс-игры в конкретный набор досок при старте"],
          ],
          [3000, 6026],
        ),
        P(""),
        P("Конец документа. Шаблон расширяется по мере роста проекта: новые разделы добавляются после раздела 6, версии документа нумеруются.", { run: { italics: true, color: "7A857D" } }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("../../ТЗ_Quizzical_Club.docx", buf);
  console.log("written: ТЗ_Quizzical_Club.docx", buf.length, "bytes");
});
