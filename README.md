# Enerjisa Üretim AI Görünürlük Raporu · Sektör Aramaları

ChatGPT, Gemini ve Google AI Overview'a sorulan 5 marka-nötr sektör sorusunun (Sektör Aramaları klasörü)
2 - 21 Eylül 2026 koşularındaki 88 cevabının analizi. İlk baskı: **Eylül 2026**.

## Yapı

```
index.html     → rapor (statik, bağımlılık yok)
sorular.html   → soru seti + model cevapları
data/
  ├─ analyze.py      (agregasyon scripti: ham DB çıktısı -> JS veri dosyaları)
  ├─ entities.py     (şirket sözlüğü & eşleşme kuralları)
  ├─ report_data.js / report-data.json
  ├─ questions.js
  └─ answers.js      (88 cevabın tam metni)
assets/        → Enerjisa Üretim & Inbound logoları, kaynak favicon'ları
fonts/         → Bricolage Grotesque + Outfit
```

## Metodoloji özeti

- 5 marka-nötr soru: en büyük özel elektrik üreticisi, yenilenebilir, rüzgar, güneş, hidroelektrik
- 3 model: ChatGPT (25 cevap), Gemini (32), Google AI Overview (31) · 2 - 21 Eylül 2026
- 57 şirket tespit edildi (en az 2 cevapta geçen), 680 citation, 127 domain
- Enerjisa için iki katman: "Enerjisa" adı (Üretim + Enerji) ve Enerjisa Üretim adıyla

## Deploy

Statik site; Vercel'de framework preset **Other** yeterli.
