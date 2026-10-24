# Test- og begrænsningsrapport

## Lokale funktioner implementeret
Navigation, lokal CV-lagring, import af tekstfil, jobanalyse-demo, tre forslag (ansøgning starter blank), redigering/forhåndsvisning, panel-feedback, CSV-parser med BOM/komma/citerede felter, netværkssøgning/filtre, manuel kildeoptælling, historik, eksport og backup/restore.

## Bevidste begrænsninger
Der udføres ingen AI-kald eller live-webresearch. Tilføjede kilder er ikke verificeret. Direkte LinkedIn-synkronisering kræver godkendt API-adgang. Ingen PDF/OCR, login/backend eller synkronisering mellem enheder. Funktioner bruger localStorage og afhænger af browserens lokale lager.

## Privatliv
Personlige CV- og LinkedIn-data er ikke indlejret i den offentlige kode. De importeres i brugerens browser og bør holdes ude af Git.
