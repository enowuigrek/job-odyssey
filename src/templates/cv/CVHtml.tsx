import './CVHtml.css';
import { CVData, CVLink } from './types';

interface Props {
  data: CVData;
  /** Wrap in a screen preview container (grey background, centered) */
  preview?: boolean;
}

function InlineLinks({ links }: { links: CVLink[] }) {
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
        <InlineLinks links={data.contact.links} />
      </div>

      {/* ── PROFIL ──────────────────────────────────────────────── */}
      <div className="cv-section-header">
        <h2 className="cv-section-title">PROFIL</h2>
      </div>
      <p className="cv-body">{data.profile}</p>

      {/* ── PODEJŚCIE DO PRACY ──────────────────────────────────── */}
      <div className="cv-section-header">
        <h2 className="cv-section-title">PODEJŚCIE DO PRACY</h2>
      </div>
      <p className="cv-body">{data.approach}</p>

      {/* ── TECHNOLOGIE I NARZĘDZIA ─────────────────────────────── */}
      <div className="cv-section-header">
        <h2 className="cv-section-title">TECHNOLOGIE I NARZĘDZIA</h2>
      </div>
      {data.technologies.map(tech => (
        <div key={tech.category} className="cv-tech-row">
          <span className="cv-tech-label">{tech.category}</span>
          <span className="cv-tech-value">{tech.items}</span>
        </div>
      ))}

      {/* ── WYBRANE PROJEKTY ────────────────────────────────────── */}
      <div className="cv-section-header">
        <h2 className="cv-section-title">WYBRANE PROJEKTY</h2>
      </div>
      {data.projects.map(project => (
        <div key={project.name} className="cv-project">
          <div className="cv-project-name">{project.name}</div>
          <div className="cv-project-tagline">{project.tagline}</div>
          <p className="cv-project-desc">{project.description}</p>
          <p className="cv-project-stack">{project.stack}</p>
          {project.note && <p className="cv-project-note">{project.note}</p>}
          <ProjectLinks links={project.links} />
        </div>
      ))}

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
