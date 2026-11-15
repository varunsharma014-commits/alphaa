// Page language by route, for <html lang dir>. Keep in sync with PATH_LANG_JS.
export function pathLang(path: string): { lang: string; dir: "ltr" | "rtl" } {
  if (path === "/ae/ar" || path.startsWith("/ae/ar/")) return { lang: "ar", dir: "rtl" }
  const seg = path.split("/")[1] || ""
  if (seg === "de" || seg === "fr" || seg === "it") return { lang: seg, dir: "ltr" }
  if (seg === "uk") return { lang: "en-GB", dir: "ltr" }
  return { lang: "en", dir: "ltr" }
}

/** The same rule as an inline script, run in <head> before first paint. */
export const PATH_LANG_JS =
  "(function(){try{var p=location.pathname,s=p.split('/')[1]||'',l='en',d='ltr';if(p==='/ae/ar'||p.indexOf('/ae/ar/')===0){l='ar';d='rtl'}else if(s==='de'||s==='fr'||s==='it'){l=s}else if(s==='uk'){l='en-GB'}var h=document.documentElement;h.lang=l;h.dir=d}catch(e){}})();"
