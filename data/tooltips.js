/* Metrik ve sütun başlığı açıklamaları: başlık · tanım · hesaplama formülü */
(function(){
const V=['Visibility','Şirketin LLM yanıtlarında adıyla geçtiği yanıt oranı.','= Şirketin geçtiği yanıt sayısı / Toplam yanıt sayısı × 100'];
const D={
  rank:{
    '#':['Sıra','Şirketlerin visibility değerine göre sıralaması; eşitlikte ortalama sırası daha iyi olan şirket üstte yer alır.',''],
    'ŞİRKET':['Şirket','Yanıtlarda tespit edilen elektrik üretim şirketi. En az 2 yanıtta geçen şirketler listelenir; türbin ve panel üreticileri sıralama dışıdır.',''],
    'VISIBILITY':V,'%':V,
    'SOV':['Share of Voice','Yanıtlarda geçen tüm şirket mention\'ları içinde şirketin aldığı pay.','= Şirketin mention sayısı / Tüm şirketlerin toplam mention sayısı × 100'],
    'POS':['Avg Position','Şirket yanıtta geçtiğinde, yanıttaki şirketler arasındaki ortalama sırası. ChatGPT ve Gemini yanıtları üzerinden hesaplanır.','= Şirketin yanıttaki sıralarının toplamı / Şirketin geçtiği yanıt sayısı'],
    '1.':['1. sıra','Şirketin, yanıttaki şirket listesinin ilk sırasında yer aldığı yanıt sayısı (üç model birlikte).','= Şirketin ilk sırada geçtiği yanıt sayısı'],
    'GPT %':['ChatGPT visibility','Şirketin ChatGPT yanıtlarında geçme oranı.','= ChatGPT\'de şirketin geçtiği yanıt sayısı / ChatGPT toplam yanıt sayısı (25) × 100'],
    'GEM %':['Gemini visibility','Şirketin Gemini yanıtlarında geçme oranı.','= Gemini\'de şirketin geçtiği yanıt sayısı / Gemini toplam yanıt sayısı (32) × 100'],
    'AIO %':['AI Overview visibility','Şirketin Google AI Overview yanıtlarında geçme oranı.','= AI Overview\'da şirketin geçtiği yanıt sayısı / AI Overview toplam yanıt sayısı (31) × 100']
  },
  prompt:{
    'SORU':['Soru','Takip edilen marka-nötr soru. Sorularda şirket adı geçmez.',''],
    'CEVAP':['Yanıt','Sorunun üç modelde aldığı tamamlanmış yanıt sayısı (2 - 21 Eylül 2026).','= ChatGPT + Gemini + AI Overview yanıt sayısı'],
    'ENERJİSA ADI':['Enerjisa adı','"Enerjisa" adının (Enerjisa Üretim veya Enerjisa Enerji) geçtiği yanıt sayısı.','= Enerjisa adının geçtiği yanıt sayısı / Sorunun toplam yanıt sayısı'],
    'ÜRETİM ADIYLA':['Enerjisa Üretim adıyla','Enerjisa Üretim adının açıkça geçtiği yanıt sayısı; yalnızca Enerjisa Enerji\'nin geçtiği yanıtlar dahil değildir.','= Enerjisa Üretim adının geçtiği yanıt sayısı / Sorunun toplam yanıt sayısı'],
    'SIRA':['Avg Position','Enerjisa Üretim\'in bu sorunun ChatGPT ve Gemini yanıtlarındaki ortalama sırası.','= Enerjisa Üretim\'in yanıttaki sıralarının toplamı / Geçtiği yanıt sayısı'],
    'ÖNE ÇIKAN ŞİRKETLER':['Öne çıkan şirketler','Bu sorunun yanıtlarında en sık geçen şirketler; yüzde, şirketin bu sorudaki visibility değeridir.','= Şirketin geçtiği yanıt sayısı / Sorunun toplam yanıt sayısı × 100'],
    'ÖNE ÇIKAN KAYNAKLAR':['Öne çıkan kaynaklar','Bu sorunun yanıtlarında en çok kaynak (citation) gösterilen domain\'ler; sayı, domain\'in aldığı citation adedidir.','= Domain\'e verilen citation sayısı']
  },
  hm:{
    'ŞİRKET':['Şirket','Visibility değerine göre ilk 12 şirket.',''],
    'CHATGPT':['ChatGPT visibility','Şirketin ChatGPT yanıtlarında geçme oranı.','= ChatGPT\'de şirketin geçtiği yanıt sayısı / ChatGPT toplam yanıt sayısı (25) × 100'],
    'GEMINI':['Gemini visibility','Şirketin Gemini yanıtlarında geçme oranı.','= Gemini\'de şirketin geçtiği yanıt sayısı / Gemini toplam yanıt sayısı (32) × 100']
  },
  site:{
    'SİTE':['Site','Yanıtlarda kaynak olarak gösterilen domain.',''],
    'CITATION':['Citation','Domain\'in LLM yanıtlarında kaynak olarak gösterilme sayısı (2 - 21 Eylül 2026, üç model).','= Domain\'e verilen citation sayısı']
  },
  fact:{
    'AKTARILAN DEĞER':['Aktarılan değer','Enerjisa Üretim adıyla geçen yanıtlarda şirket için aktarılan rakam veya ifade.',''],
    'CEVAP':['Yanıt','Bu değeri aktaran yanıt sayısı (Enerjisa Üretim adıyla geçen 61 yanıt içinde).','= Değerin geçtiği yanıt sayısı'],
    'SİTEDEKİ DEĞER':['Sitedeki değer','enerjisauretim.com.tr ana sayfasında yer alan güncel değer (23 Eylül 2026).','']
  },
  q:{
    '#':['Sıra','Soruların listedeki sırası.',''],
    'SORU':['Soru','Takip edilen marka-nötr soru. Sorularda şirket adı geçmez.',''],
    'KONU':['Konu','Sorunun ait olduğu sektör başlığı.',''],
    'ENERJİSA ADI':['Enerjisa adı','"Enerjisa" adının (Enerjisa Üretim veya Enerjisa Enerji) geçtiği yanıt sayısı.','= Enerjisa adının geçtiği yanıt sayısı / Sorunun toplam yanıt sayısı'],
    'ÜRETİM ADIYLA':['Enerjisa Üretim adıyla','Enerjisa Üretim adının açıkça geçtiği yanıt sayısı.','= Enerjisa Üretim adının geçtiği yanıt sayısı / Sorunun toplam yanıt sayısı'],
    'CITATION':['Citation','Sorunun yanıtlarında kaynak olarak gösterilen toplam URL sayısı.','= Sorunun yanıtlarındaki citation sayısı'],
    'ÖNE ÇIKAN KAYNAKLAR':['Öne çıkan kaynaklar','Bu sorunun yanıtlarında en çok citation alan domain\'ler.','= Domain\'e verilen citation sayısı']
  },
  metric:{
    'VISIBILITY':V,
    'MENTION':['Mention','Şirketin bir LLM yanıtının metninde adıyla yer alması. Kaynak linklerindeki domain adları mention sayılmaz.','= Şirketin adıyla geçtiği yanıt sayısı'],
    'SHARE OF VOICE':['Share of Voice','Yanıtlarda geçen tüm şirket mention\'ları içinde şirketin aldığı pay.','= Şirketin mention sayısı / Tüm şirketlerin toplam mention sayısı × 100'],
    'AVG POSITION':['Avg Position','Şirket yanıtta geçtiğinde, yanıttaki şirketler arasındaki ortalama sırası (ChatGPT + Gemini).','= Şirketin yanıttaki sıralarının toplamı / Şirketin geçtiği yanıt sayısı'],
    'SOURCE VISIBILITY':['Source Visibility','Şirketin sitesinin LLM yanıtlarında kaynak (citation) olarak gösterildiği yanıt oranı.','= Şirket domain\'inin atıf aldığı yanıt sayısı / Toplam yanıt sayısı × 100'],
    'CITATION':['Citation','LLM yanıtında kaynak olarak gösterilen URL.','= Yanıtlarda kaynak gösterilen URL sayısı'],
    'SENTIMENT SCORE':['Sentiment','Şirketin geçtiği bağlamın tonu; 0-100 arası skor, 50 nötr eşiktir.','= Şirketin geçtiği yanıtların sentiment skorlarının ortalaması'],
    '1. SIRA':['1. sıra','Şirketin, yanıttaki şirket listesinin ilk sırasında yer aldığı yanıt sayısı (üç model birlikte).','= Şirketin ilk sırada geçtiği yanıt sayısı']
  },
  kpi:[
    ['Visibility · Enerjisa Üretim adıyla','Enerjisa Üretim adının geçtiği yanıt oranı.','= Enerjisa Üretim adının geçtiği yanıt sayısı (61) / Toplam yanıt sayısı (88) × 100'],
    ['Visibility · "Enerjisa" adı','Enerjisa Üretim veya Enerjisa Enerji adının geçtiği yanıt oranı.','= Enerjisa adının geçtiği yanıt sayısı (79) / Toplam yanıt sayısı (88) × 100'],
    ['Avg Position','Enerjisa Üretim yanıtta geçtiğinde, yanıttaki şirketler arasındaki ortalama sırası (ChatGPT + Gemini).','= Enerjisa Üretim\'in yanıttaki sıralarının toplamı / Geçtiği yanıt sayısı (37)'],
    ['Citation payı','Yanıtlarda kaynak gösterilen tüm URL\'ler içinde enerjisauretim.com.tr\'nin payı.','= enerjisauretim.com.tr citation sayısı (10) / Toplam citation sayısı (680) × 100']
  ]
};

const VE=['Visibility','The share of LLM answers in which the company is named.','= Answers mentioning the company / Total answers × 100'];
const E={
  rank:{
    '#':['Rank','Companies ranked by visibility; on ties, the company with the better average position is placed higher.',''],
    'COMPANY':['Company','An electricity generation company identified in the answers. Companies appearing in at least 2 answers are listed; turbine and panel manufacturers are excluded.',''],
    'VISIBILITY':VE,'%':VE,
    'SOV':['Share of Voice','The company\'s share of all company mentions in the answers.','= Company mentions / Total mentions of all companies × 100'],
    'POS':['Avg Position','The company\'s average rank among the companies in an answer when it is mentioned. Calculated on ChatGPT and Gemini answers.','= Sum of the company\'s ranks in answers / Answers mentioning the company'],
    '1ST':['1st place','Number of answers in which the company is first in the company list (all three models).','= Answers where the company is ranked first'],
    'GPT %':['ChatGPT visibility','The share of ChatGPT answers mentioning the company.','= ChatGPT answers mentioning the company / Total ChatGPT answers (25) × 100'],
    'GEM %':['Gemini visibility','The share of Gemini answers mentioning the company.','= Gemini answers mentioning the company / Total Gemini answers (32) × 100'],
    'AIO %':['AI Overview visibility','The share of Google AI Overview answers mentioning the company.','= AI Overview answers mentioning the company / Total AI Overview answers (31) × 100']
  },
  prompt:{
    'QUESTION':['Question','A tracked brand-neutral question. The questions contain no company names.',''],
    'ANSWERS':['Answers','Completed answers to the question across the three models (2 - 21 September 2026).','= ChatGPT + Gemini + AI Overview answers'],
    'ENERJISA (ANY)':['Enerjisa (any)','Answers mentioning the "Enerjisa" name (Enerjisa Üretim or Enerjisa Enerji).','= Answers mentioning Enerjisa / Total answers to the question'],
    'ENERJISA ÜRETIM':['By the Enerjisa Üretim name','Answers explicitly naming Enerjisa Üretim; answers mentioning only Enerjisa Enerji are excluded.','= Answers naming Enerjisa Üretim / Total answers to the question'],
    'POS':['Avg Position','Enerjisa Üretim\'s average position in this question\'s ChatGPT and Gemini answers.','= Sum of Enerjisa Üretim\'s ranks in answers / Answers mentioning it'],
    'TOP COMPANIES':['Top companies','The companies appearing most often in this question\'s answers; the percentage is the company\'s visibility in this question.','= Answers mentioning the company / Total answers to the question × 100'],
    'TOP SOURCES':['Top sources','The domains cited most often in this question\'s answers; the number is the domain\'s citation count.','= Citations to the domain']
  },
  hm:{
    'COMPANY':['Company','The top 12 companies by visibility.',''],
    'CHATGPT':['ChatGPT visibility','The share of ChatGPT answers mentioning the company.','= ChatGPT answers mentioning the company / Total ChatGPT answers (25) × 100'],
    'GEMINI':['Gemini visibility','The share of Gemini answers mentioning the company.','= Gemini answers mentioning the company / Total Gemini answers (32) × 100']
  },
  site:{
    'SITE':['Site','A domain cited as a source in the answers.',''],
    'CITATIONS':['Citations','How many times the domain is cited as a source in LLM answers (2 - 21 September 2026, three models).','= Citations to the domain']
  },
  fact:{
    'REPORTED VALUE':['Reported value','A figure or statement given for the company in answers naming Enerjisa Üretim.',''],
    'ANSWERS':['Answers','Number of answers giving this value (out of the 61 answers naming Enerjisa Üretim).','= Answers containing the value'],
    'VALUE ON WEBSITE':['Value on website','The current value on the enerjisauretim.com.tr homepage (23 September 2026).','']
  },
  q:{
    '#':['Order','Order of the questions in the list.',''],
    'QUESTION':['Question','A tracked brand-neutral question. The questions contain no company names; they were asked in Turkish.',''],
    'TOPIC':['Topic','The sector heading the question belongs to.',''],
    'ENERJISA (ANY)':['Enerjisa (any)','Answers mentioning the "Enerjisa" name (Enerjisa Üretim or Enerjisa Enerji).','= Answers mentioning Enerjisa / Total answers to the question'],
    'ENERJISA ÜRETIM':['By the Enerjisa Üretim name','Answers explicitly naming Enerjisa Üretim.','= Answers naming Enerjisa Üretim / Total answers to the question'],
    'CITATIONS':['Citations','Total URLs cited as sources in the question\'s answers.','= Citations in the question\'s answers'],
    'TOP SOURCES':['Top sources','The domains cited most often in this question\'s answers.','= Citations to the domain']
  },
  metric:[VE,
    ['Mention','The company being named in the text of an LLM answer. Domain names in source links are not counted as mentions.','= Answers naming the company'],
    ['Share of Voice','The company\'s share of all company mentions in the answers.','= Company mentions / Total mentions of all companies × 100'],
    ['Avg Position','The company\'s average rank among the companies in an answer when it is mentioned (ChatGPT + Gemini).','= Sum of the company\'s ranks in answers / Answers mentioning the company'],
    ['Source Visibility','The share of LLM answers in which the company\'s website is cited as a source (citation).','= Answers citing the company domain / Total answers × 100'],
    ['Citation','A URL shown as a source in an LLM answer.','= URLs cited as sources in the answers'],
    ['Sentiment','The tone of the context in which the company appears; a 0-100 score, 50 is the neutral threshold.','= Average sentiment score of answers mentioning the company'],
    ['1st place','Number of answers in which the company is first in the company list (all three models).','= Answers where the company is ranked first']],
  kpi:[
    ['Visibility · by the Enerjisa Üretim name','The share of answers naming Enerjisa Üretim.','= Answers naming Enerjisa Üretim (61) / Total answers (88) × 100'],
    ['Visibility · the "Enerjisa" name','The share of answers mentioning Enerjisa Üretim or Enerjisa Enerji.','= Answers mentioning Enerjisa (79) / Total answers (88) × 100'],
    ['Avg Position','Enerjisa Üretim\'s average rank among the companies in an answer when it is mentioned (ChatGPT + Gemini).','= Sum of Enerjisa Üretim\'s ranks in answers / Answers mentioning it (37)'],
    ['Citation share','enerjisauretim.com.tr\'s share of all URLs cited as sources in the answers.','= enerjisauretim.com.tr citations (10) / Total citations (680) × 100']
  ]
};
Object.assign(E.q,{'Question · click to see answers':E.q['QUESTION'],'Topic':E.q['TOPIC'],'Enerjisa (any)':E.q['ENERJISA (ANY)'],'Enerjisa Üretim':E.q['ENERJISA ÜRETIM'],'Citations':E.q['CITATIONS'],'Top sources':E.q['TOP SOURCES']});
const ORDER=['VISIBILITY','MENTION','SHARE OF VOICE','AVG POSITION','SOURCE VISIBILITY','CITATION','SENTIMENT SCORE','1. SIRA'];
const norm=s=>s.replace(/\s+/g,' ').trim();
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const ICON='<svg class="ii" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.3"/><line x1="8" y1="7.2" x2="8" y2="11.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="4.9" r=".9" fill="currentColor"/></svg>';
let tip;
function el(){if(!tip){tip=document.createElement('div');tip.id='mtt';tip.setAttribute('role','tooltip');document.body.appendChild(tip)}return tip}
function show(t){
  const [h,d,f]=JSON.parse(t.dataset.mt);const e=el();
  e.innerHTML=`<div class="mt-h">${esc(h)}</div><div class="mt-d">${esc(d)}</div>${f?`<div class="mt-f">${esc(f)}</div>`:''}`;
  e.style.display='block';
  const r=t.getBoundingClientRect(),w=e.offsetWidth,hh=e.offsetHeight;
  let x=r.left+r.width/2-w/2;x=Math.max(10,Math.min(x,innerWidth-w-10));
  let y=r.top-hh-8;if(y<8)y=r.bottom+8;
  e.style.left=x+'px';e.style.top=y+'px';
}
function hide(){if(tip)tip.style.display='none'}
function bind(node,def){
  if(!def)return;
  node.dataset.mt=JSON.stringify(def);node.classList.add('mt-on');node.tabIndex=0;
  if(!node.querySelector(':scope > .ii'))node.insertAdjacentHTML('beforeend',ICON);
  if(node._mtb)return;node._mtb=1;
  node.addEventListener('mouseenter',()=>show(node));node.addEventListener('focus',()=>show(node));
  node.addEventListener('mouseleave',hide);node.addEventListener('blur',hide);
  node.addEventListener('click',e=>{e.stopPropagation();if(tip&&tip.style.display==='block'&&tip._n===node){hide();tip._n=null}else{show(node);tip._n=node}});
}
function heads(scope,map){
  document.querySelectorAll(scope+' th').forEach(th=>bind(th,map[norm(th.textContent)]));
}
window.bindMetricTips=function(){
  hide();
  const en=window.I18N&&I18N.lang==='en',X=en?E:D;
  heads('#rank',X.rank);heads('#prompt-tbl',X.prompt);heads('#hm',X.hm);
  heads('#tbl-broker',X.site);heads('#tbl-comp',X.site);heads('table.fact',X.fact);
  heads('#qbody',X.q);heads('#tbl',X.q);
  document.querySelectorAll('.metric .mk').forEach((m,i)=>bind(m,en?E.metric[i]:D.metric[ORDER[i]]));
  document.querySelectorAll('.kpis .kpi .k').forEach((k,i)=>bind(k,X.kpi[i]));
};
/* sorular.html başlığı ("Soru · tıklayın, cevaplar açılır") */
Object.assign(D.q,{'Soru · tıklayın, cevaplar açılır':D.q['SORU'],'Konu':D.q['KONU'],'Enerjisa adı':D.q['ENERJİSA ADI'],'Üretim adıyla':D.q['ÜRETİM ADIYLA'],'Citation':D.q['CITATION'],'Öne çıkan kaynaklar':D.q['ÖNE ÇIKAN KAYNAKLAR']});
addEventListener('scroll',hide,{passive:true});
document.addEventListener('click',hide);
const css=document.createElement('style');
css.textContent=`.mt-on{cursor:help}
.mt-on .ii{width:12px;height:12px;margin-left:5px;vertical-align:-1.5px;opacity:.55;flex:none}
.metric .mk.mt-on .ii{width:13px;height:13px;margin-left:2px}
.kpi .k.mt-on .ii{opacity:.45}
.mt-on:hover .ii,.mt-on:focus-visible .ii{opacity:1}
.mt-on:focus-visible{outline:2px solid var(--coral);outline-offset:2px;border-radius:4px}
#mtt{position:fixed;z-index:400;display:none;pointer-events:none;width:max-content;max-width:min(340px,calc(100vw - 20px));background:#fff;border:1px solid #DDE3EC;border-radius:10px;box-shadow:0 10px 28px rgba(27,37,82,.16);padding:12px 14px;text-align:left;letter-spacing:0;text-transform:none;white-space:normal;font-family:'Outfit','Calibri',system-ui,sans-serif}
#mtt .mt-h{font-weight:700;font-size:13.5px;color:#1B2552;margin-bottom:4px}
#mtt .mt-d{font-size:12.5px;line-height:1.55;color:#4A4A4A;font-weight:400}
#mtt .mt-f{margin-top:8px;padding-top:8px;border-top:1px solid #EEF1F6;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:1.6;color:#6B7280}`;
document.head.appendChild(css);
})();
