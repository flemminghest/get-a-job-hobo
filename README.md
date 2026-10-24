# Get a Job Hobo — gratis webdemo

Statisk, responsiv browser-app på dansk. Den kræver ingen betalt hosting, API-nøgle, server eller installation for de lokale demo-funktioner.

## Funktioner
- Jobanalyse med lokal, regelbaseret heuristik.
- CV-redigering og lokal lagring i browseren.
- Tre ansøgningsforslag efter analyse; ansøgningsfeltet starter blankt og udfyldes først efter aktivt valg.
- Panelkritik for Recruiter, Copywriter, CMO og CEO (demo-feedback).
- Import af LinkedIn Connections.csv og valgfri SavedJobs.csv, søgning, filtre og eksport.
- Manuel registrering af kilder, dubletkontrol, domæneoptælling og tydelig researchstatus.
- Historik, backup/restore og sletning af lokale data.

## Gratis publicering
1. Åbn repositoryets **Settings → Pages**.
2. Under **Build and deployment** vælg **Deploy from a branch**.
3. Vælg branch **main** og folder **/(root)**. Klik **Save**.
4. Vent på, at GitHub Pages publicerer siden. Linket står øverst på samme Pages-side.
5. Fremtidige ændringer til `index.html` i `main` bliver automatisk publiceret af GitHub Pages.

## Privatliv og begrænsninger
- Kildekoden er offentlig, men indeholder ikke dine private CV- eller LinkedIn-data. Importér selv dine filer inde i browseren.
- CV og CSV-filer behandles lokalt og sendes ikke til en backend.
- AI, live-webresearch, PDF/OCR, sikker login/backend, synkronisering mellem enheder og direkte LinkedIn API er ikke tilkoblet.
- Scores og panelkritik er regelbaseret demo-logik; de er ikke statistiske vurderinger.
- Data gemmes i browserens lokale lager. Brug backup, og hold backupfilen privat.
