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
 if(el('jobKeywordCount'))el('jobKeywordCount').textContent=parseTerms(state.networkSearchTerms).length;
 if(el('jobOpportunityCount'))el('jobOpportunityCount').textContent=(state.jobOpportunities||[]).length;
 if(el('jobTrackedCount'))el('jobTrackedCount').textContent=(state.followUps||[]).filter(item=>item.type==='job').length;
 if(el('jobLastSearchLabel'))el('jobLastSearchLabel').textContent=state.jobLastSearch?new Date(state.jobLastSearch).toLocaleDateString('da-DK'):'Ikke søgt';
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
 return ['jobindex.dk','jobnet.dk','jobdanmark.dk','ofir.dk','stepstone.dk','hk.dk','workindenmark.dk','jobsearch.dk','it-jobbank.dk'].some(domain=>value===domain||value.endsWith('.'+domain));
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
 if(item&&item.matchScope&&['denmark','remote-denmark','remote-check','danish-portal'].includes(item.matchScope))return true;
 return getDanishJobScope(item,profile).eligible;
}

function jobQueries(profile){
 const terms=profile.terms.slice(0,7).join(' '),loc=searchPhrase(profile.location||'Danmark');
 return [
  {id:'linkedin-jobs',label:'LinkedIn Jobs · Danmark og remote i Danmark',targetSite:'linkedin.com',scope:'danish-jobs',query:'site:linkedin.com/jobs/view '+terms+' '+loc+' Denmark remote Denmark eligible',fallbackQuery:'site:linkedin.com/jobs/view '+terms+' '+loc+' remote Denmark'},
  {id:'jobindex',label:'Jobindex Danmark',targetSite:'jobindex.dk',scope:'danish-jobs',query:'site:jobindex.dk/jobannonce '+terms+' '+loc+' Danmark',fallbackQuery:'site:jobindex.dk '+terms+' '+loc+' Danmark job'},
  {id:'hk-jobportal',label:'HK Jobportal · Danmark',targetSite:'hk.dk',scope:'danish-jobs',query:'site:hk.dk '+terms+' '+loc+' Danmark stilling',fallbackQuery:'site:hk.dk '+terms+' '+loc+' Danmark job'},
  {id:'jobnet',label:'Jobnet · Danmark',targetSite:'jobnet.dk',scope:'danish-jobs',query:'site:jobnet.dk '+terms+' '+loc+' Danmark',fallbackQuery:'site:jobnet.dk '+terms+' '+loc+' Danmark job'},
  {id:'workindenmark',label:'Workindenmark · jobs i Danmark',targetSite:'workindenmark.dk',scope:'danish-jobs',query:'site:workindenmark.dk '+terms+' '+loc+' Denmark',fallbackQuery:'site:workindenmark.dk '+terms+' '+loc+' Denmark remote'},
  {id:'stepstone',label:'StepStone Danmark',targetSite:'stepstone.dk',scope:'danish-jobs',query:'site:stepstone.dk '+terms+' '+loc+' Danmark',fallbackQuery:'site:stepstone.dk '+terms+' '+loc+' Danmark job'},
  {id:'jobdanmark',label:'Jobdanmark · Danmark',targetSite:'jobdanmark.dk',scope:'danish-jobs',query:'site:jobdanmark.dk '+terms+' '+loc+' Danmark',fallbackQuery:'site:jobdanmark.dk '+terms+' '+loc+' job Danmark'},
  {id:'career-sites',label:'Danske virksomheders karrieresider',targetSite:'',scope:'danish-jobs',query:'career jobs '+terms+' '+loc+' Denmark Denmark remote eligible',fallbackQuery:'jobs '+terms+' '+loc+' Denmark remote from Denmark'}
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
 return terms.filter(term=>normalizeSearchText(term).split(' ').every(token=>token.length>1&&text.includes(token)));
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
 const item={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),type:classifyResult(url,title,query.id),title,url,domain:registrableDomain(parsed.hostname),description,location:pick(raw.location,raw.workLocation,raw.work_location,raw.city,raw.country,raw.address),country:pick(raw.country),companyFacts,sourceLabel:usedFallback?host:(query.targetSite&&domainMatches(host,query.targetSite)?query.label:host),queryLabel:query.label+(usedFallback?' (bredere søgning)':''),matchedTerms:matchedTerms(title,description,terms),createdAt:new Date().toISOString(),saved:false};
 if(query.scope==='danish-jobs'){const scope=getDanishJobScope(item,null);item.matchScope=scope.kind;item.matchScopeLabel=scope.label}
 return item;
}
async function isGenericJobLandingPage(item){
 const title=normalizeSearchText(item&&item.title||'');
 const url=String(item&&item.url||'').toLowerCase();
 const genericTitle=/(^| )(remote jobs?( in)? denmark|jobs? in denmark|find jobs?|job search|search jobs?|browse jobs?|all (current )?jobs?|career opportunities|job portal|job board|job categories|vacancies in denmark|work in denmark|job opportunities in|ledige stillinger|jobmuligheder|jobsogning|jobsoegning|find et job|joboversigt)( |$)/i.test(title);
 const genericPath=/\/(jobs?|careers?|search|job-search|job-portal|job-listings|jobs-in-denmark|remote-jobs|vacancies)\/?(?:\?.*)?$/.test(url);
 return genericTitle||(genericPath&&!/\/jobs?\/(?:view|details|[0-9]{4,})/i.test(url));
}
function isLikelySpecificJobPosting(item,query){
 if(!item||!safeHttpUrl(item.url)||isGenericJobLandingPage(item))return false;
 const url=String(item.url).toLowerCase(),host=String(item.domain||'').toLowerCase();
 const strongPath=(host.includes('linkedin.com')&&/\/jobs\/view\//.test(url))||
  (host.includes('jobindex.dk')&&/\/(jobannonce|job|stillinger)\//.test(url))||
  (host.includes('stepstone.dk')&&/\/(job|jobad|stellenangebote|stilling)\//.test(url))||
  (host.includes('jobnet.dk')&&/\/(job|stillinger|vacancy|vacancies)\//.test(url));
 if(strongPath)return true;
 const title=String(item.title||'').trim(),description=String(item.description||'');
 const looksLikeRole=title.length>=10&&title.split(/\s+/).length<=18&&!/\b(remote jobs|job portal|job search|jobs in|browse jobs|find jobs|career opportunities|marketing glossary|definitions|company profile|about us)\b/i.test(title);
 const postingLanguage=/\b(we are looking for|we're looking for|you will|ansøg|søger en|vi søger|stillingen|jobbet|apply now|apply for|your role|responsibilities|requirements|qualifications|arbejdsopgaver|arbejdssted|deadline|job id|jobnummer)\b/i.test(description);
 if(looksLikeRole&&postingLanguage)return true;
 // A job-specific title on a targeted job portal is enough when the snippet omits application language.
 return !!(looksLikeRole&&query&&query.scope==='danish-jobs'&&query.id!=='career-sites');
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
   if(!isDanishJobResult(row,query,profile))return null;
   const item=mapResult(row,query,terms,usedFallback);if(!item)return null;
   if(query.targetSite&&!domainMatches(new URL(item.url).hostname,query.targetSite))return null;
   if(query.scope==='danish-jobs'&&!isLikelySpecificJobPosting(item,query))return null;
   if(query.scope==='danish-jobs'){
    const scope=getDanishJobScope(item,profile);
    if(!scope.eligible)return null;
    item.matchScope=scope.kind;item.matchScopeLabel=scope.label;
   }
   return item;
  }).filter(Boolean);
 }
 let rows=[],primaryError='';
 try{rows=await request(query.query)}catch(error){primaryError=String(error&&error.message||error)}
 let mapped=mapAndFilter(rows,false);
 let fallback=false;
 if(!mapped.length&&query.fallbackQuery){
  try{fallback=true;rows=await request(query.fallbackQuery);mapped=mapAndFilter(rows,true)}
  catch(error){const message=String(error&&error.message||error);if(primaryError)throw new Error(primaryError+'; bredere søgning: '+message);throw error}
 }
 return {query,results:mapped,usedFallback:fallback};
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

function isDanishCompanySource(source){
 const raw=typeof source==='string'?source:(source&&source.url)||'';
 const url=safeHttpUrl(raw);if(!url)return false;
 let host='';try{host=new URL(url).hostname.toLowerCase().replace(/^www\./,'')}catch(e){return false}
 return ['krak.dk','jobindex.dk','jobrate.dk','proff.dk','estatistik.dk','ownr.dk','virk.dk','datacvr.virk.dk','cvr.dk'].some(domain=>host===domain||host.endsWith('.'+domain));
}
function isDanishRegistrySource(source){
 const raw=typeof source==='string'?source:(source&&source.url)||'';
 const url=safeHttpUrl(raw);if(!url)return false;
 let host='';try{host=new URL(url).hostname.toLowerCase().replace(/^www\./,'')}catch(e){return false}
 return ['krak.dk','jobindex.dk','jobrate.dk','proff.dk','estatistik.dk','ownr.dk','virk.dk','datacvr.virk.dk','cvr.dk'].some(domain=>host===domain||host.endsWith('.'+domain));
}
function curatedCompanyFacts(){return {}}
function effectiveCompanyFacts(item){
 const stored=item&&item.companyFacts||{};
 const allSources=(Array.isArray(stored.sources)?stored.sources:[]).filter(source=>isDanishCompanySource(source));
 const hasDanishRegistry=allSources.some(source=>isDanishRegistrySource(source));
 const result={lookupStatus:stored.lookupStatus,lookupAt:stored.lookupAt,lookupError:stored.lookupError,sources:hasDanishRegistry?allSources:[]};
 const facts=['employeeCount','location','industry','foundedYear','companyType','employeeRating','ratingCount'];
 const factSources={};
 if(hasDanishRegistry){
  for(const field of facts){
   const source=stored.factSources&&stored.factSources[field];
   if(source&&isDanishCompanySource(source)&&String(stored[field]||'').trim()){
    result[field]=stored[field];factSources[field]=source;
   }
  }
 }
 result.factSources=factSources;
 return result;
}
function companyNameFromOpportunity(item){
 const supplied=String(item&&(item.companyName||item.company||item.employer)||'').trim();if(supplied)return supplied.slice(0,120);
 const title=String(item&&item.title||'').trim();
 const parts=title.split(/\s*[|–—]\s*/).map(x=>x.trim()).filter(Boolean);
 if(parts.length>1&&parts[parts.length-1].length<65)return parts[parts.length-1];
 const host=String(item&&item.domain||'').replace(/^www\./,'');
 return host?host.split('.')[0].replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()):'Virksomheden';
}
function normalizeInsightText(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function companyResultRelevant(result,company,item){
 if(!isDanishCompanySource(result))return false;
 const content=normalizeInsightText([result.title,result.description,result.url].join(' '));
 const target=normalizeInsightText(company);
 const tokens=target.split(/\s+/).filter(x=>x.length>=3);
 const contentTokens=content.split(/\s+/);
 const matches=tokens.filter(token=>contentTokens.includes(token)).length;
 if(target&&content.includes(target))return true;
 if(tokens.length===1)return matches===1;
 return tokens.length>1&&matches>=Math.min(2,tokens.length);
}
function companySourceHost(source){
 const url=safeHttpUrl(source&&source.url);
 try{return new URL(url||'').hostname.toLowerCase().replace(/^www\./,'')}catch(e){return ''}
}
async function enrichCompanyPageContext(source){
 const host=companySourceHost(source),url=safeHttpUrl(source&&source.url);
 const isJobindex=host==='jobindex.dk'||host.endsWith('.jobindex.dk');
 const isKrak=host==='krak.dk'||host.endsWith('.krak.dk');
 if(!url||(!isJobindex&&!isKrak))return source;
 if(isJobindex&&!/\/virksomhed\//i.test(url))return source;
 if(isKrak&&!/firma|virksomhed/i.test(url))return source;
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
async function geocodeDanishCompanyLocation(location){
 const query=String(location||'').trim();if(!query)return null;
 const key='gajh_company_geocode_'+normalizeInsightText(query);
 try{const cached=localStorage.getItem(key);if(cached){const parsed=JSON.parse(cached);if(Number.isFinite(parsed.lat)&&Number.isFinite(parsed.lon))return parsed}}catch(e){}
 const endpoint=COMPANY_GEOCODE_API+'?'+new URLSearchParams({format:'jsonv2',countrycodes:'dk',limit:'1',q:query}).toString();
 const rows=await fetchJsonTimeout(endpoint,9000);
 if(!Array.isArray(rows)||!rows.length)return null;
 const value={lat:Number(rows[0].lat),lon:Number(rows[0].lon),displayName:String(rows[0].display_name||query),sourceUrl:'https://www.openstreetmap.org/'};
 if(!Number.isFinite(value.lat)||!Number.isFinite(value.lon))return null;
 try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}
 return value;
}
function applyCompanySourceFacts(sources,prior){
 const f={...(prior||{})},factSources={...(f.factSources||{})};
 const bodyOf=source=>String((source.title||'')+' '+(source.description||'')+' '+(source.pageContent||'')).replace(/\s+/g,' ');
 const fill=(field,value,source)=>{if(!String(f[field]||'').trim()&&value!==undefined&&value!==null&&String(value).trim()!==''){f[field]=String(value).trim();factSources[field]=source}};
 const prioritised=[...sources].sort((a,b)=>{const rank=source=>companySourceHost(source).includes('jobindex.dk')?0:companySourceHost(source).includes('krak.dk')?1:2;return rank(a)-rank(b)});
 for(const source of prioritised){
  if(!isDanishCompanySource(source))continue;
  const text=bodyOf(source),domain=String(source.domain||'').toLowerCase().replace(/^www\./,'');
  const structured=source.companyFacts||{};
  const workplace=domain==='jobindex.dk'||domain.endsWith('.jobindex.dk')||domain==='jobrate.dk'||domain.endsWith('.jobrate.dk');
  let m;
  fill('employeeCount',structured.employeeCount||structured.employee_count||structured.employees||structured.companySize||structured.company_size||structured.employeeRange,source);
  fill('location',structured.location||structured.workLocation||structured.work_location||source.location||source.city||source.address,source);
  fill('industry',structured.industry||structured.sector,source);
  fill('foundedYear',structured.foundedYear||structured.founded_year||structured.founded,source);
  fill('companyType',structured.companyType||structured.company_type||structured.organizationType||structured.organization_type,source);
  if(workplace){
   fill('employeeRating',structured.employeeSatisfaction||structured.employee_satisfaction||structured.employeeRating||structured.employee_rating||structured.ratingFromEmployees,source);
   fill('ratingCount',structured.employeeReviewCount||structured.employee_review_count||structured.workplaceReviewCount||structured.workplace_review_count||structured.ratingCount,source);
  }
  if(!f.employeeCount){
   m=text.match(/(?:company size|antal ansatte|antal medarbejdere|employees|employee count|staff size)\s*[:\-]?\s*(\d{1,4}\s*[-–]\s*\d{1,4}|\d{1,3}(?:[.,\s]\d{3})*|\d{1,5})(?:\s*(?:employees|medarbejdere|ansatte))?/i);
   if(m)fill('employeeCount',m[1].replace(/\s+/g,' ').trim(),source);
  }
  if(!f.employeeCount&&(m=text.match(/\b(\d{1,4}\s*[-–]\s*\d{1,4})\s*(?:employees|medarbejdere|ansatte)\b/i)))fill('employeeCount',m[1].replace(/\s+/g,' ').trim(),source);
  if(!f.employeeCount&&(m=text.match(/\b(\d{1,5})\s+(?:ansatte|medarbejdere|employees)\b/i)))fill('employeeCount',m[1],source);
  if(!f.employeeCount&&(m=text.match(/(?:medarbejderantal|antal medarbejdere|antal ansatte|virksomhedsstørrelse|company size|employees)\D{0,25}(\d{1,4}\s*[-–]\s*\d{1,4}|\d{1,5})/i)))fill('employeeCount',m[1].replace(/\s+/g,' ').trim(),source);
  if(!f.foundedYear&&(m=text.match(/(?:stiftet|etableret|grundlagt|founded|registreringsdato)\D{0,32}\b(19\d{2}|20\d{2})\b/i)))fill('foundedYear',m[1],source);
  if(!f.location&&(m=text.match(/(?:headquarters|headquartered|hovedkontor|location|lokation|adresse|address|besøgsadresse|postadresse)\s*[:\-]?\s*(.{3,100})/i))){
   const location=m[1].split(/\b(?:company size|company type|type|founded|industry|specialties|employees|employee count|about us|visit website|revenue|virksomhedstype|antal ansatte|telefon|phone|CVR|kontakt|åbningstider)\b/i)[0].replace(/[|,;\s.]+$/,'').trim();
   if(location&&location.length<=100)fill('location',location,source);
  }
  if(!f.location&&(m=text.match(/\b(\d{4}\s+[A-ZÆØÅ][A-Za-zÆØÅæøå .'-]{2,50})\b/)))fill('location',m[1].trim(),source);
  if(!f.industry&&(m=text.match(/(?:branche|industry|sector|hovedbranche|branchekode)\s*[:\-]?\s*(.{3,70})/i))){
   const industry=m[1].split(/\b(?:company size|company type|type|founded|headquarters|employees|specialties|about us|revenue)\b/i)[0].replace(/[|,;\s.]+$/,'').trim();
   if(industry&&industry.length<=70)fill('industry',industry,source);
  }
  if(!f.companyType&&(m=text.match(/(?:company type|type|virksomhedsform|selskabsform|organization type)\s*[:\-]?\s*(privately held|public company|privately owned|private company|offentlig institution|aktieselskab|anpartsselskab|ApS|A\/S|I\/S|P\/S|limited|gmbh|llc|inc\.?)/i)))fill('companyType',m[1],source);
  if(workplace&&!f.employeeRating){
   m=text.match(/(?:medarbejdertilfredshed|arbejdspladsrating|employee rating|workplace rating|jobglæde|job satisfaction|samlet vurdering|rating value|ratingvalue|rating)\D{0,35}([1-5](?:[,.]\d)?)(?:\s*(?:\/\s*5|ud af 5|af 5|stjerner?|stars?))?/i)
    ||text.match(/\b([1-5][,.]\d)\s*(?:\/\s*5|out of 5|ud af 5|stjerner af 5|stars? out of 5)\b/i);
   if(m)fill('employeeRating',(m[1]||m[2]).replace(',','.'),source);
   if(!f.employeeRating){
    const stars=text.match(/[★⭐☆]{4,5}/);
    if(stars){const filled=(stars[0].match(/[★⭐]/g)||[]).length;const total=stars[0].length;if(total===5&&filled>=1)fill('employeeRating',filled.toFixed(1),source)}
   }
  }
  if(workplace&&!f.ratingCount&&(m=text.match(/\b(\d{1,6})\s+(?:total\s+)?(?:(?:company|employee)\s+)?(?:anmeldelser|vurderinger|evalueringer|reviews|ratings)\b/i)))fill('ratingCount',m[1],source);
 }
 f.factSources=factSources;return f;
}
async function lookupCompanyInsights(index){
 const item=(state.jobOpportunities||[])[index];if(!item)return;
 const company=companyNameFromOpportunity(item);if(!company||company==='Virksomheden')return;
 item.companyFacts=item.companyFacts||{};
 if(item.companyFacts.lookupStatus==='loading')return;
 item.companyFacts.lookupStatus='loading';persist();renderJobOpportunities();
 const q='"'+company.replace(/"/g,' ')+'"';
 const queries=[
  {id:'krak-dk',label:'Krak · adresse, placering, telefon og firmadata',targetSite:'krak.dk',query:'site:krak.dk/firma '+q+' adresse postnummer ansatte CVR branche',fallbackQuery:'site:krak.dk '+q+' firmaprofil adresse telefon CVR antal ansatte'},
  {id:'jobindex-dk',label:'Jobindex · virksomhedsprofil, antal medarbejdere og evalueringer',targetSite:'jobindex.dk',query:'site:jobindex.dk/virksomhed '+q+' evalueringer stjerner jobglæde antal medarbejdere om virksomheden',fallbackQuery:'site:jobindex.dk/virksomhed '+q+' evalueringer anmeldelser antal medarbejdere virksomhedsprofil'},
  {id:'jobindex-ads-dk',label:'Jobindex · arbejdsgiver og arbejdssted',targetSite:'jobindex.dk',query:'site:jobindex.dk/jobannonce '+q+' arbejdssted virksomhed Danmark',fallbackQuery:'site:jobindex.dk '+q+' virksomhed adresse Danmark stilling'},
  {id:'proff-dk',label:'Proff Danmark · CVR, branche og ansatte',targetSite:'proff.dk',query:'site:proff.dk '+q+' CVR antal ansatte adresse branche',fallbackQuery:'site:proff.dk '+q+' virksomhed CVR ansatte adresse'},
  {id:'estatistik-dk',label:'eStatistik · danske virksomhedsdata',targetSite:'estatistik.dk',query:'site:estatistik.dk/virksomhed '+q+' CVR ansatte adresse branche etableret',fallbackQuery:'site:estatistik.dk '+q+' CVR dansk virksomhed ansatte adresse'},
  {id:'cvr-virk-dk',label:'CVR/Virk · officielt virksomhedsregister',targetSite:'virk.dk',query:'site:datacvr.virk.dk '+q+' CVR adresse branche antal ansatte',fallbackQuery:'site:virk.dk '+q+' CVR adresse branche ansatte'},
  {id:'ownr-dk',label:'Ownr · danske virksomhedsoplysninger',targetSite:'ownr.dk',query:'site:ownr.dk '+q+' CVR antal ansatte adresse stiftet branche',fallbackQuery:'site:ownr.dk '+q+' dansk virksomhed CVR'},
  {id:'jobrate-dk',label:'Jobrate Danmark · arbejdspladsvurdering',targetSite:'jobrate.dk',query:'site:jobrate.dk/arbejdsplads '+q+' medarbejdervurdering',fallbackQuery:'site:jobrate.dk '+q+' arbejdsplads medarbejdere'}
 ];
 try{
  const outcomes=await Promise.allSettled(queries.map(query=>queryIndex(query,[])));
  const found=[],sourceErrors=outcomes.filter(outcome=>outcome.status==='rejected').length;
  outcomes.forEach((outcome,i)=>{
   if(outcome.status!=='fulfilled')return;
   (outcome.value.results||[]).forEach(result=>{
    if(!result||!isDanishCompanySource(result)||!safeHttpUrl(result.url)||!companyResultRelevant(result,company,item))return;
    if(!found.some(old=>canonicalSearchUrl(old.url)===canonicalSearchUrl(result.url)))found.push({...result,sourceType:queries[i].id,sourceLabel:queries[i].label});
   });
  });
  const contextCandidates=found.filter(source=>{
   const host=companySourceHost(source),url=String(source.url||'');
   return ((host==='jobindex.dk'||host.endsWith('.jobindex.dk'))&&/\/virksomhed\//i.test(url))
    ||((host==='krak.dk'||host.endsWith('.krak.dk'))&&/firma|virksomhed/i.test(url));
  }).slice(0,4);
  const contextResults=await Promise.allSettled(contextCandidates.map(enrichCompanyPageContext));
  contextResults.forEach((result,i)=>{
   if(result.status!=='fulfilled')return;
   const enhanced=result.value,target=found.findIndex(source=>canonicalSearchUrl(source.url)===canonicalSearchUrl(enhanced.url));
   if(target>=0)found[target]=enhanced;
  });
  const registrySources=found.filter(source=>isDanishRegistrySource(source));
  const confirmedDanish=registrySources.length>0;
  const eligibleSources=confirmedDanish?found:[];
  const nextFacts=confirmedDanish?applyCompanySourceFacts(eligibleSources,{}):{};
  nextFacts.sources=eligibleSources.slice(0,12);
  nextFacts.lookupStatus=(sourceErrors===queries.length&&!found.length)?'error':'done';
  nextFacts.lookupAt=new Date().toISOString();
  nextFacts.danishCompanyConfirmed=confirmedDanish;
  if(nextFacts.location){
   try{
    const coords=await geocodeDanishCompanyLocation(nextFacts.location);
    if(coords){
     nextFacts.distanceKm=haversineDistanceKm(FREDERIKSBERG_ORIGIN.lat,FREDERIKSBERG_ORIGIN.lon,coords.lat,coords.lon).toLocaleString('da-DK',{maximumFractionDigits:1});
     nextFacts.distanceMethod='Luftlinje fra Frederiksberg bymidte';
     nextFacts.factSources={...(nextFacts.factSources||{}),distanceKm:{url:coords.sourceUrl,title:'OpenStreetMap geokodning',domain:'openstreetmap.org'}};
    }
   }catch(e){}
  }
  item.companyFacts=nextFacts;
  persist();renderJobOpportunities();
  const status=el('jobSearchStatus');
  if(status){
   if(sourceErrors===queries.length&&!found.length){
    status.className='notice warnbox';status.textContent='De danske kildesøgninger kunne ikke gennemføres for '+company+'. Kontrollér søgeforbindelsen, og prøv igen.';
   }else if(!confirmedDanish){
    status.className='notice warnbox';status.textContent='Ingen dansk virksomhedsregistrering fundet for '+company+'. Kun virksomheder med et match i danske virksomhedsregistre vises med virksomhedsdata. Der er ikke brugt udenlandske kilder.';
   }else{
    status.className='notice goodbox';status.textContent='Dansk virksomhedsprofil fundet for '+company+'. '+eligibleSources.length+' relevante resultater fra danske kilder. Medarbejdervurdering vises kun, hvis en dansk arbejdspladskilde har en dokumenteret score.';
   }
  }
 }catch(error){
  item.companyFacts={lookupStatus:'error',lookupError:String(error&&error.message||error).slice(0,220),sources:[],factSources:{}};
  persist();renderJobOpportunities();
  const status=el('jobSearchStatus');if(status){status.className='notice warnbox';status.textContent='Den danske virksomhedssøgning fejlede for '+company+': '+item.companyFacts.lookupError}
 }
}function companyInsightBox(item,index){
 const f=effectiveCompanyFacts(item),clean=value=>String(value==null?'':value).trim(),company=companyNameFromOpportunity(item);
 const rating=clean(f.employeeRating),n=Number(rating.replace(',','.'));
 const ratingDisplay=rating&&Number.isFinite(n)&&n>=0&&n<=5?n.toLocaleString('da-DK',{maximumFractionDigits:1})+'/5':rating||'Ikke fundet';
 const employees=clean(f.employeeCount)||'Ikke oplyst',location=clean(f.location)||'Ikke fundet';
 const distance=clean(f.distanceKm),distanceLine=distance?'ca. '+distance+' km i luftlinje fra Frederiksberg':(location!=='Ikke fundet'?'Afstand ikke beregnet':'Afstand kræver dansk adresse');
 const industry=clean(f.industry)||((item.matchedTerms||[]).slice(0,2).join(' · ')||'Ikke fastslået'),founded=clean(f.foundedYear)||'Ikke oplyst',type=clean(f.companyType)||'Ikke oplyst';
 const tone=['mint','orange','purple','blue'][index%4],sources=Array.isArray(f.sources)?f.sources:[],loading=f.lookupStatus==='loading',completed=f.lookupStatus==='done';
 const svg={
  people:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.2a4 4 0 0 1 0 7.6M18 14.2a4 4 0 0 1 4 4V20"/></svg>',
  pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  smile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.3 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
  building:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M9 21v-5h6v5"/></svg>'
 };
 let out='<section class="job-company-insights job-company-insights-'+tone+'" aria-label="Virksomhedsinfo">';
 out+='<div class="job-company-insights-head"><span class="job-company-insights-icon">'+svg.building+'</span><div><strong>'+escapeHtml(company)+'</strong><small>Jobindex og danske virksomhedsdata · afstand fra Frederiksberg</small></div><button type="button" class="job-company-lookup-button" data-discovery-action="company-info" data-collection="jobs" data-index="'+index+'" '+(loading?'disabled':'')+'>'+(loading?'Søger…':completed?'Opdatér data':'Find data')+' ↗</button></div>';
 out+='<div class="job-company-insight-stats"><div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.people+'</span><div><small>Medarbejdere</small><strong>'+escapeHtml(employees)+'</strong></div></div><div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.pin+'</span><div><small>Placering</small><strong>'+escapeHtml(location)+'</strong><span class="job-insight-sub">'+escapeHtml(distanceLine)+'</span></div></div><div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.smile+'</span><div><small>Jobtilfredshed</small><strong>'+escapeHtml(ratingDisplay)+'</strong><span class="job-insight-sub">'+escapeHtml(clean(f.ratingCount)?clean(f.ratingCount)+' evalueringer / anmeldelser':'Ingen bekræftet medarbejdervurdering')+'</span></div></div></div>';
 out+='<div class="job-company-insights-foot"><span><b>Branche/fokus</b> '+escapeHtml(industry)+'</span><span><b>Etableret</b> '+escapeHtml(founded)+'</span><span><b>Type</b> '+escapeHtml(type)+'</span></div>'; if(clean(f.companyHighlight))out+='<div class="job-company-highlight"><strong>Tal fra virksomhedens egen hjemmeside</strong><span>'+escapeHtml(f.companyHighlight)+'</span></div>';
 if(loading)out+='<div class="job-company-lookup-status" aria-live="polite"><span class="job-company-lookup-spinner"></span>Søger på Krak efter adresse og ansatte, på Jobindex efter virksomhedsprofil/jobglæde og i danske virksomhedsregistre…</div>';
 if(completed){
  out+='<div class="job-company-evidence"><div class="job-company-evidence-heading"><strong>Fundne kilder</strong><span>'+sources.length+' resultater</span></div>';
  out+=sources.length?'<div class="job-company-evidence-list">'+sources.slice(0,4).map(source=>'<a class="job-company-evidence-item" href="'+escapeHtml(safeHttpUrl(source.url))+'" target="_blank" rel="noopener noreferrer"><span class="job-company-evidence-copy"><strong>'+escapeHtml(source.domain||source.sourceLabel||'Offentlig kilde')+'</strong><small>'+escapeHtml(source.title||'Virksomhedsoplysninger')+'</small><em>'+escapeHtml(String(source.description||'').slice(0,220))+'</em></span><span class="job-company-evidence-arrow">↗</span></a>').join('')+'</div>':'<p class="job-company-evidence-empty">Ingen relevante profiler blev fundet i de offentlige søgeresultater.</p>';
  out+='</div>';
 }
 out+='<p class="job-company-insight-note">Jobindex- og arbejdspladsevalueringer vises med kilde. Medarbejderantal og adresse kan suppleres fra danske virksomhedsdata. Afstand er omtrentlige kilometer i luftlinje fra Frederiksberg bymidte — ikke fra en præcis hjemmeadresse. Geokodning: OpenStreetMap.</p></section>';
 return out;
}
function renderJobOpportunities(){
 const activeProfile=searchProfile();
 const results=(state.jobOpportunities||[]).filter(item=>isDanishMappedJob(item,activeProfile));
 if(el('jobOpportunitiesResults'))el('jobOpportunitiesResults').innerHTML=results.length?results.map((item,index)=>{
  const url=safeHttpUrl(item.url),matched=item.matchedTerms||[],tracked=url&&state.followUps.some(f=>f.url&&canonicalSearchUrl(f.url)===canonicalSearchUrl(url)),source=item.queryLabel||item.sourceLabel||item.domain||'Jobportal';
  const scope=getDanishJobScope(item,activeProfile);
  let html='<article class="discovery-card"><div class="discovery-card-top"><span class="discovery-source">'+escapeHtml(item.domain||source)+'</span><span class="chip">'+(matched.length?matched.length+' profilord':'Læs og kontrollér')+'</span><span class="chip job-location-match job-location-match-'+escapeHtml(scope.kind)+'">'+escapeHtml(scope.label)+'</span></div><h3>'+escapeHtml(item.title||'Jobopslag')+'</h3><p class="lead-company">'+escapeHtml(item.domain||'')+' · søgt via '+escapeHtml(source)+'</p>';
  html+=item.description?'<p class="lead-snippet">'+escapeHtml(item.description)+'</p>':'<p class="lead-snippet">Ingen tekstuddrag. Åbn originalopslaget for at læse krav og opgaver.</p>';
  html+='<div class="discovery-matched">'+(matched.length?matched.map(term=>'<span class="chip">'+escapeHtml(term)+'</span>').join(''):'<span class="chip">Ingen profilord fundet i uddraget</span>')+'</div>';
  html+=companyInsightBox(item,index);
  html+='<p class="lead-reason">Kontrollér stillingsstatus, deadline, arbejdssted og om Danmark er tilladt for remote-roller, før du søger.</p><div class="discovery-actions">';
  if(url)html+='<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">Åbn originalopslag ↗</a>';
  html+='<button class="secondary" data-discovery-action="follow" data-collection="jobs" data-index="'+index+'">'+(tracked?'Opfølgning oprettet':'Følg op')+'</button><button data-discovery-action="analyze" data-index="'+index+'">Vurdér mod mit CV</button></div></article>';return html;
 }).join(''):'<div class="empty">Ingen kvalificerede danske eller Danmark-egnede remote-opslag endnu. Kontrollér geografien og prøv igen. Udenlandske opslag uden klar adgang til arbejde fra Danmark vises ikke.</div>';
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
 if(el('jobSearchProgressStatus'))el('jobSearchProgressStatus').textContent='Resultaterne er samlet. Luk denne oversigt for at se stillingerne.';
 if(el('jobSearchProgressClose'))el('jobSearchProgressClose').hidden=false;
 if(el('jobSearchProgressFooter'))el('jobSearchProgressFooter').textContent='Åbn originalopslaget for at kontrollere, at stillingen stadig er aktiv, og at arbejdsstedet passer.';
 if(modal)modal.dataset.complete='true';
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
    updateJobSearchPortal(query.id,count?'done':'empty',count+' opslag');
    return {status:'fulfilled',value};
   }catch(error){
    updateJobSearchPortal(query.id,'error',String(error&&error.message||error).slice(0,100));
    return {status:'rejected',reason:error};
   }
  }));
  let succeeded=0,failed=0;const all=[],errors=[];
  settled.forEach((result,index)=>{if(result.status==='fulfilled'){succeeded++;all.push(...result.value.results)}else{failed++;errors.push(queries[index].label+': '+String(result.reason&&result.reason.message||result.reason).slice(0,120))}});
  const unique=new Map();all.forEach(item=>{const key=canonicalSearchUrl(item.url),old=unique.get(key);if(!old||item.matchedTerms.length>old.matchedTerms.length)unique.set(key,item)});
  state.jobOpportunities=[...unique.values()].filter(item=>isDanishMappedJob(item,profile)).sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length).slice(0,50);
  state.jobLastSearch=new Date().toISOString();persist();renderJobOpportunities();
  if(el('jobSearchStatus')){
   const remoteCheck=state.jobOpportunities.filter(item=>item.matchScope==='remote-check').length;
   let message=state.jobOpportunities.length?'Søgningen er færdig: '+state.jobOpportunities.length+' konkrete stillingsopslag fra '+succeeded+' af '+queries.length+' kildeområder. '+remoteCheck+' remote-opslag kræver kontrol af, om Danmark er tilladt.':'Ingen konkrete stillingsopslag matchede alle kriterier denne gang. Generelle jobportalsider og udenlandske opslag uden relevant dansk/remote-match er filtreret fra. Prøv færre eller bredere søgeord.';
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
  if(button.dataset.discoveryAction==='company-info')lookupCompanyInsights(index);
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