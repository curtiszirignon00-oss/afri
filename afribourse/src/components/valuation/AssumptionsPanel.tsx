import { RotateCcw } from 'lucide-react';
import type { BetaDataset, BetaSource, CostOfCapitalResult } from '../../lib/valuation';
import type { EditableAssumptions } from '../../hooks/useValuation';
import type { ValuationInputs } from '../../services/valuationApi';
import { NAVY, formatNumber, formatPercent } from './ValuationFormat';

type Props = {
  assumptions: EditableAssumptions;
  capital: CostOfCapitalResult;
  inputs: ValuationInputs;
  onChange: <K extends keyof EditableAssumptions>(key: K, value: EditableAssumptions[K]) => void;
  onReset: () => void;
  readOnly?: boolean;
};

const DATASET_LABELS: Record<BetaDataset, string> = {
  global: 'Global',
  emerging: 'Émergent',
  us: 'États-Unis',
  europe: 'Europe',
  japan: 'Japon'
};

const BETA_SOURCES: { value: BetaSource; label: string; hint: string }[] = [
  { value: 'BOTTOM_UP', label: 'Bottom-up réendetté', hint: 'Moyenne des fiches Damodaran, réendettée par Hamada' },
  { value: 'REGRESSION', label: 'Régression BRVM', hint: 'Bêta du titre contre le composite' },
  { value: 'MANUAL', label: 'Saisie manuelle', hint: 'Bêta désendetté imposé' }
];

/** Un champ de pourcentage, saisi en points et stocké en décimal. */
function PercentField({
  label,
  hint,
  value,
  onChange,
  step = 0.05,
  disabled
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600">{label}</span>
      <div className="mt-1 flex items-center gap-1">
        <input
          type="number"
          step={step}
          disabled={disabled}
          value={Number((value * 100).toFixed(4))}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (Number.isFinite(next)) onChange(next / 100);
          }}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm tabular-nums focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
        <span className="text-sm text-gray-400">%</span>
      </div>
      {hint && <span className="mt-0.5 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  );
}

/**
 * Panneau d'hypothèses — l'équivalent des cellules jaunes du modèle Excel.
 * Toute modification recalcule l'ensemble immédiatement : le moteur tourne dans
 * le navigateur, aucune requête n'est émise.
 */
export default function AssumptionsPanel({
  assumptions,
  capital,
  inputs,
  onChange,
  onReset,
  readOnly = false
}: Props) {
  const weightSum = assumptions.weights.dcf + assumptions.weights.ddm + assumptions.weights.anc;
  const availableDatasets = inputs.sectorBetas.map((b) => b.dataset);

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold" style={{ color: NAVY }}>
            Hypothèses
          </h3>
          <p className="text-sm text-gray-500">
            Chaque valeur est pilotable ; tout se recalcule en direct.
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </header>

      {/* --- Coût du capital */}
      <div className="mt-6">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Coût du capital</h4>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-3">
          <PercentField label="Taux sans risque (Rf)" value={assumptions.riskFreeRate} onChange={(v) => onChange('riskFreeRate', v)} disabled={readOnly} />
          <PercentField label="Prime action (ERP)" value={assumptions.erp} onChange={(v) => onChange('erp', v)} disabled={readOnly} />
          <PercentField label="Prime pays (CRP)" value={assumptions.crp} onChange={(v) => onChange('crp', v)} disabled={readOnly} />
          <PercentField label="Coût de la dette (Kd)" value={assumptions.costOfDebt} onChange={(v) => onChange('costOfDebt', v)} disabled={readOnly} />
          <PercentField label="Taux d'IS" value={assumptions.taxRate} onChange={(v) => onChange('taxRate', v)} disabled={readOnly} />
          <PercentField label="Croissance à l'infini (g)" step={0.1} value={assumptions.gTerminal} onChange={(v) => onChange('gTerminal', v)} disabled={readOnly} />
          <PercentField label="Gearing cible D/(D+CP)" step={1} value={assumptions.gearingTarget} onChange={(v) => onChange('gearingTarget', v)} disabled={readOnly} />
          <PercentField
            label="Gearing max plausible"
            hint="Au-delà, on retombe sur la cible"
            step={1}
            value={assumptions.gearingMaxPlausible}
            onChange={(v) => onChange('gearingMaxPlausible', v)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* --- Bêta : le choix revient à l'utilisateur */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Bêta</h4>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {BETA_SOURCES.map((s) => (
              <button
                key={s.value}
                type="button"
                disabled={readOnly || (s.value === 'REGRESSION' && inputs.regression.beta === null)}
                onClick={() => onChange('betaSource', s.value)}
                title={s.hint}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  assumptions.betaSource === s.value
                    ? 'border-transparent text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                style={assumptions.betaSource === s.value ? { backgroundColor: NAVY } : undefined}
              >
                {s.label}
              </button>
            ))}
          </div>

          {assumptions.betaSource === 'BOTTOM_UP' && (
            <div>
              <span className="block text-xs font-medium text-gray-600">
                Fiches Damodaran moyennées
                {inputs.damodaranSector && (
                  <span className="ml-1 font-normal text-gray-400">— {inputs.damodaranSector}</span>
                )}
              </span>
              {availableDatasets.length === 0 ? (
                <p className="mt-1 text-xs text-amber-700">
                  Aucune fiche sectorielle en base pour ce titre : importez les fiches Damodaran.
                </p>
              ) : (
                <div className="mt-1.5 flex flex-wrap gap-3">
                  {inputs.sectorBetas.map((b) => (
                    <label key={b.dataset} className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={assumptions.betaDatasets.includes(b.dataset)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...assumptions.betaDatasets, b.dataset]
                            : assumptions.betaDatasets.filter((d) => d !== b.dataset);
                          // Au moins une fiche doit rester cochée, sinon le bêta
                          // bottom-up n'a plus de source.
                          if (next.length > 0) onChange('betaDatasets', next);
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      {DATASET_LABELS[b.dataset]}
                      <span className="tabular-nums text-gray-400">{formatNumber(b.beta_unlevered, 4)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {assumptions.betaSource === 'MANUAL' && (
            <label className="block max-w-xs">
              <span className="block text-xs font-medium text-gray-600">Bêta désendetté imposé</span>
              <input
                type="number"
                step={0.01}
                disabled={readOnly}
                value={assumptions.betaUnleveredOverride ?? ''}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onChange('betaUnleveredOverride', Number.isFinite(v) ? v : null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm tabular-nums focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </label>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-gray-50 p-3 text-xs lg:grid-cols-4">
            <div>
              <dt className="text-gray-500">β désendetté</dt>
              <dd className="font-bold tabular-nums" style={{ color: NAVY }}>
                {formatNumber(capital.betaUnlevered, 4)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">β réendetté</dt>
              <dd className="font-bold tabular-nums" style={{ color: NAVY }}>
                {formatNumber(capital.betaLevered, 4)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Ke</dt>
              <dd className="font-bold tabular-nums" style={{ color: NAVY }}>
                {formatPercent(capital.costOfEquity)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">WACC</dt>
              <dd className="font-bold tabular-nums" style={{ color: NAVY }}>
                {formatPercent(capital.wacc)}
              </dd>
            </div>
            <div className="col-span-2 lg:col-span-2">
              <dt className="text-gray-500">Gearing retenu</dt>
              <dd className="font-medium tabular-nums text-gray-800">
                {formatPercent(capital.gearing, 1)}
                {capital.gearingObserved !== null && (
                  <span className="ml-1 font-normal text-gray-400">
                    (observé {formatPercent(capital.gearingObserved, 1)})
                  </span>
                )}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">β régression (contrôle)</dt>
              <dd className="font-medium tabular-nums text-gray-800">
                {formatNumber(inputs.regression.beta, 4)}
                {inputs.regression.correlation !== null && (
                  <span className="ml-1 font-normal text-gray-400">
                    corr. {formatNumber(inputs.regression.correlation, 3)} · {inputs.regression.points} pts
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* --- Structure & synthèse */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Structure & synthèse</h4>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600">Nombre d'actions</span>
            <input
              type="number"
              disabled={readOnly}
              value={assumptions.sharesOutstanding}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v > 0) onChange('sharesOutstanding', v);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm tabular-nums focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
            />
          </label>
          <PercentField label="Poids DCF" step={5} value={assumptions.weights.dcf} onChange={(v) => onChange('weights', { ...assumptions.weights, dcf: v })} disabled={readOnly} />
          <PercentField label="Poids DDM" step={5} value={assumptions.weights.ddm} onChange={(v) => onChange('weights', { ...assumptions.weights, ddm: v })} disabled={readOnly} />
          <PercentField label="Poids ANC" step={5} value={assumptions.weights.anc} onChange={(v) => onChange('weights', { ...assumptions.weights, anc: v })} disabled={readOnly} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600">DDM retenu en synthèse</span>
            <select
              disabled={readOnly}
              value={assumptions.ddmBasis}
              onChange={(e) => onChange('ddmBasis', e.target.value as EditableAssumptions['ddmBasis'])}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
            >
              <option value="TWO_STAGE">2 phases</option>
              <option value="GORDON">Gordon</option>
              <option value="AVERAGE">Moyenne des deux</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-gray-600">Saisonnalité</span>
            <select
              disabled={readOnly}
              value={assumptions.seasonalityStat}
              onChange={(e) => onChange('seasonalityStat', e.target.value as EditableAssumptions['seasonalityStat'])}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
            >
              <option value="MEAN">Moyenne</option>
              <option value="MEDIAN">Médiane</option>
            </select>
          </label>
          <label className="col-span-2 block">
            <span className="block text-xs font-medium text-gray-600">
              Poids de l'ancrage T-1
              <span className="ml-1 font-normal text-gray-400">
                {(assumptions.anchorWeight * 100).toFixed(0)} % — 0 = tendance pure, 100 = ancrage pur
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              disabled={readOnly}
              value={assumptions.anchorWeight}
              onChange={(e) => onChange('anchorWeight', Number(e.target.value))}
              className="mt-2 w-full accent-orange-600"
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600">
              Convergence du BFR
              <span className="ml-1 font-normal text-gray-400">exercices</span>
            </span>
            <input
              type="number"
              min={0}
              max={10}
              step={1}
              disabled={readOnly}
              value={assumptions.bfrConvergenceYears}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v >= 0) onChange('bfrConvergenceYears', v);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm tabular-nums focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
            />
            <span className="mt-0.5 block text-[11px] text-gray-400">
              Nombre d'exercices pour ramener le ratio BFR/CA à sa cible.
            </span>
          </label>
          <label className="col-span-2 flex items-start gap-2 lg:col-span-3">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={assumptions.dropDcfWhenNegative}
              onChange={(e) => onChange('dropDcfWhenNegative', e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-xs text-gray-600">
              Exclure le DCF de la synthèse quand il ressort négatif
              <span className="mt-0.5 block text-[11px] text-gray-400">
                Son poids est alors reparti sur le DDM et l'ANC ; la valeur DCF reste affichée en
                diagnostic. Sans dette couverte, une moyenne incluant un DCF négatif n'a pas de sens.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* --- Garde-fous, toujours visibles */}
      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        <GuardBadge ok={capital.wacc > assumptions.gTerminal} label={`WACC > g (${formatPercent(capital.wacc)} vs ${formatPercent(assumptions.gTerminal)})`} />
        <GuardBadge ok={capital.costOfEquity > assumptions.gTerminal} label="Ke > g" />
        <GuardBadge ok={Math.abs(weightSum - 1) < 1e-6} label={`Somme des poids = ${(weightSum * 100).toFixed(0)} %`} />
      </div>
    </section>
  );
}

function GuardBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${
        ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <span aria-hidden>{ok ? '✓' : '✕'}</span>
      {label}
    </span>
  );
}
