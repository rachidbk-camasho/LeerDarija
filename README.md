LEER DARIJA – STORE-READY CAPACITOR PACKAGE
===========================================

Dit pakket bevat:
- de volledige web-app in /www
- Capacitor-configuratie
- iOS/Android package name: com.leerdarija.app
- appnaam: Leer Darija
- versie: 2.1.0
- broniconen en splashscreen in /resources
- App Store / Play Store metadata
- privacy-policy template

EERSTE INSTALLATIE
------------------
1. Installeer Node.js LTS.
2. Open Terminal / PowerShell in deze map.
3. Voer uit:

   npm install

4. Maak de native projecten:

   npx cap add ios
   npx cap add android

5. Genereer iconen en splashscreens:

   npx capacitor-assets generate

6. Synchroniseer:

   npx cap sync

IOS
---
Vereist macOS + Xcode.

Open:
   npx cap open ios

Daarna in Xcode:
- selecteer het App-target
- Signing & Capabilities
- kies je Apple Developer Team
- controleer Bundle Identifier: com.leerdarija.app
- kies een aangesloten iPhone of simulator
- Run

Voor App Store:
- Product > Archive
- Distribute App
- upload naar App Store Connect
- voeg screenshots, privacygegevens en storetekst toe

ANDROID
-------
Vereist Android Studio.

Open:
   npx cap open android

In Android Studio:
- laat Gradle synchroniseren
- kies emulator of aangesloten Android-telefoon
- Run

Voor Google Play:
- Build > Generate Signed Bundle / APK
- Android App Bundle (AAB)
- maak/bewaar je signing key veilig
- upload AAB in Google Play Console
- voeg screenshots, privacygegevens en storetekst toe

BIJ EEN NIEUWE VERSIE VAN DE WEBAPP
-----------------------------------
Vervang bestanden in /www en voer daarna uit:

   npx cap sync

BELANGRIJK
----------
De iOS- en Android-mappen worden bewust lokaal door Capacitor gegenereerd.
Daarmee gebruik je de juiste versies van Xcode/Android Studio en Capacitor op jouw computer.

Voor publicatie moet je nog:
- je eigen Apple Developer / Google Play account koppelen
- contactgegevens invullen
- screenshots maken
- privacyvragen beantwoorden
- store-review doorlopen
