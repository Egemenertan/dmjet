/**
 * Sanitize Utilities Tests
 * Akıllı arama eşleştirme testleri
 */

import {calculateMatchScore, filterAndSortByMatch} from '../sanitize';

describe('calculateMatchScore', () => {
  it('tam eşleşme için 100 skor döndürmeli', () => {
    expect(calculateMatchScore('bakım', 'bakım')).toBe(100);
    expect(calculateMatchScore('Bakım', 'bakım')).toBe(100);
  });

  it('başlangıç eşleşmesi için 90 skor döndürmeli', () => {
    expect(calculateMatchScore('kişi', 'kişisel')).toBe(90);
  });

  it('kelime tam eşleşmesi için 85 skor döndürmeli', () => {
    expect(calculateMatchScore('bakım', 'Kişisel Bakım')).toBe(85);
    expect(calculateMatchScore('kişisel', 'Kişisel Bakım')).toBe(85);
  });

  it('kelime başlangıç eşleşmesi için 75 skor döndürmeli', () => {
    expect(calculateMatchScore('bak', 'Kişisel Bakım')).toBe(75);
  });

  it('kelime içi eşleşme için 60 skor döndürmeli', () => {
    expect(calculateMatchScore('akı', 'Kişisel Bakım')).toBe(60);
  });

  it('genel içerik eşleşmesi için 50 skor döndürmeli', () => {
    expect(calculateMatchScore('selBak', 'Kişisel Bakım')).toBe(50);
  });

  it('Türkçe karakterlere duyarsız olmalı', () => {
    expect(calculateMatchScore('bakim', 'Bakım')).toBe(100);
    expect(calculateMatchScore('kisişel', 'Kişisel')).toBe(100);
    expect(calculateMatchScore('şeker', 'Şeker')).toBe(100);
    expect(calculateMatchScore('çocuk', 'Çocuk')).toBe(100);
  });

  it('eşleşme yoksa 0 döndürmeli', () => {
    expect(calculateMatchScore('xyz', 'Kişisel Bakım')).toBe(0);
    expect(calculateMatchScore('', 'Kişisel Bakım')).toBe(0);
    expect(calculateMatchScore('test', '')).toBe(0);
  });
});

describe('filterAndSortByMatch', () => {
  const categories = [
    {id: '1', name: 'Kişisel Bakım'},
    {id: '2', name: 'Ev Bakım'},
    {id: '3', name: 'Bebek Bakımı'},
    {id: '4', name: 'Gıda'},
    {id: '5', name: 'İçecekler'},
  ];

  it('bakım araması için ilgili kategorileri döndürmeli', () => {
    const results = filterAndSortByMatch(
      'bakım',
      categories,
      (cat) => cat.name,
      50
    );

    expect(results.length).toBe(3);
    expect(results[0].name).toBe('Kişisel Bakım');
    expect(results[1].name).toBe('Ev Bakım');
    expect(results[2].name).toBe('Bebek Bakımı');
  });

  it('kişisel araması için Kişisel Bakım\'ı en üstte döndürmeli', () => {
    const results = filterAndSortByMatch(
      'kişisel',
      categories,
      (cat) => cat.name,
      50
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Kişisel Bakım');
  });

  it('bebek araması için Bebek Bakımı\'nı döndürmeli', () => {
    const results = filterAndSortByMatch(
      'bebek',
      categories,
      (cat) => cat.name,
      50
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Bebek Bakımı');
  });

  it('minimum skor altındaki sonuçları filtrelemeli', () => {
    const results = filterAndSortByMatch(
      'xyz',
      categories,
      (cat) => cat.name,
      50
    );

    expect(results.length).toBe(0);
  });

  it('Türkçe karakterlere duyarsız arama yapmalı', () => {
    const results = filterAndSortByMatch(
      'bakim',
      categories,
      (cat) => cat.name,
      50
    );

    expect(results.length).toBe(3);
    expect(results.some(r => r.name === 'Kişisel Bakım')).toBe(true);
  });

  it('skorları doğru hesaplamalı', () => {
    const results = filterAndSortByMatch(
      'bakım',
      categories,
      (cat) => cat.name,
      50
    );

    // Her sonucun matchScore özelliği olmalı
    results.forEach(result => {
      expect(result.matchScore).toBeGreaterThanOrEqual(50);
      expect(result.matchScore).toBeLessThanOrEqual(100);
    });

    // Skorlar azalan sırada olmalı
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].matchScore).toBeGreaterThanOrEqual(results[i + 1].matchScore);
    }
  });
});

