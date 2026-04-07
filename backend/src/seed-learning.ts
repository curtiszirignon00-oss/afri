// backend/src/seed-learning.ts

import { PrismaClient } from '@prisma/client';
import { connectPrismaDatabase, disconnectPrismaDatabase } from './config/database.prisma';

const prisma = new PrismaClient();

// Fonction utilitaire pour créer ou mettre à jour un module de manière sécurisée
async function createOrUpdateModule(data: any) {
  const { slug, ...updateData } = data; // Extrait le slug

  if (!slug) {
    console.error(`❌ Erreur: Slug manquant pour le module: ${data.title}`);
    return;
  }

  try {
    const existingModule = await prisma.learningModule.findFirst({
      where: { slug: slug },
    });

    // CORRECTION: Suppression du champ main_goals qui n'existe pas sur le modèle LearningModule
    const moduleData = {
      ...updateData,
      slug: slug,
    };

    if (existingModule) {
      // Mettre à jour (sans le champ slug, qui est dans le where)
      await prisma.learningModule.update({
        where: { id: existingModule.id }, // On utilise l'ID récupéré
        data: moduleData,
      });
      console.log(`✅ Module ${data.order_index}: ${data.title} (slug: ${slug}) mis à jour.`);
    } else {
      // Créer
      await prisma.learningModule.create({
        data: moduleData,
      });
      console.log(`✅ Module ${data.order_index}: ${data.title} (slug: ${slug}) créé.`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors du traitement du module ${data.title} (slug: ${slug}):`, error);
    // Laisser l'erreur remonter pour éviter l'arrêt complet
    // throw error; 
  }
}
// --- FIN FONCTION UTILITAIRE ---


async function main() {
  await connectPrismaDatabase();
  console.log("Démarrage de l'insertion/mise à jour des 16 modules d'apprentissage...");

  // ===================================
  // === M0 : PRÊT POUR LE DÉCOLLAGE ===
  // ===================================
  await createOrUpdateModule({
    title: "Prêt pour le décollage? (Mindset)",
    slug: 'pret-decollage',
    description: "Adoptez le bon état d'esprit et comprenez pourquoi la BRVM est une opportunité unique.",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 5,
    order_index: 0,
    is_published: true,
    content: `
<div class="citation-box">
  <p>"L'investissement, c'est le pont entre votre présent et votre futur."</p>
</div>

<div class="objectif-hero">
  <h2>🎯 Objectif pédagogique</h2>
  <p>À la fin de ce module, vous :</p>
  <ul>
    <li>Adopterez le bon état d'esprit d'investisseur à long terme.</li>
    <li>Comprendrez pourquoi la BRVM représente une opportunité unique pour les Africains.</li>
    <li>Connaîtrez la structure complète du parcours de formation.</li>
    <li>Serez capables de distinguer un investisseur d'un spéculateur.</li>
  </ul>
</div>

<div class="section-blue">
  <h2>🪶 0.1 – Bienvenue dans l'Académie : Notre mission pour vous</h2>

  <p>Bienvenue dans l'<strong>Académie AfriBourse</strong>,</p>

  <p>Un espace pensé pour vous — l'épargnant, l'entrepreneur, le jeune professionnel — qui souhaite faire travailler son argent plutôt que de le laisser dormir.</p>

  <div class="warning-box">
    <h3>⚠️ Constat de départ : L'épargne seule ne suffit plus</h3>
    <p>L'inflation grignote la valeur de votre argent au fil du temps.</p>
  </div>

  <p>Notre mission est simple : <strong>transformer votre épargne en capital actif</strong>, grâce à une connaissance claire, à des outils accessibles, et à une pédagogie ancrée dans la réalité africaine.</p>

  <div class="key-points-box">
    <h3>💎 Chez AfriBourse, nous croyons que :</h3>
    <ul>
      <li>La connaissance est la clé de la confiance.</li>
      <li>La discipline est la clé de la réussite financière.</li>
      <li>Chaque Africain mérite une part du développement économique de son continent.</li>
    </ul>
  </div>
</div>

<div class="section-green">
  <h2>🌍 0.2 – La Bourse, un moteur pour nos économies africaines</h2>

  <p>Investir à la BRVM, ce n'est pas seulement chercher un rendement — c'est <strong>participer activement à la construction économique de l'Afrique de l'Ouest</strong>.</p>

  <p>Chaque action achetée, chaque entreprise soutenue, contribue à :</p>

  <ul>
    <li>Financer la croissance de sociétés locales.</li>
    <li>Créer des emplois et soutenir l'innovation.</li>
    <li>Répartir la richesse de manière plus équitable entre citoyens et investisseurs.</li>
  </ul>

  <blockquote>💬 "Quand un Africain investit dans une entreprise africaine, il investit dans le futur de son peuple."</blockquote>

  <div class="analogy-box">
    <h3>⚓ L'analogie à retenir : le piroguier prudent</h3>
    <p>Imaginez votre richesse comme une <strong>pirogue</strong>.</p>
    <p>Le piroguier prudent ne se lance pas sans :</p>
    <ul>
      <li>Vérifier la météo (analyse du marché)</li>
      <li>Préparer son équipage (formation)</li>
      <li>Définir une destination (objectifs financiers)</li>
    </ul>
    <p>Sur la mer de l'investissement, les vagues représentent la volatilité.</p>
    <p>Mais celui qui a un cap, un plan et de la patience <strong>arrive toujours au rivage</strong>.</p>
    <p><strong>💡 La bourse, ce n'est pas un sprint — c'est une navigation.</strong></p>
  </div>
</div>

<div class="section-purple">
  <h2>🗺️ 0.3 – Présentation du parcours : votre feuille de route vers l'autonomie</h2>

  <p>Voici comment se déroule votre voyage au sein de l'<strong>Académie AfriBourse</strong> 👇</p>

  <table>
    <thead>
      <tr>
        <th>Étape</th>
        <th>Objectif</th>
        <th>Modules</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>🧠 Mindset</strong></td>
        <td>Poser les bases mentales et émotionnelles de l'investisseur</td>
        <td>M0, M5</td>
      </tr>
      <tr>
        <td><strong>⚙️ Fondations</strong></td>
        <td>Comprendre les marchés, les acteurs et les instruments</td>
        <td>M1 à M4</td>
      </tr>
      <tr>
        <td><strong>🔍 Analyse & Stratégie</strong></td>
        <td>Maîtriser l'analyse fondamentale et technique</td>
        <td>M6 à M10</td>
      </tr>
      <tr>
        <td><strong>💼 Action & Gestion</strong></td>
        <td>Construire, exécuter et suivre son portefeuille</td>
        <td>M11 à M16</td>
      </tr>
    </tbody>
  </table>

  <div class="key-points-box">
    <h3>🎯 À la fin du parcours, vous serez capable de :</h3>
    <ul>
      <li>Analyser une entreprise cotée à la BRVM</li>
      <li>Identifier le bon moment pour investir</li>
      <li>Construire un portefeuille cohérent et rentable</li>
      <li>Investir avec confiance et méthode</li>
    </ul>
  </div>
</div>

<div class="section-orange">
  <h2>💥 0.4 – Brisons les mythes : Investisseur vs Spéculateur</h2>

  <div class="example-box">
    <h3>❌ Mythe 1 : "Il faut être riche pour investir"</h3>
    <p><strong>FAUX.</strong></p>
    <p>À la BRVM, vous pouvez commencer avec de petites sommes régulières.</p>
    <p><strong>Le plus important n'est pas le capital de départ, mais le temps et la constance.</strong></p>
    <blockquote>💬 "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment, c'est aujourd'hui." – Proverbe africain</blockquote>
  </div>

  <div class="example-box">
    <h3>❌ Mythe 2 : "La Bourse, c'est un casino"</h3>
    <p><strong>NON, ce n'est pas un jeu de hasard.</strong></p>
    <p>La <strong>spéculation</strong> repose sur les émotions et les paris à court terme.</p>
    <p>L'<strong>investissement</strong> repose sur l'analyse, la patience et la vision long terme.</p>
    <blockquote>💡 "The individual investor should act consistently as an investor and not as a speculator." — Benjamin Graham, mentor de Warren Buffett</blockquote>
    <p><strong>En clair :</strong></p>
    <p>L'<strong>investisseur</strong> achète une part d'entreprise pour en partager la réussite.</p>
    <p>Le <strong>spéculateur</strong> parie sur une fluctuation de prix.</p>
    <p><strong>🎯 À la BRVM, nous formons des investisseurs — pas des parieurs.</strong></p>
  </div>
</div>

<div class="glossary-box">
  <h2>🧩 Les termes à maîtriser</h2>
  <table>
    <thead>
      <tr>
        <th>Terme</th>
        <th>Définition simple</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>BRVM</strong></td>
        <td>Bourse Régionale des Valeurs Mobilières : le marché commun de 8 pays de l'UEMOA.</td>
      </tr>
      <tr>
        <td><strong>Investisseur</strong></td>
        <td>Personne qui place son argent dans des actifs pour générer un rendement à long terme.</td>
      </tr>
      <tr>
        <td><strong>Spéculateur</strong></td>
        <td>Personne qui achète et revend à court terme pour profiter de variations de prix.</td>
      </tr>
      <tr>
        <td><strong>Volatilité</strong></td>
        <td>Variation (montée et descente) du prix d'un actif sur une période donnée.</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="cta-box">
  <h3>🚀 Prochaine étape</h3>
  <p>Vous avez préparé votre esprit, compris la vision, et brisé les mythes.</p>
  <p><strong>👉 Passez maintenant au Module 1 : Les Fondations – Qu'est-ce que la Bourse et la BRVM ?</strong></p>
  <p><em>C'est ici que commence votre apprentissage concret du marché financier africain.</em></p>
</div>
        `,
  });

  // ==============================================
  // === M1 : LES FONDATIONS - BOURSE ET BRVM ===
  // ==============================================
  await createOrUpdateModule({
    title: "Les Fondations — Qu'est-ce que la Bourse et la BRVM ?",
    slug: 'fondations-bourse-brvm',
    description: "Comprenez le rôle unique de la BRVM et distinguez clairement le marché primaire du marché secondaire.",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 1,
    is_published: true,
    content: `
<div class="slide" data-slide="1">
  <div class="objectif-hero">
    <h2>🎯 Objectif Pédagogique</h2>
    <p>À la fin de ce module, vous serez capable :</p>
    <ul>
      <li>D'expliquer ce qu'est un marché financier et à quoi il sert</li>
      <li>De comprendre le rôle unique de la BRVM dans l'économie de la zone UEMOA</li>
      <li>De distinguer clairement le marché primaire du marché secondaire</li>
      <li>De comprendre pourquoi et comment une entreprise choisit d'entrer en bourse</li>
    </ul>
  </div>
</div>

<div class="slide" data-slide="2">
  <div class="section-blue">
    <h2>🧩 1.1 Qu'est-ce qu'un marché financier ?</h2>

    <p>Un marché financier est un espace — physique ou digital — où l'argent rencontre les opportunités.</p>

    <p>C'est là que se rencontrent :</p>
    <ul>
      <li>Ceux qui ont de l'argent à placer (investisseurs)</li>
      <li>Ceux qui ont besoin d'argent pour financer leurs projets (entreprises ou États)</li>
    </ul>

    <p>Sur ces marchés, on ne vend pas des produits physiques, mais des titres financiers :</p>
    <ul>
      <li>Les <strong>actions</strong> (parts de propriété dans une entreprise)</li>
      <li>Les <strong>obligations</strong> (prêts faits à une entreprise ou à un État)</li>
    </ul>

    <p>Sur les marchés financiers on distingue :</p>
    <ul>
      <li><strong>Le marché primaire</strong> : le lieu où les nouveaux titres sont émis pour lever des capitaux frais</li>
      <li><strong>Le marché secondaire</strong> : le lieu où ces titres déjà existants s'échangent ensuite entre investisseurs pour assurer leur liquidité</li>
    </ul>

    <div class="analogy-box">
      <h3>🪶 L'analogie à retenir : Le Grand Marché de la Ville</h3>
      <p>Imaginez le grand marché central de votre ville :</p>
      <ul>
        <li>Dans une zone, les producteurs viennent vendre leurs produits frais pour la première fois (🍍 marché primaire)</li>
        <li>Dans une autre zone, les commerçants revendent les produits achetés aux producteurs  (🍊 marché secondaire)</li>
      </ul>
      <p><strong>👉 La BRVM joue le rôle de ce grand marché financier, mais avec des règles claires, un système sécurisé, et une surveillance stricte pour protéger tous les participants.</strong></p>
    </div>

    <h3>📊 Pourquoi les marchés financiers sont essentiels</h3>
    <p>Ils remplissent trois grandes fonctions :</p>
    <ol>
      <li><strong>Canaliser l'épargne vers l'investissement productif</strong> — Votre argent finance des projets réels : usines, routes, innovations.</li>
      <li><strong>Faciliter la liquidité</strong> — Vous pouvez revendre vos titres à tout moment.</li>
      <li><strong>Rendre l'économie plus transparente</strong> — Les entreprises cotées publient leurs résultats, ce qui permet de suivre leur performance.</li>
    </ol>
  </div>
</div>

<div class="slide" data-slide="3">
  <div class="section-purple">
    <h2>🔁 1.2 Marché primaire vs marché secondaire</h2>
    <p>Comprendre cette distinction est fondamental :</p>

    <table>
      <thead>
        <tr>
          <th>Type de marché</th>
          <th>Description</th>
          <th>À qui va l'argent ?</th>
          <th>Exemple concret</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Marché primaire</strong></td>
          <td>Les titres sont émis et vendus pour la première fois.</td>
          <td>Directement à l'entreprise ou à l'État.</td>
          <td>Une société comme NSIA Banque émet de nouvelles actions pour financer son expansion.</td>
        </tr>
        <tr>
          <td><strong>Marché secondaire</strong></td>
          <td>Les titres déjà émis sont échangés entre investisseurs.</td>
          <td>L'argent circule entre investisseurs, pas vers l'entreprise.</td>
          <td>Vous achetez des actions Sonatel à un autre investisseur via votre SGI.</td>
        </tr>
      </tbody>
    </table>

    <div class="key-points-box">
      <h3>🎯 À retenir</h3>
      <p><strong>Votre terrain de jeu principal, en tant qu'investisseur particulier, est le marché secondaire</strong>, car c'est là que vous pourrez acheter ou revendre vos titres.</p>
    </div>
  </div>
</div>

<div class="slide" data-slide="4">
  <div class="section-green">
    <h2>🏛️ 1.3 Le rôle et le fonctionnement de la BRVM</h2>

    <p><strong>Une bourse est simplement un marché financier réglementé et centralisé</strong> où s'échangent des titres tels que des actions et des obligations. Elle permet aux entreprises de lever des capitaux et aux investisseurs d'acheter ou de vendre ces actifs en toute sécurité.</p>

    <h3>🌍 Une bourse régionale unique au monde</h3>
    <p>La <strong>Bourse Régionale des Valeurs Mobilières (BRVM)</strong> est commune à huit pays africains partageant la même monnaie, le franc CFA (UEMOA) :</p>
    <p>🇧🇯 Bénin | 🇧🇫 Burkina Faso | 🇨🇮 Côte d'Ivoire | 🇬🇼 Guinée-Bissau | 🇲🇱 Mali | 🇳🇪 Niger | 🇸🇳 Sénégal | 🇹🇬 Togo</p>
    <p>Elle a été créée en 1998, avec son siège à Abidjan (Côte d'Ivoire), et son dépositaire central, le DC/BR, à Cotonou (Bénin).</p>

    <h3>⚙️ Son fonctionnement</h3>
    <ul>
      <li>Les entreprises qui souhaitent lever des fonds émettent des titres (actions ou obligations)</li>
      <li>Les investisseurs achètent et vendent ces titres via des Sociétés de Gestion et d'Intermédiation (SGI), qui sont les courtiers agréés</li>
      <li>Le régulateur, le CREPMF, veille au respect des règles de transparence et de protection des investisseurs</li>
    </ul>

    <h3>📈 Les indices phares</h3>
    <ul>
      <li><strong>BRVM Composite</strong> : suit l'ensemble des sociétés cotées</li>
      <li><strong>BRVM 10</strong> : regroupe les 10 entreprises les plus liquides et les plus importantes</li>
    </ul>
    <p><em>Quand on dit « la BRVM a progressé de 2 % aujourd'hui », cela signifie que, globalement, les valeurs cotées ont pris de la valeur.</em></p>

    <div class="key-points-box">
      <h3>💡 À retenir</h3>
      <p>La BRVM permet :</p>
      <ul>
        <li>Aux entreprises de se financer localement sans dépendre uniquement des banques</li>
        <li>Aux investisseurs de faire fructifier leur capital</li>
        <li>Et à nos économies africaines de croître de manière inclusive et transparente</li>
      </ul>
    </div>
  </div>
</div>



<div class="slide" data-slide="5">
  <div class="section-orange">
    <h2>🚀 1.4 Comment et pourquoi une entreprise entre en bourse (IPO)</h2>

    <h3>💰 Pourquoi entrer en bourse ?</h3>
    <p>Une entreprise décide de s'introduire en bourse (faire une IPO – Initial Public Offering) pour :</p>
    <ol>
      <li>Lever des capitaux sans contracter de dettes bancaires</li>
      <li>Améliorer sa visibilité et sa crédibilité auprès des investisseurs, partenaires et clients</li>
      <li>Permettre à ses premiers actionnaires (fondateurs, fonds, salariés) de revendre une partie de leurs actions</li>
      <li>Diversifier ses sources de financement et accéder à un marché de capitaux plus large</li>
    </ol>

    <h3>⚙️ Comment cela se passe ?</h3>
    <ol>
      <li>L'entreprise prépare ses états financiers et un prospectus approuvé par le CREPMF</li>
      <li>Elle choisit une SGI pour la conseiller et placer ses titres</li>
      <li>Les investisseurs souscrivent aux actions pendant la période d'offre publique</li>
      <li>Une fois les titres émis, l'entreprise devient cotée et ses actions sont échangées sur le marché secondaire</li>
    </ol>

    <div class="example-box">
      <h3>🎯 Exemple africain</h3>
      <p>L'introduction en bourse de Orange Côte d'Ivoire (2022) a permis :</p>
      <ul>
        <li>À l'entreprise de lever plusieurs dizaines de milliards FCFA</li>
        <li>Aux citoyens ivoiriens de devenir actionnaires d'un acteur majeur du pays</li>
        <li>Et à la BRVM d'attirer de nouveaux investisseurs régionaux</li>
      </ul>
    </div>
  </div>
</div>

<div class="slide" data-slide="6">
  <div class="glossary-box">
    <h2>🧠 Les termes à maîtriser</h2>
    <table>
      <thead>
        <tr>
          <th>Terme</th>
          <th>Définition</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>BRVM</strong></td>
          <td>Bourse Régionale des Valeurs Mobilières, marché commun de l'UEMOA.</td>
        </tr>
        <tr>
          <td><strong>BRVM Composite</strong></td>
          <td>Indice mesurant la performance de toutes les sociétés cotées.</td>
        </tr>
        <tr>
          <td><strong>IPO (Initial Public Offering)</strong></td>
          <td>Introduction en bourse — première vente d'actions au public.</td>
        </tr>
        <tr>
          <td><strong>Marché primaire</strong></td>
          <td>Marché où sont émis les nouveaux titres financiers.</td>
        </tr>
        <tr>
          <td><strong>Marché secondaire</strong></td>
          <td>Marché où les titres déjà émis s'échangent entre investisseurs.</td>
        </tr>
        <tr>
          <td><strong>SGI</strong></td>
          <td>Société de Gestion et d'Intermédiation, intermédiaire agréé pour acheter/vendre des titres.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="cta-box">
    <h3>🧭 Prochaine étape</h3>
    <p>Vous avez maintenant compris le rôle des marchés financiers et de la BRVM dans notre économie.</p>
    <p><strong>👉 Prochaine leçon : Module 2 — Les Acteurs du Jeu : Qui fait quoi sur le marché ?</strong></p>
  </div>
</div>
    `,
  });

  // =====================================
  // === M2 : LES ACTEURS DU JEU ===
  // =====================================

  await createOrUpdateModule({
    title: "Les Acteurs du Jeu – Qui fait quoi sur le marché ?",
    slug: "acteurs-du-jeu",
    description:
      "Comprenez les rôles des SGI, AMF-UMOA, DC/BR, BCEAO et des entreprises cotées, et voyez comment vos ordres circulent dans le marché.",
    difficulty_level: "debutant",
    content_type: "article",
    duration_minutes: 18,
    order_index: 2,
    is_published: true,
    content: `
 <div class="space-y-8">
 <div class="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-8 rounded-xl">
 <h2 class="text-3xl font-bold mb-6">🎯 Objectif Pédagogique</h2>
 <p class="text-lg mb-4 leading-relaxed">À la fin de ce module, vous serez capable :</p>
 <ul class="space-y-2 text-lg leading-relaxed">
 <li> d'identifier les principaux acteurs du marché financier régional ;</li>
 <li> de comprendre comment vos ordres d'achat ou de vente circulent ;</li>
 <li> de visualiser la chaîne de sécurité qui protège votre argent et vos titres.</li>
 </ul>
 </div>

 <div class="border-l-4 border-green-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">⚙️ 2.1 Les Trois Piliers Institutionnels du Marché</h2>
 <p class="text-lg mb-4 leading-relaxed">Le marché financier régional repose sur <strong>trois institutions clés</strong> qui travaillent ensemble pour assurer la sécurité, la transparence et la stabilité :</p>

 <div class="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6">
 <ul class="space-y-2 text-base">
 <li><strong>🏦 BCEAO</strong> — Assure la stabilité monétaire de la région</li>
 <li><strong>⚖️ AMF-UMOA</strong> — Régule le marché et protège les investisseurs</li>
 <li><strong>🔐 DC/BR</strong> — Conserve vos titres et sécurise les transactions</li>
 </ul>
 </div>

 <h3 class="text-xl font-bold text-gray-900 mb-3">🏦 2.1.1 BCEAO – Le Pilier Monétaire</h3>
 <p class="text-base mb-3 leading-relaxed">
 La <strong>BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)</strong> assure la stabilité monétaire de la région UEMOA.
 </p>
 <p class="text-base mb-3 leading-relaxed">Elle influence fortement les marchés financiers à travers :</p>
 <ul class="list-disc ml-6 mb-4 space-y-2">
 <li><strong>La fixation des taux directeurs</strong> — Détermine le coût de l'argent dans l'économie</li>
 <li><strong>La gestion de l'inflation</strong> — Protège le pouvoir d'achat de la monnaie</li>
 <li><strong>La supervision du système bancaire</strong> — Garantit la solidité des banques</li>
 </ul>

 <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
 <p class="text-base mb-2 font-semibold">💡 Impact sur vos investissements :</p>
 <ul class="list-disc ml-6 space-y-1 text-sm">
 <li><strong>Baisse des taux :</strong> Stimule les entreprises (crédit moins cher) et peut faire monter les actions.</li>
 <li><strong>Hausse des taux :</strong> Rend le crédit plus cher, ce qui peut peser sur les valorisations boursières.</li>
 </ul>
 </div>

  <div class="bg-yellow-50 border-l-4 border-yellow-600 p-4 my-4">
    <p class="font-semibold mb-2">🧩 À retenir :</p>
    <p>La BCEAO ne gère pas directement la BRVM, mais influence fortement son évolution.</p>
  </div>

 <h3 class="text-xl font-bold text-gray-900 mb-3">⚖️ 2.1.2 AMF-UMOA – Le Gendarme du Marché</h3>
 <p class="text-base mb-3 leading-relaxed">
 L'<strong>AMF-UMOA (Autorité des Marchés Financiers de l'UMOA)</strong> protège les investisseurs et veille à la transparence du marché.
 </p>
 <p class="text-base mb-3 leading-relaxed">Ses missions principales :</p>
 <ul class="list-disc ml-6 mb-4 space-y-2">
 <li><strong>Définir les règles du jeu</strong> — Fixe les normes que tous les acteurs doivent respecter</li>
 <li><strong>Approuver les introductions en bourse</strong> — Valide que les entreprises respectent les critères de transparence</li>
 <li><strong>Surveiller et sanctionner les abus</strong> — elle enquête sur les abus, manipulations ou délits d’initiés.</li>
 <li><strong>Agréer les acteurs financiers</strong> — SGI, fonds, conseillers doivent obtenir une licence</li>
 </ul>


<div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
  <p class="font-semibold mb-2">💬 Pourquoi c'est important pour vous :</p>
  <p class="mb-2">L'AMF-UMOA agit comme un gendarme financier. Elle s'assure que :</p>
  <ul class="list-disc ml-6 space-y-1">
    <li>les sociétés cotées publient des informations fiables ;</li>
    <li>les SGI respectent les règles ;</li>
    <li>vos transactions sont conformes aux lois LBC/FT (Lutte contre le Blanchiment et le Financement du Terrorisme).</li>
  </ul>
</div>


 <p class="text-base mb-4 font-semibold leading-relaxed">
 👉 C'est votre <strong>bouclier réglementaire</strong>. Sans l'AMF-UMOA, la confiance dans le marché s'effondrerait.
 </p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">🔐 2.1.3 DC/BR – Le Notaire Digital du Marché</h3>
 <p class="text-base mb-3 leading-relaxed">
 Le <strong>DC/BR (Dépositaire Central/Banque de Règlement)</strong> est l'entité qui conserve vos titres et sécurise toutes les transactions financières.
 </p>

 <p class="text-base mb-3 leading-relaxed">Ses trois fonctions clés :</p>
 <ul class="list-disc ml-6 mb-4 space-y-2">
 <li><strong>Conservation des titres :</strong> Vos actions et obligations ne sont pas stockées chez votre SGI, mais enregistrées au DC/BR à votre nom.
→ Si votre SGI disparaît, vos titres restent intacts et récupérables.
</li>
 <li><strong>Règlement-livraison :</strong> Quand vous achetez, le DC/BR transfère les titres sur votre compte et l’argent vers le vendeur — tout cela simultanément pour éviter les fraudes.</li>
 <li><strong>Banque de règlement :</strong> Gère les flux financiers entre toutes les SGI pour assurer la fluidité du marché.</li>
 </ul>


 <div class="border-l-4 border-purple-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">⚙️ 2.2 Les SGI – Votre Intermédiaire Officiel</h2>

 <p class="text-base mb-4 leading-relaxed">
 Les <strong>SGI (Sociétés de Gestion et d'Intermédiation)</strong> sont les courtiers agréés qui vous permettent d'accéder au marché boursier. Vous ne pouvez PAS acheter ou vendre des titres directement à la BRVM — vous devez obligatoirement passer par une SGI.
 </p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">🔑 Rôles clés d'une SGI :</h3>
 <ul class="list-disc ml-6 mb-6 space-y-2">
 <li><strong>Ouvrir et gérer votre compte-titres</strong> — Votre "compte bancaire" pour les actions et obligations</li>
 <li><strong>Transmettre vos ordres à la BRVM</strong> — Achats et ventes que vous souhaitez effectuer</li>
 <li><strong>Conserver vos fonds en attente d'investissement</strong> — Sécurisation de votre cash avant allocation</li>
 <li><strong>Vous conseiller selon votre profil</strong> — Recommandations personnalisées basées sur vos objectifs</li>
 <li><strong>Assurer le suivi administratif</strong> — Dividendes, relevés de compte, fiscalité</li>
 </ul>

 <h3 class="text-xl font-bold text-gray-900 mb-3">📋 Comment choisir une SGI ?</h3>
 <p class="text-base mb-3 leading-relaxed">Critères à considérer :</p>
 <ol class="list-decimal ml-6 mb-4 space-y-2">
 <li><strong>Frais et commissions</strong> — Comparez les tarifs (frais de courtage, frais de garde, etc.)</li>
 <li><strong>Qualité du service client</strong> — Réactivité, disponibilité, accompagnement</li>
 <li><strong>Outils et plateformes</strong> — Interface en ligne, application mobile, facilité d'utilisation</li>
 <li><strong>Réputation et ancienneté</strong> — Solidité financière et expérience sur le marché</li>
 <li><strong>Accessibilité géographique</strong> — Présence dans votre ville ou pays</li>
 </ol>
 </div>

 <div class="border-l-4 border-indigo-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">💼 2.3 L'Investisseur – C'est Vous</h2>

 <p class="text-lg mb-4 leading-relaxed">Les investisseurs sont ceux qui apportent les fonds sur le marché. Il en existe deux grandes catégories :</p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">👤 1. Investisseurs particuliers (personnes physiques)</h3>
 <p class="text-base mb-3 leading-relaxed">Ce sont des individus comme vous et moi qui investissent leur propre épargne pour :</p>
 <ul class="list-disc ml-6 mb-4 space-y-1">
 <li>Faire croître leur capital sur le long terme</li>
 <li>Préparer leur retraite</li>
 <li>Financer des projets futurs (éducation des enfants, achat immobilier, etc.)</li>
 <li>Générer des revenus passifs grâce aux dividendes</li>
 </ul>

 <h3 class="text-xl font-bold text-gray-900 mb-3">🏢 2. Investisseurs institutionnels</h3>
 <p class="text-base mb-3 leading-relaxed">Ce sont des organisations qui gèrent des milliards de FCFA pour le compte de leurs clients ou de leurs salariés :</p>
 <ul class="list-disc ml-6 mb-6 space-y-2">
 <li><strong>Compagnies d'assurance</strong> — Gèrent les primes collectées</li>
 <li><strong>Fonds de pension</strong> — Préparent les retraites des salariés</li>
 <li><strong>Banques</strong> — Investissent une partie de leurs fonds propres</li>
 <li><strong>OPCVM (fonds d'investissement)</strong> — Regroupent l'épargne de milliers d'investisseurs</li>
 </ul>

 <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6">
 <p class="text-base font-semibold mb-2">💡 À retenir</p>
 <p class="text-base leading-relaxed">Même si vous débutez avec un petit capital, vous jouez un rôle essentiel : vous contribuez au financement des entreprises africaines et participez au développement économique de votre continent.</p>
 </div>
 </div>

 <div class="border-l-4 border-orange-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">🏢 2.4 Les Sociétés Cotées – Les Champions Économiques</h2>

 <p class="text-base mb-4 leading-relaxed">
 Les <strong>entreprises cotées</strong> sont les sociétés qui ont choisi d'ouvrir leur capital au public en émettant des actions ou des obligations sur la BRVM.
 </p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">🎯 Pourquoi les entreprises se cotent-elles ?</h3>
 <ul class="list-disc ml-6 mb-6 space-y-2">
 <li><strong>Lever des fonds</strong> pour financer leur croissance sans s'endetter auprès des banques</li>
 <li><strong>Gagner en transparence</strong> et en crédibilité auprès de leurs partenaires et clients</li>
 <li><strong>Impliquer les citoyens</strong> dans leur croissance et partager les bénéfices via les dividendes</li>
 <li><strong>Améliorer leur gouvernance</strong> grâce aux exigences réglementaires strictes</li>
 </ul>

 <h3 class="text-xl font-bold text-gray-900 mb-3">📊 Quelques exemples de champions de la BRVM :</h3>
 <div class="overflow-x-auto">
 <table class="min-w-full border-collapse border-2 border-gray-300 my-4">
 <thead class="bg-gray-100">
 <tr>
 <th class="border border-gray-300 px-4 py-3 text-left font-bold">Entreprise</th>
 <th class="border border-gray-300 px-4 py-3 text-left font-bold">Secteur</th>
 <th class="border border-gray-300 px-4 py-3 text-left font-bold">Pourquoi c'est intéressant</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td class="border border-gray-300 px-4 py-3 font-semibold">Sonatel</td>
 <td class="border border-gray-300 px-4 py-3">Télécommunications</td>
 <td class="border border-gray-300 px-4 py-3">Leader des télécoms au Sénégal, dividendes réguliers</td>
 </tr>
 <tr class="bg-gray-50">
 <td class="border border-gray-300 px-4 py-3 font-semibold">Ecobank CI</td>
 <td class="border border-gray-300 px-4 py-3">Banque</td>
 <td class="border border-gray-300 px-4 py-3">Réseau panafricain, forte présence régionale</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-3 font-semibold">Nestlé CI</td>
 <td class="border border-gray-300 px-4 py-3">Agroalimentaire</td>
 <td class="border border-gray-300 px-4 py-3">Marque mondiale, produits de consommation courante</td>
 </tr>
 <tr class="bg-gray-50">
 <td class="border border-gray-300 px-4 py-3 font-semibold">Palmci</td>
 <td class="border border-gray-300 px-4 py-3">Agriculture</td>
 <td class="border border-gray-300 px-4 py-3">Production d'huile de palme, secteur stratégique</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-3 font-semibold">TotalEnergies CI</td>
 <td class="border border-gray-300 px-4 py-3">Énergie</td>
 <td class="border border-gray-300 px-4 py-3">Distribution de carburant, valeur défensive</td>
 </tr>
 </tbody>
 </table>
 </div>



 <div class="border-l-4 border-pink-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">🌐 2.5 Autres Acteurs Clés de l'Écosystème</h2>

 <h3 class="text-xl font-bold text-gray-900 mb-3">📊 SGO (Sociétés de Gestion d'OPCVM)</h3>
 <p class="text-base mb-4 leading-relaxed">
 Les SGO gèrent des fonds d'investissement collectifs (FCP, SICAV) qui permettent aux petits investisseurs d'accéder à des portefeuilles diversifiés gérés par des professionnels.
 </p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">🧾 Experts-comptables et commissaires aux comptes</h3>
 <p class="text-base mb-4 leading-relaxed">
 Ils certifient les états financiers des entreprises cotées, garantissant ainsi la fiabilité des informations publiées. Sans leur validation, impossible de publier des résultats.
 </p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">📰 Médias financiers et analystes</h3>
 <p class="text-base mb-6 leading-relaxed">
 Ils diffusent l'information financière, analysent les entreprises et contribuent à la transparence du marché. Exemples : AfriBourse (😉), Financial Afrik, etc.
 </p>
 </div>

 <div class="bg-gray-100 rounded-xl p-6">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">🧠 Termes à Maîtriser</h2>
 <table class="min-w-full border-collapse border-2 border-gray-300">
 <thead class="bg-gray-200">
 <tr>
 <th class="border border-gray-300 px-4 py-3 text-left font-bold">Terme</th>
 <th class="border border-gray-300 px-4 py-3 text-left font-bold">Définition</th>
 </tr>
 </thead>
 <tbody>
 <tr class="bg-white">
 <td class="border border-gray-300 px-4 py-3 font-bold">SGI</td>
 <td class="border border-gray-300 px-4 py-3">Société de Gestion et d'Intermédiation — Votre courtier pour accéder à la BRVM.</td>
 </tr>
 <tr class="bg-gray-50">
 <td class="border border-gray-300 px-4 py-3 font-bold">AMF-UMOA</td>
 <td class="border border-gray-300 px-4 py-3">Autorité des Marchés Financiers — Régulateur qui protège les investisseurs.</td>
 </tr>
 <tr class="bg-white">
 <td class="border border-gray-300 px-4 py-3 font-bold">DC/BR</td>
 <td class="border border-gray-300 px-4 py-3">Dépositaire Central / Banque de Règlement — Conservation des titres et sécurisation des transactions.</td>
 </tr>
 <tr class="bg-gray-50">
 <td class="border border-gray-300 px-4 py-3 font-bold">BCEAO</td>
 <td class="border border-gray-300 px-4 py-3">Banque Centrale des États de l'Afrique de l'Ouest — Pilier de la stabilité monétaire.</td>
 </tr>
 <tr class="bg-white">
 <td class="border border-gray-300 px-4 py-3 font-bold">Investisseur institutionnel</td>
 <td class="border border-gray-300 px-4 py-3">Organisation qui gère de gros volumes (assurance, fonds de pension, banques).</td>
 </tr>
 <tr class="bg-gray-50">
 <td class="border border-gray-300 px-4 py-3 font-bold">Société cotée</td>
 <td class="border border-gray-300 px-4 py-3">Entreprise dont les titres sont listés et échangés sur la BRVM.</td>
 </tr>
 <tr class="bg-white">
 <td class="border border-gray-300 px-4 py-3 font-bold">SGO</td>
 <td class="border border-gray-300 px-4 py-3">Société de Gestion d'OPCVM — Gestionnaire de fonds collectifs (FCP, SICAV).</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div class="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-xl">
 <h3 class="text-xl font-bold mb-3">🧭 Prochaine étape</h3>
 <p class="text-base mb-3 leading-relaxed">Vous comprenez maintenant qui sont les acteurs du marché et comment ils travaillent ensemble pour assurer la sécurité et la transparence.</p>
 <p class="text-lg font-bold leading-relaxed">👉 Prochaine leçon : Module 3 — Les Outils de l'Investisseur : Actions, Obligations et OPCVM</p>
 </div>
 `,
  });

  // ==================================================
  // === M3 : LES OUTILS DE L'INVESTISSEUR ===
  // ==================================================
  await createOrUpdateModule({
    title: "Les Outils de l’Investisseur — Les Instruments Financiers de la BRVM",
    slug: 'outils-investisseur',
    description: "Découvrez les principaux instruments financiers de la BRVM : actions, obligations, OPCVM, ETF. Comprenez leur fonctionnement, leurs risques et comment les choisir en fonction de votre profil.",
    difficulty_level: "debutant",
    content_type: "article",
    duration_minutes: 25,
    order_index: 3,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-purple-600 to-violet-700 text-white p-8 rounded-2xl shadow-lg">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
 🎯 Objectif Pédagogique
 </h2>
 <p class="text-lg mb-6 text-purple-50">À la fin de ce module, vous serez capable de :</p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Distinguer les actions, obligations, ETF et OPCVM.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Comprendre les mécanismes de rendement et de risque de chaque type d'actif.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Identifier les produits adaptés à votre profil d'investisseur.
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">3.1 Les Actions — Devenir propriétaire d'une part d'entreprise</h2>
 <p class="text-gray-600 mb-6">Une action représente une fraction du capital d’une société. En l’achetant, vous devenez actionnaire, c’est-à-dire copropriétaire de l’entreprise.</p>

 <div class="grid md:grid-cols-2 gap-6 mb-6">
 <div class="bg-green-50 p-4 rounded-lg">
 <h3 class="font-bold text-green-800 mb-2 flex items-center gap-2">💰 Sources de rendement</h3>
 <ul class="list-disc list-inside space-y-1 text-gray-700">
 <li><strong>Plus-value</strong> : revendre plus cher que le prix d’achat.</li>
 <li><strong>Dividendes</strong> : part du bénéfice distribuée annuellement.</li>
 </ul>
 </div>
 <div class="bg-red-50 p-4 rounded-lg">
 <h3 class="font-bold text-red-800 mb-2 flex items-center gap-2">⚠️ Risques associés</h3>
 <ul class="list-disc list-inside space-y-1 text-gray-700">
 <li>La valeur de l’action peut baisser fortement.</li>
 <li>En cas de faillite, les actionnaires sont rémunérés en dernier.</li>
 <li>Les dividendes ne sont jamais garantis.</li>
 </ul>
 </div>
 </div>

 <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
 <p class="text-gray-700"><strong>Exemple BRVM :</strong> SONATEL offre historiquement des dividendes élevés ; BOA Mali propose un rendement plus stable avec moins de volatilité.</p>
 </div>

 <div class="bg-blue-50 p-4 rounded-lg text-blue-800 font-medium text-center">
 🎓 <strong>À retenir :</strong> Acheter une action, c’est croire en la croissance d’une entreprise.
Vous partagez ses succès (dividendes, hausse de valeur) mais aussi ses difficultés.
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">3.2 Les Obligations — Prêter à une entreprise ou à l’État</h2>
 <p class="text-gray-600 mb-6">Une obligation est un titre de créance : vous prêtez de l'argent à un émetteur (entreprise, État ou institution publique) en échange d’intérêts fixes sur une durée définie.</p>

 <div class="grid md:grid-cols-2 gap-6 mb-6">
 <div>
 <h3 class="font-bold text-gray-800 mb-2">💰 Fonctionnement</h3>
 <ul class="list-disc list-inside space-y-1 text-gray-600">
 <li>Vous prêtez, par exemple, 100 000 FCFA pour 5 ans.</li>
 <li>L’émetteur vous verse des coupons annuels (intérêts) et vous rembourse le capital à la fin (maturité).</li>
 </ul>
 </div>
 <div>
 <h3 class="font-bold text-gray-800 mb-2">🧭 Types d'obligations à la BRVM</h3>
 <ul class="list-disc list-inside space-y-1 text-gray-600">
 <li><strong>Obligations d’État</strong> : émises par les pays de l’UEMOA (très sécurisées).</li>
 <li><strong>Obligations d’entreprise</strong> : rendement plus élevé, risque modéré.</li>
 </ul>
 </div>
 </div>

 <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
 <h3 class="font-bold text-gray-800 mb-2">⚖️ Rendement / Risque</h3>
 <ul class="list-disc list-inside text-gray-700">
 <li>Rendement stable, risque faible.</li>
 <li>Mais la contrepartie est que vous ne profitez pas de la croissance de l’entreprise.</li>
 </ul>
 </div>

 <div class="bg-blue-50 p-4 rounded-lg text-blue-800 font-medium text-center">
 🎓 <strong>À retenir :</strong> Une obligation, c’est un contrat de confiance : vous prêtez aujourd’hui, on vous rembourse demain avec intérêts.
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">3.3 Les OPCVM et ETF — Investissement collectif intelligent</h2>
 <p class="text-gray-600 mb-6">Les OPCVM (Organismes de Placement Collectif en Valeurs Mobilières) regroupent l’argent de plusieurs investisseurs pour constituer un portefeuille diversifié, géré par des professionnels.</p>
 
 <div class="grid md:grid-cols-3 gap-4 mb-6">
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-gray-800 mb-2">📦 Deux familles</h3>
 <ul class="list-disc list-inside text-sm text-gray-600">
 <li><strong>FCP</strong> : fonds communs de placement. 
 → Vous détenez des parts d’un fonds géré par une société agréée.</li>
 <li><strong>SICAV</strong> : sociétés d’investissement à capital variable.
 Vous êtes actionnaire d’une société qui gère le portefeuille.</li>
 </ul>
 </div>
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-gray-800 mb-2">🪙 Avantages</h3>
 <ul class="list-disc list-inside text-sm text-gray-600">
 <li>Diversification immédiate (moins de risque).</li>
 <li>Gestion professionnelle (vous déléguez les décisions).</li>
 <li>Accessibilité (petit capital possible).</li>
 </ul>
 </div>
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-gray-800 mb-2">📈 ETF (Exchange Traded Funds)</h3>
 <p class="text-sm text-gray-600">Les ETF sont des OPCVM cotés en Bourse.
Ils répliquent la performance d’un indice comme le BRVM Composite ou le BRVM 10.
n'existe pas encore a la brvm, ils représentent le futur de l’investissement passif.
</p>
 </div>
 </div>

 <div class="bg-blue-50 p-4 rounded-lg text-blue-800 font-medium text-center">
 🎓 <strong>À retenir :</strong> L’OPCVM est le panier diversifié, l’ETF est le panier automatisé.
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">3.4 Mécanismes Clés</h2>
 <div class="grid md:grid-cols-3 gap-6">
 <div class="space-y-2">
 <h3 class="text-lg font-bold text-indigo-600">💵 Dividendes</h3>
 <p class="text-gray-600 text-sm leading-relaxed">Part du bénéfice versée aux actionnaires. <br><span class="italic text-gray-500">Exemple : SONATEL distribue souvent 1 500 à 2 000 FCFA par action.</span></p>
 </div>
 <div class="space-y-2">
 <h3 class="text-lg font-bold text-indigo-600">📈 Splits</h3>
 <p class="text-gray-600 text-sm leading-relaxed">Une entreprise divise ses actions pour rendre leur prix plus accessible. <br><span class="italic text-gray-500">Exemple : 1 action à 30 000 FCFA devient 10 à 3 000 FCFA. La valeur totale reste la même, mais la liquidité augmente.</span></p>
 </div>
 <div class="space-y-2">
 <h3 class="text-lg font-bold text-indigo-600">💹 Augmentation</h3>
 <p class="text-gray-600 text-sm leading-relaxed">Émission de nouvelles actions pour lever des fonds. Les anciens actionnaires bénéficient d’un droit préférentiel.</p>
 </div>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <h2 class="text-2xl font-bold text-gray-800 mb-6">3.5 Comparatif : Risque vs Rendement</h2>
 
 <div class="overflow-x-auto">
 <table class="min-w-full divide-y divide-gray-200">
 <thead class="bg-gray-50">
 <tr>
 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type d'actif</th>
 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risque principal</th>
 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rendement</th>
 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horizon</th>
 </tr>
 </thead>
 <tbody class="bg-white divide-y divide-gray-200">
 <tr class="hover:bg-gray-50">
 <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Actions</td>
 <td class="px-6 py-4 text-gray-500">Volatilité, faillite</td>
 <td class="px-6 py-4 text-green-600 font-semibold">Élevé</td>
 <td class="px-6 py-4 text-gray-500">5–10 ans</td>
 </tr>
 <tr class="hover:bg-gray-50">
 <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Obligations</td>
 <td class="px-6 py-4 text-gray-500">Taux d’intérêt, défaut</td>
 <td class="px-6 py-4 text-yellow-600 font-semibold">Moyen</td>
 <td class="px-6 py-4 text-gray-500">2–5 ans</td>
 </tr>
 <tr class="hover:bg-gray-50">
 <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">OPCVM / ETF</td>
 <td class="px-6 py-4 text-gray-500">Marché, gestion</td>
 <td class="px-6 py-4 text-blue-600 font-semibold">Modéré</td>
 <td class="px-6 py-4 text-gray-500">Moyen / long</td>
 </tr>
 <tr class="hover:bg-gray-50">
 <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Liquidités</td>
 <td class="px-6 py-4 text-gray-500">Inflation</td>
 <td class="px-6 py-4 text-gray-400">Faible</td>
 <td class="px-6 py-4 text-gray-500">Court terme</td>
 </tr>
 </tbody>
 </table>
 </div>
 
 <div class="mt-4 text-center text-sm text-gray-500 italic">
 🎓 À retenir : Aucun investissement n’est sans risque. Le plus important est de choisir un risque adapté à votre profil.
 </div>
 </div>



 <div class="bg-gray-900 text-gray-300 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-white mb-6">🧭 En Résumé</h2>
 <div class="grid md:grid-cols-2 gap-4">
 <ul class="space-y-2">
 <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Actions : propriété, potentiel élevé, risque fort.</li>
 <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Obligations : prêt, rendement fixe, risque modéré.</li>
 <li class="flex items-center gap-2"><span class="text-green-400">✓</span> OPCVM/ETF : diversification, gestion professionnelle.</li>
 </ul>
 <ul class="space-y-2">
 <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Dividendes/splits : leviers de performance.</li>
 <li class="flex items-center gap-2"><span class="text-yellow-400">★</span> Règle d’or : comprendre avant d’investir.</li>
 </ul>
 </div>
 <hr class="border-gray-700 my-8"/>
 
 <div class="flex items-center justify-between">
 <p class="text-white font-medium">🚀 Prochaine étape : Module 4 — “Produits Avancés : Explorer les Nouvelles Frontières de l’Investissement”</p>
 <button class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
 Commencer
 </button>
 </div>
 </div>

 </div>
`,
  });

  // ==================================================
  // === M4 : LE TEMPS, Produits Avancés : Explorer les Nouvelles Frontières de l’Investissement ===
  // ==================================================
  await createOrUpdateModule({
    title: "Produits Avancés : Explorer les Nouvelles Frontières de l’Investissement",
    slug: 'le-temps-meilleur-allie',
    description:
      "Découvrez les actifs financiers avancés, émergents ou innovants : immobilier coté, finance islamique, produits structurés et ETF. Comprenez leurs mécanismes, risques et potentiel dans l’UEMOA.",
    difficulty_level: "intermediaire",
    content_type: "article",
    duration_minutes: 25,
    order_index: 4,
    is_published: true,
    content: `
<div class="slide" data-slide="1">
  <div class="objectif-hero">
    <h2>🎯 Objectif Pédagogique</h2>
    <p>À la fin de ce module, vous comprendrez :</p>
    <ul>
      <li><strong>Les grandes familles d'actifs émergentes</strong> dans la région UEMOA</li>
      <li><strong>Comment elles diffèrent</strong> des actions et obligations classiques</li>
      <li><strong>Pourquoi elles représentent le futur</strong> de la finance africaine</li>
    </ul>
  </div>
</div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-orange-100 pb-2 flex items-center gap-2">
 🏢 4.1 L'Immobilier Coté : investir sans devenir propriétaire physique
 </h2>
 
 <div class="mb-6">
 <h3 class="text-lg font-bold text-orange-700 mb-2">Qu’est-ce qu’une SCPI ?</h3>
 <p class="text-gray-600 leading-relaxed mb-4">
 Une SCPI (Société Civile de Placement Immobilier) collecte l’argent des investisseurs pour acheter et gérer un portefeuille d’immeubles (bureaux, commerces, logements). Chaque investisseur détient des parts et perçoit une partie des revenus locatifs.
 </p>
 
 </div>

 <div class="bg-gray-50 p-4 rounded-lg mb-6 border-l-4 border-orange-500">
 <h3 class="text-lg font-bold text-gray-800 mb-1">🌍 Équivalent international</h3>
 <p class="text-gray-700">Les <strong>REITs</strong> (Real Estate Investment Trusts) permettent d’investir dans l’immobilier coté en bourse.</p>
 </div>

 <div class="grid md:grid-cols-2 gap-6 mb-6">
 <div class="bg-green-50 p-4 rounded-lg">
 <h3 class="font-bold text-green-800 mb-2 flex items-center gap-2">✅ Avantages</h3>
 <ul class="list-disc list-inside space-y-1 text-gray-700 text-sm">
 <li>Aucun besoin de gérer un bien soi-même.</li>
 <li>Revenus réguliers sous forme de dividendes.</li>
 <li>Diversification géographique et sectorielle.</li>
 </ul>
 </div>
 <div class="bg-red-50 p-4 rounded-lg">
 <h3 class="font-bold text-red-800 mb-2 flex items-center gap-2">⚠️ Risques</h3>
 <ul class="list-disc list-inside space-y-1 text-gray-700 text-sm">
 <li>Dépendance au marché immobilier.</li>
 <li>Sensibilité aux taux d’intérêt.</li>
 </ul>
 </div>
 </div>

 <div class="text-sm text-gray-500 italic bg-gray-50 p-3 rounded">
 🔍 <strong>Cas régional :</strong> Dans l’UEMOA, la SCPI reste encore marginale, mais plusieurs acteurs réfléchissent à sa mise en place. Les premiers fonds immobiliers régionaux devraient voir le jour dans les prochaines années, notamment via des OPCI (Organismes de Placement Collectif Immobilier).
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-orange-100 pb-2 flex items-center gap-2">
 🕌 4.2 La Finance Islamique : une alternative éthique
 </h2>

 <div class="grid md:grid-cols-2 gap-8 mb-6">
 <div>
 <h3 class="text-lg font-bold text-orange-700 mb-3">Principes fondamentaux</h3>
 <ol class="list-decimal list-inside space-y-2 text-gray-600">
 <li>Interdiction du <strong>riba</strong> (intérêt) : les revenus doivent venir d’une activité réelle.</li>
 <li>Partage des profits et pertes.</li>
 <li>Investissements dans des activités licites uniquement.</li>
 </ol>
 </div>
 <div>
 <h3 class="text-lg font-bold text-orange-700 mb-3">Produits phares</h3>
 <ul class="space-y-3">
 <li class="bg-orange-50 p-3 rounded-lg">
 <span class="font-bold text-gray-800">Sukuk</span>
 <p class="text-sm text-gray-600">Obligations islamiques adossées à des actifs réels (pas de dette pure).</p>
 </li>
 <li class="bg-orange-50 p-3 rounded-lg">
 <span class="font-bold text-gray-800">Fonds islamiques</span>
 <p class="text-sm text-gray-600">OPCVM filtrés selon la charia.</p>
 </li>
 </ul>
 </div>
 </div>

 

 <div class="bg-blue-50 p-4 rounded-lg text-blue-900 mt-4">
 <h3 class="font-bold mb-1">🌍 Enjeux et opportunités</h3>
 <ul class="list-disc list-inside text-sm">
 <li>Plus de 3 000 milliards USD gérés dans le monde.</li>
 <li>Forte demande en Afrique de l’Ouest.</li>
 <li>Permet d’attirer des investisseurs en quête d’éthique.</li>
 </ul>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-orange-100 pb-2 flex items-center gap-2">
 ⚙️ 4.3 Introduction aux Produits Structurés
 </h2>
 
 <p class="text-gray-600 mb-4">
 Un produit structuré combine plusieurs éléments (souvent une obligation + une option) pour offrir un rendement ciblé avec une protection partielle du capital.
 </p>

 

 <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-6 mt-4">
 <h3 class="font-bold text-indigo-900 mb-2">📘 Exemple simple</h3>
 <p class="text-indigo-800 font-medium">
 "100 % du capital garanti à l’échéance + 50 % de la performance de l’indice BRVM 10 sur 3 ans."
 </p>
 </div>

 <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
 <h3 class="font-bold text-red-800 mb-1">⚠️ Attention</h3>
 <ul class="list-disc list-inside text-sm text-red-700">
 <li>Produits complexes, destinés aux investisseurs avertis.</li>
 <li>Les conditions doivent être lues avec précision.</li>
 </ul>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-orange-100 pb-2 flex items-center gap-2">
 📊 4.4 Les ETF et Trackers : l’avenir de l’investissement passif
 </h2>

 <div class="flex flex-col md:flex-row gap-6 mb-6">
 <div class="flex-1">
 <h3 class="text-lg font-bold text-orange-700 mb-2">Définition</h3>
 <p class="text-gray-600 mb-4">Un ETF (Exchange Traded Fund) est un fonds coté qui réplique un indice boursier.</p>
 <div class="bg-gray-100 p-3 rounded text-sm">
 <strong>Exemple :</strong> un ETF BRVM Composite reproduirait les performances de toutes les grandes valeurs de la BRVM.
 </div>
 </div>
 <div class="flex-1 bg-green-50 p-5 rounded-xl">
 <h3 class="text-lg font-bold text-green-800 mb-3">💡 Pourquoi c’est révolutionnaire</h3>
 <ul class="space-y-2 text-green-900">
 <li class="flex items-center gap-2">⚡ Frais très faibles.</li>
 <li class="flex items-center gap-2">⚡ Diversification automatique.</li>
 <li class="flex items-center gap-2">⚡ Transparence totale.</li>
 </ul>
 </div>
 </div>
 
 

 <div class="text-center mt-6">
 <p class="text-gray-800 font-medium">Comprendre les ETF aujourd’hui, c’est comprendre la bourse de demain : simple, efficace, accessible.</p>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <h2 class="text-2xl font-bold text-gray-800 mb-6">🧭 En résumé : Comparatif des produits avancés</h2>
 
 <div class="overflow-x-auto">
 <table class="min-w-full divide-y divide-gray-200">
 <thead class="bg-orange-50">
 <tr>
 <th class="px-6 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">Produit</th>
 <th class="px-6 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">Objectif principal</th>
 <th class="px-6 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">Niveau de risque</th>
 <th class="px-6 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">Accessibilité (UEMOA)</th>
 </tr>
 </thead>
 <tbody class="bg-white divide-y divide-gray-200">
 <tr class="hover:bg-gray-50">
 <td class="px-6 py-4 font-bold text-gray-900">SCPI / Immo</td>
 <td class="px-6 py-4 text-gray-600">Revenus stables</td>
 <td class="px-6 py-4 text-yellow-600 font-medium">Modéré</td>
 <td class="px-6 py-4 text-gray-500">En développement</td>
 </tr>
 <tr class="hover:bg-gray-50">
 <td class="px-6 py-4 font-bold text-gray-900">Finance islamique</td>
 <td class="px-6 py-4 text-gray-600">Investissement éthique</td>
 <td class="px-6 py-4 text-yellow-600 font-medium">Modéré</td>
 <td class="px-6 py-4 text-green-600 font-medium">Déjà existant</td>
 </tr>
 <tr class="hover:bg-gray-50">
 <td class="px-6 py-4 font-bold text-gray-900">Produits structurés</td>
 <td class="px-6 py-4 text-gray-600">Protection + rendement</td>
 <td class="px-6 py-4 text-orange-600 font-medium">Variable</td>
 <td class="px-6 py-4 text-gray-500">Rare</td>
 </tr>
 <tr class="hover:bg-gray-50">
 <td class="px-6 py-4 font-bold text-gray-900">ETF / Trackers</td>
 <td class="px-6 py-4 text-gray-600">Répliquer un indice</td>
 <td class="px-6 py-4 text-green-600 font-medium">Faible à modéré</td>
 <td class="px-6 py-4 text-gray-500">En émergence</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <div class="bg-gray-900 text-white p-8 rounded-xl text-center">
 <h2 class="text-2xl font-bold mb-4">🧠 À retenir</h2>
 <p class="text-gray-300 max-w-2xl mx-auto mb-8">
 Ce module ne vise pas à vous pousser à investir immédiatement dans ces produits, mais à vous préparer aux évolutions futures du marché financier africain et de la BRVM.
 </p>
 
 <hr class="border-gray-700 my-8 w-1/2 mx-auto"/>
 
 <div class="flex flex-col md:flex-row items-center justify-center gap-4">
 <p class="font-medium text-orange-400">🔜 Prochaine étape : Module 5</p>
 <button class="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 py-2 rounded-lg transition-colors shadow">
 Le Temps, votre meilleur allié
 </button>
 </div>
 </div>

 </div>
`,
  });

  // ================================================
  // === M5 : Le Temps, Votre Meilleur Allié — Définir ses Objectifs et son Horizon ===
  // ================================================
  await createOrUpdateModule({
    title: "Le Temps, Votre Meilleur Allié — Définir ses Objectifs et son Horizon",
    slug: 'mental-du-gagnant',
    description: "Maîtrisez vos émotions, comprenez les intérêts composés et différencier les grandes stratégies d'investissement.",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 5,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

<div class="slide" data-slide="1">
  <div class="objectif-hero">
    <h2 style="color: #000000;">⏳ Module 5 : Le Temps, Votre Meilleur Allié</h2>
    <p>À la fin de ce module, vous serez capable de :</p>
    <ul>
      <li><strong>Définir précisément votre horizon de placement</strong> (court, moyen, long terme) en fonction de vos objectifs</li>
      <li><strong>Comprendre le rôle du temps</strong> pour gérer le risque et la volatilité</li>
      <li><strong>Établir votre profil d'investisseur</strong> et déterminer l'allocation d'actifs cohérente</li>
    </ul>
  </div>
</div>

<div class="slide" data-slide="2">
  <div class="section-blue">
    <h2>🎯 5.1 Définir ses objectifs de vie et d'investissement</h2>

    <p>La bourse n'est pas un jeu, c'est un outil pour réaliser vos projets de vie. Avant de choisir un titre, vous devez définir la durée pendant laquelle vous pouvez vous passer de cet argent.</p>

    <h3>L'Horizon de Placement : La Durée de l'Engagement</h3>
    <p>C'est la période pendant laquelle vous prévoyez de garder votre investissement. Cette durée dicte le niveau de risque que vous pouvez vous permettre.</p>

    <table>
      <thead>
        <tr>
          <th>Horizon</th>
          <th>Durée</th>
          <th>Objectif Typique</th>
          <th>Allocation Recommandée</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Court Terme</strong></td>
          <td>Moins de 2 ans</td>
          <td>Fonds d'urgence, scolarité</td>
          <td>Minimal (Obligations, sécurisé)</td>
        </tr>
        <tr>
          <td><strong>Moyen Terme</strong></td>
          <td>2 à 7 ans</td>
          <td>Auto, apport immobilier</td>
          <td>Modéré (Mixte Actions/Obligations)</td>
        </tr>
        <tr>
          <td><strong>Long Terme</strong></td>
          <td>Plus de 7 ans</td>
          <td>Retraite, indépendance</td>
          <td>Croissance (Majorité Actions)</td>
        </tr>
      </tbody>
    </table>

    <div class="analogy-box">
      <p><strong>💡 Conseil d'Expert :</strong> Chaque grand objectif de vie (retraite, études, maison) doit être traité comme un compte d'investissement séparé, avec son propre horizon.</p>
    </div>
  </div>
</div>

<div class="slide" data-slide="3">
  <div class="bg-indigo-900 text-white p-8 rounded-xl shadow-md">
    <h2 class="text-2xl font-bold mb-4 text-white">🚌 5.1.2 Le Pouvoir du Temps : L'Analogie du Car de Nuit</h2>

    <div class="grid md:grid-cols-2 gap-8 items-center">
      <div>
        <h3 class="font-bold text-white mb-2">La Volatilité (Les secousses)</h3>
        <p class="text-white mb-4 text-sm leading-relaxed">
          À court terme, les marchés peuvent être erratiques. Si vous regardez par la fenêtre, le paysage est flou et scintillant (volatilité quotidienne). Vous ne voyez que les secousses.
        </p>

        <h3 class="font-bold text-white mb-2">La Destination (Long terme)</h3>
        <p class="text-white text-sm leading-relaxed">
          Historiquement, les marchés ont toujours eu une tendance haussière sur des décennies. Si vous fixez l'horloge et la destination, vous savez que vous arriverez à bon port malgré les cahots.
        </p>
      </div>
      <div class="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
        <p class="text-center text-sm mt-2 italic text-white">
          "L'investisseur à long terme se concentre sur la destination, pas sur les secousses."
        </p>
      </div>
    </div>
  </div>
</div>

<div class="slide" data-slide="4">
  <div class="section-green">
    <h2>⚖️ 5.2 Lien entre horizon et allocation</h2>

    <div class="mb-6">
    <p class="text-gray-600 mb-4">Votre profil d'investisseur est défini par votre tolérance au risque, qui est votre capacité :</p>
    <ol class="list-decimal ml-6 mb-4 space-y-2 text-gray-600">
      <li><strong>Émotionnelle :</strong> À accepter psychologiquement une perte temporaire sur votre capital.</li>
      <li><strong>Financière :</strong> À ne pas avoir besoin de cet argent en cas de baisse du marché.</li>
    </ol>
    <blockquote class="border-l-4 border-teal-500 pl-4 italic text-gray-600 my-4 bg-gray-50 py-2 pr-2 rounded-r">
      "If you aren't willing to own a stock for ten years, don't even think about owning it for ten minutes." — Warren Buffett
    </blockquote>
  </div>

  <h3 class="text-lg font-bold text-teal-700 mb-3 mt-6">Les Trois Profils d'Investisseur</h3>
  <p class="text-gray-600 mb-4">Votre profil vous aide à déterminer la répartition idéale entre les classes d'actifs : les Actions (croissance, risque élevé) et les Obligations/Sécurité (sécurité, risque faible).</p>

  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 text-sm">
      <thead class="bg-teal-50">
        <tr>
          <th class="px-4 py-3 text-left font-bold text-teal-900">Profil</th>
          <th class="px-4 py-3 text-left font-bold text-teal-900">Objectif Principal</th>
          <th class="px-4 py-3 text-left font-bold text-teal-900">Tolérance au Risque</th>
          <th class="px-4 py-3 text-left font-bold text-teal-900">Allocation d'Actifs Typique</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr>
          <td class="px-4 py-3 font-bold">Prudent</td>
          <td class="px-4 py-3">Sécurité du capital, revenu stable</td>
          <td class="px-4 py-3">Faible (Ne supporte pas une perte de 10%)</td>
          <td class="px-4 py-3">Majorité Obligations/OPCVM Prudent (ex: 80% Obligations)</td>
        </tr>
        <tr>
          <td class="px-4 py-3 font-bold">Équilibré</td>
          <td class="px-4 py-3">Croissance modérée et revenu</td>
          <td class="px-4 py-3">Moyenne (Accepte une perte temporaire de 15%)</td>
          <td class="px-4 py-3">Mixte Actions/Obligations (ex: 50%/50%)</td>
        </tr>
        <tr>
          <td class="px-4 py-3 font-bold">Dynamique</td>
          <td class="px-4 py-3">Maximisation de la croissance</td>
          <td class="px-4 py-3">Élevée (Se concentre sur le potentiel, tolère 30% de perte)</td>
          <td class="px-4 py-3">Majorité Actions (ex: 80% et plus d'Actions)</td>
        </tr>
      </tbody>
    </table>
  </div>

    <div class="example-box">
      <p><strong>Exemple :</strong> Un Mamadou de 25 ans qui économise pour sa retraite est un investisseur dynamique, car il peut se permettre de prendre des risques sur 40 ans. Un Mamadou de 55 ans économisant pour l'achat d'une maison dans 3 ans sera prudent.</p>
    </div>
  </div>
</div>

<div class="slide" data-slide="5">
  <div class="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300">
    <h2 class="text-2xl font-bold text-gray-800 mb-4">📊 5.3.2 Synthèse de la Stratégie</h2>
    <p class="text-gray-600 mb-4">Aligner votre horizon temporel avec votre allocation d'actifs est la première étape vers une stratégie d'investissement réussie.</p>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-teal-50">
          <tr>
            <th class="px-4 py-3 text-left font-bold text-teal-900">Objectif de Vie (Poche)</th>
            <th class="px-4 py-3 text-left font-bold text-teal-900">Horizon</th>
            <th class="px-4 py-3 text-left font-bold text-teal-900">Profil d'Investissement</th>
            <th class="px-4 py-3 text-left font-bold text-teal-900">Allocation d'Actifs (Ex.)</th>
            <th class="px-4 py-3 text-left font-bold text-teal-900">Titres à Privilégier (BRVM)</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr>
            <td class="px-4 py-3 font-bold">Fonds d'Urgence</td>
            <td class="px-4 py-3">< 1 an</td>
            <td class="px-4 py-3">Sécurité</td>
            <td class="px-4 py-3">100% Liquide / Épargne</td>
            <td class="px-4 py-3">Hors Bourse (Banque)</td>
          </tr>
          <tr>
            <td class="px-4 py-3 font-bold">Études des enfants</td>
            <td class="px-4 py-3">10-15 ans</td>
            <td class="px-4 py-3">Dynamique/Équilibré</td>
            <td class="px-4 py-3">60% Actions BRVM / 40% Obligations</td>
            <td class="px-4 py-3">Actions régionales solides (Sonatel, Ecobank, etc.)</td>
          </tr>
          <tr>
            <td class="px-4 py-3 font-bold">Retraite</td>
            <td class="px-4 py-3">20 ans et +</td>
            <td class="px-4 py-3">Dynamique</td>
            <td class="px-4 py-3">80% Actions BRVM / 20% Obligations</td>
            <td class="px-4 py-3">Actions à fort potentiel de croissance</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<div class="slide" data-slide="6">
  <div class="glossary-box">
    <h2>🧠 Les Termes à Maîtriser</h2>
    <table>
      <thead>
        <tr>
          <th>Terme</th>
          <th>Définition</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Horizon de Placement</strong></td>
          <td>La durée de détention prévue de l'actif.</td>
        </tr>
        <tr>
          <td><strong>Volatilité</strong></td>
          <td>L'intensité des variations de prix.</td>
        </tr>
        <tr>
          <td><strong>Allocation d'Actifs</strong></td>
          <td>Répartition du capital (Actions vs Obligations).</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="cta-box">
    <h3>🎉 Félicitations !</h3>
    <p>Vous savez désormais que le temps est votre plus grand atout.</p>
    <p><strong>👉 Prochaine leçon : Module 6 — Le Mental du Gagnant</strong></p>
  </div>
</div>
`,
  });

  // =======================================================
  // === M6 : Le Mental du Gagnant – Psychologie d’Investissement ===
  // =======================================================
  await createOrUpdateModule({
    title: "Le Mental du Gagnant – Psychologie d’Investissement",
    slug: 'analyse-fondamentale',
    description: "Maîtrisez vos émotions, comprenez les intérêts composés et différencier les grandes stratégies d'investissement.",
    difficulty_level: 'Debutant',
    content_type: 'article',
    duration_minutes: 20,
    order_index: 6,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

<div class="space-y-8 max-w-4xl mx-auto">

  <div class="objectif-hero">
    <h2 style="color: #000000;">🎯 Objectif Pédagogique :</h2>
    <p style="color: #000000;"><strong></strong> À la fin de ce module, vous serez capable de :</p>
    <ul style="color: #000000;">
      <li>Comprendre les principes de la finance comportementale et la différence entre investir et spéculer.</li>
      <li>Identifier les biais cognitifs et émotionnels les plus fréquents (peur, avidité) et leur impact sur vos décisions.</li>
      <li>Mettre en place des stratégies (antidotes) pour une discipline d'investissement rigoureuse.</li>
      <li>Utiliser le pouvoir des intérêts composés comme preuve de la nécessité d'une vision à long terme.</li>
    </ul>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-purple-100 pb-2 flex items-center gap-2">
      🧠 6.1 Introduction à la finance comportementale
    </h2>
    
    <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-purple-500 mb-6">
      <p class="text-gray-700 italic">
        Sur les marchés financiers, la plus grande menace pour votre portefeuille n'est pas la crise économique, mais l'homme qui se regarde dans le miroir : vous-même. 
        La finance comportementale enseigne que les émotions (la peur et l'avidité) mènent aux décisions irrationnelles, ce qui est la cause principale des erreurs chez les débutants.
      </p>
    </div>

    <h3 class="text-xl font-bold text-purple-800 mb-4">6.1.1 Investir vs. Spéculer : Une Distinction Essentielle</h3>
    <p class="text-gray-600 mb-4">Définir clairement votre rôle est la première étape pour maîtriser votre mental :</p>
    
    <div class="overflow-x-auto mb-6">
      <table class="min-w-full border divide-y divide-gray-200 text-sm">
        <thead class="bg-purple-700">
          <tr>
            <th class="px-4 py-3 text-left font-bold text-white">Caractéristique</th>
            <th class="px-4 py-3 text-left font-bold text-white">L'Investisseur (Le Propriétaire)</th>
            <th class="px-4 py-3 text-left font-bold text-white">Le Spéculateur (Le Joueur)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr>
            <td class="px-4 py-3 font-bold text-gray-700">Objectif</td>
            <td class="px-4 py-3 text-gray-600">Acquérir une part d’entreprise solide pour son potentiel de croissance future (Valeur interne de l’actif).</td>
            <td class="px-4 py-3 text-gray-600">Parier sur l’évolution à court terme du prix.</td>
          </tr>
          <tr>
            <td class="px-4 py-3 font-bold text-gray-700">Horizon de Temps</td>
            <td class="px-4 py-3 text-green-600 font-bold">Long terme (années, décennies).</td>
            <td class="px-4 py-3 text-red-500 font-bold">Court terme (jours, semaines).</td>
          </tr>
          <tr>
            <td class="px-4 py-3 font-bold text-gray-700">Moteur</td>
            <td class="px-4 py-3 text-gray-600">La patience, l’analyse des fondamentaux.</td>
            <td class="px-4 py-3 text-gray-600">L'excitation (marché monte) ou panique (marché descend).</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
      <p class="text-sm text-blue-800">
        <strong>💡 Rappel de l'Expert :</strong> L'excitation et les dépenses sont vos ennemis. L'excitation conduit aux achats impulsifs aux prix trop élevés. Concentrez-vous à agir comme un propriétaire d'entreprise.
      </p>
    </div>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-purple-100 pb-2 flex items-center gap-2">
      🎭 6.2 Nos pires ennemis : La Peur, l'Avidité et les Biais Cognitifs
    </h2>
    <p class="text-gray-600 mb-6">Les bulles spéculatives et les krachs boursiers sont avant tout des phénomènes psychologiques, alimentés par deux émotions primaires.</p>

    <h3 class="text-lg font-bold text-purple-800 mb-4">6.2.1 La Peur et l'Avidité (Fear & Greed)</h3>
    <div class="overflow-x-auto mb-8">
      <table class="min-w-full border divide-y divide-gray-200 text-sm">
        <thead class="bg-purple-700">
          <tr>
            <th class="px-4 py-3 text-left font-bold text-white">Émotion</th>
            <th class="px-4 py-3 text-left font-bold text-white">Description</th>
            <th class="px-4 py-3 text-left font-bold text-white">Conséquence Destructrice</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr class="bg-amber-50/30">
            <td class="px-4 py-3 font-bold text-amber-700 italic">L'Avidité (Greed)</td>
            <td class="px-4 py-3">Pousse à acheter quand les prix sont hauts par peur de manquer le gain (FOMO).</td>
            <td class="px-4 py-3 font-medium text-amber-800">Achat de titres surévalués.</td>
          </tr>
          <tr class="bg-rose-50/30">
            <td class="px-4 py-3 font-bold text-rose-700 italic">La Peur (Fear)</td>
            <td class="px-4 py-3">Pousse à vendre lorsque les prix baissent.</td>
            <td class="px-4 py-3 font-medium text-rose-800">Transformation d'une perte temporaire en perte réelle.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-lg font-bold text-purple-800 mb-4">6.2.2 Les Biais Cognitifs les Plus Fréquents</h3>
    <div class="space-y-4">
      <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        <div class="bg-purple-600 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center shrink-0">1</div>
        <p class="text-gray-700"><strong class="text-purple-900">Le Biais de Confirmation :</strong> Chercher uniquement les nouvelles qui confortent votre choix initial, en ignorant les informations contradictoires.</p>
      </div>
      <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        <div class="bg-purple-600 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center shrink-0">2</div>
        <p class="text-gray-700"><strong class="text-purple-900">L'Ancrage :</strong> Rester figé(e) sur le prix initial d'achat. Cela empêche de vendre un titre perdant car vous attendez qu'il remonte à votre prix d'achat.</p>
      </div>
      <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        <div class="bg-purple-600 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center shrink-0">3</div>
        <p class="text-gray-700"><strong class="text-purple-900">L'Excès de Confiance :</strong> Surestimer sa propre capacité à battre le marché ou à prédire les mouvements de prix futurs.</p>
      </div>
    </div>
  </div>

  <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
    <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
      🛡️ 6.3 Les Antidotes : Discipline, Méthode et Routine
    </h2>

    <div class="mb-10">
      <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">📈 6.3.1 La 8ème Merveille du Monde : Les Intérêts Composés</h3>
      <p class="text-gray-700 mb-6 leading-relaxed">
        C'est l'essence même de l'investissement à long terme. Les gains générés sont réinvestis pour produire à leur tour de nouveaux gains : c'est l'argent qui travaille pour l'argent.
      </p>

      <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center mb-6">
        <p class="text-sm text-gray-700 mb-3 font-bold">Formule mathématique :</p>
        <p class="text-xl text-gray-800">
          <strong>Valeur Finale</strong> = Capital × (1 + Taux d'intérêt)<sup>Nombre d'années</sup>
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p class="text-sm text-gray-800"><strong>🚀 Effet Exponentiel :</strong> Plus vous commencez tôt, plus la courbe de votre richesse s'envole de manière spectaculaire.</p>
        </div>
        <div class="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 class="font-bold text-green-700 mb-1">🌳 Analogie : Le Jeune Baobab</h4>
          <p class="text-sm text-gray-800">Il met du temps à grandir au début, mais une fois ses racines établies, sa croissance accélère massivement. C'est le temps, pas l'effort, qui crée sa majesté.</p>
        </div>
      </div>
    </div>

    <div class="bg-red-50 p-6 rounded-xl border border-red-200 mb-8">
      <h3 class="text-lg font-bold text-red-700 mb-4 uppercase tracking-wider">🚫 6.3.2 Les 3 Erreurs Classiques à Éviter</h3>
      <div class="space-y-4 text-sm text-gray-800">
        <p><strong>1. Tenter de "Timer" le Marché :</strong> Essayer de deviner les points hauts ou bas. C'est de la spéculation.</p>
        <p><strong>2. Manquer de Diversification :</strong> Tout miser sur une seule action. La diversification réduit le risque.</p>
        <p><strong>3. Vendre en Panique :</strong> Réagir émotionnellement à une baisse, détruisant ainsi la puissance du long terme.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-gray-800 mb-4">6.3.3 Les Grandes Stratégies d'Investissement</h3>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-purple-50 p-4 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
        <h4 class="font-bold text-gray-800 mb-2 underline">Value Investing</h4>
        <p class="text-sm text-gray-700">Acheter des "bonnes affaires" en dessous de leur valeur intrinsèque (Style Buffett).</p>
      </div>
      <div class="bg-purple-50 p-4 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
        <h4 class="font-bold text-gray-800 mb-2 underline">Growth Investing</h4>
        <p class="text-sm text-gray-700">Acheter des entreprises à croissance rapide, même si elles semblent chères.</p>
      </div>
      <div class="bg-purple-50 p-4 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
        <h4 class="font-bold text-gray-800 mb-2 underline">Dividendes</h4>
        <p class="text-sm text-gray-700">Viser des revenus réguliers via des entreprises matures (Banques, Télécoms).</p>
      </div>
    </div>
  </div>

  <div class="bg-gray-100 p-8 rounded-xl border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-4">📈 6.4 Psychologie face à la Volatilité</h2>
    <p class="text-gray-700 mb-6">La volatilité est la norme, pas l'exception. La psychologie du gagnant consiste à transformer la volatilité en opportunité.</p>
    
    <div class="bg-white p-8 rounded-xl shadow-inner border-l-8 border-purple-800 text-center italic">
      <p class="text-xl text-gray-800 mb-4">
        "Investors should remember that excitement and expenses are their enemies. And if they insist on trying to time their participation in equities, they should try to be fearful when others are greedy and greedy only when others are fearful."
      </p>
      <cite class="text-purple-900 font-bold not-italic">— Warren Buffett</cite>
    </div>
    
    <div class="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
      <p class="text-purple-900 font-medium text-center">
        En d'autres termes : quand le marché panique, c'est le moment d'acheter. Quand tout le monde s'emballe, c'est le moment d'être prudent.
      </p>
    </div>
  </div>

  <div class="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">🧠 Les Termes à Maîtriser</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm border border-gray-200">
        <thead>
          <tr class="bg-purple-700">
            <th class="px-4 py-3 text-left text-white uppercase font-bold">Terme</th>
            <th class="px-4 py-3 text-left text-white uppercase font-bold">Définition</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr>
            <td class="px-4 py-4 font-bold text-gray-800">Intérêts Composés</td>
            <td class="px-4 py-4 text-gray-700">Processus par lequel les gains sont réinvestis pour produire leurs propres gains.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-gray-800">Biais Cognitif</td>
            <td class="px-4 py-4 text-gray-700">Erreur de jugement systématique basée sur des raccourcis de pensée.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-gray-800">Value Investing</td>
            <td class="px-4 py-4 text-gray-700">Stratégie consistant à acheter des titres sous-évalués par le marché.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-gray-800">Ancrage</td>
            <td class="px-4 py-4 text-gray-700">Biais qui pousse à rester focalisé sur le prix initial d'achat d'un titre.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <hr class="border-gray-200 my-8"/>

    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="text-center md:text-left">
        <p class="text-xl font-bold text-gray-800">🧭 Prochaine Étape</p>
        <p class="text-gray-700">Vous avez la discipline. Place à l'outil le plus puissant : l'analyse.</p>
      </div>
      <button class="bg-purple-600 text-white hover:bg-purple-700 font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-xl flex items-center gap-2">
        👉 Module 7 : Analyse Fondamentale
      </button>
    </div>
  </div>

</div>
`,
  });

  // ====================================================
  // === M7 : Analyse Fondamentale – Devenir un Analyste Éclairé ===
  // ====================================================
  await createOrUpdateModule({
    title: "Analyse Fondamentale – Devenir un Analyste Éclairé",
    slug: 'analyse-technique',
    description: "Apprenez à déceler la santé réelle des entreprises, anticipez l'impact des actualités et déterminez le prix juste avant que le marché ne réagisse.",
    difficulty_level: 'intermediaire',
    content_type: 'article',
    duration_minutes: 20,
    order_index: 7,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-5xl mx-auto font-sans text-gray-900">

  <div class="p-8 rounded-2xl shadow-lg" style="background-color: #4c1d95; color: #ffffff;">
    <h2 class="text-3xl font-bold mb-6 flex items-center gap-3" style="color: #ffffff;">
      🎯 Objectif Pédagogique du Module
    </h2>
    <p class="text-lg mb-6" style="color: #ede9fe;">
      À la fin de ce module, vous serez capable de :
    </p>
    <ul class="space-y-4 text-lg">
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Lire et comprendre la logique des trois principaux états financiers d'une société cotée (Compte de Résultat, Bilan, Tableau des Flux de Trésorerie).
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Calculer et interpréter les ratios fondamentaux clés (PER, ROE, Marge Nette, Gearing) pour évaluer la santé financière et la rentabilité.
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Appliquer des méthodes simples de valorisation pour déterminer si une action BRVM est chère ou bon marché.
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Utiliser une approche structurée pour choisir les meilleures entreprises où investir.
      </li>
    </ul>
  </div>

  <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-purple-600 pb-3">
      7.1 Lecture et compréhension des états financiers
    </h2>
    <p class="text-gray-700 mb-10 text-lg leading-relaxed">
      L'Analyse Fondamentale est l'art de déterminer la vraie valeur (valeur intrinsèque) d'une entreprise avant d'acheter ses actions. Elle se base sur l'étude des rapports annuels et des états financiers.
    </p>

    <div class="bg-gray-50 p-6 rounded-xl">
      <h3 class="text-xl font-bold text-purple-800 mb-6">7.1.1 Les Trois Piliers de l'Analyse</h3>
      <p class="text-gray-600 mb-8 leading-relaxed">Pour évaluer la santé d'une entreprise, vous avez besoin de ses trois états financiers :</p>

      <div class="space-y-8">
        <!-- Compte de Résultat -->
        <div class="bg-white p-6 rounded-xl border-l-4 border-purple-500 shadow-sm">
          <p class="font-bold text-purple-900 mb-4 text-lg">Le Compte de Résultat (P&L - Profit and Loss) :</p>
          <div class="space-y-4 text-gray-700">
            <p class="leading-relaxed"><strong class="text-gray-900">La question :</strong> Qu'est-ce qu'on gagne ?</p>
            <p class="leading-relaxed"><strong class="text-gray-900">Le rôle :</strong> Il mesure la performance de l'entreprise sur une période donnée (une année, un trimestre).</p>
            <p class="leading-relaxed"><strong class="text-gray-900">Les éléments clés :</strong> Chiffre d'Affaires (Ventes totales), Dépenses (Charges), et le résultat final (le Bénéfice Net).</p>
          </div>
        </div>

        <!-- Bilan -->
        <div class="bg-white p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
          <p class="font-bold text-blue-900 mb-4 text-lg">Le Bilan :</p>
          <div class="space-y-4 text-gray-700">
            <p class="leading-relaxed"><strong class="text-gray-900">La question :</strong> Qu'est-ce qu'on possède et qu'est-ce qu'on doit ?</p>
            <p class="leading-relaxed"><strong class="text-gray-900">Le rôle :</strong> C'est une photographie à un instant T de ce que possède l'entreprise (Actifs) et de ce qu'elle doit (Passifs).</p>
            <p class="leading-relaxed"><strong class="text-gray-900">La logique :</strong> Le total des Actifs doit toujours être égal au total des Passifs (Dettes + Capitaux Propres). Les Capitaux Propres représentent l'argent qui appartient aux actionnaires.</p>
          </div>
        </div>

        <!-- Tableau des Flux -->
        <div class="bg-white p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
          <p class="font-bold text-green-900 mb-4 text-lg">Le Tableau des Flux de Trésorerie (TFT/Cash Flow) :</p>
          <div class="space-y-4 text-gray-700">
            <p class="leading-relaxed"><strong class="text-gray-900">La question :</strong> Où va l'argent liquide ?</p>
            <p class="leading-relaxed"><strong class="text-gray-900">Le rôle :</strong> Il est le plus honnête ! Il montre les mouvements réels de cash (argent) entrant et sortant.</p>
            <p class="leading-relaxed"><strong class="text-gray-900">Pourquoi est-il crucial :</strong> Le Bénéfice Net du Compte de Résultat peut être manipulé par des écritures comptables (amortissements, provisions). Le Cash Flow montre si l'entreprise génère réellement du liquide, ce qui est nécessaire pour payer les dividendes, les dettes et investir.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-purple-600 pb-3">
      7.2 Analyse détaillée : Les trois volets
    </h2>
    <p class="text-gray-700 mb-10 italic text-lg leading-relaxed">L'analyste éclairé étudie les tendances sur 5 ans. Une bonne entreprise présente une croissance stable et régulière de ses indicateurs.</p>

    <div class="space-y-12">
      <!-- 7.2.1 -->
      <div class="bg-gray-50 p-6 rounded-xl">
        <h3 class="text-xl font-bold text-purple-800 mb-6">7.2.1 Analyse du Compte de Résultat : Les Marge et la Croissance</h3>
        <div class="space-y-6">
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <p class="text-gray-700 leading-relaxed"><strong class="text-gray-900">Croissance du Chiffre d'Affaires :</strong> L'indicateur de base. L'entreprise vend-elle de plus en plus ? Une croissance régulière est un signe de bonne santé.</p>
          </div>

          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <p class="text-gray-700 leading-relaxed mb-4"><strong class="text-gray-900">Marge Brute, Marge Opérationnelle et Marge Nette :</strong></p>
            <p class="text-gray-600 leading-relaxed mb-5 pl-4">La Marge Nette est le ratio le plus important. Elle mesure quel pourcentage du chiffre d'affaires est conservé comme Bénéfice Net.</p>
            <div class="my-6 p-5 bg-purple-100 rounded-xl text-center font-bold text-purple-900 text-lg">
              <strong>Marge Nette</strong> = Bénéfice Net ÷ Chiffre d'Affaires
            </div>
            <p class="text-gray-600 italic leading-relaxed pl-4">Interprétation : C'est le "rendement" des ventes. Pour 100 xof  de produits vendus, combien de franc finissent réellement dans la poche de l'entreprise après avoir payé absolument tout le monde (fournisseurs, impôts, salaires).</p>
          </div>
        </div>
      </div>

      <!-- 7.2.2 -->
      <div class="bg-gray-50 p-6 rounded-xl">
        <h3 class="text-xl font-bold text-purple-800 mb-6">7.2.2 Analyse du Bilan : La Solvabilité</h3>
        <div class="space-y-6">
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <p class="text-gray-700 leading-relaxed"><strong class="text-gray-900">Capitaux Propres :</strong> L'argent qui appartient aux actionnaires doit croître année après année, signe que l'entreprise conserve et réinvestit une partie de ses bénéfices.</p>
          </div>

          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <p class="text-gray-700 leading-relaxed mb-4"><strong class="text-gray-900">Le Ratio d'Endettement (Gearing ou Ratio Dette Nette / Capitaux Propres) :</strong></p>
            <div class="my-6 p-5 bg-blue-100 rounded-xl text-center font-bold text-blue-900 text-lg">
              <strong>Gearing</strong> = Dette Nette ÷ Capitaux Propres
            </div>
            <div class="pl-4 space-y-4">
              <p class="text-gray-600 leading-relaxed"><strong class="text-gray-800">Interprétation :</strong> Elle mesure la dépendance de l'entreprise vis-à-vis de ses créanciers. Un ratio de 0,5 signifie que la dette représente 50 % des fonds propres. Au-delà de 1 (ou 100 %), on commence souvent à surveiller si l'entreprise n'est pas trop "sous pression".
              Ce ratio est crucial. Un Gearing élevé (Dette > Capitaux Propres) signifie que l'entreprise est très dépendante de la dette bancaire. Elle est vulnérable en cas de hausse des taux d'intérêt (décidée par la BCEAO) ou de crise économique.</p>
              <p class="text-gray-600 leading-relaxed"><strong class="text-gray-800">Règle du débutant :</strong> Assurez-vous que les Capitaux Propres couvrent largement les dettes.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 7.2.3 -->
      <div class="bg-gray-50 p-6 rounded-xl">
        <h3 class="text-xl font-bold text-purple-800 mb-6">7.2.3 Analyse du Tableau des Flux de Trésorerie : La Qualité des Profits</h3>
        <div class="space-y-4">
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <p class="text-gray-700 leading-relaxed"><strong class="text-gray-900">Flux de Trésorerie d'Exploitation (FTE) :</strong> C'est l'argent généré par l'activité normale de l'entreprise. S'il est positif et supérieur au Bénéfice Net, c'est un excellent signe de profits de haute qualité.</p>
          </div>
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <p class="text-gray-700 leading-relaxed"><strong class="text-gray-900">Flux de Trésorerie d'Investissement :</strong> Montre combien l'entreprise dépense pour son avenir (usines, machines, etc.).</p>
          </div>
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <p class="text-gray-700 leading-relaxed"><strong class="text-gray-900">Flux de Trésorerie de Financement :</strong> Montre comment l'entreprise gère sa dette et ses actionnaires (paiement de dividendes, émission de nouvelles dettes).</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-purple-50 p-8 rounded-xl border border-purple-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-purple-600 pb-3">
      7.3 Les ratios essentiels pour l'investisseur BRVM
    </h2>
    <p class="text-gray-700 mb-8 text-lg leading-relaxed">Les ratios permettent de comparer facilement des entreprises de tailles différentes et d'évaluer leur efficacité.</p>

    <div class="bg-white p-5 rounded-lg border border-purple-100 mb-6">
      <h3 class="font-bold text-purple-900 mb-2">7.3.1 PER (Price-to-Earnings Ratio) : Le Prix du Bénéfice</h3>
      <p class="text-sm text-gray-600 mb-4">Le PER est le ratio le plus célèbre. Il mesure combien les investisseurs sont prêts à payer pour chaque franc CFA de bénéfice net annuel d'une action.</p>
      <div class="p-4 bg-purple-900 text-white rounded text-center font-bold mb-4">
        <strong>PER</strong> = Cours de l'action ÷ Bénéfice Net par Action (BPA)
      </div>
      <p class="text-gray-700 mb-2"><strong>Interprétation :</strong> Un PER de 10 signifie qu'il faudrait 10 années de bénéfices stables pour "récupérer" l'investissement initial.</p>
      <ul class="ml-6 text-sm text-gray-700 space-y-1">
        <li> <strong>PER faible (ex: 5 à 10) :</strong> Souvent considéré comme une bonne affaire (Value Investing).</li>
        <li> <strong>PER élevé (ex: 20+) :</strong> Le marché anticipe une très forte croissance future (Growth Investing).</li>
      </ul>
      <div class="bg-white p-5 rounded-lg border border-purple-100 mt-6">
      <h3 class="font-bold text-purple-900 mb-2">Le Ratio PEG : Le juge de paix de la croissance</h3>
      <p class="text-sm text-gray-600 mb-4">
        Pour savoir si un PER élevé est justifié, on utilise le PEG (Price/Earnings to Growth). Il lie le prix de l'action à la vitesse à laquelle l'entreprise progresse.
      </p>
      <div class="p-4 bg-purple-900 text-white rounded text-center font-bold mb-4">
        <strong>PEG</strong> = PER ÷ Taux de croissance annuel des bénéfices (%)
      </div>

      <div class="space-y-4">
        <p class="text-gray-700 text-sm">
          <strong>Pourquoi l'utiliser ?</strong> Si une action a un PER élevé de 20, mais que ses bénéfices croissent de 20 % par an, son PEG est de 1.
        </p>
        
        <div class="p-4 bg-blue-50 border-l-4 border-blue-500">
          <p class="text-sm text-blue-900">
            <strong>Interprétation :</strong> Un PEG proche de 1 est souvent considéré comme un prix juste pour une entreprise en pleine expansion. S'il est bien inférieur à 1, l'action est potentiellement sous-évaluée malgré un PER élevé.
          </p>
        </div>
      </div>
    </div>
      <div class="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 text-sm text-amber-900">
        <strong>Nuance BRVM (Essentiel) :</strong> La BRVM est un marché de croissance (Frontier Market). Les études montrent que les investisseurs régionaux valorisent fortement le potentiel de croissance future. Ne rejetez jamais une action uniquement à cause d'un PER élevé. Comparez-le toujours à la moyenne sectorielle et aux perspectives de croissance.
      </div>
    </div>

    <div class="bg-white p-5 rounded-lg border border-purple-100">
      <h3 class="font-bold text-purple-900 mb-2">7.3.2 ROE (Return on Equity) : L'Efficacité</h3>
      <p class="text-sm text-gray-600 mb-4">Le Retour sur Capitaux Propres (ROE) mesure l'efficacité avec laquelle l'entreprise utilise l'argent investi par ses actionnaires.</p>
      <div class="p-4 bg-purple-900 text-white rounded text-center font-bold mb-4">
        <strong>ROE</strong> = Bénéfice Net ÷ Capitaux Propres
      </div>
      <p class="text-gray-700 mb-4"><strong>Interprétation :</strong> Un ROE de 15 % et plus est considéré comme excellent. Il indique que l'entreprise génère 15 FCFA de bénéfice pour chaque 100 FCFA que les actionnaires y ont investis. C'est le signe d'une bonne gestion.</p>
      
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 class="font-bold text-green-800">L'Analogie à Retenir : Le Gestionnaire du Maquis</h4>
        <p class="text-sm text-green-900">Un maquis peut avoir de grandes ventes (chiffre d'affaires), mais s'il gaspille beaucoup d'ingrédients, il est inefficace. Le ROE mesure si le gestionnaire (l'équipe dirigeante) est efficace à transformer l'argent que vous lui donnez en profit. Plus le ROE est élevé, plus l'entreprise est efficace.</p>
      </div>
    </div>

<div class="my-8 rounded-2xl overflow-hidden shadow-xl border-2 border-red-600">
  <div class="p-6" style="background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); color: #ffffff;">
    
    <div class="flex items-center gap-4 mb-4">
      <div class="bg-white/20 p-2 rounded-lg">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold uppercase tracking-wide">
        Le revers de la médaille : Attention à l'endettement
      </h2>
    </div>

    <div class="space-y-4 text-lg leading-relaxed">
      <p class="font-medium">
        Un ROE très élevé peut parfois cacher une entreprise trop endettée. En finance, on dit que la dette fait "levier" sur la rentabilité.
      </p>
      
      

      <div class="bg-black/20 p-4 rounded-xl border border-white/30">
        <p>
          Vérifiez toujours le <strong>Gearing</strong> (ratio d'endettement) en parallèle : un ROE de 30 % avec une dette massive est beaucoup plus risqué qu'un ROE de 15 % sans aucune dette.
        </p>
      </div>
    </div>

  </div>
</div>    
  </div>

  <div class="bg-white p-6 rounded-xl border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-purple-600 pb-2">
      7.4 Valorisation d’une action : Déterminer la valeur intrinsèque
    </h2>
    <div class="space-y-6 text-gray-700">
      <div>
        <h3 class="font-bold text-purple-900">7.4.1 La Méthode des Comparables (Multiples)</h3>
        <p class="text-sm"><strong>Principe :</strong> C'est la méthode la plus simple pour le débutant. Si une entreprise A (ex: Ecobank CI) se vend à un PER de 8, alors une entreprise B (ex: une autre banque) ne devrait pas se vendre à un PER de 20, sauf si elle a une croissance exceptionnelle.</p>
        <p class="text-sm"><strong>Mise en œuvre :</strong> Calculer les ratios (PER, P/B, Marge) de votre cible et les comparer à la moyenne du secteur à la BRVM. Si les ratios de votre cible sont meilleurs mais que le prix est similaire, elle pourrait être sous-évaluée.</p>
      
        <div class="my-6 rounded-xl border-2 border-amber-400 bg-amber-50 overflow-hidden shadow-sm">
  <div class="flex flex-col md:flex-row">
    <div class="bg-amber-400 p-4 flex items-center justify-center shrink-0">
      <svg class="w-10 h-10 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
      </svg>
    </div>
    
    <div class="p-6">
      <h3 class="text-xl font-bold text-amber-900 mb-3 flex items-center gap-2">
        💡 Le point clé : On ne compare que ce qui est comparable
      </h3>
      
      <div class="space-y-4 text-amber-950">
        <p class="leading-relaxed">
          On ne compare pas le PER d'une banque (Ecobank) avec celui d'une entreprise industrielle (SITAB).
        </p>

        <div class="bg-white/50 p-4 rounded-lg border border-amber-200">
          <p class="italic">
            <strong>Astuce :</strong> Si l'entreprise cible a un PER de 6 alors que la moyenne de son secteur à la BRVM est de 10, elle est soit une opportunité en or, soit elle cache un problème grave que le marché a déjà anticipé.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
        </div>
      <div>
        <h3 class="font-bold text-purple-900">7.4.2 La Méthode des Dividendes Actualisés (DDM)</h3>
        <p class="text-sm"><strong>Principe :</strong> La valeur d'une action est égale à la somme des dividendes futurs qu'elle versera, actualisée à aujourd'hui. Elle est très utile pour les entreprises matures de la BRVM qui versent des dividendes stables (Télécoms, Banques).</p>
        <p class="text-sm"><strong>Limitation :</strong> Ne fonctionne pas bien pour les entreprises qui ne versent pas ou peu de dividendes (entreprises en forte croissance).</p>
      </div>
      <div class="p-4 bg-gray-50 rounded border-l-4 border-purple-300">
        <h3 class="font-bold text-purple-900">7.4.3 Le Flux de Trésorerie Actualisés (DCF - Discounted Cash Flow)</h3>
        <p class="text-sm"><strong>Principe (Avancé) :</strong> La valeur d'une entreprise est déterminée par la somme de tous ses Flux de Trésorerie Futurs (Cash Flow), actualisée à aujourd'hui.</p>
        <p class="text-sm"><strong>Avantage :</strong> C'est la méthode la plus précise car elle se base sur le vrai cash généré.</p>
        <p class="text-sm font-bold mt-2">Recommandation pour le débutant : Comprenez la logique (la valeur vient du cash futur), mais laissez les calculs complexes aux professionnels. Pour l'instant, focalisez-vous sur les ratios. Heureusement, ces ratios sont disponibles pour chaque action dans l'onglet Marchés/analyse  "Ratios".</p>
      </div>
    </div>
  </div>

 
  <div class="bg-gray-900 text-white p-8 rounded-xl shadow-lg">
    <h2 class="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">🧠 Les Termes à Maîtriser</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-gray-400 uppercase">
            <th class="px-4 py-2 text-left">Terme</th>
            <th class="px-4 py-2 text-left">Définition</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr>
            <td class="px-4 py-4 font-bold text-purple-400">Bénéfice Net par Action (BPA)</td>
            <td class="px-4 py-4">Le Bénéfice Net divisé par le nombre total d'actions. Base de calcul du PER.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-purple-400">Marge Nette</td>
            <td class="px-4 py-4">Mesure le pourcentage du Chiffre d'Affaires conservé en Bénéfice Net.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-purple-400">Gearing</td>
            <td class="px-4 py-4">Ratio Dette Nette / Capitaux Propres, mesure le niveau d'endettement d'une entreprise par rapport à ses propres fonds.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-purple-400">Valeur Intrinsèque</td>
            <td class="px-4 py-4">La vraie valeur estimée d'une entreprise, indépendante de son prix en bourse.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-purple-400">DCF</td>
            <td class="px-4 py-4">Discounted Cash Flow (Flux de Trésorerie Actualisés), méthode de valorisation basée sur les flux de trésorerie futurs.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="bg-gray-100 p-8 rounded-xl text-center border border-gray-200">
    <h3 class="text-xl font-bold text-gray-800 mb-4">🧭 Prochaine Étape</h3>
    <p class="text-gray-600 mb-6">Vous maîtrisez désormais les outils pour choisir une bonne entreprise. Mais le risque existe toujours. Comment le gérer ?</p>
    <button class="bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md">
      👉 Prochaine leçon : Module 8 — La Maîtrise du Risque : Diversification et Gestion de Portefeuille.
    </button>
  </div>

</div>
`,
  });

  // ====================================================
  // === M8 : L’Évaluation d’Entreprise – Projeter l’Avenir (Valorisation Avancée) ===
  // ====================================================
  await createOrUpdateModule({
    title: "L’Évaluation d’Entreprise – Projeter l’Avenir (Valorisation Avancée)",
    slug: 'construire-portefeuille',
    description: "Comprenez et appliquez la diversification (sectorielle, d'actifs) et saurez comment l'allocation d'actifs réduit le risque global de votre portefeuille.",
    difficulty_level: 'intermediaire',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 8,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-5xl mx-auto font-sans text-gray-900">

  <div class="p-8 rounded-2xl shadow-lg" style="background-color: #312e81; color: #ffffff;">
    <h2 class="text-3xl font-bold mb-6 flex items-center gap-3" style="color: #ffffff;">
      🎯 Objectif Pédagogique du Module
    </h2>
    <p class="text-lg mb-6" style="color: #e0e7ff;">
      À la fin de ce module, vous serez capable de :
    </p>
    <ul class="space-y-4 text-lg">
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Comprendre la logique fondamentale de la valorisation basée sur l'actualisation (méthode DCF et DDM).
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Identifier les paramètres clés (taux d'actualisation, taux de croissance, Terminal Value) et leur impact sur la valeur finale d'une action.
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Appliquer la méthode DDM pour valoriser les entreprises matures à dividendes réguliers de la BRVM.
      </li>
    </ul>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-indigo-600 pb-2">
      8.1 Méthode DCF (Discounted Cash Flow) : Actualisation des Flux de Trésorerie
    </h2>
    <p class="text-gray-700 mb-6">
      La méthode DCF est la plus respectée par les analystes professionnels. Elle repose sur le principe que la valeur d'une entreprise est égale à la somme de tous ses flux de trésorerie futurs, ramenée à sa valeur aujourd'hui (Actualisé).
    </p>

    <div class="space-y-8">
      <div>
        <h3 class="text-xl font-bold text-indigo-800 mb-4 italic">8.1.1 Le Principe de l'Actualisation : Pourquoi aujourd'hui est mieux que demain</h3>
        <ul class="space-y-4 text-gray-700">
          <li>• <strong>La Valeur Temps de l'Argent :</strong> Un Franc CFA reçu aujourd'hui vaut plus qu'un Franc CFA reçu dans un an. Pourquoi ?
            <div class="ml-6 mt-2 grid md:grid-cols-2 gap-4">
              <div class="p-3 bg-gray-50 rounded border border-gray-100">
                <span class="font-bold text-indigo-700">Inflation :</span> Le pouvoir d'achat diminue avec le temps.
              </div>
              <div class="p-3 bg-gray-50 rounded border border-gray-100">
                <span class="font-bold text-indigo-700">Coût d'Opportunité :</span> L'argent non investi aujourd'hui ne peut pas générer d'intérêts (composés, Module 6).
              </div>
            </div>
          </li>
          <li>• <strong>L'Actualisation :</strong> C'est l'opération mathématique qui permet de ramener ces flux futurs (prévus) à leur Valeur Actuelle Nette (VAN).</li>
        </ul>
      </div>

      

      <div>
        <h3 class="text-xl font-bold text-indigo-800 mb-4 italic">8.1.2 Les Deux Composantes du DCF</h3>
        <p class="text-gray-600 mb-4">L'évaluation DCF se fait en deux grandes étapes :</p>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="p-5 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
            <p class="font-bold text-indigo-900 mb-2">La Période de Prévision Explicite (5 à 10 ans) :</p>
            <p class="text-sm text-gray-700">L'analyste projette les Flux de Trésorerie d'Exploitation pour les 5 ou 10 prochaines années (en se basant sur l'Analyse Fondamentale du Module 7).<br><br><strong>Clé pour la BRVM :</strong> La projection doit être prudente, car le marché régional peut être volatil (chocs sur les matières premières, politique).</p>
          </div>
          <div class="p-5 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
            <p class="font-bold text-indigo-900 mb-2">La Valeur Terminale (Terminal Value - VT) :</p>
            <p class="text-sm text-gray-700">C'est la valeur de l'entreprise après la période de prévision explicite (de l'an 11 à l'infini).<br><br><strong>Pourquoi ?</strong> On suppose que l'entreprise continuera d'exister et de générer du cash indéfiniment, mais à un taux de croissance plus faible et stable. La VT représente souvent 70 à 80 % de la valeur totale de l'entreprise !</p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-xl font-bold text-indigo-800 mb-4 italic">8.1.3 Le Taux d'Actualisation (Le WACC)</h3>
        <p class="text-gray-700 mb-4">Le Taux d'Actualisation est le taux utilisé pour ramener les flux futurs à la valeur présente. Il est souvent appelé Coût Moyen Pondéré du Capital (CMPC ou WACC).</p>
        <ul class="ml-6 space-y-2 text-gray-700">
          <li>• <strong>Rôle :</strong> Il représente le coût total pour l'entreprise de financer ses actifs (par la dette et par les fonds propres des actionnaires).</li>
          <li>• <strong>Impact :</strong> Plus ce taux est élevé, plus la valeur actuelle des flux futurs est faible, et donc plus la valeur intrinsèque de l'action est faible (car le risque est perçu comme élevé).</li>
        </ul>
      </div>

      <div class="p-6 bg-indigo-900 text-white rounded-xl shadow-inner">
        <p class="text-center text-indigo-200 mb-4 font-bold uppercase tracking-wider">Résumé du DCF :</p>
        <div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;font-family:Georgia,serif;font-size:1.15rem;padding:8px 0;">
          <span style="font-weight:600;">Valeur Intrinsèque</span>
          <span>=</span>
          <span style="font-size:2rem;line-height:1;">∑</span>
          <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;">
            <span style="border-bottom:2px solid #c7d2fe;padding:2px 10px 4px;">FCF<sub style="font-size:0.75em;">t</sub></span>
            <span style="padding:4px 10px 2px;">(1 + WACC)<sup style="font-size:0.75em;">t</sup></span>
          </span>
          <span style="font-size:1.3rem;">+</span>
          <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;">
            <span style="border-bottom:2px solid #c7d2fe;padding:2px 10px 4px;">VT<sub style="font-size:0.75em;">N</sub></span>
            <span style="padding:4px 10px 2px;">(1 + WACC)<sup style="font-size:0.75em;">N</sup></span>
          </span>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-600 pb-2">
      8.2 Méthode DDM (Dividend Discount Model) : Actualisation des Dividendes
    </h2>
    <p class="text-gray-700 mb-6">
      La méthode DDM (modèle d'actualisation des dividendes) est particulièrement utile pour les entreprises de la BRVM qui ont l'habitude de verser des dividendes stables et croissants (banques, télécoms, agro-industrie mature).
    </p>

    

    <div class="space-y-8">
      <div>
        <h3 class="text-lg font-bold text-indigo-800 mb-4">8.2.1 Le Principe Fondamental</h3>
        <ul class="ml-6 space-y-3 text-gray-700">
          <li>• <strong>Postulat :</strong> Pour un investisseur en actions de ce type, la valeur d'une action provient uniquement des dividendes futurs qu'il recevra, actualisés à aujourd'hui.</li>
          <li>• <strong>Avantage :</strong> C'est une méthode simple, basée sur une donnée facilement observable à la BRVM (le rendement du dividende historique).</li>
        </ul>
      </div>

      <div>
        <h3 class="text-lg font-bold text-indigo-800 mb-4">8.2.2 Le Modèle de Gordon-Shapiro (DDM simplifié)</h3>
        <p class="text-gray-700 mb-4">Le modèle de Gordon-Shapiro est une version simplifiée du DDM, utilisée lorsque l'on suppose que le dividende va croître à un taux constant (<strong style="font-family:Georgia,serif;color:#312e81;">g</strong>) pour toujours.</p>
        <div class="my-6 p-5 bg-gray-100 rounded-lg">
          <div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;font-family:Georgia,serif;font-size:1.15rem;color:#312e81;font-weight:700;">
            <span>Prix de l'action</span>
            <span>=</span>
            <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;">
              <span style="border-bottom:2px solid #4338ca;padding:2px 16px 4px;">D<sub style="font-size:0.75em;">1</sub></span>
              <span style="padding:4px 16px 2px;">k − g</span>
            </span>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-center italic text-gray-600">
          <p><strong style="font-family:Georgia,serif;color:#312e81;">D<sub>1</sub></strong> : Le dividende prévu pour l'année prochaine.</p>
          <p><strong style="font-family:Georgia,serif;color:#312e81;">k</strong> : Le taux d'actualisation utilisé.</p>
          <p><strong style="font-family:Georgia,serif;color:#312e81;">g</strong> : Le taux de croissance annuel constant.</p>
        </div>
      </div>

      <div class="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
        <h3 class="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
           💡 8.2.3 Application à la BRVM : L'Intérêt pour les "Dividend Kings"
        </h3>
        <p class="text-amber-950 mb-4">Les entreprises de la BRVM qui versent des dividendes réguliers sont très appréciées des investisseurs régionaux car elles offrent un flux de revenus stable.</p>
        <ul class="space-y-3 text-amber-900 ml-6">
          <li>• <strong>Quand l'utiliser ?</strong> Lorsque l'entreprise est mature, son marché est stable, et la croissance de ses dividendes est prévisible (ex: certaines banques ou sociétés de services publics).</li>
          <li>• <strong>Attention :</strong> Si l'entreprise est en difficulté ou si elle réinvestit la majorité de ses bénéfices (croissance), cette méthode est inadaptée.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-600 pb-2">
      8.3 Étapes Clés pour la Projection (Synthèse du Module)
    </h2>
    <p class="text-gray-700 mb-6 italic">Réaliser une projection est l'art de traduire l'Analyse Fondamentale (Module 7) en une valeur monétaire.</p>

    <div class="overflow-x-auto mb-8">
      <table class="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr style="background-color: #312e81; color: #ffffff;">
            <th class="border border-gray-300 px-4 py-3 text-left">Étape</th>
            <th class="border border-gray-300 px-4 py-3 text-left">Action de l'Analyste</th>
            <th class="border border-gray-300 px-4 py-3 text-left">Risque Émotionnel à Éviter (Module 6)</th>
          </tr>
        </thead>
        <tbody class="text-gray-700">
          <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-3 font-bold bg-gray-50">1. Projection de la Croissance</td>
            <td class="border border-gray-300 px-4 py-3">Déterminer le taux de croissance futur du Chiffre d'Affaires et des marges.</td>
            <td class="border border-gray-300 px-4 py-3 text-red-600">Biais d'Excès de Confiance (surestimer la croissance).</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-3 font-bold bg-gray-50">2. Estimation du Risque</td>
            <td class="border border-gray-300 px-4 py-3">Déterminer le WACC (Coût du Capital) de l'entreprise.</td>
            <td class="border border-gray-300 px-4 py-3 text-red-600">Ignorer le risque spécifique du marché régional.</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-3 font-bold bg-gray-50">3. Calcul de la Valeur Terminale</td>
            <td class="border border-gray-300 px-4 py-3">Déterminer la valeur de l'entreprise au-delà de 10 ans.</td>
            <td class="border border-gray-300 px-4 py-3 text-red-600">Utiliser un taux de croissance g trop élevé, qui gonfle artificiellement la VT.</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-3 font-bold bg-gray-50">4. Comparaison</td>
            <td class="border border-gray-300 px-4 py-3">Comparer la Valeur Intrinsèque (obtenue par DCF/DDM) avec le Cours actuel de l'action (Bourse).</td>
            <td class="border border-gray-300 px-4 py-3 text-red-600">Ancrage (Rester bloqué sur le prix d'achat, au lieu de faire confiance au calcul).</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="p-6 bg-green-50 border-l-8 border-green-600 rounded-lg">
      <p class="text-green-900 font-bold text-lg italic">
        Conclusion de l'Expert : Si le prix en bourse est significativement inférieur à votre valeur intrinsèque calculée, vous avez trouvé une marge de sécurité pour votre investissement.
      </p>
    </div>
  </div>

  <div class="bg-gray-900 text-white p-8 rounded-xl shadow-lg">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-gray-700 pb-2">
      🧠 Les Termes à Maîtriser
    </h2>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-indigo-300 uppercase text-xs tracking-widest font-bold">
            <th class="px-4 py-3 text-left">Terme</th>
            <th class="px-4 py-3 text-left">Définition</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr>
            <td class="px-4 py-4 font-bold text-indigo-400">Actualisation</td>
            <td class="px-4 py-4 text-gray-300">Opération financière qui ramène la valeur future d'un montant à sa valeur présente.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-indigo-400">WACC (CMPC)</td>
            <td class="px-4 py-4 text-gray-300">Coût Moyen Pondéré du Capital, le taux utilisé pour actualiser les flux futurs (taux d'actualisation).</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-indigo-400">Valeur Intrinsèque</td>
            <td class="px-4 py-4 text-gray-300">La vraie valeur estimée d'une entreprise selon l'analyste.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-indigo-400">Valeur Terminale (VT)</td>
            <td class="px-4 py-4 text-gray-300">La valeur estimée de l'entreprise au-delà de la période de prévision explicite.</td>
          </tr>
          <tr>
            <td class="px-4 py-4 font-bold text-indigo-400">Marge de Sécurité</td>
            <td class="px-4 py-4 text-gray-300">La différence positive entre la valeur intrinsèque (élevée) et le prix du marché (faible).</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="bg-gray-100 p-8 rounded-xl text-center border border-gray-200">
    <h3 class="text-xl font-bold text-gray-800 mb-4">🧭 Prochaine Étape</h3>
    <p class="text-gray-600 mb-6">Vous avez le mental (M6) et les outils pour évaluer (M7 & M8). Il faut maintenant garantir la survie de votre capital face au risque.</p>
    <button class="bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-md transform hover:scale-105">
      👉 Module 9 : La Maîtrise du Risque
    </button>
  </div>

</div>
 `,
  });

 // ====================================================
  // === M9 : 🌱 Module 9 : L’Analyse Extra-Financière – Comprendre le Contexte ===
  // ====================================================
  await createOrUpdateModule({
    title: "L'Analyse Extra-Financière – Comprendre le Contexte",
    slug: 'contexte-economique',
    description: "Apprenez à évaluer ce que les chiffres ne disent pas : la qualité du management, la solidité du modèle économique et les critères ESG pour sécuriser vos investissements.",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 20,
    order_index: 9,
    is_published: true,
    content: `
<div class="space-y-8 max-w-5xl mx-auto font-sans text-gray-900">

  <div class="p-8 rounded-2xl shadow-lg" style="background-color: #1e1b4b; color: #ffffff;">
    <h2 class="text-3xl font-bold mb-6 flex items-center gap-3" style="color: #ffffff;">
      🎯 Objectif Pédagogique du Module
    </h2>
    <p class="text-lg mb-6" style="color: #e0e7ff;">
      À la fin de ce module, vous serez capable de :
    </p>
    <ul class="space-y-4 text-lg">
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Mener une analyse qualitative pour évaluer la qualité de la direction, la solidité du modèle économique et le positionnement concurrentiel d'une entreprise.
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Comprendre les enjeux du reporting ESG (Environnement, Social, Gouvernance) et l'importance de la finance durable à la BRVM.
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Intégrer l'analyse quantitative (M7 & M8) et qualitative (M9) pour prendre une décision d'investissement complète.
      </li>
    </ul>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-indigo-600 pb-2">
      9.1 Analyse Qualitative : Le Cerveau de l'Entreprise
    </h2>
    <p class="text-gray-700 mb-6 leading-relaxed">
      L'analyse qualitative consiste à répondre à la question : L'entreprise est-elle bien gérée, bien positionnée et son modèle est-il durable ? C'est l'étape où vous lisez le rapport annuel (non pas pour les chiffres, mais pour le texte !).
    </p>

    <div class="space-y-8">
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 class="text-xl font-bold text-indigo-900 mb-4">9.1.1 La Gouvernance : L'Équipe et la Direction</h3>
        <p class="text-gray-700 mb-4 italic">La qualité de la gestion est souvent le facteur décisif.</p>
        
        

        <ul class="space-y-4 text-gray-700 ml-4">
          <li>• <strong>Le Leadership :</strong> Qui dirige l'entreprise ? Quelle est leur expérience ? Leur réputation est-elle solide ?</li>
          <li>• <strong>Transparence et Responsabilité :</strong> L'entreprise communique-t-elle clairement ses stratégies ? La structure du Conseil d'Administration est-elle indépendante des actionnaires majoritaires ?</li>
          <li>• <strong>Rémunération :</strong> La rémunération des dirigeants est-elle alignée avec la performance à long terme de l'entreprise (et non seulement les bénéfices à court terme) ?</li>
        </ul>
        <div class="mt-4 p-4 bg-indigo-100 rounded-lg text-indigo-900 text-sm">
          <strong>Pourquoi c'est vital à la BRVM :</strong> Sur un marché régional moins couvert par les analystes internationaux, la confiance accordée au management est un facteur de risque (ou d'opportunité) plus important que sur des marchés développés.
        </div>
      </div>

      <div>
        <h3 class="text-xl font-bold text-indigo-800 mb-4 italic">9.1.2 Le Modèle Économique (Business Model)</h3>
        <p class="text-gray-700 mb-4">Vous devez comprendre comment l'entreprise gagne de l'argent et si cela est durable.</p>
        
        

        <ul class="space-y-4 text-gray-700 ml-6">
          <li>• <strong>L'Avantage Concurrentiel (Le Moat) :</strong> Qu'est-ce qui rend l'entreprise meilleure ou différente de ses concurrents ? Est-ce un brevet ? Des coûts plus bas ? Un réseau de distribution monopolistique (comme certaines entreprises de services publics) ?</li>
          <li>• <strong>La Résilience :</strong> Le modèle économique peut-il survivre à un choc majeur (crise, pandémie, nouvelle réglementation) ?</li>
          <li>• <strong>Diversification des Revenus :</strong> L'entreprise dépend-elle d'un seul produit ou d'un seul marché ? (La BRVM concerne 8 pays, l'expansion régionale est un signe de solidité).</li>
        </ul>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="p-5 border border-gray-100 bg-gray-50 rounded-lg">
          <h3 class="font-bold text-indigo-800 mb-2">9.1.3 L'Analyse du Secteur et de la Concurrence</h3>
          <ul class="text-sm space-y-2 text-gray-700">
            <li><strong>Positionnement :</strong> L'entreprise est-elle leader, challenger ou suiveur ? Le leader (par exemple, Sonatel au Sénégal) a souvent un pouvoir de fixation des prix supérieur.</li>
            <li><strong>Barrières à l'Entrée :</strong> Est-il facile pour un nouvel acteur (concurrent) d'entrer sur le marché ? Les coûts d'installation d'une banque ou d'une cimenterie sont de fortes barrières.</li>
          </ul>
        </div>

        <div class="p-5 border border-red-200 bg-red-50 rounded-lg">
          <h3 class="font-bold text-red-800 mb-2">9.1.4 Les « Red Flags » : Les Signaux d'Alerte</h3>
          <p class="text-xs text-red-700 mb-3 italic">Voici les drapeaux rouges qui doivent vous faire fuir :</p>
          <ul class="text-xs space-y-2 text-gray-800">
            <li>🚩 <strong>L'Instabilité de la Direction :</strong> Démission soudaine sans raison claire.</li>
            <li>🚩 <strong>Les Réserves des Commissaires aux Comptes :</strong> Si les auditeurs refusent de certifier les comptes.</li>
            <li>🚩 <strong>Les Transactions entre Parties Liées :</strong> Conflits d'intérêts avec les sociétés du PDG.</li>
            <li>🚩 <strong>La Complexité Inutile :</strong> Structures de holding opaques. Adage de Buffett : "N'investissez jamais dans un business que vous ne comprenez pas."</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="my-8 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-400">
    <div class="p-8" style="background-color: #fffbeb; color: #92400e;">
      <h2 class="text-2xl font-bold mb-4 flex items-center gap-2" style="color: #78350f;">
        💡 Le Lien avec la Valorisation (Le Risk Premium)
      </h2>
      <p class="mb-6 leading-relaxed">
        Pourquoi s'embêter avec cette analyse qualitative ? Parce qu'elle modifie directement le prix que vous devez payer (votre calcul du Module 8).
      </p>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white p-4 rounded-xl border border-amber-200">
          <p class="font-bold text-green-700 mb-1">Gouvernance Solide = Risque Faible</p>
          <p class="text-sm">Vous pouvez utiliser un taux d'actualisation (<strong style="font-family:Georgia,serif;color:#312e81;">k</strong>) plus bas. L'entreprise vaut donc plus cher.</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-amber-200">
          <p class="font-bold text-red-700 mb-1">Gouvernance Douteuse = Risque Élevé</p>
          <p class="text-sm">Vous devez exiger une "prime de risque" supplémentaire. Vous augmentez votre taux d'actualisation (par exemple de 12 % à 15 %), ce qui fait mécaniquement baisser la valeur intrinsèque de l'action.</p>
        </div>
      </div>
      <p class="mt-6 text-center font-bold italic text-amber-900 border-t border-amber-200 pt-4">
        En résumé : Une mauvaise gouvernance est une taxe invisible qui détruit la valeur de l'actionnaire.
      </p>
    </div>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-emerald-600 pb-2">
      9.2 Focus UEMOA : Le Reporting ESG et la Finance Durable
    </h2>
    <p class="text-gray-700 mb-8">L'investissement ne se résume plus au seul profit. Les critères ESG sont désormais essentiels pour les investisseurs institutionnels et deviennent incontournables à la BRVM.</p>

    <div class="grid md:grid-cols-2 gap-8">
      <div>
        <h3 class="text-lg font-bold text-emerald-800 mb-4 italic text-center">9.2.1 Comprendre les Critères ESG</h3>
        
        

        <div class="space-y-4 mt-4">
          <div class="flex items-start gap-3">
            <span class="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded">E</span>
            <p class="text-sm text-gray-700"><strong>Environnement :</strong> Gestion des déchets, émissions de carbone, consommation d'eau. Exemple : Une cimenterie a-t-elle des plans pour réduire son empreinte carbone ?</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">S</span>
            <p class="text-sm text-gray-700"><strong>Social :</strong> Santé et sécurité, respect des normes du travail, impact communautaire (RSE). Exemple : Comment la SGI traite-t-elle ses employés ?</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded">G</span>
            <p class="text-sm text-gray-700"><strong>Gouvernance :</strong> Transparence, lutte contre la corruption, indépendance du conseil (déjà couvert en 9.1.1).</p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-bold text-emerald-800 mb-4 italic text-center">9.2.2 Le Rôle du Reporting et de l'AMF-UMOA</h3>
        <ul class="space-y-4 text-sm text-gray-700">
          <li class="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <strong>Reporting RSE :</strong> De plus en plus d'entreprises cotées à la BRVM publient des rapports de Responsabilité Sociale et Environnementale.
          </li>
          <li class="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <strong>La Finance Durable :</strong> Le marché de l'UEMOA s'oriente vers des obligations vertes (Green Bonds) et des fonds ESG. Investir dans des entreprises bien notées réduit le risque à long terme.
          </li>
        </ul>
        <div class="mt-4 p-4 bg-emerald-900 text-white rounded-lg text-center text-xs">
          <strong>Avantage Investisseur :</strong> Une entreprise avec un score ESG élevé est souvent synonyme de meilleure gestion des risques.
        </div>
      </div>
    </div>
  </div>

  <div class="bg-slate-100 p-8 rounded-xl text-center border border-slate-200 shadow-inner">
    <h3 class="text-xl font-bold text-slate-800 mb-4">🧭 Prochaine Étape</h3>
    <p class="text-slate-600 mb-6">Nous avons maintenant couvert l'analyse complète (chiffres, projections, contexte). Il est temps d'assurer le bon timing grâce à l'analyse technique.</p>
    <button class="bg-indigo-900 hover:bg-indigo-950 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-md transform hover:scale-105">
      👉 Module 10 : Analyse Technique
    </button>
  </div>

</div>
`,
  });

  // ====================================================
  // === M10 : L’Art du Timing – Analyse Technique et Lecture du Marché ===
  // ====================================================
  await createOrUpdateModule({
    title: "L’Art du Timing – Analyse Technique et Lecture du Marché",
    slug: 'passage-a-l-action',
    description: "Maîtrisez l'art du timing boursier grâce à l'analyse technique : décryptez les graphiques et les tendances pour savoir exactement quand acheter ou vendre",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 20,
    order_index: 10,
    is_published: true,
    content: `
<div class="module-content">

  <div class="bg-blue-600 text-white">
    <h2 class="text-white flex items-center gap-3 mt-0">
      🎯 Objectif Pédagogique du Module
    </h2>
    <p class="text-white text-lg">
      À la fin de ce module, vous serez capable de :
    </p>
    <div class="space-y-4 text-lg">
      <div class="flex items-start gap-3">
        <span class="mt-1 shrink-0">👉</span>
        <span>Comprendre la philosophie de l'Analyse Technique (AT) et son rôle complémentaire à l'Analyse Fondamentale.</span>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-1 shrink-0">👉</span>
        <span>Décoder les graphiques de prix (chandeliers, tendances, support/résistance).</span>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-1 shrink-0">👉</span>
        <span>Utiliser les indicateurs techniques clés (Moyennes Mobiles, RSI, MACD, Bandes de Bollinger) pour identifier les points d'entrée et de sortie.</span>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-1 shrink-0">👉</span>
        <span>Élaborer une stratégie de timing prudente et adaptée au contexte de la BRVM.</span>
      </div>
    </div>
  </div>

  <h2>10.1 Philosophie et Théorie de Dow</h2>
  <p>
    L'Analyse Technique (AT) est l'étude des mouvements de prix historiques d'un titre, généralement représentés par des graphiques. Elle repose sur des postulats clés formalisés par la Théorie de Dow, le père de l'analyse technique.
  </p>

  <div class="bg-slate-50">
    <h3>10.1.1 Les Postulats Fondamentaux de l'AT</h3>
    <ul>
      <li><strong>Le marché actualise tout :</strong> Le prix actuel de l'action reflète déjà toutes les informations fondamentales, économiques et psychologiques connues (bénéfices, crises, rumeurs).</li>
      <li><strong>Les prix évoluent en tendances :</strong> Les mouvements de prix ne sont pas aléatoires ; ils suivent des directions identifiables (tendance haussière, baissière, neutre).</li>
      <li><strong>L'histoire se répète :</strong> Les schémas de comportement humain (peur, avidité, Module 6) se répètent, menant à la récurrence de certaines configurations graphiques.</li>
    </ul>
  </div>
  
  <div class="bg-blue-50">
    <p class="mb-0">
      <strong>Rôle l'Investisseur Débutant :</strong> Alors que l'Analyse Fondamentale (M7/M9) vous dit quoi acheter (la valeur), l'Analyse Technique vous aide à déterminer quand acheter ou vendre (le timing).
    </p>
  </div>

  <h2>10.2 Chartisme et Lecture de Graphiques</h2>

  <h3>10.2.1 Un Graphique, une Histoire : Les Chandeliers Japonais</h3>
  <p>
    Le graphique en chandeliers est le plus utilisé. Chaque chandelier représente une période de temps (jour, semaine, etc.) et raconte l'histoire de la confrontation entre acheteurs et vendeurs.
  </p>

  

  <div class="grid md:grid-cols-2 gap-4">
    <div class="bg-green-50">
      <p class="font-bold text-green-700 mb-1">Le Corps Vert/Blanc :</p>
      <p class="text-sm mb-0">Prix a augmenté (Clôture > Ouverture) – Domination des Acheteurs.</p>
    </div>
    <div class="bg-red-50">
      <p class="font-bold text-red-700 mb-1">Le Corps Rouge/Noir :</p>
      <p class="text-sm mb-0">Prix a diminué (Clôture < Ouverture) – Domination des Vendeurs.</p>
    </div>
  </div>
  
  <blockquote>
    <strong>Les Mèches (ou Ombres) :</strong> Indiquent les prix les plus hauts et les plus bas atteints pendant la période.
  </blockquote>

  <h3>10.2.2 Identifier les Tendances (Le Concept Clé)</h3>
  <p>Le concept le plus important est la tendance, la direction générale des prix.</p>

  

  <div class="grid md:grid-cols-3 gap-4">
    <div class="bg-slate-50">
      <strong class="text-blue-700 block mb-2">Tendance Haussière (Bullish) :</strong> 
      <p class="text-sm mb-0">Succession de sommets et de creux de plus en plus hauts.</p>
    </div>
    <div class="bg-slate-50">
      <strong class="text-red-700 block mb-2">Tendance Baissière (Bearish) :</strong> 
      <p class="text-sm mb-0">Succession de sommets et de creux de plus en plus bas.</p>
    </div>
    <div class="bg-slate-50">
      <strong class="text-gray-700 block mb-2">Tendance Neutre (Latérale) :</strong> 
      <p class="text-sm mb-0">Prix se déplaçant horizontalement dans une fourchette limitée.</p>
    </div>
  </div>

  <h3>10.2.3 Support et Résistance (Niveaux Psychologiques)</h3>
  <p>Ce sont des niveaux de prix importants qui agissent comme des barrières.</p>

  

  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-blue-50">
      <h4 class="mt-0 text-blue-800">Support (Le Plancher)</h4>
      <p class="text-sm mb-0">Niveau où l'intérêt d'achat est suffisamment fort pour empêcher le prix de baisser davantage.</p>
    </div>
    <div class="bg-slate-50">
      <h4 class="mt-0 text-gray-800">Résistance (Le Plafond)</h4>
      <p class="text-sm mb-0">Niveau où la pression de vente est forte, empêchant le prix de monter.</p>
    </div>
  </div>

  <div class="bg-amber-50">
    <h4 class="mt-0 text-yellow-800">💡 L'Analogie à Retenir : Le Prix du Sac de Riz au Marché</h4>
    <p class="text-sm mb-0">Le prix du sac de riz peut fluctuer, mais il y a toujours un prix minimal (le Support) en dessous duquel les producteurs refusent de vendre, et un prix maximal (la Résistance) au-delà duquel les clients refusent d'acheter.</p>
  </div>

  <h2>10.3 Indicateurs Clés : Lisser, Mesurer la Force et le Momentum</h2>
  <p>Les indicateurs sont des formules mathématiques appliquées aux prix pour donner des signaux plus clairs.</p>

  <h3>10.3.1 Moyennes Mobiles (MM) : Lisser la Tendance</h3>
  <p>Les Moyennes Mobiles (MM) sont des lignes qui représentent le prix moyen sur une période donnée (ex: MM 50 jours, MM 200 jours).</p>

  

  <ul>
    <li><strong>Rôle :</strong> Lisser les fluctuations quotidiennes et identifier la tendance sous-jacente.</li>
    <li><strong>Règles Simples :</strong> Si le prix de l'action est au-dessus de sa MM 200 jours, c'est un signal de force à long terme. Le croisement de deux MM (ex: MM 50 qui croise la MM 200 par le bas) donne des signaux d'achat (Golden Cross).</li>
  </ul>

  <h3>10.3.2 RSI (Relative Strength Index) : Mesurer la Force</h3>
  <p>Indicateur de momentum qui mesure la vitesse et le changement des mouvements de prix. Il indique si l'actif est suracheté ou survendu.</p>

  

  <div class="grid md:grid-cols-2 gap-4">
    <div class="bg-red-50">
      <strong class="text-red-700 block mb-2">RSI > 70 :</strong> 
      <p class="text-sm mb-0">Le titre est suracheté (trop d'acheteurs) et une correction (baisse) pourrait être imminente.</p>
    </div>
    <div class="bg-green-50">
      <strong class="text-green-700 block mb-2">RSI < 30 :</strong> 
      <p class="text-sm mb-0">Le titre est survendu (trop de vendeurs) et un rebond pourrait être proche.</p>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-6 mt-6">
    <div class="bg-slate-50">
      <h4 class="mt-0">10.3.3 MACD : Mesurer l'Impulsion</h4>
      <p class="text-sm">Indicateur de tendance qui montre la relation entre deux moyennes mobiles du prix d'un titre.</p>
      <p class="text-sm text-blue-600 font-medium mb-0">Signal : Les croisements entre la ligne MACD et sa ligne de signal sont des points d'achat ou de vente potentiels.</p>
    </div>
    <div class="bg-slate-50">
      <h4 class="mt-0">10.3.4 Bandes de Bollinger : Mesurer la Volatilité</h4>
      <p class="text-sm">Lignes tracées au-dessus et en dessous d'une moyenne mobile. Elles mesurent la volatilité du prix.</p>
      <p class="text-sm text-blue-600 font-medium mb-0">Interprétation : Lorsque les bandes se resserrent, cela signale une faible volatilité et l'anticipation d'un mouvement important.</p>
    </div>
  </div>

  <div class="bg-blue-600 text-white mt-8">
    <h3 class="text-white mt-0">📊 10.3.5 Les Volumes : Le Détecteur de Mensonges</h3>
    <p class="text-white">Les barres verticales en bas du graphique qui montrent combien d'actions ont été échangées.</p>

    <div class="space-y-4 text-white mt-4">
      <p class="mb-0">👉 <strong>Règle d'Or :</strong> Le volume doit confirmer la tendance.</p>
      <p class="mb-0">👉 <strong>Interprétation :</strong> Si le prix casse une Résistance avec de gros volumes, c'est un signal validé. Si le prix monte avec de faibles volumes, méfiance : c'est peut-être un piège haussier sans conviction.</p>
    </div>
  </div>

  <h2>10.4 Comprendre et Utiliser la Volatilité</h2>
  <p>La volatilité est l'intensité et la fréquence des variations de prix (déjà abordé en M5). En Analyse Technique, la volatilité est une opportunité.</p>
  
  <div class="grid md:grid-cols-2 gap-4">
    <div class="bg-slate-50">
      <strong class="block text-lg mb-2">Forte Volatilité :</strong> 
      <p class="text-sm mb-0">Risque élevé, mais potentiel de gain rapide. Le timing est crucial.</p>
    </div>
    <div class="bg-slate-50">
      <strong class="block text-lg mb-2">Faible Volatilité :</strong> 
      <p class="text-sm mb-0">Risque faible, mais faible potentiel de gain rapide. Idéal pour l'accumulation par l'investisseur à long terme.</p>
    </div>
  </div>
  
  <div class="bg-blue-50">
    <p class="mb-0">
      <strong>Stratégie BRVM :</strong> Sur un marché comme la BRVM, où la liquidité peut être intermittente, la volatilité des prix peut parfois être exagérée. L'investisseur fondamentaliste utilise ces pics de volatilité (baisse) pour acheter à bas prix.
    </p>
  </div>

  <h2>10.5 Synthèse Technique et Confirmation Multi-Signaux</h2>
  <p class="italic">Ne jamais prendre une décision sur un seul indicateur. La puissance de l'AT réside dans la confirmation de plusieurs signaux.</p>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Signal 1 (Tendance)</th>
          <th>Signal 2 (Momentum)</th>
          <th>Signal 3 (Volatilité)</th>
          <th>Décision (Confirmation)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Le prix touche un Support.</td>
          <td>Le RSI sort de la zone de survendue (remonte au-dessus de 30).</td>
          <td>Les Bandes de Bollinger se resserrent puis s'écartent.</td>
          <td class="font-bold text-green-600">SIGNAL D'ACHAT FORT</td>
        </tr>
        <tr>
          <td>Le prix atteint une Résistance.</td>
          <td>Le RSI entre en zone de surachat (dépasse 70).</td>
          <td>Le prix est loin de sa MM 200 jours.</td>
          <td class="font-bold text-red-600">SIGNAL DE VENTE/PRISE DE PROFIT</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>10.6 Lecture en Temps Réel des Graphiques BRVM</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-slate-50">
      <h4 class="mt-0">Privilégier les Grandes Périodes</h4>
      <p class="text-sm mb-0">Utilisez des graphiques hebdomadaires ou mensuels (vs quotidiens) pour identifier la tendance de fond. Le trading intra-journalier est risqué sur le marché UEMOA.</p>
    </div>
    <div class="bg-slate-50">
      <h4 class="mt-0">Liquidity Filter</h4>
      <p class="text-sm mb-0">Focalisez-vous sur les titres les plus liquides (Sonatel, Ecobank, SGB-CI) où l'AT est plus fiable. Les titres peu liquides ont des graphiques erratiques.</p>
    </div>
  </div>

  <div class="bg-slate-50">
    <h2 class="mt-0 flex items-center gap-2">🧠 Les Termes à Maîtriser</h2>
    <div class="table-wrapper">
      <table class="border">
        <thead>
          <tr>
            <th>Terme</th>
            <th>Définition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-bold">Chandelier Japonais</td>
            <td>Représentation graphique des mouvements de prix (ouverture, clôture, haut, bas) sur une période.</td>
          </tr>
          <tr>
            <td class="font-bold">Support / Résistance</td>
            <td>Niveaux de prix psychologiques qui agissent comme plancher et plafond.</td>
          </tr>
          <tr>
            <td class="font-bold">Moyenne Mobile (MM)</td>
            <td>Ligne traçant le prix moyen lissé sur une période (ex: 50 ou 200 jours).</td>
          </tr>
          <tr>
            <td class="font-bold">RSI</td>
            <td>Relative Strength Index, indicateur de momentum qui mesure si un titre est suracheté ou survendu.</td>
          </tr>
          <tr>
            <td class="font-bold">Tendance</td>
            <td>La direction générale des mouvements de prix sur une période.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="bg-blue-50 text-center">
    <h3 class="mt-0">🧭 Prochaine Étape</h3>
    <p>Vous avez le mental, l'analyse fondamentale et l'outil de timing. La dernière pièce du puzzle est la gestion du risque structurel.</p>
    <a href="#" class="font-bold text-blue-600 hover:text-blue-800 transition-colors">
      👉 Passer au Module 11 : La Maîtrise du Risque
    </a>
  </div>

</div>
`,
  });


  // ====================================================
  // === M11 : Maîtrise du Risque et Gestion de Portefeuille===
  // ====================================================
  await createOrUpdateModule({
    title: "Maîtrise du Risque et Gestion de Portefeuille",
    slug: 'Maîtrise-du-Risque',
    description: "Sécurisez votre capital sur le long terme en maîtrisant les règles d'or de la diversification, de l'allocation d'actifs et des techniques de protection contre les chocs de marché.",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 11,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-5xl mx-auto font-sans text-gray-900">

  <div class="p-8 rounded-2xl shadow-lg" style="background-color: #1e3a8a; color: #ffffff;">
    <h2 class="text-3xl font-bold mb-6 flex items-center gap-3" style="color: #ffffff;">
      🎯 Objectif Pédagogique du Module
    </h2>
    <p class="text-lg mb-6" style="color: #dbeafe;">
      À la fin de ce module, vous serez capable de :
    </p>
    <ul class="space-y-4 text-lg">
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Comprendre et appliquer le principe de la diversification pour réduire le risque non systématique de votre portefeuille.
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Structurer un portefeuille cohérent en fonction de votre profil d'investisseur (M5) et des grandes stratégies (M6).
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-white/20 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Mettre en place des techniques de gestion du risque pour protéger votre capital contre les chocs de marché.
      </li>
    </ul>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-blue-600 pb-2">
      11.1 Les Grandes Stratégies : Allocation d'Actifs et Cohérence
    </h2>
    <p class="text-gray-700 mb-6">Cette section réaffirme le lien entre l'analyse qualitative/quantitative et la construction de portefeuille.</p>

    <div class="mb-8">
      <h3 class="text-xl font-bold text-blue-900 mb-4">11.1.1 Réviser les Grandes Approches (M6)</h3>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div class="p-4 bg-gray-50 rounded border border-gray-200">
          <strong class="text-blue-800 block mb-2">Value Investing (Valeur)</strong>
          Acheter des titres sous-évalués (V > P). Ce portefeuille nécessite patience et une bonne analyse fondamentale (M7).
        </div>
        <div class="p-4 bg-gray-50 rounded border border-gray-200">
          <strong class="text-blue-800 block mb-2">Growth Investing (Croissance)</strong>
          Acheter des entreprises en forte croissance. Ce portefeuille est plus volatil et nécessite d'accepter un PER plus élevé.
        </div>
        <div class="p-4 bg-gray-50 rounded border border-gray-200">
          <strong class="text-blue-800 block mb-2">Dividendes (Revenus)</strong>
          Choisir des entreprises matures (BRVM) qui offrent un flux de trésorerie régulier.
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-xl font-bold text-blue-900 mb-4">11.1.2 L'Allocation d'Actifs (Rappel M5)</h3>
      <p class="text-gray-700 mb-4">Votre portefeuille doit refléter votre profil d'investisseur (M5). La première décision stratégique est l'allocation entre les grandes classes d'actifs :</p>
      
      <div class="overflow-x-auto mb-4">
        <table class="min-w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr style="background-color: #1e3a8a; color: #ffffff;">
              <th class="border border-gray-300 px-4 py-3 text-left">Profil d'Investisseur</th>
              <th class="border border-gray-300 px-4 py-3 text-left">Objectif</th>
              <th class="border border-gray-300 px-4 py-3 text-left">Allocation Actions / Obligations (Ex.)</th>
              <th class="border border-gray-300 px-4 py-3 text-left">Rôle du Portefeuille</th>
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-3 font-bold">Prudent</td>
              <td class="border border-gray-300 px-4 py-3">Sécurité</td>
              <td class="border border-gray-300 px-4 py-3">20% Actions / 80% Obligations</td>
              <td class="border border-gray-300 px-4 py-3">Protection du capital</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-3 font-bold">Équilibré</td>
              <td class="border border-gray-300 px-4 py-3">Croissance Modérée</td>
              <td class="border border-gray-300 px-4 py-3">50% Actions / 50% Obligations</td>
              <td class="border border-gray-300 px-4 py-3">Équilibre entre sécurité et performance</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-3 font-bold">Dynamique</td>
              <td class="border border-gray-300 px-4 py-3">Maximisation</td>
              <td class="border border-gray-300 px-4 py-3">80% Actions / 20% Obligations</td>
              <td class="border border-gray-300 px-4 py-3">Recherche de la croissance maximale</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-900 text-sm">
        <strong>Conseil BRVM :</strong> Les obligations (publiques ou d'entreprise) cotées à la BRVM sont un excellent outil de diversification pour la partie "sécurité" du portefeuille.
      </div>
    </div>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-blue-600 pb-2">
      11.2 Gestion du Risque : Le Rempart du Portefeuille
    </h2>
    <p class="text-gray-700 mb-6 italic">Le but de la gestion du risque n'est pas d'éviter toute perte, mais de s'assurer qu'aucune perte ne puisse mettre en péril l'intégralité de votre capital.</p>

    <div class="mb-8 space-y-6">
      <h3 class="text-xl font-bold text-blue-900">11.2.1 La Diversification : La Seule Règle d'Or</h3>
      <p class="text-gray-700">La diversification est l'art de ne pas mettre tous ses œufs dans le même panier.</p>

      <div class="bg-gray-50 p-5 rounded-lg border border-gray-200">
        <h4 class="font-bold text-blue-800 mb-3">A. Risque Systématique vs. Non Systématique</h4>
        <ul class="space-y-2 text-sm text-gray-700">
          <li>• <strong>Risque Systématique (Risque de Marché) :</strong> Le risque qui affecte toutes les actions (ex: une crise régionale, une hausse des taux BCEAO). Ce risque ne peut pas être éliminé par la diversification.</li>
          <li>• <strong>Risque Non Systématique (Risque Spécifique) :</strong> Le risque propre à une seule entreprise (ex: une mauvaise gestion chez une banque, une grève chez un agro-industriel). Ce risque peut être éliminé par la diversification.</li>
        </ul>
        <p class="mt-3 font-bold text-gray-800 text-sm">Conclusion : En investissant dans suffisamment d'entreprises (souvent 10 à 15 titres), vous éliminez la quasi-totalité du risque non systématique, vous laissant seulement face au risque de marché.</p>
      </div>

      <div>
        <h4 class="font-bold text-blue-800 mb-3">B. Les Piliers de la Diversification</h4>
        <div class="grid md:grid-cols-3 gap-4 text-sm mb-4">
          <div class="p-3 bg-blue-50 rounded"><strong>Par Actifs :</strong> Actions, Obligations, OPCVM.</div>
          <div class="p-3 bg-blue-50 rounded"><strong>Par Secteurs :</strong> Ne pas investir 80 % de votre capital dans les banques, même si vous les analysez bien.</div>
          <div class="p-3 bg-blue-50 rounded"><strong>Par Géographie :</strong> Le marché BRVM offre déjà une diversification intrinsèque puisqu'il couvre 8 pays.</div>
        </div>
        
        <div class="p-4 bg-gray-100 rounded-lg text-sm space-y-2">
          <p><strong>Note pour l'investisseur :</strong> Si l'ajout d'actions sur des marchés plus stables (Europe, USA) est une stratégie de protection puissante, elle constitue une étape avancée en raison des contraintes de change et des formalités administratives.</p>
          <p><strong>Alternative locale :</strong> Pour diversifier géographiquement sans ces complexités, vous pouvez vous tourner vers des OPCVM locaux (FCP ou SICAV). Certains fonds de la place investissent une partie de leurs actifs sur les marchés internationaux, vous offrant ainsi une exposition globale tout en restant dans le cadre réglementaire régional.</p>
        </div>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-xl font-bold text-blue-900 mb-4">11.2.2 Les Techniques de Protection du Capital</h3>
      <p class="text-gray-700 mb-6">Même avec un bon portefeuille, vous devez vous protéger contre l'émotion et les événements imprévus.</p>

      <div class="space-y-6">
        <div class="p-5 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
          <h4 class="font-bold text-green-900">1. L'Investissement Échelonné (Dollar-Cost Averaging - DCA)</h4>
          <p class="text-sm text-green-800 mt-2"><strong>Principe :</strong> Au lieu d'investir 100% de votre capital en une seule fois (tentative de "Timer" le marché, M6), vous investissez le même montant régulièrement (ex: 50 000 FCFA par mois).</p>
          <p class="text-sm text-green-800 mt-1"><strong>Avantage :</strong> Vous achetez à la fois cher et bon marché, lissant votre prix d'achat et éliminant le risque de timing. C'est l'approche la plus disciplinée pour le débutant.</p>
        </div>

        <div class="p-5 bg-gray-100 rounded-lg border border-gray-300">
          <h4 class="font-bold text-gray-800 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            2. Le Cash est une Arme
          </h4>
          <p class="text-sm text-gray-700 mt-2">Le Cash est aussi une position ! N'ayez pas peur de garder une partie de votre portefeuille (5 à 10 %) en liquidités (Cash ou Compte Épargne). Ce "trésor de guerre" a deux fonctions :</p>
          <ul class="list-disc list-inside text-sm text-gray-700 mt-2 ml-4">
            <li><strong>Assurance :</strong> En cas de besoin urgent d'argent, vous ne touchez pas à vos actions.</li>
            <li><strong>Munitions :</strong> Si le marché chute brutalement (soldes), vous avez de l'argent disponible immédiatement pour renforcer vos meilleures actions à bas prix.</li>
          </ul>
        </div>

        <div class="p-5 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
          <h4 class="font-bold text-red-900">3. Les Ordres Stop-Loss</h4>
          <p class="text-sm text-red-800 mt-2"><strong>Principe :</strong> Ordre donné à votre SGI de vendre automatiquement un titre si son prix atteint un seuil de perte prédéfini (ex: 10% de perte).</p>
          <p class="text-sm text-red-800 mt-1"><strong>Rôle :</strong> Protéger votre portefeuille contre des chutes brutales. Il transforme la décision émotionnelle en une règle mécanique.</p>
          
          <div class="mt-4 p-3 bg-white/60 rounded border border-red-200 text-xs text-red-900 font-bold">
            ⚠️ Attention Spéciale BRVM : La Liquidité. L'ordre Stop-Loss est une excellente protection, mais il a une limite : la liquidité. Sur des petites valeurs où il y a peu d'échanges quotidiens, il est possible que votre ordre ne trouve pas d'acheteur au prix souhaité. Conseil : Utilisez les Stop-Loss en priorité sur les "Blue Chips" (les plus grandes entreprises du marché) et surveillez manuellement vos petites lignes.
          </div>
        </div>

        <div class="p-5 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg">
          <h4 class="font-bold text-amber-900">4. Le Take Profit (Prise de Profit) : Savoir Sortir Gagnant</h4>
          <p class="text-sm text-amber-800 mt-2">Le Take Profit est un ordre automatique (ou une règle disciplinée) qui consiste à vendre un titre une fois qu'il a atteint un objectif de gain prédéfini.</p>
          <ul class="text-sm text-amber-800 mt-2 space-y-1">
            <li>• <strong>Le Principe :</strong> Vous fixez un prix cible supérieur à votre prix d'achat. Si l'action atteint ce prix, vous vendez pour encaisser vos plus-values.</li>
            <li>• <strong>Le Rôle Psychologique :</strong> Il est le meilleur antidote contre l'avidité (Module 6).</li>
            <li>• <strong>Comment fixer son Take Profit ?</strong> Via l'Analyse Fondamentale (Valeur Intrinsèque M8) ou l'Analyse Technique (Résistance M10).</li>
          </ul>
          
          <div class="mt-4 p-3 bg-white/60 rounded border border-amber-200">
            <p class="text-sm font-bold text-amber-900 underline mb-1">La Nuance Stratégique : Le Ratio Risque/Rendement</p>
            <p class="text-xs text-amber-900">Pour qu'un investissement soit mathématiquement "sain", votre Take Profit doit toujours être plus éloigné de votre prix d'achat que votre Stop-Loss.</p>
            <p class="text-xs text-amber-900 mt-1 italic">Exemple : Prix d'achat : 10 000 FCFA. Stop-Loss : 9 500 FCFA (Risque : 500 FCFA). Take Profit : 11 500 FCFA (Espérance de gain : 1 500 FCFA). Ratio : 1 pour 3.</p>
          </div>

          <div class="mt-4 p-4 bg-amber-100 border border-amber-300 rounded text-amber-900 text-xs font-bold flex items-start gap-2">
            <span class="text-lg">⚠️</span>
            <p>Rappel Liquidité BRVM : Tout comme pour le Stop-Loss, le Take Profit peut être difficile à exécuter d'un coup sur des titres peu liquides si vous vendez une grosse quantité d'actions. Soyez patient et fractionnez vos ventes si nécessaire.</p>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-xl font-bold text-blue-900 mb-4">11.2.3 Le Rééquilibrage du Portefeuille (Rebalancing)</h3>
      <p class="text-gray-700 mb-4">Avec le temps, vos actions les plus performantes vont occuper une part de plus en plus grande de votre portefeuille, déséquilibrant l'allocation initiale.</p>
      <ul class="space-y-3 text-sm text-gray-700">
        <li class="p-3 bg-gray-50 rounded"><strong>Exemple :</strong> Si vous étiez à 50% Actions / 50% Obligations, et que les actions prennent 30%, vous êtes maintenant à 65% Actions / 35% Obligations.</li>
        <li class="p-3 bg-gray-50 rounded"><strong>Action :</strong> Le rééquilibrage consiste à vendre une partie des actifs qui ont trop monté (les actions) pour racheter des actifs qui sont en retard (les obligations), ramenant le portefeuille à sa proportion cible (50/50).</li>
        <li class="p-3 bg-gray-50 rounded"><strong>Avantage :</strong> Cela force l'investisseur à vendre cher et acheter bon marché d'une manière mécanique et disciplinée (anticorps contre l'avidité, M6).</li>
      </ul>
    </div>
  </div>

  <div class="bg-gray-100 p-8 rounded-xl text-center border border-gray-200">
    <h3 class="text-xl font-bold text-gray-800 mb-4">🧭 Prochaine Étape</h3>
    <p class="text-gray-600 mb-6">Félicitations, vous maîtrisez désormais les bases essentielles de la protection de votre capital. Passez maintenant au niveau supérieur avec le Module 12.</p>
    <button class="bg-blue-800 hover:bg-blue-900 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-md transform hover:scale-105">
      👉 Module 12 : Stratégies Avancées
    </button>
  </div>

</div>
`,
  });


  // ====================================================
  // === M12 : L’Art de l’Architecte – Gestion Avancée du Risque===
  // ====================================================
  await createOrUpdateModule({
    title: "L'Art de l'Architecte – Gestion Avancée du Risque",
    slug: 'Architecte-du-Risque',
    description: "Devenez l'architecte de votre succès financier en maîtrisant les techniques avancées d'allocation, de diversification sectorielle et de dimensionnement de vos positions.",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 12,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-5xl mx-auto font-sans text-gray-900">

  <div class="p-8 rounded-2xl shadow-lg" style="background-color: #334155; color: #ffffff;">
    <h2 class="text-3xl font-bold mb-6 flex items-center gap-3" style="color: #ffffff;">
      👷 Module 12 : L’Art de l’Architecte – Gestion Avancée du Risque
    </h2>
    <div class="mb-6 border-b border-slate-500"></div>
    <p class="text-lg mb-6" style="color: #cbd5e1;">
      À la fin de ce module, vous serez capable de :
    </p>
    <ul class="space-y-4 text-lg">
      <li class="flex items-start gap-3">
        <span class="bg-teal-500 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Différencier l'allocation d'actifs stratégique et tactique et comprendre comment ajuster votre portefeuille aux conditions du marché BRVM.
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-teal-500 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Mettre en œuvre des techniques de diversification avancées spécifiques au marché UEMOA (sectorielle et régionale).
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-teal-500 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Appliquer le position sizing pour gérer l'exposition au risque de chaque ligne de votre portefeuille.
      </li>
      <li class="flex items-start gap-3">
        <span class="bg-teal-500 rounded-full p-1 mt-1 shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        Comprendre les principes du hedging (couverture) comme outil de protection.
      </li>
    </ul>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <h2 class="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-teal-600 pb-2">
      12.1 Allocation d’Actifs Stratégique et Tactique
    </h2>
    <p class="text-gray-700 mb-6">
      L'allocation d'actifs est la répartition de votre capital entre les grandes classes d'actifs (Actions, Obligations, Liquidités). Il existe deux manières de l'aborder :
    </p>

    

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-slate-50 p-5 rounded-lg border-l-4 border-slate-500">
        <h3 class="text-xl font-bold text-slate-800 mb-3">12.1.1 L'Allocation Stratégique (Le Plan de Route)</h3>
        <ul class="space-y-3 text-sm text-gray-700">
          <li>• <strong>Principe :</strong> C'est la répartition de base, définie par votre profil d'investisseur (M5) et votre horizon. C'est l'objectif de long terme que vous maintenez par le rééquilibrage (rebalancing, M11).</li>
          <li>• <strong>Rôle :</strong> Elle est passive et a pour but d'atteindre vos objectifs en minimisant la volatilité à long terme.</li>
        </ul>
      </div>

      <div class="bg-teal-50 p-5 rounded-lg border-l-4 border-teal-500">
        <h3 class="text-xl font-bold text-teal-900 mb-3">12.1.2 L'Allocation Tactique (L'Ajustement FIn)</h3>
        <ul class="space-y-3 text-sm text-gray-700">
          <li>• <strong>Principe :</strong> C'est un ajustement temporaire de l'allocation stratégique pour tirer parti des conditions de marché à court/moyen terme.</li>
          <li>
            • <strong>Exemple BRVM :</strong>
            <ul class="ml-4 mt-2 list-disc space-y-1">
              <li>Si vous anticipez une hausse des taux d'intérêt BCEAO (M2), vous pouvez réduire temporairement votre exposition aux obligations (qui baissent en valeur quand les taux montent) et augmenter les liquidités.</li>
              <li>Si une crise de l'or noir affecte la Côte d'Ivoire, vous pourriez réduire légèrement l'exposition aux actions ivoiriennes pour renforcer l'exposition aux actions sénégalaises.</li>
            </ul>
          </li>
          <li class="font-bold text-teal-800 italic">Attention : L'allocation tactique est une compétence avancée et ne doit jamais dévier radicalement de votre stratégie.</li>
        </ul>
      </div>
    </div>

    <div class="p-4 bg-gray-100 rounded-lg text-center text-gray-800 font-medium border border-gray-300">
      Analogie : L'Allocation Stratégique est le plan de vol initial (Dakar à Abidjan). L'Allocation Tactique est le pilote qui ajuste l'altitude pour éviter les turbulences.
    </div>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <h2 class="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-teal-600 pb-2">
      12.2 Diversification Sectorielle à la BRVM
    </h2>
    <p class="text-gray-700 mb-6">Nous avons vu que la diversification réduit le risque non systématique (M11). Sur un marché régional comme la BRVM, la diversification sectorielle est essentielle.</p>

    <h3 class="text-xl font-bold text-slate-800 mb-4">12.2.1 Diversification des Moteurs de Croissance</h3>
    <p class="text-gray-600 mb-4">Les moteurs de croissance de l'UEMOA ne sont pas les mêmes dans tous les secteurs :</p>

    <div class="grid md:grid-cols-3 gap-4 mb-6">
      <div class="p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <strong class="text-blue-900 block mb-2">Secteur Bancaire (Ex: ECOBANK CI, SGB-CI)</strong>
        <p class="text-xs text-blue-800">Sensible au coût de l'argent (BCEAO) et à la croissance du crédit. Offre des dividendes stables.</p>
      </div>
      <div class="p-4 bg-green-50 border border-green-100 rounded-lg">
        <strong class="text-green-900 block mb-2">Secteur Agro-Industriel (Ex: PALM-CI, SUCRIVOIRE)</strong>
        <p class="text-xs text-green-800">Sensible aux cours mondiaux des matières premières (cacao, huile de palme) et au climat. Offre une protection contre l'inflation locale.</p>
      </div>
      <div class="p-4 bg-purple-50 border border-purple-100 rounded-lg">
        <strong class="text-purple-900 block mb-2">Secteur des Télécoms (Ex: SONATEL)</strong>
        <p class="text-xs text-purple-800">Sensible à la pénétration d'internet et à l'innovation. Offre un fort potentiel de croissance (Growth Investing).</p>
      </div>
    </div>

    <p class="text-sm font-bold text-gray-800 mb-4">Règle : Ne pas dépasser 15 à 20 % de votre portefeuille total sur un seul secteur pour minimiser l'impact d'une crise sectorielle (ex: une année de mauvaise récolte sur l'agro-industrie).</p>

    <div class="mb-8 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-900 text-sm">
      <strong>💡 Note Spéciale BRVM :</strong> Le secteur financier étant ultra-dominant sur notre marché, il peut être difficile de respecter strictement ce plafond au début. Si vous devez le dépasser, redoublez d'exigence sur la qualité financière des entreprises choisies (Modules 7 & 9) pour compenser ce manque de diversification sectorielle.
    </div>

    <h3 class="text-xl font-bold text-slate-800 mb-4">12.2.2 Le Risque de Corrélation et la BRVM</h3>
    
    

    <ul class="space-y-3 text-gray-700">
      <li>• <strong>Corrélation :</strong> Deux actifs sont corrélés s'ils montent et descendent en même temps.</li>
      <li>• <strong>Le Piège Régional :</strong> Sur la BRVM, les actions ont souvent une forte corrélation, car elles réagissent toutes aux mêmes chocs macroéconomiques régionaux (prix du pétrole, décisions BCEAO, etc.).</li>
      <li>• <strong>L'Antidote :</strong> Pour une diversification efficace, il faut trouver des actifs avec une faible corrélation (ex: comparer une action BRVM avec une obligation d'État émise par un pays non UEMOA).</li>
    </ul>
  </div>

  <div class="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
    <h2 class="text-2xl font-bold mb-6 border-b-2 border-teal-400 pb-2 text-white">
      12.3 Position Sizing – Ajuster la Taille de Position
    </h2>
    <p class="text-slate-300 mb-6">
      Le Position Sizing est la technique qui permet de déterminer combien d'argent vous allez placer sur un titre donné. C'est le lien direct entre votre analyse de risque et l'exécution d'un ordre (M10).
    </p>

    <h3 class="text-lg font-bold text-teal-300 mb-4">L'Utilisation du Stop-Loss (Rappel M11)</h3>
    <p class="text-slate-300 mb-4">Pour calculer la taille de votre position, vous devez définir où vous placez votre Stop-Loss (le seuil de vente automatique, M11).</p>

    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center mb-6">
      <div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;font-family:Georgia,serif;font-size:1.15rem;color:white;font-weight:600;">
        <span>Taille de Position</span>
        <span>=</span>
        <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;">
          <span style="border-bottom:2px solid #5eead4;padding:2px 12px 4px;">Capital risqué maximal</span>
          <span style="padding:4px 12px 2px;">Perte unitaire acceptée</span>
        </span>
      </div>
    </div>

    

    <div class="bg-white text-slate-900 p-5 rounded-lg">
      <strong class="block mb-2 text-teal-700">Exemple Concret :</strong>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>Capital risqué maximal (1%) : 10 000 FCFA.</li>
        <li>Vous achetez une action à 10 000 FCFA et vous placez votre Stop-Loss à 9 500 FCFA. La perte unitaire acceptée est de 500 FCFA (10 000 - 9 500).</li>
        <li class="mt-1"><span class="font-mono bg-gray-100 p-1 rounded inline-block">Taille de Position = 10 000 FCFA / 500 FCFA = <strong>20 actions</strong></span></li>
        <li class="mt-1">Vous achetez seulement 20 actions. Si le Stop-Loss est touché, vous perdez exactement 10 000 FCFA.</li>
      </ul>
    </div>
    
    <p class="mt-4 text-sm text-teal-200 italic">Avantage : Cette méthode vous permet d'investir de manière disciplinée et mécanique, en vous assurant que vous pouvez survivre à une série de pertes sans dérailler.</p>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <h2 class="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-teal-600 pb-2">
      12.4 Hedging et Gestion de la Couverture
    </h2>
    <p class="text-gray-700 mb-6">Le Hedging (couverture) est une technique avancée qui vise à réduire ou compenser le risque d'un portefeuille existant.</p>

    

    <div class="grid md:grid-cols-2 gap-8 mt-6">
      <div>
        <h3 class="font-bold text-slate-900 mb-3">12.4.1 Les Principes du Hedging</h3>
        <p class="text-sm text-gray-600 mb-2"><strong>Utilisation d'Actifs Non Corréllés :</strong> La forme la plus simple de hedging pour l'investisseur BRVM est de détenir des actifs qui ne réagissent pas de la même manière au marché local :</p>
        <ul class="text-sm text-gray-700 space-y-2 pl-4 border-l-2 border-slate-300">
          <li><strong>Or / Devises fortes :</strong> En cas de forte crise régionale, ces actifs conservent souvent leur valeur ou augmentent.</li>
          <li><strong>Obligations d'État BRVM :</strong> Elles sont moins volatiles que les actions et servent de refuge en période d'incertitude boursière.</li>
        </ul>
      </div>

      <div>
        <h3 class="font-bold text-slate-900 mb-3">12.4.2 La Couverture par l'Équilibre (Le Véritable Hedging du Débutant)</h3>
        <p class="text-sm text-gray-600 mb-2">Le meilleur hedging pour l'investisseur BRVM n'est pas l'utilisation de produits complexes, mais le maintien rigoureux de :</p>
        <ul class="text-sm text-gray-700 space-y-2 pl-4 border-l-2 border-teal-300">
          <li><strong>Liquidités (Cash) :</strong> Garder 10 à 20 % du portefeuille en liquidités (hors bourse) pour pouvoir saisir les opportunités d'achat en cas de krach boursier (quand tout le monde panique, M6).</li>
          <li><strong>Allocation Stratégique :</strong> S'assurer que les obligations ou les OPCVM Prudents couvrent une partie significative de votre portefeuille.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="bg-gray-50 p-8 rounded-xl text-center border border-slate-200">
    <h3 class="text-xl font-bold text-slate-800 mb-4">🧭 Prochaine Étape</h3>
    <p class="text-slate-600 mb-6">Félicitations, vous maîtrisez maintenant l’architecture de votre portefeuille. Dirigez-vous vers le Module 13 pour découvrir les outils concrets, les plateformes de trading et les règles fiscales indispensables pour passer à l'action et piloter vos investissements avec rigueur.</p>
    <button class="bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-md transform hover:scale-105">
      👉 Module 13 : Outils et Fiscalité
    </button>
  </div>

</div>
`,
  });


  // ====================================================
  // === M13 : Outils, Actualités et Fiscalité===
  // ====================================================
  await createOrUpdateModule({
    title: "Outils, Actualités et Fiscalité",
    slug: 'outils-actualites-fiscalite',
    description: "Comprenez l'impact des indicateurs macroéconomiques (Inflation, Taux d'intérêt, PIB) et le rôle de la BCEAO sur la performance des entreprises BRVM.",
    difficulty_level: 'intermediaire',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 13,
    is_published: true,
    has_quiz: false,
    content: `
<div class="module-content">

  <div class="bg-blue-600 text-white p-8 rounded-xl shadow-md">
    <h2 class="text-white mt-0">🎯 Objectif Pédagogique du Module</h2>
    <p class="text-white text-lg">À la fin de ce module, vous serez capable de :</p>
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <span class="mt-1 shrink-0">👉</span>
        <span>Maîtriser les plateformes numériques pour suivre l'actualité de la BRVM et passer vos ordres.</span>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-1 shrink-0">👉</span>
        <span>Comprendre le régime fiscal des revenus de portefeuille (plus-values, dividendes) dans l'espace UEMOA.</span>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-1 shrink-0">👉</span>
        <span>Mettre en place un système de suivi et de reporting régulier pour mesurer la performance réelle de vos investissements.</span>
      </div>
    </div>
  </div>

  <h2>13.1 Utilisation des Plateformes : Le Passage à l'Action</h2>
  
  <h3>13.1.1 Le Rôle de la SGI : L'Intermédiaire Indispensable</h3>
  <p>Votre Société de Gestion et d’Intermédiation (SGI) est votre unique point d'entrée sur le marché.</p>

  

  <div class="bg-slate-50 p-6 rounded-lg">
    <div class="space-y-3">
      <p class="mb-0">✅ <strong>Ouverture du Compte :</strong> Un compte-titres et un compte espèces sont ouverts à votre nom.</p>
      <p class="mb-0">✅ <strong>Le DC/BR (Dépositaire Central / Banque de Règlement) :</strong> Il conserve vos titres en toute sécurité, indépendamment de la SGI.</p>
      <p class="mb-0">✅ <strong>Plateforme de Trading :</strong> La plupart des SGI modernes offrent désormais des plateformes en ligne pour passer vos ordres d'achat et de vente directement.</p>
    </div>
  </div>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg mt-6">
    <p class="mb-0"><strong>Point Clé :</strong> Assurez-vous que la plateforme de votre SGI permet de passer des ordres au prix limite (Limit Order) et des ordres de type Stop-Loss pour exécuter votre stratégie de timing et de gestion du risque.</p>
  </div>

  <h3>13.1.2 Les Outils de Suivi : BRVM, SGI et Afribourse</h3>
  <div class="table-wrapper">
    <table class="border">
      <thead>
        <tr>
          <th>Outil</th>
          <th>Rôle Principal</th>
          <th>Informations Clés à Consulter</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="font-bold">Site Officiel BRVM</td>
          <td>Information Légale et Marchande</td>
          <td>Cours officiels du jour, indices (BRVM Composite), actualités réglementaires, calendrier des introductions en bourse.</td>
        </tr>
        <tr>
          <td class="font-bold">Site ou App de votre SGI</td>
          <td>Gestion du Portefeuille</td>
          <td>Solde de votre compte espèces, valorisation de vos titres en temps réel, exécution des ordres.</td>
        </tr>
        <tr>
          <td class="font-bold">Plateformes d'Actualités (ex : Afribourse)</td>
          <td>Analyse et Média</td>
          <td>Rapports et outils d'analyse sur les sociétés cotées (M7/M9), articles de presse économique UEMOA, avis d'experts.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>13.2 Fiscalité des Revenus de Portefeuille dans l’UEMOA</h2>
  <p>L'optimisation fiscale est essentielle, mais il est crucial de respecter les lois en vigueur. La fiscalité dans l'UEMOA est régie par les lois nationales, mais avec certaines tendances communes.</p>

  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-slate-50 p-5 rounded-lg">
      <h4 class="mt-0 text-blue-900">13.2.1 Imposition des Dividendes (Revenus)</h4>
      <p class="text-sm"><strong>Principe :</strong> Les dividendes sont généralement soumis à une retenue à la source (RAS) au niveau national, souvent entre 7 % et 15 % selon le pays.</p>
      <p class="text-sm"><strong>Rôle de la SGI :</strong> La SGI ou la banque est responsable d'opérer cette retenue avant de vous verser le montant net.</p>
      <p class="text-sm font-bold text-blue-800 italic">Important : Dans de nombreux pays de l'UEMOA, cette RAS est libératoire (pas de nouvelle déclaration nécessaire).</p>
    </div>

    <div class="bg-slate-50 p-5 rounded-lg">
      <h4 class="mt-0 text-blue-900">13.2.2 Imposition des Plus-Values (Gains en Capital)</h4>
      <p class="text-sm"><strong>Plus-Value :</strong> C'est le profit réalisé lorsque vous vendez une action à un prix supérieur à son prix d'achat.</p>
      <p class="text-sm"><strong>Régime Général :</strong> Les plus-values sont souvent soumises à une imposition, dont le taux varie d'un pays à l'autre de l'UEMOA.</p>
      <p class="text-sm font-bold text-red-700">Vérification : Il est impératif de vérifier la législation en vigueur dans votre pays de résidence.</p>
    </div>
  </div>

  <div class="bg-amber-50 p-4 border-l-4 border-amber-500 rounded-r-lg mt-6">
    <p class="mb-0"><strong>Conseil d'Expert :</strong> Consultez toujours un expert-comptable ou le service fiscal de votre SGI pour connaître les taux et procédures spécifiques à votre pays de résidence.</p>
  </div>

  <h2>13.3 Suivi, Reporting, et Journal de Performance</h2>
  <p>Un investisseur discipliné (M6) est un investisseur qui mesure et analyse ses résultats.</p>

  <h3>13.3.1 Création d'un Journal de Performance</h3>
  <p>Le journal de performance est un outil simple (un fichier Excel ou un carnet) qui assure la discipline et le reporting.</p>
  
  

  <div class="bg-slate-50 p-6 rounded-lg">
    <p class="font-bold">Il doit contenir :</p>
    <div class="space-y-2 text-sm">
      <p class="mb-0">📊 <strong>Date et Prix d'Achat :</strong> Pour chaque transaction.</p>
      <p class="mb-0">🧠 <strong>Raison de l'Achat :</strong> (Réf. Analyse Fondamentale M7/M9, ou Timing M10).</p>
      <p class="mb-0">📉 <strong>Stratégie de Sortie :</strong> Emplacement de votre Stop-Loss (M12) et votre objectif de vente.</p>
      <p class="mb-0">📈 <strong>Performance Réelle :</strong> Le taux de rendement annuel du portefeuille.</p>
    </div>
  </div>

  <h3>13.3.2 Mesurer la Performance (Le Rendement Annuel)</h3>
  <p>Le rendement annuel (Return) est le critère clé pour évaluer votre succès.</p>
  
  <div class="bg-slate-800 p-6 rounded-xl text-center shadow-inner my-6 overflow-x-auto">
    <div class="inline-flex items-center gap-3 text-white font-bold text-base md:text-lg flex-wrap justify-center">
      <span>Rendement Annuel =</span>
      <div class="inline-flex flex-col items-center">
        <span class="border-b-2 border-white pb-1 px-2 text-sm md:text-base">(Valeur Finale − Valeur Initiale) + Dividendes Reçus</span>
        <span class="pt-1 text-sm md:text-base">Valeur Initiale</span>
      </div>
      <span>× 100</span>
    </div>
  </div>
  

  <div class="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
    <p><strong>Benchmark BRVM :</strong> Votre objectif doit être de surpasser l'indice de référence de la BRVM (BRVM Composite ou BRVM 10).</p>
    <p class="text-sm italic">Si votre portefeuille fait 8 % mais que l'indice fait 15 %, vous avez sous-performé le marché.</p>
    <p class="mb-0"><strong>Fréquence :</strong> Évaluez votre performance tous les trimestres ou tous les six mois. Ne laissez jamais les émotions quotidiennes influencer cette analyse structurée.</p>
  </div>

  <h3>13.3.3 L'Audit de Décision (Leçon d'Humilité)</h3>
  <p>La dernière étape est la plus importante :</p>
  <div class="space-y-4">
    <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <p class="mb-0">🔎 <strong>Analyser les Erreurs :</strong> Pour chaque vente perdante, demandez-vous : Était-ce une erreur d'analyse fondamentale (M7), ou une erreur de discipline (M6) ?</p>
    </div>
    <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <p class="mb-0">🚀 <strong>Amélioration Continue :</strong> L'investissement est un marathon. Chaque erreur est une leçon pour ajuster votre stratégie d'architecte (M12).</p>
    </div>
  </div>

  

</div>
`,
  });



  // ====================================================
  // === M14 : Contexte Économique – Sentir le Pouls du Marché UEMOA===
  // ====================================================
  await createOrUpdateModule({
    title: "Contexte Économique – Sentir le Pouls du Marché UEMOA",
    slug: 'contexte-eeconomique',
    description: "Comprenez l'impact des indicateurs macroéconomiques (Inflation, Taux d'intérêt, PIB) et le rôle de la BCEAO sur la performance des entreprises BRVM.",
    difficulty_level: 'intermediaire',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 14,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-blue-900 to-cyan-700 text-white p-8 rounded-2xl shadow-xl">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3 text-cyan-300">
 🌍 Module 14 : Contexte Économique
 </h2>
 <p class="text-lg mb-6 text-blue-100">
 Sentir le Pouls du Marché UEMOA. À la fin de ce module, vous serez capable de :
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Comprendre l'influence directe de la **Banque Centrale (BCEAO)** sur la BRVM.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Identifier les tendances et opportunités macroéconomiques majeures (**Finance Durable**).
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 **Interpréter les indicateurs clés** (PIB, Inflation) pour affiner votre stratégie.
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-cyan-100 pb-2 flex items-center gap-2">
 🏦 14.1 Le Mécanisme de Transmission BCEAO → BRVM
 </h2>
 
 <p class="text-gray-600 mb-4">
 La **BCEAO (Banque Centrale des États de l’Afrique de l’Ouest)** est l'autorité monétaire. Ses décisions sur les **Taux Directeurs** ont un impact crucial sur le coût du capital dans l'UEMOA.
 </p>

 

 <h3 class="text-lg font-bold text-blue-700 mb-3 mt-4">Impact d'une Hausse des Taux Directeurs</h3>
 <div class="grid md:grid-cols-2 gap-4 text-sm">
 <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
 <strong class="text-red-800">Sur les Actions :</strong>
 <p class="text-gray-700 mt-1">L'argent (prêt bancaire) devient plus cher pour les entreprises. Le coût du capital augmente, ce qui freine les bénéfices et peut faire baisser les prix des actions.</p>
 </div>
 <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
 <strong class="text-blue-800">Sur les Obligations :</strong>
 <p class="text-gray-700 mt-1">Les obligations plus anciennes (à faible rendement) deviennent moins attractives. Leur valeur de marché baisse pour s'aligner sur les nouveaux taux plus élevés.</p>
 </div>
 </div>
 
 <h3 class="text-lg font-bold text-blue-700 mb-3 mt-4">Stabilité Monétaire (Franc CFA)</h3>
 <div class="mt-4 bg-gray-50 p-4 rounded-lg border-l-4 border-slate-500">
 <p class="text-gray-700 text-sm">
 La **parité fixe du Franc CFA** avec l'Euro assure une stabilité monétaire essentielle pour la **confiance des investisseurs** étrangers, protégeant leurs profits contre une dévaluation imprévue.
 </p>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-cyan-100 pb-2 flex items-center gap-2">
 🌱 14.2 Opportunité Majeure : La Finance Durable
 </h2>
 
 <h3 class="text-xl font-bold text-cyan-700 mb-3">Les Obligations Vertes (Green Bonds)</h3>
 <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 mb-4">
 <strong class="text-green-800">Définition :</strong>
 <p class="text-sm text-gray-700 mt-1">Titres de dette émis pour financer des projets ayant un impact environnemental positif (énergies renouvelables, gestion de l'eau). Ils attirent des fonds internationaux et augmentent la liquidité du marché obligataire BRVM.</p>
 </div>

 <h3 class="text-xl font-bold text-cyan-700 mb-3">Sociétés Positionnées sur l'Avenir</h3>
 <p class="text-gray-600 mb-4">
 L'analyse macroéconomique identifie les secteurs qui bénéficieront des **mégatendances régionales** :
 </p>
 <ul class="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
 <li>**Transition Énergétique :** Entreprises produisant de l'énergie propre ou offrant des services d'efficacité énergétique (opportunités ESG).</li>
 <li>**Démographie et Consommation :** Entreprises axées sur les besoins de base d'une population jeune et croissante (agro-industrie, télécoms).</li>
 <li>**Digitalisation :** Banques et FinTech qui captent une clientèle non bancarisée.</li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-cyan-100 pb-2 flex items-center gap-2">
 📈 14.3 Lecture des Rapports Macroéconomiques
 </h2>
 
 <h3 class="text-xl font-bold text-cyan-700 mb-3">Les Indicateurs Clés de l'UEMOA</h3>
 

 <div class="overflow-x-auto mb-6">
 <table class="min-w-full divide-y divide-gray-200 text-sm">
 <thead class="bg-cyan-50">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-cyan-800">Indicateur</th>
 <th class="px-4 py-3 text-left font-bold text-cyan-800">Signification pour l'Investisseur</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-100">
 <tr>
 <td class="px-4 py-3 font-medium">PIB (Croissance)</td>
 <td class="px-4 py-3">Une croissance du **PIB (> 5 %)** est favorable à la croissance des **bénéfices** des entreprises.</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-medium">Taux d'Inflation</td>
 <td class="px-4 py-3">Une forte inflation est un risque. Favorisez les entreprises avec un fort **Pricing Power** (capacité à augmenter les prix).</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-medium">Dette Publique / PIB</td>
 <td class="px-4 py-3">Un faible niveau de dette rassure sur la **solvabilité** des obligations d'État.</td>
 </tr>
 </tbody>
 </table>
 </div>

 <h3 class="text-xl font-bold text-cyan-700 mb-3">L'Analyse du "Sentiment" du Marché</h3>
 
 <div class="space-y-4 bg-slate-50 p-4 rounded-lg">
 <div class="border-l-4 border-orange-500 p-2">
 <strong class="text-orange-800">Analyse "Bottom-Up" (Du Bas vers le Haut) :</strong>
 <p class="text-sm text-gray-700 mt-1">Vous analysez d'abord une entreprise (M7) puis vous regardez le contexte (Ex: La banque est bonne, mais le PIB est faible, je reste prudent).</p>
 </div>
 <div class="border-l-4 border-green-500 p-2">
 <strong class="text-green-800">Analyse "Top-Down" (Du Haut vers le Bas) :</strong>
 <p class="text-sm text-gray-700 mt-1">Vous analysez la macroéconomie (Ex: La BCEAO va baisser les taux) puis vous choisissez le secteur à privilégier (crédit).</p>
 </div>
 </div>
 
 </div>

 <div class="bg-blue-900 text-white p-8 rounded-xl shadow-md">
 <h2 class="text-2xl font-bold mb-4 text-cyan-300">
 Synthèse
 </h2>
 <p class="text-slate-200 leading-relaxed">
 L'investisseur BRVM doit utiliser l'**Analyse Fondamentale** pour sélectionner les bonnes entreprises et l'**Analyse Macroéconomique** pour choisir les **bons secteurs** et les **bons moments** pour investir (Allocation Tactique, M12).
 </p>
 </div>

 <div class="bg-gray-50 text-gray-700 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-gray-800 mb-4">🧠 Les Termes à Maîtriser</h2>
 <div class="grid md:grid-cols-2 gap-4 text-sm mb-8">
 <p><strong class="text-cyan-600">BCEAO :</strong> Banque Centrale des États de l’Afrique de l’Ouest.</p>
 <p><strong class="text-cyan-600">Taux Directeurs :</strong> Taux fixés par la BCEAO qui influencent le coût du crédit.</p>
 <p><strong class="text-cyan-600">Obligations Vertes :</strong> Titres de dette pour financer des projets environnementaux.</p>
 <p><strong class="text-cyan-600">PIB :</strong> Produit Intérieur Brut, mesure la richesse produite dans une zone.</p>
 </div>
 
 <hr class="border-gray-300 my-6"/>
 
 <div class="text-center">
 <h3 class="text-xl font-bold text-gray-800 mb-2">Fin du Programme ! 🚀</h3>
 <p class="mb-6">Vous êtes désormais prêt à devenir un investisseur autonome et éclairé sur la BRVM.</p>
 <div class="inline-block bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg transition-colors font-bold shadow-lg cursor-pointer">
 ACCÉDER À LA FEUILLE DE ROUTE D'EXÉCUTION
 </div>
 </div>
 </div>

 </div>
`,
  });



  // ====================================================
  // === M15 : La Stratégie d’Investissement Intégrée===
  // ====================================================
  await createOrUpdateModule({
    title: "La Stratégie d'Investissement Intégrée",
    slug: 'strat-strat',
    description: "Comprenez l'impact des indicateurs macroéconomiques (Inflation, Taux d'intérêt, PIB) et le rôle de la BCEAO sur la performance des entreprises BRVM.",
    difficulty_level: 'intermediaire',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 15,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-8 rounded-2xl shadow-xl">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3 text-yellow-400">
 🧠 Module 15 : La Stratégie d’Investissement Intégrée
 </h2>
 <p class="text-lg mb-6 text-purple-100">
 L'Intégration de la Méthode. À la fin de ce module, vous serez capable de :
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 **Intégrer l'analyse fondamentale (FA) et technique (TA)** pour optimiser le choix et le timing.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Appliquer une **check-list rigoureuse** pour valider chaque décision d'investissement.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Mener une **étude de cas complète** simulant un processus d'investissement réel de A à Z.
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-purple-100 pb-2 flex items-center gap-2">
 🤝 15.1 FA vs TA – Une Fausse Dichotomie
 </h2>
 
 <p class="text-gray-600 mb-4">
 L'investisseur expert ne s'oppose pas à l'Analyse Fondamentale (FA) ou Technique (TA) ; il utilise leur complémentarité.
 </p>
 
 <div class="overflow-x-auto mb-4">
 <table class="min-w-full divide-y divide-gray-200 text-sm">
 <thead class="bg-yellow-50">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-yellow-800">Type d'Analyse</th>
 <th class="px-4 py-3 text-left font-bold text-yellow-800">Question Répondue</th>
 <th class="px-4 py-3 text-left font-bold text-yellow-800">Objectif</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-200">
 <tr>
 <td class="px-4 py-3 font-bold text-purple-600">Fondamentale (FA)</td>
 <td class="px-4 py-3">**QUOI** acheter ? (La qualité)</td>
 <td class="px-4 py-3">Déterminer la **valeur intrinsèque** (V).</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-indigo-600">Technique (TA)</td>
 <td class="px-4 py-3">**QUAND** acheter ? (Le timing)</td>
 <td class="px-4 py-3">Déterminer le meilleur **point d'entrée/sortie** (le prix).</td>
 </tr>
 </tbody>
 </table>
 </div>
 
 <p class="text-sm text-gray-500 italic mt-2">
 **Conclusion :** La stratégie gagnante est d'acheter une action **fantastique (FA)** au **meilleur moment (TA)**.
 </p>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-purple-100 pb-2 flex items-center gap-2">
 🎯 15.2 La Stratégie Intégrée en Trois Étapes
 </h2>
 
 

 <div class="space-y-6">
 <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
 <h3 class="font-bold text-purple-800 mb-2 flex items-center gap-2">1. L'Étape de Sélection (Le Filtre FA)</h3>
 <ul class="list-disc list-inside text-sm text-gray-700 ml-4">
 <li>Identifier un solide **Moat** (M9) et une bonne **Gouvernance**.</li>
 <li>Vérifier les fondamentaux : **ROE > 15%** et croissance stable (M7).</li>
 <li>**Valorisation (M8) :** L'action doit être **sous-évaluée** (Prix < Valeur Intrinsèque).</li>
 </ul>
 </div>

 <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-600">
 <h3 class="font-bold text-yellow-800 mb-2 flex items-center gap-2">2. L'Étape de Timing (Le Déclencheur TA)</h3>
 <ul class="list-disc list-inside text-sm text-gray-700 ml-4">
 <li>Le prix doit approcher ou toucher un niveau de **Support clé** (M10).</li>
 <li>Le **RSI** (M10) doit être en zone de **survente** (< 40 ou < 30).</li>
 <li>La baisse doit être due à la panique de marché (risque systémique) et non à une dégradation des fondamentaux.</li>
 </ul>
 </div>

 <div class="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-600">
 <h3 class="font-bold text-indigo-800 mb-2 flex items-center gap-2">3. L'Étape de Gestion (Le Garde-Fou Risque)</h3>
 <ul class="list-disc list-inside text-sm text-gray-700 ml-4">
 <li>Appliquer le **Position Sizing** (M12) : Respecter la **Règle des 1%** de risque maximal par transaction.</li>
 <li>Définir et placer immédiatement l'ordre **Stop-Loss** (M12/M13) sur la plateforme SGI.</li>
 </ul>
 </div>
 </div>
 
 <h3 class="font-bold text-gray-800 mt-6 mb-2">Psychologie (M6) dans l'Intégration</h3>
 <p class="text-sm text-gray-600">
 Cette stratégie est l'antidote contre les émotions : elle vous force à être **prudent** quand l'avidité (FOMO) est forte et à être **avide** quand la peur (krach) domine, en respectant votre analyse (M6).
 </p>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-purple-100 pb-2 flex items-center gap-2">
 ✅ 15.3 La Check-List de l’Investisseur Expert (8 Étapes)
 </h2>
 
 <p class="text-gray-600 mb-4">
 Avant de passer un ordre d'achat sur la BRVM, un investisseur complet doit valider tous ces points :
 </p>

 <div class="overflow-x-auto">
 <table class="min-w-full divide-y divide-gray-200 text-sm">
 <thead class="bg-purple-100">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-purple-800">Catégorie</th>
 <th class="px-4 py-3 text-left font-bold text-purple-800">Critère de Validation (OUI/NON)</th>
 <th class="px-4 py-3 text-left font-bold text-purple-800">Réf.</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-100">
 <tr>
 <td class="px-4 py-3 font-bold text-gray-800">Macro/Contexte</td>
 <td class="px-4 py-3">Le contexte UEMOA (M14) est-il favorable (ou choc temporaire) ?</td>
 <td class="px-4 py-3">M14</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-800">Fondamentaux</td>
 <td class="px-4 py-3">Le ROE est-il > 15% et stable sur 5 ans ? La Marge est-elle saine ?</td>
 <td class="px-4 py-3">M7</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-800">Qualitatif</td>
 <td class="px-4 py-3">Le Moat (M9) est-il clair et la Gouvernance solide ?</td>
 <td class="px-4 py-3">M9</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-800">Valorisation</td>
 <td class="px-4 py-3">Le prix de marché est-il inférieur à ma Valeur Intrinsèque (M8) ?</td>
 <td class="px-4 py-3">M8</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-800">Timing</td>
 <td class="px-4 py-3">Le prix est-il sur un Support ou le RSI (M10) est-il en survente (< 40) ?</td>
 <td class="px-4 py-3">M10</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-800">Risque</td>
 <td class="px-4 py-3">Ma taille de position (Position Sizing, M12) respecte-t-elle la Règle des 1% ?</td>
 <td class="px-4 py-3">M12</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-800">Portefeuille</td>
 <td class="px-4 py-3">L'achat améliore-t-il la Diversification (M11) sectorielle ?</td>
 <td class="px-4 py-3">M11</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-800">Discipline</td>
 <td class="px-4 py-3">Ai-je un ordre Stop-Loss et un objectif de vente clairement définis ?</td>
 <td class="px-4 py-3">M6, M12</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <div class="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-300">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-yellow-200 pb-2 flex items-center gap-2">
 🛠️ 15.4 (Atelier Final) : Étude de Cas Complète de A à Z
 </h2>
 
 <p class="text-gray-700 mb-4">
 Cet atelier est l'exercice pratique qui valide l'intégration de toutes les compétences en simulant une décision d'investissement réelle sur une action de la BRVM.
 </p>
 
 <h3 class="font-bold text-yellow-800 mb-2">L'Apprenant doit Produire :</h3>
 <ul class="list-disc list-inside text-sm text-gray-700 ml-4 space-y-1">
 <li>Une **Note d'Analyse Fondamentale** (Ratios M7/M9 et calcul d'une Valeur Intrinsèque M8).</li>
 <li>Une **Analyse Technique** (Identification du Support/Résistance et du signal de timing M10).</li>
 <li>Une **Proposition d'Ordre** (Taille de position M12, prix d'entrée, et Stop-Loss).</li>
 <li>Une **Justification Intégrée** (Synthèse des 8 points de la Check-List M15.3).</li>
 </ul>
 </div>

 <div class="bg-gray-900 text-white p-8 rounded-xl shadow-md">
 <h2 class="text-2xl font-bold mb-4 text-yellow-400">
 🚀 15.5 Conclusion : Votre Voyage Vers l’Autonomie
 </h2>
 <p class="text-slate-200 leading-relaxed mb-6">
 Le succès en bourse n'est pas une question de chance, mais de **méthode et de discipline (M6)**. Vous avez maintenant le savoir, les outils et la stratégie intégrée pour vous affranchir des rumeurs et des conseils non vérifiés.
 </p>

 <h3 class="font-bold text-yellow-400 mb-3">Prochaines Étapes Pratiques :</h3>
 <ul class="list-disc list-inside text-sm text-slate-300 ml-4 space-y-1">
 <li>Ouvrir votre compte SGI (M13).</li>
 <li>Définir votre Allocation Stratégique (M11).</li>
 <li>Commencer l'Analyse Fondamentale de 5 entreprises BRVM qui vous intéressent.</li>
 </ul>

 <div class="mt-6 text-center">
 <p class="text-xl font-bold text-white mb-2">Félicitations !</p>
 <p class="text-lg text-yellow-400">Vous êtes passé de débutant à Architecte Investisseur de la BRVM !</p>
 </div>
 </div>

 <div class="bg-gray-50 text-gray-700 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-gray-800 mb-4">🧠 Les Termes à Maîtriser</h2>
 <div class="grid md:grid-cols-2 gap-4 text-sm mb-8">
 <p><strong class="text-purple-600">Stratégie Intégrée :</strong> Utilisation de FA pour la sélection et de TA pour le timing.</p>
 <p><strong class="text-purple-600">Filtre FA :</strong> L'Analyse Fondamentale pour s'assurer que l'entreprise est de qualité (Moat, ROE).</p>
 <p><strong class="text-purple-600">Déclencheur TA :</strong> L'Analyse Technique pour identifier le point d'entrée idéal (Support, Survente RSI).</p>
 <p><strong class="text-purple-600">Check-List :</strong> Processus rigoureux en 8 étapes pour valider chaque transaction.</p>
 </div>
 </div>

 </div>
`,
  });


  // ===================================
  // === M16A : PRÉPARATION ET INFRASTRUCTURE FINANCIÈRE ===
  // ===================================
  await createOrUpdateModule({
    title: 'Module 16A : Préparation et Infrastructure Financière',
    slug: 'module16a-preparation-infrastructure',
    description: "Mettez votre maison financière en ordre : règle des 3 enveloppes, ouverture du compte SGI et maîtrise des outils AfriBourse.",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 20,
    order_index: 16,
    is_published: true,
    has_quiz: false,
    content: `
<div class="citation-box">
  <p>"Un portefeuille ne se construit pas en une nuit, mais chaque grande fortune a commencé par une première décision."</p>
</div>

<div class="objectif-hero">
  <h2>🎯 Objectif Pédagogique</h2>
  <p>À la fin de ce module, vous serez capable de :</p>
  <ul>
    <li>Organiser votre épargne en appliquant la <strong>règle des trois enveloppes</strong> pour isoler votre "Capital Actif" de vos besoins vitaux.</li>
    <li>Définir un <strong>budget d'investissement réaliste</strong> en calculant votre capital initial (C₀) et votre versement mensuel (DCA) sans créer de tension financière.</li>
    <li><strong>Choisir et ouvrir votre compte SGI</strong> en comparant les intermédiaires selon 5 critères stratégiques (frais, dépôt, plateforme, réactivité et conseil).</li>
    <li>Maîtriser les <strong>outils de pilotage AfriBourse</strong> en utilisant le simulateur pour la pratique sans risque et le tableau de bord pour le suivi hebdomadaire rigoureux.</li>
  </ul>
</div>

<div class="info-box">
  <h3>💡 Prérequis</h3>
  <p>Ce module est la suite directe de M11 (Gestion du Risque), M12 (Position Sizing), M13 (Plateformes) et M15 (Stratégie Intégrée). Il est le <strong>pont entre votre formation et votre premier investissement réel</strong>.</p>
</div>

<div class="section-blue">
  <h2>🏠 16.1 — Avant de Toucher à la Bourse : Mettre sa Maison Financière en Ordre</h2>

  <p>Le marché ne vous attend pas. Mais votre stabilité financière, elle, ne peut pas attendre. Avant d'ouvrir un compte SGI et d'acheter votre première action, vous devez répondre honnêtement à trois questions fondamentales.</p>

  <h3>16.1.1 — La Règle des Trois Enveloppes</h3>
  <p>Votre argent doit être organisé en trois compartiments distincts, dans cet ordre strict :</p>

  <table>
    <thead>
      <tr>
        <th>Enveloppe</th>
        <th>Rôle</th>
        <th>Montant recommandé</th>
        <th>Où le mettre ?</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Le Bouclier</strong></td>
        <td>Fonds d'urgence intouchable (chômage, maladie, réparation urgente)</td>
        <td>3 à 6 mois de dépenses courantes</td>
        <td>Compte épargne liquide (pas la bourse)</td>
      </tr>
      <tr>
        <td><strong>2. Les Projets</strong></td>
        <td>Épargne pour objectifs à court terme (&lt; 2 ans) : voyage, frais de scolarité, mariage</td>
        <td>Selon vos projets personnels</td>
        <td>Bon du Trésor, dépôt à terme, OPCVM Monétaire</td>
      </tr>
      <tr>
        <td><strong>3. Le Capital Actif ✓</strong></td>
        <td>L'argent que vous pouvez RÉELLEMENT investir en bourse</td>
        <td>Ce qui reste après enveloppes 1 &amp; 2</td>
        <td>BRVM — compte SGI</td>
      </tr>
    </tbody>
  </table>

  <div class="warning-box">
    <h3>⚠️ Règle absolue</h3>
    <p>N'investissez en bourse <strong>QUE</strong> l'argent de l'Enveloppe 3. Un investisseur qui retire ses actions en urgence parce qu'il a besoin d'argent vend presque toujours au pire moment — une perte garantie. <strong>La discipline commence avant le premier ordre.</strong></p>
  </div>

  <h3>16.1.2 — Définir Son Enveloppe d'Investissement Réaliste</h3>
  <p>Une fois vos enveloppes 1 et 2 constituées, il faut déterminer deux chiffres précis :</p>

  <table>
    <thead>
      <tr>
        <th>Paramètre</th>
        <th>Question à se poser</th>
        <th>Exemple concret</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Capital initial (C₀)</strong></td>
        <td>Quel montant puis-je placer dès maintenant sans pression ?</td>
        <td>500 000 FCFA disponibles → Capital initial = 300 000 FCFA (on garde 200 000 FCFA de marge)</td>
      </tr>
      <tr>
        <td><strong>Versement mensuel (DCA)</strong></td>
        <td>Quel montant puis-je investir régulièrement chaque mois ?</td>
        <td>Revenus mensuels 400 000 FCFA, charges 280 000 FCFA → DCA = 50 000 FCFA/mois</td>
      </tr>
    </tbody>
  </table>

  <div class="key-points-box">
    <h3>📊 Règle pratique</h3>
    <p>Votre versement mensuel DCA ne doit jamais dépasser <strong>15 à 20 % de votre revenu net</strong>. Au-delà, vous risquez de créer une tension financière qui vous forcera à vendre au mauvais moment.</p>
  </div>
</div>

<div class="section-green">
  <h2>🏦 16.1.3 — Ouvrir son Compte SGI : Le Guide Pas à Pas</h2>

  <p>La Société de Gestion et d'Intermédiation (SGI) est votre unique porte d'entrée légale sur la BRVM (M2). Voici comment procéder concrètement.</p>

  <h3>Bien choisir sa SGI : un choix stratégique, pas anodin</h3>
  <p>Toutes les SGI agréées par l'AMF-UMOA vous donnent accès au même marché et aux mêmes titres. Mais elles ne se valent pas toutes sur les critères qui impactent directement votre rendement net.</p>

  <h4>1. Les frais de courtage (commissions sur ordres)</h4>
  <p>C'est le critère le plus important. Chaque fois que vous achetez ou vendez, la SGI prélève une commission sur le montant de la transaction. Sur la BRVM, cette commission tourne généralement entre <strong>0,5 % et 1,5 %</strong> du montant de l'ordre.</p>
  <div class="warning-box">
    <p>Sur un achat de 200 000 FCFA, la différence entre une SGI à 0,6 % et une autre à 1,2 % représente déjà <strong>1 200 FCFA de frais supplémentaires</strong> — rien que pour un seul ordre. Multipliez par tous vos achats et ventes sur 10 ans, et l'écart devient considérable.</p>
  </div>

  <h4>2. Le dépôt minimum</h4>
  <p>Certaines SGI exigent un dépôt initial de 50 000 FCFA, d'autres de 200 000 à 500 000 FCFA. Si vous démarrez avec un petit capital, ce critère peut limiter vos options. Renseignez-vous systématiquement avant toute démarche.</p>

  <h4>3. La qualité de la plateforme numérique</h4>
  <p>Est-ce qu'elle est accessible sur mobile ? Peut-on consulter ses positions en temps réel ? Y a-t-il un historique des ordres clair ? Une plateforme mal conçue vous fera perdre du temps et peut générer des erreurs d'exécution. Demandez une démonstration avant de vous décider.</p>

  <h4>4. La réactivité du service client</h4>
  <p>Sur la BRVM, vous ne pouvez pas gérer vos seuils d'alerte automatiquement — vous devez contacter votre SGI pour passer un ordre de vente si une valeur se dégrade. Si votre SGI met 48h à répondre, ce délai peut vous coûter cher. <strong>Testez leur réactivité avant d'ouvrir votre compte.</strong></p>

  <h4>5. Le conseil et l'accompagnement</h4>
  <p>Certaines SGI proposent un suivi personnalisé (conseiller dédié, newsletters de recherche, rapports sur les valeurs BRVM). Pour un débutant, cet accompagnement peut valoir de l'or.</p>

  <table>
    <thead>
      <tr>
        <th>Critère</th>
        <th>Questions à poser à la SGI</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Frais de courtage</td>
        <td>Quel est votre taux de commission à l'achat et à la vente ? Y a-t-il des frais fixes en plus ?</td>
      </tr>
      <tr>
        <td>Dépôt minimum</td>
        <td>Quel est le montant minimum pour ouvrir un compte ?</td>
      </tr>
      <tr>
        <td>Plateforme</td>
        <td>Avez-vous une application mobile ? Puis-je voir mes positions en temps réel ?</td>
      </tr>
      <tr>
        <td>Réactivité</td>
        <td>Quel est votre délai moyen de traitement d'un ordre passé par téléphone ou email ?</td>
      </tr>
      <tr>
        <td>Accompagnement</td>
        <td>Proposez-vous un conseiller dédié ou des rapports de recherche sur les valeurs BRVM ?</td>
      </tr>
    </tbody>
  </table>

  <div class="info-box">
    <h3>💡 Conseil pratique</h3>
    <p>La liste complète des SGI agréées AMF-UMOA est disponible sur le site officiel <strong>amf-umoa.org</strong>. Contactez-en au moins 3 avant de faire votre choix.</p>
  </div>

  <h3>📋 Documents généralement requis</h3>
  <ul>
    <li><strong>Pièce d'identité nationale</strong> : Carte nationale d'identité, passeport ou carte de résident en cours de validité.</li>
    <li><strong>Justificatif de domicile</strong> : Facture d'eau, d'électricité ou quittance de loyer de moins de 3 mois.</li>
    <li><strong>Formulaire KYC</strong> : (Know Your Customer) rempli et signé — questionnaire sur votre profil d'investisseur et l'origine de vos fonds.</li>
    <li><strong>Dépôt minimum</strong> : Variable selon la SGI (généralement entre 0 et 1 000 000 FCFA).</li>
  </ul>

  <table>
    <thead>
      <tr>
        <th>Étape</th>
        <th>Action</th>
        <th>Durée estimée</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Choisir sa SGI agréée AMF-UMOA (liste disponible sur le site BRVM)</td><td>1 jour</td></tr>
      <tr><td>2</td><td>Se présenter en agence ou faire la démarche en ligne si disponible</td><td>1 jour</td></tr>
      <tr><td>3</td><td>Remettre les documents et signer les conventions de compte</td><td>1 à 2 jours</td></tr>
      <tr><td>4</td><td>Effectuer le dépôt initial sur votre compte espèces</td><td>1 jour</td></tr>
      <tr><td>5</td><td>Recevoir vos identifiants de connexion à la plateforme de trading</td><td>2 à 5 jours</td></tr>
      <tr><td>6</td><td>Passer votre premier ordre !</td><td>J+7 après l'ouverture</td></tr>
    </tbody>
  </table>

  <div class="key-points-box">
    <h3>🎓 À retenir</h3>
    <p>Vos titres (actions, obligations) ne sont pas conservés chez votre SGI. Ils sont enregistrés à votre nom au <strong>DC/BR</strong> (Dépositaire Central / Banque de Règlement). Même si votre SGI fait faillite, vos titres restent protégés. C'est une garantie fondamentale de l'architecture du marché BRVM.</p>
  </div>
</div>

<div class="section-purple">
  <h2>🪶 16.1.4 — S'entraîner Avant d'Investir Réel : Le Simulateur AfriBourse</h2>

  <p>Avant de risquer votre argent réel sur la BRVM, l'Académie AfriBourse met à votre disposition un <strong>simulateur de trading avec portefeuille fictif en argent virtuel</strong>. C'est votre terrain d'entraînement — l'équivalent du simulateur de vol pour le pilote.</p>

  <div class="analogy-box">
    <h3>⚽ L'analogie à retenir : le terrain de foot avant le match</h3>
    <p>Aucun entraîneur sérieux n'envoie ses joueurs directement en finale sans entraînement. Le simulateur, c'est votre terrain d'entraînement. Vous apprenez les gestes, vous commettez des erreurs, vous corrigez — <strong>sans conséquence réelle</strong>. Quand vous passez en compétition (le marché réel), vous avez déjà les automatismes.</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ce que vous pouvez faire sur le simulateur</th>
        <th>L'objectif pédagogique</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Constituer un portefeuille fictif avec un capital virtuel</td>
        <td>Apprendre à allouer son capital entre plusieurs lignes sans risquer son argent réel</td>
      </tr>
      <tr>
        <td>Passer des ordres d'achat et de vente avec les vrais cours BRVM</td>
        <td>Se familiariser avec la terminologie, les types d'ordres et le fonctionnement du fixing</td>
      </tr>
      <tr>
        <td>Observer l'évolution de votre portefeuille virtuel dans le temps</td>
        <td>Comprendre concrètement ce que signifie une plus-value latente ou une perte non réalisée</td>
      </tr>
      <tr>
        <td>Tester votre stratégie de sélection (les 4 filtres) sur des valeurs réelles</td>
        <td>Valider votre méthode avant de la déployer avec de l'argent réel</td>
      </tr>
      <tr>
        <td>Commettre des erreurs sans conséquence financière</td>
        <td>Apprendre de ses erreurs de jugement ou d'émotion dans un environnement sécurisé</td>
      </tr>
    </tbody>
  </table>

  <div class="info-box">
    <h3>💡 Recommandation</h3>
    <p>Utilisez le simulateur pendant au minimum <strong>8 à 16 semaines</strong> avant d'ouvrir un compte SGI réel. Construisez un portefeuille virtuel en appliquant les 4 filtres de sélection (Module 16B), suivez son évolution, et analysez vos décisions. Si votre portefeuille virtuel est cohérent et discipliné, vous êtes prêt pour le passage au réel.</p>
  </div>
</div>

<div class="section-blue">
  <h2>📊 16.1.5 — Suivre son Portefeuille : Le Tableau de Bord AfriBourse</h2>

  <p>Une fois votre portefeuille constitué — virtuel ou réel — votre travail ne s'arrête pas à l'achat. Vous devez suivre son évolution de manière régulière et structurée.</p>

  <table>
    <thead>
      <tr>
        <th>Fonctionnalité du tableau de bord</th>
        <th>Ce que vous y lisez</th>
        <th>Fréquence recommandée</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Valorisation en temps réel</strong></td>
        <td>La valeur totale actuelle de votre portefeuille, mise à jour selon les derniers cours du fixing BRVM.</td>
        <td>Hebdomadaire (pas quotidienne — évitez l'obsession du cours)</td>
      </tr>
      <tr>
        <td><strong>Plus-values latentes et réalisées</strong></td>
        <td>Plus-value latente = gain non encore encaissé sur une ligne encore en portefeuille. Plus-value réalisée = gain effectivement encaissé après vente.</td>
        <td>Mensuelle</td>
      </tr>
      <tr>
        <td><strong>Historique des ordres passés</strong></td>
        <td>La liste complète de vos achats et ventes : date, titre, quantité, prix d'exécution, frais. C'est votre mémoire d'investisseur.</td>
        <td>Trimestrielle (revue complète)</td>
      </tr>
    </tbody>
  </table>

  <div class="warning-box">
    <h3>⚠️ Attention</h3>
    <p>Ne consultez pas votre portefeuille tous les jours. L'obsession du cours quotidien est l'un des principaux déclencheurs de décisions émotionnelles (vente panique, achat impulsif). <strong>Une consultation hebdomadaire est largement suffisante</strong> pour un investisseur à long terme. Votre horizon est de 7 ans, pas de 7 heures. Vous pouvez mettre des alertes de prix pour avoir des notifications quand un niveau est atteint.</p>
  </div>

  <div class="key-points-box">
    <h3>🎓 À retenir</h3>
    <p>Le tableau de bord n'est pas un outil de trading — c'est un <strong>outil de pilotage</strong>. Il vous donne une vision claire de votre situation pour prendre de meilleures décisions, pas pour réagir à chaque mouvement du marché.</p>
  </div>
</div>
`,
  });


  // ===================================
  // === M16B : STRATÉGIE DE SÉLECTION ET DÉPLOIEMENT ===
  // ===================================
  await createOrUpdateModule({
    title: 'Module 16B : Stratégie de Sélection et Déploiement',
    slug: 'module16b-strategie-selection',
    description: "Filtrez le marché BRVM avec la méthode des 4 filtres, déployez votre capital progressivement et évitez les 7 erreurs classiques du débutant.",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 25,
    order_index: 17,
    is_published: true,
    has_quiz: true,
    content: `
<div class="citation-box">
  <p>"La bourse est un mécanisme de transfert de l'argent des impatients vers les patients." — Warren Buffett</p>
</div>

<div class="objectif-hero">
  <h2>🎯 Objectif Pédagogique</h2>
  <p>À la fin de ce module, vous serez capable de :</p>
  <ul>
    <li>Filtrer le marché BRVM pour extraire une <strong>shortlist de 5 à 10 valeurs saines</strong> grâce à la méthode des 4 filtres (Liquidité, Solidité, Dividende, Valorisation).</li>
    <li>Déployer votre capital progressivement en suivant un <strong>plan rigoureux sur 4 mois</strong> pour lisser les risques de timing et de concentration.</li>
    <li>Identifier et neutraliser les <strong>7 erreurs classiques du débutant</strong>, telles que l'over-trading ou la panique lors des corrections de marché.</li>
    <li>Sécuriser vos décisions réelles en appliquant systématiquement la <strong>check-list du premier investisseur</strong> avant chaque passage d'ordre.</li>
  </ul>
</div>

<div class="section-blue">
  <h2>🔍 16.2 — Construire sa Shortlist : La Méthode de Sélection en 4 Filtres</h2>

  <p>Avant d'acheter quoi que ce soit, vous devez identifier les entreprises qui méritent votre capital. La BRVM compte plus de 40 sociétés cotées. Votre travail est de n'en retenir que <strong>5 à 10 pour commencer</strong>. Voici la méthode en 4 filtres successifs.</p>

  <h3>Filtre 1 — La Liquidité : "Puis-je acheter ET vendre facilement ?"</h3>
  <p>Sur la BRVM, toutes les actions ne s'échangent pas avec la même facilité. Une action illiquide peut vous piéger : vous ne trouvez pas d'acheteur quand vous voulez vendre, ou vous ne trouvez pas de vendeur quand vous voulez acheter.</p>
  <ul>
    <li><strong>Critère</strong> : Privilégier les valeurs avec un volume quotidien échangé régulier. Consultez le site BRVM.org pour les statistiques de volume.</li>
    <li><strong>Règle pratique</strong> : Pour un débutant avec moins de 5 000 000 FCFA, se limiter aux <strong>Blue Chips du BRVM 10</strong> (les 10 valeurs les plus capitalisées et les plus liquides du marché).</li>
    <li><strong>Exemples de Blue Chips BRVM</strong> : SONATEL, ECOBANK CI, ORANGE CI, PALM-CI, SOLIBRA, SGB-CI, SGBCI, BOA Côte d'Ivoire, UNILEVER CI, SAPH.</li>
  </ul>
  <div class="warning-box">
    <p>Les petites valeurs (small caps) peuvent offrir des opportunités de rendement supérieur, mais leur faible liquidité les rend inadaptées à un portefeuille débutant. Réservez-les pour votre portefeuille avancé, une fois que vous maîtrisez les bases.</p>
  </div>

  <h3>Filtre 2 — La Solidité Fondamentale : "L'entreprise est-elle saine ?"</h3>
  <p>Appliquez une version simplifiée de l'analyse fondamentale (M7) pour éliminer les entreprises fragiles. Un contrôle rapide en 3 ratios suffit pour la shortlist.</p>

  <table>
    <thead>
      <tr>
        <th>Ratio</th>
        <th>Ce qu'il mesure</th>
        <th>Seuil minimum recommandé (BRVM)</th>
        <th>Où le trouver ?</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ROE</strong> (Rentabilité des Capitaux Propres)</td>
        <td>L'entreprise génère-t-elle de la valeur pour ses actionnaires ?</td>
        <td>≥ 10 % (idéalement &gt; 15 %)</td>
        <td>Rapport annuel, site BRVM, Afribourse.com</td>
      </tr>
      <tr>
        <td><strong>Ratio d'Endettement</strong> (Dettes / CP)</td>
        <td>L'entreprise est-elle trop endettée ?</td>
        <td>&lt; 1,5 (inférieur à 1 est excellent)</td>
        <td>Bilan de l'entreprise (M7)</td>
      </tr>
      <tr>
        <td><strong>Croissance du CA</strong> (sur 3 ans)</td>
        <td>Le chiffre d'affaires est-il en progression ?</td>
        <td>Positive ou stable</td>
        <td>Rapports annuels des 3 dernières années</td>
      </tr>
    </tbody>
  </table>

  <div class="info-box">
    <h3>💡 Conseil</h3>
    <p>Si vous ne trouvez pas ces données facilement, c'est souvent un mauvais signe. Les bonnes entreprises communiquent clairement leurs résultats. La transparence est un critère qualitatif à part entière.</p>
  </div>

  <h3>Filtre 3 — Le Dividende : "L'entreprise me rémunère-t-elle ?"</h3>
  <p>La BRVM est réputée pour ses entreprises à dividendes généreux. Pour un investisseur débutant, le dividende est un signal fort : il prouve que l'entreprise génère du cash réel et qu'elle partage sa richesse avec ses actionnaires.</p>
  <p><strong>Dividend Yield</strong> = Dividende annuel par action ÷ Prix de l'action × 100</p>
  <ul>
    <li><strong>Seuil cible</strong> : Un Dividend Yield supérieur à <strong>4 %</strong> est attractif sur la BRVM.</li>
    <li><strong>Régularité</strong> : Privilégiez les entreprises qui versent des dividendes de manière continue depuis au moins 3 ans.</li>
  </ul>

  <table>
    <thead>
      <tr>
        <th>Société</th>
        <th>Dividende 2023 (FCFA/action)</th>
        <th>Prix de l'action (approx.)</th>
        <th>Dividend Yield estimé</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>SONATEL</td><td>1 500 FCFA</td><td>~19 000 FCFA</td><td>~7,9 %</td></tr>
      <tr><td>PALM-CI</td><td>450 FCFA</td><td>~7 000 FCFA</td><td>~6,4 %</td></tr>
      <tr><td>ECOBANK CI</td><td>80 FCFA</td><td>~5 500 FCFA</td><td>~1,5 %</td></tr>
      <tr><td>SOLIBRA</td><td>12 000 FCFA</td><td>~180 000 FCFA</td><td>~6,7 %</td></tr>
    </tbody>
  </table>

  <div class="warning-box">
    <h3>⚠️ Important</h3>
    <p>Un yield très élevé (&gt; 15 %) peut être un piège : le cours a peut-être chuté brutalement en raison de problèmes graves. <strong>Vérifiez toujours la raison du yield élevé avant d'investir.</strong></p>
  </div>

  <h3>Filtre 4 — La Valorisation : "Le prix est-il raisonnable ?"</h3>
  <p>Même une excellente entreprise peut être un mauvais investissement si vous la payez trop cher. Vérifiez que le prix est raisonnable avec ces deux indicateurs rapides.</p>

  <table>
    <thead>
      <tr>
        <th>Indicateur</th>
        <th>Formule</th>
        <th>Interprétation</th>
        <th>Seuil BRVM</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>PER</strong> (Price Earnings Ratio)</td>
        <td>Prix de l'action ÷ Bénéfice par action</td>
        <td>Combien payez-vous pour 1 FCFA de bénéfice ? Un PER bas = action potentiellement bon marché.</td>
        <td>PER &lt; 15 = attractif. PER &gt; 25 = cher.</td>
      </tr>
      <tr>
        <td><strong>Price-to-Book (P/B)</strong></td>
        <td>Prix de l'action ÷ Valeur comptable par action</td>
        <td>Payez-vous moins que ce que vaut l'entreprise sur le papier ? Un P/B &lt; 1 = très sous-évalué.</td>
        <td>P/B &lt; 1,5 = raisonnable. P/B &gt; 3 = prudence.</td>
      </tr>
    </tbody>
  </table>

  <div class="key-points-box">
    <h3>🎓 Les 4 Filtres en Résumé</h3>
    <table>
      <thead>
        <tr><th>Filtre</th><th>Question clé</th><th>Critère d'élimination</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>1 — Liquidité</strong></td><td>Puis-je acheter/vendre facilement ?</td><td>Volume quotidien trop faible → éliminer</td></tr>
        <tr><td><strong>2 — Solidité</strong></td><td>L'entreprise est-elle saine ?</td><td>ROE &lt; 10 % ou endettement excessif → éliminer</td></tr>
        <tr><td><strong>3 — Dividende</strong></td><td>Suis-je rémunéré pendant que j'attends ?</td><td>Pas de dividende régulier (sauf croissance avérée) → vigilance</td></tr>
        <tr><td><strong>4 — Valorisation</strong></td><td>Le prix est-il raisonnable ?</td><td>PER &gt; 25 ou P/B &gt; 3 sans justification → attendre</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="section-green">
  <h2>🏗️ 16.3 — La Construction Ligne par Ligne : Du Premier Achat à un Portefeuille Équilibré</h2>

  <p>Vous avez votre enveloppe. Vous avez votre shortlist. Il est maintenant temps de construire votre portefeuille de manière méthodique — <strong>pas en une seule fois, mais progressivement</strong>.</p>

  <h3>16.3.1 — La Règle d'Or : Ne Jamais Tout Investir d'un Coup</h3>
  <p>L'erreur la plus fréquente du débutant est d'investir l'intégralité de son capital le premier jour, souvent dans un seul titre, poussé par l'enthousiasme. Cette approche expose à deux risques majeurs :</p>
  <ul>
    <li><strong>Le risque de timing</strong> : Vous avez peut-être acheté au plus haut. Si le marché corrige dans les semaines suivantes, vous êtes en perte latente dès le début, ce qui est psychologiquement dévastateur (M6).</li>
    <li><strong>Le risque de concentration</strong> : Un seul titre, aussi excellent soit-il, peut subir un choc spécifique. Sans diversification, votre portefeuille entier est en danger.</li>
  </ul>

  <h3>16.3.2 — Le Plan de Déploiement du Capital Initial</h3>
  <p>Voici une méthode pratique pour déployer votre capital initial (C₀) de manière progressive et sécurisée sur 3 à 6 mois :</p>

  <table>
    <thead>
      <tr>
        <th>Phase</th>
        <th>Timing</th>
        <th>Action</th>
        <th>Capital déployé</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Phase 1 — Première ligne</strong></td>
        <td>Mois 1</td>
        <td>Investir 25 à 30 % du capital initial sur votre conviction la plus forte (Blue Chip liquidité + fondamentaux excellents)</td>
        <td>25–30 % de C₀</td>
      </tr>
      <tr>
        <td><strong>Phase 2 — Diversification</strong></td>
        <td>Mois 2–3</td>
        <td>Ajouter 2 nouvelles lignes dans des secteurs différents du premier titre. Chaque ligne = 15–20 % du capital.</td>
        <td>30–40 % de C₀</td>
      </tr>
      <tr>
        <td><strong>Phase 3 — Consolidation</strong></td>
        <td>Mois 4–5</td>
        <td>Analyser les performances initiales. Renforcer les lignes positives ou ajouter une 4ème ligne dans un secteur encore absent.</td>
        <td>20–25 % de C₀</td>
      </tr>
      <tr>
        <td><strong>Phase 4 — Réserve stratégique</strong></td>
        <td>Permanent</td>
        <td>Conserver 10–15 % en liquidités (cash). Ce trésor de guerre sert à saisir les opportunités lors des corrections de marché.</td>
        <td>10–15 % de C₀</td>
      </tr>
    </tbody>
  </table>

  <div class="info-box">
    <h3>💡 Conseil DCA</h3>
    <p>En parallèle du capital initial, votre versement mensuel DCA vient régulièrement renforcer les meilleures lignes ou ouvrir de nouvelles positions. Le DCA est le moteur de croissance de votre portefeuille dans le temps (M11).</p>
  </div>
</div>

<div class="section-purple">
  <h2>⚠️ 16.5 — Les 7 Erreurs du Débutant à Éviter Absolument</h2>

  <p>La connaissance des pièges est aussi précieuse que la connaissance des opportunités. Voici les 7 erreurs qui détruisent les portefeuilles débutants dans les 6 premiers mois — et comment les éviter.</p>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>L'Erreur</th>
        <th>La Conséquence</th>
        <th>L'Antidote</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Investir son fonds d'urgence</td>
        <td>Vente forcée au pire moment en cas de besoin urgent d'argent</td>
        <td>Respecter la Règle des 3 Enveloppes (16.1.1)</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Tout mettre sur un seul titre</td>
        <td>Un seul choc spécifique détruit l'ensemble du portefeuille</td>
        <td>5 à 10 lignes dans des secteurs différents (M11)</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Suivre les "tuyaux" sans analyser</td>
        <td>Achat de titres surévalués ou en déclin sur conseil d'amis ou réseaux sociaux</td>
        <td>Appliquer les 4 filtres systématiquement (16.2)</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Paniquer et vendre lors d'une baisse</td>
        <td>Transformation d'une perte latente en perte réelle — on vend souvent au plus bas</td>
        <td>Avoir un Plan défini avant d'acheter (Stop-Loss + horizon M6)</td>
      </tr>
      <tr>
        <td>5</td>
        <td>Ignorer les frais de courtage</td>
        <td>Les frais érodent la performance, surtout sur les petites lignes et les ordres fréquents</td>
        <td>Calculer le seuil de rentabilité après frais avant chaque ordre</td>
      </tr>
      <tr>
        <td>6</td>
        <td>Ne pas définir de seuils d'alerte personnels</td>
        <td>On "tient" une ligne perdante indéfiniment par espoir (biais d'ancrage M6) — sans règle définie, l'émotion prend le dessus</td>
        <td>Avant chaque achat, noter par écrit son seuil de perte acceptable et son objectif de valorisation dans son journal de bord</td>
      </tr>
      <tr>
        <td>7</td>
        <td>Vouloir s'enrichir vite (over-trading)</td>
        <td>Accumulation de frais, d'erreurs émotionnelles et de pertes réalisées prématurément</td>
        <td>DCA mensuel + patience. La BRVM récompense la durée, pas la fréquence.</td>
      </tr>
    </tbody>
  </table>

  <div class="citation-box">
    <p>"La bourse est un mécanisme de transfert de l'argent des impatients vers les patients." — Warren Buffett</p>
  </div>
</div>

<div class="section-blue">
  <h2>✅ 16.6 — La Check-List du Premier Investisseur BRVM</h2>

  <p>Avant de passer votre tout premier ordre d'achat, cochez chacun de ces points. Si l'un d'eux est rouge, <strong>ne passez pas encore à l'action</strong>.</p>

  <table>
    <thead>
      <tr>
        <th>☐</th>
        <th>Vérification</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>☐</td><td>Mon fonds d'urgence (3–6 mois de dépenses) est constitué et hors bourse.</td></tr>
      <tr><td>☐</td><td>J'ai défini mon enveloppe d'investissement réelle (capital initial + DCA mensuel).</td></tr>
      <tr><td>☐</td><td>Mon compte SGI est ouvert et mon dépôt initial est disponible.</td></tr>
      <tr><td>☐</td><td>J'ai appliqué les 4 filtres à ma shortlist et retenu 5 à 10 valeurs.</td></tr>
      <tr><td>☐</td><td>Pour mon premier achat, j'ai choisi un Blue Chip liquide du BRVM 10.</td></tr>
      <tr><td>☐</td><td>J'ai calculé ma taille de position avec la règle du 1% (M12).</td></tr>
      <tr><td>☐</td><td>J'ai défini mon seuil d'alerte personnel (perte max acceptable) et mon objectif de valorisation, notés dans mon journal.</td></tr>
      <tr><td>☐</td><td>Mon premier achat ne dépasse pas 30 % de mon capital total.</td></tr>
      <tr><td>☐</td><td>Je conserve au moins 10 % en liquidités (trésor de guerre).</td></tr>
      <tr><td>☐</td><td>Je m'engage à ne pas regarder mon portefeuille plus d'une fois par semaine.</td></tr>
    </tbody>
  </table>

  <div class="key-points-box">
    <h3>🎓 À retenir</h3>
    <p>Cocher cette liste avant chaque nouvel achat — pas seulement le premier — est une discipline que les grands investisseurs maintiennent toute leur carrière. La rigueur ne disparaît pas avec l'expérience ; elle s'intègre à votre réflexe naturel.</p>
  </div>
</div>

<div class="section-green">
  <h2>🏆 16.7 — Conclusion : Votre Premier Pas est le Plus Important</h2>

  <p>Vous venez de parcourir la méthode complète pour construire votre premier portefeuille BRVM. La théorie est derrière vous — maintenant vient l'action.</p>

  <p>Retenez ceci : le premier portefeuille n'a pas besoin d'être parfait. Il doit être <strong>prudent, diversifié et structuré</strong>. La perfection viendra avec l'expérience, les erreurs surmontées et les marchés traversés.</p>

  <div class="citation-box">
    <p>"La seule façon d'apprendre à nager, c'est d'entrer dans l'eau. Mais on entre d'abord dans le petit bain." — Sagesse universelle de l'investisseur débutant</p>
  </div>

  <h3>🧭 Prochaines Étapes</h3>
  <ul>
    <li><strong>Dès maintenant</strong> : Ouvrez le simulateur AfriBourse et constituez votre portefeuille virtuel en appliquant les 4 filtres de sélection. Entraînez-vous pendant 4 à 8 semaines avant de passer au réel.</li>
    <li><strong>En parallèle</strong> : Commencez à tenir un journal de vos décisions d'investissement. Notez chaque achat simulé : pourquoi vous l'avez fait, votre seuil d'alerte personnel, votre objectif de valorisation, et ce qui s'est passé.</li>
    <li><strong>Quand vous êtes prêt</strong> : Ouvrez votre compte SGI réel, déployez votre capital initial selon le plan en 4 phases (section 16.3.2), et suivez votre portefeuille via le tableau de bord AfriBourse.</li>
  </ul>

  <div class="key-points-box">
    <h3>🏆 Félicitations !</h3>
    <p>Vous êtes désormais prêt(e) à poser votre premier acte concret d'investisseur sur la BRVM. Le voyage vers votre indépendance financière commence ici.</p>
  </div>
</div>
`,
  });


  console.log("Traitement des modules terminé.");
  await disconnectPrismaDatabase();
}

main().catch(async (e) => {
  console.error("Erreur fatale dans le script seed:", e);
  await disconnectPrismaDatabase();
  process.exit(1);
});