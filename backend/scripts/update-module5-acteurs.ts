import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const blocks = [
  {
    type: 'objectives',
    title: '🎯 Objectifs Pédagogiques',
    subtitle: 'À la fin de ce module, vous serez capable :',
    items: [
      "d'identifier les rôles et responsabilités des principaux acteurs du marché financier régional (SGI, AMF-UMOA, DC/BR, BCEAO, entreprises cotées)",
      "de comprendre comment vos ordres d'achat ou de vente circulent dans le système",
      "de visualiser la chaîne complète de sécurité qui protège votre argent et vos titres à la BRVM",
    ],
  },

  // ── 5.1 Architecture tripartite ──────────────────────────────────────────────
  {
    type: 'section-title',
    text: '5.1 — L\'architecture tripartite du marché financier régional',
    color: 'blue',
  },
  {
    type: 'paragraph',
    text: 'Le marché financier de l\'UEMOA repose sur <strong>trois piliers institutionnels</strong> qui assurent son bon fonctionnement et sa sécurité : <strong>BCEAO, AMF-UMOA et DC/BR.</strong> Chaque pilier joue un rôle bien précis et complémentaire.',
  },

  // ── 5.1.1 BCEAO ──────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '🏦 5.1.1 La BCEAO — Superviseur macroéconomique et monétaire',
    color: 'purple',
  },
  {
    type: 'callout',
    variant: 'info',
    title: 'BCEAO = Banque Centrale des États de l\'Afrique de l\'Ouest',
    paragraphs: [
      'Rôle principal : Assurer la stabilité monétaire et macroéconomique dans toute la zone UEMOA.',
    ],
  },
  {
    type: 'list',
    items: [
      'Définir et conduire la <strong>politique monétaire</strong> (taux directeurs, inflation, masse monétaire)',
      'Superviser le système bancaire et de paiement régional',
      'Assurer la <strong>stabilité financière globale</strong>',
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: '📉 Impact sur le marché financier',
    paragraphs: [
      'Lorsque la BCEAO <strong>baisse ses taux</strong>, les entreprises empruntent plus facilement, leurs bénéfices potentiels augmentent → les actions montent.',
      'Lorsqu\'elle <strong>relève ses taux</strong>, le crédit devient plus cher → les valorisations boursières peuvent baisser.',
    ],
  },
  {
    type: 'highlight',
    text: '🧩 <strong>À retenir :</strong> La BCEAO ne gère pas directement la BRVM, mais influence fortement son évolution.',
  },

  // ── 5.1.2 AMF-UMOA ───────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '⚖️ 5.1.2 L\'AMF-UMOA — Le régulateur, gardien de la transparence',
    color: 'green',
  },
  {
    type: 'callout',
    variant: 'info',
    title: 'AMF-UMOA = Autorité des Marchés Financiers de l\'UEMOA',
    paragraphs: [
      'Anciennement <em>CREPMF</em> — Conseil Régional de l\'Épargne Publique et des Marchés Financiers.',
      'Rôle principal : Veiller à la <strong>protection des investisseurs</strong> et à la <strong>transparence du marché</strong>.',
    ],
  },
  {
    type: 'list',
    items: [
      '<strong>Réglementer :</strong> elle définit les règles de fonctionnement des marchés et des acteurs',
      '<strong>Autoriser :</strong> elle approuve les introductions en bourse, les émissions d\'obligations, etc.',
      '<strong>Surveiller et sanctionner :</strong> elle enquête sur les abus, manipulations ou délits d\'initiés',
      '<strong>Agréer :</strong> elle délivre les agréments aux SGI, sociétés de gestion, fonds, etc.',
    ],
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '💬 Pourquoi c\'est important pour vous',
    paragraphs: [
      'L\'AMF-UMOA agit comme un <strong>gendarme financier</strong>. Elle s\'assure que les sociétés cotées publient des informations fiables, que les SGI respectent les règles, et que vos transactions sont conformes aux lois <strong>LBC/FT</strong> (Lutte contre le Blanchiment et le Financement du Terrorisme).',
    ],
  },
  {
    type: 'highlight',
    text: '🧩 <strong>À retenir :</strong> C\'est votre bouclier réglementaire. Sans AMF-UMOA, la confiance dans le marché s\'effondrerait.',
  },

  // ── 5.1.3 DC/BR ──────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '🔐 5.1.3 Le DC/BR — Le notaire du marché et le coffre-fort digital',
    color: 'orange',
  },
  {
    type: 'callout',
    variant: 'info',
    title: 'DC/BR = Dépositaire Central / Banque de Règlement',
    paragraphs: [
      'C\'est l\'entité qui <strong>conserve, sécurise et fait circuler</strong> les titres financiers dans la zone UEMOA.',
    ],
  },
  {
    type: 'list',
    items: [
      '<strong>Conservation des titres :</strong> Vos actions et obligations ne sont pas stockées chez votre SGI, mais enregistrées au DC/BR à votre nom. Si votre SGI disparaît, vos titres restent intacts et récupérables.',
      '<strong>Règlement-livraison :</strong> Quand vous achetez, le DC/BR transfère les titres sur votre compte et l\'argent vers le vendeur — simultanément, pour éviter les fraudes.',
      '<strong>Banque de règlement :</strong> Il gère les flux financiers liés aux transactions entre les SGI.',
    ],
  },

  // ── 5.2 L'Investisseur ───────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '💼 5.2 L\'Investisseur — C\'est vous',
    color: 'blue',
  },
  {
    type: 'paragraph',
    text: 'Vous êtes le <strong>cœur battant du marché</strong>. Sans investisseurs, pas de liquidité, pas de dynamisme.',
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Deux grandes catégories',
    paragraphs: [
      '<strong>Investisseurs particuliers :</strong> Des individus (comme vous, Mamadou ou Aïssata) qui investissent leur propre épargne. Objectif : faire croître leur capital sur le long terme.',
      '<strong>Investisseurs institutionnels :</strong> Les grands acteurs — compagnies d\'assurances, fonds de pension, OPCVM (SICAV, FCP), banques et fonds souverains. Ils gèrent des milliards pour le compte de clients, salariés, ou citoyens.',
    ],
  },
  {
    type: 'highlight',
    text: '📘 <strong>À retenir :</strong> Même un petit investisseur particulier contribue à la santé économique régionale. Votre investissement finance directement les entreprises africaines.',
  },

  // ── 5.3 Sociétés Cotées ──────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '🏢 5.3 Les Sociétés Cotées — Les « champions économiques » de la région',
    color: 'green',
  },
  {
    type: 'paragraph',
    text: 'Ce sont les entreprises émettrices dont les titres (actions ou obligations) sont <strong>échangés à la BRVM</strong>.',
  },
  {
    type: 'callout',
    variant: 'info',
    title: 'Pourquoi elles se cotent',
    paragraphs: [
      'Pour lever des fonds <strong>sans emprunter auprès des banques</strong>.',
      'Pour accroître leur <strong>notoriété et leur transparence</strong>.',
      'Pour <strong>associer les citoyens</strong> à leur réussite.',
    ],
  },
  {
    type: 'list',
    items: [
      '<strong>Sonatel</strong> (Sénégal) – Télécommunications',
      '<strong>Ecobank Côte d\'Ivoire</strong> – Banque',
      '<strong>Nestlé Côte d\'Ivoire</strong> – Agroalimentaire',
      '<strong>Palmci</strong> (Côte d\'Ivoire) – Agriculture / huile de palme',
      '<strong>TotalEnergies Marketing CI</strong> – Distribution énergétique',
    ],
  },

  // ── 5.4 SGI ──────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '⚙️ 5.4 Les SGI — Votre Porte d\'Entrée sur le Marché',
    color: 'purple',
  },
  {
    type: 'callout',
    variant: 'info',
    title: 'SGI = Société de Gestion et d\'Intermédiation',
    paragraphs: [
      'C\'est votre <strong>intermédiaire officiel</strong> pour accéder au marché.',
    ],
  },
  {
    type: 'list',
    items: [
      'Ouvrir et gérer votre <strong>compte-titres</strong>',
      'Transmettre vos ordres d\'achat et de vente à la BRVM',
      'Conserver vos fonds non investis en attendant leur placement',
      'Vous conseiller sur la stratégie à adopter selon votre profil',
    ],
  },

  // ── 5.5 Autres acteurs ───────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '🌐 5.5 Autres Acteurs Importants',
    color: 'orange',
  },
  {
    type: 'list',
    items: [
      '<strong>Sociétés de Gestion d\'OPCVM (SGO) :</strong> elles gèrent les fonds communs de placement (FCP, SICAV)',
      '<strong>Experts-comptables et commissaires aux comptes :</strong> ils certifient les états financiers des sociétés cotées',
      '<strong>Médias économiques et analystes financiers :</strong> ils informent le public et facilitent la transparence',
    ],
  },

  // ── Glossaire ────────────────────────────────────────────────────────────────
  {
    type: 'glossary',
    items: [
      { term: 'SGI', definition: 'Société de Gestion et d\'Intermédiation – intermédiaire entre l\'investisseur et la BRVM' },
      { term: 'AMF-UMOA', definition: 'Autorité des Marchés Financiers de l\'UEMOA – régulateur et gardien de la transparence du marché' },
      { term: 'DC/BR', definition: 'Dépositaire Central / Banque de Règlement – garant de la conservation et du règlement des titres' },
      { term: 'BCEAO', definition: 'Banque Centrale des États de l\'Afrique de l\'Ouest – supervise la politique monétaire régionale' },
      { term: 'Investisseur institutionnel', definition: 'Structure (assurance, fonds, banque) investissant au nom de clients ou de bénéficiaires' },
      { term: 'Société cotée', definition: 'Entreprise dont les titres sont listés et échangés sur le marché financier' },
    ],
  },

  // ── Prochaine étape ──────────────────────────────────────────────────────────
  {
    type: 'callout',
    variant: 'ok',
    title: '🧭 Prochaine Étape',
    paragraphs: [
      'Bravo 🎉 Vous connaissez désormais les principaux acteurs du marché financier et comprenez comment leurs rôles s\'articulent pour garantir la sécurité, la transparence et la confiance.',
      '👉 <strong>Module 6 : Les Instruments — Actions, Obligations et OPCVM.</strong> Vous y découvrirez concrètement les instruments financiers que vous pouvez acheter à la BRVM.',
    ],
  },
];

async function run() {
  const module = await prisma.learningModule.findFirst({
    where: { slug: 'acteurs-du-jeu' },
    select: { id: true, title: true, order_index: true },
  });

  if (!module) {
    console.error('Module acteurs-du-jeu not found');
    await prisma.$disconnect();
    return;
  }

  console.log(`Updating: [${module.order_index}] ${module.title}`);

  await prisma.learningModule.update({
    where: { id: module.id },
    data: {
      title: 'Les Acteurs du Jeu — Qui fait quoi sur le marché ?',
      content_json: JSON.stringify(blocks),
      has_quiz: false,
    },
  });

  console.log(`✅ Done — ${blocks.length} blocks written`);
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
