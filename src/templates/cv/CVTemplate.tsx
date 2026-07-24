import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Link,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { CVData, CVLink, CVRole } from './types';
import { TEAL, TEAL_LIGHT, BLACK, GRAY } from './colors';
import { formatTechCategory, formatInterests } from './format';
import { getSectionOrder } from './sectionOrder';

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
    lineHeight: 1.5,
  },
  // ── Header ──────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginLeft: 16,
    objectFit: 'cover',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.3,
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 10.5,
    color: TEAL_LIGHT,
    fontStyle: 'italic',
    fontWeight: 300,
    marginBottom: 16,
    lineHeight: 1,
  },
  contactBlock: {
    borderLeftWidth: 2.5,
    borderLeftColor: TEAL,
    paddingLeft: 10,
    marginBottom: 20,
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
    marginTop: 18,
    marginBottom: 8,
    borderBottomWidth: 1.25,
    borderBottomColor: TEAL,
    paddingBottom: 3,
  },
  sectionTitle: {
    color: TEAL,
    fontSize: 11,
    fontWeight: 300,
    letterSpacing: 2,
  },
  // ── Body text ────────────────────────────────────────────────────────
  body: {
    fontWeight: 300,
    fontSize: 9,
    marginBottom: 5,
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
  projectBody: {
    borderLeftWidth: 2.5,
    borderLeftColor: TEAL,
    paddingLeft: 9,
    marginTop: 3,
    marginBottom: 4,
  },
  projectDesc: {
    fontWeight: 300,
    fontSize: 9,
    marginBottom: 3,
  },
  projectStack: {
    fontWeight: 400,
    fontSize: 8.5,
    color: BLACK,
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
    fontWeight: 'bold',
    fontSize: 9,
    marginBottom: 3,
  },
  expRoleYears: {
    fontWeight: 300,
    fontStyle: 'italic',
    color: GRAY,
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
  eduDetailBlock: {
    borderLeftWidth: 2.5,
    borderLeftColor: TEAL,
    paddingLeft: 9,
    marginTop: 2,
    marginBottom: 2,
  },
  eduDetail: {
    fontWeight: 300,
    fontStyle: 'italic',
    fontSize: 9,
  },
  // ── Certificates ──────────────────────────────────────────────────────
  certRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  certName: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: TEAL,
    textDecoration: 'none',
    marginRight: 6,
  },
  certMeta: {
    fontWeight: 300,
    fontStyle: 'italic',
    fontSize: 8.5,
    color: GRAY,
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
          <Link src={link.trackedUrl ?? link.url} style={s.linkInline}>
            {link.url.replace(/^https?:\/\//, '')}
          </Link>
        </React.Fragment>
      ))}
    </View>
  );
}

/** Stanowisko pogrubione, lata przy nim jaśniejsze — rozróżnia wagę informacji zamiast jednej linii tym samym stylem. */
function RoleLabel({ role }: { role: CVRole }) {
  return (
    <Text style={s.expRole}>
      {role.title}
      {role.years && <Text style={s.expRoleYears}> | {role.years}</Text>}
    </Text>
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
  const sectionOrder = getSectionOrder(data);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={s.headerRow}>
          <View style={s.headerText}>
            <Text style={s.name}>{data.name}</Text>
            <Text style={s.subtitle}>{data.subtitle}</Text>

            <View style={s.contactBlock}>
              <Text style={s.contactLine}>
                {data.contact.location}, tel: {data.contact.phone}
              </Text>
              <Text style={s.contactLine}>e-mail: {data.contact.email}</Text>
              <InlineLinks links={data.contact.links} />
            </View>
          </View>
          {data.showPhoto !== false && data.photoUrl && (
            <Image src={data.photoUrl} style={s.photo} />
          )}
        </View>

        {/* ── Content sections, in user-defined order ─────────────── */}
        {sectionOrder.map((key) => (
          <React.Fragment key={key}>
            {key === 'profile' && (
              <>
                <SectionHeader title={(data.profileTitle || 'OPIS').toUpperCase()} />
                <Text style={s.body}>{data.profile}</Text>
                {data.showApproach !== false && data.approach ? (
                  <>
                    <SectionHeader title={(data.approachTitle || 'PODEJŚCIE DO PRACY').toUpperCase()} />
                    <Text style={s.body}>{data.approach}</Text>
                  </>
                ) : null}
              </>
            )}

            {key === 'technologies' && data.showTechnologies !== false && (
              <>
                <SectionHeader title={(data.technologiesTitle || 'TECHNOLOGIE I NARZĘDZIA').toUpperCase()} />
                {data.technologies.map(tech => (
                  <View key={tech.category} style={s.techRow}>
                    <Text style={s.techLabel}>{formatTechCategory(tech.category)}</Text>
                    <Text style={s.techValue}>{tech.items}</Text>
                  </View>
                ))}
              </>
            )}

            {key === 'projects' && data.showProjects !== false && (
              <>
                <SectionHeader title="WYBRANE PROJEKTY" />
                {data.projects.map(project => (
                  <View key={project.name} wrap={false}>
                    <Text style={s.projectName}>{project.name}</Text>
                    <Text style={s.projectTagline}>{project.tagline}</Text>
                    <View style={s.projectBody}>
                    <Text style={s.projectDesc}>{project.description}</Text>
                    <Text style={s.projectStack}>{project.stack}</Text>
                    {project.note && <Text style={s.projectNote}>{project.note}</Text>}
                    <View style={s.projectLinksRow}>
                      {project.links.map((link, li) => (
                        <React.Fragment key={link.label}>
                          {li > 0 && <Text style={s.separatorText}>|</Text>}
                          <Link src={link.trackedUrl ?? link.url} style={s.linkInline}>
                            {link.label === 'GitHub' || link.label.endsWith('GitHub')
                              ? 'GitHub'
                              : link.url.replace(/^https?:\/\//, '')}
                          </Link>
                        </React.Fragment>
                      ))}
                    </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {key === 'experience' && (
              <>
                <SectionHeader title="DOŚWIADCZENIE ZAWODOWE" />
                {data.experience.map(exp => (
                  <View key={exp.company}>
                    {/* Company header + first role block kept together — prevents orphan heading */}
                    <View wrap={false}>
                      <View style={s.expCompanyRow}>
                        <Text style={s.expCompany}>{exp.company}</Text>
                        {exp.companyLink && (
                          <Link src={exp.companyLink.trackedUrl ?? exp.companyLink.url} style={s.expCompanyLink}>
                            {exp.companyLink.url.replace(/^https?:\/\//, '')}
                          </Link>
                        )}
                      </View>
                      {exp.roles[0] && (
                        <View style={s.expRoleBlock}>
                          <RoleLabel role={exp.roles[0]} />
                          {exp.roles[0].bullets.map((bullet, bi) => (
                            <Bullet key={bi} text={bullet} />
                          ))}
                        </View>
                      )}
                    </View>
                    {/* Remaining roles can break freely */}
                    {exp.roles.slice(1).map(role => (
                      <View key={role.title} style={s.expRoleBlock} wrap={false}>
                        <RoleLabel role={role} />
                        {role.bullets.map((bullet, bi) => (
                          <Bullet key={bi} text={bullet} />
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}

            {key === 'education' && (
              <>
                <SectionHeader title="WYKSZTAŁCENIE" />
                {data.education.map(edu => (
                  <View key={edu.school} style={s.eduBlock}>
                    <Text style={s.eduSchool}>{edu.school}</Text>
                    <View style={s.eduDetailBlock}>
                      <Text style={s.eduDetail}>{edu.degree} | {edu.years}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {key === 'custom' && data.customSections && data.customSections.map(sec => (
              <View key={sec.id}>
                <SectionHeader title={sec.title.toUpperCase()} />
                <Text style={s.body}>{sec.content}</Text>
              </View>
            ))}

            {key === 'certificates' && data.showCertificates !== false && data.certificates && data.certificates.length > 0 && (
              <>
                <SectionHeader title={(data.certificatesTitle || 'Certyfikaty').toUpperCase()} />
                {data.certificates.map((cert, ci) => (
                  <View key={ci} style={s.certRow}>
                    {cert.url ? (
                      <Link src={cert.trackedUrl ?? cert.url} style={s.certName}>
                        {cert.name}
                      </Link>
                    ) : (
                      <Text style={{ ...s.certName, color: BLACK }}>{cert.name}</Text>
                    )}
                    <Text style={s.certMeta}>
                      {cert.issuer}{cert.issuer && cert.year ? ' · ' : ''}{cert.year}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {key === 'interests' && (
              <>
                <SectionHeader title="ZAINTERESOWANIA" />
                <Text style={s.interests}>{formatInterests(data.interests)}</Text>
              </>
            )}

          </React.Fragment>
        ))}

        {/* ── RODO — always last, spacer pins it to the page bottom ── */}
        <View style={{ flexGrow: 1 }} />
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
