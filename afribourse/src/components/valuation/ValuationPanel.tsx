import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useValuation } from '../../hooks/useValuation';
import type { ScenarioId } from '../../lib/valuation';
import AssumptionsPanel from './AssumptionsPanel';
import FootballField from './FootballField';
import ProjectionGrid from './ProjectionGrid';
import SensitivityTornado from './SensitivityTornado';
import { NAVY, ORANGE, SEVERITY_STYLES, formatMillions, formatPerShare, formatUpside } from './ValuationFormat';

const SCENARIO_TABS: { id: ScenarioId; label: string }[] = [
  { id: 'pessimistic', label: 'Pessimiste' },
  { id: 'base', label: 'Base' },
  { id: 'optimistic', label: 'Optimiste' }
];

/** Les paliers qui ouvrent la valorisation fondamentale. */
const PREMIUM_TIERS = ['investisseur-plus', 'premium', 'pro', 'max'];

/**
 * Onglet valorisation fondamentale. Réservé aux abonnés : accessible par lien
 * direct, sans entrée de navigation pour l'instant.
 */
export default function ValuationPanel({ symbol }: { symbol: string }) {
  const { userProfile } = useAuth();
  const tier = userProfile?.subscriptionTier ?? 'free';
  const hasAccess = PREMIUM_TIERS.includes(tier);
  const isAdmin = userProfile?.role === 'admin';

  const valuation = useValuation(hasAccess ? symbol : '');
  const [showProjection, setShowProjection] = useState(false);

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Lock className="mx-auto h-10 w-10" style={{ color: ORANGE }} />
        <h2 className="mt-4 text-2xl font-bold" style={{ color: NAVY }}>
          Valorisation fondamentale
        </h2>
        <p className="mt-2 text-gray-600">
          Cette analyse — DCF, DDM, actif net et synthèse pondérée sur trois scénarios —
          est réservée aux abonnés.
        </p>
        <Link
          to="/subscriptions"
          className="mt-6 inline-block rounded-lg px-5 py-2.5 font-semibold text-white"
          style={{ backgroundColor: ORANGE }}
        >
          Voir les abonnements
        </Link>
      </div>
    );
  }

  if (valuation.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Chargement">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderColor: NAVY }} />
      </div>
    );
  }

  if (valuation.loadError || !valuation.computed) {
    return (
      <Notice severity="error" title="Valorisation indisponible">
        {valuation.loadError ?? "Aucune donnée de valorisation pour ce titre."}
      </Notice>
    );
  }

  const { computed } = valuation;

  if (!computed.ok) {
    return (
      <div className="space-y-4 px-4 py-6">
        <Notice severity="error" title="Calcul impossible">
          {computed.error}
        </Notice>
        {computed.capital && (
          <AssumptionsPanel
            assumptions={computed.assumptions}
            capital={computed.capital}
            inputs={computed.inputs}
            onChange={valuation.setAssumption}
            onReset={valuation.resetAssumptions}
            readOnly={!isAdmin}
          />
        )}
      </div>
    );
  }

  const { result, capital, inputs, assumptions, tornado, netDebt } = computed;
  const active = result.outcomes[valuation.scenario];
  const weighted = formatUpside(result.upside[valuation.scenario]);

  return (
    <div className="space-y-5 px-4 py-6">
      {/* Cadre réglementaire — jamais un prix cible unique présenté comme une promesse. */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <p className="text-xs leading-relaxed text-gray-600">
            <strong className="text-gray-800">Analyse pédagogique et méthodologique.</strong>{' '}
            Les valeurs ci-dessous sont des fourchettes issues de trois scénarios explicites,
            et non un prix cible ni une recommandation d'investissement. Toutes les hypothèses
            sont visibles et modifiables : modifiez-les pour voir comment la valeur réagit.
          </p>
        </div>
      </div>

      {/* Sélecteur de scénario + chiffres clés */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-2">
          {SCENARIO_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => valuation.setScenario(tab.id)}
              className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                valuation.scenario === tab.id
                  ? 'border-transparent text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              style={valuation.scenario === tab.id ? { backgroundColor: NAVY } : undefined}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">
            {inputs.stock.companyName} · {inputs.statements.filter((s) => s.period === 'FY').length} exercices ·
            dette nette {formatMillions(netDebt)} M
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat label="DCF" value={formatPerShare(result.values[valuation.scenario].dcf)} negative={result.values[valuation.scenario].dcf < 0} />
          <Stat label="DDM Gordon" value={formatPerShare(result.values[valuation.scenario].ddmGordon)} />
          <Stat label="DDM 2 phases" value={formatPerShare(result.values[valuation.scenario].ddmTwoStage)} />
          <Stat label="Actif net" value={formatPerShare(result.values[valuation.scenario].anc)} />
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Synthèse</dt>
            <dd className="text-xl font-bold" style={{ color: ORANGE }}>
              {formatPerShare(result.values[valuation.scenario].weighted)}
            </dd>
            <dd className={`text-xs font-semibold ${weighted.className}`}>{weighted.text} vs cours</dd>
          </div>
        </dl>
      </div>

      {/* Alertes de lecture */}
      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w) => (
            <Notice key={w.code} severity={w.severity}>
              {w.message}
            </Notice>
          ))}
        </div>
      )}
      {capital.warnings.map((w) => (
        <Notice key={w.code} severity={w.severity}>
          {w.message}
        </Notice>
      ))}

      <FootballField result={result} />

      {/* DCF inversé : ce que le cours suppose */}
      {active.invertedDcf && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold" style={{ color: NAVY }}>
            Ce que le cours suppose
          </h3>
          <p className="text-sm text-gray-500">
            Lecture inverse : au lieu d'opposer un prix au marché, on mesure le flux
            normatif qu'il faudrait pour justifier le cours de {formatPerShare(result.price)}.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Flux normatif requis" value={`${formatMillions(active.invertedDcf.requiredNormativeFlow)} M`} />
            <Stat label="Flux du scénario" value={`${formatMillions(active.invertedDcf.modelNormativeFlow)} M`} />
            <Stat
              label="Multiple à justifier"
              value={
                active.invertedDcf.flowMultiple !== null
                  ? `${active.invertedDcf.flowMultiple.toFixed(1).replace('.', ',')} ×`
                  : '—'
              }
            />
            <Stat label="Actif économique implicite" value={`${formatMillions(active.invertedDcf.impliedEnterpriseValue)} M`} />
          </dl>
        </section>
      )}

      <AssumptionsPanel
        assumptions={assumptions}
        capital={capital}
        inputs={inputs}
        onChange={valuation.setAssumption}
        onReset={valuation.resetAssumptions}
        readOnly={!isAdmin}
      />

      <div>
        <button
          type="button"
          onClick={() => setShowProjection((v) => !v)}
          className="mb-3 text-sm font-semibold underline decoration-dotted"
          style={{ color: NAVY }}
        >
          {showProjection ? 'Masquer' : 'Afficher'} le détail de la projection
        </button>
        {showProjection && (
          <ProjectionGrid
            projection={active.projection}
            onOverride={(line, year, value) => valuation.setOverride(valuation.scenario, line, year, value)}
            onClearAll={valuation.clearOverrides}
            readOnly={!isAdmin}
          />
        )}
      </div>

      <SensitivityTornado bars={tornado} />
    </div>
  );
}

function Stat({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-xl font-bold" style={negative ? { color: '#DC2626' } : { color: NAVY }}>
        {value}
      </dd>
    </div>
  );
}

function Notice({
  severity,
  title,
  children
}: {
  severity: 'info' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
}) {
  const Icon = severity === 'info' ? Info : severity === 'warning' ? AlertTriangle : AlertCircle;
  return (
    <div className={`rounded-lg border p-3.5 ${SEVERITY_STYLES[severity]}`}>
      <div className="flex gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-sm">
          {title && <p className="font-semibold">{title}</p>}
          <p className="leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  );
}
