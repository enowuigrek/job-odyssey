import { Fragment } from 'react';
import './CVHtml.css';
import { CVData, CVLink } from './types';
import { formatTechCategory, formatInterests } from './format';
import { getSectionOrder } from './sectionOrder';

interface Props {
  data: CVData;
  /** Wrap in a screen preview container (grey background, centered) */
  preview?: boolean;
}

/** Pipe-separated inline links — musi zostać zgodne z InlineLinks w CVTemplate.tsx (PDF). */
function ContactLinks({ links }: { links: CVLink[] }) {
  return (
    <div className="cv-links-row">
      {links.map((link, i) => (
        <span key={link.label}>
          {i > 0 && <span className="cv-links-sep">|</span>}
          <a href={link.trackedUrl ?? link.url} target="_blank" rel="noreferrer">
            {link.url.replace(/^https?:\/\//, '')}
          </a>
        </span>
      ))}
    </div>
  );
}

function ProjectLinks({ links }: { links: CVLink[] }) {
  return (
    <div className="cv-project-links">
      {links.map((link, i) => (
        <span key={link.label}>
          {i > 0 && <span className="cv-links-sep">|</span>}
          <a href={link.trackedUrl ?? link.url} target="_blank" rel="noreferrer">
            {link.label.endsWith('GitHub') || link.label === 'GitHub' ? 'GitHub' : link.url.replace(/^https?:\/\//, '')}
          </a>
        </span>
      ))}
    </div>
  );
}

export function CVHtml({ data, preview = false }: Props) {
  const sectionOrder = getSectionOrder(data);
  const page = (
    <div className="cv-page cv-root">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="cv-header-row">
        <div className="cv-header-text">
          <div className="cv-name">{data.name}</div>
          <div className="cv-subtitle">{data.subtitle}</div>

          <div className="cv-contact-block">
            <p className="cv-contact-line">
              {data.contact.location}, tel: {data.contact.phone}
            </p>
            <p className="cv-contact-line">e-mail: {data.contact.email}</p>
            <ContactLinks links={data.contact.links} />
          </div>
        </div>
        {data.showPhoto !== false && data.photoUrl && (
          <img src={data.photoUrl} alt="" className="cv-photo" />
        )}
      </div>

      {/* ── Content sections, in user-defined order ─────────────── */}
      {sectionOrder.map((key) => (
        <Fragment key={key}>
          {key === 'profile' && (
            <>
              <div className="cv-section-header">
                <h2 className="cv-section-title">{(data.profileTitle || 'OPIS').toUpperCase()}</h2>
              </div>
              <p className="cv-body">{data.profile}</p>
              {data.showApproach !== false && data.approach ? (
                <>
                  <div className="cv-section-header">
                    <h2 className="cv-section-title">{(data.approachTitle || 'PODEJŚCIE DO PRACY').toUpperCase()}</h2>
                  </div>
                  <p className="cv-body">{data.approach}</p>
                </>
              ) : null}
            </>
          )}

          {key === 'technologies' && data.showTechnologies !== false && (
            <>
              <div className="cv-section-header">
                <h2 className="cv-section-title">{(data.technologiesTitle || 'TECHNOLOGIE I NARZĘDZIA').toUpperCase()}</h2>
              </div>
              {data.technologies.map(tech => (
                <div key={tech.category} className="cv-tech-row">
                  <span className="cv-tech-label">{formatTechCategory(tech.category)}</span>
                  <span className="cv-tech-value">{tech.items}</span>
                </div>
              ))}
            </>
          )}

          {key === 'projects' && data.showProjects !== false && (
            <>
              <div className="cv-section-header">
                <h2 className="cv-section-title">WYBRANE PROJEKTY</h2>
              </div>
              {data.projects.map(project => (
                <div key={project.name} className="cv-project">
                  <div className="cv-project-name">{project.name}</div>
                  <div className="cv-project-tagline">{project.tagline}</div>
                  <div className="cv-project-body">
                    <p className="cv-project-desc">{project.description}</p>
                    <p className="cv-project-stack">{project.stack}</p>
                    {project.note && <p className="cv-project-note">{project.note}</p>}
                    <ProjectLinks links={project.links} />
                  </div>
                </div>
              ))}
            </>
          )}

          {key === 'experience' && (
            <>
              <div className="cv-section-header">
                <h2 className="cv-section-title">DOŚWIADCZENIE ZAWODOWE</h2>
              </div>
              {data.experience.map(exp => (
                <div key={exp.company}>
                  <div className="cv-exp-company-row">
                    <span className="cv-exp-company">{exp.company}</span>
                    {exp.companyLink && (
                      <a href={exp.companyLink.trackedUrl ?? exp.companyLink.url} className="cv-exp-company-link" target="_blank" rel="noreferrer">
                        {exp.companyLink.url.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                  {exp.roles.map(role => (
                    <div key={role.title} className="cv-exp-role-block">
                      <div className="cv-exp-role">
                        {role.title}
                        {role.years && <span className="cv-exp-role-years"> | {role.years}</span>}
                      </div>
                      {role.bullets.map((bullet, bi) => (
                        <div key={bi} className="cv-bullet">
                          <span className="cv-bullet-dot">•</span>
                          <span className="cv-bullet-text">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {key === 'education' && (
            <>
              <div className="cv-section-header">
                <h2 className="cv-section-title">WYKSZTAŁCENIE</h2>
              </div>
              {data.education.map(edu => (
                <div key={edu.school} className="cv-edu-block">
                  <div className="cv-edu-school">{edu.school}</div>
                  <div className="cv-edu-detail-block">
                    <div className="cv-edu-detail">{edu.degree} | {edu.years}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {key === 'custom' && data.customSections && data.customSections.map(sec => (
            <div key={sec.id}>
              <div className="cv-section-header">
                <h2 className="cv-section-title">{sec.title.toUpperCase()}</h2>
              </div>
              <p className="cv-body">{sec.content}</p>
            </div>
          ))}

          {key === 'certificates' && data.showCertificates !== false && data.certificates && data.certificates.length > 0 && (
            <>
              <div className="cv-section-header">
                <h2 className="cv-section-title">{(data.certificatesTitle || 'Certyfikaty').toUpperCase()}</h2>
              </div>
              {data.certificates.map((cert, ci) => (
                <div key={ci} className="cv-cert-row">
                  {cert.url ? (
                    <a href={cert.trackedUrl ?? cert.url} className="cv-cert-name" target="_blank" rel="noreferrer">
                      {cert.name}
                    </a>
                  ) : (
                    <span className="cv-cert-name cv-cert-name-plain">{cert.name}</span>
                  )}
                  <span className="cv-cert-meta">
                    {cert.issuer}{cert.issuer && cert.year ? ' · ' : ''}{cert.year}
                  </span>
                </div>
              ))}
            </>
          )}

          {key === 'interests' && (
            <>
              <div className="cv-section-header">
                <h2 className="cv-section-title">ZAINTERESOWANIA</h2>
              </div>
              <p className="cv-interests">{formatInterests(data.interests)}</p>
            </>
          )}

        </Fragment>
      ))}

      {/* ── RODO — always last, spacer pins it to the page bottom ── */}
      <div className="cv-rodo-spacer" />
      <p className="cv-rodo">{data.rodo}</p>
    </div>
  );

  if (preview) {
    return <div className="cv-screen-wrapper">{page}</div>;
  }
  return page;
}
