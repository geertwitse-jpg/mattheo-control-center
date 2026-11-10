# Mattheo Control Center

Een donker, modern persoonlijk dashboard voor iPad mini.

## Huidige status
- Responsive dashboard, navigatie en demo-login.
- Spotify-pagina met OAuth 2.0 Authorization Code + PKCE, zoeken, playlists, Web Playback SDK en afspeelbediening voorbereid.
- Basis internetstatus en indicatieve downloadsnelheidstest.
- AI, weer, mail en WiZ zijn nog niet gekoppeld.

## Preview
Open de GitHub Pages-site van deze repository.

## Spotify instellen
1. Maak een app aan via https://developer.spotify.com/dashboard.
2. Kies de Web Playback SDK en accepteer de Spotify Developer-voorwaarden.
3. Voeg exact deze Redirect URI toe in de instellingen van je Spotify-app:
   https://geertwitse-jpg.github.io/mattheo-control-center/
4. Kopieer de **Client ID** (niet de Client Secret).
5. Open Mattheo Control Center → Spotify → **Instellingen / Client ID** en plak de Client ID.
6. Tik op **Spotify koppelen** en keur de gevraagde machtigingen goed.
7. Gebruik Spotify Premium voor afspelen via de ingebouwde Web Playback SDK.

De browser gebruikt PKCE; er is geen Client Secret nodig of toegestaan in de frontend. Tokens worden in sessionStorage bewaard en verdwijnen bij het sluiten van de browsersessie. Op iPadOS kan een eerste handmatige tik op Afspelen nodig zijn door autoplay-beperkingen. De exacte callback-URL moet ook in Spotify Developer Dashboard zijn toegestaan.

## Demo-login
Tijdelijke client-side demo-pincode: `123456`. Dit is GEEN veilige authenticatie en beschermt geen gegevens. Voeg vóór gebruik met persoonlijke accounts server-side PIN-verificatie, rate limiting, sessiecookies en beveiligde API-routes toe.

## Nog te bouwen
- AI: Cloudflare Worker met een provider die op dat moment een bruikbare gratis quota heeft. Geen API-sleutels in frontend of Git.
- Mail: Google OAuth; tokens uitsluitend server-side.
- WiZ: eerst compatibele lokale/cloud-bediening onderzoeken en op het eigen netwerk testen.
- Weer: betrouwbare weer-API en expliciet ingestelde locatie.
- Netwerk: browserstatus/snelheid werkt beperkt; gedetailleerde LAN-apparaten vereisen router-API of lokale bridge.

## Beperkingen
Safari op iPadOS kan Bluetooth niet zelfstandig aanzetten of koppelingen beheren. Gebruik hiervoor iPadOS-instellingen. Spotify-API's en SDK's zijn onderhevig aan Spotify's actuele Developer Terms en API-beperkingen.

## Hosting
GitHub Pages kan de statische frontend gratis hosten. Cloudflare Worker-integraties worden pas toegevoegd nadat de benodigde API's, gratis quota en beveiliging zijn gecontroleerd.
