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

<div class="slide" data-slide="4">
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

<div class="slide" data-slide="3">
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

 <div class="border-l-4 border-blue-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">🏛️ 2.1 La BRVM : Une Bourse Unique au Monde</h2>

 <p class="text-lg mb-4 leading-relaxed">
 La <strong>BRVM (Bourse Régionale des Valeurs Mobilières)</strong> est une bourse régionale partagée par
 <strong>8 pays de l'UEMOA</strong> utilisant la même monnaie (le franc CFA) et la même banque centrale (la BCEAO).
 </p>

 <p class="text-base mb-3 leading-relaxed"><strong>Pays membres :</strong></p>
 <p class="text-base mb-4 leading-relaxed">🇧🇯 Bénin | 🇧🇫 Burkina Faso | 🇨🇮 Côte d'Ivoire | 🇬🇼 Guinée-Bissau | 🇲🇱 Mali | 🇳🇪 Niger | 🇸🇳 Sénégal | 🇹🇬 Togo</p>

 <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6">
 <p class="text-base mb-2 leading-relaxed"><strong>🏢 Architecture géographique :</strong></p>
 <ul class="list-disc ml-6 space-y-1">
 <li><strong>Siège de la BRVM :</strong> Abidjan (Côte d'Ivoire) — Où se déroulent les échanges</li>
 <li><strong>Siège du DC/BR :</strong> Cotonou (Bénin) — Où sont conservés vos titres</li>
 </ul>
 </div>

 <p class="text-base mb-4 leading-relaxed">
 La BRVM joue un double rôle essentiel :
 </p>
 <ul class="list-disc ml-6 mb-6 space-y-2">
 <li><strong>Pour les entreprises :</strong> Elle leur permet de lever des fonds auprès du grand public, sans dépendre uniquement des banques.</li>
 <li><strong>Pour les investisseurs :</strong> Elle offre un accès sécurisé et réglementé pour acheter ou revendre facilement des titres financiers.</li>
 </ul>

 <div class="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 my-6">
 <h3 class="text-xl font-bold text-amber-900 mb-3">🪶 L'analogie à retenir : Le Grand Marché Régional</h3>
 <p class="text-base mb-3 leading-relaxed">Imaginez un grand marché couvrant 8 villes, avec une seule monnaie, un seul système de sécurité et des règles communes.</p>
 <p class="text-base mb-2 leading-relaxed">Vous pouvez vendre vos produits dans n'importe quelle ville et acheter depuis n'importe où.</p>
 <p class="text-base font-semibold leading-relaxed">👉 C'est exactement ce que fait la BRVM pour les entreprises et les investisseurs de l'Afrique de l'Ouest.</p>
 </div>
 </div>

 <div class="border-l-4 border-green-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">⚙️ 2.2 Les Trois Piliers Institutionnels du Marché</h2>
 <p class="text-lg mb-4 leading-relaxed">Le marché financier régional repose sur <strong>trois institutions clés</strong> qui travaillent ensemble pour assurer la sécurité, la transparence et la stabilité :</p>

 <div class="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6">
 <ul class="space-y-2 text-base">
 <li><strong>🏦 BCEAO</strong> — Assure la stabilité monétaire de la région</li>
 <li><strong>⚖️ AMF-UMOA</strong> — Régule le marché et protège les investisseurs</li>
 <li><strong>🔐 DC/BR</strong> — Conserve vos titres et sécurise les transactions</li>
 </ul>
 </div>

 <h3 class="text-xl font-bold text-gray-900 mb-3">🏦 2.2.1 BCEAO – Le Pilier Monétaire</h3>
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

 <h3 class="text-xl font-bold text-gray-900 mb-3">⚖️ 2.2.2 AMF-UMOA – Le Gendarme du Marché</h3>
 <p class="text-base mb-3 leading-relaxed">
 L'<strong>AMF-UMOA (Autorité des Marchés Financiers de l'UMOA)</strong> protège les investisseurs et veille à la transparence du marché.
 </p>
 <p class="text-base mb-3 leading-relaxed">Ses missions principales :</p>
 <ul class="list-disc ml-6 mb-4 space-y-2">
 <li><strong>Définir les règles du jeu</strong> — Fixe les normes que tous les acteurs doivent respecter</li>
 <li><strong>Approuver les introductions en bourse</strong> — Valide que les entreprises respectent les critères de transparence</li>
 <li><strong>Surveiller et sanctionner les abus</strong> — Détecte les manipulations de marché et les délits d'initiés</li>
 <li><strong>Agréer les acteurs financiers</strong> — SGI, fonds, conseillers doivent obtenir une licence</li>
 </ul>

 <p class="text-base mb-4 font-semibold leading-relaxed">
 👉 C'est votre <strong>bouclier réglementaire</strong>. Sans l'AMF-UMOA, la confiance dans le marché s'effondrerait.
 </p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">🔐 2.2.3 DC/BR – Le Notaire Digital du Marché</h3>
 <p class="text-base mb-3 leading-relaxed">
 Le <strong>DC/BR (Dépositaire Central/Banque de Règlement)</strong> est l'entité qui conserve vos titres et sécurise toutes les transactions financières.
 </p>

 <p class="text-base mb-3 leading-relaxed">Ses trois fonctions clés :</p>
 <ul class="list-disc ml-6 mb-4 space-y-2">
 <li><strong>Conservation des titres :</strong> Vos actions et obligations ne sont PAS stockées chez votre SGI, mais bien au DC/BR, dans un coffre-fort numérique ultra-sécurisé.</li>
 <li><strong>Règlement-livraison :</strong> Garantit le transfert simultané des titres ET de l'argent lors d'une transaction (principe "Delivery versus Payment").</li>
 <li><strong>Banque de règlement :</strong> Gère les flux financiers entre toutes les SGI pour assurer la fluidité du marché.</li>
 </ul>

 <div class="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 my-6">
 <h3 class="text-lg font-bold text-purple-900 mb-3">🪶 L'analogie à retenir : Le Notaire Digital</h3>
 <p class="text-base mb-2 leading-relaxed">Quand vous achetez une maison, c'est le notaire qui conserve les titres de propriété et garantit que l'argent et la propriété changent de main en toute sécurité.</p>
 <p class="text-base font-semibold leading-relaxed">👉 Le DC/BR joue exactement ce rôle pour vos titres financiers.</p>
 </div>
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

 <div class="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 my-6">
 <p class="text-base font-bold mb-2 leading-relaxed">💡 Principe fondamental :</p>
 <p class="text-lg font-semibold leading-relaxed">Acheter une action = devenir <strong>copropriétaire</strong> de l'entreprise.</p>
 <p class="text-base mt-2 leading-relaxed">Vous partagez ses profits (dividendes) et sa croissance (plus-value).</p>
 </div>
 </div>

 <div class="border-l-4 border-purple-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">⚙️ 2.5 Les SGI – Votre Intermédiaire Officiel</h2>

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

 <div class="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 my-6">
 <h3 class="text-xl font-bold text-amber-900 mb-3">🪶 L'analogie à retenir : Le Taxi-Moto Boursier</h3>
 <p class="text-base mb-3 leading-relaxed">Vous voulez aller au marché central (la BRVM), mais vous ne pouvez pas y aller à pied.</p>
 <p class="text-base mb-2 leading-relaxed">Vous prenez un taxi-moto (la SGI) qui connaît les routes, les raccourcis et les règles de circulation.</p>
 <p class="text-base font-semibold leading-relaxed">👉 La SGI est votre véhicule pour naviguer sur le marché en toute sécurité.</p>
 </div>

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

 <div class="border-l-4 border-pink-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">🌐 2.6 Autres Acteurs Clés de l'Écosystème</h2>

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
 Ils diffusent l'information financière, analysent les entreprises et contribuent à la transparence du marché. Exemples : AfriBourse (😉), Financial Afrik, Investir au Cameroun, etc.
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
 <li>Forte volatilité possible.</li>
 <li>Risque de faillite (actionnaires payés en dernier).</li>
 <li>Dividendes non garantis.</li>
 </ul>
 </div>
 </div>

 <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
 <p class="text-gray-700"><strong>Exemple BRVM :</strong> SONATEL offre historiquement des dividendes élevés ; BOA Mali propose un rendement plus stable avec moins de volatilité.</p>
 </div>

 <div class="bg-blue-50 p-4 rounded-lg text-blue-800 font-medium text-center">
 🎓 <strong>À retenir :</strong> Acheter une action, c’est parier sur la croissance future d’une entreprise.
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">3.2 Les Obligations — Prêter à une entreprise ou à l’État</h2>
 <p class="text-gray-600 mb-6">Une obligation est un titre de créance : vous prêtez de l'argent à un émetteur en échange d’intérêts fixes sur une durée définie.</p>

 <div class="grid md:grid-cols-2 gap-6 mb-6">
 <div>
 <h3 class="font-bold text-gray-800 mb-2">💰 Fonctionnement</h3>
 <ul class="list-disc list-inside space-y-1 text-gray-600">
 <li>Versement de coupons annuels (intérêts).</li>
 <li>Remboursement du capital à l’échéance.</li>
 </ul>
 </div>
 <div>
 <h3 class="font-bold text-gray-800 mb-2">🧭 Types d'obligations à la BRVM</h3>
 <ul class="list-disc list-inside space-y-1 text-gray-600">
 <li><strong>Obligations d’État</strong> : très sécurisées.</li>
 <li><strong>Obligations d’entreprise</strong> : rendement plus élevé, risque modéré.</li>
 </ul>
 </div>
 </div>

 <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
 <h3 class="font-bold text-gray-800 mb-2">📊 Exemple BRVM</h3>
 <ul class="list-disc list-inside text-gray-700">
 <li>État du Sénégal 6,5% 2028</li>
 <li>Oragroup 5,75% 2027</li>
 </ul>
 </div>

 <div class="bg-blue-50 p-4 rounded-lg text-blue-800 font-medium text-center">
 🎓 <strong>À retenir :</strong> Une obligation est un prêt avec rendement stable et risque limité.
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">3.3 Les OPCVM et ETF — Investissement collectif intelligent</h2>
 <p class="text-gray-600 mb-6">Les OPCVM regroupent l’argent de plusieurs investisseurs pour constituer un portefeuille diversifié, géré par des professionnels.</p>
 
 <div class="grid md:grid-cols-3 gap-4 mb-6">
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-gray-800 mb-2">📦 Deux familles</h3>
 <ul class="list-disc list-inside text-sm text-gray-600">
 <li><strong>FCP</strong> : fonds communs de placement.</li>
 <li><strong>SICAV</strong> : sociétés d’investissement à capital variable.</li>
 </ul>
 </div>
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-gray-800 mb-2">🪙 Avantages</h3>
 <ul class="list-disc list-inside text-sm text-gray-600">
 <li>Diversification immédiate.</li>
 <li>Gestion professionnelle.</li>
 <li>Accessibilité avec un petit capital.</li>
 </ul>
 </div>
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-gray-800 mb-2">📈 ETF</h3>
 <p class="text-sm text-gray-600">Répliquent un indice (ex: BRVM 10). Encore rares dans l'UEMOA, c'est le futur de l'investissement passif.</p>
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
 <p class="text-gray-600 text-sm leading-relaxed">Division des actions pour les rendre plus accessibles. <br><span class="italic text-gray-500">Exemple : 1 action à 30 000 FCFA devient 10 à 3 000 FCFA.</span></p>
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

 <div class="bg-indigo-50 p-8 rounded-xl border-2 border-indigo-100">
 <h2 class="text-2xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
 🧠 Atelier Pratique — “Action vs Obligation”
 </h2>
 
 <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
 <p class="font-semibold text-gray-800 mb-2">Situation :</p>
 <p class="text-gray-600 mb-4">Vous avez 1 000 000 FCFA et hésitez entre :</p>
 <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4">
 <li>Actions SONATEL (cours 15 000 FCFA, dividende 5%)</li>
 <li>Obligation État du Sénégal 6% sur 5 ans</li>
 </ul>
 </div>

 <div>
 <p class="font-semibold text-indigo-900 mb-2">Exercice :</p>
 <ol class="list-decimal list-inside space-y-2 text-indigo-800 ml-4">
 <li>Calculez le revenu annuel attendu de chaque option.</li>
 <li>Comparez les risques.</li>
 <li>Choisissez selon votre profil (croissance vs stabilité).</li>
 </ol>
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
 <p class="text-white font-medium">🚀 Prochaine étape : Module 4 — “Le Temps, votre meilleur allié”</p>
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
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-orange-600 to-amber-700 text-white p-8 rounded-2xl shadow-lg">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
 🎯 Objectif Pédagogique
 </h2>
 <p class="text-lg mb-6 text-orange-50">À la fin de ce module, vous comprendrez :</p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Les grandes familles d'actifs émergentes</strong> dans la région UEMOA.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Comment elles diffèrent</strong> des actions et obligations classiques.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Pourquoi elles représentent le futur</strong> de la finance africaine.
 </li>
 </ul>
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
 🔍 <strong>Cas régional :</strong> Dans l’UEMOA, la SCPI est encore marginale, mais des initiatives émergent, notamment via les futurs OPCI.
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

 <div class="bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-8 rounded-2xl shadow-lg">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
 ⏳ Module 5 : Le Temps, Votre Meilleur Allié
 </h2>
 <p class="text-lg mb-6 text-teal-50">
 Définir ses Objectifs et son Horizon. À la fin de ce module, vous serez capable de : 
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Définir précisément votre horizon de placement</strong> (court, moyen, long terme) en fonction de vos objectifs. 
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Comprendre le rôle du temps</strong> pour gérer le risque et la volatilité. 
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Établir votre profil d'investisseur</strong> et déterminer l'allocation d'actifs cohérente. 
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-teal-100 pb-2 flex items-center gap-2">
 🎯 5.1 Définir ses objectifs de vie et d’investissement
 </h2>
 
 <p class="text-gray-600 mb-4">
 La bourse n'est pas un jeu, c'est un outil pour réaliser vos projets de vie. Avant de choisir un titre, vous devez définir la durée pendant laquelle vous pouvez vous passer de cet argent. 
 </p>

 
 <div class="mb-6">
 <h3 class="text-lg font-bold text-teal-700 mb-2">L'Horizon de Placement</h3>
 <p class="text-gray-600 mb-4">
 C'est la période pendant laquelle vous prévoyez de garder votre investissement. Cette durée dicte le niveau de risque que vous pouvez vous permettre. 
 </p>
 </div>

 <div class="overflow-x-auto mb-6">
 <table class="min-w-full divide-y divide-gray-200 text-sm">
 <thead class="bg-teal-50">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-teal-900">Horizon</th>
 <th class="px-4 py-3 text-left font-bold text-teal-900">Durée</th>
 <th class="px-4 py-3 text-left font-bold text-teal-900">Objectif Typique</th>
 <th class="px-4 py-3 text-left font-bold text-teal-900">Allocation Recommandée</th>
 </tr>
 </thead>
 <tbody class="bg-white divide-y divide-gray-200">
 <tr>
 <td class="px-4 py-3 font-bold">Court Terme</td>
 <td class="px-4 py-3">Moins de 2 ans</td>
 <td class="px-4 py-3">Fonds d'urgence, scolarité</td>
 <td class="px-4 py-3 text-gray-500">Minimal (Obligations, sécurisé)</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold">Moyen Terme</td>
 <td class="px-4 py-3">2 à 7 ans</td>
 <td class="px-4 py-3">Auto, apport immobilier</td>
 <td class="px-4 py-3 text-yellow-600">Modéré (Mixte Actions/Obligations)</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold">Long Terme</td>
 <td class="px-4 py-3">Plus de 7 ans</td>
 <td class="px-4 py-3">Retraite, indépendance</td>
 <td class="px-4 py-3 text-green-600 font-bold">Croissance (Majorité Actions)</td>
 </tr>
 </tbody>
 </table>
 
 </div>

 <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
 <p class="text-yellow-800">
 <strong>💡 Conseil d'Expert :</strong> Chaque grand objectif de vie (retraite, études, maison) doit être traité comme un compte d'investissement séparé, avec son propre horizon. 
 </p>
 </div>
 </div>

 <div class="bg-indigo-900 text-white p-8 rounded-xl shadow-md relative overflow-hidden">
 <div class="relative z-10">
 <h2 class="text-2xl font-bold mb-4 text-indigo-200">
 🚌 5.1.2 Le Pouvoir du Temps : L'Analogie du Car de Nuit 
 </h2>
 
 <div class="grid md:grid-cols-2 gap-8 items-center">
 <div>
 <h3 class="font-bold text-white mb-2">La Volatilité (Les secousses)</h3>
 <p class="text-indigo-100 mb-4 text-sm leading-relaxed">
 À court terme, les marchés peuvent être erratiques. Si vous regardez par la fenêtre, le paysage est flou et scintillant (volatilité quotidienne). Vous ne voyez que les secousses.
 </p>
 
 <h3 class="font-bold text-white mb-2">La Destination (Long terme)</h3>
 <p class="text-indigo-100 text-sm leading-relaxed">
 Historiquement, les marchés ont toujours eu une tendance haussière sur des décennies. Si vous fixez l'horloge et la destination, vous savez que vous arriverez à bon port malgré les cahots. 
 </p>
 </div>
 <div class="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
 <p class="text-center text-sm mt-2 italic text-indigo-200">
 "L'investisseur à long terme se concentre sur la destination, pas sur les secousses." 
 </p>
 </div>
 </div>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-teal-100 pb-2 flex items-center gap-2">
 ⚖️ 5.2 Lien entre horizon et allocation 
 </h2>

 <div class="mb-6">
 <p class="text-gray-600 mb-4">
 Votre profil est défini par votre <strong>tolérance au risque</strong> : votre capacité émotionnelle (accepter le stress) et financière (ne pas avoir besoin de l'argent) à subir une perte. 
 </p>
 <blockquote class="border-l-4 border-teal-500 pl-4 italic text-gray-600 my-4 bg-gray-50 py-2 pr-2 rounded-r">
 “If you aren't willing to own a stock for ten years, don't even think about owning it for ten minutes.” — Warren Buffett 
 </blockquote>
 </div>

 
 <h3 class="text-lg font-bold text-teal-700 mb-3 mt-6">Les Trois Profils d'Investisseur </h3>
 <div class="overflow-x-auto">
 <table class="min-w-full divide-y divide-gray-200">
 <thead class="bg-gray-50">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-gray-600">Profil</th>
 <th class="px-4 py-3 text-left font-bold text-gray-600">Tolérance Risque</th>
 <th class="px-4 py-3 text-left font-bold text-gray-600">Allocation Typique</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-200 text-sm">
 <tr class="hover:bg-gray-50">
 <td class="px-4 py-3 font-bold text-blue-600">🛡️ Prudent</td>
 <td class="px-4 py-3">Faible (Perte max 10%)</td>
 <td class="px-4 py-3">Majorité Obligations (ex: 80%)</td>
 </tr>
 <tr class="hover:bg-gray-50">
 <td class="px-4 py-3 font-bold text-yellow-600">⚖️ Équilibré</td>
 <td class="px-4 py-3">Moyenne (Perte max 15%)</td>
 <td class="px-4 py-3">Mixte Actions/Oblig. (50/50)</td>
 </tr>
 <tr class="hover:bg-gray-50">
 <td class="px-4 py-3 font-bold text-red-600">🚀 Dynamique</td>
 <td class="px-4 py-3">Élevée (Tolère 30%+)</td>
 <td class="px-4 py-3">Majorité Actions (80%+)</td>
 </tr>
 </tbody>
 </table>
 
 </div>

 <div class="mt-4 bg-teal-50 p-4 rounded-lg text-sm text-teal-900">
 <strong>Exemple :</strong> Mamadou (25 ans, retraite) est <strong>Dynamique</strong>. Mamadou (55 ans, achat maison dans 3 ans) est <strong>Prudent</strong>.
 </div>
 </div>

 <div class="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
 📝 5.3 Exercice Pratique : Quel est votre profil ?
 </h2>

 <div class="space-y-6">
 <div class="bg-white p-4 rounded-lg shadow-sm">
 <h3 class="font-bold text-gray-800 mb-2">1. Question Émotionnelle </h3>
 <p class="text-gray-600 mb-3">Votre portefeuille perd 20% en un mois (1M FCFA devient 800k). Que faites-vous ?</p>
 <ul class="space-y-2 text-sm">
 <li class="flex items-center gap-2">
 <span class="w-6 h-6 rounded-full border flex items-center justify-center text-gray-500">A</span>
 Je vends tout pour sauver les meubles. <span class="font-bold text-blue-600">→ Prudent</span> 
 </li>
 <li class="flex items-center gap-2">
 <span class="w-6 h-6 rounded-full border flex items-center justify-center text-gray-500">B</span>
 Je stresse mais j'attends. <span class="font-bold text-yellow-600">→ Équilibré</span> 
 </li>
 <li class="flex items-center gap-2">
 <span class="w-6 h-6 rounded-full border flex items-center justify-center text-gray-500">C</span>
 J'achète plus à bas prix ! <span class="font-bold text-red-600">→ Dynamique</span> 
 </li>
 </ul>
 </div>

 <div class="bg-white p-4 rounded-lg shadow-sm">
 <h3 class="font-bold text-gray-800 mb-2">Synthèse de la Stratégie </h3>
 <div class="overflow-x-auto">
 <table class="min-w-full text-sm">
 <thead class="bg-gray-100 text-gray-600">
 <tr>
 <th class="px-2 py-1 text-left">Objectif</th>
 <th class="px-2 py-1 text-left">Horizon</th>
 <th class="px-2 py-1 text-left">Allocation (Exemple BRVM)</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-100">
 <tr>
 <td class="px-2 py-2 font-medium">Fonds d'Urgence</td>
 <td class="px-2 py-2">< 1 an</td>
 <td class="px-2 py-2">100% Liquide / Banque</td>
 </tr>
 <tr>
 <td class="px-2 py-2 font-medium">Études enfants</td>
 <td class="px-2 py-2">10-15 ans</td>
 <td class="px-2 py-2">60% Actions / 40% Oblig. (Sonatel, Ecobank)</td>
 </tr>
 <tr>
 <td class="px-2 py-2 font-medium">Retraite</td>
 <td class="px-2 py-2">20 ans +</td>
 <td class="px-2 py-2">80% Actions (Fort potentiel)</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>

 <div class="bg-teal-900 text-teal-50 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-white mb-4">🧠 Les Termes à Maîtriser </h2>
 <div class="grid md:grid-cols-2 gap-4 text-sm mb-8">
 <div>
 <strong class="text-white">Horizon de Placement :</strong> La durée de détention prévue de l'actif. 
 </div>
 <div>
 <strong class="text-white">Volatilité :</strong> L'intensité des variations de prix. 
 </div>
 <div>
 <strong class="text-white">Allocation d'Actifs :</strong> Répartition du capital (Actions vs Obligations). 
 </div>
 </div>
 
 <hr class="border-teal-700 my-6"/>
 
 <div class="text-center">
 <h3 class="text-xl font-bold text-white mb-2">Félicitations ! 🎉</h3>
 <p class="mb-6">Vous savez désormais que le temps est votre plus grand atout. </p>
 <div class="inline-block bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg transition-colors font-bold shadow-lg cursor-pointer">
 👉 Prochaine leçon : Module 6 — Le Mental du Gagnant 
 </div>
 </div>
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

 <div class="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-8 rounded-2xl shadow-lg">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
 💭 Module 6 : Le Mental du Gagnant
 </h2>
 <p class="text-lg mb-6 text-purple-100">
 Psychologie d’Investissement. À la fin de ce module, vous serez capable de :
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Comprendre les principes de la finance comportementale</strong> et distinguer l'investissement de la spéculation.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Identifier les biais cognitifs et émotionnels</strong> (peur, avidité) pour éviter les pièges.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Utiliser le pouvoir des intérêts composés</strong> pour bâtir une vision long terme.
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-purple-100 pb-2 flex items-center gap-2">
 🧠 6.1 Introduction à la finance comportementale
 </h2>
 
 <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-purple-500 mb-6">
 <p class="text-gray-700 italic">
 "Sur les marchés financiers, la plus grande menace pour votre portefeuille n'est pas la crise économique, mais l'homme qui se regarde dans le miroir : <strong>vous-même</strong>." 
 </p>
 </div>

 <h3 class="text-lg font-bold text-purple-800 mb-4">Investir vs. Spéculer : Une Distinction Essentielle</h3>
 
 <div class="overflow-x-auto mb-6">
 <table class="min-w-full divide-y divide-gray-200 text-sm">
 <thead class="bg-purple-50">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-purple-900">Caractéristique</th>
 <th class="px-4 py-3 text-left font-bold text-purple-900">L'Investisseur (Propriétaire)</th>
 <th class="px-4 py-3 text-left font-bold text-purple-900">Le Spéculateur (Joueur)</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-200">
 <tr>
 <td class="px-4 py-3 font-bold text-gray-600">Objectif</td>
 <td class="px-4 py-3">Acquérir une part d’entreprise (Valeur interne) </td>
 <td class="px-4 py-3">Parier sur le prix à court terme </td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-600">Horizon</td>
 <td class="px-4 py-3 text-green-600 font-bold">Long terme (années) </td>
 <td class="px-4 py-3 text-red-500 font-bold">Court terme (jours) </td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-gray-600">Moteur</td>
 <td class="px-4 py-3">Patience, fondamentaux </td>
 <td class="px-4 py-3">Excitation ou Panique </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-purple-100 pb-2 flex items-center gap-2">
 🎭 6.2 Nos pires ennemis : Émotions et Biais
 </h2>

 <div class="grid md:grid-cols-2 gap-6 mb-8">
 <div class="bg-rose-50 p-5 rounded-xl border border-rose-100">
 <h3 class="text-lg font-bold text-rose-800 mb-2 flex items-center gap-2">😨 La Peur (Fear)</h3>
 <p class="text-sm text-gray-700 mb-2">Vous pousse à vendre lorsque les prix baissent.</p>
 <p class="text-xs font-bold text-rose-700">Conséquence : Transforme une perte temporaire en perte réelle.</p>
 </div>
 <div class="bg-amber-50 p-5 rounded-xl border border-amber-100">
 <h3 class="text-lg font-bold text-amber-800 mb-2 flex items-center gap-2">🤑 L'Avidité (Greed)</h3>
 <p class="text-sm text-gray-700 mb-2">Vous pousse à acheter cher par peur de manquer le gain (FOMO).</p>
 <p class="text-xs font-bold text-amber-700">Conséquence : Achat de titres surévalués.</p>
 </div>
 </div>

 <h3 class="text-lg font-bold text-purple-800 mb-4">Les Biais Cognitifs Fréquents</h3>
 <div class="space-y-4">
 <div class="flex items-start gap-3">
 <div class="bg-purple-100 p-2 rounded text-purple-600 mt-1">1</div>
 <div>
 <strong class="text-gray-800">Le Biais de Confirmation :</strong> Chercher uniquement les infos qui confortent votre choix initial.
 </div>
 </div>
 <div class="flex items-start gap-3">
 <div class="bg-purple-100 p-2 rounded text-purple-600 mt-1">2</div>
 <div>
 <strong class="text-gray-800">L'Ancrage :</strong> Rester figé sur le prix d'achat initial, ce qui empêche de vendre un titre perdant.
 </div>
 </div>
 <div class="flex items-start gap-3">
 <div class="bg-purple-100 p-2 rounded text-purple-600 mt-1">3</div>
 <div>
 <strong class="text-gray-800">L'Excès de Confiance :</strong> Surestimer sa capacité à "battre le marché".
 </div>
 </div>
 </div>
 </div>

 <div class="bg-indigo-900 text-white p-8 rounded-xl shadow-md">
 <h2 class="text-2xl font-bold mb-4 text-indigo-100 flex items-center gap-2">
 📈 6.3 La 8ème Merveille du Monde : Les Intérêts Composés
 </h2>
 
 <div class="grid md:grid-cols-2 gap-8 items-center">
 <div>
 <p class="text-indigo-100 mb-4 leading-relaxed">
 C'est l'argent qui travaille pour l'argent. Les gains sont réinvestis pour générer de nouveaux gains.
 </p>
 <div class="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20 text-center font-mono text-sm mb-4">
 $$ \text{Capital} \times (1 + \text{Taux})^{\text{Années}} $$
 </div>
 <div class="bg-green-600/20 p-4 rounded-lg border border-green-500/30">
 <h4 class="font-bold text-green-300 mb-1">🌳 Analogie du Baobab</h4>
 <p class="text-sm text-indigo-100">Un baobab grandit lentement au début, puis sa croissance accélère massivement. C'est le temps, pas l'effort, qui crée sa majesté.</p>
 </div>
 </div>
 <div class="bg-white/5 p-2 rounded-lg">
 </div>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-purple-100 pb-2">
 🛡️ Antidotes et Stratégies
 </h2>

 <div class="grid md:grid-cols-3 gap-4 mb-8">
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-indigo-700 mb-2">💎 Value Investing</h3>
 <p class="text-sm text-gray-600">Acheter des "bonnes affaires" en dessous de leur valeur réelle (Style Warren Buffett).</p>
 </div>
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-indigo-700 mb-2">🚀 Growth Investing</h3>
 <p class="text-sm text-gray-600">Acheter des entreprises à forte croissance, même si elles semblent chères.</p>
 </div>
 <div class="bg-gray-50 p-4 rounded-lg">
 <h3 class="font-bold text-indigo-700 mb-2">💰 Dividendes</h3>
 <p class="text-sm text-gray-600">Viser des revenus réguliers via des entreprises matures (Banques, Télécoms).</p>
 </div>
 </div>

 <div class="bg-red-50 p-5 rounded-xl border-l-4 border-red-500">
 <h3 class="font-bold text-red-800 mb-3">🚫 3 Erreurs à Éviter </h3>
 <ul class="list-disc list-inside space-y-1 text-red-700 text-sm">
 <li><strong>Timer le marché :</strong> Essayer de deviner le point le plus bas.</li>
 <li><strong>Manquer de diversification :</strong> Tout miser sur une seule action.</li>
 <li><strong>Vendre en Panique :</strong> Réagir émotionnellement à une baisse.</li>
 </ul>
 </div>
 </div>

 <div class="bg-gray-800 text-gray-300 p-8 rounded-xl border border-gray-700">
 <div class="max-w-3xl mx-auto text-center">
 <h3 class="text-xl font-bold text-white mb-4">Le Secret de la Maîtrise</h3>
 <blockquote class="text-lg italic text-gray-400 mb-6">
 "Be fearful when others are greedy and greedy only when others are fearful."
 </blockquote>
 <p class="text-white font-medium">
 En résumé : Quand le marché panique, c'est le moment d'acheter. Quand tout le monde s'emballe, c'est le moment d'être prudent.
 </p>
 </div>
 </div>

 <div class="bg-purple-900 text-purple-50 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-white mb-4">🧠 Les Termes à Maîtriser</h2>
 <div class="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm mb-8">
 <div class="flex flex-col">
 <strong class="text-white">Intérêts Composés</strong>
 <span class="opacity-80">Gains réinvestis pour produire de nouveaux gains.</span>
 </div>
 <div class="flex flex-col">
 <strong class="text-white">Biais Cognitif</strong>
 <span class="opacity-80">Erreur de jugement basée sur des émotions.</span>
 </div>
 <div class="flex flex-col">
 <strong class="text-white">Ancrage</strong>
 <span class="opacity-80">Rester bloqué sur son prix d'achat initial.</span>
 </div>
 <div class="flex flex-col">
 <strong class="text-white">Value Investing</strong>
 <span class="opacity-80">Acheter des titres sous-évalués.</span>
 </div>
 </div>
 
 <hr class="border-purple-700 my-6"/>
 
 <div class="flex flex-col md:flex-row items-center justify-between gap-4">
 <p class="font-medium">Vous avez le mental. Place à l'analyse !</p>
 <button class="bg-white text-purple-900 hover:bg-purple-50 font-bold px-6 py-3 rounded-lg transition-colors shadow-lg">
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
    title: ": Analyse Fondamentale – Devenir un Analyste Éclairé",
    slug: 'analyse-technique',
    description: "Décodez l'information des graphiques (chandeliers), identifiez les tendances et les niveaux psychologiques (Support et Résistance).",
    difficulty_level: 'intermediaire',
    content_type: 'article',
    duration_minutes: 20,
    order_index: 7,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-8 rounded-2xl shadow-lg">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
 🔍 Module 7 : Analyse Fondamentale
 </h2>
 <p class="text-lg mb-6 text-emerald-50">
 Devenir un Analyste Éclairé. À la fin de ce module, vous serez capable de :
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Lire et comprendre la logique</strong> des trois états financiers (Compte de Résultat, Bilan, Cash Flow).
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Calculer et interpréter les ratios clés</strong> (PER, ROE, Marge Nette) pour évaluer la santé financière.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Déterminer la valeur intrinsèque</strong> pour savoir si une action est chère ou bon marché.
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-emerald-100 pb-2 flex items-center gap-2">
 📑 7.1 Les Trois Piliers de l'Analyse
 </h2>
 
 <p class="text-gray-600 mb-6">
 Pour évaluer la santé d'une entreprise, vous avez besoin de ses trois états financiers. L'analyste étudie les tendances sur 5 ans.
 </p>

 
 <div class="grid md:grid-cols-3 gap-4 mb-6 mt-6">
 <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
 <h3 class="font-bold text-blue-800 mb-2">1. Compte de Résultat (P&L)</h3>
 <p class="text-xs font-bold text-gray-500 uppercase mb-2">Qu'est-ce qu'on gagne ?</p>
 <p class="text-sm text-gray-700">Mesure la <strong>performance</strong> sur une période. <br>Clé : Chiffre d'Affaires vs Bénéfice Net.</p>
 </div>
 <div class="bg-amber-50 p-4 rounded-xl border border-amber-100">
 <h3 class="font-bold text-amber-800 mb-2">2. Le Bilan</h3>
 <p class="text-xs font-bold text-gray-500 uppercase mb-2">Ce qu'on possède / doit ?</p>
 <p class="text-sm text-gray-700">Une <strong>photo à l'instant T</strong>. <br>Clé : Actifs = Passifs + Capitaux Propres.</p>
 </div>
 <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
 <h3 class="font-bold text-emerald-800 mb-2">3. Cash Flow (TFT)</h3>
 <p class="text-xs font-bold text-gray-500 uppercase mb-2">Où va l'argent ?</p>
 <p class="text-sm text-gray-700">Le plus <strong>honnête</strong>. Montre les mouvements réels de liquide (nécessaire pour les dividendes).</p>
 </div>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-emerald-100 pb-2 flex items-center gap-2">
 📊 7.2 & 7.3 Indicateurs et Ratios Clés
 </h2>

 <div class="space-y-8">
 <div>
 <h3 class="text-lg font-bold text-emerald-700 mb-2 flex items-center gap-2">
 📈 La Marge Nette (Rentabilité)
 </h3>
 <div class="bg-gray-50 p-3 rounded border border-gray-200 mb-2 font-mono text-center text-sm">
 $$ \text{Marge Nette} = \frac{\text{Bénéfice Net}}{\text{Chiffre d'Affaires}} $$
 </div>
 <p class="text-gray-600 text-sm">Une marge stable ou en hausse (ex: 15%) montre que l'entreprise contrôle ses coûts.</p>
 </div>

 <div>
 <h3 class="text-lg font-bold text-emerald-700 mb-2 flex items-center gap-2">
 ⚖️ Le Gearing (Dette)
 </h3>
 <div class="bg-gray-50 p-3 rounded border border-gray-200 mb-2 font-mono text-center text-sm">
 $$ \text{Gearing} = \frac{\text{Dette Nette}}{\text{Capitaux Propres}} $$
 </div>
 <div class="bg-red-50 border-l-4 border-red-500 p-3">
 <p class="text-sm text-red-800"><strong>Attention :</strong> Si Dette > Capitaux Propres, l'entreprise est vulnérable aux crises.</p>
 </div>
 </div>

 <div>
 <h3 class="text-lg font-bold text-emerald-700 mb-2 flex items-center gap-2">
 🏷️ Le PER (Prix)
 </h3>
 <p class="text-sm text-gray-600 mb-2">Combien on paie pour 1 FCFA de bénéfice.</p>
 <div class="grid grid-cols-2 gap-4 text-sm">
 <div class="bg-green-100 p-2 rounded text-center">
 <strong>PER 5-10</strong><br>Bonne affaire (Value)
 </div>
 <div class="bg-purple-100 p-2 rounded text-center">
 <strong>PER 20+</strong><br>Forte Croissance (Growth)
 </div>
 </div>
 <p class="text-xs text-gray-500 mt-2 italic">Note : À la BRVM, ne rejetez pas une action juste pour un PER élevé si le potentiel est fort.</p>
 </div>
 </div>
 </div>

 <div class="bg-slate-800 text-white p-8 rounded-xl shadow-md">
 <h2 class="text-2xl font-bold mb-4 text-emerald-400">
 🏆 Le ROE (L'Efficacité)
 </h2>
 <div class="grid md:grid-cols-2 gap-8 items-center">
 <div>
 <div class="bg-white/10 p-3 rounded border border-white/20 mb-4 font-mono text-center">
 $$ \text{ROE} = \frac{\text{Bénéfice Net}}{\text{Capitaux Propres}} $$
 </div>
 <p class="text-slate-200 text-sm mb-4">
 Indique combien de bénéfice est généré pour chaque 100 FCFA investi par les actionnaires. > 15% est excellent.
 </p>
 </div>
 <div class="bg-emerald-900/50 p-4 rounded-lg border border-emerald-500/30">
 <h4 class="font-bold text-emerald-300 mb-2">🥘 L'Analogie du Maquis</h4>
 <p class="text-sm text-slate-200 italic leading-relaxed">
 "Un maquis peut avoir de grosses ventes, mais s'il gaspille les ingrédients, il est inefficace. Le ROE mesure si le gérant transforme bien votre argent en profit." 
 </p>
 </div>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <h2 class="text-2xl font-bold text-gray-800 mb-6">⚔️ Étude de Cas : SONATEL vs ECOBANK</h2>
 
 <div class="overflow-x-auto">
 <table class="min-w-full text-sm divide-y divide-gray-200">
 <thead class="bg-gray-50">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-gray-600">Critère</th>
 <th class="px-4 py-3 text-left font-bold text-orange-600">SONATEL (Télécom)</th>
 <th class="px-4 py-3 text-left font-bold text-blue-600">ECOBANK CI (Banque)</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-100">
 <tr>
 <td class="px-4 py-3 font-medium">Profil</td>
 <td class="px-4 py-3">Dynamique / Croissance</td>
 <td class="px-4 py-3">Mature / Dividendes</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-medium">PER</td>
 <td class="px-4 py-3 font-bold text-purple-600">Élevé (Anticipation)</td>
 <td class="px-4 py-3 font-bold text-green-600">Faible (Régularité)</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-medium">ROE</td>
 <td class="px-4 py-3 text-green-600">Excellent (>20%)</td>
 <td class="px-4 py-3 text-green-600">Bon (>15%)</td>
 </tr>
 <tr class="bg-gray-50">
 <td class="px-4 py-3 font-bold">Conclusion</td>
 <td class="px-4 py-3">Pour la <strong>plus-value</strong> à long terme.</td>
 <td class="px-4 py-3">Pour le <strong>revenu passif</strong> immédiat.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <div class="bg-gray-900 text-gray-300 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-white mb-4">🧠 Glossaire Analyste</h2>
 <div class="grid md:grid-cols-2 gap-4 text-sm mb-8">
 <p><strong class="text-emerald-400">BPA :</strong> Bénéfice par Action. Base du PER.</p>
 <p><strong class="text-emerald-400">Valeur Intrinsèque :</strong> La "vraie" valeur estimée, hors prix bourse.</p>
 <p><strong class="text-emerald-400">DCF :</strong> Valorisation basée sur le cash futur (avancé).</p>
 <p><strong class="text-emerald-400">Comparables :</strong> Comparer les ratios avec les concurrents.</p>
 </div>
 
 <hr class="border-gray-700 my-6"/>
 
 <div class="flex flex-col md:flex-row items-center justify-between gap-4">
 <p class="font-medium text-white">Vous savez analyser. Mais savez-vous gérer le risque ?</p>
 <button class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg">
 👉 Module 8 : Maîtrise du Risque
 </button>
 </div>
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
 <div class="space-y-8">
 <div class="bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-8 rounded-xl">
 <h2 class="text-3xl font-bold mb-6">🎯 Objectif Pédagogique</h2>
 <p class="text-lg mb-4 leading-relaxed">À la fin de ce module, vous saurez :</p>
 <ul class="space-y-2 text-lg leading-relaxed">
 <li>• Comprendre la logique fondamentale de la valorisation basée sur l'actualisation (méthode DCF et DDM).</li>
 <li>• Identifier les paramètres clés : taux d'actualisation, taux de croissance, Valeur Terminale (VT) et mesurer leur impact.</li>
 <li>• Appliquer la méthode DDM pour valoriser des entreprises matures versant des dividendes réguliers (cas BRVM).</li>
 </ul>
 </div>

 <div class="border-l-4 border-blue-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">💡 8.1 Méthode DCF (Discounted Cash Flow) : Actualisation des Flux de Trésorerie</h2>
 <p class="text-base mb-4 leading-relaxed">La méthode DCF est la référence des analystes : la valeur d'une entreprise est la somme de ses flux de trésorerie futurs ramenés à aujourd'hui.</p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">8.1.1 Le principe de l'actualisation : Pourquoi aujourd'hui est mieux que demain</h3>
 <ul class="list-disc ml-6 mb-4 space-y-2">
 <li><strong>Valeur temps de l'argent :</strong> Un franc CFA reçu aujourd'hui vaut plus qu'un franc CFA reçu demain — pour deux raisons principales :
 <ul class="list-disc ml-6 mt-2 space-y-1">
 <li><em>Inflation</em> : le pouvoir d'achat diminue avec le temps.</li>
 <li><em>Coût d'opportunité</em> : l'argent non investi aujourd'hui ne génère pas d'intérêts composés (voir Module 6).</li>
 </ul>
 </li>
 <li><strong>Actualisation :</strong> opération mathématique ramenant les flux futurs à leur Valeur Actuelle Nette (VAN).</li>
 </ul>

 <h3 class="text-xl font-bold text-gray-900 mb-3">8.1.2 Les deux composantes du DCF</h3>
 <ol class="list-decimal ml-6 mb-4 space-y-2">
 <li><strong>Période de prévision explicite (5 à 10 ans)</strong>
 <ul class="list-disc ml-6 mt-2 space-y-1">
 <li>L'analyste projette les flux de trésorerie d'exploitation pour les 5–10 prochaines années (s'appuyer sur l'analyse fondamentale du Module 7).</li>
 <li><strong>Clé BRVM :</strong> rester prudent — le marché régional est sensible aux chocs (matières premières, politique).</li>
 </ul>
 </li>
 <li><strong>Valeur Terminale (VT)</strong>
 <ul class="list-disc ml-6 mt-2 space-y-1">
 <li>Représente la valeur au-delà de la période explicite (de l'an 11 à l'infini).</li>
 <li>Hypothèse : l'entreprise continue d'exister mais croît à un rythme stable et faible. La VT peut représenter 70–80 % de la valeur totale.</li>
 </ul>
 </li>
 </ol>

 <h3 class="text-xl font-bold text-gray-900 mb-3">8.1.3 Le taux d'actualisation (le WACC)</h3>
 <ul class="list-disc ml-6 mb-4 space-y-1">
 <li><strong>Rôle :</strong> coût moyen pondéré du capital — coût total du financement (dette + fonds propres).</li>
 <li><strong>Impact :</strong> plus le WACC est élevé, plus la valeur actuelle des flux est faible (risque perçu élevé).</li>
 </ul>

 <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg my-4">
 <p class="text-gray-700 mb-2"><strong>📝 Résumé du DCF :</strong></p>
 <div class="bg-gray-100 p-4 rounded-lg font-mono text-sm">
 <strong>Valeur intrinsèque</strong> = <em>∑<sub>t=1</sub><sup>N</sup> Flux de trésorerie<sub>t</sub> / (1 + WACC)<sup>t</sup></em> + VT<sub>N</sub> / (1 + WACC)<sup>N</sup>
 </div>
 </div>
 </div>

 <div class="border-l-4 border-green-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">💰 8.2 Méthode DDM (Dividend Discount Model) : Actualisation des dividendes</h2>
 <p class="text-base mb-4 leading-relaxed">Le DDM est pertinent pour les entreprises BRVM versant des dividendes stables et croissants (banques, télécoms, entreprises matures).</p>

 <h3 class="text-xl font-bold text-gray-900 mb-3">8.2.1 Le principe fondamental</h3>
 <ul class="list-disc ml-6 mb-4 space-y-1">
 <li>Postulat : la valeur d'une action = somme des dividendes futurs actualisés.</li>
 <li>Avantage : simplicité ; s'appuie sur le rendement de dividende observable sur la BRVM.</li>
 </ul>

 <h3 class="text-xl font-bold text-gray-900 mb-3">8.2.2 Le modèle de Gordon-Shapiro (DDM simplifié)</h3>
 <p class="text-base mb-3 leading-relaxed">Quand on suppose un taux de croissance des dividendes constant <em>g</em> :</p>
 <div class="bg-gray-100 p-4 rounded-lg font-mono text-sm mb-4">
 <strong>Prix de l'action</strong> = D<sub>1</sub> / (k − g)
 </div>
 <ul class="list-disc ml-6 mb-4 space-y-1">
 <li><strong>D<sub>1</sub> :</strong> dividende prévu pour l'année prochaine.</li>
 <li><strong>k :</strong> coût des fonds propres (taux d'actualisation, proche du WACC).</li>
 <li><strong>g :</strong> taux de croissance annuel constant des dividendes.</li>
 </ul>

 <h3 class="text-xl font-bold text-gray-900 mb-3">8.2.3 Application à la BRVM : l'intérêt pour les "Dividend Kings"</h3>
 <ul class="list-disc ml-6 mb-4 space-y-1">
 <li>Utiliser le DDM pour des entreprises matures et stables, où la croissance des dividendes est prévisible (ex. certaines banques, services publics).</li>
 <li>Ne pas l'appliquer si l'entreprise réinvestit massivement ses bénéfices ou est en forte croissance.</li>
 </ul>
 </div>

 <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">📊 8.3 Étapes clés pour la projection (synthèse)</h2>
 <p class="text-base mb-4 leading-relaxed">Transformer l'analyse fondamentale (Module 7) en une estimation monétaire requiert méthode et rigueur. Tableau synthétique :</p>
 <div class="overflow-x-auto">
 <table class="w-full border-collapse border border-gray-300 my-4">
 <thead class="bg-gray-100">
 <tr>
 <th class="border border-gray-300 px-4 py-2 text-left">Étape</th>
 <th class="border border-gray-300 px-4 py-2 text-left">Action de l'analyste</th>
 <th class="border border-gray-300 px-4 py-2 text-left">Risque émotionnel à éviter (Module 6)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td class="border border-gray-300 px-4 py-2">1. Projection de la croissance</td>
 <td class="border border-gray-300 px-4 py-2">Déterminer le taux de croissance du chiffre d'affaires et des marges</td>
 <td class="border border-gray-300 px-4 py-2">Biais d'excès de confiance (surestimer la croissance)</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-2">2. Estimation du risque</td>
 <td class="border border-gray-300 px-4 py-2">Déterminer le WACC (coût du capital)</td>
 <td class="border border-gray-300 px-4 py-2">Ignorer le risque spécifique du marché régional</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-2">3. Calcul de la valeur terminale</td>
 <td class="border border-gray-300 px-4 py-2">Déterminer la valeur au-delà de 10 ans</td>
 <td class="border border-gray-300 px-4 py-2">Utiliser un g trop élevé / gonfler artificiellement la VT</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-2">4. Comparaison</td>
 <td class="border border-gray-300 px-4 py-2">Comparer la valeur intrinsèque (DCF/DDM) au cours boursier</td>
 <td class="border border-gray-300 px-4 py-2">Ancrage sur le prix d'achat au lieu du calcul</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mt-4">
 <p class="text-gray-700">💡 <strong>Conclusion pratique :</strong> si le cours est nettement inférieur à votre valeur intrinsèque, vous disposez d'une <strong>marge de sécurité</strong> pour investir.</p>
 </div>
 </div>

 <div class="border-l-4 border-purple-600 pl-6 py-4">
 <h2 class="text-2xl font-bold text-gray-900 mb-4">🧠 Termes à maîtriser</h2>
 <div class="overflow-x-auto">
 <table class="w-full border-collapse border border-gray-300">
 <thead class="bg-gray-100">
 <tr>
 <th class="border border-gray-300 px-4 py-2 text-left">Terme</th>
 <th class="border border-gray-300 px-4 py-2 text-left">Définition</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td class="border border-gray-300 px-4 py-2"><strong>Actualisation</strong></td>
 <td class="border border-gray-300 px-4 py-2">Opération qui ramène une valeur future à sa valeur présente.</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-2"><strong>WACC (CMPC)</strong></td>
 <td class="border border-gray-300 px-4 py-2">Coût moyen pondéré du capital, taux utilisé pour actualiser les flux futurs.</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-2"><strong>Valeur intrinsèque</strong></td>
 <td class="border border-gray-300 px-4 py-2">La valeur estimée d'une entreprise par l'analyste.</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-2"><strong>Valeur terminale (VT)</strong></td>
 <td class="border border-gray-300 px-4 py-2">Valeur estimée de l'entreprise au-delà de la période de prévision explicite.</td>
 </tr>
 <tr>
 <td class="border border-gray-300 px-4 py-2"><strong>Marge de sécurité</strong></td>
 <td class="border border-gray-300 px-4 py-2">Différence positive entre la valeur intrinsèque et le prix du marché.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-8">
 <p class="text-gray-700"><strong>🧭 Prochaine étape :</strong> Vous avez le mental (Module 6) et les outils (Module 7 &amp; 8). Assurez-vous maintenant de protéger votre capital face aux risques identifiés.</p>
 </div>
 </div>
 `,
  });

  // ====================================================
  // === M9 : L’Analyse Extra-Financière – Comprendre le Contexte===
  // ====================================================
  await createOrUpdateModule({
    title: "L’Analyse Extra-Financière – Comprendre le Contexte",
    slug: 'contexte-economique',
    description: "Comprenez l'impact des indicateurs macroéconomiques (Inflation, Taux d'intérêt, PIB) et le rôle de la BCEAO sur la performance des entreprises BRVM.",
    difficulty_level: 'intermediaire',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 9,
    is_published: true,
    content: `
 <h2>9.1 Analyse Qualitative : Le cerveau de l’entreprise</h2>
<p>L’analyse qualitative répond à une question simple : <strong>l’entreprise est-elle bien gérée, bien positionnée et son modèle est-il durable ?</strong> 
C’est l’étape où l’on lit enfin le rapport annuel… mais pour le texte, pas pour les chiffres.</p>

<h3><strong>9.1.1 La Gouvernance : L’Équipe et la Direction</strong></h3>
<p>La qualité du management est souvent le facteur déterminant d’un investissement gagnant ou perdant.</p>
<ul>
 <li><strong>Leadership :</strong> Qui dirige l’entreprise ? Quelle est leur expérience ? Leur réputation inspire-t-elle confiance ?</li>
 <li><strong>Transparence et responsabilité :</strong> L’entreprise explique-t-elle clairement sa stratégie ? Le Conseil d’Administration est-il suffisamment indépendant ?</li>
 <li><strong>Alignement des intérêts :</strong> La rémunération des dirigeants dépend-elle de la performance long terme (et non du profit court terme) ?</li>
</ul>
<p><strong>Pourquoi c’est vital à la BRVM :</strong> Sur un marché moins couvert par les analystes, la qualité du management influence fortement le risque… et les opportunités.</p>

<h3><strong>9.1.2 Le Modèle Économique (Business Model)</strong></h3>
<p>Comprendre comment l’entreprise gagne de l’argent, et si elle pourra continuer à le faire dans 5, 10 ou 20 ans.</p>
<ul>
 <li><strong>Avantage concurrentiel (Moat) :</strong> Technologie propriétaire ? Coûts plus bas ? Position de monopole (ex : entreprises publiques) ?</li>
 <li><strong>Résilience :</strong> Le modèle peut-il supporter une crise, une nouvelle loi ou un choc sur les prix ?</li>
 <li><strong>Diversification :</strong> L’entreprise dépend-elle d’un seul produit ou d’un seul pays ? L’expansion régionale est un marqueur de solidité.</li>
</ul>

<h3><strong>9.1.3 Analyse du Secteur et de la Concurrence</strong></h3>
<ul>
 <li><strong>Positionnement :</strong> Leader, challenger ou suiveur ? Les leaders comme Sonatel disposent souvent d’un pouvoir de prix.</li>
 <li><strong>Barrières à l’entrée :</strong> Implantation d’une banque ? Construction d’une cimenterie ? Ce sont des secteurs difficiles à concurrencer.</li>
</ul>

<hr>

<h2>9.2 Focus UEMOA : Le Reporting ESG et la Finance Durable</h2>
<p>La performance financière ne suffit plus. Les critères <strong>ESG</strong> deviennent essentiels pour comprendre le risque global d’une entreprise.</p>

<h3><strong>9.2.1 Comprendre les critères ESG</strong></h3>
<p>L'analyse ESG évalue les risques et opportunités extra-financiers :</p>
<ul>
 <li><strong>E – Environnement :</strong> gestion des déchets, émissions carbone, consommation d’eau. Exemple : une cimenterie prépare-t-elle un plan de réduction CO₂ ?</li>
 <li><strong>S – Social :</strong> conditions de travail, sécurité, impact sur les communautés, politique RSE.</li>
 <li><strong>G – Gouvernance :</strong> lutte contre la corruption, transparence, indépendance du Conseil d’Administration.</li>
</ul>

<h3><strong>9.2.2 Le rôle du reporting et de l’AMF-UMOA</strong></h3>
<ul>
 <li><strong>Reporting RSE :</strong> de plus en plus d’entreprises BRVM publient des rapports RSE structurés.</li>
 <li><strong>Finance durable :</strong> l’UEMOA évolue vers les obligations vertes et les fonds ESG.</li>
</ul>
<p><strong>Avantage investisseur :</strong> Une entreprise bien classée ESG gère mieux ses risques, donc a plus de chances de performer à long terme.</p>

<hr>

<h2>9.3 Atelier : Étude de cas intégrée (Ratios + DCF + ESG)</h2>
<p>L’objectif est d’intégrer toutes les compétences apprises dans les modules 7, 8 et 9. 
L’atelier propose une analyse complète d’une entreprise BRVM (ex : Sonatel, Ecobank).</p>

<table>
<thead>
<tr>
 <th>Étape de l’Atelier</th>
 <th>Module Réf.</th>
 <th>Action Clé</th>
</tr>
</thead>
<tbody>
<tr>
 <td><strong>I. Examen Qualitatif</strong></td>
 <td>M9 (9.1)</td>
 <td>Évaluer le management, le business model et l’avantage compétitif.</td>
</tr>
<tr>
 <td><strong>II. Analyse de Performance</strong></td>
 <td>M7 (7.2 / 7.3)</td>
 <td>Calculer la croissance, le ROE, la marge nette.</td>
</tr>
<tr>
 <td><strong>III. Solvabilité et Endettement</strong></td>
 <td>M7 (7.3)</td>
 <td>Calculer le gearing et interpréter le risque.</td>
</tr>
<tr>
 <td><strong>IV. Valorisation par les Multiples</strong></td>
 <td>M7 (7.3)</td>
 <td>Calculer le PER et le comparer au secteur.</td>
</tr>
<tr>
 <td><strong>V. Valorisation par Projections</strong></td>
 <td>M8 (8.1 / 8.2)</td>
 <td>Appliquer le DDM (Gordon-Shapiro) si l’entreprise est mature.</td>
</tr>
<tr>
 <td><strong>VI. Analyse ESG et Risque</strong></td>
 <td>M9 (9.2)</td>
 <td>Interpréter les scores ESG et leur impact sur l’investissement.</td>
</tr>
<tr>
 <td><strong>VII. Conclusion</strong></td>
 <td>M5–M9</td>
 <td>Comparer valeur intrinsèque (V) et prix de marché (P) pour décider : Acheter / Conserver / Vendre.</td>
</tr>
</tbody>
</table>

<p><strong>Résultat attendu :</strong> être capable de rédiger une note d’analyse complète, structurée et argumentée.</p>

<hr>

<h2>🧭 Prochaine Étape</h2>
<p>Vous maîtrisez désormais l’analyse complète : chiffres, projections, contexte. 
Il est temps d’aborder le cœur de la gestion de portefeuille : <strong>la gestion du risque</strong>.</p>

 `,
  });

  // ====================================================
  // === M10 : L’Art du Timing – Analyse Technique et Lecture du Marché ===
  // ====================================================
  await createOrUpdateModule({
    title: "L’Art du Timing – Analyse Technique et Lecture du Marché",
    slug: 'passage-a-l-action',
    description: "Soyez 100% autonome pour choisir sa SGI, ouvrir son compte, passer ses premiers ordres d'achat, et comprendre les implications fiscales de son investissement à la BRVM.",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 20,
    order_index: 10,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8 rounded-2xl shadow-lg">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
 📉 Module 10 : L’Art du Timing
 </h2>
 <p class="text-lg mb-6 text-blue-100">
 Analyse Technique et Lecture du Marché. À la fin de ce module, vous serez capable de :
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Comprendre la philosophie de l'Analyse Technique (AT)</strong> et son rôle complémentaire au Fondamental.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Décoder les graphiques de prix</strong> (chandeliers, tendances, support/résistance).
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Utiliser les indicateurs techniques clés</strong> (Moyennes Mobiles, RSI) pour identifier les points d'entrée et de sortie.
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-blue-100 pb-2 flex items-center gap-2">
 🧭 10.1 Philosophie et Théorie de Dow
 </h2>
 
 <p class="text-gray-600 mb-4">
 L'Analyse Technique (AT) est l'étude des mouvements de prix historiques. Elle repose sur des postulats clés formalisés par la **Théorie de Dow**.
 </p>

 <h3 class="text-lg font-bold text-blue-700 mb-3">Les Postulats Fondamentaux de l'AT</h3>
 <ul class="space-y-3 pl-4">
 <li class="flex items-start gap-3">
 <span class="text-blue-500 font-bold mt-1">✓</span>
 <strong class="text-gray-800">Le marché actualise tout :</strong> Le prix reflète déjà toutes les informations (fondamentales, économiques, rumeurs).
 </li>
 <li class="flex items-start gap-3">
 <span class="text-blue-500 font-bold mt-1">✓</span>
 <strong class="text-gray-800">Les prix évoluent en tendances :</strong> Les mouvements ne sont pas aléatoires ; ils suivent des directions identifiables.
 </li>
 <li class="flex items-start gap-3">
 <span class="text-blue-500 font-bold mt-1">✓</span>
 <strong class="text-gray-800">L'histoire se répète :</strong> Les schémas de comportement humain (peur, avidité) entraînent la récurrence de configurations graphiques.
 </li>
 </ul>
 
 <div class="mt-6 bg-gray-50 p-4 rounded-lg border-l-4 border-yellow-500">
 <p class="text-gray-700">
 <strong class="text-yellow-800">Rôle pour l'Investisseur :</strong> L'Analyse Fondamentale (M7) vous dit **quoi acheter** (la valeur), l'Analyse Technique vous aide à déterminer **quand acheter ou vendre** (le timing).
 </p>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-blue-100 pb-2 flex items-center gap-2">
 📊 10.2 Chartisme et Lecture de Graphiques
 </h2>
 
 <h3 class="text-lg font-bold text-blue-700 mb-3">Les Chandeliers Japonais : Une Histoire d'Acheteurs et Vendeurs</h3>
 <p class="text-gray-600 mb-4">
 Chaque **chandelier** raconte l'histoire de la confrontation entre acheteurs et vendeurs sur une période donnée (jour, semaine).
 </p>
 
 

[Image of Japanese candlestick chart explained]


 <div class="grid md:grid-cols-2 gap-4 mb-6">
 <div class="bg-green-50 p-3 rounded-lg">
 <strong class="text-green-800">Corps Vert/Blanc :</strong> Prix a augmenté (Clôture > Ouverture). Domination des Acheteurs.
 </div>
 <div class="bg-red-50 p-3 rounded-lg">
 <strong class="text-red-800">Corps Rouge/Noir :</strong> Prix a diminué (Clôture < Ouverture). Domination des Vendeurs.
 </div>
 <div class="md:col-span-2">
 <p class="text-sm text-gray-600 mt-2">
 Les **Mèches (Ombres)** indiquent les extrêmes (haut et bas) atteints durant la période.
 </p>
 </div>
 </div>

 <h3 class="text-lg font-bold text-blue-700 mb-3 mt-4">Identifier les Tendances</h3>
 <div class="space-y-2 text-sm text-gray-600">
 <p>— **Tendance Haussière (Bullish)** : Sommets et creux de plus en plus hauts. (Acheter)</p>
 <p>— **Tendance Baissière (Bearish)** : Sommets et creux de plus en plus bas. (Vendre/Attendre)</p>
 <p>— **Tendance Neutre (Latérale)** : Prix dans une fourchette limitée. (Accumuler)</p>
 </div>

 <h3 class="text-lg font-bold text-blue-700 mb-3 mt-4">Support et Résistance (Niveaux Psychologiques)</h3>
 <div class="grid md:grid-cols-2 gap-4">
 <div class="bg-blue-50 p-4 rounded-lg">
 <strong class="text-blue-800">Support (Le Plancher) :</strong> Niveau où les acheteurs entrent, empêchant le prix de chuter davantage.
 </div>
 <div class="bg-red-50 p-4 rounded-lg">
 <strong class="text-red-800">Résistance (Le Plafond) :</strong> Niveau où les vendeurs sortent, empêchant le prix de monter.
 </div>
 </div>
 <div class="mt-4 text-sm text-gray-500 italic">
 <strong class="text-gray-600">Analogie :</strong> Le prix du Sac de Riz au marché a un prix minimal (Support) et maximal (Résistance) que le marché accepte.
 </div>
 
 

[Image of support and resistance levels on a stock chart]

 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-blue-100 pb-2 flex items-center gap-2">
 ⚙️ 10.3 Indicateurs Clés : Lisser, Mesurer la Force
 </h2>

 <div class="space-y-6">
 <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
 <h3 class="font-bold text-blue-800 mb-2">1. Moyennes Mobiles (MM) : Lisser la Tendance</h3>
 <p class="text-sm text-gray-700 mb-2">
 Lignes représentant le prix moyen sur une période (ex: MM 50 jours, MM 200 jours).
 </p>
 <ul class="list-disc list-inside text-xs text-gray-600 ml-4">
 <li>**Règle Simple :** Prix au-dessus de la MM 200 jours = Signal de force à long terme.</li>
 <li>**Croisement (Golden Cross) :** MM courte qui croise MM longue par le bas = Signal d'achat.</li>
 </ul>
 </div>
 <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
 <h3 class="font-bold text-blue-800 mb-2">2. RSI (Relative Strength Index) : Mesurer la Force</h3>
 <p class="text-sm text-gray-700 mb-2">
 Indicateur de momentum mesurant la vitesse des mouvements de prix. Il indique si l'actif est suracheté ou survendu.
 </p>
 <div class="grid grid-cols-2 gap-2 text-center text-sm">
 <div class="bg-red-100 p-2 rounded"><strong>RSI > 70 :</strong> Surachat (Correction Imminente)</div>
 <div class="bg-green-100 p-2 rounded"><strong>RSI < 30 :</strong> Survente (Rebond Proche)</div>
 </div>
 </div>
 <div class="grid md:grid-cols-2 gap-4 pt-2">
 <div>
 <h3 class="font-bold text-blue-800 mb-2">3. MACD (Impulsion)</h3>
 <p class="text-xs text-gray-700">Montre la relation entre deux moyennes mobiles. Les croisements signalent des points d'achat/vente.</p>
 </div>
 <div>
 <h3 class="font-bold text-blue-800 mb-2">4. Bandes de Bollinger (Volatilité)</h3>
 <p class="text-xs text-gray-700">Lignes au-dessus et en dessous d'une moyenne mobile. Si elles se resserrent, un mouvement de prix important est imminent.</p>
 </div>
 </div>
 </div>
 
 

[Image of RSI indicator on a stock chart]

 </div>

 <div class="bg-indigo-900 text-white p-8 rounded-xl shadow-md">
 <h2 class="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2">
 🔬 10.5 Synthèse et Confirmation Multi-Signaux
 </h2>
 
 <p class="text-indigo-100 mb-4 leading-relaxed">
 Ne jamais se fier à un seul indicateur. La puissance de l'AT réside dans la **confirmation** de plusieurs signaux.
 </p>

 <div class="overflow-x-auto mb-6">
 <table class="min-w-full text-sm divide-y divide-indigo-700">
 <thead class="bg-indigo-800 text-indigo-200">
 <tr>
 <th class="px-2 py-2 text-center">Signal 1 (Tendance)</th>
 <th class="px-2 py-2 text-center">Signal 2 (Momentum)</th>
 <th class="px-2 py-2 text-center">Décision (Confirmation)</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-indigo-700 text-center">
 <tr class="bg-indigo-700/50">
 <td class="px-2 py-3 font-bold text-green-300">Le prix touche un Support.</td>
 <td class="px-2 py-3 font-bold text-green-300">RSI sort de la survendue (< 30).</td>
 <td class="px-2 py-3 font-bold text-white">ACHAT FORT</td>
 </tr>
 <tr>
 <td class="px-2 py-3 font-bold text-red-300">Le prix atteint une Résistance.</td>
 <td class="px-2 py-3 font-bold text-red-300">RSI entre en surachat (> 70).</td>
 <td class="px-2 py-3 font-bold text-white">VENTE / PRISE DE PROFIT</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div class="bg-blue-600/30 p-4 rounded-lg border border-blue-500/50">
 <h3 class="font-bold text-blue-300 mb-2">Stratégie BRVM</h3>
 <p class="text-sm text-indigo-100">
 Sur un marché où la liquidité est intermittente, utilisez la volatilité (baisse) pour **acheter à bas prix** les actions fondamentalement solides (Analyse Fondamentale !).
 </p>
 </div>
 </div>

 <div class="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
 ⚙️ Atelier Pratique : Stratégie Technique BRVM
 </h2>

 <p class="text-gray-600 mb-4">
 L'application des outils doit être adaptée aux réalités régionales :
 </p>
 <ul class="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4 mb-6">
 <li>**Privilégier le Long Terme :** Utilisez des graphiques hebdomadaires/mensuels. Le trading intra-journalier est risqué.</li>
 <li>**Filtre de Liquidité :** Focalisez-vous sur les titres les plus liquides (Sonatel, Ecobank, SGB-CI) où l'AT est plus fiable.</li>
 </ul>

 <h3 class="font-bold text-blue-800 mb-3">Concevez Votre Règle de Timing</h3>
 <div class="bg-white p-4 rounded-lg shadow-sm space-y-2">
 <p class="font-medium">1. Actif Solide (M7) : <span class="text-gray-500 italic">... SONATEL</span></p>
 <p class="font-medium">2. Indicateur de Tendance : <span class="text-gray-500 italic">... MM 200 jours</span></p>
 <p class="font-medium">3. Indicateur de Timing : <span class="text-gray-500 italic">... RSI 30/70</span></p>
 <div class="bg-blue-100 p-3 rounded-lg mt-3">
 <p class="text-blue-900 font-bold">Règle Établie :</p>
 <p class="text-sm text-blue-800">J'achète une fois l'action fondamentalement solide si son prix est près du Support **ET** que le RSI est inférieur à 40.</p>
 </div>
 </div>
 </div>

 <div class="bg-gray-900 text-gray-300 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-white mb-4">🧠 Les Termes à Maîtriser</h2>
 <div class="grid md:grid-cols-2 gap-4 text-sm mb-8">
 <p><strong class="text-blue-400">Chandelier Japonais :</strong> Représentation des prix (ouverture, clôture, etc.).</p>
 <p><strong class="text-blue-400">Support / Résistance :</strong> Niveaux de prix psychologiques (plancher / plafond).</p>
 <p><strong class="text-blue-400">Moyenne Mobile (MM) :</strong> Ligne traçant le prix moyen lissé.</p>
 <p><strong class="text-blue-400">RSI :</strong> Indicateur mesurant si un titre est suracheté ou survendu.</p>
 </div>
 
 <hr class="border-gray-700 my-6"/>
 
 <div class="flex flex-col md:flex-row items-center justify-between gap-4">
 <p class="font-medium text-white">Vous avez le mental, l'analyse et l'outil de timing.</p>
 <button class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg">
 👉 Module 11 : Maîtrise du Risque
 </button>
 </div>
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
    description: "Comprenez l'impact des indicateurs macroéconomiques (Inflation, Taux d'intérêt, PIB) et le rôle de la BCEAO sur la performance des entreprises BRVM.",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 11,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-slate-700 to-green-800 text-white p-8 rounded-2xl shadow-lg">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
 💼 Module 11 : Maîtrise du Risque et Gestion de Portefeuille
 </h2>
 <p class="text-lg mb-6 text-slate-100">
 À la fin de ce module, vous serez capable de :
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Appliquer le principe de la diversification</strong> pour réduire le risque spécifique de votre portefeuille.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Structurer un portefeuille</strong> cohérent en fonction de votre profil et de votre stratégie.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 <strong>Utiliser des techniques de gestion</strong> (DCA, Stop-Loss, Rééquilibrage) pour protéger votre capital.
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b border-green-100 pb-2 flex items-center gap-2">
 💰 11.1 Révision : La Puissance des Intérêts Composés
 </h2>
 
 <p class="text-gray-600 mb-4">
 Les intérêts composés sont le moteur de l'enrichissement à long terme, mais leur effet exponentiel est **cassé par les pertes catastrophiques**. La gestion du risque est la garantie que votre courbe de croissance ne s'arrête pas.
 </p>

 <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 mb-6">
 <h3 class="text-lg font-bold text-green-800 mb-2">Rappel de la formule</h3>
 <div class="font-mono text-center text-sm">
 $$ \text{Valeur Finale} = \text{Capital} \times (1 + \text{Taux d'intérêt})^{\text{Nombre d'années}} $$
 </div>
 

[Image of compound interest curve vs linear interest]

 </div>

 <p class="text-sm text-gray-500 italic">
 Conclusion : La gestion du risque est la seule garantie que la courbe de vos intérêts composés ne s'arrête pas en cas de crise.
 </p>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-green-100 pb-2 flex items-center gap-2">
 ⚖️ 11.2 Allocation d'Actifs et Cohérence Stratégique
 </h2>
 
 <h3 class="text-lg font-bold text-green-700 mb-3">L'Allocation d'Actifs (Rappel M5)</h3>
 <p class="text-gray-600 mb-4">
 Votre portefeuille doit refléter votre profil d'investisseur. La première décision stratégique est la répartition entre les grandes classes d'actifs.
 </p>
 
 <div class="overflow-x-auto mb-6">
 <table class="min-w-full divide-y divide-gray-200 text-sm">
 <thead class="bg-slate-50">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-slate-700">Profil</th>
 <th class="px-4 py-3 text-left font-bold text-slate-700">Objectif</th>
 <th class="px-4 py-3 text-left font-bold text-slate-700">Allocation Actions / Obligations (Ex.)</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-200">
 <tr>
 <td class="px-4 py-3 font-bold text-blue-600">🛡️ Prudent</td>
 <td class="px-4 py-3">Sécurité</td>
 <td class="px-4 py-3">20% Actions / 80% Obligations</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-yellow-600">⚖️ Équilibré</td>
 <td class="px-4 py-3">Croissance Modérée</td>
 <td class="px-4 py-3">50% Actions / 50% Obligations</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-bold text-red-600">🚀 Dynamique</td>
 <td class="px-4 py-3">Maximisation</td>
 <td class="px-4 py-3">80% Actions / 20% Obligations</td>
 </tr>
 </tbody>
 </table>
 </div>
 
 <div class="text-xs text-gray-500 italic mt-2 bg-slate-50 p-2 rounded">
 **Conseil BRVM :** Les obligations (publiques ou d'entreprise) cotées à la BRVM sont un excellent outil de diversification pour la partie "sécurité" de votre portefeuille.
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-green-100 pb-2 flex items-center gap-2">
 🛡️ 11.3 Gestion du Risque : Le Rempart du Portefeuille
 </h2>

 <h3 class="text-xl font-bold text-green-700 mb-3">11.3.1 La Diversification : La Seule Règle d'Or</h3>
 <p class="text-gray-600 mb-4">
 Le but est d'éliminer le **Risque Non Systématique** (propre à une seule entreprise) en ne mettant pas tous ses œufs dans le même panier.
 </p>
 
 

 <div class="grid md:grid-cols-2 gap-4 mb-6">
 <div class="bg-green-50 p-4 rounded-lg">
 <strong class="text-green-800">Risque Non Systématique (Éliminable) :</strong> Problème spécifique à une société (fraude, grève).
 </div>
 <div class="bg-red-50 p-4 rounded-lg">
 <strong class="text-red-800">Risque Systématique (Inéliminable) :</strong> Risque de marché (crise régionale, hausse des taux BCEAO).
 </div>
 </div>

 <h4 class="font-bold text-gray-700 mb-2">Les Piliers de la Diversification (Minimum 10-15 titres)</h4>
 <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
 <li>**Par Actifs :** Actions, Obligations, Liquidités.</li>
 <li>**Par Secteurs :** Télécoms, Banques, Agro-industrie, etc. (Ne pas miser 80 % sur un secteur).</li>
 <li>**Par Géographie :** BRVM (déjà diversifiée sur 8 pays), plus l'international (Europe/USA).</li>
 </ul>

 <h3 class="text-xl font-bold text-green-700 mb-3 mt-6">11.3.2 Les Techniques de Protection du Capital</h3>

 <div class="space-y-4">
 <div class="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-500">
 <h4 class="font-bold text-slate-800 mb-2">L'Investissement Échelonné (DCA)</h4>
 <p class="text-sm text-gray-700 mb-2">
 **Principe :** Investir le même montant régulièrement (ex: 50 000 FCFA/mois) au lieu de tout investir en une fois.
 </p>
 <p class="text-xs font-bold text-green-700">
 **Avantage :** Lisse votre prix d'achat, éliminant le risque de timing. Approche la plus disciplinée.
 </p>
 

[Image of dollar-cost averaging strategy]

 </div>

 <div class="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-500">
 <h4 class="font-bold text-slate-800 mb-2">Les Ordres Stop-Loss</h4>
 <p class="text-sm text-gray-700 mb-2">
 **Principe :** Ordre donné à votre SGI de vendre automatiquement un titre si son prix atteint un seuil de perte prédéfini (ex: -10%).
 </p>
 <p class="text-xs font-bold text-green-700">
 **Rôle :** Protéger votre capital contre les chutes brutales et remplacer la décision émotionnelle par une règle mécanique.
 </p>
 </div>
 </div>
 
 <div class="mt-6 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
 <h3 class="font-bold text-yellow-800 mb-2">11.3.3 Le Rééquilibrage du Portefeuille (Rebalancing)</h3>
 <p class="text-sm text-gray-700 mb-2">
 Si vos actions montent trop, elles déséquilibrent votre allocation cible (ex: de 50/50 à 65/35). Le rééquilibrage force l'investisseur à **vendre ce qui est cher** (actions) pour **racheter ce qui est en retard** (obligations), ramenant le portefeuille à sa proportion cible.
 </p>
 </div>
 </div>

 <div class="bg-gray-900 text-gray-300 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-white mb-4">🧠 Les Termes à Maîtriser</h2>
 <div class="grid md:grid-cols-2 gap-4 text-sm mb-8">
 <p><strong class="text-green-400">Diversification :</strong> Ne pas mettre tous ses œufs dans le même panier.</p>
 <p><strong class="text-green-400">Risque Non Systématique :</strong> Risque spécifique à une entreprise (éliminable par la diversification).</p>
 <p><strong class="text-green-400">DCA :</strong> Dollar-Cost Averaging, investissement échelonné et régulier.</p>
 <p><strong class="text-green-400">Rééquilibrage :</strong> Ajuster les proportions d'actifs pour revenir à l'allocation cible.</p>
 </div>
 
 <hr class="border-gray-700 my-6"/>
 
 <div class="flex flex-col md:flex-row items-center justify-between gap-4">
 <p class="font-medium text-white">Félicitations ! Vous avez complété le parcours théorique.</p>
 <button class="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg">
 👉 Module 12 : Synthèse Finale et Exécution
 </button>
 </div>
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
    description: "Comprenez l'impact des indicateurs macroéconomiques (Inflation, Taux d'intérêt, PIB) et le rôle de la BCEAO sur la performance des entreprises BRVM.",
    difficulty_level: 'avance',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 12,
    is_published: true,
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-gray-900 to-slate-700 text-white p-8 rounded-2xl shadow-xl">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3 text-amber-400">
 👷 Module 12 : L’Art de l’Architecte
 </h2>
 <p class="text-lg mb-6 text-slate-200">
 Gestion Avancée du Risque. À la fin de ce module, vous serez capable de :
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-amber-400/20 rounded-full p-1 mt-1 text-amber-400">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Différencier l'allocation d'actifs **stratégique** et **tactique**.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-amber-400/20 rounded-full p-1 mt-1 text-amber-400">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Appliquer le **position sizing** (règle des 1%) pour gérer l'exposition au risque de chaque ligne.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-amber-400/20 rounded-full p-1 mt-1 text-amber-400">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 Comprendre les principes du **hedging** (couverture) dans un contexte BRVM.
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-amber-100 pb-2 flex items-center gap-2">
 🧭 12.1 Allocation Stratégique et Tactique
 </h2>
 
 <p class="text-gray-600 mb-4">
 L'allocation d'actifs est la répartition de votre capital entre Actions, Obligations et Liquidités. L'investisseur avancé distingue deux types :
 </p>

 

 <div class="grid md:grid-cols-2 gap-4 mb-6 mt-4">
 <div class="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-500">
 <h3 class="font-bold text-slate-800 mb-2">Stratégique (Le Plan de Route)</h3>
 <p class="text-sm text-gray-700">
 **Principe :** Répartition de base, définie par votre profil et votre horizon long terme. Elle est maintenue par le rééquilibrage (M11).
 </p>
 <p class="text-xs font-bold text-slate-600 mt-2">
 **Rôle :** Passive, minimise la volatilité à long terme.
 </p>
 </div>
 <div class="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
 <h3 class="font-bold text-amber-800 mb-2">Tactique (L'Ajustement Fin)</h3>
 <p class="text-sm text-gray-700">
 **Principe :** Ajustement temporaire pour tirer parti des conditions de marché à court/moyen terme.
 </p>
 <p class="text-xs font-bold text-amber-700 mt-2">
 **Exemple BRVM :** Réduire les obligations si une hausse des taux BCEAO est anticipée.
 </p>
 </div>
 </div>
 
 <p class="text-sm text-gray-500 italic mt-2">
 **Analogie :** L'Allocation Stratégique est le plan de vol initial ; l'Allocation Tactique est le pilote qui ajuste l'altitude pour éviter les turbulences.
 </p>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-amber-100 pb-2 flex items-center gap-2">
 🌳 12.2 Diversification Sectorielle à la BRVM
 </h2>

 <h3 class="text-xl font-bold text-gray-700 mb-3">Diversification des Moteurs de Croissance</h3>
 <p class="text-gray-600 mb-4">
 Il est crucial de répartir votre capital entre des secteurs ayant des **moteurs de croissance différents** pour éliminer le risque non systématique (M11).
 </p>
 
 <ul class="space-y-3 text-sm text-gray-700 mb-6 bg-gray-50 p-4 rounded-lg">
 <li>**Banques (Ex: ECOBANK CI) :** Sensibles au coût de l'argent (BCEAO). Offre des dividendes stables.</li>
 <li>**Agro-Industriel (Ex: PALM-CI) :** Sensible aux cours mondiaux et au climat. Offre une protection contre l'inflation locale.</li>
 <li>**Télécoms (Ex: SONATEL) :** Sensible à la pénétration d'internet et à l'innovation. Fort potentiel de croissance.</li>
 </ul>

 <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
 <h3 class="font-bold text-yellow-800 mb-2">Le Risque de Corrélation</h3>
 <p class="text-sm text-yellow-800 mb-2">
 Sur la BRVM, les actions ont souvent une **forte corrélation** (elles montent et descendent ensemble) à cause des chocs macroéconomiques régionaux.
 </p>
 <p class="text-xs text-yellow-700">
 **L'Antidote :** Chercher des actifs avec une faible corrélation, comme les obligations d'État BRVM ou l'international.
 </p>
 </div>
 
 </div>
 
 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-amber-100 pb-2 flex items-center gap-2">
 📐 12.3 Position Sizing – Ajuster la Taille de Position
 </h2>
 
 <h3 class="text-xl font-bold text-amber-700 mb-3">La Règle du Risque de Capital (La Règle des 1%)</h3>
 <p class="text-gray-600 mb-4">
 Cette technique vous assure de ne jamais risquer de perdre plus de **1% de votre capital total** sur une seule transaction. C'est le lien direct entre l'analyse de risque et l'exécution de l'ordre.
 </p>
 
 <div class="bg-gray-100 p-4 rounded-lg mb-4">
 <h4 class="font-bold text-gray-800 mb-2">Formule de Calcul :</h4>
 <div class="font-mono text-center text-sm bg-white p-3 rounded mb-2">
 $$ \text{Taille de Position} = \frac{\text{Capital risqué maximal}}{\text{Perte unitaire acceptée}} $$
 </div>
 <ul class="list-disc list-inside text-sm text-gray-700 ml-4">
 <li>**Capital Risqué Max :** Capital total $\times$ 1% (Ex: 1 000 000 FCFA $\times$ 1% = 10 000 FCFA).</li>
 <li>**Perte Unitaire Acceptée :** (Prix d'Achat - Prix du Stop-Loss).</li>
 </ul>
 </div>
 
 <p class="text-sm text-gray-500 italic">
 **Exemple :** Si vous risquez 10 000 FCFA et que votre Stop-Loss est placé 500 FCFA sous le prix d'achat, vous ne pouvez acheter que 10 000 / 500 = **20 actions**.
 </p>
 
 
 </div>

 <div class="bg-gray-900 text-white p-8 rounded-xl shadow-md">
 <h2 class="text-2xl font-bold mb-4 text-amber-400 flex items-center gap-2">
 🔒 12.4 Hedging et Gestion de la Couverture
 </h2>
 
 <p class="text-slate-200 mb-4 leading-relaxed">
 Le **Hedging** (couverture) est une technique avancée pour compenser le risque d'un portefeuille existant. Pour l'investisseur BRVM, l'approche la plus simple est l'équilibre structurel.
 </p>

 <h3 class="font-bold text-amber-400 mb-3">La Couverture par l'Équilibre (Le Véritable Hedging du Débutant)</h3>
 <div class="grid md:grid-cols-2 gap-4">
 <div class="bg-slate-700/50 p-4 rounded-lg border-l-4 border-amber-500">
 <strong class="text-white">Liquidités (Cash) :</strong>
 <p class="text-sm text-slate-300 mt-1">Garder 10 à 20 % du portefeuille en liquidités pour saisir les opportunités d'achat en cas de krach boursier (M6).</p>
 </div>
 <div class="bg-slate-700/50 p-4 rounded-lg border-l-4 border-amber-500">
 <strong class="text-white">Actifs Non Corréllés :</strong>
 <p class="text-sm text-slate-300 mt-1">Utiliser les **Obligations d'État BRVM** (moins volatiles) comme refuge en période d'incertitude boursière.</p>
 </div>
 </div>

 <div class="mt-6 text-sm text-slate-400 italic">
 La vente à découvert (short selling) est une technique de hedging très risquée et souvent déconseillée aux débutants sur la BRVM.
 </div>
 </div>

 <div class="bg-gray-50 text-gray-700 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-gray-800 mb-4">🧠 Les Termes à Maîtriser</h2>
 <div class="grid md:grid-cols-2 gap-4 text-sm mb-8">
 <p><strong class="text-amber-600">Allocation Tactique :</strong> Ajustement temporaire de la répartition des actifs.</p>
 <p><strong class="text-amber-600">Position Sizing :</strong> Détermination de la taille d'un investissement basée sur un risque maximal toléré.</p>
 <p><strong class="text-amber-600">Corrélation :</strong> Mesure de la tendance de deux actifs à évoluer dans le même sens.</p>
 <p><strong class="text-amber-600">Hedging (Couverture) :</strong> Stratégie pour réduire le risque d'un portefeuille, souvent via des actifs non corrélés.</p>
 </div>
 
 <hr class="border-gray-300 my-6"/>
 
 
 </div>
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
    content: `
 <div class="space-y-8 max-w-4xl mx-auto">

 <div class="bg-gradient-to-r from-orange-700 to-red-800 text-white p-8 rounded-2xl shadow-xl">
 <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
 ⚙️ Module 13 : Outils, Actualités et Fiscalité
 </h2>
 <p class="text-lg mb-6 text-orange-100">
 Feuille de Route pour l'Exécution. À la fin de ce module, vous serez capable de :
 </p>
 <ul class="space-y-3 text-lg">
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 **Maîtriser les plateformes numériques** pour suivre la BRVM et passer vos ordres.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 **Comprendre le régime fiscal** des revenus de portefeuille (plus-values, dividendes) dans l'UEMOA.
 </li>
 <li class="flex items-start gap-3">
 <span class="bg-white/20 rounded-full p-1 mt-1">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
 </span>
 **Mettre en place un système de suivi** et de reporting régulier (Journal de Performance).
 </li>
 </ul>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-orange-100 pb-2 flex items-center gap-2">
 💻 13.1 Utilisation des Plateformes : Le Passage à l'Action
 </h2>
 
 <h3 class="text-lg font-bold text-orange-700 mb-3">Le Rôle de la SGI : L'Intermédiaire Indispensable</h3>
 <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
 <p class="text-gray-700 text-sm">
 Votre **SGI (Société de Gestion et d’Intermédiation)** est votre unique point d'entrée. C'est elle qui ouvre votre compte-titres. Vos titres sont conservés en toute sécurité par le **DC/BR** (Dépositaire Central / Banque de Règlement), indépendamment de la SGI.
 </p>
 </div>
 
 <p class="font-bold text-gray-800 mb-3">Les Outils de Suivi</p>
 <div class="overflow-x-auto">
 <table class="min-w-full divide-y divide-gray-200 text-sm">
 <thead class="bg-orange-50">
 <tr>
 <th class="px-4 py-3 text-left font-bold text-orange-800">Outil</th>
 <th class="px-4 py-3 text-left font-bold text-orange-800">Rôle Principal</th>
 <th class="px-4 py-3 text-left font-bold text-orange-800">Informations Clés</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-gray-200">
 <tr>
 <td class="px-4 py-3 font-medium">Site Officiel BRVM</td>
 <td class="px-4 py-3">Information Légale et Marchande</td>
 <td class="px-4 py-3">Cours officiels, indices (BRVM Composite), actualités réglementaires.</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-medium">Site ou App de votre SGI</td>
 <td class="px-4 py-3">Gestion du Portefeuille</td>
 <td class="px-4 py-3">Valorisation des titres, exécution des ordres.</td>
 </tr>
 <tr>
 <td class="px-4 py-3 font-medium">Afribourse / Média UEMOA</td>
 <td class="px-4 py-3">Analyse et Média</td>
 <td class="px-4 py-3">Rapports d'analyse sur les sociétés cotées, avis d'experts.</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div class="mt-4 text-xs bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
 **Point Clé :** Assurez-vous que votre plateforme permet de passer des **ordres au prix limite (Limit Order)** et des **ordres Stop-Loss** (M12) pour exécuter votre stratégie de risque.
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-orange-100 pb-2 flex items-center gap-2">
 💸 13.2 Fiscalité des Revenus de Portefeuille dans l’UEMOA
 </h2>

 <div class="grid md:grid-cols-2 gap-4 mb-6">
 <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
 <h3 class="font-bold text-green-800 mb-2">Imposition des Dividendes (Revenus)</h3>
 <p class="text-sm text-gray-700">
 Soumis à une **Retenue à la Source (RAS)** nationale, souvent entre **7 % et 15 %** selon le pays (ex: Sénégal, Côte d'Ivoire).
 </p>
 <p class="text-xs text-green-700 mt-2 italic">La RAS est souvent libératoire (pas besoin de la redéclarer).</p>
 </div>
 <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
 <h3 class="font-bold text-blue-800 mb-2">Imposition des Plus-Values (Gains en Capital)</h3>
 <p class="text-sm text-gray-700">
 Les plus-values sont imposées, mais le taux est très variable (souvent **faible ou nul**) pour encourager l'investissement en bourse.
 </p>
 <p class="text-xs text-blue-700 mt-2 italic">Vérifiez la législation de votre pays pour les exonérations de longue durée.</p>
 </div>
 </div>

 <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
 <h3 class="font-bold text-yellow-800 mb-2">Conseil d'Expert :</h3>
 <p class="text-sm text-gray-700">
 Consultez toujours un expert-comptable ou le service fiscal de votre SGI pour connaître les taux et procédures spécifiques à votre pays de résidence.
 </p>
 </div>
 </div>

 <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b border-orange-100 pb-2 flex items-center gap-2">
 📈 13.3 Suivi, Reporting, et Journal de Performance
 </h2>

 <h3 class="text-lg font-bold text-orange-700 mb-3">Création d'un Journal de Performance</h3>
 <p class="text-gray-600 mb-4">
 Un investisseur discipliné (M6) mesure ses résultats. Votre journal (Excel ou carnet) assure la discipline et doit contenir :
 </p>
 
 <div class="grid md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg mb-6">
 <p class="font-bold text-gray-800">1. Date/Prix d'Achat & Raison (M7/M9)</p>
 <p class="font-bold text-gray-800">2. Stratégie de Sortie (Stop-Loss M12)</p>
 <p class="font-bold text-gray-800">3. Dividendes Reçus & Réinvestis</p>
 <p class="font-bold text-gray-800">4. Performance Réelle (Rendement Annuel)</p>
 </div>

 <h3 class="text-lg font-bold text-orange-700 mb-3">Mesurer la Performance (Le Rendement Annuel)</h3>
 <div class="bg-slate-100 p-3 rounded-lg border border-slate-200 mb-4 font-mono text-center text-sm">
 $$ \text{Rendement Annuel} = \frac{(\text{Valeur Finale} - \text{Valeur Initiale}) + \text{Dividendes Reçus}}{\text{Valeur Initiale}} \times 100 $$
 </div>
 
 <div class="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
 <strong class="text-blue-800">Le Benchmark BRVM :</strong>
 <p class="text-sm text-gray-700 mt-1">Votre objectif est de surpasser l'indice de référence de la BRVM (BRVM Composite ou BRVM 10). Si l'indice fait 15% et vous 8%, vous avez sous-performé.</p>
 </div>

 <h3 class="font-bold text-red-700 mt-6 mb-3">L'Audit de Décision (Leçon d'Humbleté)</h3>
 <p class="text-sm text-gray-600">
 Pour chaque perte, demandez-vous : Était-ce une erreur d'analyse fondamentale (M7), ou une erreur de discipline/timing (M6/M10) ? L'investissement est un marathon, chaque erreur est une leçon.
 </p>
 </div>

 <div class="bg-gray-900 text-gray-300 p-8 rounded-xl">
 <h2 class="text-2xl font-bold text-white mb-4">🧠 Les Termes à Maîtriser</h2>
 <div class="grid md:grid-cols-2 gap-4 text-sm mb-8">
 <p><strong class="text-orange-400">SGI :</strong> Société de Gestion et d’Intermédiation (votre courtier).</p>
 <p><strong class="text-orange-400">RAS :</strong> Retenue à la Source (impôt prélevé sur les dividendes avant versement).</p>
 <p><strong class="text-orange-400">Plus-Value :</strong> Profit réalisé lors de la vente d'un titre plus cher que son prix d'achat.</p>
 <p><strong class="text-orange-400">Benchmark BRVM :</strong> Indice de référence pour mesurer la performance de votre portefeuille.</p>
 </div>
 
 <hr class="border-gray-700 my-6"/>
 
 <div class="text-center">
 <h3 class="text-xl font-bold text-white mb-2">🎉 Vous avez le plan complet !</h3>
 <p class="mb-6 text-slate-300">Il est temps de passer à l'action disciplinée et éclairée.</p>
 <div class="inline-block bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg transition-colors font-bold shadow-lg cursor-pointer">
 FIN DU PROGRAMME D'INVESTISSEMENT
 </div>
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


  console.log("Traitement des modules terminé.");
  await disconnectPrismaDatabase();
}

main().catch(async (e) => {
  console.error("Erreur fatale dans le script seed:", e);
  await disconnectPrismaDatabase();
  process.exit(1);
});