import { useState } from 'react';
import { Link as LinkIcon, Plus, Edit2, Trash2, Copy, Check } from 'lucide-react';
import { useUserLinks, LinkType } from '../hooks/useUserLinks';
import { Button, PageHeader } from '../components/ui';
import { getPlaceholderUrl } from '../lib/placeholders';

export function LinksPage() {
  const { links: userLinks, addLink, updateLink, removeLink } = useUserLinks();
  const [newLink, setNewLink] = useState<{ label: string; url: string; type: LinkType }>({ label: '', url: '', type: 'linkedin' });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPlaceholder = async (linkId: string, label: string) => {
    const url = getPlaceholderUrl(label);
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={LinkIcon}
        title="Moje linki"
        description="Twoje linki profilowe do śledzenia kliknięć w CV."
      />

      {/* Lista linków */}
      <div className="space-y-2">
        {userLinks.map(link => (
          <div key={link.id} className="bg-dark-700 p-3">
            {editingLinkId === link.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={link.type}
                    onChange={e => updateLink(link.id, { type: e.target.value as LinkType })}
                    className="px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="github">GitHub</option>
                    <option value="project">Projekt</option>
                    <option value="other">Inne</option>
                  </select>
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateLink(link.id, { label: e.target.value })}
                    className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Nazwa"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={link.url}
                    onChange={e => updateLink(link.id, { url: e.target.value })}
                    className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="https://..."
                  />
                  <Button variant="secondary" onClick={() => setEditingLinkId(null)}>Gotowe</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 bg-dark-600 text-slate-400 uppercase tracking-wide">
                        {link.type}
                      </span>
                      <span className="text-sm font-medium text-slate-200">{link.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingLinkId(link.id)}
                      className="p-1.5 text-slate-500 hover:text-primary-400 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeLink(link.id)}
                      className="p-1.5 text-slate-500 hover:text-danger-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Dodaj nowy link */}
        <div className="bg-dark-700/40 p-3 border border-dashed border-dark-600 space-y-2">
          <p className="text-xs text-slate-500">Dodaj link do CV</p>
          <div className="flex gap-2">
            <select
              value={newLink.type}
              onChange={e => setNewLink({
                ...newLink,
                type: e.target.value as LinkType,
                label: e.target.value === 'linkedin' ? 'LinkedIn' : e.target.value === 'github' ? 'GitHub' : newLink.label,
              })}
              className="px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="github">GitHub</option>
              <option value="project">Projekt</option>
              <option value="other">Inne</option>
            </select>
            <input
              type="text"
              value={newLink.label}
              onChange={e => setNewLink({ ...newLink, label: e.target.value })}
              placeholder="Nazwa (np. Portfolio)"
              className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={newLink.url}
              onChange={e => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://..."
              className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <Button
              onClick={() => {
                if (newLink.label.trim() && newLink.url.trim()) {
                  addLink(newLink);
                  setNewLink({ label: '', url: '', type: 'linkedin' });
                }
              }}
              disabled={!newLink.label.trim() || !newLink.url.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Dodaj
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
