import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const subject = z.object({
	label: z.string().min(1),
	scheme: z.literal("FAST"),
	identifier: z.string().regex(/^fst\d{8}$/),
	uri: z.string().regex(/^https:\/\/id\.worldcat\.org\/fast\/\d+$/),
	category: z.enum(["topical", "geographic", "corporate", "form-genre", "event", "meeting", "personal", "title", "chronological"]),
});

const publication = z.object({
	nanoid: z.string().regex(/^[A-Za-z0-9]{6}$/),
	doi: z.string().regex(/^$|^10\.\d{4,9}\/\S+$/),
	title: z.string().min(1),
	description: z.string().min(1),
	authors: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
	year: z.coerce.number().int().min(1900),
	keywords: z.array(z.string().min(1)).min(1),
	subjects: z.array(subject).min(1),
	ris: z.string().regex(/^\/citations\/.+\.ris$/),
	csl_json: z.string().regex(/^\/citations\/.+\.csl\.json$/),
});

const article = publication.extend({
	volume: z.coerce.number().int().positive(),
	issue: z.coerce.number().int().positive(),
	pages: z.string().regex(/^\d+-\d+$/),
	pdf: z.string().regex(/^\/archives\/.+\.pdf$/i),
	resource_type: z.enum(["textDocument-journalArticle", "textDocument-other"]).optional(),
});

export default function(data) {
	let result = z.object({ draft: z.boolean().optional() }).safeParse(data);
	const input = String(data.page?.inputPath || "").replaceAll("\\", "/");
	if (/\/content\/archives\/\d+\.\d+\/[^/]+\.md$/.test(input) && !input.endsWith("/index.md")) result = article.safeParse(data);
	else if (/\/content\/blog\/.+\.md$/.test(input)) result = publication.safeParse(data);
	if (result.error) throw fromZodError(result.error, { prefix: input || "content" });
}
