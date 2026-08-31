# V4 – Jaarabonnement met 7-daagse proefperiode

## Productmodel
V4 gebruikt nog maar één StoreKit-product:

`com.leerdarija.premium.yearly`

Type in App Store Connect:
**Auto-Renewable Subscription**

Aanbevolen configuratie:
- Subscription Group: `Leer Darija Premium`
- Reference Name: `Darija Premium Yearly`
- Product ID: `com.leerdarija.premium.yearly`
- Duration: `1 Year`
- Introductory Offer: `Free Trial`
- Trial Duration: `1 Week`
- Prijs: zelf in App Store Connect kiezen

De oude losse producten:
- `com.leerdarija.a1`
- `com.leerdarija.a2`

worden door V4 niet meer gebruikt.

## Belangrijk over de gratis week
De proefperiode wordt volledig door Apple/StoreKit beheerd.
De gebruiker start het abonnement via de knop `Start 7 dagen gratis`.
Als de gebruiker in aanmerking komt, rekent Apple gedurende de ingestelde proefperiode niets.
Na de proefperiode vernieuwt het jaarabonnement automatisch tenzij de gebruiker opzegt.

De app zelf houdt dus geen eigen 7-daagse timer bij. Dit voorkomt dat verwijderen/herinstalleren van de app een nieuwe lokale proefperiode kan geven en houdt de abonnementstatus gekoppeld aan Apple.

## TestFlight
TestFlight gebruikt StoreKit sandbox.
- Testtransacties kosten geen echt geld.
- Het subscription-product moet exact dezelfde Product ID hebben.
- Nieuwe prijs/metadata kan enige tijd nodig hebben voordat StoreKit die teruggeeft.
- Gebruik `Herstel aankopen` om een entitlement opnieuw op te halen.

## UX V4
Vaste navigatie:
- Home
- Leren
- Profiel

Home:
- rustige voortgang
- één `Ga verder`-kaart
- dagelijkse oefening

Leren:
- rustige lijst met alle lessen
- filter Alles / Basis / A1 / A2
- hele rij aanklikbaar

Profiel:
- abonnementstatus
- starten proefperiode
- aankopen herstellen

Paywall:
- één abonnement
- Apple-prijs uit StoreKit
- geen externe App Store-link
