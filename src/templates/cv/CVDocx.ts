import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  BorderStyle,
  TabStopType,
} from 'docx';
import type { CVData, CVLink } from './types';

// ---------------------------------------------------------------------------
// Design tokens (mirroring CVTemplate.tsx)
// ---------------------------------------------------------------------------
const TEAL = '2D7D7D';
const TEAL_LIGHT = '4a9a9a';
const GRAY = '606060';
const FONT = 'Calibri';

// Page margins in twips (1 pt = 20 twips) — matching PDF padding
const MARGIN_TOP = 32 * 20;      // 640
const MARGIN_BOTTOM = 46 * 20;   // 920
const MARGIN_H = 44 * 20;        // 880

// A4 content width = 11906 - 2×880 = 10146 twips
// Tech label: 140 pt (same as PDF) = 2800 twips
const TECH_TAB = 140 * 20;

// Left border matching PDF borderLeftWidth: 2.5 pt = 20 eighths
const LEFT_BORDER = {
  left: { style: BorderStyle.SINGLE, size: 20, color: TEAL, space: 6 },
};
const LEFT_INDENT = { left: 180 }; // ~9 pt indent for bordered blocks

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type RunOpts = {
  bold?: boolean;
  italics?: boolean;
  color?: string;
  size?: number;        // half-points: 18 = 9 pt
  characterSpacing?: number; // twips
};

function run(text: string, opts: RunOpts = {}): TextRun {
  return new TextRun({
    text,
    font: FONT,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color,
    size: opts.size ?? 18,
    characterSpacing: opts.characterSpacing,
  });
}

function sectionHeader(title: string): Paragraph {
  return new Paragraph({
    children: [run(title, { color: TEAL, size: 22, characterSpacing: 40 })],
    spacing: { before: 360, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 10, color: TEAL, space: 4 },
    },
  });
}

function hyperlink(link: CVLink, displayText?: string): ExternalHyperlink {
  const text = displayText ?? link.url.replace(/^https?:\/\//, '');
  return new ExternalHyperlink({
    link: link.trackedUrl ?? link.url,
    children: [
      new TextRun({
        text,
        font: FONT,
        color: TEAL,
        italics: true,
        size: 17,
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function buildCVDocx(data: CVData): Promise<Blob> {
  const children: Paragraph[] = [];

  // ── Name ──────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [run(data.name, { bold: true, size: 56 })],
    spacing: { after: 160 },
  }));

  // ── Subtitle ────────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [run(data.subtitle, { italics: true, color: TEAL_LIGHT, size: 21 })],
    spacing: { after: 320 },
  }));

  // ── Contact block (left border) ─────────────────────────────────────
  children.push(new Paragraph({
    children: [run(`${data.contact.location}, tel: ${data.contact.phone}`, { italics: true, size: 17 })],
    border: LEFT_BORDER,
    indent: LEFT_INDENT,
    spacing: { after: 40 },
  }));

  children.push(new Paragraph({
    children: [run(`e-mail: ${data.contact.email}`, { italics: true, size: 17 })],
    border: LEFT_BORDER,
    indent: LEFT_INDENT,
    spacing: { after: 60 },
  }));

  // Contact links (left-bordered)
  const contactLinkChildren: (TextRun | ExternalHyperlink)[] = [];
  data.contact.links.forEach((link, i) => {
    if (i > 0) contactLinkChildren.push(run('   |   ', { color: GRAY, size: 17 }));
    contactLinkChildren.push(hyperlink(link));
  });
  children.push(new Paragraph({
    children: contactLinkChildren,
    border: LEFT_BORDER,
    indent: LEFT_INDENT,
    spacing: { after: 80 },
  }));

  // ── PROFIL ──────────────────────────────────────────────────────────
  children.push(sectionHeader((data.profileTitle || 'PROFIL').toUpperCase()));
  children.push(new Paragraph({
    children: [run(data.profile, { size: 18 })],
    spacing: { after: 100 },
  }));

  // ── PODEJŚCIE DO PRACY (optional) ───────────────────────────────────
  if (data.showApproach !== false && data.approach) {
    children.push(sectionHeader((data.approachTitle || 'PODEJŚCIE DO PRACY').toUpperCase()));
    children.push(new Paragraph({
      children: [run(data.approach, { size: 18 })],
      spacing: { after: 100 },
    }));
  }

  // ── TECHNOLOGIE I NARZĘDZIA ─────────────────────────────────────────
  children.push(sectionHeader('TECHNOLOGIE I NARZĘDZIA'));
  for (const tech of data.technologies) {
    children.push(new Paragraph({
      tabStops: [{ type: TabStopType.LEFT, position: TECH_TAB }],
      children: [
        run(tech.category, { italics: true, color: TEAL, size: 18 }),
        new TextRun({ text: '\t', font: FONT, size: 18 }),
        run(tech.items, { size: 18 }),
      ],
      spacing: { after: 110 },
    }));
  }

  // ── WYBRANE PROJEKTY ────────────────────────────────────────────────
  children.push(sectionHeader('WYBRANE PROJEKTY'));
  for (const project of data.projects) {
    children.push(new Paragraph({
      children: [run(project.name, { bold: true, size: 19 })],
      spacing: { before: 60, after: 30 },
    }));
    children.push(new Paragraph({
      children: [run(project.tagline, { italics: true, color: TEAL, size: 18 })],
      spacing: { after: 80 },
    }));
    children.push(new Paragraph({
      children: [run(project.description, { size: 18 })],
      spacing: { after: 60 },
    }));
    children.push(new Paragraph({
      children: [run(project.stack, { size: 17, color: GRAY })],
      spacing: { after: project.note ? 40 : 60 },
    }));
    if (project.note) {
      children.push(new Paragraph({
        children: [run(project.note, { italics: true, size: 17, color: GRAY })],
        spacing: { after: 60 },
      }));
    }
    // Project links
    const projLinkChildren: (TextRun | ExternalHyperlink)[] = [];
    project.links.forEach((l, i) => {
      if (i > 0) projLinkChildren.push(run('   |   ', { color: GRAY, size: 17 }));
      const label =
        l.label === 'GitHub' || l.label.endsWith('GitHub')
          ? 'GitHub'
          : l.url.replace(/^https?:\/\//, '');
      projLinkChildren.push(hyperlink(l, label));
    });
    children.push(new Paragraph({ children: projLinkChildren, spacing: { after: 240 } }));
  }

  // ── DOŚWIADCZENIE ZAWODOWE ──────────────────────────────────────────
  children.push(sectionHeader('DOŚWIADCZENIE ZAWODOWE'));
  for (const exp of data.experience) {
    const companyChildren: (TextRun | ExternalHyperlink)[] = [
      run(exp.company, { bold: true, size: 19 }),
    ];
    if (exp.companyLink) {
      companyChildren.push(run('   ', { size: 17 }));
      companyChildren.push(hyperlink(exp.companyLink));
    }
    children.push(new Paragraph({
      children: companyChildren,
      spacing: { before: 200, after: 40 },
    }));

    for (const role of exp.roles) {
      children.push(new Paragraph({
        children: [run(role.title, { italics: true, size: 18 })],
        border: LEFT_BORDER,
        indent: LEFT_INDENT,
        spacing: { before: 40, after: 60 },
      }));
      for (const bullet of role.bullets) {
        children.push(new Paragraph({
          children: [run('• ' + bullet, { size: 18 })],
          border: LEFT_BORDER,
          indent: LEFT_INDENT,
          spacing: { after: 50 },
        }));
      }
      // Small gap after last bullet
      children.push(new Paragraph({ children: [], spacing: { after: 40 } }));
    }
  }

  // ── WYKSZTAŁCENIE ───────────────────────────────────────────────────
  children.push(sectionHeader('WYKSZTAŁCENIE'));
  for (const edu of data.education) {
    children.push(new Paragraph({
      children: [run(edu.school, { bold: true, size: 19 })],
      spacing: { before: 40, after: 20 },
    }));
    children.push(new Paragraph({
      children: [run(`${edu.degree} | ${edu.years}`, { italics: true, size: 18 })],
      spacing: { after: 140 },
    }));
  }

  // ── SEKCJE WŁASNE ───────────────────────────────────────────────────
  if (data.customSections) {
    for (const sec of data.customSections) {
      children.push(sectionHeader(sec.title.toUpperCase()));
      children.push(new Paragraph({
        children: [run(sec.content, { size: 18 })],
        spacing: { after: 100 },
      }));
    }
  }

  // ── ZAINTERESOWANIA ─────────────────────────────────────────────────
  children.push(sectionHeader('ZAINTERESOWANIA'));
  children.push(new Paragraph({
    children: [run(data.interests, { size: 18 })],
    spacing: { after: 100 },
  }));

  // ── RODO ────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [run(data.rodo, { italics: true, size: 15, color: GRAY })],
    spacing: { before: 400, after: 0 },
  }));

  // ---------------------------------------------------------------------------
  // Build document
  // ---------------------------------------------------------------------------
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: MARGIN_TOP,
              right: MARGIN_H,
              bottom: MARGIN_BOTTOM,
              left: MARGIN_H,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
