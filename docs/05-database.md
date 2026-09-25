# 05 – Datenbank (Cloudflare D1 / Drizzle)

**Stand:** 2026-09-24 (Sprint 12: Private Beta) · Basis: `src/db/schema.ts` und
`drizzle/0000_init.sql` + `drizzle/0001_sprint3_discover_profile.sql` +
**`drizzle/0002_sprint12_private_beta.sql`**.

- **Dialekt:** SQLite. In Produktion **Cloudflare D1** über das Binding `DB`
  (`database_name: inner-circle-db`), lokal/testweise **libSQL**
  (`DATABASE_URL`, Default `file:./dev.db`, Tests `file:./.test.db`).
- **Migrationen:** `drizzle/0000_init.sql` – **50 Tabellen,
  85 Indizes, 58 Fremdschlüssel, 135 Statements** – und
  `drizzle/0001_sprint3_discover_profile.sql` (Sprint 3, **rein additiv**:
  zwei neue Textspalten, keine Löschungen oder Umbenennungen; lokal per
  `npm run db:push`, remote per `npm run cf:d1:migrate:remote`) und
  `drizzle/0002_sprint12_private_beta.sql` (Sprint 12, **additiv**: Tabellen
  `BetaInvite` + `BetaAccess`, Spalte `Conversation.directKey` mit
  Unique-Index, ein Daten-UPDATE – Details unten). Damit **52 Tabellen**.
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

## Gruppierung der 52 Tabellen (50 aus `0000` + 2 aus `0002`)

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
| `Profile` | `userId` (unique), `headline`, `bio`, `location`, `company`, `jobTitle`, Links (`websiteUrl`, `linkedinUrl` [DEPRECATED in UI], `xUrl`, `instagramUrl`), `avatarUrl` (Sprint 13: hochgeladene Fotos liegen im R2 `MEDIA`-Bucket, die Spalte speichert nur die URL `/api/media/avatars/<userId>/<zufall>.<ext>` bzw. eine externe Bild-URL – **nie** Base64), `rolesJson`, `skillsJson`, `lookingForJson`, **`offeringJson` (Sprint 3, „Ich biete")**, `profileVisibility`, `onboardingCompletedAt` | **aktiv** (Avatar/Cover nur als URL; `linkedinUrl` in sichtbarer UI entfernt und deprecated, Spalte für Migrationssicherheit in DB erhalten) |
| `Interest` / `Goal` | Taxonomie mit DE/EN-Labels und `position` | **aktiv** (Bootstrap per Seed/D1-Bootstrap) |
| `UserInterest` / `UserGoal` | n:m-Zuordnungen, eindeutig je Paar | **aktiv** |
| `PrivacySettings` | `profileVisibility`, `performanceVisibility`, `contactVisibility`, `showLocation`, `discoverable`, `allowConnectionRequests`, **`metricsVisibilityJson` (Sprint 3)** | teilweise erzwungen (K-06); `metricsVisibilityJson` in `/app/profile?tab=performance` erzwungen |
| `NotificationPreference` | `emailMessages`, `emailConnectionRequests`, `emailProductUpdates`, `inAppAll` | gespeichert; E-Mail-Zustellung hängt am Provider |
| `SellerProfile` | Verkäuferstatus (`none`\|`pending`\|`approved`\|`rejected`) + Antragsnotizen | vorbereitet (keine Antrags-UI) |

### 3. Membership, Trial & Private Beta (5 + 2)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `Trial` | 48-h-Discovery: `status` (`active`\|`expired`\|`converted`), `startedAt`, `expiresAt`, `convertedAt`, `connectionRequestsUsed`, `connectionRequestLimit`, `fingerprintHash` | **aktiv** |
| `Membership` | `userId` (unique), `plan` (`monthly`\|`annual`), `status`, `provider` (`stripe`\|`dev`), Provider-IDs, `priceCents`, `currency`, `currentPeriodStart/End`, `cancelAtPeriodEnd`, `startedAt`, `canceledAt`, `endedAt` | **aktiv** (Stripe-Pfad braucht Schlüssel) |
| `MembershipEvent` | Ereignisprotokoll je Nutzer, `providerEventId` (unique → Idempotenz) | **aktiv** |
| `Invoice` | Provider-Rechnungen (`providerInvoiceId` unique, Betrag, Status, Zeitraum, `hostedUrl`) | vorbereitet (nur aus Provider-Events) |
| `MembershipCard` | `cardNumber` (unique, `IC-<Jahr>-<Nr>`), `publicId` (unique, öffentlich prüfbar), `status`, `issuedAt`, `revokedAt` | **aktiv** |
| `BetaInvite` *(Sprint 12)* | Persönlicher Beta-Schlüssel: `codeHash` (unique, HMAC-SHA-256 mit `AUTH_SECRET` – **nie Klartext**), `codeHint` (letzte 4 Zeichen, nur zur Wiedererkennung), `label` (Admin-Notiz), `restrictedEmail` (optionale Kontobindung), `durationDays` (Standard 30, 1–365), `status` (`active`\|`redeemed`\|`disabled`), `expiresAt` (optionales Einlöse-Enddatum), `createdById`, `redeemedById`, `redeemedAt`, `disabledAt` | **aktiv** |
| `BetaAccess` *(Sprint 12)* | Zeitlich begrenzte Networking-Freigabe, **keine Mitgliedschaft**: `userId` (unique – höchstens ein Zugang je Konto), `inviteId`, `status` (`active`\|`revoked`), `startsAt`, `endsAt`, `revokedAt`, `revokedById`. Aktiv = `status = 'active'` **und** `endsAt > jetzt` (Serverzeit, bei jedem Request geprüft) | **aktiv** |

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
| `Message` | `body`, `attachmentUrl`, `attachmentName`, `deletedAt` | **aktiv** (Anhänge nur als URL, kein Upload) |

### 6. Notifications, Feed & Aktivität (2 + 18 unten)

| Tabelle | Zweck | Status |
| ------- | ----- | ------ |
| `Notification` | `type`, `titleKey` (i18n), `paramsJson`, `url`, `actorId`, `dedupeKey` (unique je Nutzer → keine Duplikate), `readAt` | **aktiv** |
| `Post` | Activity Feed: `kind`, `body`, `imageUrl`, `linkUrl`, `entityType/Id`, `visibility`, `verified`, `isDemo`, `deletedAt` | **aktiv** |

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
| `TrustReview` | Bewertung 1–10 (`rating10`) mit `contextType`/`contextId`, `status` (`pending`\|`published`\|`hidden`), `verifiedContext`, `isDemo` | vorbereitet (keine Abgabe-UI) |
| `TrustScoreSummary` | aggregierter Score je Nutzer (`score10`, Zähler, `breakdownJson`) | vorbereitet (Anzeige aktiv, Berechnung fehlt) |
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

*(`Badge`/`UserBadge` sind oben mitgezählt; Gesamtzahl 52 = 50 aus `0000` + `BetaInvite`/`BetaAccess` aus `0002`.)*

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
  `UserBadge`.
- **Vorbereitet (Datenmodell ohne vollständige Funktion):** `SellerProfile`,
  `Invoice`, `TrustReview`, `TrustScoreSummary`, `PerformanceRecord`,
  `Report`, `VerificationCode`-Zwecke `login_2fa`/`phone_change`,
  `BusinessOpportunity.confidentiality > standard`, `Conversation.kind = opportunity`.

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

**Regel:** Migrationen sind additiv. Destruktive Änderungen nur mit Backup und
ausdrücklicher Freigabe. Jede Schemaänderung aktualisiert dieses Dokument.
