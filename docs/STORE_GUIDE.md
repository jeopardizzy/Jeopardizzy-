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
2. **Play Console** → Create app → загрузите подписанный AAB в Internal testing.
3. **Анкета данных (Data safety)**: приложение НЕ собирает и НЕ передаёт
   никаких данных — все сейвы локальные (localStorage). Отвечайте «No data
   collected» — это сильно упрощает ревью.
4. **Возрастной рейтинг**: контент подходит всем (викторина без жестокости) —
   пройдите анкету IARC, ожидаемо «Everyone».
5. **Контент**: скриншоты 2+ (телефон), иконка 512, feature graphic 1024×500,
   описание. Приложение без рекламы и без IAP в базовой конфигурации.

## App Store (iOS)

Сборка требует macOS. Варианты:
- **CI (рекомендуется без Mac)**: workflow `ios.yml` уже проверяет сборку на
  `macos-latest`. Для релиза добавьте сертификаты компании как secrets и
  расширьте шаг до `xcodebuild archive` + `xcodebuild -exportArchive`.
- **Свой Mac**: `npx cap open ios` → Xcode → Signing: выберите команду
  разработчика компании → Product → Archive → Upload to App Store Connect.

Дальше: **App Store Connect** → New App → заполните карточку → загрузите билд
→ TestFlight для внутренней проверки → Submit for review.
Анкета приватности: «Data Not Collected». Рейтинг: 4+.

## Монетизация (варианты по возрастанию сложности)

| Модель | Что нужно | Плюсы/минусы |
|---|---|---|
| Платное приложение | Цена в консоли, без кода | Просто, без SDK; ниже конверсия |
| Freemium (IAP «Full unlock») | RevenueCat или нативный billing | Стандарт индустрии; нужен код |
| Реклама (AdMob / AppLovin) | SDK + согласие + анкета «Has ads» | Портит спокойную эстетику |

Базовая сборка намеренно чистая: никаких трекеров и рекламы — ревью в обоих
сторах это облегчает. Для IAP рекомендуется RevenueCat (один SDK на оба стора).
