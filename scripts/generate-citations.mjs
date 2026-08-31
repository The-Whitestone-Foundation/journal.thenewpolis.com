#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT = path.join(ROOT, "content", "archives");
const AUTHORS = path.join(ROOT, "content", "authors");
const OUTPUT = path.join(ROOT, "public", "citations", "archives");
const SITE = "https://journal.thenewpolis.com";
const JOURNAL = "The New Polis Journal";
const ABBREVIATION = "TNPJ";
const ISSN = "2771-9782";

function frontMatter(file) {
	const match = fs.readFileSync(file, "utf8").match(/^---\s*\n([\s\S]*?)\n---/);
	if (!match) throw new Error(`Missing front matter: ${file}`);
	return yaml.load(match[1]) || {};
}

const authorNames = new Map(fs.readdirSync(AUTHORS).filter((name) => name.endsWith(".md")).map((name) => {
	const data = frontMatter(path.join(AUTHORS, name));
	return [path.basename(name, ".md"), String(data.name || path.basename(name, ".md"))];
}));

function names(value) {
	const keys = Array.isArray(value) ? value : String(value || "").split(",");
	return keys.map((key) => key.trim()).filter(Boolean).map((key) => {
		if (!authorNames.has(key)) throw new Error(`Unresolved author: ${key}`);
		return authorNames.get(key);
	});
}

function cslAuthor(name) {
	if (name === "The New Polis Journal Editors") return { literal: name };
	const parts = name.trim().split(/\s+/);
	const family = parts.pop() || name;
	return { given: parts.join(" "), family };
}

function pageParts(value) {
	const match = String(value || "").match(/^(\d+)\s*[-–]\s*(\d+)$/);
	return match ? [match[1], match[2]] : [String(value || ""), ""];
}

function ris(data, issue, slug, people) {
	const [start, end] = pageParts(data.pages);
	const lines = [data.resource_type === "textDocument-other" ? "TY  - GEN" : "TY  - JOUR", `TI  - ${data.title}`];
	for (const name of people) lines.push(`AU  - ${name}`);
	lines.push(`AB  - ${data.description}`, `JF  - ${JOURNAL}`, `JO  - ${ABBREVIATION}`, `SN  - ${ISSN}`, `VL  - ${data.volume}`, `IS  - ${data.issue}`);
	if (start) lines.push(`SP  - ${start}`);
	if (end) lines.push(`EP  - ${end}`);
	lines.push(`PY  - ${data.year}`);
	if (data.doi) lines.push(`DO  - ${data.doi}`);
	lines.push(`UR  - ${SITE}/archives/${issue}/${slug}/`, `L1  - ${SITE}${data.pdf}`);
	for (const keyword of data.keywords) lines.push(`KW  - ${keyword}`);
	lines.push("ER  -", "");
	return lines.join("\n");
}

function csl(data, issue, slug, people) {
	return `${JSON.stringify([{
		id: data.nanoid,
		type: data.resource_type === "textDocument-other" ? "document" : "article-journal",
		title: data.title,
		author: people.map(cslAuthor),
		abstract: data.description,
		"container-title": JOURNAL,
		"container-title-short": ABBREVIATION,
		ISSN,
		volume: String(data.volume),
		issue: String(data.issue),
		page: String(data.pages),
		issued: { "date-parts": [[Number(data.year)]] },
		publisher: "Whitestone Publications",
		URL: `${SITE}/archives/${issue}/${slug}/`,
		...(data.doi ? { DOI: String(data.doi) } : {}),
		keyword: data.keywords.join(", "),
	}], null, 2)}\n`;
}

fs.rmSync(path.join(ROOT, "public", "citations"), { recursive: true, force: true });
let count = 0;
for (const issue of fs.readdirSync(CONTENT, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^\d+\.\d+$/.test(entry.name)).map((entry) => entry.name).sort()) {
	const out = path.join(OUTPUT, issue);
	fs.mkdirSync(out, { recursive: true });
	for (const name of fs.readdirSync(path.join(CONTENT, issue)).filter((file) => file.endsWith(".md") && file !== "index.md").sort()) {
		const file = path.join(CONTENT, issue, name);
		const data = frontMatter(file);
		const slug = path.basename(name, ".md");
		const people = names(data.authors || data.author);
		for (const key of ["nanoid", "title", "description", "volume", "issue", "pages", "year", "pdf", "ris", "csl_json"]) if (!data[key]) throw new Error(`Missing ${key}: ${file}`);
		if (!people.length || !Array.isArray(data.keywords) || !data.keywords.length) throw new Error(`Missing authors or keywords: ${file}`);
		if (!fs.existsSync(path.join(ROOT, "content", String(data.pdf).replace(/^\//, "")))) throw new Error(`Missing PDF: ${data.pdf}`);
		if (data.ris !== `/citations/archives/${issue}/${slug}.ris` || data.csl_json !== `/citations/archives/${issue}/${slug}.csl.json`) throw new Error(`Citation path mismatch: ${file}`);
		fs.writeFileSync(path.join(out, `${slug}.ris`), ris(data, issue, slug, people));
		fs.writeFileSync(path.join(out, `${slug}.csl.json`), csl(data, issue, slug, people));
		count += 1;
	}
}

if (count !== 16) throw new Error(`Expected 16 citation pairs, generated ${count}`);
console.log(`Generated ${count} RIS/CSL JSON citation pairs.`);
