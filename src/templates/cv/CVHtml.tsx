import { ReactElement } from 'react';
import './CVHtml.css';
import { CVData, CVLink } from './types';

interface Props {
  data: CVData;
  /** Wrap in a screen preview container (grey background, centered) */
  preview?: boolean;
}

const LINK_ICONS: Record<string, ReactElement> = {
  LinkedIn: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  GitHub: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  Portfolio: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
};

function ContactIconLinks({ links }: { links: CVLink[] }) {
  return (
    <div className="cv-icon-links">
      {links.map(link => (
        <a
          key={link.label}
          href={link.trackedUrl ?? link.url}
          className="cv-icon-link"
          target="_blank"
          rel="noreferrer"
        >
          {LINK_ICONS[link.label] ?? LINK_ICONS.Portfolio}
          {link.url.replace(/^https?:\/\//, '')}
        </a>
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
  const page = (
    <div className="cv-page cv-root">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="cv-name">{data.name}</div>
      <div className="cv-subtitle">{data.subtitle}</div>

      <div className="cv-contact-block">
        <p className="cv-contact-line">
          {data.contact.location}, tel: {data.contact.phone}
        </p>
        <p className="cv-contact-line">e-mail: {data.contact.email}</p>
        <ContactIconLinks links={data.contact.links} />
      </div>

      {/* ── PROFIL ──────────────────────────────────────────────── */}
      <div className="cv-section-header">
        <h2 className="cv-section-title">{(data.profileTitle || 'PROFIL').toUpperCase()}</h2>
      </div>
      <p className="cv-body">{data.profile}</p>

      {/* ── PODEJŚCIE DO PRACY (opcjonalne) ─────────────────────── */}
      {data.showApproach !== false && data.approach ? (
        <>
          <div className="cv-section-header">
            <h2 className="cv-section-title">{(data.approachTitle || 'PODEJŚCIE DO PRACY').toUpperCase()}</h2>
          </div>
          <p className="cv-body">{data.approach}</p>
        </>
      ) : null}

      {/* ── TECHNOLOGIE I NARZĘDZIA ─────────────────────────────── */}
      {data.showTechnologies !== false && (
        <>
          <div className="cv-section-header">
            <h2 className="cv-section-title">TECHNOLOGIE I NARZĘDZIA</h2>
          </div>
          {data.technologies.map(tech => (
            <div key={tech.category} className="cv-tech-row">
              <span className="cv-tech-label">{tech.category}</span>
              <span className="cv-tech-value">{tech.items}</span>
            </div>
          ))}
        </>
      )}

      {/* ── WYBRANE PROJEKTY ────────────────────────────────────── */}
      {data.showProjects !== false && (
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

      {/* ── DOŚWIADCZENIE ZAWODOWE ──────────────────────────────── */}
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
              <div className="cv-exp-role">{role.title}</div>
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

      {/* ── WYKSZTAŁCENIE ───────────────────────────────────────── */}
      <div className="cv-section-header">
        <h2 className="cv-section-title">WYKSZTAŁCENIE</h2>
      </div>
      {data.education.map(edu => (
        <div key={edu.school} className="cv-edu-block">
          <div className="cv-edu-school">{edu.school}</div>
          <div className="cv-edu-detail">{edu.degree} | {edu.years}</div>
        </div>
      ))}

      {/* ── SEKCJE WŁASNE ───────────────────────────────────────── */}
      {data.customSections && data.customSections.map(sec => (
        <div key={sec.id}>
          <div className="cv-section-header">
            <h2 className="cv-section-title">{sec.title.toUpperCase()}</h2>
          </div>
          <p className="cv-body">{sec.content}</p>
        </div>
      ))}

      {/* ── ZAINTERESOWANIA ─────────────────────────────────────── */}
      <div className="cv-section-header">
        <h2 className="cv-section-title">ZAINTERESOWANIA</h2>
      </div>
      <p className="cv-interests">{data.interests}</p>

      {/* ── RODO ────────────────────────────────────────────────── */}
      <p className="cv-rodo">{data.rodo}</p>
    </div>
  );

  if (preview) {
    return <div className="cv-screen-wrapper">{page}</div>;
  }
  return page;
}
