import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type {
  CandidateProfile,
  ProfileDescription,
  ProfileExperience,
  ProfileProject,
  ProfileTechCategory,
  ProfileEducation,
} from '../types/profile';
import {
  getFullProfile,
  upsertProfile,
  upsertDescription,
  deleteDescription,
  upsertExperience,
  deleteExperience,
  upsertProject,
  deleteProject,
  upsertTechCategory,
  deleteTechCategory,
  upsertEducation,
  deleteEducation,
} from '../lib/profileDb';

export function useProfile() {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<CandidateProfile>({
    location: '',
    phone: '',
    email: '',
    links: [],
    interests: '',
    rodo: '',
  });
  const [descriptions, setDescriptions] = useState<ProfileDescription[]>([]);
  const [experiences, setExperiences] = useState<ProfileExperience[]>([]);
  const [projects, setProjects] = useState<ProfileProject[]>([]);
  const [techCategories, setTechCategories] = useState<ProfileTechCategory[]>([]);
  const [education, setEducation] = useState<ProfileEducation[]>([]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getFullProfile(user.id)
      .then(full => {
        setProfile(full.contact);
        setDescriptions(full.descriptions);
        setExperiences(full.experiences);
        setProjects(full.projects);
        setTechCategories(full.techCategories);
        setEducation(full.education);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  // ── Contact / profile ────────────────────────────────────────────────────────

  const updateProfile = useCallback(async (data: Omit<CandidateProfile, 'id'>) => {
    if (!user) return;
    await upsertProfile(user.id, data);
    setProfile(prev => ({ ...prev, ...data }));
  }, [user]);

  // ── Descriptions ─────────────────────────────────────────────────────────────

  const addDescription = useCallback(async (desc: { name: string; content: string }) => {
    if (!user) return;
    const sortOrder = descriptions.length;
    const saved = await upsertDescription(user.id, { ...desc, sort_order: sortOrder });
    setDescriptions(prev => [...prev, saved]);
  }, [user, descriptions]);

  const updateDescription = useCallback(async (id: string, patch: Partial<ProfileDescription>) => {
    if (!user) return;
    const existing = descriptions.find(d => d.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const saved = await upsertDescription(user.id, updated);
    setDescriptions(prev => prev.map(d => d.id === id ? saved : d));
  }, [user, descriptions]);

  const removeDescription = useCallback(async (id: string) => {
    await deleteDescription(id);
    setDescriptions(prev => prev.filter(d => d.id !== id));
  }, []);

  // ── Experiences ──────────────────────────────────────────────────────────────

  const addExperience = useCallback(async (exp: { company: string; roles: ProfileExperience['roles'] }) => {
    if (!user) return;
    const sortOrder = experiences.length;
    const saved = await upsertExperience(user.id, { ...exp, sort_order: sortOrder });
    setExperiences(prev => [...prev, saved]);
  }, [user, experiences]);

  const updateExperience = useCallback(async (id: string, patch: Partial<ProfileExperience>) => {
    if (!user) return;
    const existing = experiences.find(e => e.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const saved = await upsertExperience(user.id, updated);
    setExperiences(prev => prev.map(e => e.id === id ? saved : e));
  }, [user, experiences]);

  const removeExperience = useCallback(async (id: string) => {
    await deleteExperience(id);
    setExperiences(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── Projects ─────────────────────────────────────────────────────────────────

  const addProject = useCallback(async (proj: { name: string }) => {
    if (!user) return;
    const sortOrder = projects.length;
    const saved = await upsertProject(user.id, {
      name: proj.name,
      tagline: '',
      description: '',
      stack: '',
      links: [],
      sort_order: sortOrder,
    });
    setProjects(prev => [...prev, saved]);
  }, [user, projects]);

  const updateProject = useCallback(async (id: string, patch: Partial<ProfileProject>) => {
    if (!user) return;
    const existing = projects.find(p => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const saved = await upsertProject(user.id, updated);
    setProjects(prev => prev.map(p => p.id === id ? saved : p));
  }, [user, projects]);

  const removeProject = useCallback(async (id: string) => {
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Tech Categories ──────────────────────────────────────────────────────────

  const addTechCategory = useCallback(async (tech: { category: string; items: string }) => {
    if (!user) return;
    const sortOrder = techCategories.length;
    const saved = await upsertTechCategory(user.id, { ...tech, sort_order: sortOrder });
    setTechCategories(prev => [...prev, saved]);
  }, [user, techCategories]);

  const updateTechCategory = useCallback(async (id: string, patch: Partial<ProfileTechCategory>) => {
    if (!user) return;
    const existing = techCategories.find(t => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const saved = await upsertTechCategory(user.id, updated);
    setTechCategories(prev => prev.map(t => t.id === id ? saved : t));
  }, [user, techCategories]);

  const removeTechCategory = useCallback(async (id: string) => {
    await deleteTechCategory(id);
    setTechCategories(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Education ────────────────────────────────────────────────────────────────

  const addEducation = useCallback(async (edu: { school: string; degree: string; years: string }) => {
    if (!user) return;
    const sortOrder = education.length;
    const saved = await upsertEducation(user.id, { ...edu, sort_order: sortOrder });
    setEducation(prev => [...prev, saved]);
  }, [user, education]);

  const updateEducation = useCallback(async (id: string, patch: Partial<ProfileEducation>) => {
    if (!user) return;
    const existing = education.find(e => e.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const saved = await upsertEducation(user.id, updated);
    setEducation(prev => prev.map(e => e.id === id ? saved : e));
  }, [user, education]);

  const removeEducation = useCallback(async (id: string) => {
    await deleteEducation(id);
    setEducation(prev => prev.filter(e => e.id !== id));
  }, []);

  return {
    profile,
    descriptions,
    experiences,
    projects,
    techCategories,
    education,
    isLoading,
    updateProfile,
    addDescription,
    updateDescription,
    removeDescription,
    addExperience,
    updateExperience,
    removeExperience,
    addProject,
    updateProject,
    removeProject,
    addTechCategory,
    updateTechCategory,
    removeTechCategory,
    addEducation,
    updateEducation,
    removeEducation,
  };
}
