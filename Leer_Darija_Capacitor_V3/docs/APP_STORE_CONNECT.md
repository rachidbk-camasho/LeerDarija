# App Store Connect – betaalde A1/A2

## Producten aanmaken
Maak onder **Monetization / In-App Purchases** twee **Non-Consumable** producten aan:

- Product ID: `com.leerdarija.a1` — Reference Name: `Darija A1 Unlock`
- Product ID: `com.leerdarija.a2` — Reference Name: `Darija A2 Unlock`

De product-ID's moeten exact overeenkomen met `www/app.js`.

## Prijs
De prijs staat niet hardcoded in de app. Kies per product de gewenste prijs in App Store Connect. StoreKit levert daarna de lokale prijs en valuta aan de UI.

## Review
Voeg voor beide aankopen review-informatie en een screenshot toe. Test eerst met een Sandbox Apple Account of StoreKit Configuration in Xcode.

## Restore Purchases
De app bevat een knop **Herstel aankopen** en gebruikt `AppStore.sync()` via StoreKit 2.
