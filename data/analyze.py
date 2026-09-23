# -*- coding: utf-8 -*-
"""Enerjisa Üretim · Sektör Aramaları klasörü -> report_data.js / questions.js / answers.js"""
import json, re, collections, statistics, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from entities import ENT, OEM
D = os.path.dirname(__file__)
M = json.load(open(D + '/resp_meta.json'))
TX = {r['id']: r['response_text'] or '' for r in json.load(open(D + '/resp_text.json'))}
C = json.load(open(D + '/cites.json'))

PROMPTS = {
 'ccba092c-86f1-4f28-99aa-df1ece8d0428': ("Türkiye'nin en büyük özel elektrik üreticisi şirketler hangileri?", 'uretici', 'Özel üretici'),
 '4bcaea8f-202c-420f-a94a-0bda7ad27d2d': ("Türkiye'de yenilenebilir enerji üretiminde öne çıkan şirketler kimler?", 'yenilenebilir', 'Yenilenebilir'),
 '4d970882-fde3-4f08-8946-4901d40ffcba': ("Türkiye'de rüzgar enerjisi santrali işleten başlıca firmalar hangileri?", 'ruzgar', 'Rüzgar'),
 'cb1b61f0-3ece-4b28-acb3-66f167e5a29c': ("Türkiye'de güneş enerji santrali kuran büyük enerji şirketleri hangileri?", 'gunes', 'Güneş'),
 '9b23f856-7d20-45a5-bb77-3bfb12b3a533': ("Türkiye'de en çok hidroelektrik enerji üreten özel şirketler kimler?", 'hidro', 'Hidroelektrik'),
}
PROV = ['chatgpt', 'gemini', 'google_ai_overview']
PK = {'chatgpt': 'cg', 'gemini': 'gm', 'google_ai_overview': 'ao'}
RX = [(n, d, re.compile(r, re.I if not r.isupper() else 0)) for n, d, r in ENT]
RX = [(n, d, re.compile(r)) for n, d, r in ENT]  # case-sensitive: marka adları büyük harfle yazılıyor

def clean(t):
    # kaynak linklerini ve URL'leri at (domain adı mention sayılmasın)
    t = re.sub(r'\]\([^)]*\)', ']', t)
    t = re.sub(r'https?://\S+', ' ', t)
    return t

def entities(t):
    t = clean(t)
    found = {}
    for n, d, rx in RX:
        m = rx.search(t)
        if m: found[n] = m.start()
    order = sorted(found, key=lambda k: found[k])
    return order

R = []
for r in M:
    t = TX[r['id']]
    order = entities(t)
    tl = clean(t)
    u = bool(re.search(r'Enerjisa\s+(?:Enerji\s+)?Üretim', tl))
    e = bool(re.search(r'Enerjisa\s+Enerji(?!\s+Üretim)', tl))
    anyE = bool(re.search(r'Enerjisa', tl))
    # Enerjisa'nın liste maddesi olarak hangi adla geçtiği
    head = None
    for m in re.finditer(r'\*\*([^*\n]{2,80})\*\*', t):
        s = m.group(1)
        if 'Enerjisa' in s:
            head = s.strip(' :.-'); break
    if head is None:
        m = re.search(r'\[(Enerjisa[^\]]{0,40})\]', t)
        if m: head = m.group(1)
    if head and 'Üretim' in head and 'Enerji (' not in head and '/' not in head: label = 'u'
    elif head and '/' in head: label = 'mix'
    elif head and 'Enerjisa Enerji' in head: label = 'e'
    elif u: label = 'u'
    elif e: label = 'e'
    elif anyE: label = 'e'
    else: label = None
    # sıra: Enerjisa Üretim ve Enerjisa Enerji tek aile olarak
    fam = []
    for n in order:
        k = 'Enerjisa' if n.startswith('Enerjisa') else n
        if k not in fam: fam.append(k)
    R.append(dict(id=r['id'], run=r['run_id'], p=r['prompt_id'], prov=r['llm_provider'], ts=r['ts'][:10],
                  tool=r['brand_mentioned'], tpos=r['brand_position'], sent=r['sentiment'], ss=r['sentiment_score'],
                  ctx=r['brand_context'], u=u, e=e, anyE=anyE, label=label, head=head, order=order, fam=fam, text=t))

N = len(R)
nprov = collections.Counter(x['prov'] for x in R)
out = {'meta': {'answers': N, 'prov_answers': dict(nprov), 'window': '2 - 21 Eylül 2026',
                'dates': sorted(collections.Counter(x['ts'] for x in R).items())}}

# ---------- entity sıralaması (Enerjisa aile satırı + alt kırılım) ----------
def rank_rows(rows, key='order'):
    ent_names = ['Enerjisa'] + [n for n, _, _ in ENT] if key == 'fam' else [n for n, _, _ in ENT]
    per = {n: dict(n=0, pos=[], first=0, prov=collections.Counter()) for n in ent_names}
    total_mentions = 0
    for x in rows:
        for i, n in enumerate(x[key]):
            per[n]['n'] += 1; per[n]['prov'][x['prov']] += 1; total_mentions += 1
            if x['prov'] != 'google_ai_overview': per[n]['pos'].append(i + 1)
            if i == 0: per[n]['first'] += 1
    pc = collections.Counter(x['prov'] for x in rows)
    res = []
    for n, v in per.items():
        if v['n'] < 2: continue
        dom = dict((a, b) for a, b, _ in ENT).get(n, 'enerjisauretim.com.tr')
        res.append(dict(b=n if n != 'Enerjisa' else 'Enerjisa (aile)', d=dom, n=v['n'], vis=round(100 * v['n'] / len(rows), 1),
                        sov=round(100 * v['n'] / total_mentions, 1),
                        pos=round(statistics.mean(v['pos']), 1) if v['pos'] else None, first=v['first'],
                        cg=round(100 * v['prov']['chatgpt'] / pc['chatgpt'], 1) if pc['chatgpt'] else None,
                        gm=round(100 * v['prov']['gemini'] / pc['gemini'], 1) if pc['gemini'] else None,
                        ao=round(100 * v['prov']['google_ai_overview'] / pc['google_ai_overview'], 1) if pc['google_ai_overview'] else None))
    res.sort(key=lambda r: (-r['vis'], r['pos'] or 99))
    return res, total_mentions

out['rank'], out['total_entity_mentions'] = rank_rows(R)
fam_rank, _ = rank_rows(R, 'fam')
out['fam_row'] = [r for r in fam_rank if r['b'] == 'Enerjisa (aile)'][0]
out['fam_rank_pos'] = [r['b'] for r in fam_rank].index('Enerjisa (aile)') + 1
out['avg_entities'] = {p: round(statistics.mean(len(x['fam']) for x in R if x['prov'] == p), 1) for p in PROV}

# ---------- Enerjisa KPI ----------
def pct(a, b): return round(100 * a / b, 1) if b else None
tool_n = sum(x['tool'] for x in R)
u_n = sum(x['u'] for x in R)
lab = collections.Counter(x['label'] for x in R if x['tool'])
tpos = [x['tpos'] for x in R if x['tool'] and x['tpos']]
k = dict(tool_n=tool_n, tool_vis=pct(tool_n, N), u_n=u_n, u_vis=pct(u_n, N), labels=dict(lab),
         avg_pos_tool=round(statistics.mean(tpos), 2), pos_n=len(tpos),
         pos_dist=dict(collections.Counter(tpos)),
         top2=pct(sum(1 for p in tpos if p <= 2), len(tpos)),
         prov={})
for p in PROV:
    rs = [x for x in R if x['prov'] == p]
    tp = [x['tpos'] for x in rs if x['tool'] and x['tpos']]
    k['prov'][p] = dict(n=len(rs), tool=sum(x['tool'] for x in rs), u=sum(x['u'] for x in rs),
                        tool_vis=pct(sum(x['tool'] for x in rs), len(rs)), u_vis=pct(sum(x['u'] for x in rs), len(rs)),
                        pos=round(statistics.mean(tp), 2) if tp else None,
                        ss=round(statistics.mean([x['ss'] for x in rs if x['tool'] and x['ss'] is not None]), 1) if any(x['tool'] for x in rs) else None)
# sentiment
sm = [x for x in R if x['tool']]
k['sent'] = dict(collections.Counter(x['sent'] for x in sm))
k['ss'] = round(statistics.mean(x['ss'] for x in sm if x['ss'] is not None), 1)
out['kpi'] = k

# ---------- prompt bazında ----------
cites_by_run = collections.defaultdict(list)
for c in C: cites_by_run[c['run_id']].append(c)
prompts = []
for pid, (q, key, short) in PROMPTS.items():
    rs = [x for x in R if x['p'] == pid]
    tp = [x['tpos'] for x in rs if x['tool'] and x['tpos'] and x['prov'] != 'google_ai_overview']
    rk, _ = rank_rows(rs)
    cc = collections.Counter()
    for c in C:
        if c['prompt_id'] == pid: cc[c['domain']] += 1
    ecit = sum(v for d, v in cc.items() if 'enerjisauretim' in d)
    prompts.append(dict(id=pid, q=q, k=key, s=short, n=len(rs),
                        tool=sum(x['tool'] for x in rs), u=sum(x['u'] for x in rs),
                        tool_vis=pct(sum(x['tool'] for x in rs), len(rs)), u_vis=pct(sum(x['u'] for x in rs), len(rs)),
                        pos=next((r['pos'] for r in rk if r['b'] == 'Enerjisa Üretim'), None),
                        prov={PK[p]: [sum(x['tool'] for x in rs if x['prov'] == p), sum(x['u'] for x in rs if x['prov'] == p), sum(1 for x in rs if x['prov'] == p)] for p in PROV},
                        labels=dict(collections.Counter(x['label'] for x in rs if x['tool'])),
                        top=[[r['b'], r['d'], r['vis'], r['pos']] for r in rk[:8]],
                        cit=sum(cc.values()), ecit=ecit, src=cc.most_common(8)))
out['prompts'] = prompts

# ---------- haftalık seyir ----------
def week(ts):
    d = int(ts[8:10])
    return '1-7 Eyl' if d <= 7 else ('8-14 Eyl' if d <= 14 else '15-21 Eyl')
W = ['1-7 Eyl', '8-14 Eyl', '15-21 Eyl']
trend = []
for w in W:
    row = {'w': w}
    for p in PROV:
        rs = [x for x in R if x['prov'] == p and week(x['ts']) == w]
        row[PK[p]] = pct(sum(x['tool'] for x in rs), len(rs)) if len(rs) >= 4 else None
        row[PK[p] + '_u'] = pct(sum(x['u'] for x in rs), len(rs)) if len(rs) >= 4 else None
        row[PK[p] + '_n'] = len(rs)
    trend.append(row)
out['trend'] = trend

# ---------- citation analizi ----------
COMP = {'polatenerji': 'Polat Enerji', 'guris': 'Güriş', 'aydem': 'Aydem Yenilenebilir', 'cengizenerji': 'Cengiz Enerji',
        'fibaenerji': 'Fiba Yenilenebilir', 'energo-pro': 'Energo-Pro', 'erenenerji': 'Eren Enerji', 'akfen': 'Akfen Yenilenebilir',
        'galatawind': 'Galata Wind', 'rtenerji': 'RT Enerji', 'gurmat': 'Gürmat', 'endaenerji': 'Enda Enerji', 'demirer': 'Demirer Holding',
        'medyol': 'Medyol Enerji', 'turker': 'Türkerler', 'mergeenerji': 'Merge Enerji', 'eksimenerji': 'Eksim Enerji',
        'zorlu': 'Zorlu Enerji', 'limak': 'Limak Enerji', 'tektug': 'Tektuğ', 'borusanenbw': 'Borusan EnBW', 'cw-enerji': 'CW Enerji',
        'kontrolmatik': 'Kontrolmatik', 'kurtsuyu': 'Kurtsuyu Elektrik', 'ozaltin': 'Özaltın Enerji', 'mogan': 'Mogan Enerji',
        'kalyon': 'Kalyon Enerji', 'alarko': 'Alarko', 'oltankoleoglu': 'Oltan & Köleoğlu', 'masfen': 'Masfen Enerji',
        'dnzyapienerji': 'Deniz Yapı Enerji', 'demirciliruzgar': 'Demirci Rüzgar', 'icholding': 'IC Enterra', 'santralmadencilik': 'Santral Madencilik',
        'eawind': 'Eawind', 'liveraenergy': 'Livera', 'goktekin': 'Göktekin', 'gmkenerji': 'GMK Enerji', 'resoltenerji': 'Resolt',
        'doganholding': 'Doğan Holding', 'asmaz': 'Asmaz', 'mimsan': 'Mimsan', 'daxler': 'Daxler'}
BROKER = ['getmidas', 'a1capital', 'gedik', 'piapiri', 'yatirimkilavuzu', 'qnbinvest', 'gcmyatirim', 'foreks', 'hisse.net', 'investing',
          'hocaileborsa', 'valu.com.tr', 'keremcilli']
SECTOR = ['enerjiatlasi', 'mw100', 'enerji-dunyasi', 'enerjigunlugu', 'tureb', 'ruzgarenerjisi', 'enerjirehberi', 'enerjigundemi',
          'enerjiekonomisi', 'radyoenerji', 'solargundem', 'gesdergisi', 'yesilekonomi', 'bestenerji', 'ceyrekmuhendis', 'piagrid',
          'ensun', 'solarbaba', 'egirisim', 'yesilhaber', 'icci', 'turkishexporter', 'bulurum', 'revenuebase']
NEWS = ['aa.com.tr', 'bloomberght', 'forbes', 'dunya.com', 'odatv', 'cumhuriyet', 'turkiyegazetesi', 'ekonomigazetesi', 'drttv',
        'patronlardunyasi', 't24', 'ekonomim', 'hurriyet', 'businesslife', 'dha.com.tr', 'doviz', 'capital.com.tr', 'istanbul.zone']
SUPPLY = ['powerenerji', 'gesenerji', 'entegro', 'yeo.com', 'gama', 'tuncmatik', 'entegresolar', 'zessolar', 'enercon', 'voith',
          'res-group', 'akfentoptan', 'kalyonholding']
def cat(d):
    if 'enerjisauretim' in d: return 'you'
    if 'enerjisa.com' in d: return 'ejs'
    if 'wikipedia' in d: return 'wiki'
    if d in ('instagram.com', 'facebook.com'): return 'social'
    if d.endswith('.gov.tr'): return 'gov'
    for s in BROKER:
        if s in d: return 'broker'
    for s in NEWS:
        if s in d: return 'news'
    for s in SUPPLY:
        if s in d: return 'supply'
    for s in SECTOR:
        if s in d: return 'sector'
    for s in COMP:
        if s in d: return 'comp'
    return 'other'
cats = collections.Counter(); unk = collections.Counter()
for c in C:
    ct = cat(c['domain']); cats[ct] += 1
    if ct == 'other': unk[c['domain']] += 1
out['cit_total'] = len(C)
out['cit_cats'] = dict(cats)
out['cit_unknown'] = unk.most_common()
out['cit_prov'] = dict(collections.Counter(c['llm_provider'] for c in C))
out['top_domains'] = [[d, n, cat(d)] for d, n in collections.Counter(c['domain'] for c in C).most_common(25)]
out['top_domains_all'] = [[d, n, cat(d)] for d, n in collections.Counter(c['domain'] for c in C).most_common()]
out['domains_n'] = len(set(c['domain'] for c in C))
# cevap başına citation
runs_with = collections.Counter(c['run_id'] for c in C)
out['cit_per_answer'] = {p: round(sum(runs_with[x['run']] for x in R if x['prov'] == p) / nprov[p], 1) for p in PROV}
# source visibility: şirket domain'inin kaynak gösterildiği cevap oranı
SV = {'Enerjisa Üretim': ['enerjisauretim'], 'Enerjisa Enerji': ['enerjisa.com'], 'Polat Enerji': ['polatenerji'], 'Güriş': ['guris'],
      'Aydem Yenilenebilir': ['aydem'], 'Cengiz Enerji': ['cengizenerji'], 'Akfen Yenilenebilir': ['akfen'], 'Zorlu Enerji': ['zorlu'],
      'Eren Enerji': ['erenenerji'], 'Galata Wind': ['galatawind'], 'Fiba Yenilenebilir': ['fibaenerji'], 'Energo-Pro': ['energo-pro'],
      'Limak Enerji': ['limak'], 'Kalyon Enerji': ['kalyon'], 'ENKA': ['enka.com'], 'Eksim Enerji': ['eksimenerji']}
sv = {}
for n, keys in SV.items():
    runs = set(c['run_id'] for c in C if any(k in c['domain'] for k in keys))
    ncit = sum(1 for c in C if any(k in c['domain'] for k in keys))
    sv[n] = dict(answers=len(runs), pct=pct(len(runs), N), cit=ncit)
out['source_vis'] = sv
out['enerjisa_urls'] = collections.Counter((c['url'], c['llm_provider']) for c in C if 'enerjisa' in c['domain']).most_common()
out['enerjisa_urls'] = [[u, p, n] for (u, p), n in out['enerjisa_urls']]

# ---------- anlatı: Enerjisa bağlamındaki temalar & kurulu güç rakamları ----------
TH = [('kurulu güç / MW', r'MW|kurulu güç'), ('Sabancı & E.ON ortaklığı', r'Sabancı|E\.ON'),
      ('hidroelektrik', r'hidro|HES'), ('rüzgar', r'rüzg[aâ]r|RES'), ('güneş', r'güneş|GES|solar'),
      ('doğal gaz / termik', r'doğal ?gaz|termik|kömür|linyit'), ('jeotermal', r'jeotermal'),
      ('liderlik / en büyük', r'en büyük|lider|önde gelen|öncü'), ('portföy çeşitliliği', r'portföy|çeşitli|dengeli'),
      ('dağıtım & perakende (Enerjisa Enerji)', r'dağıtım|perakende|müşteri'), ('borsa / hisse', r'ENJSA|borsa|hisse|halka'),
      ('depolama & hibrit', r'depolama|batarya|hibrit'), ('yatırım & hedef', r'yatırım|hedef|2030')]
def window(t):
    segs = []
    for m in re.finditer(r'Enerjisa', t):
        segs.append(t[max(0, m.start() - 20): m.end() + 320])
    return ' '.join(segs)
th = collections.Counter()
for x in R:
    if not x['tool']: continue
    w = window(clean(x['text']))
    for n, rx in TH:
        if re.search(rx, w, re.I): th[n] += 1
out['themes'] = th.most_common()
mw = collections.Counter()
for x in R:
    if not x['tool']: continue
    w = window(clean(x['text']))
    for m in re.finditer(r'(\d{1,2}[.,]\d{3}|\d{3,5})\s*(MWe|MW)', w):
        mw[m.group(1).replace(',', '.') + ' ' + m.group(2)] += 1
out['mw_claims'] = mw.most_common(15)

# ---------- AIO tetiklenme ----------
out['aio'] = dict(n=nprov['google_ai_overview'], empty=sum(1 for x in R if x['prov'] == 'google_ai_overview' and len(x['text']) < 50))

# ---------- sorular / cevaplar ----------
Q = []
for p in prompts:
    Q.append(dict(id=p['id'], q=p['q'], s=p['s'], n=p['cit'], mv=p['tool'], mu=p['u'], mr=p['n'], pos=p['pos'], e=p['ecit'],
                  top=p['top'][:5], src=p['src'][:6]))
A = []
for p in prompts:
    runs = [x for x in R if x['p'] == p['id']]
    runs.sort(key=lambda x: (x['ts'], PROV.index(x['prov'])))
    A.append(dict(id=p['id'], q=p['q'], runs=[dict(p=x['prov'], d=x['ts'], a=x['text'], t=x['tool'], u=x['u'], pos=x['tpos'], l=x['label']) for x in runs]))

OUT = sys.argv[1]
open(OUT + '/report_data.js', 'w').write('const RD=' + json.dumps(out, ensure_ascii=False) + ';')
open(OUT + '/questions.js', 'w').write('const QUESTIONS=' + json.dumps(Q, ensure_ascii=False) + ';')
open(OUT + '/answers.js', 'w').write('const ANSWERS=' + json.dumps(A, ensure_ascii=False) + ';')
json.dump(out, open(OUT + '/report-data.json', 'w'), ensure_ascii=False, indent=1)

# konsol özeti
print('N', N, dict(nprov)); print('KPI', json.dumps({kk: vv for kk, vv in k.items() if kk != 'prov'}, ensure_ascii=False))
for p in PROV: print(p, k['prov'][p])
print('avg ent', out['avg_entities'])
for r in out['rank'][:30]: print(r)
for p in prompts: print(p['s'], p['n'], 'tool', p['tool'], 'u', p['u'], 'pos', p['pos'], p['prov'], p['labels'], 'cit', p['cit'], 'ecit', p['ecit'], p['top'][:5])
print('trend', trend)
print('cats', out['cit_cats']); print('unknown', out['cit_unknown'])
print('sv', sv); print('cpa', out['cit_per_answer']); print('urls', out['enerjisa_urls'])
print('themes', out['themes']); print('mw', out['mw_claims']); print('aio', out['aio'])
