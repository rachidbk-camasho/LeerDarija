# Leer Darija – Capacitor 8 / iOS

## Wat zit erin
- Gratis app-shell met 2 gratis Start-lessen
- A1 en A2 als afzonderlijke betaalde unlocks
- StoreKit 2 Capacitor-plugin inbegrepen als lokale dependency
- Herstel aankopen
- Responsive iPhone/iPad-layout met safe-area ondersteuning
- Quiz en lokale score
- Darija / Nederlandse lescontent

## Build op Mac
1. Installeer Node.js en Xcode.
2. Open Terminal in deze map.
3. `npm install`
4. `npx cap add ios`
5. `npx cap sync ios`
6. `npx cap open ios`
7. Kies in Xcode je Apple Developer Team en controleer Bundle Identifier `com.leerdarija.app`.
8. Build naar een echte iPhone of gebruik StoreKit Testing.

## Belangrijk voor betalingen
Maak in App Store Connect twee Non-Consumable IAP's aan met exact deze IDs:
- `com.leerdarija.a1`
- `com.leerdarija.a2`

Zie `docs/APP_STORE_CONNECT.md`.

## Productkeuze
A1 en A2 zijn bewust **non-consumable**: eenmalig kopen en blijvend toegang houden. Prijzen stel je in App Store Connect in.

## UI
Zie `docs/DEVICE_UI.md`. De layout gebruikt safe areas en responsieve grids en is niet hardcoded voor één iPhone/iPad model.
