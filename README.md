# Get a Job Hobo — gratis webapp

Dansk, statisk browser-app til jobsøgning, CV, ansøgninger og LinkedIn-netværk. Den publiceres på samme GitHub Pages-adresse:
https://flemminghest.github.io/get-a-job-hobo/

## Live-websøgning i jobanalyse
Når brugeren vælger **Analyser job**, søger appen i Purilis offentlige webindeks fra browseren. Ingen API-nøgle er påkrævet. Appen sender jobtitel, virksomhedsnavn og udvalgte søgeord fra jobopslaget til søge-API’et — ikke brugerens CV, ansøgningstekst eller LinkedIn-forbindelser.

### Aftalte kildeområder
1. Det originale jobopslag / arbejdsgiverens karriereside; hvis brugeren har indsat en URL, forsøges der også en domænemålrettet søgning.
2. Arbejdsgiverens officielle hjemmeside, “Om os” og karriereside.
3. LinkedIn-virksomhedsside og LinkedIn-jobopslag.
4. Relevante danske jobportaler: Jobindex, Jobnet og Workindenmark.
5. Virksomhedsnyheder, pressemeddelelser og relevante medier.
6. Officielle virksomhedsoplysninger via CVR/Virk.
7. Årsrapporter og regnskabsoplysninger.
8. Fagmedier og specialkilder, der passer til stillingens branche.

Hver kildekategori forsøges med en målrettet søgning og, hvis den giver 0 resultater eller fejler, en bredere søgning. UI’et skelner mellem resultater fra det målrettede site-forsøg og resultater fra den bredere fallback, så et generelt resultat ikke fejlagtigt præsenteres som en Jobindex- eller LinkedIn-kilde. Resultater deduplikeres på URL, vurderes efter virksomhed/titel/domæne og vises sammen med kategoristatus, søgeforespørgsel, eventuelle fejl, uddrag og links. Et fremdrifts-modal viser status under søgningen.

Målet er mindst 6 potentielt relevante søgeresultater fra mindst 4 hoveddomæner. Det er et dækningskrav — ikke automatisk faktaverifikation. Søgeindekset kan have ældre data; /api/context returnerer lagret indekstekst og henter ikke den oprindelige side live. Appen skal derfor aldrig hævde, at opslaget stadig er aktivt, uden at det er kontrolleret på selve kildesiden.

## Automatisk smoke-test\nGitHub Actions kører en smoke-test på hvert push til `main`. Den kalder det offentlige søge-API, kontrollerer JSON-formatet, at mindst én forespørgsel returnerer resultater, og at CORS-headeren tillader GitHub Pages. Det tester API-tilgængelighed; det garanterer ikke, at alle jobrelaterede søgninger finder relevante resultater.\n\n## Status i “Hvad er tilkoblet?”
Live-søgestatus skifter dynamisk efter den seneste søgning:
- **Afventer test** før første søgning.
- **Søge-API svarer** når mindst én forespørgsel har fået et gyldigt HTTP-svar.
- **Seneste søgning fejlede** når ingen forespørgsler fik et gyldigt svar.

Direkte validering af kildesider, AI-generering, OCR/PDF-udtræk, sikker konto-/backendlagring, synkronisering mellem enheder og LinkedIn API er ikke tilkoblet.

## Andre funktioner
- CV-redigering og lokal lagring i browseren.
- Tre ansøgningsforslag efter jobanalyse; ansøgningen starter blank og udfyldes først efter aktivt valg.
- Regelbaseret panelkritik for Recruiter, Copywriter, CMO og CEO.
- Lokal import af LinkedIn Connections.csv og valgfri SavedJobs.csv.
- Historik, backup/restore, eksport og sletning af lokale data.

## Privatliv
CV, ansøgningstekst og importerede LinkedIn-data forbliver i browserens lokale lager. Live-søgning sender jobtitel, virksomhedsnavn og udvalgte søgeord fra jobopslaget til Purilis offentlige websøge-API. Ingen private CV- eller netværksdata sendes med. Offentlig kildekode indeholder ikke brugerens private data.
