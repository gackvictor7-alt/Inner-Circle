# 05 – Datenbank (Cloudflare D1 / Drizzle)

**Stand:** 2026-10-02 (Profil-Social-Link TikTok; davor Badge-Verifizierungszentrum) · Basis:
`src/db/schema.ts` und Migrationen `drizzle/0000_init.sql` bis
`drizzle/0009_profile_tiktok_link.sql`.

- **Dialekt:** SQLite. In Produktion **Cloudflare D1** über das Binding `DB`
  (`database_name: inner-circle-db`), lokal/testweise **libSQL**
  (`DATABASE_URL`, Default `file:./dev.db`, Tests `file:./.test.db`).
- **Migrationen:** `0000` erstellt die Basistabellen; `0001` ergänzt
  Profil-/Discover-Spalten; `0002` Beta und Direktchat-Schlüssel; `0003`
  Trust-Bewertungen; `0004` Deal-Records; `0005` Impact/Badges; `0006` ergänzt
  `Message.readAt` und backfilled den bisherigen
  `ConversationParticipant.lastReadAt`-Stand; `0007` Badge-Verifizierungszentrum
  (`BadgeApplication.identityConfirmedAt`, `User.foundingMemberNumber` unique +
  Backfill nach Beitrittsdatum, `User.suspensionEndsAt`/`suspensionReason`);
  `0008` neue Tabelle `BadgeApplicationEvent` (lückenlose Antragshistorie);
  `0009` ergänzt `Profile.tiktokUrl` (Social-Link-Feld, nullbar, kein
  Backfill – bestehende Profile bleiben unverändert). Der bestehende
  `message_conversation_idx` unterstützt den Conversation-Filter. Die
  Korrektheit braucht keinen Zusatzindex; ohne gemessene Performance-
  Notwendigkeit wird kein weiterer Index angelegt. Insgesamt 57 Tabellen;
  keine Tabelle wird gelöscht oder umbenannt.
- **Keine Transaktionen:** D1 bietet kein Transaktions-API; mehrstufige
  Schreibvorgänge sind sequenziell und idempotent gehalten.

## Konventionen

| Konvention | Umsetzung |
| ---------- | --------- |
| IDs | Anwendungsgenerierte Text-IDs, Präfix + Zeitstempel base36 + Zufall (`src/db/ids.ts`) |
| Timestamps | Integer-Millisekunden (`mode: "timestamp_ms"`), in SQLite als Integer |
| Booleans | Integer 0/1 |
| Enums | Textspalten mit dokumentierten erlaubten Werten (kein DB-Enum) |
| JSON | Text-Spalten (`…Json`), in Anwendungs-Code geparst |
| Löschung | `onDelete: "cascade"` für besitzende Relationen, `set null` für Referenzen wie Reviewer |
| Demo-Daten | `isDemo` (Boolean) bzw. `User.seedTag`, damit Demos nie als echt gelten |
| Namensgebung | Tabellen in PascalCase (`User`, `Membership`), Spalten camelCase |

## Gruppierung der 55 Tabellen (50 aus `0000` + 2 aus `0002` + 3 aus `0004`)

### 1. Auth & Identity (4)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `User` | Konto: `email` (unique, nullable), `phone` (unique, nullable), `passwordHash`, `role` (`user`\|`admin`), `status` (`active`\|`suspended`\|`deletion_requested`), `handle` (unique), `emailVerifiedAt`, `phoneVerifiedAt`, `ageConfirmedAt`, `termsAcceptedAt`, `marketingOptIn`, `foundingMember`, `countryCode`, `locale`, `isDemo`, `seedTag`, `lastLoginAt` | **aktiv** |
| `Session` | `userId`, `tokenHash` (unique), `expiresAt`, `revokedAt`, `userAgent`, `ipHash` | **aktiv** |
| `AuthToken` | Einmal-Token: `type` (`email_verify`\|`password_reset`\|`email_change`), `tokenHash`, `expiresAt`, `usedAt` | aktiv (genutzt für `password_reset`) |
| `VerificationCode` | 6-stellige OTPs: `channel` (`email`\|`phone`), `purpose` (`verify_account`\|`login_2fa`\|`phone_change`), `target`, `codeHash`, `expiresAt`, `attempts`, `maxAttempts`, `resendCount`, `consumedAt` | aktiv (`login_2fa`, `phone_change` nur vorbereitet) |

### 2. Profiles & Nutzerpräferenzen (8)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `Profile` | `userId` (unique), `headline`, `bio`, `location`, `company`, `jobTitle`, Links (`websiteUrl`, `linkedinUrl` [DEPRECATED in UI], `xUrl`, `instagramUrl`, **`tiktokUrl` (Sprint 2026-10-02)**), `avatarUrl` (Sprint 13: hochgeladene Fotos liegen im R2 `MEDIA`-Bucket, die Spalte speichert nur die URL `/api/media/avatars/<userId>/<zufall>.<ext>` bzw. eine externe Bild-URL – **nie** Base64), `rolesJson`, `skillsJson`, `lookingForJson`, **`offeringJson` (Sprint 3, „Ich biete")**, `profileVisibility`, `onboardingCompletedAt` | **aktiv** (Avatar/Cover nur als URL; `linkedinUrl` in sichtbarer UI entfernt und deprecated, Spalte für Migrationssicherheit in DB erhalten) |
| `Interest` / `Goal` | Taxonomie mit DE/EN-Labels und `position` | **aktiv** (Bootstrap per Seed/D1-Bootstrap) |
| `UserInterest` / `UserGoal` | n:m-Zuordnungen, eindeutig je Paar | **aktiv** |
| `PrivacySettings` | `profileVisibility`, `performanceVisibility`, `contactVisibility`, `showLocation`, `discoverable`, `allowConnectionRequests`, **`metricsVisibilityJson` (Sprint 3)** | teilweise erzwungen (K-06); `metricsVisibilityJson` in `/app/profile?tab=performance` erzwungen |
| `NotificationPreference` | `emailMessages`, `emailConnectionRequests`, `emailProductUpdates`, `inAppAll` | gespeichert; E-Mail-Zustellung hängt am Provider |
| `SellerProfile` | Verkäuferstatus (`none`\|`pending`\|`approved`\|`rejected`) + Antragsnotizen | vorbereitet (keine Antrags-UI) |

### 3. Membership, Trial & Private Beta (5 + 2)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `Trial` | 48-h-Discovery: `status` (`active`\|`expired`\|`converted`), `startedAt`, `expiresAt`, `convertedAt`, `connectionRequestsUsed`, `connectionRequestLimit`, `fingerprintHash` | **aktiv** |
| `Membership` | `userId` (unique), `plan` (`monthly`\|`annual`), `status`, `provider` (`stripe`\|`dev`\|`admin` – `admin` = manuell administrativ aktivierte Vollmitgliedschaft, Konsolidierungs-Sprint: `priceCents = 0`, kein `currentPeriodEnd`, kein Ablauf; **keine Schemaänderung nötig**, Textspalte mit dokumentierten Werten), Provider-IDs, `priceCents`, `currency`, `currentPeriodStart/End`, `cancelAtPeriodEnd`, `startedAt`, `canceledAt`, `endedAt` | **aktiv** (Stripe-Pfad braucht Schlüssel) |
| `MembershipEvent` | Ereignisprotokoll je Nutzer, `providerEventId` (unique → Idempotenz) | **aktiv** |
| `Invoice` | Provider-Rechnungen (`providerInvoiceId` unique, Betrag, Status, Zeitraum, `hostedUrl`) | vorbereitet (nur aus Provider-Events) |
| `MembershipCard` | `cardNumber` (unique, `IC-<Jahr>-<Nr>`), `publicId` (unique, öffentlich prüfbar), `status`, `issuedAt`, `revokedAt` | **aktiv** |
| `BetaInvite` *(Sprint 12)* | Persönlicher Beta-Schlüssel: `codeHash` (unique, HMAC-SHA-256 mit `AUTH_SECRET` – **nie Klartext**), `codeHint` (letzte 4 Zeichen, nur zur Wiedererkennung), `label` (Admin-Notiz), `restrictedEmail` (optionale Kontobindung), `durationDays` (Standard 30, 1–365), `status` (`active`\|`redeemed`\|`disabled`), `expiresAt` (optionales Einlöse-Enddatum), `createdById`, `redeemedById`, `redeemedAt`, `disabledAt` | **aktiv** |
| `BetaAccess` *(Sprint 12)* | Zeitlich begrenzte Private-Beta-Plattformfreigabe, **keine Mitgliedschaft**: `userId` (unique – höchstens ein Zugang je Konto), `inviteId`, `status` (`active`\|`revoked`), `startsAt`, `endsAt`, `revokedAt`, `revokedById`. Aktiv = `status = 'active'` **und** `endsAt > jetzt` (Serverzeit, bei jedem Request geprüft) | **aktiv** |

### 4. Networking (4)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `Follow` | gerichtetes Folgen, eindeutig je Paar | **aktiv** |
| `ConnectionRequest` | `fromUserId`, `toUserId`, `message`, `status` (`pending`\|`accepted`\|`declined`\|`withdrawn`), `fromTrial`, `respondedAt` | **aktiv** |
| `Connection` | bestätigte Verbindung (`userAId`/`userBId` kanonisch sortiert, `endedAt`) | **aktiv** |
| `Block` | Blockierung, wirkt in beide Richtungen | **aktiv** |

### 5. Messaging (3)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `Conversation` | `kind` (`direct`\|`opportunity`), `subject`, `opportunityId`, `lastMessageAt`, **`directKey`** (Sprint 12: `<kleinere userId>:<größere userId>` für Direktchats, **unique** → genau ein Direktchat je Paar, auch bei gleichzeitigem Annehmen) | **aktiv** (`opportunity`-Kind vorbereitet) |
| `ConversationParticipant` | Teilnehmer + `lastReadAt`, eindeutig je Paar | **aktiv** |
| `Message` | `body`, `attachmentUrl`, `attachmentName`, `readAt`, `deletedAt` | **aktiv**; `readAt` markiert eingehende Nachrichten einzeln und wird nur für im gerenderten Chat-Snapshot enthaltene IDs gesetzt (Migration `0006` backfillt bisher gelesene Direktnachrichten); Anhänge bleiben URL-only |

### 6. Notifications, Feed & Aktivität (2 + 18 unten)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `Notification` | `type`, `titleKey` (i18n), `paramsJson`, `url`, `actorId`, `dedupeKey` (unique je Nutzer → keine Duplikate), `readAt` | **aktiv** |
| `Post` | Activity Feed: `kind`, `body`, `imageUrl` (R2-Medium-URL oder externe HTTP(S)-Bild-URL; nie Bytes/Base64), `linkUrl`, `entityType/Id`, `visibility`, `verified`, `isDemo`, `deletedAt` | **aktiv** (Post-Bilder liegen im R2-`MEDIA`-Bucket, nicht in D1) |

### 7. Business – Opportunities (2)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `BusinessOpportunity` | `ownerId`, `title`, `slug` (unique), `type`, `category`, `summary`, `description`, `industry`, `location`, `remote`, `offering`, `seeking`, `requirements`, `visibility`, `confidentiality`, `status` (`draft`\|`published`\|`closed`), `isDemo`, Zeitstempel | **aktiv** (Deal-Räume fehlen) |
| `OpportunityApplication` | Bewerbung: `reason`, `background`, `message`, `status` (`pending`\|`accepted`\|`declined`\|`withdrawn`), eindeutig je Chance+Nutzer | **aktiv** |

### 8. Marketplace & Academy (6)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `MarketplaceListing` | `sellerId`, `title`, `slug` (unique), `kind`, `category`, `priceCents`, `currency`, `status` (`draft`\|`published`\|`archived`), `deliveryMode`, `isDemo` | **aktiv** (ohne Bezahlung) |
| `Course` | 1:1 zu Listing: `level`, `language`, `durationMin`, `certificate` | **aktiv** |
| `CourseModule` / `Lesson` | Struktur inkl. `videoUrl`, `isPreview`, `position` | **aktiv** (keine Videos vorhanden) |
| `Enrollment` | Zugang je Kurs+Nutzer, `source` (`demo_fixture`\|`purchase`\|`granted`), `progressPercent`, `completedAt` | **aktiv** (ohne Kaufweg) |
| `LessonProgress` | abgeschlossene Lektion, eindeutig je Enrollment+Lektion | **aktiv** |

### 9. Investments (2)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `InvestmentOpportunity` | `submittedById`, `publicName`, `slug`, `sector`, `stage`, `summary`, `description`, `investmentType`, `targetAmountCents`, `minTicketCents`, `currency`, `status` (`draft`\|`submitted`\|`approved`\|`rejected`\|`closed`), `restrictedNote`, Prüffelder | **aktiv** (nur Discovery) |
| `InvestmentInterest` | Absichtserklärung: `note`, `status`, eindeutig je Chance+Nutzer | **aktiv** |

### 10. Events (2)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `Event` | `slug`, `title`, `category` (`connect`\|`develop`\|`experience`), `type`, `summary`, `description`, Ort, Zeitraum, `capacity`, `imageUrl`, `state` (`confirmed`\|`concept`\|`past`\|`demo`), `priceCents`, `applicationRequired`, `waitlistEnabled`, `isDemo` | teilweise aktiv (Anzeige + Bewerbung; Anlegen/Tickets fehlen) |
| `EventApplication` | Bewerbung: `status` (`applied`\|`confirmed`\|`waitlisted`\|`declined`\|`canceled`\|`attended`), `guests`, `note`, eindeutig je Event+Nutzer | **aktiv** (Tickets/Check-in fehlen) |

### 11. Trust & Performance (4)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `TrustReview` | Bewertung 1–5 Sterne in Zehnteln (`rating10`: 10 = 1,0 … 50 = 5,0) mit `contextType` (`opportunity`\|`marketplace`\|`investment`) / `contextId` / `contextLabel` (**nur neutraler Kategoriecode**, nie Titel/Gegenseite/Betrag), `comment`, `status` (`pending`\|`published`\|`hidden`), `verifiedContext`, `isDemo`, `moderatedById`/`moderatedAt`/`moderationNote`; **unique** je `subjectId`+`authorId`+`contextType`+`contextId` | **aktiv** (Sprint 16, `submitTrustReviewAction`) |
| `TrustScoreSummary` | materialisierter Cache des Scores je Nutzer (`score10` = 10–50 oder `null`, `reviewCount`, `verifiedReviewCount`, `breakdownJson`); wird bei jeder Bewertungs-Änderung aus `TrustReview` neu berechnet (`refreshTrustSummaryFor()`), damit Listenansichten joinen können | **aktiv** (Cache; Profilseiten rechnen live) |
| `PerformanceRecord` | Kennzahlen: `kind`, `labelDe/En`, `valueNumber`/`valueCents`, `unit`, `verification` (`self_reported`\|`member_confirmed`\|`verified`), `visibility`, Quell-Entity | vorbereitet (keine Eingabemaske) |
| `Badge` / `UserBadge` | Badge-Taxonomie DE/EN + Vergabe (`grantedById`, `grantedAt`, eindeutig je Nutzer+Badge) | Taxonomie aktiv (Seed/D1-Bootstrap), Vergabe manuell |

### 12. Admin, Moderation & System (6)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `MembershipApplication` | Antrag auf Voll-Mitgliedschaft: `motivation`, `background`, `contribution`, `goals`, `status` (`pending`\|`approved`\|`rejected`), Prüfer, `reviewNote` | **aktiv** |
| `AccountDeletionRequest` | Löschantrag: `reason`, `status` (`pending`\|`processed`\|`declined`), Bearbeitung | **aktiv** |
| `Report` | Missbrauchsmeldungen: `entityType`, `entityId`, `reason`, `details`, `status` (`open`\|`reviewed`\|`dismissed`) | vorbereitet (keine UI) |
| `AdminAuditLog` | Audit: `actorId`, `action`, `entityType`, `entityId`, `metaJson` | **aktiv** |
| `RateLimit` | Fixed-Window-Zähler: `key` (PK), `count`, `windowStartAt`, `blockedUntil` | **aktiv** |
| `DevOutbox` | nur Entwicklung: aufgezeichnete E-Mails/SMS (`channel`, `to`, `subject`, `body`, `template`) | **aktiv** (admin-only, nur mit `ENABLE_DEV_OUTBOX=true`) |
| `PlatformMetric` | öffentliche Kennzahlen mit `kind` (`verified`\|`self_reported`\|`demo`\|`zero_state`), DE/EN-Labels | **aktiv** (Startseite) |

*(`Badge`/`UserBadge` sind oben mitgezählt; Gesamtzahl aktuell 57 = 50 aus `0000` + 2 aus `0002` + 3 aus `0004` + 2 aus `0005`.)*

## Sprint 3 – neue Spalten (Migration `0001`)

| Tabelle | Spalte | Typ / Default | Bedeutung |
| ------- | ------ | ------------- | --------- |
| `Profile` | `offeringJson` | `text NOT NULL DEFAULT '[]'` | „Ich biete" – Freitextliste, wird in der Discover-Karte und im Profil-Header angezeigt. Ergänzt das bestehende `lookingForJson` („Ich suche"). |
| `PrivacySettings` | `metricsVisibilityJson` | `text NOT NULL DEFAULT '{}'` | Sichtbarkeit je Business-Kennzahl. Erlaubte Schlüssel: `deals`, `dealVolume`, `customers`, `marketplace`, `courses`, `investments`, `events`; erlaubte Werte: `public`, `members`, `connections`, `private`. Fehlende oder ungültige Einträge fallen auf `performanceVisibility` zurück; unbekannte Werte werden beim Speichern verworfen (`parseMetricsVisibility`, `src/lib/platform/rules.ts`). |

Beide Spalten sind **rein additiv** (SQLite `ALTER TABLE … ADD`), haben einen
Default und erfordern kein Backfill. Alte Zeilen verhalten sich wie zuvor.

## Sprint 12 – Private Beta (Migration `0002`)

| Änderung | Details |
| -------- | ------- |
| `CREATE TABLE BetaInvite` | siehe Gruppe 3; Indizes `BetaInvite_codeHash_unique`, `beta_invite_status_idx`, `beta_invite_redeemed_idx`; FKs `createdById`/`redeemedById` → `User` (`ON DELETE SET NULL`) |
| `CREATE TABLE BetaAccess` | siehe Gruppe 3; Indizes `BetaAccess_userId_unique`, `beta_access_status_idx (status, endsAt)`; FK `userId` → `User` (`ON DELETE CASCADE`), `inviteId` → `BetaInvite` und `revokedById` → `User` (`SET NULL`) |
| `ALTER TABLE Conversation ADD directKey` + `conversation_direct_key_unique` | nullable, kein Backfill nötig: bestehende Direktchats werden beim nächsten Öffnen/Annehmen übernommen (`ensureDirectConversation` sucht zuerst den bestehenden Chat des Paares und setzt dann den Schlüssel). Mehrere `NULL`-Werte sind in SQLite erlaubt |
| `UPDATE Notification SET readAt = createdAt WHERE type = 'message' AND readAt IS NULL` | Datenbereinigung: Seit Sprint 12 erzeugt nicht mehr jede einzelne Nachricht eine Mitteilung (ungelesene Nachrichten zählen über `ConversationParticipant.lastReadAt`). Alte ungelesene `message`-Mitteilungen würden sonst doppelt zählen. Nur `readAt` wird gesetzt, nichts gelöscht |

**Rückwärtskompatibel:** keine Löschungen, keine Umbenennungen, keine
NOT-NULL-Spalte ohne Default in bestehenden Tabellen. Alte Worker-Versionen
ignorieren die neuen Tabellen/Spalte. Anwendung: lokal
`npm run cf:d1:migrate:local` (Tests: `tests/d1-helpers.ts` wendet alle
Migrationen aus `drizzle/meta/_journal.json` an), remote
`npm run cf:d1:migrate:remote`. **Rollback** wäre nur manuell möglich
(`DROP TABLE BetaAccess; DROP TABLE BetaInvite; DROP INDEX
conversation_direct_key_unique;` – die Spalte `directKey` kann bleiben).

## Sprint 18 – Nachrichten-Lesestatus (Migration `0006`)

| Migration | Änderung | Zweck |
| --------- | -------- | ----- |
| `0006_message_read_state.sql` | `ALTER TABLE Message ADD readAt`; anschließend wird `readAt` für nicht gelöschte Nachrichten gesetzt, wenn der bisherige Cursor eines anderen Gesprächsteilnehmers (`lastReadAt`) mindestens so neu wie die Nachricht ist | Bestehende Direktchats behalten ihren vorherigen Gelesen-Stand; `NULL` bedeutet ungelesen |

`0006` ist für den Race-sicheren Nachrichten-ID-Snapshot notwendig: der
Conversation-Cursor kann nicht ausdrücken, welche einzelnen, gleichzeitig
ankommenden Nachrichten tatsächlich im gerenderten Snapshot enthalten waren.
Die Spalte ist additiv und wird mit vorhandenem `lastReadAt` zurückgefüllt.
Ein zusätzlicher Unread-Index (`0007`) wurde bei der Abschlussprüfung entfernt:
der bestehende `message_conversation_idx` unterstützt die Abfrage bereits;
der weitere zusammengesetzte Index wäre nur eine ungemessene Optimierung.

Neue Chat-Leseaktionen setzen `Message.readAt` ausschließlich für eingehende
Nachrichten-IDs, die der Client im gerenderten Snapshot mitsendet. Der Server
prüft Teilnehmer, Conversation-ID, Sender und Löschstatus erneut. Der alte
`lastReadAt`-Cursor bleibt monoton und wird höchstens bis zur jüngsten Nachricht
des Snapshots fortgeschrieben; er wird nicht mehr zur Zählung paralleler
Nachrichten verwendet. D1-Regressionsabdeckung: `tests/integration/for-you-d1.test.ts`
spielt die Backfill-Migration nach dem Einspielen bereits vorhandener Nachrichten
gegen Miniflare/workerd.

## Sprint 18 – Post-Bilder (ohne D1-Blob-Migration)

`Post.imageUrl` enthält ausschließlich eine verwaltete Media-URL oder eine
externe HTTP(S)-Bild-URL. Uploads werden im bestehenden R2-`MEDIA`-Bucket unter
`posts/<userId>/<random>.<ext>` gespeichert, mit 5-MB- und Magic-Byte-Prüfung;
`/api/media` erlaubt nur einzelne JPG/JPEG/PNG/WebP-Objekte unter `avatars/`
oder `posts/`; Post-Medien prüfen zusätzlich die Post-Sichtbarkeit serverseitig
und werden mit `private, no-store` ausgeliefert. Post-Löschung entfernt nur
einen sicher validierten Schlüssel im eigenen Autorenordner. Es gibt bewusst weder Base64 noch Bildbytes in D1.

**Production:** Migration `0006` ist generiert und lokal über echte
workerd-D1-Tests geprüft, aber in diesem Auftrag **nicht remote angewendet**.

## Wichtige Beziehungen

```
User 1──n Session            User 1──n AuthToken / VerificationCode
User 1──1 Profile            User 1──1 PrivacySettings / NotificationPreference
User 1──1 Trial              User 1──1 Membership 1──1 MembershipCard
                             User 1──n MembershipEvent / Invoice
User n──n User   (Follow, ConnectionRequest, Connection, Block)
Conversation 1──n ConversationParticipant, 1──n Message
User 1──n Post / Notification / BusinessOpportunity / MarketplaceListing
BusinessOpportunity 1──n OpportunityApplication
MarketplaceListing 1──1 Course 1──n CourseModule 1──n Lesson
Course 1──n Enrollment 1──n LessonProgress
InvestmentOpportunity 1──n InvestmentInterest      Event 1──n EventApplication
User 1──n TrustReview (als subjectId / authorId)    User 1──1 TrustScoreSummary
User 1──n PerformanceRecord / UserBadge / AdminAuditLog(actor)
```

**Kanonische Paarung:** `Connection` speichert Nutzer sortiert
(`connectionPair()` in `src/db/queries.ts`) – beide Richtungen sind ein Datensatz.

## Aktiv vs. vorbereitet (Kurzliste)

- **Aktiv genutzt:** `User`, `Session`, `AuthToken`, `VerificationCode`,
  `Profile`, `Interest`, `Goal`, `UserInterest`, `UserGoal`,
  `PrivacySettings`, `NotificationPreference`, `Trial`, `Membership`,
  `MembershipEvent`, `MembershipCard`, `Follow`, `ConnectionRequest`,
  `Connection`, `Block`, `Conversation`, `ConversationParticipant`, `Message`,
  `Notification`, `Post`, `BusinessOpportunity`, `OpportunityApplication`,
  `MarketplaceListing`, `Course`, `CourseModule`, `Lesson`, `Enrollment`,
  `LessonProgress`, `InvestmentOpportunity`, `InvestmentInterest`, `Event`,
  `EventApplication`, `MembershipApplication`, `AccountDeletionRequest`,
  `AdminAuditLog`, `RateLimit`, `DevOutbox`, `PlatformMetric`, `Badge`,
  `UserBadge`, `TrustReview`, `TrustScoreSummary` (seit Sprint 16 aktiv).
- **Vorbereitet (Datenmodell ohne vollständige Funktion):** `SellerProfile`,
  `Invoice`, `PerformanceRecord`,
  `Report`, `VerificationCode`-Zwecke `login_2fa`/`phone_change`,
  `BusinessOpportunity.confidentiality > standard`, `Conversation.kind = opportunity`.

## Sprint „Deal Fee & Deal Records" – Migration `0004` (3 neue Tabellen)

**Rein additiv:** ausschließlich `CREATE TABLE` + `CREATE INDEX`. Keine
`ALTER`, kein `DROP`, keine Änderung an bestehenden Tabellen.

| Tabelle | Zweck | Besonderheit |
| ------- | ----- | ------------ |
| `DealTermsAcceptance` | Nachweis, dass ein Mitglied eine **bestimmte Fassung** der Deal-Bedingungen zu einem konkreten Angebot akzeptiert hat | `termsVersion`, `acceptedAt`, `subjectType`/`subjectId`, `dealType`, `volumeCents` (**eingegebene Angabe, kein Fakt**), `feeTierId`, `feeRateBps` (bei > 5 Mio. `null` = verhandelbar), `feeNegotiable` |
| `DealRecord` | Ein über INNER CIRCLE entstandener, off-platform abgeschlossener Deal | `declaredById`, `counterpartyId`, `sourceOpportunityId` (nullable, `SET NULL`), `volumeBand` (grob), `volumeCents` (**privat**), `status` `pending_confirmation → confirmed \| disputed`, `confirmedAt`, `privateNote` |
| `DealConfirmation` | Gegenseitige Bestätigung | Unique Index `deal_confirmation_unique` auf (`dealId`, `userId`) – jede Person bestätigt höchstens einmal |

**Schlüsselentscheidungen:**

- `DealRecord.status` wird **nur** zu `confirmed`, wenn **beide** benannten
  Parteien bestätigt haben (`src/lib/deals/records.ts`, `confirmDeal()`). Ein
  einseitiger Claim zählt nirgends.
- `volumeCents` ist privat. Nach außen verlässt die Zeile ausschließlich
  `publicDealSummaryFor()` → `{ verifiedDealCount, topVolumeBand }`.
- `privateNote` ist nur für die meldende Seite sichtbar und wird der
  Gegenseite nie übertragen.
- Beide Tabellen `ON DELETE CASCADE` auf `User` – beim Löschen eines Kontos
  verschwinden die Deals mit (gesichert durch Test).

**Angewendet:** lokal (`wrangler d1 migrations apply DB --local`) **und** gegen
das echte workerd-D1 über `tests/d1-helpers.ts` (`applyAllMigrations`) getestet.
**NICHT auf Production angewendet.**

## Betrieb

| Aufgabe | Befehl |
| ------- | ------ |
| Schema ändern | `src/db/schema.ts` bearbeiten → `npm run db:generate` → Migration committen |
| Lokale Datenbank synchronisieren | `npm run db:push` (Node/libSQL) |
| Lokale D1-Migration (Worker-Vorschau) | `npm run cf:d1:migrate:local` |
| Produktions-Migration | `npm run cf:d1:migrate:remote` (läuft automatisch in `npm run cf:release`) |
| Taxonomie (Interessen, Ziele, Badges) einspielen | `npm run cf:d1:bootstrap:local` / `:remote` (idempotent, Quelle `scripts/taxonomy.ts`) |
| Entwicklung seeden | `npm run db:seed` (fiktive Demo-Konten, **niemals** remote) |
| Backup | `npx wrangler d1 export DB --remote --output=backup.sql` |

**Regel (Sprint 16):** `drizzle/0003_sprint16_trust_reviews.sql` ist **erzeugt
und getestet, aber NICHT auf Production angewendet**. Sie wird mit
`npm run cf:d1:migrate:remote` bzw. automatisch in `npm run cf:release`
eingespielt – erst nach Freigabe.

**Regel (Deal-Fee-Sprint):** `drizzle/0004_deal_terms_and_records.sql` ist
**rein additiv**, lokal und gegen workerd-D1 getestet, **aber NICHT auf
Production angewendet**.

**Regel:** Migrationen sind additiv. Destruktive Änderungen nur mit Backup und
ausdrücklicher Freigabe. Jede Schemaänderung aktualisiert dieses Dokument.

## Sprint Profile/Badges/Mobile – Migration `0009` (2026-10-02)

- **Inhalt:** `ALTER TABLE Profile ADD tiktokUrl text;` – genau ein
  nullbares Social-Link-Feld neben `websiteUrl`/`xUrl`/`instagramUrl`.
  Kein Backfill, keine Datenänderung, keine Downtime (additive Spalte).
- **Nutzung:** Profil-Bearbeitung (`updateProfileAction`, Feld `tiktok`,
  max. 120 Zeichen, geleertes Feld wird wirklich gelöscht) und die
  Kontakt-Chips in der einheitlichen `ProfileView` (Handle `@name` →
  `https://www.tiktok.com/@name`, volle URLs bleiben unverändert;
  Sichtbarkeit fremder Kontakte weiter über `contactVisibility`,
  §3d in `06-permissions.md`).
- **Status:** lokal generiert und gegen libSQL/Worker-Tests geprüft
  (`npm test`, `drizzle-kit check`); **nicht** auf die Produktions-D1
  angewendet (kein Deploy in diesem Sprint).
