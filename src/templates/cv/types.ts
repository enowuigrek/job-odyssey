export interface CVLink {
  label: string;
  url: string;
  /** If set, used as href (tracked URL). url is always the human-readable display URL. */
  trackedUrl?: string;
}

export interface CVContactInfo {
  location: string;
  phone: string;
  email: string;
  /** Ordered links shown in the header (linkedin, github, portfolio) */
  links: CVLink[];
}

export interface CVTechCategory {
  category: string;
  items: string;
}

export interface CVProject {
  name: string;
  tagline: string;
  description: string;
  stack: string;
  note?: string;
  links: CVLink[];
}

export interface CVRole {
  title: string;
  years: string;
  bullets: string[];
}

export interface CVExperience {
  company: string;
  /** URL shown next to company name, e.g. portfolio domain */
  companyLink?: CVLink;
  roles: CVRole[];
}

export interface CVEducation {
  school: string;
  degree: string;
  years: string;
}

export interface CVCustomSection {
  id: string;
  title: string;
  content: string;
}

export interface CVData {
  name: string;
  subtitle: string;
  contact: CVContactInfo;
  /** Editable header for "PROFIL" section */
  profileTitle?: string;
  profile: string;
  /** Editable header for approach section; if false section is hidden */
  approachTitle?: string;
  showApproach?: boolean;
  approach: string;
  showTechnologies?: boolean;
  showProjects?: boolean;
  technologies: CVTechCategory[];
  projects: CVProject[];
  experience: CVExperience[];
  education: CVEducation[];
  interests: string;
  rodo: string;
  customSections?: CVCustomSection[];
}
