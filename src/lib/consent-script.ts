// Cookie consent by region (2026-11-26). Inlined in <head> by the root layout, BEFORE GA4 and the
// Meta Pixel, so Google Consent Mode v2 defaults are always set first. ES5 on purpose (it runs
// unbundled). Region comes from the browser's time zone (plus browser language for Quebec): the
// site runs on Railway with no geo-IP header, and we don't send visitors' IPs to a lookup service.
//
//   us       (US time zones)            no banner; analytics + ads granted. Global Privacy Control
//                                       or "Your privacy choices" opt-out => ad_* denied, no Meta.
//   ca       (Canada outside Ont./Que.) no banner; everything granted (implied consent, PIPEDA)
//                                       with a small dismissible notice on the first visit.
//   ca-east  (America/Toronto: Ontario  analytics granted, ads denied until the visitor dismisses
//            or Quebec, can't tell)     the notice or views a second page (continued browsing).
//   qc       (Quebec signals: Montreal /  opt-in banner, everything denied until Accept (Law 25).
//            Blanc-Sablon zone, or an
//            eastern-Canada zone + French)
//   optin    (EU/EEA, UK, CH, UAE, the  opt-in banner, everything denied until Accept (unchanged).
//            /uk /de /fr /it /ae pages,
//            anywhere else or unknown)
//
// An explicit choice in the banner (localStorage alphaa.consent = granted | denied) wins
// everywhere, except that GPC / the ad opt-out always keep ads off. The choice is mirrored to the
// alphaa_consent cookie so the server can read it. Exposes window.__cc for ConsentBanner, and keeps
// window.__ccEu for the nurture-email consent rule (lib/nurture-consent.ts).
export const CONSENT_JS = `(function(){
var ls=function(k){try{return localStorage.getItem(k)}catch(e){return null}};
var put=function(k,v){try{localStorage.setItem(k,v)}catch(e){}};
var c=ls('alphaa.consent');
var optout=ls('alphaa.adOptOut')==='1';
var seen=ls('alphaa.notice')==='1';
var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
var langs='';try{langs=((navigator.languages&&navigator.languages.join(','))||navigator.language||'').toLowerCase()}catch(e){}
var fr=/(^|,)fr/.test(langs);
var seg=location.pathname.split('/')[1]||'';
var market=['uk','de','fr','it','ae'].indexOf(seg)>-1;
var US=['America/New_York','America/Detroit','America/Chicago','America/Menominee','America/Denver','America/Boise','America/Phoenix','America/Los_Angeles','America/Anchorage','America/Juneau','America/Sitka','America/Metlakatla','America/Yakutat','America/Nome','America/Adak','Pacific/Honolulu','America/Puerto_Rico','US/Eastern','US/Central','US/Mountain','US/Pacific','US/Alaska','US/Hawaii','US/Arizona'];
var CA=['America/Toronto','America/Montreal','America/Nipigon','America/Thunder_Bay','America/Iqaluit','America/Pangnirtung','America/Atikokan','America/Winnipeg','America/Rainy_River','America/Rankin_Inlet','America/Resolute','America/Regina','America/Swift_Current','America/Edmonton','America/Cambridge_Bay','America/Yellowknife','America/Inuvik','America/Dawson_Creek','America/Fort_Nelson','America/Creston','America/Vancouver','America/Whitehorse','America/Dawson','America/Halifax','America/Glace_Bay','America/Moncton','America/Goose_Bay','America/St_Johns','America/Blanc-Sablon','Canada/Eastern','Canada/Central','Canada/Mountain','Canada/Pacific','Canada/Atlantic','Canada/Newfoundland','Canada/Saskatchewan'];
var eu=tz.indexOf('Europe/')===0||['Atlantic/Canary','Atlantic/Madeira','Atlantic/Azores','Atlantic/Reykjavik','Atlantic/Faroe','Arctic/Longyearbyen','Asia/Nicosia','Asia/Famagusta','Asia/Dubai'].indexOf(tz)>-1||market;
var region='optin';
if(market||eu){region='optin'}
else if(US.indexOf(tz)>-1||/^America\\/(Indiana|Kentucky|North_Dakota)\\//.test(tz)){region='us'}
else if(tz==='America/Montreal'||tz==='America/Blanc-Sablon'||(fr&&['America/Toronto','Canada/Eastern','America/Halifax','America/Moncton','Canada/Atlantic'].indexOf(tz)>-1)){region='qc'}
else if(tz==='America/Toronto'||tz==='Canada/Eastern'){region='ca-east'}
else if(CA.indexOf(tz)>-1){region='ca'}
var gpc=false;try{gpc=navigator.globalPrivacyControl===true}catch(e){}
if(region==='ca-east'&&!c&&!seen){if(ls('alphaa.visited')==='1'){seen=true;put('alphaa.notice','1')}else{put('alphaa.visited','1')}}
var a,ad;
if(c==='granted'){a=true;ad=true}
else if(c==='denied'){a=false;ad=false}
else if(region==='us'||region==='ca'){a=true;ad=true}
else if(region==='ca-east'){a=true;ad=seen}
else{a=false;ad=false}
if(gpc||optout)ad=false;
var need=(region==='optin'||region==='qc')&&!c;
var notice=(region==='ca'||region==='ca-east')&&!c&&!seen;
window.__cc={region:region,a:a,ad:ad,gpc:gpc,optout:optout,need:need,notice:notice};
window.__ccEu=eu;
window.dataLayer=window.dataLayer||[];
function g(){dataLayer.push(arguments)}
var A=a?'granted':'denied',D=ad?'granted':'denied';
g('consent','default',{analytics_storage:A,ad_storage:D,ad_user_data:D,ad_personalization:D,functionality_storage:'granted',security_storage:'granted'});
g('set','ads_data_redaction',!ad);
})();`
