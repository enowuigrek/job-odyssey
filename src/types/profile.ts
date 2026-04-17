export interface ProfileLink {
  label: string;
  url: string;
}

export interface ProfileContact {
  location: string;
  phone: string;
  email: string;
  links: ProfileLink[];
}

export interface CandidateProfile {
  id?: string;
  location: string;
  phone: string;
  email: string;
  links: ProfileLink[];
  interests: string;
  rodo: string;
}

export interface ProfileDescription {
  id: string;
  name: string;
  content: string;
  sort_order: number;
}

export interface ProfileExperienceRole {
  title: string;
  bullets: string[];
}

export interface ProfileExperience {
  id: string;
  company: string;
  company_link?: ProfileLink;
  roles: ProfileExperienceRole[];
  sort_order: number;
}

export interface ProfileProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string;
  note?: string;
  links: ProfileLink[];
  sort_order: number;
}

export interface ProfileTechCategory {
  id: string;
  category: string;
  items: string;
  sort_order: number;
}

export interface ProfileEducation {
  id: string;
  school: string;
  degree: string;
  years: string;
  sort_order: number;
}

export interface FullProfile {
  contact: CandidateProfile;
  descriptions: ProfileDescription[];
  experiences: ProfileExperience[];
  projects: ProfileProject[];
  techCategories: ProfileTechCategory[];
  education: ProfileEducation[];
}
