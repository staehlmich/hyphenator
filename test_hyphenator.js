// test_hyphenator.js
/**
 * Simple Node.js-friendly test script for the hyphenation engine.
 * Requires Hypher and the German patterns.
 */

const Hypher = require('./vendor/hypher.js');
const patterns = require('./vendor/de.js');

const hyphenator = new Hypher(patterns);

function testWord(word, expected) {
  const syllables = hyphenator.hyphenate(word);
  const result = syllables.join('\u00AD');
  const visible = result.replace(/\u00AD/g, '•');
  const expectedVisible = expected.replace(/\u00AD/g, '•');

  if (visible === expectedVisible) {
    console.log(`✅ PASS: ${word} -> ${visible}`);
    return true;
  } else {
    console.log(`❌ FAIL: ${word} -> ${visible} (expected: ${expectedVisible})`);
    return false;
  }
}

console.log('Running Hyphenation Regression Tests...');
let success = true;

success &= testWord('Arbeitsmarktstrukturreform', 'Arbeits\u00ADmarkt\u00ADstruk\u00ADtur\u00ADre\u00ADform');
success &= testWord('Donaudampfschifffahrt', 'Do\u00ADnau\u00ADdampf\u00ADschiff\u00ADfahrt');

if (success) {
  console.log('\nAll tests passed! 🎉');
  process.exit(0);
} else {
  console.log('\nSome tests failed. 😢');
  process.exit(1);
}
