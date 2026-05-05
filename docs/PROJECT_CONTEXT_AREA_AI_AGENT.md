# PROJECT CONTEXT: AREA / AI Agent Business
Date: 2026-05-03
Language: German conversation, English project files

## Founder / User Context
- Founder wants to build a company in Vienna under a free trade license (freies Gewerbe), focused on solving time-consuming IT workflows for external companies.
- Founder wants to learn and use AI tools for planning, building and operating the company and its products.
- Current technical background: built several FiveM / GTA roleplay servers using open-source scripts; understands software/server/database concepts; does not currently program independently but wants to learn.
- The assistant should not discourage the project, underestimate the founder, assume inability to learn, or introduce artificial psychological limitations.
- The assistant should clearly identify weak spots, risks, bad paths and implementation traps, while staying constructive.
- The assistant should preserve overall project context and document decisions.

## Long-Term Business Goal
The long-term goal is a general AI / IT automation company that builds and operates solutions for external businesses. The founder does not primarily want to sell a standalone software product; the founder wants to operate useful systems/services for clients.

## Strategic Product Direction
AREA is not the final product. AREA is currently the first active module/tool and may become one component inside a broader AI agent platform for real-estate agents.

The future real-estate AI agent can include:
- AI telephone conversations with customers/leads.
- Text replies via WhatsApp or similar messaging channels.
- Automatic scheduling and calendar entries for property viewings.
- Follow-up communication.
- AREA-style property/exposé analysis.
- Internal workflow automation for real-estate agents.

The founder compares this future platform to an Office 365-like suite: AREA would be one tool/module inside a larger set of agent capabilities.

## Current Target Group
Initial strategic focus: smaller real-estate agencies and solo real-estate agents, especially in Austria/Vienna at first, with potential international expansion later.

## AREA Current Role
AREA currently functions mostly as a URL-based real-estate exposé analysis tool. It analyzes an existing/public listing and generates a structured report.

Current/desired retained report functions include:
- Object data extraction.
- Quality checks.
- Missing information detection.
- Contradiction detection.
- Text quality evaluation.
- Sales strategy.
- Core sales arguments.
- Likely customer objections and objection handling.
- Market/price assessment.
- Optional optimized short exposé / text suggestion functionality.
- PDF report export.

## Key Product Decision: Two Modes
AREA should have two clearly separated modes:

### Mode 1: Inserat analysieren
Input: URL of an already published/existing listing.
Purpose: Analyze an existing, old, external or current listing and identify weaknesses, missing data, contradictions, sales arguments, objections, strategy and market assessment.

### Mode 2: Exposé vorbereiten
Input options long-term:
- Raw text / unfinished exposé copy.
- Structured object data form.
- Combined structured data + free text/notes.
- PDF/Word upload.
- Later possible automatic input recognition.

Purpose: Help prepare an unpublished exposé before it goes live.
Important: The system should not automatically generate a finished AI text by default. The agent should give the user the option to generate AI text based on the provided information.

## Output Direction for Exposé vorbereiten
The central output should preserve AREA's existing strengths: sales strategy, core arguments, objections, quality checks and missing information. AI text generation should be available as an explicit action, not forced/automatic.

## B2C Consumer Direction
Possible future option: AREA could also serve consumers, but this is currently a parked idea. B2B real-estate agents are the near-term focus because B2C would require a larger product, different positioning, different UX and potentially more legal/consumer-facing complexity.

## PDF Review Notes from Uploaded Reports
Two AREA PDF exports were reviewed for the same property:
- `Haus 10 bezirk (1).pdf` - before update.
- `modernes haus 10 bezirk (2).pdf` - after update.

Observed product/report improvements in the updated PDF:
- Cleaner, more focused missing-information section.
- Confidence increased from 93% to 98%.
- Critical/warning count reduced to 2 missing fields.
- Copyable placeholder style appears to be added for missing data.
- Sales strategy and objection handling remain present.

Observed issues / alarms in the updated PDF:
- Location header shows `10 Wien` instead of `1100 Wien`.
- Object data row contains an unlabeled `0` field.
- Placeholder values in PDF render as strange characters such as `"#` or dashes.
- UI elements such as `Kopieren` appear inside the PDF export, which may be undesirable in a client/report PDF.
- Page 4 is mostly empty because only the optimized short exposé appears there.
- Text quality score dropped from 62/100 to 57/100 despite higher confidence; this may be valid, but it should be explainable to users.
- Some spelling/wording issues appear, e.g. `Detailierte` instead of `Detaillierte`, and possible `Rolläden` vs `Rollläden`.
- The updated report removed some explicit contradiction/warning cards from the first version; this may make the report cleaner, but could also reduce transparency.

## Current Strategic Interpretation
AREA should become a practical workbench for small real-estate agents, not just a report generator. Its immediate value should be: helping a small agent improve listings, prepare professional sales arguments, identify missing information, and handle objections faster.

## Next Open Product Decision
Clarify how the optional AI text generation should behave in AREA:
- Should it be a single button for a short exposé?
- Should it generate multiple text types?
- Should it generate text only after missing information is resolved?
- Should it support tone/style presets?

