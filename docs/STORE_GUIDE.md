# Quizzical Club — гайд по публикации в сторах

Мобильное приложение — это нативная оболочка Capacitor поверх того же кода,
что работает на сайте. Весь игровой контент, тесты и механики общие.

## Архитектура

```
app/src/            ← общий код (веб + мобайл, одна кодовая база)
app/capacitor.config.ts  ← конфиг оболочки (appId: com.quizzicalclub.app)
app/android/        ← нативный Android-проект (Gradle)
app/ios/            ← нативный iOS-проект (Xcode/CocoaPods)
app/assets/         ← мастер-иконки (icon.png 1024×1024)
```

Команды:
```bash
npm run sync      # собрать веб и скопировать в нативные проекты
npm run apk       # собрать debug APK (нужны JDK + Android SDK)
npx cap open android   # открыть проект в Android Studio
npx cap open ios       # открыть проект в Xcode (только macOS)
```

После смены мастер-иконок: `npx capacitor-assets generate --android --ios`.

## Смена package name / bundle ID

Сейчас `com.quizzicalclub.app`. Для компании поменяйте на свой
(например, `com.mycompany.quizzical`):
1. `app/capacitor.config.ts` → поле `appId`
2. `app/android/app/build.gradle` → `applicationId`
3. `npx cap sync` — и для iOS в Xcode: target App → Bundle Identifier.

## Google Play (Android)

1. **Релизная сборка**: CI уже собирает `app-release.aab` (без подписи).
   Подпишите локально: создайте keystore
   `keytool -genkey -v -keystore quizzical.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000`
   и соберите `./gradlew bundleRelease` с прописанным signingConfig, либо
   подпишите AAB через `jarsigner`. Keystore храните в безопасности —
   потеря = невозможность обновлять приложение (если не включён Play App Signing).
   ✅ Уже сделано: подписанный AAB собирается CI (секреты KEYSTORE_* в
   репозитории); локальная копия — `signing-local/` (gitignored, backup!).
2. **Play Console** → Create app → загрузите подписанный AAB в Internal testing.
   Подписанный AAB собирается CI автоматически (секреты KEYSTORE_* уже в
   репозитории) — скачайте артефакт `quizzical-club-android` последнего прогона
   Android build.
3. **Анкета данных (Data safety)**: приложение НЕ собирает и НЕ передаёт
   никаких данных — все сейвы локальные (localStorage). Отвечайте «No data
   collected» — это сильно упрощает ревью.
4. **Возрастной рейтинг**: контент подходит всем (викторина без жестокости) —
   пройдите анкету IARC, ожидаемо «Everyone».
5. **Контент**: скриншоты 2+ (телефон), иконка 512, feature graphic 1024×500,
   описание. Приложение без рекламы и без IAP в базовой конфигурации.
   Готовые материалы листинга лежат в `docs/listing/`:
   `play-icon-512.png`, `feature-graphic-1024x500.png`, шесть телефонных
   скриншотов (`shot-1-home` … `shot-6-workbook`) и тексты
   `description-en.txt` / `description-ru.txt` (short + full описания по
   правилам Play Console).

### Автозагрузка в Play Console из CI (internal track)

Workflow `play-upload.yml` (ручной запуск) собирает подписанный AAB и
загружает его в трек Internal через `r0adkll/upload-google-play`. Разовая
настройка:

1. В Play Console создайте приложение вручную (Create app → «Quizzical Club»,
   package `com.quizzicalclub.app`) — API не умеет создавать приложения.
2. Google Cloud Console → проект → включите «Google Play Developer API» →
   создайте service account → скачайте JSON-ключ.
3. Play Console → Users and permissions → пригласите email сервис-аккаунта →
   права «Release apps to testing tracks».
4. Положите JSON в `signing-local/play/service-account.json` и запустите
   `node tools/docgen/set-play-secrets.mjs` — секрет `PLAY_SERVICE_ACCOUNT_JSON`
   и флаг `PLAY_UPLOAD_READY` загрузятся сами.
5. Actions → «Upload to Google Play (internal)» → Run workflow — AAB уезжает
   в internal track; тестировщики увидят его по ссылке из консоли.

Локальный запасной путь: свежий подписанный AAB всегда можно скачать из
артефакта последнего «Android build» и загрузить в консоль вручную.

## App Store (iOS)

Сборка требует macOS. Варианты:
- **CI (рекомендуется без Mac)**: workflow `ios.yml` проверяет сборку на
  `macos-latest` на каждом пуше, а при наличии секретов собирает **подписанный
  .ipa** артефактом — готовый для App Store Connect (загрузка через Transporter
  app или веб-интерфейс).
- **Свой Mac**: `npx cap open ios` → Xcode → Signing: выберите команду
  разработчика компании → Product → Archive → Upload to App Store Connect.

### Подписанный .ipa из CI — что положить в Secrets

CI делает временный keychain, импортирует сертификат и профиль, собирает
archive и экспортирует .ipa. Нужны 5 секретов (см. ниже как их получить) и
одна переменная `IOS_SIGNING_READY=true`.

| Секрет | Что это |
|---|---|
| `APPLE_CERTIFICATE_BASE64` | Экспортированный .p12 дистрибьюшн-сертификат (base64) |
| `APPLE_CERTIFICATE_PASSWORD` | Пароль экспорта .p12 |
| `APPLE_PROVISIONING_PROFILE_BASE64` | App Store provisioning profile (base64) |
| `APPLE_TEAM_ID` | Team ID компании (10 символов) |
| `IOS_KEYCHAIN_PASSWORD` | Любой пароль для временного CI-keychain |

**Как получить сертификат и профиль (без Mac):**
1. Создайте CSR: `openssl req -nodes -newkey rsa:2048 -keyout ios.key -out ios.csr -subj "/CN=Your Company"`.
2. developer.apple.com → Certificates → «+» → iOS Distribution → загрузите CSR → скачайте .cer.
3. Конвертируйте в .p12: `openssl x509 -in ios.cer -inform DER -out ios.pem && openssl pkcs12 -export -inkey ios.key -in ios.pem -out dist.p12 -password pass:ВАШ_ПАРОЛЬ`.
4. developer.apple.com → Profiles → «+» → App Store → App ID `com.quizzicalclub.app` → скачайте `app.mobileprovision`.
5. Team ID: developer.apple.com → Membership details.
6. Положите файлы в `signing-local/apple/` (dist.p12, dist-password.txt, app.mobileprovision, team-id.txt) и запустите `node tools/docgen/set-ios-secrets.mjs` — секреты загрузятся сами (gitignored, в репо не попадут).

Дальше: **App Store Connect** → New App → заполните карточку → загрузите .ipa
(Transporter app, или веб-загрузка билда в разделе TestFlight) → TestFlight для
внутренней проверки → Submit for review. Анкета приватности: «Data Not
Collected». Рейтинг: 4+. Каждый новый билд должен иметь больший
CFBundleVersion — поднимайте `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` в
Xcode или через agvtool перед архивом.

Материалы карточки App Store готовы в `docs/listing/`:
`description-apple-en.txt` / `description-apple-ru.txt` (subtitle ≤ 30,
promo ≤ 170, description, keywords ≤ 100) и шесть скриншотов 6.9"
(`shot-*-ios.png`, 1320×2868 — требование iPhone 16 Pro Max). Support URL:
https://jeopardizzy.github.io/Jeopardizzy-/

## Монетизация (варианты по возрастанию сложности)

| Модель | Что нужно | Плюсы/минусы |
|---|---|---|
| Платное приложение | Цена в консоли, без кода | Просто, без SDK; ниже конверсия |
| Freemium (IAP «Full unlock») | RevenueCat или нативный billing | Стандарт индустрии; нужен код |
| Реклама (AdMob / AppLovin) | SDK + согласие + анкета «Has ads» | Портит спокойную эстетику |

Базовая сборка намеренно чистая: никаких трекеров и рекламы — ревью в обоих
сторах это облегчает. Для IAP рекомендуется RevenueCat (один SDK на оба стора).
