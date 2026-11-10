// Menus déroulants du header (desktop).
// Normes : panneau compact ancré sous l'onglet (pas pleine largeur), 4–6 liens max,
// libellé + une ligne de description, vrais <Link> (SEO, clic molette, accessibilité),
// une seule zone « mise en avant » par menu, uniquement des pages qui existent.
import {
  BookOpen, GraduationCap, TrendingUp, TrendingDown, BarChart3, Clock, Video, BookA, LifeBuoy,
  LayoutGrid, LineChart, PieChart, MessageCircle, Users, Trophy, Award, Medal, Newspaper, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { BRVM_NEWS } from '../data/brvm2026News';

type MarketIndex = {
  id: string;
  index_name: string;
  index_value: number;
  daily_change_percent: number;
};

// ─── Briques communes ────────────────────────────────────────────────────────

type MenuItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  isNew?: boolean;
};

function Panel({ children, width = 'w-[560px]' }: { children: React.ReactNode; width?: string }) {
  return (
    <div
      className={`${width} max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] overflow-hidden animate-[menuIn_140ms_ease-out]`}
      role="menu"
    >
      {children}
    </div>
  );
}

function ItemLink({ to, icon: Icon, label, desc, isNew }: MenuItem) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none transition-colors"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          {label}
          {isNew && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              Nouveau
            </span>
          )}
        </span>
        <span className="block text-xs leading-snug text-slate-500">{desc}</span>
      </span>
    </Link>
  );
}

function ItemGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-0.5 p-2">
      {items.map((it) => <ItemLink key={it.to + it.label} {...it} />)}
    </div>
  );
}

function Footer({ to, label, hint }: { to: string; label: string; hint?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
      <span className="truncate text-xs text-slate-500">{hint}</span>
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
      >
        {label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ─── Apprendre ───────────────────────────────────────────────────────────────

export function LearnMegaMenu() {
  const items: MenuItem[] = [
    { to: '/learn',         icon: BookOpen,      label: 'Modules gratuits',  desc: 'Les bases de la BRVM, pas à pas' },
    { to: '/parcours',      icon: GraduationCap, label: 'Parcours certifiant', desc: 'Formation complète + certificat' },
    { to: '/webinaires-eco', icon: Video,        label: 'Webinaires',        desc: 'Sessions live avec des experts' },
    { to: '/time-machine',  icon: Clock,         label: 'Time Machine',      desc: "Rejouez l'histoire de la BRVM", isNew: true },
    { to: '/glossary',      icon: BookA,         label: 'Glossaire',         desc: 'Tous les termes de la bourse' },
    { to: '/help',          icon: LifeBuoy,      label: "Centre d'aide",     desc: 'Questions fréquentes' },
  ];
  return (
    <Panel>
      <ItemGrid items={items} />
      <Footer to="/learn" label="Commencer à apprendre" hint="Quiz, XP et badges à chaque module" />
    </Panel>
  );
}

// ─── Marchés ─────────────────────────────────────────────────────────────────

function fmtIndex(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function MarketsMegaMenu() {
  const [indices, setIndices] = useState<MarketIndex[] | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API_BASE_URL}/indices/latest?limit=2`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: MarketIndex[]) => setIndices(Array.isArray(d) ? d : []))
      .catch(() => { if (!ctrl.signal.aborted) setIndices([]); });
    return () => ctrl.abort();
  }, []);

  const items: MenuItem[] = [
    { to: '/markets',                 icon: BarChart3,  label: 'Toutes les actions', desc: 'Cours, volumes, PER, rendement' },
    { to: '/markets?vue=carte',       icon: LayoutGrid, label: 'Carte de marché',    desc: 'Le marché en un coup d’œil' },
    { to: '/markets?onglet=hausses',  icon: TrendingUp, label: 'Hausses & baisses',  desc: 'Les plus fortes variations' },
    { to: '/markets?onglet=secteurs', icon: PieChart,   label: 'Secteurs',           desc: 'Performance par secteur' },
    { to: '/indices',                 icon: LineChart,  label: 'Indices BRVM',       desc: 'Composite, 30, Prestige…' },
  ];

  return (
    <Panel width="w-[620px]">
      <div className="flex">
        <div className="flex-1 p-2">
          {items.map((it) => <ItemLink key={it.to} {...it} />)}
        </div>
        <div className="w-[220px] shrink-0 border-l border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Indices du jour</p>
          <div className="space-y-2">
            {indices === null
              ? [0, 1].map((i) => <div key={i} className="h-[58px] animate-pulse rounded-xl bg-slate-200/60" />)
              : indices.length === 0
                ? <p className="text-xs text-slate-500">Indices indisponibles.</p>
                : indices.map((ix) => {
                    const up = (ix.daily_change_percent ?? 0) >= 0;
                    return (
                      <Link key={ix.id} to="/indices" className="block rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/70 hover:ring-blue-300 transition">
                        <p className="truncate text-[11px] text-slate-500">{ix.index_name}</p>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold tabular-nums text-slate-900">{fmtIndex(ix.index_value)}</span>
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${up ? 'text-emerald-600' : 'text-red-600'}`}>
                            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {up ? '+' : ''}{(ix.daily_change_percent ?? 0).toFixed(2)}%
                          </span>
                        </div>
                      </Link>
                    );
                  })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ─── Actualités ──────────────────────────────────────────────────────────────

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function NewsMegaMenu() {
  const latest = [...BRVM_NEWS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  return (
    <Panel width="w-[460px]">
      <div className="p-2">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Dernières analyses BRVM</p>
        {latest.map((a) => (
          <Link
            key={a.id}
            to={`/news/${a.id}`}
            role="menuitem"
            className="group block rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors"
          >
            <span className="mb-0.5 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-semibold text-blue-700">{a.category}</span>·<span>{fmtDateShort(a.publishedAt)}</span>
            </span>
            <span className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-blue-700">
              {a.title}
            </span>
          </Link>
        ))}
      </div>
      <Footer
        to="/news"
        label="Toutes les actualités"
        hint={<span className="inline-flex items-center gap-1"><Newspaper className="h-3.5 w-3.5" /> Marchés, dividendes, résultats</span>}
      />
    </Panel>
  );
}

// ─── Communauté ──────────────────────────────────────────────────────────────

export function CommunityMegaMenu() {
  const { isLoggedIn } = useAuth();
  const gated = (to: string) => (isLoggedIn ? to : '/login');

  const items: MenuItem[] = [
    { to: '/community',                    icon: MessageCircle, label: "Fil d'actualité",  desc: 'Idées et analyses des membres' },
    { to: '/communities',                  icon: Users,         label: 'Groupes',          desc: 'Rejoignez des cercles thématiques' },
    { to: gated('/challenge/community'),   icon: Trophy,        label: 'Challenge 2026',   desc: 'Compétition de trading simulé' },
    { to: '/classement',                   icon: Medal,         label: 'Classement',       desc: 'Les meilleurs investisseurs' },
    { to: gated('/achievements'),          icon: Award,         label: 'Badges & XP',      desc: 'Suivez votre progression' },
  ];

  return (
    <Panel>
      <ItemGrid items={items} />
      <Footer
        to={gated('/challenge/community')}
        label={isLoggedIn ? 'Rejoindre le Challenge' : 'Se connecter pour participer'}
        hint="Grimpez au classement, débloquez des badges"
      />
    </Panel>
  );
}
