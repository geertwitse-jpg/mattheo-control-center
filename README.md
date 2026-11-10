# Mattheo Control Center

Een donker, modern persoonlijk dashboard voor iPad mini.

## Huidige status
- Responsive dashboard, navigatie en demo-login.
- Dashboardkaarten en pagina's voor Spotify, AI, weer, mail, meldingen, WiZ en netwerk.
- Basis internetstatus en indicatieve downloadsnelheidstest.
- Integraties zijn bewust als **niet gekoppeld** aangeduid tot ze echt zijn ingesteld en getest.

## Preview
Open `index.html` lokaal of schakel GitHub Pages in via **Settings → Pages → Deploy from a branch → main → /(root)**.

## Demo-login
Tijdelijke client-side demo-pincode: `123456`. Dit is GEEN veilige authenticatie en beschermt geen gegevens. Voeg vóór gebruik met persoonlijke accounts server-side PIN-verificatie, rate limiting, sessiecookies en beveiligde API-routes toe.

## Beoogde integraties
- Spotify: OAuth Authorization Code with PKCE + Spotify Web Playback SDK (Premium vereist).
- AI: Cloudflare Worker met een provider die op dat moment een bruikbare gratis quota heeft. Geen API-sleutels in frontend of Git.
- Mail: Google OAuth; tokens uitsluitend server-side.
- WiZ: eerst compatibele lokale/cloud-bediening onderzoeken en op het eigen netwerk testen.
- Weer: betrouwbare weer-API en expliciet ingestelde locatie.
- Netwerk: browserstatus/snelheid werkt beperkt; gedetailleerde LAN-apparaten vereisen router-API of lokale bridge.

## Belangrijke beperkingen
Safari op iPadOS kan Bluetooth niet zelfstandig aanzetten of koppelingen beheren. Gebruik hiervoor iPadOS-instellingen. De huidige Spotify-pagina is nog geen echte speler. De pincode is voorlopig alleen een demo-afscherming.

## Hosting
GitHub Pages kan de statische frontend gratis hosten. Cloudflare Worker-integraties worden pas toegevoegd nadat de benodigde API's, gratis quota en beveiliging zijn gecontroleerd.