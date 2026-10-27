/* Get a Job Hobo — public networking discovery and follow-up workspace.
   Uses the existing public web-index endpoint. Does not log into LinkedIn or auto-send messages. */
(function(){
'use strict';
const COMPANY_CONTEXT_API='https://puri.li/api/context';
const COMPANY_GEOCODE_API='https://nominatim.openstreetmap.org/search';
const FREDERIKSBERG_ORIGIN={lat:55.6802,lon:12.5341,label:'Frederiksberg bymidte'};
const PROFILE_KEYWORDS=['CRM','marketing automation','digital marketing','marketing','kampagnestyring','campaign management','content marketing','content strategy','dataanalyse','data analysis','AI','artificial intelligence','e-mail marketing','email marketing','SEO','paid media','performance marketing','kunderejser','customer journeys','loyalitet','loyalty','strategi','strategy','copywriting','marketing analytics','GA4','Google Analytics','brand marketing','brand management','segmentering','segmentation','lead generation','customer experience','kundeoplevelser','lifecycle marketing','konvertering','conversion rate optimization','paid social','social media','project management','projektledelse','kommunikation','communication','budget','stakeholder management','B2B','B2C','Salesforce','HubSpot','Klaviyo','SQL','Power BI','Google Ads','Meta Ads','e-commerce','e-commerce marketing','marketing strategy','email automation','customer data','analytics','web analytics'];
function uniqueTerms(items){const seen=new Set();return items.filter(item=>{const key=normalizeSearchText(item);if(!key||seen.has(key))return false;seen.add(key);return true})}
function extractSearchTermsFromCV(){
 const text=String(state.cv||'').trim();
 if(!text)return [];
 const normalized=normalizeSearchText(text);
 return uniqueTerms(PROFILE_KEYWORDS.filter(term=>normalized.includes(normalizeSearchText(term)))).slice(0,12);
}
function profileTermsFromCV(){
 const found=extractSearchTermsFromCV();
 return found.length?found:['CRM','marketing automation','digital marketing','content marketing','dataanalyse','SEO'];
}
function restoreSearchTermsFromCV(){
 const cv=String(state.cv||'').trim();
 const status=el('jobSearchStatus');
 if(!cv){if(status){status.className='notice warnbox';status.textContent='Dit CV er ikke gemt endnu. Gå til “Mit CV”, gem CV-teksten, og klik derefter her igen.'}return}
 const terms=extractSearchTermsFromCV();
 if(!terms.length){if(status){status.className='notice warnbox';status.textContent='Jeg kunne ikke genkende fagord i dit gemte CV. Skriv søgeord manuelt, eller tilføj jobtitler, kompetencer og værktøjer til CV-teksten.'}return}
 state.networkSearchTerms=terms.join(', ');
 if(el('jobSearchTerms'))el('jobSearchTerms').value=state.networkSearchTerms;
 if(el('networkSearchTerms'))el('networkSearchTerms').value=state.networkSearchTerms;
 if(el('jobKeywordCount'))el('jobKeywordCount').textContent=terms.length;
 persist();
 if(status){status.className='notice goodbox';status.textContent='Søgeord gendannet fra dit CV: '+terms.join(', ')+'. Du kan tilpasse dem, før du søger.'}
 if(el('jobSearchTerms'))el('jobSearchTerms').focus();
}
function focusJobSearch(){const input=el('jobSearchTerms');if(input){input.scrollIntoView({behavior:'smooth',block:'center'});input.focus()}}

function saveNetworkSearchPreferences(){
 state.networkSearchTerms=String(el('networkSearchTerms')?.value||'').trim().slice(0,600);
 state.networkSearchLocation=(String(el('networkSearchLocation')?.value||'').trim()||'Danmark').slice(0,300);
 if(el('jobSearchTerms')&&el('jobSearchTerms')!==document.activeElement)el('jobSearchTerms').value=state.networkSearchTerms;
 if(el('jobSearchLocation')&&el('jobSearchLocation')!==document.activeElement)el('jobSearchLocation').value=state.networkSearchLocation;
 persist();
}
function syncJobSearchPreferences(){
 state.networkSearchTerms=String(el('jobSearchTerms')?.value||'').trim().slice(0,600);
 state.networkSearchLocation=(String(el('jobSearchLocation')?.value||'').trim()||'Frederiksberg, København og omegn, Danmark').slice(0,300);
 if(el('networkSearchTerms'))el('networkSearchTerms').value=state.networkSearchTerms;
 if(el('networkSearchLocation'))el('networkSearchLocation').value=state.networkSearchLocation;
 if(el('jobKeywordCount'))el('jobKeywordCount').textContent=parseTerms(state.networkSearchTerms).length;
 persist();
}
function syncNetworkSearchPreferencesFromCV(){
 if(state.cv.trim()&&!state.networkLastSearch&&(!state.networkSearchTerms||state.networkSearchTerms===blank.networkSearchTerms))state.networkSearchTerms=profileTermsFromCV().join(', ');
 state.networkSearchTerms=String(state.networkSearchTerms||'').trim()||profileTermsFromCV().join(', ');
 if(el('networkSearchTerms'))el('networkSearchTerms').value=state.networkSearchTerms;
 if(el('networkSearchLocation'))el('networkSearchLocation').value=state.networkSearchLocation||'Danmark';
}
function parseTerms(raw){return uniqueTerms(String(raw||'').split(/[,;|\n]/).map(term=>term.trim()).filter(term=>term.length>1)).slice(0,12)}
function searchProfile(){
 const raw=String((el('jobSearchTerms')?.value??el('networkSearchTerms')?.value??state.networkSearchTerms)||'');
 const terms=parseTerms(raw);
 const loc=String((el('jobSearchLocation')?.value??el('networkSearchLocation')?.value??state.networkSearchLocation)||'Frederiksberg, København og omegn, Danmark').trim();
 return {terms:terms.length?terms:profileTermsFromCV(),location:loc.slice(0,300)||'København og omegn'};
}
function syncOpportunityInputs(){
 if(el('jobSearchTerms'))el('jobSearchTerms').value=state.networkSearchTerms||profileTermsFromCV().join(', ');
 if(el('jobSearchLocation'))el('jobSearchLocation').value=state.networkSearchLocation||'Frederiksberg, København og omegn, Danmark';
 if(el('distanceOriginInput'))el('distanceOriginInput').value=state.distanceOrigin||'';
 if(el('jobKeywordCount'))el('jobKeywordCount').textContent=parseTerms(state.networkSearchTerms).length;
 if(el('jobOpportunityCount'))el('jobOpportunityCount').textContent=(state.jobOpportunities||[]).length;
 if(el('jobTrackedCount'))el('jobTrackedCount').textContent=(state.followUps||[]).filter(item=>item.type==='job').length;
 if(el('jobLastSearchLabel'))el('jobLastSearchLabel').textContent=state.jobLastSearch?new Date(state.jobLastSearch).toLocaleDateString('da-DK'):'Ikke søgt';
 const originStatus=el('distanceOriginStatus');
 if(originStatus){
  originStatus.className='distance-origin-status'+(state.distanceOrigin?' is-saved':'');
  originStatus.textContent=state.distanceOrigin?'Din placering er gemt lokalt. Afstande beregnes fra denne adresse/by, når adressen og arbejdsstedet kan geokodes.':'Afstand vises altid, når arbejdsstedet kan placeres. Standard uden gemt placering: Frederiksberg bymidte. Indtast din egen adresse/postnummer/by for at bruge din bopæl.';
 }
}
async function saveDistanceOrigin(){
 const input=el('distanceOriginInput'),button=el('saveDistanceOriginButton'),status=el('distanceOriginStatus');
 const value=String(input&&input.value||'').trim().slice(0,300);
 state.distanceOrigin=value;
 if(value){try{localStorage.removeItem('gajh_company_geocode_'+normalizeInsightText(value))}catch(e){}}
 persist();
 if(button){button.disabled=true;button.textContent='Kontrollerer placering…'}
 if(status){status.className='distance-origin-status';status.textContent=value?'Kontrollerer adressen og opdaterer afstandene…':'Placeringen er ryddet. Der bruges Frederiksberg bymidte som standard.'}
 try{
  if(value){
   const coords=await geocodeDanishCompanyLocation(value);
   if(!coords){
    if(status){status.className='distance-origin-status is-warning';status.textContent='Adressen kunne ikke geokodes. Den er gemt, men der bruges midlertidigt Frederiksberg bymidte som standard. Prøv evt. postnummer + by i stedet for fuld adresse.'}
   }else if(status){status.className='distance-origin-status is-saved';status.textContent='Placering fundet: '+(coords.displayName||value)+'. Afstandene opdateres nu.'}
  }
  await refreshOpportunityDistances();
  if(status&&value){
   const usable=await geocodeDanishCompanyLocation(value);
   if(usable){status.className='distance-origin-status is-saved';status.textContent='Din placering er gemt og fundet. Afstande vises som luftlinje fra denne placering.'}
  }
 }catch(error){
  if(status){status.className='distance-origin-status is-warning';status.textContent='Placeringen er gemt, men geokodningen kunne ikke gennemføres. Standardafstanden fra Frederiksberg bruges foreløbigt.'}
 }finally{
  if(button){button.disabled=false;button.textContent='Gem min placering'}
  persist();
 }
}
function discoverQueries(kind,profile){
 const terms=profile.terms.slice(0,7).join(' '),loc=searchPhrase(profile.location||'København Danmark');
 if(kind==='people')return [
  {id:'people',label:'Mulige rekrutteringskontakter',targetSite:'linkedin.com',query:'site:linkedin.com/in recruiter OR talent acquisition marketing '+terms+' '+loc,fallbackQuery:'LinkedIn recruiter talent acquisition marketing '+terms+' '+loc+' Denmark'},
  {id:'companies',label:'Relevante virksomheder og bureauer',targetSite:'',query:'marketing recruitment agency employer brand CRM content digital marketing '+terms+' '+loc},
  {id:'linkedin-companies',label:'LinkedIn-virksomhedssider',targetSite:'linkedin.com',query:'site:linkedin.com/company marketing CRM marketing automation '+terms+' '+loc,fallbackQuery:'LinkedIn companies marketing CRM automation '+terms+' '+loc}
 ];
 return [
  {id:'linkedin-posts',label:'LinkedIn-opslag om faglige behov og ansættelse',targetSite:'linkedin.com',query:'site:linkedin.com/posts hiring søger "we are hiring" '+terms+' '+loc,fallbackQuery:'LinkedIn posts hiring søger '+terms+' '+loc+' Denmark'},
  {id:'linkedin-groups',label:'LinkedIn-grupper og fagfællesskaber',targetSite:'linkedin.com',query:'site:linkedin.com/groups '+terms+' Denmark',fallbackQuery:'LinkedIn groups '+terms+' Denmark'},
  {id:'professional-posts',label:'Faglige opslag og fagfællesskaber',targetSite:'',query:'"søger" "we are hiring" '+terms+' digital marketing CRM content '+loc+' professional community'}
 ];
}
function isDanishJobPortalHost(host){
 const value=String(host||'').toLowerCase().replace(/^www\./,'');
 return ['jobindex.dk','jobnet.dk','jobdanmark.dk','ofir.dk','stepstone.dk','hk.dk','workindenmark.dk','jobsearch.dk','it-jobbank.dk','indeed.com','thehub.io','graduateland.com'].some(domain=>value===domain||value.endsWith('.'+domain));
}
function jobEvidenceText(item){
 return [item&&item.title,item&&item.description,item&&item.location,item&&item.city,item&&item.country,item&&item.address,item&&item.url].filter(Boolean).join(' ');
}
function hasRemoteEvidence(value){
 return /\b(remote|remotely|work from home|work-from-home|wfh|distributed team|fully distributed|anywhere in the world|work from anywhere|location independent|fjernarbejde|hjemmearbejde|hybrid remote)\b/i.test(String(value||''));
}
function remoteGeography(value){
 const text=normalizeSearchText(value);
 if(/\b(denmark|danish|from denmark|based in denmark|remote in denmark|remote denmark|copenhagen|kobenhavn|aarhus|arhus|odense|aalborg|alborg|dansk|danmark)\b/.test(text))return 'remote-denmark';
 if(/\b(europe|european union|eu member|eu|eea|europe wide|european countries|across europe|emea)\b/.test(text))return 'remote-check';
 if(/\b(worldwide|anywhere in the world|work from anywhere|global remote|from anywhere)\b/.test(text))return 'remote-check';
 return '';
}
function directDanishLocation(value){
 const text=normalizeSearchText(value);
 return /\b(denmark|danish|danmark|kobenhavn|copenhagen|frederiksberg|aarhus|arhus|odense|aalborg|alborg|esbjerg|randers|kolding|vejle|roskilde|herning|horsens|silkeborg|naestved|helsingor|hillerod|koge|holbaek|hovedstaden|midtjylland|nordjylland|sydjylland|sjaelland|fyn|bornholm)\b/.test(text);
}
function explicitNonDanishLocation(value){
 const text=normalizeSearchText(value);
 return /\b(pakistan|islamabad|karachi|lahore|united kingdom|great britain|london|manchester|birmingham uk|united states|usa|new york|san francisco|california|texas|austin|canada|toronto|vancouver|india|mumbai|bangalore|australia|sydney|melbourne|singapore|dubai|uae|germany|berlin|munich|france|paris|netherlands|amsterdam|switzerland|zurich|poland|warsaw|spain|madrid|portugal|lisbon|italy|milan|sweden|stockholm|norway|oslo|finland|helsinki)\b/.test(text);
}
function getDanishJobScope(item,profile){
 const text=jobEvidenceText(item);
 const remote=hasRemoteEvidence(text);
 const remoteWhere=remote?remoteGeography(text):'';
 const explicitLocation=[item&&item.location,item&&item.city,item&&item.country,item&&item.address].filter(Boolean).join(' ');
 let host=String(item&&(item.domain||item.url)||'').toLowerCase();
 try{if(host.includes('://'))host=new URL(host).hostname}catch(e){}
 host=host.replace(/^www\./,'').split('/')[0];
 if(remote&&remoteWhere==='remote-denmark')return {eligible:true,kind:'remote-denmark',label:'Remote · Danmark angivet'};
 if(remote&&remoteWhere==='remote-check')return {eligible:true,kind:'remote-check',label:'Remote · tjek adgang fra DK'};
 if(explicitLocation&&explicitNonDanishLocation(explicitLocation))return {eligible:false,kind:'foreign',label:'Arbejdssted uden for Danmark'};
 if(isDanishJobPortalHost(host)||host.endsWith('.dk'))return {eligible:true,kind:'danish-portal',label:'Dansk jobportal'};
 if(explicitLocation&&directDanishLocation(explicitLocation))return {eligible:true,kind:'denmark',label:'Arbejdssted i Danmark'};
 if(directDanishLocation(item&&item.title))return {eligible:true,kind:'denmark',label:'Arbejdssted i Danmark'};
 if(remote&&directDanishLocation(text))return {eligible:true,kind:'remote-denmark',label:'Remote · Danmark angivet'};
 if(directDanishLocation(text)&&!explicitNonDanishLocation(item&&item.title))return {eligible:true,kind:'denmark',label:'Danmark nævnt i opslaget'};
 return {eligible:false,kind:'unknown',label:'Dansk placering ikke bekræftet'};
}
function isDanishJobResult(raw,query,profile){
 if(!query||query.scope!=='danish-jobs')return true;
 const url=safeHttpUrl(raw&&raw.url);if(!url)return false;
 let rawHost='';try{rawHost=new URL(url).hostname.toLowerCase()}catch(e){}
 // Query is explicitly site-limited and includes Danish geographic terms.
 if(query.id==='web-jobs')return true;
 if(query.id==='indeed-dk'&&domainMatches(rawHost,'indeed.com'))return true;
 if(query.id==='linkedin-jobs'&&domainMatches(rawHost,'linkedin.com')&&/\/jobs\/view\//i.test(url))return true;
 const item={
  url,
  domain:(()=>{try{return new URL(url).hostname}catch(e){return ''}})(),
  title:raw.title||raw.name||'',
  description:raw.description||raw.snippet||raw.content||'',
  location:raw.location||raw.workLocation||raw.work_location||raw.city||'',
  country:raw.country||'',
  address:raw.address||''
 };
 return getDanishJobScope(item,profile).eligible;
}
function isDanishMappedJob(item,profile){
 if(item&&item.matchScope&&['denmark','remote-denmark','remote-check','danish-portal','query-location'].includes(item.matchScope))return true;
 return getDanishJobScope(item,profile).eligible;
}

function jobLocationQuery(value){
 const text=normalizeSearchText(value||'Frederiksberg København');
 if(/\b(frederiksberg|kobenhavn|copenhagen|hovedstaden|kobenhavns omegn)\b/.test(text))return 'København';
 if(/\b(danmark|denmark|hele landet|hele danmark)\b/.test(text))return 'Denmark';
 return searchPhrase(value||'Denmark').split(/\s+/).filter(Boolean).slice(0,2).join(' ')||'Denmark';
}
function jobKeywordVariants(profile){return uniqueTerms((profile&&profile.terms||[]).map(searchPhrase).filter(term=>term.length>1)).slice(0,6)}
function jobQueries(profile){
 const terms=jobKeywordVariants(profile),first=terms[0]||'marketing',second=terms[1]||first,third=terms[2]||second;
 const loc=jobLocationQuery(profile.location||'Frederiksberg, København og omegn, Danmark');
 const q=(domain,term,geo)=>'site:'+domain+' '+term+' '+geo;
 const perPortal=(id,label,targetSite,domain)=>{
  const primary=q(domain,first,loc+' job'),fallback=q(domain,first,'Denmark job');
  const alternatives=uniqueTerms([second,third].filter(term=>term&&term!==first)).map(term=>q(domain,term,'Denmark job'));
  if(first===second&&first===third)alternatives.push(q(domain,first,'vacancy career'));
  return {id,label,targetSite,scope:'danish-jobs',query:primary,fallbackQuery:fallback,alternativeQueries:alternatives};
 };
 return [
  perPortal('linkedin-jobs','LinkedIn Jobs · Danmark og remote','linkedin.com','linkedin.com/jobs/view'),
  perPortal('jobindex','Jobindex Danmark','jobindex.dk','jobindex.dk/jobannonce'),
  perPortal('indeed-dk','Indeed Danmark','indeed.com','dk.indeed.com/viewjob'),
  perPortal('jobnet','Jobnet · Danmark','jobnet.dk','jobnet.dk'),
  perPortal('hk-jobportal','HK Jobportal · Danmark','hk.dk','hk.dk'),
  perPortal('stepstone','StepStone Danmark','stepstone.dk','stepstone.dk'),
  perPortal('ofir','Ofir · Danmark','ofir.dk','ofir.dk'),
  perPortal('workindenmark','Workindenmark','workindenmark.dk','workindenmark.dk'),
  perPortal('jobdanmark','Jobdanmark','jobdanmark.dk','jobdanmark.dk'),
  perPortal('thehub','The Hub · danske startupjobs','thehub.io','thehub.io/jobs'),
  perPortal('it-jobbank','IT-Jobbank','it-jobbank.dk','it-jobbank.dk'),
  perPortal('jobsearch','Jobsearch.dk','jobsearch.dk','jobsearch.dk'),
  perPortal('graduateland','Graduateland · graduatejobs','graduateland.com','graduateland.com/jobs'),
  {id:'career-sites',label:'Danske virksomheders karrieresider',targetSite:'',scope:'danish-jobs',query:first+' job '+loc+' Denmark',fallbackQuery:first+' job Denmark',alternativeQueries:uniqueTerms([second,third].filter(t=>t&&t!==first)).map(t=>t+' job Denmark')}
 ];
}
function domainMatches(host,target){
 const a=String(host||'').toLowerCase().replace(/^www\./,'');
 const b=String(target||'').toLowerCase().replace(/^www\./,'');
 return !!a&&!!b&&(a===b||a.endsWith('.'+b));
}
function classifyResult(url,title,queryId){
 const path=String(url||'').toLowerCase(),name=String(title||'').toLowerCase();
 if(queryId==='linkedin-groups'||path.includes('/groups/'))return 'group';
 if(queryId.includes('posts')||path.includes('/posts/')||path.includes('/feed/update/'))return 'post';
 if(path.includes('/in/'))return 'person';
 if(path.includes('/company/'))return 'company';
 if(/jobs|jobannonce|jobdetail|vacancy|vacancies/.test(path)||/job|stilling|vacancy|hiring|søger/i.test(name))return 'job';
 return queryId==='companies'?'company':'other';
}
function alreadyInExport(item){
 const url=canonicalSearchUrl(item.url);
 if(url&&state.connections.some(c=>canonicalSearchUrl(c.url)===url))return true;
 const title=normalizeSearchText(item.title);
 if(!title)return false;
 return state.connections.some(c=>{const name=normalizeSearchText((c.first+' '+c.last).trim());return name&&(title===name||(name.length>6&&title.startsWith(name+' ')))}); 
}
function matchedTerms(title,description,terms){
 const text=normalizeSearchText((title||'')+' '+(description||''));
 const words=new Set(text.split(/\s+/).filter(Boolean));
 return terms.filter(term=>{
  const tokens=normalizeSearchText(term).split(/\s+/).filter(token=>token.length>1);
  return tokens.length>0&&tokens.every(token=>words.has(token));
 });
}
function matchedJobTerms(item,terms){
 const text=normalizeSearchText([item&&item.jobTitle,item&&item.title,item&&item.description,item&&item.searchTags].filter(Boolean).join(' '));
 const words=new Set(text.split(/\s+/).filter(Boolean));
 return (terms||[]).filter(term=>{
  const tokens=normalizeSearchText(term).split(/\s+/).filter(token=>token.length>1);
  return tokens.length>0&&tokens.every(token=>words.has(token));
 });
}
function mapResult(raw,query,terms,usedFallback){
 const url=canonicalSearchUrl(raw&&raw.url);if(!url)return null;
 let parsed;try{parsed=new URL(url)}catch(e){return null}
 if(['puri.li','www.puri.li'].includes(parsed.hostname.toLowerCase()))return null;
 const title=String(raw.title||raw.name||parsed.hostname).trim().slice(0,500);
 const description=String(raw.description||raw.snippet||raw.content||'').replace(/\s+/g,' ').trim().slice(0,1200);
 const host=parsed.hostname.toLowerCase().replace(/^www\./,'');
 const pick=(...values)=>{for(const value of values){if(value!==undefined&&value!==null&&String(value).trim()!=='')return String(value).trim()}return ''};
 const companyFacts={
  employeeCount:pick(raw.employeeCount,raw.employee_count,raw.employees,raw.companySize,raw.company_size,raw.employeeRange),
  location:pick(raw.workLocation,raw.work_location,raw.location,raw.city,raw.address),
  distanceKm:pick(raw.distanceKm,raw.distance_km),
  employeeRating:pick(raw.employeeSatisfaction,raw.employee_satisfaction,raw.employeeRating,raw.employee_rating,raw.ratingFromEmployees),
  ratingCount:pick(raw.employeeReviewCount,raw.employee_review_count,raw.workplaceReviewCount,raw.workplace_review_count),
  industry:pick(raw.industry,raw.sector),
  foundedYear:pick(raw.foundedYear,raw.founded_year,raw.founded),
  companyType:pick(raw.companyType,raw.company_type,raw.organizationType,raw.organization_type)
 };
 const item={
  id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),
  type:classifyResult(url,title,query.id),
  title,
  jobTitle:pick(raw.jobTitle,raw.job_title,raw.positionTitle,raw.position_title,raw.role,title),
  companyName:pick(raw.companyName,raw.company_name,raw.employerName,raw.employer_name,raw.employer,raw.company),
  url,
  domain:registrableDomain(parsed.hostname),
  description,
  location:pick(raw.workLocation,raw.work_location,raw.location,raw.city,raw.country,raw.address),
  jobLocation:pick(raw.workLocation,raw.work_location,raw.location,raw.city,raw.country,raw.address),
  country:pick(raw.country),
  postedAt:pick(raw.datePosted,raw.date_posted,raw.postedAt,raw.posted_at,raw.publishedAt,raw.published_at),
  employmentType:pick(raw.employmentType,raw.employment_type,raw.jobType,raw.job_type,raw.contractType,raw.contract_type),
  workMode:pick(raw.workMode,raw.work_mode,raw.remoteType,raw.remote_type),
  salary:pick(raw.salary,raw.salaryRange,raw.salary_range,raw.compensation),
  companyFacts,
  sourceLabel:usedFallback?host:(query.targetSite&&domainMatches(host,query.targetSite)?query.label:host),
  queryId:query.id,
  queryLabel:query.label+(usedFallback?' (bredere søgning)':''),
  matchedTerms:matchedTerms(title,description,terms),
  createdAt:new Date().toISOString(),
  saved:false
 };
 if(query.scope==='danish-jobs'){const scope=getDanishJobScope(item,null);item.matchScope=scope.kind;item.matchScopeLabel=scope.label}
 return item;
}
function isGenericJobLandingPage(item){
 const title=String(item&&item.title||'').trim(),desc=String(item&&item.description||'').trim();
 const url=String(item&&item.url||'').toLowerCase(),domain=String(item&&item.domain||'').toLowerCase();
 const pageNumber=/\b(side|page|pagina)\s*\d+\b/i.test(title);
 const directoryTitle=/(denmark business|business directory|company directory|phone directory|yellow pages|find more .* detailed information|lokalhistorisk arkiv for|company at denmark|telefonbog|firmaregister|virksomhedsregister|firmanummer|jobopslag\s*[-–]\s*[\d.,]+|job listings\s*[-–]|salary guide|marketing glossary)/i.test(title);
 const directorySnippet=/(company at denmark|phone is\s+\+?\d|find more .* detailed information on this page|business directory|company directory|browse businesses|find a company)/i.test(desc);
 const genericTitle=/(^| )(remote jobs?( in)? denmark|jobs? in denmark|find jobs?|job search|search jobs?|browse jobs?|all (current )?jobs?|career opportunities|job portal|job board|job categories|vacancies in denmark|work in denmark|job opportunities in|ledige stillinger|jobmuligheder|jobsogning|jobsoegning|find et job|joboversigt|marketing glossary|salary guide|job salary|lønstatistik|company profile|about us|jobopslag)( |$)/i.test(normalizeSearchText(title));
 const genericPath=/\/(jobs?|careers?|search|job-search|job-portal|job-listings|jobs-in-denmark|remote-jobs|vacancies|business-directory|company-directory|companies|arbejdsgivere)\/?(?:\?.*)?$/.test(url);
 const nonJobHost=/soopage\.com|manta\.com|bizapedia\.com|dnb\.com|businesslist\.com|trabajo\.org|yellowpages\.com/i.test(domain);
 return pageNumber||directoryTitle||directorySnippet||genericTitle||genericPath||nonJobHost;
}
function jobTitleLooksSpecific(title){
 const raw=String(title||'').trim(),normal=normalizeSearchText(raw);
 if(raw.length<8||raw.length>170)return false;
 if(/\b(side|page|pagina)\s*\d+\b/i.test(raw))return false;
 if(/\b(denmark business|business directory|company directory|phone directory|jobopslag\s*[-–]\s*[\d.,]+|job listings|jobs in denmark|remote jobs|salary guide|marketing glossary|about us|company profile|10[.,]000 jobs|10000 jobs)\b/i.test(raw))return false;
 if(/\b\d{2}\s\d{2}\s\d{2}\s\d{2}\b/.test(raw))return false;
 const words=normal.split(/\s+/).filter(Boolean);return words.length>=2&&words.length<=16;
}
function directJobDetailUrl(item){
 const parsed=(()=>{try{return new URL(String(item&&item.url||''))}catch(e){return null}})();if(!parsed)return false;
 const host=parsed.hostname.toLowerCase().replace(/^www\./,''),path=parsed.pathname.toLowerCase(),query=parsed.search.toLowerCase();
 if(host.endsWith('linkedin.com'))return /\/jobs\/view\/[^/]+/.test(path)&&/\d{5,}/.test(path);
 if(host==='indeed.com'||host.endsWith('.indeed.com'))return /\/viewjob\b/.test(path)&&/[?&](jk|vjk)=/.test(query);
 if(host==='jobindex.dk'||host.endsWith('.jobindex.dk'))return /\/jobannonce\/[^/]+/.test(path)||/\/job\/[^/]+/.test(path);
 if(host==='jobnet.dk'||host.endsWith('.jobnet.dk'))return /\/find-job\/[0-9a-f-]{20,}\b/i.test(path)||/\/(job|jobannonce|stilling|stillinger)\/[^/]+/.test(path);
 if(host==='stepstone.dk'||host.endsWith('.stepstone.dk'))return /\/(job|jobad|stilling|stellenangebote)\/[^/]+/.test(path);
 if(host==='ofir.dk'||host.endsWith('.ofir.dk'))return /\/(job|jobs|stilling|stillinger)\/[^/]+/.test(path);
 if(host==='workindenmark.dk'||host.endsWith('.workindenmark.dk'))return /\/(job|jobs|vacancy|vacancies|stillinger)\/[^/]+/.test(path);
 if(host==='jobdanmark.dk'||host.endsWith('.jobdanmark.dk'))return /\/(job|jobs|stilling|stillinger)\/[^/]+/.test(path);
 if(host==='hk.dk'||host.endsWith('.hk.dk'))return /\/(job|jobs|jobannonce|stillinger)\/[^/]+/.test(path);
 const segments=path.split('/').filter(Boolean),detailWords=['job','jobs','career','careers','vacancy','vacancies','stilling','stillinger','position','positions','opportunities'];
 const ix=segments.findIndex(segment=>detailWords.includes(segment));
 return ix>=0&&segments.length>=ix+2&&!['search','all','category','categories','locations','teams','department'].includes(segments[ix+1]);
}
function isLikelySpecificJobPosting(item,query){
 if(!item||!safeHttpUrl(item.url)||isGenericJobLandingPage(item))return false;
 const title=String(item.jobTitle||item.title||'').trim();if(!jobTitleLooksSpecific(title))return false;
 const host=(()=>{try{return new URL(item.url).hostname.toLowerCase().replace(/^www\./,'')}catch(e){return ''}})();
 const description=String(item.description||'');
 const postingLanguage=/\b(we are looking for|we're looking for|you will|ansøg|søger en|vi søger|stillingen|jobbet|apply now|apply for|your role|responsibilities|requirements|qualifications|arbejdsopgaver|arbejdssted|deadline|job id|jobnummer|vi tilbyder|du bliver en del af|dine opgaver|om stillingen|du skal|apply today|send your application|ansøgningsfrist)\b/i.test(description);
 const titleLooksLikeRole=/\b(head of|manager|specialist|consultant|konsulent|koordinator|coordinator|teamleader|team lead|chef|leder|lead|analyst|analytiker|developer|udvikler|advisor|rådgiver|sælger|sales representative|projektleder|project manager|designer|art director|copywriter|storyteller|content lead|ingeniør|engineer|assistent|assistant|director|direktør|praktikant|intern|associate|business partner|account executive|account manager|communications manager|marketing manager|marketing specialist|crm specialist|customer success|growth manager|e-commerce manager|content manager|product manager|data analyst|finance manager|hr manager|recruiter|rekrutter|jurist|advokat|student assistant|phd fellow|research fellow|researcher|lecturer|professor|nurse|sygeplejerske|teacher|lærer|technician|tekniker|architect|arkitekt|operator|controller|executive|officer|strategist|specialkonsulent|fuldmægtig|medarbejder|specialrådgiver)\b/i.test(title);
 const knownPortal=['jobindex.dk','jobnet.dk','stepstone.dk','ofir.dk','hk.dk','workindenmark.dk','jobdanmark.dk','indeed.com','linkedin.com','thehub.io','graduateland.com','it-jobbank.dk','jobsearch.dk'].some(domain=>host===domain||host.endsWith('.'+domain));
 if(knownPortal&&directJobDetailUrl(item))return titleLooksLikeRole;
 // A company career page must look like a single job URL and contain vacancy language.
 if(!knownPortal&&directJobDetailUrl(item))return titleLooksLikeRole&&postingLanguage;
 return false;
}
async function queryIndex(query,terms,profile){
 async function request(q){
  const endpoint=LIVE_SEARCH_API+'?'+new URLSearchParams({q,page:'1',exact:'0'}).toString();
  const data=await fetchJsonTimeout(endpoint,15000);
  if(!data||typeof data!=='object')throw new Error('Uventet svar fra webindekset.');
  if(data.error&&!Array.isArray(data.results))throw new Error(String(data.error));
  return Array.isArray(data.results)?data.results:(Array.isArray(data.items)?data.items:[]);
 }
 function mapAndFilter(rows,usedFallback){
  return rows.map(row=>{
   if(!row||!safeHttpUrl(row.url))return null;
   if(!isDanishJobResult(row,query,profile))return null;
   const item=mapResult(row,query,terms,usedFallback);if(!item)return null;
   if(query.scope==='danish-jobs'){
    item.matchedTerms=matchedJobTerms(item,terms);
    if(!item.matchedTerms.length)return null;
   }
   const host=new URL(item.url).hostname;
   // Restrict results to the intended portal; Indeed subdomains such as dk.indeed.com count as Indeed.
   if(query.targetSite&&!domainMatches(host,query.targetSite))return null;
   if(query.scope==='danish-jobs'&&!isLikelySpecificJobPosting(item,query))return null;
   if(query.scope==='danish-jobs'){
    let scope=getDanishJobScope(item,profile);
    if(!scope.eligible&&(query.id==='indeed-dk'||query.id==='linkedin-jobs'||query.id==='web-jobs')){
     const text=jobEvidenceText(item);
     if(!explicitNonDanishLocation(text)){
      const label=query.id==='indeed-dk'?'Indeed Danmark':query.id==='linkedin-jobs'?'LinkedIn Jobs':'Bred webindekssøgning';
      scope={eligible:true,kind:'query-location',label:label+' · kontrollér arbejdssted'};
     }
    }
    if(!scope.eligible)return null;
    item.matchScope=scope.kind;item.matchScopeLabel=scope.label;
   }
   return item;
  }).filter(Boolean);
 }
 const searchVariants=[query.query,query.fallbackQuery,...(query.alternativeQueries||[])].filter((value,index,all)=>value&&all.indexOf(value)===index);
 const unique=new Map(),errors=[],attempts=[];
 let totalRaw=0,totalMapped=0;
 for(let i=0;i<searchVariants.length;i++){
  const text=searchVariants[i];let rows=[];
  try{
   rows=await request(text);
   totalRaw+=rows.length;
   const mapped=mapAndFilter(rows,i>0);
   totalMapped+=mapped.length;
   for(const item of mapped){
    const key=canonicalSearchUrl(item.url),old=unique.get(key);
    if(!old||item.matchedTerms.length>old.matchedTerms.length)unique.set(key,item);
   }
   attempts.push({query:text,raw:rows.length,mapped:mapped.length,error:''});
  }catch(error){
   errors.push(String(error&&error.message||error).slice(0,140));
   attempts.push({query:text,raw:0,mapped:0,error:String(error&&error.message||error).slice(0,140)});
  }
  // Keep each portal quick, but try another keyword when the index has no usable match.
  if(unique.size>=8)break;
 }
 if(!unique.size&&errors.length===searchVariants.length)throw new Error(errors.join(' / '));
 return {query,results:[...unique.values()],usedFallback:attempts.some((attempt,index)=>index>0&&attempt.mapped>0),diagnostics:{raw:totalRaw,mapped:totalMapped,attempts,errors}};
}
function toggleBusy(id,busy,label){
 const button=el(id);if(!button)return;
 if(busy){button.dataset.previousLabel=button.textContent;button.disabled=true;button.textContent=label||'Søger…'}
 else{button.disabled=false;button.textContent=button.dataset.previousLabel||button.textContent;delete button.dataset.previousLabel}
}
function showNetworkStatus(message,kind){
 const node=el('networkDiscoveryStatus');if(!node)return;node.className='notice '+(kind||'');node.textContent=message;
}
async function runNetworkSearch(kind){
 const profile=searchProfile(),people=kind==='people',buttonId=people?'networkProspectsSearchButton':'networkCommunitiesSearchButton';
 saveNetworkSearchPreferences();toggleBusy(buttonId,true,people?'Finder relevante profiler…':'Søger efter faglige opslag…');
 showNetworkStatus('Søgningen kører i det offentlige webindeks. Dit CV og dine kontaktdata sendes ikke med.','goodbox');
 const queries=discoverQueries(kind,profile);
 try{
  const results=await Promise.allSettled(queries.map(query=>queryIndex(query,profile.terms,profile)));
  let succeeded=0,failed=0;const merged=[],errors=[];
  results.forEach((result,index)=>{if(result.status==='fulfilled'){succeeded++;merged.push(...result.value.results)}else{failed++;errors.push(queries[index].label+': '+String(result.reason&&result.reason.message||result.reason).slice(0,120))}});
  const unique=new Map();
  merged.forEach(item=>{if(people&&alreadyInExport(item))return;const key=canonicalSearchUrl(item.url),old=unique.get(key);if(!old||item.matchedTerms.length>old.matchedTerms.length)unique.set(key,item)});
  let list=[...unique.values()];
  list=people?list.filter(item=>['person','company','other'].includes(item.type)):list.filter(item=>['post','group','other'].includes(item.type));
  list.sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length);
  list=list.slice(0,24);
  if(people)state.networkProspects=list;else state.networkCommunities=list;
  state.networkLastSearch=new Date().toISOString();persist();
  if(people)renderProspects();else renderCommunities();
  showNetworkStatus((succeeded?'Søgning afsluttet. ':'Søgningen kunne ikke gennemføres. ')+list.length+(people?' mulige kontakter/virksomheder':' grupper/opslag')+' fundet. '+failed+' af '+queries.length+' kildeområder fejlede. Kontrollér originalsidens dato og relevans.'+(errors.length?' Fejl: '+errors.join(' | '):''),failed===queries.length?'warnbox':'goodbox');
 }catch(error){showNetworkStatus('Søgningen fejlede: '+String(error&&error.message||error),'warnbox')}
 finally{toggleBusy(buttonId,false)}
}
function searchNetworkProspects(){return runNetworkSearch('people')}
function searchNetworkCommunities(){return runNetworkSearch('communities')}
function buildDiscoveryCard(item,index,collection){
 const url=safeHttpUrl(item.url),label={person:'Mulig kontakt',company:'Relevant virksomhed',post:'Fagligt opslag',group:'Faggruppe',job:'Muligt job',other:'Relevant webresultat'}[item.type]||'Webresultat';
 const matched=item.matchedTerms||[];
 const reason=matched.length?'Profilord i titel/uddrag: '+matched.join(', '):'Fundet med søgningen '+(item.queryLabel||'efter dine profilord');
 const linkedin=!!(url&&domainMatches(new URL(url).hostname,'linkedin.com'));
 let html='<article class="discovery-card"><div class="discovery-card-top"><span class="discovery-source">'+escapeHtml(item.sourceLabel||item.domain||'Webresultat')+'</span><span class="chip">'+escapeHtml(label)+'</span></div><h3>'+escapeHtml(item.title||item.domain||'Webresultat')+'</h3><p class="lead-company">'+escapeHtml(item.domain||'')+'</p>';
 if(item.description)html+='<p class="lead-snippet">'+escapeHtml(item.description)+'</p>';
 html+='<p class="lead-reason">'+escapeHtml(reason)+'. Dette er kun et offentligt søgeindeks-signal — ikke en bekræftelse af nuværende rolle eller aktiv rekruttering.</p><div class="discovery-matched">'+matched.slice(0,6).map(term=>'<span class="chip">'+escapeHtml(term)+'</span>').join('')+'</div><div class="discovery-actions">';
 if(url)html+='<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">'+(linkedin?'Åbn LinkedIn ↗':'Åbn original ↗')+'</a>';
 html+='<button class="secondary" data-discovery-action="follow" data-collection="'+collection+'" data-index="'+index+'">Tilføj opfølgning</button>';
 if(item.type==='person')html+='<button class="secondary" data-discovery-action="copy" data-collection="'+collection+'" data-index="'+index+'">Kopiér connect-tekst</button>';
 html+='</div></article>';return html;
}
function renderProspects(){
 const list=state.networkProspects||[];
 if(el('networkProspectsResults'))el('networkProspectsResults').innerHTML=list.length?list.map((item,index)=>buildDiscoveryCard(item,index,'prospects')).join(''):'<div class="empty">Ingen nye kontakter blev fundet. Prøv andre profilord. Resultaterne er begrænset af, hvad søgeindekset kan se offentligt.</div>';
 if(el('networkProspectsMeta'))el('networkProspectsMeta').textContent=list.length+' forslag';
}
function renderCommunities(){
 const list=state.networkCommunities||[];
 if(el('networkCommunitiesResults'))el('networkCommunitiesResults').innerHTML=list.length?list.map((item,index)=>buildDiscoveryCard(item,index,'communities')).join(''):'<div class="empty">Ingen grupper eller opslag blev fundet. Prøv bredere profilord eller en anden geografi.</div>';
 if(el('networkCommunitiesMeta'))el('networkCommunitiesMeta').textContent=list.length+' forslag';
}
function renderDiscoveryResults(){renderProspects();renderCommunities()}

function companySourceHost(source){
 const raw=typeof source==='string'?source:(source&&source.url)||'';
 const url=safeHttpUrl(raw);if(!url)return '';
 try{return new URL(url).hostname.toLowerCase().replace(/^www\./,'')}catch(e){return ''}
}
function hostMatchesOne(host,domains){return domains.some(domain=>host===domain||host.endsWith('.'+domain))}
function isDanishCompanySource(source){
 const host=companySourceHost(source);
 return !!host&&hostMatchesOne(host,['krak.dk','jobindex.dk','jobrate.dk','proff.dk','estatistik.dk','ownr.dk','virk.dk','datacvr.virk.dk','cvr.dk']);
}
function isWorkplaceReviewSource(source){
 const host=companySourceHost(source);
 return !!host&&hostMatchesOne(host,['jobindex.dk','jobrate.dk','glassdoor.com','glassdoor.co.uk','indeed.com','indeed.co.uk','kununu.com','comparably.com','greatplacetowork.dk','greatplacetowork.com']);
}
function isCompanyLookupSource(source){return isDanishCompanySource(source)||isWorkplaceReviewSource(source)}
function isOfficialDanishCompanySource(source){
 const host=companySourceHost(source);
 return !!host&&hostMatchesOne(host,['virk.dk','datacvr.virk.dk','cvr.dk']);
}
function curatedCompanyFacts(){return {}}
function effectiveCompanyFacts(item){
 const stored=item&&item.companyFacts||{};
 const allSources=(Array.isArray(stored.sources)?stored.sources:[]).filter(source=>isCompanyLookupSource(source));
 const result={
  lookupStatus:stored.lookupStatus,lookupAt:stored.lookupAt,lookupError:stored.lookupError,
  sources:allSources,danishCompanyConfirmed:!!stored.danishCompanyConfirmed,
  locationKind:stored.locationKind||'',distanceMethod:stored.distanceMethod||'',
  distanceOriginLabel:stored.distanceOriginLabel||'',distanceTargetLabel:stored.distanceTargetLabel||'',
  distanceMessage:stored.distanceMessage||'',distanceDestinationDisplay:stored.distanceDestinationDisplay||''
 };
 const facts=['employeeCount','location','industry','foundedYear','companyType','employeeRating','ratingCount'];
 const factSources={};
 for(const field of facts){
  const source=stored.factSources&&stored.factSources[field];
  const jobLocation=field==='location'&&stored.locationKind==='job'&&safeHttpUrl(source&&source.url);
  const greatPlaceEmployeeCount=field==='employeeCount'&&hostMatchesOne(companySourceHost(source),['greatplacetowork.dk','greatplacetowork.com']);
  const sourceAllowed=(field==='employeeRating'||field==='ratingCount')?isWorkplaceReviewSource(source):(greatPlaceEmployeeCount||jobLocation||isDanishCompanySource(source));
  if(source&&sourceAllowed&&String(stored[field]||'').trim()){
   result[field]=stored[field];factSources[field]=source;
  }
 }
 const distanceSource=stored.factSources&&stored.factSources.distanceKm;
 if(distanceSource&&hostMatchesOne(companySourceHost(distanceSource),['openstreetmap.org'])&&String(stored.distanceKm||'').trim()){
  result.distanceKm=stored.distanceKm;factSources.distanceKm=distanceSource;
 }
 if(stored.companyHighlight)result.companyHighlight=stored.companyHighlight;
 result.factSources=factSources;
 return result;
}
function companyNameFromOpportunity(item){
 const supplied=String(item&&(item.companyName||item.company||item.employer)||'').trim();
 if(supplied&&!/^\d{4,}$/.test(supplied)&&!/^(indeed|jobindex|linkedin|stepstone|jobnet|ofir|workindenmark|trabajo|soopage)$/i.test(supplied))return supplied.slice(0,120);
 const title=String(item&&(item.jobTitle||item.title)||'').trim();
 const byline=title.match(/\b(?:at|hos|ved)\s+([A-ZÆØÅ][A-Za-zÆØÅæøå\d&.' -]{1,70}?)(?:\s*[|–—,]|$)/i);
 if(byline&&byline[1]&&!/^(denmark|danmark|company|the company|unknown)$/i.test(byline[1].trim()))return byline[1].trim();
 const pipeParts=title.split(/\s*\|\s*/).map(value=>value.trim()).filter(Boolean);
 if(pipeParts.length>1){
  const candidate=pipeParts.slice(1).find(value=>value.length<65&&!/\b(side|page|denmark business|jobopslag|job listings|salary|jobs? in|remote jobs?)\b/i.test(value));
  if(candidate&&!/^\d{4,}$/.test(candidate)&&!/\.(com|org|net|dk|co\.uk)$/i.test(candidate))return candidate;
 }
 return 'Arbejdsgiver ikke oplyst';
}
function normalizeInsightText(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function companyResultRelevant(result,company,item){
 if(!isCompanyLookupSource(result))return false;
 const content=normalizeInsightText([result.title,result.description,result.url].join(' '));
 const target=normalizeInsightText(company);
 const legalForms=new Set(['aps','as','a','s','ab','holding','group','inc','llc','ltd','limited','gmbh','plc','company','co']);
 const tokens=target.split(/\s+/).filter(token=>token.length>=4&&!legalForms.has(token));
 const contentTokens=content.split(/\s+/);
 const matches=tokens.filter(token=>contentTokens.includes(token)).length;
 if(target&&content.includes(target))return true;
 // A distinctive brand-name token is enough after an exact, company-targeted source search.
 return matches>0;
}
function companySourceHost(source){
 const url=safeHttpUrl(source&&source.url);
 try{return new URL(url||'').hostname.toLowerCase().replace(/^www\./,'')}catch(e){return ''}
}
async function enrichCompanyPageContext(source){
 const host=companySourceHost(source),url=safeHttpUrl(source&&source.url);
 const isJobindex=host==='jobindex.dk'||host.endsWith('.jobindex.dk');
 const isKrak=host==='krak.dk'||host.endsWith('.krak.dk');
 const isWorkplace=isWorkplaceReviewSource(source);
 const isReviewProfile=/\/Reviews?\/|\/cmp\/|\/company\/|\/certificerede-arbejdspladser\/|\/arbejdsplads\/|\/Overview\/|working-at-/i.test(String(url||''));
 if(!url||(!isJobindex&&!isKrak&&!isWorkplace))return source;
 if(isJobindex&&!/\/virksomhed\//i.test(url))return source;
 if(isKrak&&!/firma|virksomhed/i.test(url))return source;
 if(isWorkplace&&!isReviewProfile)return source;
 try{
  const endpoint=COMPANY_CONTEXT_API+'?'+new URLSearchParams({url}).toString();
  const ctx=await fetchJsonTimeout(endpoint,10000);
  const pageContent=String(ctx&&(ctx.content||ctx.summary||ctx.description)||'').replace(/\s+/g,' ').trim();
  if(pageContent.length<60)return {...source,contextFetchStatus:'empty'};
  return {...source,pageContent:pageContent.slice(0,16000),contextTitle:String(ctx.title||source.title||''),contextCoverage:String(ctx.coverage||'unknown'),contextFetchStatus:'ok'};
 }catch(error){return {...source,contextFetchStatus:'failed',contextFetchError:String(error&&error.message||error).slice(0,180)}}
}
function haversineDistanceKm(lat1,lon1,lat2,lon2){
 const rad=value=>value*Math.PI/180,dLat=rad(lat2-lat1),dLon=rad(lon2-lon1);
 const a=Math.sin(dLat/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
}
let companyGeocodeQueue=Promise.resolve();
let companyGeocodeLastRequestAt=0;
function requestCompanyGeocode(url){
 const task=companyGeocodeQueue.then(async()=>{
  const wait=Math.max(0,1100-(Date.now()-companyGeocodeLastRequestAt));
  if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
  companyGeocodeLastRequestAt=Date.now();
  return fetchJsonTimeout(url,10000);
 });
 companyGeocodeQueue=task.catch(()=>{});
 return task;
}
async function geocodeDanishCompanyLocation(location){
 const query=String(location||'').trim();if(!query)return null;
 const key='gajh_company_geocode_'+normalizeInsightText(query);
 try{const cached=localStorage.getItem(key);if(cached){const parsed=JSON.parse(cached);if(Number.isFinite(parsed.lat)&&Number.isFinite(parsed.lon))return parsed;if(parsed.notFound===true&&Number(parsed.expiresAt)>Date.now())return null}}catch(e){}
 const candidates=[query];
 const parts=query.split(/[,;|]/).map(value=>value.trim()).filter(Boolean);
 if(parts.length>1){
  const postalCity=parts.findIndex(value=>/\b\d{4}\s+[A-ZÆØÅa-zæøå]/.test(value));
  if(postalCity>=0)candidates.push(parts[postalCity]);
  const tail=parts.slice(-2).join(', ');
  if(tail&&tail!==query)candidates.push(tail);
 }
 const seen=new Set();
 for(const candidate of candidates){
  const normalized=normalizeInsightText(candidate);if(!normalized||seen.has(normalized))continue;seen.add(normalized);
  const endpoint=COMPANY_GEOCODE_API+'?'+new URLSearchParams({format:'jsonv2',countrycodes:'dk',limit:'1',q:candidate}).toString();
  try{
   const rows=await requestCompanyGeocode(endpoint);
   if(!Array.isArray(rows)||!rows.length)continue;
   const value={lat:Number(rows[0].lat),lon:Number(rows[0].lon),displayName:String(rows[0].display_name||candidate),sourceUrl:'https://www.openstreetmap.org/',matchedQuery:candidate};
   if(!Number.isFinite(value.lat)||!Number.isFinite(value.lon))continue;
   try{localStorage.setItem(key,JSON.stringify(value));localStorage.setItem('gajh_company_geocode_'+normalized,JSON.stringify(value))}catch(e){}
   return value;
  }catch(e){/* Try a less-specific Danish address before giving up. */}
 }
 try{localStorage.setItem(key,JSON.stringify({notFound:true,expiresAt:Date.now()+60*60*1000}))}catch(e){}
 return null;
}
async function resolveDistanceOrigin(){
 const raw=String(state.distanceOrigin||'').trim();
 if(raw){
  const coords=await geocodeDanishCompanyLocation(raw);
  if(coords)return {...coords,personalized:true,originLabel:'din gemte placering'};
 }
 return {...FREDERIKSBERG_ORIGIN,displayName:FREDERIKSBERG_ORIGIN.label,personalized:false,originLabel:FREDERIKSBERG_ORIGIN.label,geocodeFailed:!!raw};
}
async function updateOpportunityDistance(item,facts){
 if(!item)return false;
 facts=facts||item.companyFacts||(item.companyFacts={});
 const sourceLocation=String(facts.location||'').trim();
 const sourceLocationIsCompany=!!(sourceLocation&&facts.locationKind!=='job'&&facts.factSources&&facts.factSources.location&&isDanishCompanySource(facts.factSources.location));
 const candidates=[];
 const jobLocation=String(item.jobLocation||item.location||item.city||'').trim();
 const isGenericLocation=value=>/^(?:denmark|danmark|dk|remote|remote jobs?|remote\s*[·,-]\s*(?:denmark|danmark)|danmark\s*[·,-]\s*arbejdssted skal bekræftes|denmark\s*[·,-]\s*workplace to be confirmed)$/i.test(String(value||'').trim())||/(?:arbejdssted skal bekræftes|kontrollér arbejdssted|confirm workplace|location to be confirmed)/i.test(String(value||''));
 if(jobLocation&&!isGenericLocation(jobLocation))candidates.push({value:jobLocation,kind:'job'});
 if(sourceLocationIsCompany&&sourceLocation)candidates.push({value:sourceLocation,kind:'company'});
 if(sourceLocation&&!candidates.some(candidate=>normalizeInsightText(candidate.value)===normalizeInsightText(sourceLocation)))candidates.push({value:sourceLocation,kind:'job'});
 const usable=candidates.filter((candidate,index)=>candidate.value&&!isGenericLocation(candidate.value)&&candidates.findIndex(other=>normalizeInsightText(other.value)===normalizeInsightText(candidate.value))===index);
 if(!usable.length){
  facts.distanceKm='';facts.distanceMessage='Arbejdssted/adresse mangler i de fundne kilder';
  facts.distanceOriginLabel=String(state.distanceOrigin||'').trim()?'din gemte placering':'Frederiksberg bymidte (standard)';
  return false;
 }
 const origin=await resolveDistanceOrigin();
 let resolved=null;
 for(const candidate of usable){
  const destination=await geocodeDanishCompanyLocation(candidate.value);
  if(destination){resolved={candidate,destination};break}
 }
 if(!resolved){
  facts.distanceKm='';
  facts.distanceMessage='Arbejdsstedet blev fundet, men ingen af de fundne adresse-/stedangivelser kunne placeres sikkert på kortet';
  facts.distanceOriginLabel=origin.originLabel;
  return false;
 }
 const {candidate,destination}=resolved;
 facts.distanceKm=haversineDistanceKm(origin.lat,origin.lon,destination.lat,destination.lon).toLocaleString('da-DK',{maximumFractionDigits:1});
 facts.distanceMethod='Luftlinje';
 facts.distanceOriginLabel=origin.personalized?'din gemte placering':(origin.geocodeFailed?'Frederiksberg bymidte (standard · gemt placering kunne ikke geokodes)':'Frederiksberg bymidte (standard)');
 facts.distanceTargetLabel=candidate.kind==='company'?'virksomhedsadresse':'jobbets arbejdssted';
 facts.distanceMessage='';
 facts.distanceDestinationDisplay=destination.displayName||candidate.value;
 facts.factSources=facts.factSources||{};
 facts.factSources.distanceKm={url:destination.sourceUrl||'https://www.openstreetmap.org/',title:'OpenStreetMap-geokodning',domain:'openstreetmap.org'};
 if(candidate.kind==='job'&&!sourceLocationIsCompany){
  facts.location=candidate.value;facts.locationKind='job';
  facts.factSources.location={url:safeHttpUrl(item.url),title:String(item.jobTitle||item.title||'Originalt jobopslag'),domain:String(item.domain||''),description:String(item.description||'').slice(0,1000)};
 }
 return true;
}
async function refreshOpportunityDistances(){
 const jobs=(state.jobOpportunities||[]).filter(item=>item&&item.url);
 let processed=0;
 const status=el('distanceOriginStatus');
 for(const item of jobs){
  item.companyFacts=item.companyFacts||{};
  await updateOpportunityDistance(item,item.companyFacts);
  processed++;
  persist();
  renderJobOpportunities();
  if(status){
   status.className='distance-origin-status'+(state.distanceOrigin?' is-saved':'');
   status.textContent='Afstande opdateres løbende: '+processed+' af '+jobs.length+' stillinger kontrolleret. Kort afstand er luftlinje; jobbet vises stadig, mens de øvrige adresser undersøges.';
  }
 }
 if(!jobs.length){persist();renderJobOpportunities()}
}
function applyCompanySourceFacts(sources,prior){
 const f={...(prior||{})},factSources={...(f.factSources||{})};
 const bodyOf=source=>String((source.title||'')+' '+(source.description||'')+' '+(source.pageContent||'')).replace(/\s+/g,' ');
 const fill=(field,value,source)=>{if(!String(f[field]||'').trim()&&value!==undefined&&value!==null&&String(value).trim()!==''){f[field]=String(value).trim();factSources[field]=source}};
 const prioritised=[...(sources||[])].sort((a,b)=>{
  const rank=source=>companySourceHost(source).includes('jobindex.dk')?0:companySourceHost(source).includes('krak.dk')?1:isWorkplaceReviewSource(source)?2:3;
  return rank(a)-rank(b);
 });
 for(const source of prioritised){
  if(!isCompanyLookupSource(source))continue;
  const text=bodyOf(source),structured=source.companyFacts||{};
  const isJobAd=String(source.sourceType||'')==='jobindex-ads-dk'||/\/jobannonce|\/jobs?\/|\/stilling/i.test(String(source.url||''));
  const companyDataSource=isDanishCompanySource(source)&&!isJobAd;
  const workplace=isWorkplaceReviewSource(source)&&!isJobAd;
  let m;
  if(companyDataSource){
   fill('employeeCount',structured.employeeCount||structured.employee_count||structured.employees||structured.companySize||structured.company_size||structured.employeeRange,source);
   fill('location',structured.location||structured.workLocation||structured.work_location||source.location||source.city||source.address,source);
   if(factSources.location)f.locationKind='company';
   fill('industry',structured.industry||structured.sector,source);
   fill('foundedYear',structured.foundedYear||structured.founded_year||structured.founded,source);
   fill('companyType',structured.companyType||structured.company_type||structured.organizationType||structured.organization_type,source);
   if(!f.employeeCount){
    m=text.match(/(?:company size|antal ansatte|antal medarbejdere|employees|employee count|staff size)\s*[:\-]?\s*(\d{1,4}\s*[-–]\s*\d{1,4}|\d{1,3}(?:[.,\s]\d{3})*|\d{1,5})(?:\s*(?:employees|medarbejdere|ansatte))?/i);
    if(m)fill('employeeCount',m[1].replace(/\s+/g,' ').trim(),source);
   }
   if(!f.employeeCount&&(m=text.match(/\b(\d{1,4}\s*[-–]\s*\d{1,4})\s*(?:employees|medarbejdere|ansatte)\b/i)))fill('employeeCount',m[1].replace(/\s+/g,' ').trim(),source);
   if(!f.employeeCount&&(m=text.match(/\b(\d{1,5})\s+(?:ansatte|medarbejdere|employees)\b/i)))fill('employeeCount',m[1],source);
   if(!f.foundedYear&&(m=text.match(/(?:stiftet|etableret|grundlagt|founded|registreringsdato)\D{0,32}\b(19\d{2}|20\d{2})\b/i)))fill('foundedYear',m[1],source);
   if(!f.location&&(m=text.match(/(?:headquarters|headquartered|hovedkontor|location|lokation|adresse|address|besøgsadresse|postadresse)\s*[:\-]?\s*(.{3,100})/i))){
    const location=m[1].split(/\b(?:company size|company type|type|founded|industry|specialties|employees|employee count|about us|visit website|revenue|virksomhedstype|antal ansatte|telefon|phone|CVR|kontakt|åbningstider)\b/i)[0].replace(/[|,;\s.]+$/,'').trim();
    if(location&&location.length<=100){fill('location',location,source);if(factSources.location)f.locationKind='company'}
   }
   if(!f.location&&(m=text.match(/\b(\d{4}\s+[A-ZÆØÅ][A-Za-zÆØÅæøå .'-]{2,50})\b/))){fill('location',m[1].trim(),source);if(factSources.location)f.locationKind='company'}
   if(!f.industry&&(m=text.match(/(?:branche|industry|sector|hovedbranche|branchekode)\s*[:\-]?\s*(.{3,70})/i))){
    const industry=m[1].split(/\b(?:company size|company type|type|founded|headquarters|employees|specialties|about us|revenue)\b/i)[0].replace(/[|,;\s.]+$/,'').trim();
    if(industry&&industry.length<=70)fill('industry',industry,source);
   }
   if(!f.companyType&&(m=text.match(/(?:company type|type|virksomhedsform|selskabsform|organization type)\s*[:\-]?\s*(privately held|public company|privately owned|private company|offentlig institution|aktieselskab|anpartsselskab|ApS|A\/S|I\/S|P\/S|limited|gmbh|llc|inc\.?)/i)))fill('companyType',m[1],source);
  }
  if(workplace&&hostMatchesOne(companySourceHost(source),['greatplacetowork.dk','greatplacetowork.com'])&&!f.employeeCount){
   m=text.match(/(?:antal medarbejdere i Danmark|employees in Denmark|number of employees in Denmark)\\s*[:\\-]?\\s*(\\d{1,5})/i);
   if(m)fill('employeeCount',m[1],source);
  }
  if(workplace&&!f.employeeRating){
   const structuredRating=structured.employeeSatisfaction||structured.employee_satisfaction||structured.employeeRating||structured.employee_rating||structured.ratingFromEmployees||structured.rating;
   if(structuredRating&&Number(String(structuredRating).replace(',','.'))>=0&&Number(String(structuredRating).replace(',','.'))<=5)fill('employeeRating',String(structuredRating).replace(',','.'),source);
   if(!f.employeeRating){
    const positivePct=text.match(/\b(100|[1-9]?\d)\s*%\s*(?:af medarbejderne|of employees)[\s\S]{0,220}(?:rigtig godt sted at arbejde|great place to work|positive workplace|positive experience|trives på arbejdet)/i);
    if(positivePct){
     const pct=Number(positivePct[1]);
     if(pct>=0&&pct<=100)fill('employeeRating',pct+'% positive medarbejderoplevelse',source);
    }
    m=null;
   if(!f.employeeRating){
     m=text.match(/(?:employee|workplace|company|employer|overall|jobindex|indeed|glassdoor|kununu)?\s*(?:rating|rated|score|job satisfaction|jobglæde|medarbejdertilfredshed|arbejdspladsvurdering|samlet vurdering|evaluering)\D{0,45}([1-5](?:[,.]\d)?)(?:\s*(?:\/\s*5|out of 5|ud af 5|af 5|stjerner?|stars?))?/i)
      ||text.match(/\b([1-5][,.]\d)\s*(?:\/\s*5|out of 5|ud af 5|stjerner af 5|stars? out of 5)\b/i);
    }
    if(m){
     const possible=String(m[1]||m[2]||'').replace(',','.');
     const ratingNumber=Number(possible);
     if(Number.isFinite(ratingNumber)&&ratingNumber>=1&&ratingNumber<=5)fill('employeeRating',possible,source);
    }
    if(!f.employeeRating){
     const stars=text.match(/[★⭐☆]{4,5}/);
     if(stars){const filled=(stars[0].match(/[★⭐]/g)||[]).length;const total=stars[0].length;if(total===5&&filled>=1)fill('employeeRating',String(filled)+'.0',source)}
    }
   }
  }
  if(workplace&&!f.ratingCount){
   const patterns=[
    /\b([\d.,]{1,10})\s+(?:total\s+)?(?:(?:company|employee|employer)\s+)?(?:anmeldelser|vurderinger|evalueringer|medarbejderanmeldelser|employee reviews|company reviews|reviews|ratings)\b/i,
    /(?:based on|baseret på|from)\s+([\d.,]{1,10})\s+(?:reviews|ratings|anmeldelser|vurderinger)/i
   ];
   for(const pattern of patterns){m=text.match(pattern);if(m){fill('ratingCount',m[1].replace(/[.,](?=\d{3}(?:\D|$))/g,'').trim(),source);if(f.ratingCount)break}}
  }
 }
 f.factSources=factSources;return f;
}
async function lookupCompanyInsights(indexOrItem){
 const item=typeof indexOrItem==='number'?(state.jobOpportunities||[])[indexOrItem]:indexOrItem;
 if(!item||!(state.jobOpportunities||[]).includes(item))return;
 const company=companyNameFromOpportunity(item);if(!company||company==='Virksomheden')return;
 item.companyFacts=item.companyFacts||{};
 if(item.companyFacts.lookupStatus==='loading')return;
 item.companyFacts.lookupStatus='loading';persist();renderJobOpportunities();
 // Calculate from the job's own location immediately while the more extensive employer lookup continues.
 const earlyDistanceTask=(async()=>{
  const facts=item.companyFacts;
  const jobLocation=String(item.jobLocation||item.location||item.city||'').trim();
  const generic=/^(?:denmark|danmark|dk|remote|remote jobs?|remote\s*[·,-]\s*(?:denmark|danmark))$/i.test(jobLocation);
  if(jobLocation&&!generic&&(!facts.location||facts.locationKind==='job')){
   facts.location=jobLocation;facts.locationKind='job';facts.factSources=facts.factSources||{};
   facts.factSources.location={url:safeHttpUrl(item.url),title:String(item.jobTitle||item.title||'Originalt jobopslag'),domain:String(item.domain||''),description:String(item.description||'').slice(0,1000)};
  }
  await updateOpportunityDistance(item,facts);
  persist();renderJobOpportunities();
 })().catch(()=>false);
 const q='"'+company.replace(/"/g,' ')+'"';
 const queries=[
  {id:'krak-dk',label:'Krak · adresse og firmadata',targetSite:'krak.dk',query:'site:krak.dk/firma '+q+' adresse postnummer CVR branche ansatte',fallbackQuery:'site:krak.dk '+q+' firmaprofil adresse CVR virksomhed'},
  {id:'jobindex-dk',label:'Jobindex · virksomhedsprofil og jobtilfredshed',targetSite:'jobindex.dk',query:'site:jobindex.dk/virksomhed '+q+' evalueringer stjerner jobglæde medarbejdere antal medarbejdere',fallbackQuery:'site:jobindex.dk/virksomhed '+q+' arbejdspladsvurdering medarbejderanmeldelser'},
  {id:'jobindex-reviews',label:'Jobindex · medarbejdervurderinger',targetSite:'jobindex.dk',query:'site:jobindex.dk/virksomhed '+q+' "evalueringer" "samlet vurdering"',fallbackQuery:'site:jobindex.dk '+q+' "jobglæde" OR "medarbejdertilfredshed"'},
  {id:'jobrate-dk',label:'Jobrate · arbejdspladsvurderinger',targetSite:'jobrate.dk',query:'site:jobrate.dk/arbejdsplads '+q+' medarbejdervurdering rating anmeldelser',fallbackQuery:'site:jobrate.dk '+q+' arbejdsgiver anmeldelser jobtilfredshed'},
  {id:'glassdoor-reviews',label:'Glassdoor · medarbejderanmeldelser',targetSite:'glassdoor.com',query:'site:glassdoor.com/Reviews/ '+q+' employee reviews overall rating company culture Denmark',fallbackQuery:'site:glassdoor.com '+q+' employer reviews rating work culture'},
  {id:'indeed-reviews',label:'Indeed · virksomheds- og medarbejderanmeldelser',targetSite:'indeed.com',query:'site:indeed.com/cmp/ '+q+' company reviews rating employees Denmark',fallbackQuery:'site:dk.indeed.com/cmp/ '+q+' reviews company rating'},
  {id:'kununu-reviews',label:'Kununu · medarbejdervurderinger',targetSite:'kununu.com',query:'site:kununu.com '+q+' arbeitgeber bewertungen kununu score Denmark',fallbackQuery:'site:kununu.com '+q+' reviews employer rating'},
  {id:'great-place-to-work-dk',label:'Great Place to Work Danmark · medarbejderoplevelser',targetSite:'greatplacetowork.dk',query:'site:greatplacetowork.dk/certificerede-arbejdspladser '+q+' medarbejderoplevelser procent antal medarbejdere',fallbackQuery:'site:greatplacetowork.dk '+q+' medarbejdernes oplevelse af arbejdspladsen'},
  {id:'great-place-to-work-global',label:'Great Place to Work · employee experience',targetSite:'greatplacetowork.com',query:'site:greatplacetowork.com '+q+' employee experience percentage employees',fallbackQuery:'site:greatplacetowork.com '+q+' employees say great place to work'},
  {id:'proff-dk',label:'Proff · CVR, branche og ansatte',targetSite:'proff.dk',query:'site:proff.dk '+q+' CVR antal ansatte adresse branche',fallbackQuery:'site:proff.dk '+q+' virksomhed CVR ansatte adresse'},
  {id:'estatistik-dk',label:'eStatistik · danske virksomhedsdata',targetSite:'estatistik.dk',query:'site:estatistik.dk/virksomhed '+q+' CVR ansatte adresse branche etableret',fallbackQuery:'site:estatistik.dk '+q+' CVR dansk virksomhed ansatte adresse'},
  {id:'cvr-virk-dk',label:'CVR/Virk · officielt virksomhedsregister',targetSite:'virk.dk',query:'site:datacvr.virk.dk '+q+' CVR adresse branche antal ansatte',fallbackQuery:'site:virk.dk '+q+' CVR adresse branche ansatte'},
  {id:'ownr-dk',label:'Ownr · danske virksomhedsoplysninger',targetSite:'ownr.dk',query:'site:ownr.dk '+q+' CVR antal ansatte adresse stiftet branche',fallbackQuery:'site:ownr.dk '+q+' dansk virksomhed CVR'},
  {id:'broad-workplace',label:'Bred søgning · medarbejderoplevelser',query:q+' medarbejderanmeldelser arbejdsplads jobtilfredshed employee reviews rating Denmark',fallbackQuery:q+' employee reviews employer rating jobs workplace Denmark'}
 ];
 try{
  const outcomes=await Promise.allSettled(queries.map(query=>queryIndex(query,[])));
  await earlyDistanceTask;
  const found=[],sourceErrors=outcomes.filter(outcome=>outcome.status==='rejected').length;
  outcomes.forEach((outcome,i)=>{
   if(outcome.status!=='fulfilled')return;
   (outcome.value.results||[]).forEach(result=>{
    if(!result||!isCompanyLookupSource(result)||!safeHttpUrl(result.url)||!companyResultRelevant(result,company,item))return;
    const key=canonicalSearchUrl(result.url);
    const existing=found.findIndex(old=>canonicalSearchUrl(old.url)===key);
    if(existing<0)found.push({...result,sourceType:queries[i].id,sourceLabel:queries[i].label});
    else if(!found[existing].sourceType)found[existing].sourceType=queries[i].id;
   });
  });
  const contextRank=source=>{
   const host=companySourceHost(source);
   if(host==='greatplacetowork.dk'||host.endsWith('.greatplacetowork.dk'))return 0;
   if(host==='jobindex.dk'||host.endsWith('.jobindex.dk'))return 1;
   if(host.includes('glassdoor'))return 2;
   if(host.includes('indeed'))return 3;
   if(host.includes('kununu'))return 4;
   if(host==='krak.dk'||host.endsWith('.krak.dk'))return 5;
   return 6;
  };
  const contextCandidates=found.filter(source=>{
   const host=companySourceHost(source),url=String(source.url||'');
   return ((host==='jobindex.dk'||host.endsWith('.jobindex.dk'))&&/\/virksomhed\//i.test(url))
    ||((host==='krak.dk'||host.endsWith('.krak.dk'))&&/firma|virksomhed/i.test(url))
    ||(isWorkplaceReviewSource(source)&&/\/Reviews?\/|\/cmp\/|\/company\/|\/certificerede-arbejdspladser\/|\/arbejdsplads\/|\/Overview\/|working-at-/i.test(url));
  }).sort((a,b)=>contextRank(a)-contextRank(b)).slice(0,8);
  const contextResults=await Promise.allSettled(contextCandidates.map(enrichCompanyPageContext));
  contextResults.forEach((result,i)=>{
   if(result.status!=='fulfilled')return;
   const enhanced=result.value,target=found.findIndex(source=>canonicalSearchUrl(source.url)===canonicalSearchUrl(enhanced.url));
   if(target>=0)found[target]=enhanced;
  });
  const registrySources=found.filter(source=>isOfficialDanishCompanySource(source));
  const nextFacts=applyCompanySourceFacts(found,{});
  nextFacts.sources=found.slice(0,20);
  nextFacts.lookupStatus=(sourceErrors===queries.length&&!found.length)?'error':'done';
  nextFacts.lookupAt=new Date().toISOString();
  nextFacts.danishCompanyConfirmed=registrySources.length>0;
  // A job's published location is a useful fallback when a company office address cannot be found.
  if(!nextFacts.location){
   const jobLocation=String(item.jobLocation||item.location||item.city||'').trim();
   if(jobLocation&&!/^(?:denmark|danmark|dk|remote|remote jobs?)$/i.test(jobLocation)){
    nextFacts.location=jobLocation;nextFacts.locationKind='job';
    nextFacts.factSources=nextFacts.factSources||{};
    nextFacts.factSources.location={url:safeHttpUrl(item.url),title:String(item.jobTitle||item.title||'Originalt jobopslag'),domain:String(item.domain||''),description:String(item.description||'').slice(0,1000)};
   }
  }
  await updateOpportunityDistance(item,nextFacts);
  item.companyFacts=nextFacts;
  persist();renderJobOpportunities();
 }catch(error){
  const jobLocation=String(item.jobLocation||item.location||item.city||'').trim();
  const facts={lookupStatus:'error',lookupError:String(error&&error.message||error).slice(0,220),sources:[],factSources:{}};
  if(jobLocation&&!/^(?:denmark|danmark|dk|remote|remote jobs?)$/i.test(jobLocation)){
   facts.location=jobLocation;facts.locationKind='job';
   facts.factSources.location={url:safeHttpUrl(item.url),title:String(item.jobTitle||item.title||'Originalt jobopslag'),domain:String(item.domain||''),description:String(item.description||'').slice(0,1000)};
  }
  await updateOpportunityDistance(item,facts);
  item.companyFacts=facts;
  persist();renderJobOpportunities();
 }
}
async function autoLookupJobCompanyFacts(items){
 const current=(items||[]).filter(item=>item&&state.jobOpportunities.includes(item));
 const grouped=new Map();
 current.forEach(item=>{
  const name=companyNameFromOpportunity(item);
  if(!name||name==='Virksomheden')return;
  const norm=normalizeInsightText(name);
  if(!norm||['linkedin','jobindex','indeed','jobnet','stepstone','ofir','workindenmark','hk jobportal'].includes(norm))return;
  if(!grouped.has(norm))grouped.set(norm,{name,items:[]});
  grouped.get(norm).items.push(item);
 });
 const queue=[...grouped.values()].filter(group=>group.name!=='Arbejdsgiver ikke oplyst'&&!group.items.some(item=>['done','loading','queued'].includes(item.companyFacts&&item.companyFacts.lookupStatus)));
 if(!queue.length)return;
 queue.forEach(group=>group.items.forEach(item=>{
  item.companyFacts=item.companyFacts||{};
  item.companyFacts.lookupStatus='queued';
 }));
 persist();renderJobOpportunities();
 let cursor=0;
 const worker=async()=>{
  while(cursor<queue.length){
   const group=queue[cursor++];
   const seed=group.items.find(item=>state.jobOpportunities.includes(item));
   if(!seed)continue;
   try{
    seed.companyFacts=seed.companyFacts||{};
    if(seed.companyFacts.lookupStatus==='done')continue;
    await lookupCompanyInsights(seed);
    const facts=seed.companyFacts||{lookupStatus:'done',sources:[],factSources:{}};
    group.items.forEach(item=>{
     if(item!==seed)item.companyFacts={...facts,sources:Array.isArray(facts.sources)?facts.sources.slice():[],factSources:{...(facts.factSources||{})}};
    });
    persist();renderJobOpportunities();
   }catch(error){
    group.items.forEach(item=>{item.companyFacts={...(item.companyFacts||{}),lookupStatus:'error',lookupError:String(error&&error.message||error).slice(0,180)}});
    persist();renderJobOpportunities();
   }
  }
 };
 await Promise.all(Array.from({length:Math.min(3,queue.length)},()=>worker()));
}
function companyInsightBox(item,index){
 const f=effectiveCompanyFacts(item),clean=value=>String(value==null?'':value).trim(),company=companyNameFromOpportunity(item);
 const sources=Array.isArray(f.sources)?f.sources:[],factSources=f.factSources||{};
 const rating=clean(f.employeeRating),ratingNumber=Number(rating.replace(',','.'));
 const ratingDisplay=rating&&Number.isFinite(ratingNumber)&&ratingNumber>=0&&ratingNumber<=5?ratingNumber.toLocaleString('da-DK',{maximumFractionDigits:1})+'/5':rating||'Ikke fundet';
 const employees=clean(f.employeeCount)||'Ikke oplyst',location=clean(f.location)||'Ikke fundet';
 const distance=clean(f.distanceKm),distanceOrigin=clean(f.distanceOriginLabel)||'Frederiksberg bymidte (standard)',distanceTarget=clean(f.distanceTargetLabel)||'arbejdssted',distanceLine=distance?'ca. '+distance+' km i luftlinje fra '+distanceOrigin+(distanceTarget?' · til '+distanceTarget:''):clean(f.distanceMessage)||'Afstand afventer en brugbar adresse på arbejdsstedet';
 const industry=clean(f.industry)||'Ikke fundet',founded=clean(f.foundedYear)||'Ikke oplyst',type=clean(f.companyType)||'Ikke oplyst';
 const tone=['mint','orange','purple','blue'][index%4],loading=f.lookupStatus==='loading'||f.lookupStatus==='queued',completed=f.lookupStatus==='done';
 const employeeIsRange=/\d\s*[-–]\s*\d/.test(employees)||/(?:ca\.?|cirka|estimat|omkring|~)/i.test(employees);
 const qualityFields=[
  {key:'employeeCount',label:'medarbejderantal'},
  {key:'location',label:'adresse/placering'},
  {key:'employeeRating',label:'jobtilfredshed'},
  {key:'industry',label:'branche/fokus'},
  {key:'foundedYear',label:'etableringsår'},
  {key:'companyType',label:'selskabstype'}
 ];
 const sourcedFields=qualityFields.filter(field=>clean(f[field.key])&&factSources[field.key]&&safeHttpUrl(factSources[field.key].url));
 const qualityCount=sourcedFields.length;
 const missingFields=qualityFields.filter(field=>!clean(f[field.key])||!factSources[field.key]||!safeHttpUrl(factSources[field.key].url)).map(field=>field.label);
 const official=f.danishCompanyConfirmed===true;
 const statusLabel=loading?(f.lookupStatus==='queued'?'På vej i køen…':'Henter data…'):completed?(sources.length?(official?'CVR/Virk-kilde fundet':'Kilder fundet'):'Ingen kilder fundet'):f.lookupStatus==='error'?'Søgning fejlede':'Afventer opslag';
 const statusState=loading?f.lookupStatus:completed?(sources.length?(official?'verified':'partial'):'empty'):f.lookupStatus||'waiting';
 const factSourceLink=field=>{
  const source=factSources[field],href=safeHttpUrl(source&&source.url);
  if(!source||!href)return '<span class="job-company-fact-source is-missing">Kilde ikke fundet</span>';
  const label=companySourceHost(source)||clean(source.domain)||'offentlig kilde';
  return '<a class="job-company-fact-source" href="'+escapeHtml(href)+'" target="_blank" rel="noopener noreferrer">Kilde: '+escapeHtml(label)+' ↗</a>';
 };
 const svg={
  people:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.2a4 4 0 0 1 0 7.6M18 14.2a4 4 0 0 1 4 4V20"/></svg>',
  pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  smile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.3 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
  building:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M9 21v-5h6v5"/></svg>'
 };
 let out='<section class="job-company-insights job-company-insights-'+tone+'" aria-label="Virksomhedsinfo">';
 out+='<div class="job-company-insights-head"><span class="job-company-insights-icon">'+svg.building+'</span><div><strong>'+escapeHtml(company)+'</strong><small>Offentlige virksomheds- og arbejdspladskilder · afstand fra din gemte placering</small></div><span class="job-company-auto-status" data-company-state="'+escapeHtml(statusState)+'">'+escapeHtml(statusLabel)+'</span></div>';
 out+='<div class="job-company-insight-stats">';
 out+='<div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.people+'</span><div><small>Medarbejdere</small><strong>'+escapeHtml(employees)+'</strong>'+(employeeIsRange?'<span class="job-company-employee-estimate">Interval / estimat</span>':'')+factSourceLink('employeeCount')+'</div></div>';
 out+='<div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.pin+'</span><div><small>'+(f.locationKind==='job'?'Jobbets arbejdssted':'Virksomhedsadresse / placering')+'</small><strong>'+escapeHtml(location)+'</strong><span class="job-insight-sub">'+escapeHtml(distanceLine)+'</span>'+factSourceLink('location')+(distance?factSourceLink('distanceKm'):'')+'</div></div>';
 out+='<div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.smile+'</span><div><small>Jobtilfredshed</small><strong>'+escapeHtml(ratingDisplay)+'</strong><span class="job-insight-sub">'+escapeHtml(clean(f.ratingCount)?clean(f.ratingCount)+' medarbejderevalueringer/anmeldelser':'Ingen offentlig medarbejdervurdering fundet')+'</span>'+factSourceLink('employeeRating')+'</div></div>';
 out+='</div>';
 out+='<div class="job-company-insights-foot"><span><b>Branche/fokus</b> '+escapeHtml(industry)+factSourceLink('industry')+'</span><span><b>Etableret</b> '+escapeHtml(founded)+factSourceLink('foundedYear')+'</span><span><b>Type</b> '+escapeHtml(type)+factSourceLink('companyType')+'</span></div>';
 if(completed){
  const checkedAt=f.lookupAt&&Number.isFinite(Date.parse(f.lookupAt))?new Date(f.lookupAt).toLocaleString('da-DK'):'Dato ikke tilgængelig';
  out+='<div class="job-company-quality"><strong>Datakvalitet</strong><span>Senest kontrolleret: '+escapeHtml(checkedAt)+'.</span><span>'+qualityCount+' af '+qualityFields.length+' virksomhedsoplysninger har en tilknyttet kilde.</span>';
  if(official)out+='<span>En officiel CVR/Virk-kilde blev fundet. Kontrollér stadig, at den matcher den konkrete arbejdsgiver.</span>';
  else if(sources.length)out+='<span>Der er fundet offentlige kilder, men ingen officiel CVR/Virk-kilde blev bekræftet.</span>';
  else out+='<span>Ingen relevante kilder blev fundet. Virksomhedsoplysningerne er derfor ikke verificeret.</span>';
  if(missingFields.length)out+='<span class="is-incomplete">Mangler dokumentation for: '+escapeHtml(missingFields.join(', '))+'.</span>';
  out+='</div>';
 }
 if(clean(f.companyHighlight))out+='<div class="job-company-highlight"><strong>Tal fra virksomhedens egen hjemmeside</strong><span>'+escapeHtml(f.companyHighlight)+'</span></div>';
 if(loading)out+='<div class="job-company-lookup-status" aria-live="polite"><span class="job-company-lookup-spinner"></span>'+(f.lookupStatus==='queued'?'Virksomhedsoplysninger hentes automatisk, så snart det bliver denne virksomheds tur…':'Søger efter virksomhedsdata, CVR/Virk-oplysninger, adresse og medarbejdervurderinger…')+'</div>';
 if(f.lookupStatus==='error')out+='<div class="job-company-lookup-error">Virksomhedsdata kunne ikke hentes denne gang. Jobopslaget vises stadig, og søgningen efter stillinger er ikke påvirket.</div>';
 if(completed){
  out+='<div class="job-company-evidence"><div class="job-company-evidence-heading"><strong>Fundne kilder</strong><span>'+sources.length+' resultater</span></div>';
  out+=sources.length?'<div class="job-company-evidence-list">'+sources.slice(0,6).map(source=>'<a class="job-company-evidence-item" href="'+escapeHtml(safeHttpUrl(source.url))+'" target="_blank" rel="noopener noreferrer"><span class="job-company-evidence-copy"><strong>'+escapeHtml(source.domain||source.sourceLabel||companySourceHost(source)||'Offentlig kilde')+'</strong><small>'+escapeHtml(source.title||'Virksomhedsoplysninger')+'</small><em>'+escapeHtml(String(source.description||source.pageContent||'').slice(0,220))+'</em></span><span class="job-company-evidence-arrow">↗</span></a>').join('')+'</div>':'<p class="job-company-evidence-empty">Ingen relevante profiler blev fundet i de offentlige søgeresultater.</p>';
  out+='</div>';
 }
 out+='<p class="job-company-insight-note">Medarbejdertilfredshed vises kun, når en kilde specifikt understøtter medarbejdervurderingen — kundetilfredshed bruges ikke som erstatning. Manglende data vises eksplicit. Afstand vises i luftlinje fra din gemte placering. Uden en gemt/genkendt placering bruges Frederiksberg bymidte som standard. Målet er virksomhedens adresse, eller jobopslagets arbejdssted hvis virksomhedsadressen mangler. Geokodning: OpenStreetMap.</p></section>';
 return out;
}
function jobDisplayTitle(item){
 const original=String(item&&(item.jobTitle||item.title)||'').trim();let title=original;
 title=title.replace(/\s*[|–—]\s*(?:linkedin jobs?|indeed(?:\.com)?|jobindex(?:\.dk)?|stepstone(?:\.dk)?|jobnet(?:\.dk)?|ofir(?:\.dk)?|trabajo\.org|denmark business).*$/i,'').trim();
 title=title.replace(/\s*[|–—-]\s*\d{5,}\s*$/,'').trim();
 title=title.replace(/\s*[-–—]\s*(?:side|page|pagina)\s*\d+\s*$/i,'').trim();
 title=title.replace(/^(?:job opening|job opportunity|vacancy|jobannonce|stillingsopslag)\s*[:|-]\s*/i,'').trim();
 return title||original;
}
function jobDisplayCompany(item){
 const supplied=String(item&&(item.companyName||item.employer||item.company)||'').trim();
 if(supplied&&!/^\d{4,}$/.test(supplied)&&!/^(indeed|jobindex|linkedin|stepstone|jobnet|ofir|workindenmark|trabajo|soopage)$/i.test(supplied))return supplied;
 const title=String(item&&(item.jobTitle||item.title)||'').trim();
 const match=title.match(/\b(?:at|hos|ved)\s+([A-ZÆØÅ][A-Za-zÆØÅæøå\d&.' -]{1,70}?)(?:\s*[|–—,]|$)/i);
 if(match&&match[1]&&!/^\d{4,}$/.test(match[1].trim()))return match[1].trim();
 return companyNameFromOpportunity(item);
}
function jobDisplayLocation(item,scope){
 const raw=String(item&&(item.jobLocation||item.location||item.city)||'').trim();
 if(raw&&!/^(denmark|danmark|dk)$/i.test(raw))return raw;
 if(scope.kind==='remote-denmark')return 'Remote · Danmark';
 if(scope.kind==='remote-check')return 'Remote · kontrollér adgang fra Danmark';
 if(scope.kind==='query-location')return 'Danmark · kontrollér arbejdssted';
 return 'Danmark · arbejdssted skal bekræftes';
}

function renderJobOpportunities(){
 const activeProfile=searchProfile(),all=(state.jobOpportunities||[]);
 const results=all.map(item=>({...item,matchedTerms:matchedJobTerms(item,activeProfile.terms)})).filter(item=>item.matchedTerms.length>0&&isDanishMappedJob(item,activeProfile)&&isLikelySpecificJobPosting(item,{scope:'danish-jobs',id:item.queryId||'web-jobs'}));
 if(el('jobOpportunitiesResults'))el('jobOpportunitiesResults').innerHTML=results.length?results.map((item,index)=>{
  const stateIndex=all.indexOf(item),url=safeHttpUrl(item.url),matched=item.matchedTerms||[];
  const tracked=url&&state.followUps.some(f=>f.url&&canonicalSearchUrl(f.url)===canonicalSearchUrl(url));
  const source=item.queryLabel||item.sourceLabel||item.domain||'Jobportal',scope=getDanishJobScope(item,activeProfile);
  const title=jobDisplayTitle(item),company=jobDisplayCompany(item),location=jobDisplayLocation(item,scope);
  const date=String(item.postedAt||item.datePosted||'').trim(),type=String(item.employmentType||'').trim(),workMode=String(item.workMode||'').trim(),salary=String(item.salary||'').trim();
  let html='<article class="discovery-card job-result-card">';
  html+='<div class="job-result-topline"><span class="discovery-source">'+escapeHtml(item.domain||source)+'</span><span class="chip job-location-match job-location-match-'+escapeHtml(scope.kind)+'">'+escapeHtml(scope.label)+'</span></div>';
  html+='<h3 class="job-result-title">'+escapeHtml(title)+'</h3>';
  html+='<div class="job-result-employer"><span class="job-result-company-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M9 21v-5h6v5"/></svg></span><div><strong>'+escapeHtml(company)+'</strong><span>'+escapeHtml(location)+'</span></div></div>';
  const meta=[];if(date)meta.push('<span><b>Opslået</b> '+escapeHtml(date)+'</span>');if(type)meta.push('<span><b>Ansættelse</b> '+escapeHtml(type)+'</span>');if(workMode)meta.push('<span><b>Arbejdsform</b> '+escapeHtml(workMode)+'</span>');if(salary)meta.push('<span><b>Løn</b> '+escapeHtml(salary)+'</span>');
  if(item.verifiedSnapshot)meta.push('<span><b>Kilde kontrolleret</b> '+escapeHtml(item.sourceCheckedAt||'26.10.2026')+'</span>');
  if(meta.length)html+='<div class="job-result-meta">'+meta.join('')+'</div>';
  html+='<section class="job-result-match"><h4>Hvorfor matcher jobbet?</h4>';
  html+=item.description?'<p>'+escapeHtml(item.description)+'</p>':'<p>Åbn originalopslaget for at kontrollere ansvarsområder, kvalifikationer og ansøgningsfrist.</p>';
  html+='<div class="discovery-matched">'+(matched.length?matched.map(term=>'<span class="chip job-keyword-chip">'+escapeHtml(term)+'</span>').join(''):'<span class="chip">Søgt med dine valgte søgeord</span>')+'</div></section>';
  html+=companyInsightBox(item,stateIndex);
  html+='<div class="job-result-caution">Kontrollér, at opslaget stadig er aktivt, og at arbejdsstedet eller remote-vilkårene passer.</div><div class="discovery-actions">';
  if(url)html+='<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">Åbn originalopslag ↗</a>';
  html+='<button class="secondary" data-discovery-action="follow" data-collection="jobs" data-index="'+stateIndex+'">'+(tracked?'Opfølgning oprettet':'Følg op')+'</button><button data-discovery-action="analyze" data-index="'+stateIndex+'">Vurdér mod mit CV</button></div></article>';
  return html;
 }).join(''):'<div class="empty job-results-empty"><span class="job-results-empty-icon">⌕</span><strong>Ingen konkrete stillingsopslag blev fundet</strong><p>Resultater som jobkataloger, firmaregistre, telefonbøger og sider med “Side 3” vises ikke som jobs. Prøv flere søgeord eller en bredere geografi.</p></div>';
 if(el('jobOpportunityCount'))el('jobOpportunityCount').textContent=results.length;
 if(el('jobKeywordCount'))el('jobKeywordCount').textContent=searchProfile().terms.length;
 if(el('jobTrackedCount'))el('jobTrackedCount').textContent=(state.followUps||[]).filter(item=>item.type==='job').length;
 if(el('jobLastSearchLabel'))el('jobLastSearchLabel').textContent=state.jobLastSearch?new Date(state.jobLastSearch).toLocaleDateString('da-DK'):'Ikke søgt';
 if(el('jobOpportunitiesMeta'))el('jobOpportunitiesMeta').textContent=results.length+' forslag';
}
let jobSearchProgressOriginalOverflow='';
let jobSearchProgressQueries=[];
let jobSearchProgressCompleted=new Set();
function searchPortalIcon(index){
 const icons=[
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h6"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M3 12h18M3 19h18"/><circle cx="8" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="19" r="2"/></svg>'
 ];
 return icons[index%icons.length];
}
function showJobSearchProgress(queries,profile){
 const modal=el('jobSearchProgressModal');if(!modal)return;
 jobSearchProgressOriginalOverflow=document.body.style.overflow;
 jobSearchProgressQueries=queries.slice();jobSearchProgressCompleted=new Set();
 const list=el('jobSearchPortalList'),colors=['#287BF5','#7957DD','#16866B','#E87536','#0E9DA8','#D34C76','#6B7A90','#25946B'];
 if(list)list.innerHTML=queries.map((query,index)=>'<div class="job-search-portal-row" data-search-portal="'+escapeHtml(query.id)+'" data-state="waiting"><span class="job-search-portal-icon" style="--portal-color:'+colors[index%colors.length]+'">'+searchPortalIcon(index)+'</span><span class="job-search-portal-copy"><strong>'+escapeHtml(query.label)+'</strong><small>'+escapeHtml(query.id==='career-sites'?'Offentlige karrieresider':query.targetSite||'Jobportal')+'</small></span><span class="job-search-portal-state">Afventer</span></div>').join('');
 if(el('jobSearchProgressTitle'))el('jobSearchProgressTitle').textContent='Søger efter relevante stillinger';
 if(el('jobSearchProgressDescription'))el('jobSearchProgressDescription').textContent='Søger på tværs af danske jobportaler med dine søgeord og geografien '+profile.location+'.';
 if(el('jobSearchProgressStatus'))el('jobSearchProgressStatus').textContent='Forbereder søgeforespørgsler…';
 if(el('jobSearchProgressPercent'))el('jobSearchProgressPercent').textContent='0%';
 if(el('jobSearchProgressRing')){el('jobSearchProgressRing').style.setProperty('--job-progress','0%');el('jobSearchProgressRing').setAttribute('aria-valuenow','0')}
 if(el('jobSearchProgressFill'))el('jobSearchProgressFill').style.width='0%';
 if(el('jobSearchProgressCount'))el('jobSearchProgressCount').textContent='0 af '+queries.length+' portaler færdige';
 if(el('jobSearchProgressClose'))el('jobSearchProgressClose').hidden=true;
 if(el('jobSearchProgressFooter'))el('jobSearchProgressFooter').textContent='Procenten viser hvor mange portaler der har svaret — ikke en beregning af intern fremdrift.';
 modal.hidden=false;delete modal.dataset.complete;document.body.style.overflow='hidden';
}
function updateJobSearchPortal(queryId,status,detail){
 const row=Array.from(document.querySelectorAll('[data-search-portal]')).find(node=>node.dataset.searchPortal===queryId);
 if(row){
  row.dataset.state=status;
  const stateNode=row.querySelector('.job-search-portal-state');
  if(stateNode)stateNode.textContent=status==='searching'?'Søger…':status==='done'?'Færdig · '+detail:status==='empty'?'Ingen match':status==='error'?'Fejl':status==='waiting'?'Afventer':detail||status;
 }
 if(status==='done'||status==='empty'||status==='error')jobSearchProgressCompleted.add(queryId);
 const total=jobSearchProgressQueries.length||1,completed=jobSearchProgressCompleted.size,percent=Math.round(completed/total*100);
 if(el('jobSearchProgressPercent'))el('jobSearchProgressPercent').textContent=percent+'%';
 if(el('jobSearchProgressRing')){el('jobSearchProgressRing').style.setProperty('--job-progress',percent+'%');el('jobSearchProgressRing').setAttribute('aria-valuenow',String(percent))}
 if(el('jobSearchProgressFill'))el('jobSearchProgressFill').style.width=percent+'%';
 if(el('jobSearchProgressCount'))el('jobSearchProgressCount').textContent=completed+' af '+total+' portaler færdige';
 if(el('jobSearchProgressStatus')){
  if(completed===total)el('jobSearchProgressStatus').textContent='Alle portaler har svaret. Samler og sorterer konkrete stillingsopslag…';
  else if(status==='searching')el('jobSearchProgressStatus').textContent='Søger hos '+(jobSearchProgressQueries.find(query=>query.id===queryId)?.label||'jobportalen')+'…';
  else el('jobSearchProgressStatus').textContent='Søgningen er i gang. Venter på de resterende portaler…';
 }
}
function finishJobSearchProgress(){
 const modal=el('jobSearchProgressModal');
 if(el('jobSearchProgressTitle'))el('jobSearchProgressTitle').textContent='Søgningen er afsluttet';
 if(el('jobSearchProgressStatus'))el('jobSearchProgressStatus').textContent='Resultaterne er samlet og vises automatisk nedenfor.';
 if(el('jobSearchProgressClose'))el('jobSearchProgressClose').hidden=true;
 if(el('jobSearchProgressFooter'))el('jobSearchProgressFooter').textContent='Resultaterne er nu klar — oversigten lukker automatisk.';
 if(modal){
  modal.dataset.complete='true';
  setTimeout(()=>{
   if(modal.dataset.complete==='true'){
    modal.hidden=true;
    document.body.style.overflow=jobSearchProgressOriginalOverflow||'';
    const results=el('jobOpportunitiesResults');
    if(results)results.scrollIntoView({behavior:'smooth',block:'start'});
   }
  },650);
 }
}
function closeJobSearchProgress(){
 const modal=el('jobSearchProgressModal');if(modal)modal.hidden=true;
 document.body.style.overflow=jobSearchProgressOriginalOverflow||'';
 const results=el('jobOpportunitiesResults');if(results)results.scrollIntoView({behavior:'smooth',block:'start'});
}
function compareSearchTermsWithCV(profile){
 const cv=String(state.cv||'').trim();
 if(cv.length<80)return {hasCv:false,matched:[],unmatched:profile.terms.slice(),ratio:1};
 const normalizedCv=normalizeSearchText(cv),cvSkills=extractSearchTermsFromCV().map(normalizeSearchText);
 const stop=new Set(['the','and','for','with','fra','til','med','of','in','on','at','og','eller','job','jobs','stilling','stillinger','arbejde','arbejder','i','en','et']);
 const tokens=value=>normalizeSearchText(value).split(/\s+/).filter(token=>token.length>2&&!stop.has(token));
 const cvWordSet=new Set(tokens(cv).slice(0,1200)),matched=[],unmatched=[];
 for(const term of profile.terms){
  const norm=normalizeSearchText(term),termTokens=tokens(term);
  const direct=norm&&normalizedCv.includes(norm);
  const keywordMatch=cvSkills.some(skill=>skill===norm||skill.includes(norm)||norm.includes(skill));
  const overlap=termTokens.filter(token=>cvWordSet.has(token)).length;
  const looseMatch=termTokens.length>0&&overlap>=Math.max(1,Math.ceil(termTokens.length*0.6));
  if(direct||keywordMatch||looseMatch)matched.push(term);else unmatched.push(term);
 }
 return {hasCv:true,matched,unmatched,ratio:profile.terms.length?matched.length/profile.terms.length:1};
}
function showCvSearchWarning(profile,comparison){
 const modal=el('jobCvRelevanceModal');if(!modal)return false;
 if(el('jobCvWarningSummary'))el('jobCvWarningSummary').textContent='Du har valgt '+profile.terms.join(', ')+', men kun '+comparison.matched.length+' af '+profile.terms.length+' søgeord ser ud til at hænge sammen med kompetencerne i dit gemte CV.';
 if(el('jobCvWarningMatched'))el('jobCvWarningMatched').innerHTML=comparison.matched.length?comparison.matched.map(term=>'<span class="chip cv-match-good">'+escapeHtml(term)+'</span>').join(''):'<span class="chip cv-match-none">Ingen tydelige overlap fundet</span>';
 if(el('jobCvWarningUnmatched'))el('jobCvWarningUnmatched').innerHTML=comparison.unmatched.slice(0,8).map(term=>'<span class="chip cv-match-warning">'+escapeHtml(term)+'</span>').join('');
 modal.hidden=false;document.body.style.overflow='hidden';return true;
}
function closeCvSearchWarning(){const modal=el('jobCvRelevanceModal');if(modal)modal.hidden=true;document.body.style.overflow=''}
function confirmJobSearchDespiteCv(){closeCvSearchWarning();searchJobOpportunities(true)}
function cancelJobSearchForCv(){closeCvSearchWarning();const input=el('jobSearchTerms');if(input){input.focus();input.scrollIntoView({behavior:'smooth',block:'center'})}}

const VERIFIED_DANISH_JOB_ROWS=[
 ['spring-growth-crm','E-commerce Growth & CRM Manager','Spring Copenhagen','https://dk.linkedin.com/jobs/view/e-commerce-growth-crm-manager-at-spring-copenhagen-4483542483','linkedin.com','København','International e-commerce-vækst gennem data, kundeindsigt, CRM og marketing.','marketing CRM e-commerce growth analytics customer journeys','Opslået i dag','LinkedIn Jobs','Fuldtid'],
 ['s360-automation','Senior Specialist, Marketing Automation','s360','https://dk.linkedin.com/jobs/view/senior-specialist-marketing-automation-at-s360-4478978844','linkedin.com','Aarhus','Automatiserede email- og SMS-kunderejser med segmentering, adfærdsdata og KPI-optimering.','marketing automation CRM email lifecycle customer journeys','Opslået for 5 dage siden','LinkedIn Jobs','Fuldtid'],
 ['skatteguiden-crm','CRM & Lifecycle Marketing Specialist','Skatteguiden','https://dk.linkedin.com/jobs/view/crm-lifecycle-marketing-specialist-at-skatteguiden-4467755179','linkedin.com','København','CRM-setup i Braze, email- og pushkampagner, automatiserede flows, segmentering og kunderejser.','CRM lifecycle marketing email automation customer journeys Braze','Fundet i aktuelle resultater','LinkedIn Jobs','Fuldtid'],
 ['skatteguiden-content','Performance & Content Specialist','Skatteguiden','https://dk.linkedin.com/jobs/view/performance-content-specialist-at-skatteguiden-4467036849','linkedin.com','København','Performance marketing på tværs af annoncer, sociale medier, website, funnel, konvertering og SEO/GEO.','marketing performance content marketing paid ads SEO growth','Fundet i aktuelle resultater','LinkedIn Jobs','Fuldtid'],
 ['nordcad-crm','CRM- og marketingkoordinator','Nordcad Systems A/S','https://dk.linkedin.com/jobs/view/crm-og-marketingkoordinator-s%C3%B8ges-til-nordcad-systems-a-s-at-nordcad-systems-a-s-4472728766','linkedin.com','Aalborg','Nyoprettet rolle med CRM, marketingprocesser og understøttelse af salgs- og marketingteamet.','CRM marketing coordinator campaigns customer data marketing automation','Opslået for nylig','LinkedIn Jobs','Fuldtid'],
 ['kvik-automation','Marketing Specialist, E-mail Automation & Content','Kvik A/S','https://dk.linkedin.com/jobs/view/marketing-specialist-e-mail-automation-content-%E2%80%93-maternity-cover-at-kvik-a-s-4468227487','linkedin.com','Risskov, Aarhus','Midlertidig rolle med marketing automation, email marketing i Agillic og automatiserede kunderejser.','marketing specialist email automation content marketing CRM customer journeys','Opslået for ca. 6 dage siden','LinkedIn Jobs','Tidsbegrænset'],
 ['jobnet-head-marketing','Head of Marketing','Arbejdsgiver ikke oplyst','https://jobnet.dk/find-job/62f0ab81-af46-468c-9777-5207c63f6563','jobnet.dk','Danmark','Ledende marketingstilling med ansøgningsfrist 3. december 2026.','marketing head of marketing leadership brand strategy growth','Publiceret 8. oktober 2026','Jobnet','Fuldtid'],
 ['jobnet-client-manager','Client Manager til Online Marketing Bureau','Fair Marketing','https://jobnet.dk/find-job/3be123ab-7c22-45b5-8d44-69a91570a163','jobnet.dk','Aalborg','Kunderelationer og koordinering hos marketingbureau i Aalborg. Ansøgningsfrist 27. november 2026.','marketing client manager digital marketing customer relationships campaigns','Publiceret 2. oktober 2026','Jobnet','Fuldtid'],
 ['jobnet-teamleader','Teamleder til Marketing','IDEALCOMBI A/S','https://jobnet.dk/find-job/163010d9-d828-4184-beb0-5796e3e862a5','jobnet.dk','Danmark','Teamlederrolle med ansvar for at sætte retning og skabe fremdrift i marketingindsatsen.','marketing teamleader leadership campaigns communication strategy','Publiceret for ca. 5 dage siden','Jobnet','Fuldtid'],
 ['jobnet-brand-manager','Marketing Brand Manager – Barselsvikariat','Erwin Hymer Group','https://jobnet.dk/find-job/c232971f-134a-4fa1-b754-b88919cffff7','jobnet.dk','Danmark','Brand- og marketingstilling med ansøgningsfrist 16. november 2026.','marketing brand manager brand strategy campaigns communications','Publiceret 21. september 2026','Jobnet','Tidsbegrænset'],
 ['jobnet-events','Marketing Event and Content Specialist','team.blue Denmark','https://jobnet.dk/find-job/e6aa3fe6-d8c7-4af1-8721-093fd835fcbe','jobnet.dk','Skanderborg','Marketing- og contentrolle med fokus på målgrupper, indhold og events. Ansøgningsfrist 9. december 2026.','marketing content events communication HubSpot CRM','Publiceret 14. oktober 2026','Jobnet','Fuldtid'],
 ['jobnet-comms','Corporate Marketing Communication Specialist','Arbejdsgiver ikke oplyst','https://jobnet.dk/find-job/a8387b82-5cfe-46d2-9990-3d143745dfc4','jobnet.dk','Danmark','Konkret stillingsannonce inden for corporate marketing og kommunikation. Ansøgningsfrist 22. november 2026.','corporate marketing communication specialist communications content brand','Publiceret 12. oktober 2026','Jobnet','Fuldtid'],
 ['jobnet-vinhuset','CRM & Email Marketing Specialist','Vinhuset','https://jobnet.dk/find-job/048021ef-88f4-4a1c-a992-80ad7d41a044','jobnet.dk','Danmark','CRM- og email marketingrolle i et voksende marketingteam.','CRM email marketing automation lifecycle marketing customer data','Aktiv annonce ved kildekontrol','Jobnet','Fuldtid'],
 ['indeed-sonova','Digital Marketing Specialist','Sonova Audiological Care Denmark','https://dk.indeed.com/viewjob?jk=1aa9b8721e33ab89','indeed.com','Danmark','Digital marketingrolle med kommercielt fokus og leadgenerering.','digital marketing marketing specialist lead generation performance campaigns','Fundet på Indeed Danmark','Indeed Danmark','Fuldtid'],
 ['indeed-tryg','CRM Marketing Automation Manager','Tryg Forsikring A/S','https://dk.indeed.com/viewjob?jk=86580eb54c5c3057','indeed.com','Ballerup','Marketing automation på tværs af kunderejsen med målgrupper, flows, kampagner og leadgenerering.','CRM marketing automation manager campaigns customer journeys lead generation data','Opslået 10. september 2026','Indeed Danmark','Fuldtid'],
 ['thehub-artdirector','Art Director: Content and Campaigns','Framna','https://thehub.io/jobs/6ad8008e27cdd81217307814','thehub.io','København','Kreativ retning, kampagnekoncepter, website, social, nyhedsbreve, paid media og produktion af visuelt indhold.','marketing art director content campaigns brand creative','Opslået for 5 dage siden','The Hub','Fuldtid'],
 ['thehub-copywriter','Copywriter and Content Lead','Framna','https://thehub.io/jobs/6ad8008e27cdd81217307810','thehub.io','København','Redaktionel strategi og praktisk tekstproduktion til sociale medier, thought leadership, website, nyhedsbreve og kampagner.','marketing copywriter content lead campaigns communications','Opslået for 4 dage siden','The Hub','Fuldtid'],
 ['thehub-flatpay','Group Portfolio Marketing Director','Flatpay','https://thehub.io/jobs/6ad8012b27cdd81217310344','thehub.io','Herlev','Byg en ny portfolio marketingfunktion med fokus på produktadoption, cross-sell, churn prevention, go-to-market og marketing automation.','marketing director portfolio marketing automation content lifecycle strategy','Opslået for 5 dage siden','The Hub','Fuldtid'],
 ['thehub-storyteller','Storyteller (Danish and English)','Photoncycle','https://thehub.io/jobs/6ad6afecdc9dad558098a37d','thehub.io','København','Ejerskab for contentstrategi, brand storytelling, sociale medier, nyhedsbreve, kundekommunikation og community management.','marketing storyteller content strategy brand social media communications','Opslået for 5 dage siden','The Hub','Fuldtid']
];
const VERIFIED_DANISH_JOB_SNAPSHOT=VERIFIED_DANISH_JOB_ROWS.map(([slug,title,companyName,url,domain,location,description,searchTags,postedAt,sourceLabel,employmentType])=>({
 id:'snapshot-'+slug,title,jobTitle:title,companyName,url,domain,location,jobLocation:location,country:'Denmark',description,searchTags,postedAt,sourceLabel,queryLabel:sourceLabel+' · kontrolleret 26.10.2026',queryId:'snapshot-'+sourceLabel.toLowerCase().replace(/[^a-z0-9]+/g,'-'),sourceCheckedAt:'26.10.2026',verifiedSnapshot:true,employmentType,matchScope:'denmark',matchScopeLabel:'Arbejdssted i Danmark',createdAt:'2026-10-26T12:00:00+01:00',saved:false,companyFacts:{},snapshotExpiresAt:'2026-11-02T00:00:00+01:00'
}));
function recentVerifiedJobSnapshot(profile){
 return VERIFIED_DANISH_JOB_SNAPSHOT.filter(item=>Date.parse(item.snapshotExpiresAt)>Date.now())
  .map(item=>({...item,matchedTerms:matchedJobTerms(item,profile.terms)}))
  .filter(item=>item.matchedTerms.length>0&&isDanishMappedJob(item,profile)&&isLikelySpecificJobPosting(item,{scope:'danish-jobs',id:item.queryId}));
}
async function searchJobOpportunities(ignoreCvWarning=false){
 syncJobSearchPreferences();const profile=searchProfile();
 if(!profile.terms.length){if(el('jobSearchStatus')){el('jobSearchStatus').className='notice warnbox';el('jobSearchStatus').textContent='Skriv mindst ét søgeord, fx marketing, CRM eller marketing automation.'}return}
 if(!ignoreCvWarning){
  const comparison=compareSearchTermsWithCV(profile);
  if(comparison.hasCv&&(comparison.matched.length===0||comparison.ratio<0.25)){
   if(showCvSearchWarning(profile,comparison))return;
  }
 }
 const queries=jobQueries(profile);
 toggleBusy('jobOpportunitiesSearchButton',true,'Søger…');
 if(el('jobSearchStatus')){el('jobSearchStatus').className='notice goodbox';el('jobSearchStatus').textContent='Søger efter '+profile.terms.join(', ')+' på tværs af jobportaler. Resultater filtreres efter Danmark eller relevant remote-arbejde.'}
 showJobSearchProgress(queries,profile);
 try{
  const settled=await Promise.all(queries.map(async query=>{
   updateJobSearchPortal(query.id,'searching','');
   try{
    const value=await queryIndex(query,profile.terms,profile),count=(value.results||[]).length;
    const diag=value.diagnostics||{};updateJobSearchPortal(query.id,count?'done':'empty',count+' opslag · '+(diag.raw||0)+' rå fund');
    return {status:'fulfilled',value};
   }catch(error){
    updateJobSearchPortal(query.id,'error',String(error&&error.message||error).slice(0,100));
    return {status:'rejected',reason:error};
   }
  }));
  let succeeded=0,failed=0;const all=[],errors=[];
  settled.forEach((result,index)=>{if(result.status==='fulfilled'){succeeded++;all.push(...result.value.results)}else{failed++;errors.push(queries[index].label+': '+String(result.reason&&result.reason.message||result.reason).slice(0,120))}});
  const unique=new Map();all.forEach(item=>{const key=canonicalSearchUrl(item.url),old=unique.get(key);if(!old||item.matchedTerms.length>old.matchedTerms.length)unique.set(key,item)});
  const liveQualified=[...unique.values()].map(item=>({...item,matchedTerms:matchedJobTerms(item,profile.terms)})).filter(item=>item.matchedTerms.length>0&&isDanishMappedJob(item,profile)&&isLikelySpecificJobPosting(item,{scope:'danish-jobs',id:item.queryId||'web-jobs'}));
  const finalJobs=new Map(liveQualified.map(item=>[canonicalSearchUrl(item.url),item]));
  let snapshotAdded=0;
  if(finalJobs.size<10){
   for(const item of recentVerifiedJobSnapshot(profile)){
    const key=canonicalSearchUrl(item.url);
    const duplicateRole=[...finalJobs.values()].some(existing=>normalizeSearchText(existing.jobTitle||existing.title)===normalizeSearchText(item.jobTitle||item.title)&&normalizeSearchText(existing.companyName||'')===normalizeSearchText(item.companyName||''));
    if(finalJobs.has(key)||duplicateRole)continue;
    finalJobs.set(key,item);snapshotAdded++;
    if(finalJobs.size>=20)break;
   }
  }
  state.jobSearchSourceMeta={liveCount:liveQualified.length,snapshotCount:snapshotAdded,snapshotCheckedAt:'26.10.2026'};
  state.jobOpportunities=[...finalJobs.values()].sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length).slice(0,50);
  state.jobLastSearch=new Date().toISOString();persist();renderJobOpportunities();
  // Enrich job cards in the background. The cards already render; company facts fill in automatically as sources return.
  autoLookupJobCompanyFacts(state.jobOpportunities.slice());
  if(el('jobSearchStatus')){
   const remoteCheck=state.jobOpportunities.filter(item=>item.matchScope==='remote-check'||item.matchScope==='query-location').length;
   const rawTotal=settled.reduce((total,result)=>total+(result.status==='fulfilled'&&result.value.diagnostics?Number(result.value.diagnostics.raw||0):0),0);
   const portalSummary=settled.map((result,index)=>({label:queries[index].label,raw:result.status==='fulfilled'&&result.value.diagnostics?Number(result.value.diagnostics.raw||0):0,shown:result.status==='fulfilled'?result.value.results.length:0})).filter(x=>x.raw||x.shown).slice(0,5).map(x=>x.label+': '+x.raw+' rå / '+x.shown+' vist').join(' · ');
   const snapshotShown=state.jobOpportunities.filter(item=>item.verifiedSnapshot).length;
   let message=state.jobOpportunities.length
    ?'Søgningen er færdig: '+state.jobOpportunities.length+' konkrete stillingsopslag vist fra '+succeeded+' live-kildeområder.'+(snapshotShown?' Listen er suppleret med '+snapshotShown+' konkrete annoncer, kildekontrolleret 26.10.2026. Kontrollér altid originalopslaget. ':' ')+remoteCheck+' opslag har geografiske forbehold.'
    :'Søgeindekset returnerede '+rawTotal+' rå resultater, men ingen kunne bekræftes som konkrete stillingsopslag, der matcher søgeordene. '+(portalSummary?'Kilder: '+portalSummary+'. ':'')+'Udvid søgeordene eller geografien.';
   el('jobSearchStatus').className='notice '+(state.jobOpportunities.length?'goodbox':'warnbox');
   el('jobSearchStatus').textContent=message+(errors.length?' Kildeproblemer: '+errors.join(' | '):'');
  }
  finishJobSearchProgress();
 }catch(error){
  if(el('jobSearchStatus')){el('jobSearchStatus').className='notice warnbox';el('jobSearchStatus').textContent='Job-søgningen fejlede: '+String(error&&error.message||error)}
  finishJobSearchProgress();
 }finally{toggleBusy('jobOpportunitiesSearchButton',false)}
}
function renderCompanyCriteriaResults(){
 const node=el('companyCriteriaResults'),meta=el('companyCriteriaMeta');
 const results=state.companyCriteriaResults||[];
 if(meta)meta.textContent=results.length+' danske profiler';
 if(!node)return;
 node.innerHTML=results.length?results.map((item,index)=>{
  const source=String(item.sourceLabel||item.domain||'Dansk virksomhedsregister');
  const url=safeHttpUrl(item.url);
  const terms=item.matchedTerms||[];
  return '<article class="discovery-card company-criteria-card"><div class="discovery-card-top"><span class="discovery-source">'+escapeHtml(item.domain||source)+'</span><span class="chip">Dansk virksomhedsdata</span></div><h3>'+escapeHtml(item.title||'Virksomhedsprofil')+'</h3><p class="lead-company">'+escapeHtml(source)+'</p>'+(item.description?'<p class="lead-snippet">'+escapeHtml(item.description)+'</p>':'<p class="lead-snippet">Åbn virksomhedsprofilen for at se tilgængelige registreringsoplysninger.</p>')+'<div class="discovery-matched">'+(terms.length?terms.slice(0,5).map(term=>'<span class="chip">'+escapeHtml(term)+'</span>').join(''):'<span class="chip">Matchet på geografi eller søgefrase</span>')+'</div><div class="discovery-actions">'+(url?'<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">Åbn dansk virksomhedsprofil ↗</a>':'')+'</div></article>';
 }).join(''):'<div class="empty">Ingen danske virksomhedsprofiler søgt endnu. Brug “Find danske virksomheder” for at søge ud fra profilord og geografi.</div>';
}
async function searchDanishCompaniesByCriteria(){
 const profile=searchProfile();
 const terms=profile.terms.slice(0,8).join(' ');
 const location=searchPhrase(profile.location||'Danmark');
 const button=el('companyCriteriaSearchButton');
 if(button){button.disabled=true;button.dataset.previousLabel=button.textContent;button.textContent='Søger i danske kilder…'}
 const status=el('companyCriteriaStatus');
 if(status){status.className='notice goodbox';status.textContent='Søger kun efter virksomheder med danske virksomhedsprofiler. Søgeord: '+(terms||'virksomheder')+' · Geografi: '+profile.location+'.'}
 const queries=[
  {id:'krak-dk',label:'Krak',targetSite:'krak.dk',query:'site:krak.dk/firma '+terms+' '+location+' adresse virksomhed',fallbackQuery:'site:krak.dk '+terms+' '+location+' firma adresse'},
  {id:'jobindex-dk',label:'Jobindex Danmark',targetSite:'jobindex.dk',query:'site:jobindex.dk/virksomhed '+terms+' '+location+' virksomhed',fallbackQuery:'site:jobindex.dk '+terms+' '+location+' arbejdsplads virksomhed'},
  {id:'proff-dk',label:'Proff Danmark',targetSite:'proff.dk',query:'site:proff.dk '+terms+' '+location+' CVR virksomhed ansatte',fallbackQuery:'site:proff.dk '+terms+' '+location+' virksomhed CVR'},
  {id:'estatistik-dk',label:'eStatistik',targetSite:'estatistik.dk',query:'site:estatistik.dk/virksomhed '+terms+' '+location+' antal ansatte branche',fallbackQuery:'site:estatistik.dk '+terms+' '+location+' dansk virksomhed CVR'},
  {id:'ownr-dk',label:'Ownr',targetSite:'ownr.dk',query:'site:ownr.dk '+terms+' '+location+' CVR adresse branche',fallbackQuery:'site:ownr.dk '+terms+' '+location+' virksomhed CVR'},
  {id:'virk-dk',label:'CVR/Virk',targetSite:'datacvr.virk.dk',query:'site:datacvr.virk.dk '+terms+' '+location+' CVR branche',fallbackQuery:'site:virk.dk '+terms+' '+location+' CVR virksomhed'},
  {id:'jobindex-dk',label:'Jobindex Danmark',targetSite:'jobindex.dk',query:'site:jobindex.dk/virksomhed '+terms+' '+location+' virksomhed',fallbackQuery:'site:jobindex.dk '+terms+' '+location+' virksomhed'}
 ];
 try{
  const outcomes=await Promise.allSettled(queries.map(query=>queryIndex(query,profile.terms)));
  const candidates=[],errors=outcomes.filter(outcome=>outcome.status==='rejected').length;
  outcomes.forEach((outcome,index)=>{
   if(outcome.status!=='fulfilled')return;
   (outcome.value.results||[]).forEach(result=>{
    if(!result||!safeHttpUrl(result.url)||!isDanishRegistrySource(result))return;
    if(!candidates.some(old=>canonicalSearchUrl(old.url)===canonicalSearchUrl(result.url))){
     candidates.push({...result,sourceType:queries[index].id,sourceLabel:queries[index].label});
    }
   });
  });
  state.companyCriteriaResults=candidates.slice(0,30);
  state.companyCriteriaLastSearch=new Date().toISOString();
  persist();renderCompanyCriteriaResults();
  if(status){
   if(candidates.length){status.className='notice goodbox';status.textContent='Fandt '+candidates.length+' virksomhedsprofiler fra danske virksomhedsregistre. Resultaterne er filtreret til danske kilder. Åbn kilden og kontrollér virksomhedsidentitet og oplysninger.'}
   else if(errors===queries.length){status.className='notice warnbox';status.textContent='Søgningen kunne ikke gennemføres i de danske kilder. Kontrollér forbindelsen, og prøv igen.'}
   else {status.className='notice warnbox';status.textContent='Ingen danske virksomhedsprofiler matchede de valgte kriterier. Prøv bredere profilord eller justér geografi.'}
  }
 }catch(error){
  if(status){status.className='notice warnbox';status.textContent='Søgningen efter danske virksomheder fejlede: '+String(error&&error.message||error)}
 }finally{
  if(button){button.disabled=false;button.textContent=button.dataset.previousLabel||'Find danske virksomheder';delete button.dataset.previousLabel}
 }
}

function defaultFollowUpDate(){const date=new Date();date.setDate(date.getDate()+3);return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
function addFollowUpFromResult(collection,index){
 const source=collection==='jobs'?state.jobOpportunities[index]:collection==='prospects'?state.networkProspects[index]:state.networkCommunities[index];if(!source)return;
 const url=safeHttpUrl(source.url);
 if(url&&state.followUps.some(item=>item.url&&canonicalSearchUrl(item.url)===canonicalSearchUrl(url))){
  const message='Dette link findes allerede i opfølgningslisten.';
  if(collection==='jobs'&&el('jobSearchStatus'))el('jobSearchStatus').textContent=message;else showNetworkStatus(message,'');return;
 }
 const type=collection==='jobs'?'job':source.type==='company'?'company':source.type==='post'?'post':source.type==='group'?'group':'contact';
 state.followUps.unshift({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),type,title:source.title||source.domain||'Uden titel',company:source.company||'',url,domain:source.domain||'',description:source.description||'',sourceLabel:source.sourceLabel||source.queryLabel||'',status:'to_review',dueDate:defaultFollowUpDate(),note:type==='job'?'Kontrollér krav, frist og aktiv status på originalsiden. Vurdér derefter CV-match og næste handling.':'Kontrollér personens aktuelle rolle og find et konkret fagligt fællestræk, før du sender en manuel connect-anmodning.',createdAt:new Date().toISOString()});
 state.followUps=state.followUps.slice(0,300);persist();renderFollowUps();renderJobOpportunities();renderDiscoveryResults();
 const message='Tilføjet til opfølgning. Standarddatoen er om tre dage; ret den efter din plan.';
 if(collection==='jobs'&&el('jobSearchStatus')){el('jobSearchStatus').className='notice goodbox';el('jobSearchStatus').textContent=message}else showNetworkStatus(message,'goodbox');
}
function copyNetworkOutreach(collection,index){
 const item=collection==='prospects'?state.networkProspects[index]:state.networkCommunities[index];if(!item)return;
 const profileWords=(item.matchedTerms||[]).slice(0,2).join(' og '),fallback=String(state.networkSearchTerms||'digital marketing og CRM').split(',').slice(0,2).join(' og ').trim();
 const message='Hej, jeg faldt over din profil i forbindelse med mit arbejde med '+(profileWords||fallback)+'. Jeg arbejder med marketing, kundedata og automation og vil gerne udvide mit faglige netværk. Har du lyst til at connecte?';
 const onDone=()=>showNetworkStatus('Connect-tekst kopieret. Tilpas den til personen og send den manuelt på LinkedIn.','goodbox');
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(message).then(onDone).catch(()=>window.prompt('Kopiér og tilpas teksten manuelt:',message));
 else window.prompt('Kopiér og tilpas teksten manuelt:',message);
}
function loadJobOpportunityInAnalyzer(index){
 const item=state.jobOpportunities[index];if(!item)return;
 state.jobtitle=String(item.title||'').slice(0,500);state.company=String(item.company||'').slice(0,500);
 state.jobtext=String(item.description||'').slice(0,50000)||'Indsæt hele jobteksten fra originalopslaget. Webindekset gav ikke et tilstrækkeligt uddrag.';
 persist();if(el('jobtitle'))el('jobtitle').value=state.jobtitle;if(el('company'))el('company').value=state.company;if(el('jobtext'))el('jobtext').value=state.jobtext;if(el('sourceurl'))el('sourceurl').value=item.url||'';
 go('job');notify('jobmsg','Titel og tilgængeligt uddrag er indsat. Åbn originalopslaget, indsæt hele teksten og kontrollér deadline, før du analyserer.','goodbox');
}
function followUpTypeName(type){return ({contact:'Person',company:'Virksomhed',post:'Opslag',group:'Faggruppe',job:'Job',other:'Andet'})[type]||'Andet'}
function followUpStatusName(status){return ({to_review:'Skal undersøges',ready:'Klar til næste skridt',contacted:'Kontaktet',replied:'Svar modtaget',applied:'Ansøgt',closed:'Lukket'})[status]||'Skal undersøges'}
function updateFollowUp(id,field,value){
 const item=state.followUps.find(row=>String(row.id)===String(id));if(!item)return;
 if(field==='status'&&['to_review','ready','contacted','replied','applied','closed'].includes(value))item.status=value;
 else if(field==='dueDate'&&(!value||/^\d{4}-\d{2}-\d{2}$/.test(value)))item.dueDate=value;
 else if(field==='note')item.note=String(value||'').slice(0,1500);
 persist();renderFollowUps();renderJobOpportunities();
}
function removeFollowUp(id){if(!confirm('Fjerne dette punkt fra opfølgningslisten?'))return;state.followUps=state.followUps.filter(item=>String(item.id)!==String(id));persist();renderFollowUps();renderJobOpportunities()}
function renderFollowUps(){
 const search=normalizeSearchText(el('followupSearch')?.value||''),filter=el('followupFilter')?.value||'open';
 const today=new Date();today.setHours(0,0,0,0);
 const overdue=item=>item.dueDate&&new Date(item.dueDate+'T00:00:00')<today&&item.status!=='closed';
 const list=(state.followUps||[]).filter(item=>{
  const content=normalizeSearchText([item.title,item.company,item.domain,item.note,item.type].join(' '));
  if(search&&!content.includes(search))return false;
  if(filter==='open'&&item.status==='closed')return false;
  if(filter==='overdue'&&!overdue(item))return false;
  if(filter==='contacts'&&!['contact','company','post','group'].includes(item.type))return false;
  if(filter==='jobs'&&item.type!=='job')return false;
  if(filter==='closed'&&item.status!=='closed')return false;
  return true;
 }).sort((a,b)=>(a.dueDate||'9999-99-99').localeCompare(b.dueDate||'9999-99-99'));
 const options=[['to_review','Skal undersøges'],['ready','Klar til næste skridt'],['contacted','Kontaktet'],['replied','Svar modtaget'],['applied','Ansøgt'],['closed','Lukket']];
 const html=list.map(item=>{
  const id=escapeHtml(item.id),due=item.dueDate?new Date(item.dueDate+'T00:00:00').toLocaleDateString('da-DK'):'Ingen dato',late=overdue(item),closed=item.status==='closed';
  return '<article class="discovery-card followup-card"><div class="discovery-top"><span class="discovery-source">'+escapeHtml(followUpTypeName(item.type))+' · '+escapeHtml(item.sourceLabel||item.domain||'Kilde ikke angivet')+'</span><span class="followup-status-chip '+(late?'overdue':closed?'done':'')+'">'+(late?'Forfalden · ':'')+escapeHtml(followUpStatusName(item.status))+'</span></div><h3>'+escapeHtml(item.title)+'</h3><p class="lead-company">'+escapeHtml(item.company||item.domain||'Person/virksomhed ikke angivet')+' · Næste dato: '+escapeHtml(due)+'</p>'+(item.description?'<p class="lead-snippet">'+escapeHtml(item.description.slice(0,360))+'</p>':'')+'<div class="followup-fields"><div><label>Status</label><select data-followup-field="status" data-followup-id="'+id+'">'+options.map(pair=>'<option value="'+pair[0]+'"'+(item.status===pair[0]?' selected':'')+'>'+pair[1]+'</option>').join('')+'</select></div><div><label>Dato for næste skridt</label><input type="date" data-followup-field="dueDate" data-followup-id="'+id+'" value="'+escapeHtml(item.dueDate||'')+'"></div><div style="grid-column:span 2"><label>Næste handling / noter</label><textarea rows="2" data-followup-field="note" data-followup-id="'+id+'">'+escapeHtml(item.note||'')+'</textarea></div></div><div class="discovery-actions">'+(item.url?'<a href="'+escapeHtml(item.url)+'" target="_blank" rel="noopener noreferrer">Åbn original ↗</a>':'')+'<button class="secondary" data-followup-remove="'+id+'">Fjern fra listen</button></div></article>';
 }).join('');
 if(el('followupsResults'))el('followupsResults').innerHTML=html||'<div class="empty">Ingen opfølgningspunkter matcher filteret. Gem en kontakt eller et job fra de andre sider for at begynde.</div>';
 const open=state.followUps.filter(item=>item.status!=='closed'),late=state.followUps.filter(overdue),progressed=state.followUps.filter(item=>['contacted','replied','applied'].includes(item.status)),closed=state.followUps.filter(item=>item.status==='closed');
 if(el('followupOpenCount'))el('followupOpenCount').textContent=open.length;
 if(el('followupOverdueCount'))el('followupOverdueCount').textContent=late.length;
 if(el('followupContactedCount'))el('followupContactedCount').textContent=progressed.length;
 if(el('followupClosedCount'))el('followupClosedCount').textContent=closed.length;
 if(el('followupCountBadge'))el('followupCountBadge').textContent=open.length;
}
function exportFollowUps(){
 const headers=['Type','Titel','Virksomhed','URL','Status','Næste dato','Noter'];
 const rows=state.followUps.map(item=>[followUpTypeName(item.type),item.title,item.company,item.url,followUpStatusName(item.status),item.dueDate,item.note]);
 const csv=[headers,...rows].map(row=>row.map(value=>'"'+String(value||'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 download('get-a-job-hobo-opfoelgning.csv',csv,'text/csv;charset=utf-8');
}
function bindDiscoveryEvents(){
 const clickHandler=event=>{
  const button=event.target.closest('[data-discovery-action],[data-followup-remove]');if(!button)return;
  if(button.dataset.followupRemove){removeFollowUp(button.dataset.followupRemove);return}
  const collection=button.dataset.collection,index=Number(button.dataset.index);
  if(button.dataset.discoveryAction==='follow')addFollowUpFromResult(collection,index);
  if(button.dataset.discoveryAction==='copy')copyNetworkOutreach(collection,index);
  if(button.dataset.discoveryAction==='analyze')loadJobOpportunityInAnalyzer(index);
 };
 ['networkProspectsResults','networkCommunitiesResults','jobOpportunitiesResults'].forEach(id=>{
  const node=el(id);if(node&&!node.dataset.discoveryBound){node.addEventListener('click',clickHandler);node.dataset.discoveryBound='1'}
 });
 const follow=el('followupsResults');
 if(follow&&!follow.dataset.followupBound){
  follow.addEventListener('click',clickHandler);
  follow.addEventListener('change',event=>{const field=event.target.dataset.followupField;if(field)updateFollowUp(event.target.dataset.followupId,field,event.target.value)});
  follow.addEventListener('blur',event=>{const field=event.target.dataset.followupField;if(field==='note')updateFollowUp(event.target.dataset.followupId,'note',event.target.value)},true);
  follow.dataset.followupBound='1';
 }
}
function initializeDiscovery(){
 syncNetworkSearchPreferencesFromCV();syncOpportunityInputs();renderDiscoveryResults();renderJobOpportunities();renderCompanyCriteriaResults();renderFollowUps();bindDiscoveryEvents();
 if(Array.isArray(state.jobOpportunities)&&state.jobOpportunities.length){
  const validSaved=state.jobOpportunities.filter(item=>!item.verifiedSnapshot||Date.parse(item.snapshotExpiresAt||'')>Date.now());
  if(validSaved.length!==state.jobOpportunities.length){state.jobOpportunities=validSaved;persist();renderJobOpportunities();}
  autoLookupJobCompanyFacts(state.jobOpportunities.slice());
 }
}
window.saveNetworkSearchPreferences=saveNetworkSearchPreferences;
window.syncJobSearchPreferences=syncJobSearchPreferences;
window.searchNetworkProspects=searchNetworkProspects;
window.searchNetworkCommunities=searchNetworkCommunities;
window.searchJobOpportunities=searchJobOpportunities;
window.restoreSearchTermsFromCV=restoreSearchTermsFromCV;
window.focusJobSearch=focusJobSearch;
window.closeJobSearchProgress=closeJobSearchProgress;
window.confirmJobSearchDespiteCv=confirmJobSearchDespiteCv;
window.cancelJobSearchForCv=cancelJobSearchForCv;
window.searchDanishCompaniesByCriteria=searchDanishCompaniesByCriteria;
window.addFollowUpFromResult=addFollowUpFromResult;
window.copyNetworkOutreach=copyNetworkOutreach;
window.loadJobOpportunityInAnalyzer=loadJobOpportunityInAnalyzer;
window.exportFollowUps=exportFollowUps;
window.renderDiscoveryResults=renderDiscoveryResults;
window.renderJobOpportunities=renderJobOpportunities;
window.renderCompanyCriteriaResults=renderCompanyCriteriaResults;
window.lookupCompanyInsights=lookupCompanyInsights;
window.renderFollowUps=renderFollowUps;
window.syncOpportunityInputs=syncOpportunityInputs;
window.fillSearchPreferences=initializeDiscovery;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeDiscovery,{once:true});else initializeDiscovery();
})();