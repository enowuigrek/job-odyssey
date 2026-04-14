import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { CVData, CVLink } from './types';

// ---------------------------------------------------------------------------
// Font registration
// ---------------------------------------------------------------------------
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Inter-Italic.ttf', fontStyle: 'italic' },
    { src: '/fonts/Inter-BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
    { src: '/fonts/Inter-Light.ttf', fontWeight: 300 },
    { src: '/fonts/Inter-LightItalic.ttf', fontWeight: 300, fontStyle: 'italic' },
  ],
});

// Prevent automatic hyphenation — keep words whole
Font.registerHyphenationCallback(word => [word]);

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const TEAL = '#2D7D7D';
const BLACK = '#1C1C1C';
const GRAY = '#606060';
const PAGE_H_PADDING = 44;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: BLACK,
    paddingTop: 32,
    paddingBottom: 46,
    paddingHorizontal: PAGE_H_PADDING,
    lineHeight: 1.45,
  },
  // ── Header ──────────────────────────────────────────────────────────────
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 10.5,
    color: '#4a9a9a',
    fontStyle: 'italic',
    fontWeight: 300,
    marginBottom: 14,
  },
  contactBlock: {
    borderLeftWidth: 2.5,
    borderLeftColor: TEAL,
    paddingLeft: 9,
    marginBottom: 18,
  },
  contactLine: {
    fontStyle: 'italic',
    fontWeight: 300,
    fontSize: 8.5,
    marginBottom: 2,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3,
    fontSize: 8.5,
    fontStyle: 'italic',
    fontWeight: 300,
  },
  linkInline: {
    color: TEAL,
    textDecoration: 'none',
    fontStyle: 'italic',
    fontWeight: 300,
  },
  separatorText: {
    color: GRAY,
    marginHorizontal: 5,
    fontWeight: 300,
  },
  // ── Section headers ───────────────────────────────────────────────────
  sectionHeader: {
    marginTop: 16,
    marginBottom: 7,
    borderBottomWidth: 1.25,
    borderBottomColor: TEAL,
    paddingBottom: 2,
  },
  sectionTitle: {
    color: TEAL,
    fontSize: 10,
    fontWeight: 300,
    letterSpacing: 1.2,
  },
  // ── Body text ────────────────────────────────────────────────────────
  body: {
    fontWeight: 300,
    fontSize: 9,
    marginBottom: 4,
  },
  // ── Technologies ──────────────────────────────────────────────────────
  techRow: {
    flexDirection: 'row',
    marginBottom: 5.5,
  },
  techLabel: {
    fontWeight: 300,
    fontStyle: 'italic',
    color: TEAL,
    width: 140,
    flexShrink: 0,
    fontSize: 9,
  },
  techValue: {
    fontWeight: 300,
    flex: 1,
    fontSize: 9,
  },
  // ── Projects ──────────────────────────────────────────────────────────
  projectName: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginBottom: 1.5,
    letterSpacing: 0.4,
  },
  projectTagline: {
    fontSize: 9,
    color: TEAL,
    fontStyle: 'italic',
    fontWeight: 300,
    marginBottom: 4,
  },
  projectDesc: {
    fontWeight: 300,
    fontSize: 9,
    marginBottom: 3,
  },
  projectStack: {
    fontWeight: 300,
    fontSize: 8.5,
    color: GRAY,
    marginBottom: 2,
  },
  projectNote: {
    fontWeight: 300,
    fontStyle: 'italic',
    fontSize: 8.5,
    color: GRAY,
    marginBottom: 3,
  },
  projectLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    fontSize: 8.5,
    fontStyle: 'italic',
    fontWeight: 300,
  },
  // ── Experience ────────────────────────────────────────────────────────
  expCompanyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  expCompany: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginRight: 6,
  },
  expCompanyLink: {
    color: TEAL,
    textDecoration: 'none',
    fontWeight: 300,
    fontStyle: 'italic',
    fontSize: 8.5,
  },
  expRoleBlock: {
    borderLeftWidth: 2.5,
    borderLeftColor: TEAL,
    paddingLeft: 9,
    marginBottom: 5,
    marginTop: 2,
  },
  expRole: {
    fontStyle: 'italic',
    fontWeight: 300,
    fontSize: 9,
    marginBottom: 3,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  bulletDot: {
    width: 10,
    fontWeight: 300,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontWeight: 300,
    fontSize: 9,
  },
  // ── Education ────────────────────────────────────────────────────────
  eduBlock: {
    marginBottom: 7,
  },
  eduSchool: {
    fontWeight: 'bold',
    fontSize: 9.5,
    marginBottom: 1,
  },
  eduDetail: {
    fontWeight: 300,
    fontStyle: 'italic',
    fontSize: 9,
  },
  // ── Interests / RODO ──────────────────────────────────────────────────
  interests: {
    fontWeight: 300,
    fontSize: 9,
    marginBottom: 0,
  },
  rodo: {
    fontWeight: 300,
    fontSize: 7.5,
    color: GRAY,
    marginTop: 20,
    fontStyle: 'italic',
  },
  // ── Page number ───────────────────────────────────────────────────────
  pageNumber: {
    position: 'absolute',
    bottom: 22,
    right: PAGE_H_PADDING,
    fontSize: 8,
    color: '#BBBBBB',
    fontWeight: 300,
  },
});

// ---------------------------------------------------------------------------
// Helper sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function InlineLinks({ links }: { links: CVLink[] }) {
  return (
    <View style={s.linksRow}>
      {links.map((link, i) => (
        <React.Fragment key={link.label}>
          {i > 0 && <Text style={s.separatorText}>|</Text>}
          <Link src={link.url} style={s.linkInline}>
            {link.url.replace(/^https?:\/\//, '')}
          </Link>
        </React.Fragment>
      ))}
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main template
// ---------------------------------------------------------------------------

interface CVTemplateProps {
  data: CVData;
}

export function CVTemplate({ data }: CVTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <Text style={s.name}>{data.name}</Text>
        <Text style={s.subtitle}>{data.subtitle}</Text>

        <View style={s.contactBlock}>
          <Text style={s.contactLine}>
            {data.contact.location}, tel: {data.contact.phone}
          </Text>
          <Text style={s.contactLine}>e-mail: {data.contact.email}</Text>
          <InlineLinks links={data.contact.links} />
        </View>

        {/* ── PROFIL ──────────────────────────────────────────────── */}
        <SectionHeader title="PROFIL" />
        <Text style={s.body}>{data.profile}</Text>

        {/* ── PODEJŚCIE DO PRACY ──────────────────────────────────── */}
        <SectionHeader title="PODEJŚCIE DO PRACY" />
        <Text style={s.body}>{data.approach}</Text>

        {/* ── TECHNOLOGIE I NARZĘDZIA ─────────────────────────────── */}
        <SectionHeader title="TECHNOLOGIE I NARZĘDZIA" />
        {data.technologies.map(tech => (
          <View key={tech.category} style={s.techRow}>
            <Text style={s.techLabel}>{tech.category}</Text>
            <Text style={s.techValue}>{tech.items}</Text>
          </View>
        ))}

        {/* ── WYBRANE PROJEKTY ────────────────────────────────────── */}
        <SectionHeader title="WYBRANE PROJEKTY" />
        {data.projects.map(project => (
          <View key={project.name} wrap={false}>
            <Text style={s.projectName}>{project.name}</Text>
            <Text style={s.projectTagline}>{project.tagline}</Text>
            <Text style={s.projectDesc}>{project.description}</Text>
            <Text style={s.projectStack}>{project.stack}</Text>
            {project.note && <Text style={s.projectNote}>{project.note}</Text>}
            <View style={s.projectLinksRow}>
              {project.links.map((link, i) => (
                <React.Fragment key={link.label}>
                  {i > 0 && <Text style={s.separatorText}>|</Text>}
                  <Link src={link.url} style={s.linkInline}>
                    {link.label === 'GitHub' || link.label.endsWith('GitHub')
                      ? 'GitHub'
                      : link.url.replace(/^https?:\/\//, '')}
                  </Link>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* ── DOŚWIADCZENIE ZAWODOWE ──────────────────────────────── */}
        <SectionHeader title="DOŚWIADCZENIE ZAWODOWE" />
        {data.experience.map(exp => (
          <View key={exp.company}>
            <View style={s.expCompanyRow}>
              <Text style={s.expCompany}>{exp.company}</Text>
              {exp.companyLink && (
                <Link src={exp.companyLink.url} style={s.expCompanyLink}>
                  {exp.companyLink.url.replace(/^https?:\/\//, '')}
                </Link>
              )}
            </View>
            {exp.roles.map(role => (
              <View key={role.title} style={s.expRoleBlock}>
                <Text style={s.expRole}>{role.title}</Text>
                {role.bullets.map((bullet, bi) => (
                  <Bullet key={bi} text={bullet} />
                ))}
              </View>
            ))}
          </View>
        ))}

        {/* ── WYKSZTAŁCENIE ───────────────────────────────────────── */}
        <SectionHeader title="WYKSZTAŁCENIE" />
        {data.education.map(edu => (
          <View key={edu.school} style={s.eduBlock}>
            <Text style={s.eduSchool}>{edu.school}</Text>
            <Text style={s.eduDetail}>{edu.degree} | {edu.years}</Text>
          </View>
        ))}

        {/* ── ZAINTERESOWANIA ─────────────────────────────────────── */}
        <SectionHeader title="ZAINTERESOWANIA" />
        <Text style={s.interests}>{data.interests}</Text>

        {/* ── RODO ────────────────────────────────────────────────── */}
        <Text style={s.rodo}>{data.rodo}</Text>

        {/* ── Page numbers ────────────────────────────────────────── */}
        <Text
          style={s.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
