import fs from 'node:fs';import assert from 'node:assert/strict';
const web=JSON.parse(fs.readFileSync(new URL('../src/library/entries.json',import.meta.url))).filter(e=>e.published&&e.verification_status==='verified');
const native=JSON.parse(fs.readFileSync(new URL('../ios/TitipanDoa/Shared/Library.json',import.meta.url)));
assert.deepEqual(native.map(e=>e.id),web.map(e=>e.id));for(let i=0;i<web.length;i++){assert.equal(native[i].arabic,web[i].arabic_text);assert.equal(native[i].meaning,web[i].translation_ms);assert.equal(native[i].source,web[i].source_reference);}
console.log(`PASS: ${native.length} native bundled prayers match the reviewed web catalogue. Swift/Xcode compilation is not performed by this check.`);
