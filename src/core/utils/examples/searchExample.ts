/**
 * Gelişmiş Arama Sistemi - Örnek Kullanım
 * Bu dosya arama sisteminin nasıl çalıştığını gösterir
 */

import {calculateMatchScore, filterAndSortByMatch} from '../sanitize';

// ============================================
// ÖRNEK 1: Basit Skor Hesaplama
// ============================================

console.log('=== ÖRNEK 1: Skor Hesaplama ===');
console.log(
  'bakım -> Kişisel Bakım:',
  calculateMatchScore('bakım', 'Kişisel Bakım'),
); // 85
console.log(
  'kişisel -> Kişisel Bakım:',
  calculateMatchScore('kişisel', 'Kişisel Bakım'),
); // 85
console.log(
  'bak -> Kişisel Bakım:',
  calculateMatchScore('bak', 'Kişisel Bakım'),
); // 75
console.log(
  'bakim -> Kişisel Bakım:',
  calculateMatchScore('bakim', 'Kişisel Bakım'),
); // 85 (Türkçe karakter duyarsız)

// ============================================
// ÖRNEK 2: Kategori Filtreleme
// ============================================

console.log('\n=== ÖRNEK 2: Kategori Filtreleme ===');

const categories = [
  {id: '1', name: 'Kişisel Bakım'},
  {id: '2', name: 'Ev Bakım'},
  {id: '3', name: 'Bebek Bakımı'},
  {id: '4', name: 'Gıda'},
  {id: '5', name: 'İçecekler'},
  {id: '6', name: 'Temizlik'},
  {id: '7', name: 'Kozmetik'},
];

// "bakım" araması
const bakimResults = filterAndSortByMatch(
  'bakım',
  categories,
  cat => cat.name,
  50,
);

console.log('\n"bakım" araması sonuçları:');
bakimResults.forEach((result, index) => {
  console.log(`${index + 1}. ${result.name} (Skor: ${result.matchScore})`);
});

// "kişisel" araması
const kisiselResults = filterAndSortByMatch(
  'kişisel',
  categories,
  cat => cat.name,
  50,
);

console.log('\n"kişisel" araması sonuçları:');
kisiselResults.forEach((result, index) => {
  console.log(`${index + 1}. ${result.name} (Skor: ${result.matchScore})`);
});

// "bebek" araması
const bebekResults = filterAndSortByMatch(
  'bebek',
  categories,
  cat => cat.name,
  50,
);

console.log('\n"bebek" araması sonuçları:');
bebekResults.forEach((result, index) => {
  console.log(`${index + 1}. ${result.name} (Skor: ${result.matchScore})`);
});

// ============================================
// ÖRNEK 3: Türkçe Karakter Duyarsızlığı
// ============================================

console.log('\n=== ÖRNEK 3: Türkçe Karakter Duyarsızlığı ===');

const turkishTests = [
  {search: 'bakim', target: 'Kişisel Bakım'},
  {search: 'gida', target: 'Gıda'},
  {search: 'icecek', target: 'İçecek'},
  {search: 'temizlik', target: 'Temizlik'},
  {search: 'cocuk', target: 'Çocuk'},
];

turkishTests.forEach(test => {
  const score = calculateMatchScore(test.search, test.target);
  console.log(`"${test.search}" -> "${test.target}": ${score}`);
});

// ============================================
// ÖRNEK 4: Ürün Araması Simülasyonu
// ============================================

console.log('\n=== ÖRNEK 4: Ürün Araması Simülasyonu ===');

interface Product {
  id: string;
  name: string;
  category: string;
}

const products: Product[] = [
  {id: '1', name: 'Şampuan', category: 'Kişisel Bakım'},
  {id: '2', name: 'Diş Fırçası', category: 'Kişisel Bakım'},
  {id: '3', name: 'Bebek Bezi', category: 'Bebek Bakımı'},
  {id: '4', name: 'Bebek Şampuanı', category: 'Bebek Bakımı'},
  {id: '5', name: 'Deterjan', category: 'Ev Bakım'},
  {id: '6', name: 'Yumuşatıcı', category: 'Ev Bakım'},
];

// Kullanıcı "bakım" aradığında kategorileri bul
const matchingCategories = filterAndSortByMatch(
  'bakım',
  categories,
  cat => cat.name,
  50,
);

console.log('\n"bakım" araması için bulunan kategoriler:');
matchingCategories.forEach(cat => {
  console.log(`- ${cat.name} (Skor: ${cat.matchScore})`);
});

// Bu kategorilerdeki ürünleri filtrele
const categoryNames = matchingCategories.map(c => c.name);
const matchingProducts = products.filter(p =>
  categoryNames.includes(p.category),
);

console.log('\nBu kategorilerdeki ürünler:');
matchingProducts.forEach(product => {
  console.log(`- ${product.name} (${product.category})`);
});

// ============================================
// ÖRNEK 5: Farklı Minimum Skorlar
// ============================================

console.log('\n=== ÖRNEK 5: Farklı Minimum Skorlar ===');

const testQuery = 'bak';

console.log(`\n"${testQuery}" araması için farklı minimum skorlar:`);

[90, 75, 60, 50].forEach(minScore => {
  const results = filterAndSortByMatch(
    testQuery,
    categories,
    cat => cat.name,
    minScore,
  );
  console.log(`\nMinimum Skor: ${minScore}`);
  console.log(`Sonuç Sayısı: ${results.length}`);
  results.forEach(r => {
    console.log(`  - ${r.name} (${r.matchScore})`);
  });
});

// ============================================
// BEKLENEN ÇIKTI
// ============================================

/*
=== ÖRNEK 1: Skor Hesaplama ===
bakım -> Kişisel Bakım: 85
kişisel -> Kişisel Bakım: 85
bak -> Kişisel Bakım: 75
bakim -> Kişisel Bakım: 85

=== ÖRNEK 2: Kategori Filtreleme ===

"bakım" araması sonuçları:
1. Kişisel Bakım (Skor: 85)
2. Ev Bakım (Skor: 85)
3. Bebek Bakımı (Skor: 60)

"kişisel" araması sonuçları:
1. Kişisel Bakım (Skor: 85)

"bebek" araması sonuçları:
1. Bebek Bakımı (Skor: 85)

=== ÖRNEK 3: Türkçe Karakter Duyarsızlığı ===
"bakim" -> "Kişisel Bakım": 85
"gida" -> "Gıda": 100
"icecek" -> "İçecek": 100
"temizlik" -> "Temizlik": 100
"cocuk" -> "Çocuk": 100

=== ÖRNEK 4: Ürün Araması Simülasyonu ===

"bakım" araması için bulunan kategoriler:
- Kişisel Bakım (Skor: 85)
- Ev Bakım (Skor: 85)
- Bebek Bakımı (Skor: 60)

Bu kategorilerdeki ürünler:
- Şampuan (Kişisel Bakım)
- Diş Fırçası (Kişisel Bakım)
- Bebek Bezi (Bebek Bakımı)
- Bebek Şampuanı (Bebek Bakımı)
- Deterjan (Ev Bakım)
- Yumuşatıcı (Ev Bakım)

=== ÖRNEK 5: Farklı Minimum Skorlar ===

"bak" araması için farklı minimum skorlar:

Minimum Skor: 90
Sonuç Sayısı: 0

Minimum Skor: 75
Sonuç Sayısı: 2
  - Kişisel Bakım (75)
  - Ev Bakım (75)

Minimum Skor: 60
Sonuç Sayısı: 3
  - Kişisel Bakım (75)
  - Ev Bakım (75)
  - Bebek Bakımı (60)

Minimum Skor: 50
Sonuç Sayısı: 3
  - Kişisel Bakım (75)
  - Ev Bakım (75)
  - Bebek Bakımı (60)
*/


