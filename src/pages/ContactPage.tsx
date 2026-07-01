import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button, Input, Textarea } from '../components/ui';
import { submitContactMessage } from '../lib/contactDb';

const CONTACT_EMAIL = 'kontakt@lukasznowak.dev';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error } = await submitContactMessage({ name, email, message });
    setIsSubmitting(false);
    if (error) {
      setError('Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz bezpośrednio na e-mail poniżej.');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-lg mx-auto px-4 py-10 md:px-8 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Strona główna
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">Kontakt</h1>
        <p className="text-sm text-slate-400 mb-8">
          Pytanie, sugestia, coś nie działa? Napisz bezpośrednio na{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-400 hover:text-primary-300 transition-colors">
            {CONTACT_EMAIL}
          </a>{' '}
          albo skorzystaj z formularza poniżej.
        </p>

        {sent ? (
          <div className="bg-dark-800 border-l-2 border-success-500 p-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-200 font-medium">Wiadomość wysłana.</p>
              <p className="text-sm text-slate-400 mt-1">Odpiszę najszybciej jak się da.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Imię"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Jak się do Ciebie zwracać?"
            />
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="ty@email.com"
            />
            <Textarea
              label="Wiadomość"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="O co chodzi?"
            />
            {error && <p className="text-sm text-danger-400 bg-danger-500/10 px-3 py-2">{error}</p>}
            <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Wysyłam...' : 'Wyślij wiadomość'}
            </Button>
          </form>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 mt-8">
          <Mail className="w-3.5 h-3.5" />
          <span>Docelowy adres zmieni się po wykupieniu domeny.</span>
        </div>
      </div>
    </div>
  );
}
