import { CVData } from './types';

export const defaultCVData: CVData = {
  name: 'ZYGFRYD MAŁOPOLSKI',
  subtitle: 'Frontend Developer | React | TypeScript',
  contact: {
    location: 'Warszawa',
    phone: '600 000 000',
    email: 'zygfryd.malopolski@email.com',
    links: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/zygfrydmalopolski' },
      { label: 'GitHub', url: 'https://github.com/zygfrydmalopolski' },
      { label: 'Portfolio', url: 'https://zygfryd.dev' },
    ],
  },
  profile: 'Tutaj wpisz swój profil zawodowy — kilka zdań o tym, kim jesteś, co robisz i co wyróżnia Cię spośród innych kandydatów. Skup się na wartości, którą wnosisz, a nie tylko na latach doświadczenia.',
  approach: '',
  showApproach: false,
  technologies: [
    {
      category: 'Frontend:',
      items: 'React, TypeScript, JavaScript ES6+, HTML5, CSS3, Tailwind CSS',
    },
    {
      category: 'Backend / Bazy:',
      items: 'Node.js, Express, PostgreSQL, REST API',
    },
    {
      category: 'Narzędzia:',
      items: 'Git, GitHub, Figma, VS Code, Vite, Webpack',
    },
  ],
  projects: [
    {
      name: 'NAZWA PROJEKTU',
      tagline: 'Krótki opis — czym jest projekt i dla kogo.',
      description: 'Szczegółowy opis projektu: jakie problemy rozwiązuje, jakie funkcje zawiera, co było technicznie ciekawe. Kilka zdań pokazujących Twoje umiejętności.',
      stack: 'Stack: React, TypeScript, Node.js, PostgreSQL, Tailwind CSS',
      note: 'Opcjonalna notatka, np. o metodologii lub statusie projektu.',
      links: [
        { label: 'Demo', url: 'https://twojprojekt.com' },
        { label: 'Projekt GitHub', url: 'https://github.com/jankowalski/projekt' },
      ],
    },
  ],
  experience: [
    {
      company: 'NAZWA FIRMY',
      roles: [
        {
          title: 'Stanowisko | 2022 – obecnie',
          years: '',
          bullets: [
            'Opisz swoje główne obowiązki i osiągnięcia — używaj liczb i konkretów tam gdzie możesz.',
            'Kolejny punkt — co zbudowałeś, co usprawniłeś, jaki miałeś wpływ na projekt lub firmę.',
            'Trzeci punkt — technologie, skala, zespół.',
          ],
        },
      ],
    },
    {
      company: 'POPRZEDNIA FIRMA',
      roles: [
        {
          title: 'Stanowisko | 2019 – 2022',
          years: '',
          bullets: [
            'Opis doświadczenia z poprzedniej pracy.',
            'Kluczowe osiągnięcia i odpowiedzialności.',
          ],
        },
      ],
    },
  ],
  education: [
    {
      school: 'NAZWA UCZELNI',
      degree: 'Kierunek studiów',
      years: '2015 – 2019',
    },
  ],
  interests: 'Tutaj wpisz swoje zainteresowania — krótko, kilka słów oddzielonych kropką',
  rodo: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji.',
};
