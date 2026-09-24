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
    width: 52,
    height: 52,
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
    // Max ~1 przy 11pt: przy większym rozstrzeleniu parsery ATS (pdf.js, poppler)
    // czytają nagłówek jako "D O Ś W I A D C Z E N I E" i nie rozpoznają sekcji.
    // Sprawdzone na wyrenderowanym PDF, 0.8 daje zapas.
    letterSpacing: 0.8,
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
    alignSelf: 'flex-start',
  },
  projectDesc: {
    fontWeight: 300,
    fontSize: 9,
    marginBottom: 3,
  },
  projectStack: {
    fontWeight: 'bold',
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
    alignSelf: 'flex-start',
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

function TechRow({ tech }: { tech: CVData['technologies'][number] }) {
  return (
    <View style={s.techRow}>
      <Text style={s.techLabel}>{formatTechCategory(tech.category)}</Text>
      <Text style={s.techValue}>{tech.items}</Text>
    </View>
  );
}

function EduEntry({ edu }: { edu: CVData['education'][number] }) {
  return (
    <View style={s.eduBlock}>
      <Text style={s.eduSchool}>{edu.school}</Text>
      <View style={s.eduDetailBlock}>
        <Text style={s.eduDetail}>{edu.degree} | {edu.years}</Text>
      </View>
    </View>
  );
}

function CertRow({ cert }: { cert: NonNullable<CVData['certificates']>[number] }) {
  return (
    <View style={s.certRow}>
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
  );
}

function ProjectEntry({ project }: { project: CVData['projects'][number] }) {
  return (
    <>
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
                {link.url.replace(/^https?:\/\//, '')}
              </Link>
            </React.Fragment>
          ))}
        </View>
      </View>
    </>
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

/** "ŁUKASZ NOWAK" → "Łukasz Nowak" — imię w CV bywa wersalikami, w metadanych PDF ma być normalnie */
function displayName(name: string): string {
  const trimmed = name.trim();
  if (trimmed !== trimmed.toLocaleUpperCase('pl')) return trimmed;
  return trimmed
    .toLocaleLowerCase('pl')
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('pl'));
}

export function CVTemplate({ data }: CVTemplateProps) {
  const sectionOrder = getSectionOrder(data);
  const person = displayName(data.name || '');
  return (
    // Metadane czytają systemy rekrutacyjne (ATS) i podgląd PDF — bez tytułu
    // część z nich pokazuje "Untitled"; język ułatwia parsowanie polskiego tekstu
    <Document
      title={person ? `${person} CV` : 'CV'}
      author={person || undefined}
      subject={data.subtitle || undefined}
      language="pl"
    >
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
                {/* Nagłówek + tekst razem — zapobiega osieroconemu nagłówkowi na dole strony */}
                <View wrap={false}>
                  <SectionHeader title={(data.profileTitle || 'OPIS').toUpperCase()} />
                  <Text style={s.body}>{data.profile}</Text>
                </View>
                {data.showApproach !== false && data.approach ? (
                  <View wrap={false}>
                    <SectionHeader title={(data.approachTitle || 'PODEJŚCIE DO PRACY').toUpperCase()} />
                    <Text style={s.body}>{data.approach}</Text>
                  </View>
                ) : null}
              </>
            )}

            {key === 'technologies' && data.showTechnologies !== false && (
              <>
                {data.technologies.length > 0 ? (
                  <>
                    <View wrap={false}>
                      <SectionHeader title={(data.technologiesTitle || 'TECHNOLOGIE I NARZĘDZIA').toUpperCase()} />
                      <TechRow tech={data.technologies[0]} />
                    </View>
                    {data.technologies.slice(1).map(tech => (
                      <TechRow key={tech.category} tech={tech} />
                    ))}
                  </>
                ) : (
                  <SectionHeader title={(data.technologiesTitle || 'TECHNOLOGIE I NARZĘDZIA').toUpperCase()} />
                )}
              </>
            )}

            {key === 'projects' && data.showProjects !== false && (
              <>
                {data.projects.length > 0 ? (
                  <>
                    {/* Nagłówek sekcji + pierwszy projekt razem — zapobiega osieroconemu
                        nagłówkowi na dole strony (ten sam wzorzec co firma + pierwsza rola
                        w Doświadczeniu) */}
                    <View wrap={false}>
                      <SectionHeader title="WYBRANE PROJEKTY" />
                      <ProjectEntry project={data.projects[0]} />
                    </View>
                    {data.projects.slice(1).map(project => (
                      <View key={project.name} wrap={false}>
                        <ProjectEntry project={project} />
                      </View>
                    ))}
                  </>
                ) : (
                  <SectionHeader title="WYBRANE PROJEKTY" />
                )}
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
                {data.education.length > 0 ? (
                  <>
                    <View wrap={false}>
                      <SectionHeader title="WYKSZTAŁCENIE" />
                      <EduEntry edu={data.education[0]} />
                    </View>
                    {data.education.slice(1).map(edu => (
                      <EduEntry key={edu.school} edu={edu} />
                    ))}
                  </>
                ) : (
                  <SectionHeader title="WYKSZTAŁCENIE" />
                )}
              </>
            )}

            {key === 'custom' && data.customSections && data.customSections.map(sec => (
              <View key={sec.id} wrap={false}>
                <SectionHeader title={sec.title.toUpperCase()} />
                <Text style={s.body}>{sec.content}</Text>
              </View>
            ))}

            {key === 'certificates' && data.showCertificates !== false && data.certificates && data.certificates.length > 0 && (
              <>
                {/* Nagłówek + pierwszy certyfikat razem — zapobiega osieroconemu nagłówkowi na dole strony */}
                <View wrap={false}>
                  <SectionHeader title={(data.certificatesTitle || 'Certyfikaty').toUpperCase()} />
                  <CertRow cert={data.certificates[0]} />
                </View>
                {data.certificates.slice(1).map((cert, ci) => (
                  <CertRow key={ci} cert={cert} />
                ))}
              </>
            )}

            {key === 'interests' && (
              <View wrap={false}>
                <SectionHeader title="ZAINTERESOWANIA" />
                <Text style={s.interests}>{formatInterests(data.interests)}</Text>
              </View>
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
