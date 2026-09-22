#!/usr/bin/env node
// Google Scholar inclusion floor: any built page that declares itself a journal article
// (citation_journal_title) must carry title, author, a publication date, and a PDF that
// exists in the build. Computo shipped for months without citation_pdf_url and nobody noticed:
// https://computo-journal.org/blog/2026-07-26-google-scholar/
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve(process.argv[2] || '_site');
const REQUIRED = ['citation_title', 'citation_author', 'citation_publication_date', 'citation_pdf_url'];
const meta = (html, name) => [...html.matchAll(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'g'))].map(m => m[1]).filter(Boolean);
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name === 'index.html' ? [path.join(dir, e.name)] : []);

const failures = [];
let articles = 0;
for (const file of walk(SITE)) {
  const html = fs.readFileSync(file, 'utf8');
  if (!meta(html, 'citation_journal_title').length) continue;
  articles++;
  const route = '/' + path.relative(SITE, path.dirname(file)) + '/';
  for (const name of REQUIRED) if (!meta(html, name).length) failures.push(`${route}: missing ${name}`);
  for (const url of meta(html, 'citation_pdf_url')) {
    const local = path.join(SITE, decodeURIComponent(new URL(url).pathname));
    if (!fs.existsSync(local)) failures.push(`${route}: citation_pdf_url ${url} is not in the build output`);
  }
}
if (failures.length) { console.error(`check-scholar-meta: ${failures.length} failure(s) across ${articles} article pages\n  ${failures.join('\n  ')}`); process.exit(1); }
console.log(`check-scholar-meta: passed (${articles} article pages)`);
