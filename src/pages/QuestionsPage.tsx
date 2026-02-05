import { useState, useMemo } from 'react';
import {
  Plus,
  HelpCircle,
  Trash2,
  Edit,
  Tag,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Lightbulb,
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
  Select,
  Textarea,
} from '../components/ui';
import { RecruitmentQuestion, QuestionCategory, DifficultyLevel } from '../types';

const categoryOptions = [
  { value: '', label: 'Wszystkie kategorie' },
  { value: 'behavioral', label: 'Behawioralne' },
  { value: 'technical', label: 'Techniczne' },
  { value: 'situational', label: 'Sytuacyjne' },
  { value: 'motivation', label: 'Motywacyjne' },
  { value: 'salary', label: 'Wynagrodzenie' },
  { value: 'company_knowledge', label: 'Znajomość firmy' },
  { value: 'role_specific', label: 'Specyficzne dla roli' },
  { value: 'other', label: 'Inne' },
];

const allCategoryOptions = categoryOptions.filter((c) => c.value !== '');

const difficultyOptions = [
  { value: '', label: 'Wszystkie poziomy' },
  { value: 'easy', label: 'Łatwe' },
  { value: 'medium', label: 'Średnie' },
  { value: 'hard', label: 'Trudne' },
];

const allDifficultyOptions = difficultyOptions.filter((d) => d.value !== '');

export function QuestionsPage() {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<RecruitmentQuestion | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    question: '',
    category: 'behavioral' as QuestionCategory,
    difficulty: 'medium' as DifficultyLevel,
    positions: '',
    myAnswer: '',
    suggestedAnswer: '',
    tags: '',
    source: '',
    notes: '',
  });

  const filteredQuestions = useMemo(() => {
    return state.questions
      .filter((q) => {
        const matchesSearch =
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.myAnswer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      })
      .sort((a, b) => b.timesAsked - a.timesAsked);
  }, [state.questions, searchQuery]);

  const openModal = (question?: RecruitmentQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        question: question.question,
        category: question.category,
        difficulty: question.difficulty,
        positions: question.positions?.join(', ') || '',
        myAnswer: question.myAnswer || '',
        suggestedAnswer: question.suggestedAnswer || '',
        tags: question.tags?.join(', ') || '',
        source: question.source || '',
        notes: question.notes || '',
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        question: '',
        category: 'behavioral',
        difficulty: 'medium',
        positions: '',
        myAnswer: '',
        suggestedAnswer: '',
        tags: '',
        source: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const questionData = {
      question: formData.question,
      category: formData.category,
      difficulty: formData.difficulty,
      positions: formData.positions
        ? formData.positions.split(',').map((p) => p.trim())
        : undefined,
      myAnswer: formData.myAnswer || undefined,
      suggestedAnswer: formData.suggestedAnswer || undefined,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : undefined,
      source: formData.source || undefined,
      notes: formData.notes || undefined,
      timesAsked: editingQuestion?.timesAsked || 0,
    };

    if (editingQuestion) {
      dispatch({
        type: 'UPDATE_QUESTION',
        payload: {
          ...editingQuestion,
          ...questionData,
        },
      });
    } else {
      dispatch({
        type: 'ADD_QUESTION',
        payload: questionData,
      });
    }

    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to pytanie?')) {
      dispatch({ type: 'DELETE_QUESTION', payload: id });
    }
  };

  const handleIncrementAsked = (question: RecruitmentQuestion) => {
    dispatch({
      type: 'UPDATE_QUESTION',
      payload: {
        ...question,
        timesAsked: question.timesAsked + 1,
        lastAskedAt: new Date().toISOString(),
      },
    });
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQuestions(newExpanded);
  };

  const getCategoryLabel = (category: QuestionCategory) => {
    return categoryOptions.find((c) => c.value === category)?.label || category;
  };

  const getDifficultyBadgeVariant = (difficulty: DifficultyLevel) => {
    const map: Record<DifficultyLevel, 'success' | 'warning' | 'danger'> = {
      easy: 'success',
      medium: 'warning',
      hard: 'danger',
    };
    return map[difficulty];
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel) => {
    const map: Record<DifficultyLevel, string> = {
      easy: 'Łatwe',
      medium: 'Średnie',
      hard: 'Trudne',
    };
    return map[difficulty];
  };

  // Stats
  const stats = useMemo(() => {
    const total = state.questions.length;
    const withAnswers = state.questions.filter((q) => q.myAnswer).length;
    const mostAsked = [...state.questions]
      .filter(q => q.timesAsked > 0)
      .sort((a, b) => b.timesAsked - a.timesAsked)
      .slice(0, 5);

    // Ranking pytań po stanowiskach
    const positionStats: Record<string, { total: number; questions: string[] }> = {};
    state.questions.forEach(q => {
      q.positions?.forEach(pos => {
        if (!positionStats[pos]) {
          positionStats[pos] = { total: 0, questions: [] };
        }
        positionStats[pos].total += q.timesAsked;
        if (q.timesAsked > 0) {
          positionStats[pos].questions.push(q.question);
        }
      });
    });

    return { total, withAnswers, mostAsked, positionStats };
  }, [state.questions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pytania rekrutacyjne</h1>
          <p className="text-slate-400 mt-1">
            Buduj bazę pytań i przygotowuj odpowiedzi
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj pytanie
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-slate-100">{stats.total}</p>
            <p className="text-sm text-slate-400">Pytań w bazie</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-success-400">{stats.withAnswers}</p>
            <p className="text-sm text-slate-400">Z przygotowaną odpowiedzią</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-warning-400">
              {stats.total > 0 ? Math.round((stats.withAnswers / stats.total) * 100) : 0}%
            </p>
            <p className="text-sm text-slate-400">Pokrycie odpowiedziami</p>
          </CardBody>
        </Card>
      </div>

      {/* Ranking pytań - wykres */}
      {stats.mostAsked.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              Najczęściej padające pytania
            </h3>
            <div className="space-y-3">
              {stats.mostAsked.map((q, idx) => {
                const maxAsked = stats.mostAsked[0].timesAsked;
                const percentage = (q.timesAsked / maxAsked) * 100;
                return (
                  <div key={q.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-slate-300 truncate pr-4 flex-1">
                        {idx + 1}. {q.question}
                      </p>
                      <span className="text-sm font-mono text-primary-400">{q.timesAsked}x</span>
                    </div>
                    <div className="h-2 bg-dark-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {q.positions && q.positions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {q.positions.slice(0, 3).map((pos, i) => (
                          <span key={i} className="text-xs text-slate-500">
                            {pos}{i < Math.min(q.positions!.length - 1, 2) ? ',' : ''}
                          </span>
                        ))}
                        {q.positions.length > 3 && (
                          <span className="text-xs text-slate-500">+{q.positions.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Szukaj pytań..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-dark-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Brak pytań"
          description={
            searchQuery
              ? 'Nie znaleziono pytań pasujących do wyszukiwania'
              : 'Dodaj swoje pierwsze pytanie rekrutacyjne'
          }
          action={
            !searchQuery ? (
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj pytanie
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question) => {
            const isExpanded = expandedQuestions.has(question.id);
            return (
              <Card key={question.id}>
                <CardBody className="p-0">
                  <div
                    className="p-4 cursor-pointer hover:bg-dark-700 transition-colors"
                    onClick={() => toggleExpanded(question.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="info" size="sm">
                            {getCategoryLabel(question.category)}
                          </Badge>
                          <Badge variant={getDifficultyBadgeVariant(question.difficulty)} size="sm">
                            {getDifficultyLabel(question.difficulty)}
                          </Badge>
                          {question.timesAsked > 0 && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <BarChart3 className="w-3 h-3" />
                              Padło {question.timesAsked}x
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-slate-100">{question.question}</h3>
                        {question.positions && question.positions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {question.positions.map((pos, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-accent-500/10 text-accent-400 border-0"
                              >
                                {pos}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!question.myAnswer && (
                          <span className="text-xs text-warning-400 bg-warning-500/10 px-2 py-1 border-0">
                            Brak odpowiedzi
                          </span>
                        )}
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
                      {question.myAnswer && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            Moja odpowiedź:
                          </p>
                          <p className="text-sm text-slate-400 whitespace-pre-wrap bg-success-500/10 p-3 border-0">
                            {question.myAnswer}
                          </p>
                        </div>
                      )}

                      {question.suggestedAnswer && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-300 mb-1">
                            Sugerowana odpowiedź:
                          </p>
                          <p className="text-sm text-slate-400 whitespace-pre-wrap bg-primary-500/10 p-3 border-0">
                            {question.suggestedAnswer}
                          </p>
                        </div>
                      )}

                      {question.tags && question.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1">
                          {question.tags.map((tag, idx) => (
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

                      {question.source && (
                        <p className="mt-3 text-xs text-slate-400">
                          Źródło: {question.source}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-600">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncrementAsked(question);
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Padło na rozmowie
                        </Button>
                        <div className="flex-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(question);
                          }}
                          className="p-2 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 border-0"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(question.id);
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
        title={editingQuestion ? 'Edytuj pytanie' : 'Nowe pytanie'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            label="Pytanie *"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="Wpisz treść pytania rekrutacyjnego..."
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Kategoria"
              options={allCategoryOptions}
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as QuestionCategory })
              }
            />
            <Select
              label="Poziom trudności"
              options={allDifficultyOptions}
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })
              }
            />
          </div>

          <Input
            label="Stanowiska (oddziel przecinkami)"
            value={formData.positions}
            onChange={(e) => setFormData({ ...formData, positions: e.target.value })}
            placeholder="Frontend Developer, React Developer"
          />

          <Textarea
            label="Moja odpowiedź"
            value={formData.myAnswer}
            onChange={(e) => setFormData({ ...formData, myAnswer: e.target.value })}
            placeholder="Przygotuj swoją odpowiedź na to pytanie..."
          />

          <Textarea
            label="Sugerowana / wzorcowa odpowiedź"
            value={formData.suggestedAnswer}
            onChange={(e) => setFormData({ ...formData, suggestedAnswer: e.target.value })}
            placeholder="Odpowiedź z internetu lub poradnika..."
          />

          <Input
            label="Tagi (oddziel przecinkami)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="komunikacja, praca zespołowa, stres"
          />

          <Input
            label="Źródło"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="np. Rozmowa w Google, Glassdoor, poradnik..."
          />

          <Textarea
            label="Notatki"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Anuluj
            </Button>
            <Button type="submit">
              {editingQuestion ? 'Zapisz zmiany' : 'Dodaj pytanie'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
