/* Get a Job Hobo — public networking discovery and follow-up workspace.
   Uses the existing public web-index endpoint. Does not log into LinkedIn or auto-send messages. */
(function(){
'use strict';
const PROFILE_KEYWORDS=['CRM','marketing automation','digital marketing','kampagnestyring','content marketing','dataanalyse','AI','e-mail marketing','SEO','paid media','performance marketing','kunderejser','loyalitet','strategi','copywriting','marketing analytics','GA4','brand marketing'];
function uniqueTerms(items){const seen=new Set();return items.filter(item=>{const key=normalizeSearchText(item);if(!key||seen.has(key))return false;seen.add(key);return true})}
function profileTermsFromCV(){
 const text=String(state.cv||'');
 const found=PROFILE_KEYWORDS.filter(term=>normalizeSearchText(text).includes(normalizeSearchText(term)));
 return (found.length>=3?found.slice(0,10):['CRM','marketing automation','digital marketing','kampagner','content','dataanalyse','AI']);
}
function saveNetworkSearchPreferences(){
 state.networkSearchTerms=String(el('networkSearchTerms')?.value||'').trim().slice(0,600);
 state.networkSearchLocation=(String(el('networkSearchLocation')?.value||'').trim()||'København og omegn').slice(0,300);
 if(el('jobSearchTerms')&&el('jobSearchTerms')!==document.activeElement)el('jobSearchTerms').value=state.networkSearchTerms;
 if(el('jobSearchLocation')&&el('jobSearchLocation')!==document.activeElement)el('jobSearchLocation').value=state.networkSearchLocation;
 persist();
}
function syncJobSearchPreferences(){
 state.networkSearchTerms=String(el('jobSearchTerms')?.value||'').trim().slice(0,600);
 state.networkSearchLocation=(String(el('jobSearchLocation')?.value||'').trim()||'København og omegn').slice(0,300);
 if(el('networkSearchTerms'))el('networkSearchTerms').value=state.networkSearchTerms;
 if(el('networkSearchLocation'))el('networkSearchLocation').value=state.networkSearchLocation;
 persist();
}
function syncNetworkSearchPreferencesFromCV(){
 if(state.cv.trim()&&!state.networkLastSearch&&(!state.networkSearchTerms||state.networkSearchTerms===blank.networkSearchTerms))state.networkSearchTerms=profileTermsFromCV().join(', ');
 state.networkSearchTerms=String(state.networkSearchTerms||'').trim()||profileTermsFromCV().join(', ');
 if(el('networkSearchTerms'))el('networkSearchTerms').value=state.networkSearchTerms;
 if(el('networkSearchLocation'))el('networkSearchLocation').value=state.networkSearchLocation||'København og omegn';
}
function parseTerms(raw){return uniqueTerms(String(raw||'').split(/[,;|\n]/).map(term=>term.trim()).filter(term=>term.length>1)).slice(0,12)}
function searchProfile(){
 const raw=String(el('networkSearchTerms')?.value||el('jobSearchTerms')?.value||state.networkSearchTerms||'');
 const terms=parseTerms(raw);
 const loc=String(el('networkSearchLocation')?.value||el('jobSearchLocation')?.value||state.networkSearchLocation||'København og omegn').trim();
 return {terms:terms.length?terms:profileTermsFromCV(),location:loc.slice(0,300)||'København og omegn'};
}
function syncOpportunityInputs(){
 if(el('jobSearchTerms'))el('jobSearchTerms').value=state.networkSearchTerms||profileTermsFromCV().join(', ');
 if(el('jobSearchLocation'))el('jobSearchLocation').value=state.networkSearchLocation||'København og omegn';
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
function jobQueries(profile){
 const terms=profile.terms.slice(0,7).join(' '),loc=searchPhrase(profile.location||'København Danmark');
 return [
  {id:'linkedin-jobs',label:'LinkedIn Jobs',targetSite:'linkedin.com',query:'site:linkedin.com/jobs/view '+terms+' '+loc+' Denmark',fallbackQuery:'LinkedIn Jobs '+terms+' '+loc+' Denmark'},
  {id:'jobindex',label:'Jobindex',targetSite:'jobindex.dk',query:'site:jobindex.dk/jobannonce '+terms+' '+loc,fallbackQuery:'site:jobindex.dk '+terms+' '+loc+' job'},
  {id:'hk-jobportal',label:'HK Jobportal',targetSite:'hk.dk',query:'site:hk.dk jobportal '+terms+' '+loc,fallbackQuery:'HK Jobportal '+terms+' '+loc},
  {id:'jobnet',label:'Jobnet',targetSite:'job.jobnet.dk',query:'site:job.jobnet.dk '+terms+' '+loc,fallbackQuery:'site:jobnet.dk '+terms+' '+loc+' job'},
  {id:'workindenmark',label:'Workindenmark',targetSite:'workindenmark.dk',query:'site:workindenmark.dk '+terms+' '+loc,fallbackQuery:'Workindenmark '+terms+' jobs Denmark'},
  {id:'stepstone',label:'StepStone',targetSite:'stepstone.dk',query:'site:stepstone.dk '+terms+' '+loc,fallbackQuery:'StepStone Denmark '+terms+' '+loc},
  {id:'career-sites',label:'Virksomhedernes karrieresider',targetSite:'',query:'careers jobs '+terms+' '+loc+' Denmark marketing CRM content'}
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
  employeeRating:pick(raw.employeeSatisfaction,raw.employee_satisfaction,raw.companyRating,raw.company_rating,raw.ratingFromEmployees),
  ratingCount:pick(raw.reviewCount,raw.review_count,raw.ratingCount,raw.rating_count),
  industry:pick(raw.industry,raw.sector),
  foundedYear:pick(raw.foundedYear,raw.founded_year,raw.founded),
  companyType:pick(raw.companyType,raw.company_type,raw.organizationType,raw.organization_type)
 };
 return {id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),type:classifyResult(url,title,query.id),title,url,domain:registrableDomain(parsed.hostname),description,sourceLabel:usedFallback?host:(query.targetSite&&domainMatches(host,query.targetSite)?query.label:host),queryLabel:query.label+(usedFallback?' (bredere søgning)':''),matchedTerms:matchedTerms(title,description,terms),companyFacts,createdAt:new Date().toISOString(),saved:false};
}
async function queryIndex(query,terms){
 async function request(q){
  const endpoint=LIVE_SEARCH_API+'?'+new URLSearchParams({q,page:'1',exact:'0'}).toString();
  const data=await fetchJsonTimeout(endpoint,15000);
  if(!data||typeof data!=='object')throw new Error('Uventet svar fra webindekset.');
  if(data.error&&!Array.isArray(data.results))throw new Error(String(data.error));
  return Array.isArray(data.results)?data.results:(Array.isArray(data.items)?data.items:[]);
 }
 let rows=[],primaryError='';
 try{rows=await request(query.query)}catch(error){primaryError=String(error&&error.message||error)}
 let mapped=rows.map(row=>mapResult(row,query,terms,false)).filter(Boolean).filter(item=>!query.targetSite||domainMatches(new URL(item.url).hostname,query.targetSite));
 let fallback=false;
 if(!mapped.length&&query.fallbackQuery){
  try{fallback=true;rows=await request(query.fallbackQuery);mapped=rows.map(row=>mapResult(row,query,terms,true)).filter(Boolean)}
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
  const results=await Promise.allSettled(queries.map(query=>queryIndex(query,profile.terms)));
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
 const content=normalizeInsightText([result.title,result.description,result.url].join(' '));
 const target=normalizeInsightText(company);
 const tokens=target.split(/\s+/).filter(x=>x.length>=3);
 const matches=tokens.filter(t=>content.split(/\s+/).includes(t)).length;
 const domain=normalizeInsightText(item.domain||'');
 const hostMatches=domain.split(/\s+/).filter(x=>x.length>=3).some(t=>content.split(/\s+/).includes(t));
 return !!(target&&content.includes(target)||hostMatches||(tokens.length===1&&matches===1)||(tokens.length>1&&matches>=Math.min(2,tokens.length)));
}
function applyCompanySourceFacts(sources,prior){
 const f={...(prior||{})};
 const factSources={...(f.factSources||{})};
 const bodyOf=s=>String((s.title||'')+' '+(s.description||'')).replace(/\s+/g,' ');
 for(const source of sources){
  const text=bodyOf(source);
  const domain=String(source.domain||'').toLowerCase().replace(/^www\./,'');
  const workplace=domain==='jobindex.dk'||domain.endsWith('.jobindex.dk')||domain==='jobrate.dk'||domain.endsWith('.jobrate.dk');
  let m;
  if(!f.employeeCount&&(m=text.match(/(?:antal ansatte|antal medarbejdere|employees|employee count)\s*[:\-]?\s*(\d{1,3}(?:[.,\s]\d{3})*|\d{1,4}\s*[-–]\s*\d{1,4})/i))){f.employeeCount=m[1].trim();factSources.employeeCount=source}
  if(!f.employeeCount&&(m=text.match(/\b(\d{1,4}\s*[-–]\s*\d{1,4})\s*(?:employees|medarbejdere)\b/i))){f.employeeCount=m[1].trim();factSources.employeeCount=source}
  if(!f.foundedYear&&(m=text.match(/(?:stiftet|etableret|grundlagt|founded)\D{0,32}\b(19\d{2}|20\d{2})\b/i))){f.foundedYear=m[1];factSources.foundedYear=source}
  if(!f.location&&(m=text.match(/(?:hovedkontor|headquarters|lokation|adresse|address|beliggenhed)\s*[:\-]?\s*([^.;\n]{3,65})/i))){f.location=m[1].trim();factSources.location=source}
  if(!f.industry&&(m=text.match(/(?:branche|industry|sector)\s*[:\-]?\s*([^.;\n]{3,65})/i))){f.industry=m[1].trim();factSources.industry=source}
  if(workplace&&!f.employeeRating&&(m=text.match(/\b([1-5][,.]\d)\s*(?:\/\s*5|ud af 5|out of 5|stjerner af 5)\b/i))){f.employeeRating=m[1].replace(',','.');factSources.employeeRating=source}
  if(workplace&&!f.ratingCount&&(m=text.match(/\b(\d{1,6})\s+(?:anmeldelser|vurderinger|evalueringer|reviews|ratings)\b/i))){f.ratingCount=m[1];factSources.ratingCount=source}
 }
 f.factSources=factSources;return f;
}
async function lookupCompanyInsights(index){
 const item=(state.jobOpportunities||[])[index];if(!item)return;
 const company=companyNameFromOpportunity(item);
 if(!company||company==='Virksomheden')return;
 item.companyFacts=item.companyFacts||{};
 if(item.companyFacts.lookupStatus==='loading')return;
 item.companyFacts.lookupStatus='loading';persist();renderJobOpportunities();
 const q='"'+company.replace(/"/g,' ')+'"';
 const queries=[
  {id:'jobindex',label:'Jobindex · virksomhedsprofil og jobglæde',targetSite:'jobindex.dk',query:'site:jobindex.dk/virksomhed '+q+' medarbejdervurdering jobglæde løn',fallbackQuery:'site:jobindex.dk '+q+' virksomhed medarbejdere jobglæde løn'},
  {id:'jobrate',label:'Jobrate · arbejdspladsdata',targetSite:'jobrate.dk',query:'site:jobrate.dk/arbejdsplads '+q+' medarbejdere vurdering',fallbackQuery:'site:jobrate.dk '+q+' arbejdsplads'},
  {id:'register',label:'Offentlige virksomhedsregistre',targetSite:'ownr.dk',query:'site:ownr.dk/companies/public-profile '+q+' antal ansatte adresse stiftet branche',fallbackQuery:'site:estatistik.dk/virksomhed '+q+' antal ansatte adresse branche etableret'}
 ];
 try{
  const outcomes=await Promise.allSettled(queries.map(query=>queryIndex(query,[])));
  const gathered=[];
  outcomes.forEach((outcome,i)=>{
   if(outcome.status!=='fulfilled')return;
   (outcome.value.results||[]).forEach(result=>{
    if(!result||!safeHttpUrl(result.url)||!companyResultRelevant(result,company,item))return;
    if(!gathered.some(old=>canonicalSearchUrl(old.url)===canonicalSearchUrl(result.url)))gathered.push({...result,sourceType:queries[i].id,sourceLabel:queries[i].label});
   });
  });
  item.companyFacts=applyCompanySourceFacts(gathered,item.companyFacts);
  item.companyFacts.sources=gathered.slice(0,8);
  item.companyFacts.lookupStatus='done';item.companyFacts.lookupAt=new Date().toISOString();
  persist();renderJobOpportunities();
  const status=el('jobSearchStatus');
  if(status){status.className='notice '+(gathered.length?'goodbox':'warnbox');status.textContent=gathered.length?'Virksomhedsoplysninger søgt for '+company+'. '+gathered.length+' relevante offentlige kilder vises i infoboksen. Kontrollér kildens dato og indhold.':'Ingen relevante offentlige virksomhedsprofiler blev fundet for '+company+'. Der udfyldes ikke gættede værdier.'}
 }catch(error){
  item.companyFacts.lookupStatus='error';item.companyFacts.lookupError=String(error&&error.message||error).slice(0,220);
  persist();renderJobOpportunities();
  const status=el('jobSearchStatus');if(status){status.className='notice warnbox';status.textContent='Søgningen efter virksomhedsdata fejlede for '+company+': '+item.companyFacts.lookupError}
 }
}
function companyInsightBox(item,index){
 const f=item.companyFacts||{},clean=value=>String(value==null?'':value).trim(),company=companyNameFromOpportunity(item);
 const rating=clean(f.employeeRating),n=Number(rating.replace(',','.'));
 const ratingDisplay=rating&&Number.isFinite(n)&&n>=0&&n<=5?n.toLocaleString('da-DK',{maximumFractionDigits:1})+'/5':rating||'Ikke fundet';
 const employees=clean(f.employeeCount)||'Ikke oplyst',location=clean(f.location)||'Ikke fundet';
 const distance=clean(f.distanceKm),distanceLine=distance?distance+' km fra din adresse':(location!=='Ikke fundet'?'Afstand ikke beregnet':'Afstand kræver lokation');
 const industry=clean(f.industry)||((item.matchedTerms||[]).slice(0,2).join(' · ')||'Ikke fastslået'),founded=clean(f.foundedYear)||'Ikke oplyst',type=clean(f.companyType)||'Ikke oplyst';
 const tone=['mint','orange','purple','blue'][index%4],sources=Array.isArray(f.sources)?f.sources:[],loading=f.lookupStatus==='loading',completed=f.lookupStatus==='done';
 const svg={
  people:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.2a4 4 0 0 1 0 7.6M18 14.2a4 4 0 0 1 4 4V20"/></svg>',
  pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  smile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.3 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
  building:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M9 21v-5h6v5"/></svg>'
 };
 let out='<section class="job-company-insights job-company-insights-'+tone+'" aria-label="Virksomhedsinfo">';
 out+='<div class="job-company-insights-head"><span class="job-company-insights-icon">'+svg.building+'</span><div><strong>'+escapeHtml(company)+'</strong><small>Virksomhedsinfo fra offentlige kilder</small></div><button type="button" class="job-company-lookup-button" data-discovery-action="company-info" data-collection="jobs" data-index="'+index+'" '+(loading?'disabled':'')+'>'+(loading?'Søger…':completed?'Opdatér data':'Find data')+' ↗</button></div>';
 out+='<div class="job-company-insight-stats"><div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.people+'</span><div><small>Medarbejdere</small><strong>'+escapeHtml(employees)+'</strong></div></div><div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.pin+'</span><div><small>Placering</small><strong>'+escapeHtml(location)+'</strong><span class="job-insight-sub">'+escapeHtml(distanceLine)+'</span></div></div><div class="job-company-insight-stat"><span class="job-insight-icon">'+svg.smile+'</span><div><small>Jobtilfredshed</small><strong>'+escapeHtml(ratingDisplay)+'</strong><span class="job-insight-sub">'+escapeHtml(clean(f.ratingCount)?clean(f.ratingCount)+' anmeldelser':'Ingen bekræftet medarbejderrating')+'</span></div></div></div>';
 out+='<div class="job-company-insights-foot"><span><b>Branche</b> '+escapeHtml(industry)+'</span><span><b>Etableret</b> '+escapeHtml(founded)+'</span><span><b>Type</b> '+escapeHtml(type)+'</span></div>';
 if(loading)out+='<div class="job-company-lookup-status" aria-live="polite"><span class="job-company-lookup-spinner"></span>Søger efter Jobindex-profiler, arbejdspladsvurderinger og offentlige virksomhedsdata…</div>';
 if(completed){
  out+='<div class="job-company-evidence"><div class="job-company-evidence-heading"><strong>Fundne kilder</strong><span>'+sources.length+' resultater</span></div>';
  out+=sources.length?'<div class="job-company-evidence-list">'+sources.slice(0,4).map(source=>'<a class="job-company-evidence-item" href="'+escapeHtml(safeHttpUrl(source.url))+'" target="_blank" rel="noopener noreferrer"><span class="job-company-evidence-copy"><strong>'+escapeHtml(source.domain||source.sourceLabel||'Offentlig kilde')+'</strong><small>'+escapeHtml(source.title||'Virksomhedsoplysninger')+'</small><em>'+escapeHtml(String(source.description||'').slice(0,220))+'</em></span><span class="job-company-evidence-arrow">↗</span></a>').join('')+'</div>':'<p class="job-company-evidence-empty">Ingen relevante profiler blev fundet i de offentlige søgeresultater.</p>';
  out+='</div>';
 }
 out+='<p class="job-company-insight-note">Medarbejderrating hentes kun fra arbejdsplads-/medarbejdervurderinger — ikke almindelige kundevurderinger. Afstand kræver en valgt adresse og beregning.</p></section>';
 return out;
}
function renderJobOpportunities(){
 const results=state.jobOpportunities||[];
 if(el('jobOpportunitiesResults'))el('jobOpportunitiesResults').innerHTML=results.length?results.map((item,index)=>{
  const url=safeHttpUrl(item.url),matched=item.matchedTerms||[],tracked=url&&state.followUps.some(f=>f.url&&canonicalSearchUrl(f.url)===canonicalSearchUrl(url)),source=item.queryLabel||item.sourceLabel||item.domain||'Jobportal';
  let html='<article class="discovery-card"><div class="discovery-card-top"><span class="discovery-source">'+escapeHtml(item.domain||source)+'</span><span class="chip">'+(matched.length?matched.length+' profilord':'Læs og kontrollér')+'</span></div><h3>'+escapeHtml(item.title||'Jobopslag')+'</h3><p class="lead-company">'+escapeHtml(item.domain||'')+' · søgt via '+escapeHtml(source)+'</p>';
  html+=item.description?'<p class="lead-snippet">'+escapeHtml(item.description)+'</p>':'<p class="lead-snippet">Ingen tekstuddrag. Åbn originalopslaget for at læse krav og opgaver.</p>';
  html+='<div class="discovery-matched">'+(matched.length?matched.map(term=>'<span class="chip">'+escapeHtml(term)+'</span>').join(''):'<span class="chip">Ingen profilord fundet i uddraget</span>')+'</div>';
  html+=companyInsightBox(item,index);
  html+='<p class="lead-reason">Kontrollér stillingsstatus, deadline, must-have-krav og arbejdsgiver på originalopslaget, før du søger.</p><div class="discovery-actions">';
  if(url)html+='<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">Åbn originalopslag ↗</a>';
  html+='<button class="secondary" data-discovery-action="follow" data-collection="jobs" data-index="'+index+'">'+(tracked?'Opfølgning oprettet':'Følg op')+'</button><button data-discovery-action="analyze" data-index="'+index+'">Vurdér mod mit CV</button></div></article>';return html;
 }).join(''):'<div class="empty">Ingen søgeresultater endnu. Klik på “Søg efter relevante job”. Ikke alle portaler indekseres offentligt.</div>';
 if(el('jobOpportunityCount'))el('jobOpportunityCount').textContent=results.length;
 if(el('jobKeywordCount'))el('jobKeywordCount').textContent=searchProfile().terms.length;
 if(el('jobTrackedCount'))el('jobTrackedCount').textContent=(state.followUps||[]).filter(item=>item.type==='job').length;
 if(el('jobLastSearchLabel'))el('jobLastSearchLabel').textContent=state.jobLastSearch?new Date(state.jobLastSearch).toLocaleDateString('da-DK'):'Ikke søgt';
 if(el('jobOpportunitiesMeta'))el('jobOpportunitiesMeta').textContent=results.length+' forslag';
}
async function searchJobOpportunities(){
 syncJobSearchPreferences();const profile=searchProfile();
 toggleBusy('jobOpportunitiesSearchButton',true,'Søger på tværs af jobportaler…');
 if(el('jobSearchStatus')){el('jobSearchStatus').className='notice goodbox';el('jobSearchStatus').textContent='Søger efter '+profile.terms.join(', ')+' i det offentlige webindeks. Dit fulde CV sendes ikke.'}
 try{
  const queries=jobQueries(profile),settled=await Promise.allSettled(queries.map(query=>queryIndex(query,profile.terms)));
  let succeeded=0,failed=0;const all=[],errors=[];
  settled.forEach((result,index)=>{if(result.status==='fulfilled'){succeeded++;all.push(...result.value.results)}else{failed++;errors.push(queries[index].label+': '+String(result.reason&&result.reason.message||result.reason).slice(0,120))}});
  const unique=new Map();all.forEach(item=>{const key=canonicalSearchUrl(item.url),old=unique.get(key);if(!old||item.matchedTerms.length>old.matchedTerms.length)unique.set(key,item)});
  state.jobOpportunities=[...unique.values()].sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length).slice(0,50);
  state.jobLastSearch=new Date().toISOString();persist();renderJobOpportunities();
  if(el('jobSearchStatus')){el('jobSearchStatus').className='notice '+(succeeded?'goodbox':'warnbox');el('jobSearchStatus').textContent=(succeeded?'Søgningen er afsluttet. ':'Søgningen mislykkedes. ')+state.jobOpportunities.length+' unikke resultater fra '+succeeded+'/'+queries.length+' kildeområder; '+failed+' fejlede. Kontrollér aktiv status og deadline på originalopslaget.'+(errors.length?' Fejl: '+errors.join(' | '):'')}
 }catch(error){if(el('jobSearchStatus')){el('jobSearchStatus').className='notice warnbox';el('jobSearchStatus').textContent='Job-søgningen fejlede: '+String(error&&error.message||error)}}
 finally{toggleBusy('jobOpportunitiesSearchButton',false)}
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
 syncNetworkSearchPreferencesFromCV();syncOpportunityInputs();renderDiscoveryResults();renderJobOpportunities();renderFollowUps();bindDiscoveryEvents();
}
window.saveNetworkSearchPreferences=saveNetworkSearchPreferences;
window.syncJobSearchPreferences=syncJobSearchPreferences;
window.searchNetworkProspects=searchNetworkProspects;
window.searchNetworkCommunities=searchNetworkCommunities;
window.searchJobOpportunities=searchJobOpportunities;
window.addFollowUpFromResult=addFollowUpFromResult;
window.copyNetworkOutreach=copyNetworkOutreach;
window.loadJobOpportunityInAnalyzer=loadJobOpportunityInAnalyzer;
window.exportFollowUps=exportFollowUps;
window.renderDiscoveryResults=renderDiscoveryResults;
window.renderJobOpportunities=renderJobOpportunities;
window.lookupCompanyInsights=lookupCompanyInsights;
window.renderFollowUps=renderFollowUps;
window.syncOpportunityInputs=syncOpportunityInputs;
window.fillSearchPreferences=initializeDiscovery;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeDiscovery,{once:true});else initializeDiscovery();
})();