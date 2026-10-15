# Enerjisa Üretim AI Görünürlük Raporu · Sektör Aramaları

ChatGPT, Gemini ve Google AI Overview'a sorulan 5 marka-nötr sektör sorusunun (Sektör Aramaları klasörü)
2 Eylül - 15 Ekim 2026 koşularındaki 134 cevabının analizi. İlk baskı: Eylül 2026 · güncelleme: **Ekim 2026** (15 Ekim koşusu dahil).

## Yapı

```
index.html     → rapor (statik, bağımlılık yok) · TR / EN dil düğmesi
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
- 3 model: ChatGPT (35 cevap), Gemini (51), Google AI Overview (48) · 2 Eylül - 15 Ekim 2026 · hata veren koşular hariç
- 63 şirket tespit edildi (en az 2 cevapta geçen), 1.014 citation, 158 domain
- Enerjisa için iki katman: "Enerjisa" adı (Üretim + Enerji) ve Enerjisa Üretim adıyla

## Deploy

Statik site; Vercel'de framework preset **Other** yeterli.

## Dil

Sağ üstteki TR / EN düğmesi tüm metinleri, tabloları, grafikleri ve açıklama balonlarını çevirir; tercih tarayıcıda saklanır. `?lang=en` parametresiyle doğrudan İngilizce açılır. EN modunda model cevapları İngilizce çevirisiyle gösterilir.

İçerik değiştiğinde statik metinlerin `data-i` anahtarları ve `data/i18n.js` içindeki EN karşılıkları birlikte güncellenmelidir.
