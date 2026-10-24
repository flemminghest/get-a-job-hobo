# Get a Job Hobo — gratis webapp

En dansk, statisk browser-app til jobsøgning, CV, ansøgning og LinkedIn-netværk. GitHub Pages leverer UI'et gratis.

## Jobanalyse med websøgning
- Hver gang brugeren vælger **Analyser job**, søger appen i Purilis offentlige webindeks via `https://puri.li/api/search` og henter muligvis lagret indekstekst fra `/api/context`.
- Forespørgsler handler om jobtitel/virksomhed, arbejdsgiver, LinkedIn, nyheder, virksomhedsoplysninger, branchekrav og jobportaler.
- Resultater deduplikeres, domæner normaliseres, og kilder vises med links, uddrag, søgetidspunkt og dækning.
- Research er **ikke en garanti for live-hentning af kildesider**. Indekstekst kan være ældre end originalsiden; brugeren skal åbne og kontrollere vigtige kilder.
- Jobmatch- og samtalescorer er stadig regelbaserede demonstrationer; AI-generering og faktisk validering af, om et jobopslag stadig er aktivt, er ikke tilkoblet.
- Ved utilstrækkelig dækning (under seks kilder eller fire hoveddomæner) markeres researchen som foreløbig.

## Privatliv
- CV, ansøgninger og importerede LinkedIn CSV-data gemmes i browserens lokale lager.
- CV, ansøgningstekst og netværksdata sendes ikke til søge-API'et.
- Ved live-søgning sendes jobtitel, virksomhedsnavn og de genererede søgeforespørgsler til Purilis offentlige websøge-API.
- Private data må ikke indlejres i de offentlige repository-filer. Brug backupfunktionen, og hold backupfiler private.

## Andre funktioner
- CV-redigering, lokal lagring og import af tekstfil.
- Tre redigerbare ansøgningsforslag efter jobanalyse; ansøgningen starter blank.
- Panelkritik for Recruiter, Copywriter, CMO og CEO (regelbaseret demo).
- LinkedIn Connections.csv og valgfri SavedJobs.csv, søgning, filtre og eksport.
- Historik, backup/restore og sletning af lokale data.

## Publicering
Hjemmesiden publiceres på GitHub Pages fra `main`-grenen. Link: https://flemminghest.github.io/get-a-job-hobo/
