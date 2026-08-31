# iPhone / iPad UI

De UI is fluid en niet gekoppeld aan vaste toestelafmetingen. Hierdoor ondersteunt de app huidige en recente iPhone- en iPadformaten, inclusief:

- compacte en grote iPhones
- toestellen met notch en Dynamic Island
- iPad mini, standaard iPad, iPad Air en iPad Pro formaten
- portrait en landscape
- Split View / smallere iPad vensters

Technisch:
- `viewport-fit=cover`
- CSS `env(safe-area-inset-*)` voor veilige marges
- touch controls minimaal circa 44pt
- breakpoints op 600px en 900px, niet op specifieke modelnamen
- geen vaste schermhoogtes
- grotere grid-layouts op iPad
- reduced-motion ondersteuning


## V3.1 UX-aanpassingen
- onderste hoofdnavigatie is altijd zichtbaar en houdt rekening met de iOS home indicator
- extra onderruimte voorkomt dat lesinhoud achter de navigatie verdwijnt
- lesheader met Terug-knop blijft sticky en blijft onder notch/Dynamic Island
- Terug-knop en quiz/navigatieknoppen hebben grotere touch targets (48–54pt)
- titels en kaarten wrappen correct op smalle iPhones en veroorzaken geen horizontale overflow
- store cards stapelen op smalle schermen
- Niveaus/Voortgang tabs openen eerst Home en scrollen daarna naar het juiste onderdeel
