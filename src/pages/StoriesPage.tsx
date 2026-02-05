import { useState, useMemo } from 'react';
import {
  Plus,
  BookOpen,
  Trash2,
  Edit,
  Tag,
  Star,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  Button,
  Input,
  Card,
  CardBody,
  Badge,
  Modal,
  EmptyState,
  Textarea,
} from '../components/ui';
import { StarStory } from '../types';

export function StoriesPage() {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<StarStory | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    skills: '',
    positions: '',
    effectiveness: 3,
    tags: '',
    notes: '',
  });

  const filteredStories = useMemo(() => {
    return state.stories
      .filter((story) => {
        const matchesSearch =
          story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.situation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
          story.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      })
      .sort((a, b) => (b.effectiveness || 0) - (a.effectiveness || 0));
  }, [state.stories, searchQuery]);

  const openModal = (story?: StarStory) => {
    if (story) {
      setEditingStory(story);
      setFormData({
        title: story.title,
        situation: story.situation,
        task: story.task,
        action: story.action,
        result: story.result,
        skills: story.skills?.join(', ') || '',
        positions: story.positions?.join(', ') || '',
        effectiveness: story.effectiveness || 3,
        tags: story.tags?.join(', ') || '',
        notes: story.notes || '',
      });
    } else {
      setEditingStory(null);
      setFormData({
        title: '',
        situation: '',
        task: '',
        action: '',
        result: '',
        skills: '',
        positions: '',
        effectiveness: 3,
        tags: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const storyData = {
      title: formData.title,
      situation: formData.situation,
      task: formData.task,
      action: formData.action,
      result: formData.result,
      skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()) : undefined,
      positions: formData.positions
        ? formData.positions.split(',').map((p) => p.trim())
        : undefined,
      effectiveness: formData.effectiveness,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : undefined,
      notes: formData.notes || undefined,
    };

    if (editingStory) {
      dispatch({
        type: 'UPDATE_STORY',
        payload: {
          ...editingStory,
          ...storyData,
        },
      });
    } else {
      dispatch({
        type: 'ADD_STORY',
        payload: storyData,
      });
    }

    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tę historię?')) {
      dispatch({ type: 'DELETE_STORY', payload: id });
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedStories(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Historie STAR</h1>
          <p className="text-slate-400 mt-1">
            Przygotuj historie do pytań behawioralnych (Situation, Task, Action, Result)
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nowa historia
        </Button>
      </div>

      {/* Info box */}
      <div className="bg-dark-800 p-4">
        <h3 className="font-semibold text-primary-400 mb-3 uppercase tracking-wide">Metoda STAR</h3>
        <div className="grid grid-cols-4 gap-4 text-sm text-slate-300">
          <div>
            <span className="font-bold text-primary-400">S</span>ituation - Opisz sytuację
          </div>
          <div>
            <span className="font-bold text-primary-400">T</span>ask - Jakie było zadanie
          </div>
          <div>
            <span className="font-bold text-primary-400">A</span>ction - Co zrobiłeś
          </div>
          <div>
            <span className="font-bold text-primary-400">R</span>esult - Jaki był efekt
          </div>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Szukaj po tytule, umiejętnościach lub tagach..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-dark-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Stories List */}
      {filteredStories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Brak historii"
          description={
            searchQuery
              ? 'Nie znaleziono historii pasujących do wyszukiwania'
              : 'Dodaj swoją pierwszą historię STAR'
          }
          action={
            !searchQuery ? (
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj historię
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredStories.map((story) => {
            const isExpanded = expandedStories.has(story.id);
            return (
              <Card key={story.id}>
                <CardBody className="p-0">
                  <div
                    className="p-4 cursor-pointer hover:bg-dark-700 transition-colors"
                    onClick={() => toggleExpanded(story.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-100">{story.title}</h3>
                          {story.effectiveness && (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= story.effectiveness!
                                      ? 'text-warning-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {story.skills && story.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {story.skills.map((skill, idx) => (
                              <Badge key={idx} variant="info" size="sm">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {story.situation}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-dark-600">
                      <div className="mt-4 space-y-4">
                        {/* Situation */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 border-0 bg-primary-500/20 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-primary-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-100 text-sm mb-1">
                              Sytuacja (Situation)
                            </p>
                            <p className="text-sm text-slate-400 whitespace-pre-wrap">
                              {story.situation}
                            </p>
                          </div>
                        </div>

                        {/* Task */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 border-0 bg-warning-500/20 flex items-center justify-center">
                            <Target className="w-4 h-4 text-warning-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-100 text-sm mb-1">
                              Zadanie (Task)
                            </p>
                            <p className="text-sm text-slate-400 whitespace-pre-wrap">
                              {story.task}
                            </p>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 border-0 bg-warning-500/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-warning-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-100 text-sm mb-1">
                              Działanie (Action)
                            </p>
                            <p className="text-sm text-slate-400 whitespace-pre-wrap">
                              {story.action}
                            </p>
                          </div>
                        </div>

                        {/* Result */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 border-0 bg-success-500/20 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-success-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-100 text-sm mb-1">
                              Rezultat (Result)
                            </p>
                            <p className="text-sm text-slate-400 whitespace-pre-wrap">
                              {story.result}
                            </p>
                          </div>
                        </div>
                      </div>

                      {story.positions && story.positions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-dark-600">
                          <p className="text-xs text-slate-400 mb-2">Pasuje do stanowisk:</p>
                          <div className="flex flex-wrap gap-1">
                            {story.positions.map((pos, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-accent-500/10 text-accent-400 border-0"
                              >
                                {pos}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {story.tags && story.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {story.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 bg-dark-700 text-slate-400"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {story.notes && (
                        <p className="mt-3 text-sm text-slate-400 italic">{story.notes}</p>
                      )}

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-600">
                        <div className="flex-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(story);
                          }}
                          className="p-2 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 border-0"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(story.id);
                          }}
                          className="p-2 text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 border-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingStory ? 'Edytuj historię' : 'Nowa historia STAR'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tytuł historii *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="np. Rozwiązanie konfliktu w zespole"
            required
          />

          <Textarea
            label="Sytuacja (Situation) *"
            value={formData.situation}
            onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
            placeholder="Opisz kontekst i sytuację, w której się znalazłeś..."
            required
          />

          <Textarea
            label="Zadanie (Task) *"
            value={formData.task}
            onChange={(e) => setFormData({ ...formData, task: e.target.value })}
            placeholder="Jakie było Twoje zadanie lub cel?"
            required
          />

          <Textarea
            label="Działanie (Action) *"
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            placeholder="Co konkretnie zrobiłeś? Jakie kroki podjąłeś?"
            required
          />

          <Textarea
            label="Rezultat (Result) *"
            value={formData.result}
            onChange={(e) => setFormData({ ...formData, result: e.target.value })}
            placeholder="Jaki był efekt? Podaj liczby jeśli możesz."
            required
          />

          <Input
            label="Umiejętności (oddziel przecinkami)"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="komunikacja, rozwiązywanie problemów, przywództwo"
          />

          <Input
            label="Pasuje do stanowisk (oddziel przecinkami)"
            value={formData.positions}
            onChange={(e) => setFormData({ ...formData, positions: e.target.value })}
            placeholder="Team Lead, Project Manager"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Skuteczność tej historii
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, effectiveness: star })}
                  className="transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= formData.effectiveness
                        ? 'text-warning-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Jak dobrze ta historia działa na rozmowach?
            </p>
          </div>

          <Input
            label="Tagi (oddziel przecinkami)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="sukces, trudna sytuacja, deadline"
          />

          <Textarea
            label="Notatki"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Dodatkowe przemyślenia..."
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Anuluj
            </Button>
            <Button type="submit">
              {editingStory ? 'Zapisz zmiany' : 'Dodaj historię'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
