// Leader election entre onglets du même navigateur.
// Un seul onglet (le "leader") effectue les requêtes de polling.
// Les autres onglets reçoivent les résultats via BroadcastChannel,
// éliminant l'amplification N-onglets × M-polls.

const LEADER_KEY = 'afribourse:poll-leader';

// Intervalle du heartbeat du leader (renouvelle le verrou)
const HEARTBEAT_MS = 4_000;
// Durée après laquelle un leader sans heartbeat est considéré mort
const STALE_MS = 9_000; // doit être > HEARTBEAT_MS

const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Canal de diffusion des résultats de polling vers les onglets followers
export const pollChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('afribourse:poll-data')
  : null;

// Événement DOM local déclenché quand cet onglet devient leader
export const LEADERSHIP_EVENT = 'afribourse:leadership-acquired';

let _leader = false;
let _heartbeat: ReturnType<typeof setInterval> | null = null;

function readEntry(): { id: string; ts: number } | null {
  try { return JSON.parse(localStorage.getItem(LEADER_KEY) ?? 'null'); }
  catch { return null; }
}

function writeEntry(): void {
  localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, ts: Date.now() }));
}

function elect(): void {
  if (_leader) return;
  const entry = readEntry();
  if (!entry || Date.now() - entry.ts > STALE_MS) {
    writeEntry();
    _leader = true;
    if (!_heartbeat) _heartbeat = setInterval(writeEntry, HEARTBEAT_MS);
    window.dispatchEvent(new Event(LEADERSHIP_EVENT));
  }
}

// Élection initiale au chargement du module
elect();

// Vérification périodique pour les onglets followers (si le leader ferme brusquement)
setInterval(elect, STALE_MS + 1_000);

// Quand le leader libère proprement le verrou (beforeunload), relancer l'élection
window.addEventListener('storage', (e) => {
  if (e.key === LEADER_KEY && !e.newValue) elect();
});

// Libérer le leadership à la fermeture de l'onglet
window.addEventListener('beforeunload', () => {
  if (_leader) {
    localStorage.removeItem(LEADER_KEY);
    if (_heartbeat) clearInterval(_heartbeat);
  }
});

export const isPollingLeader = (): boolean => _leader;
