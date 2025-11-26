import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOrUpdateModule(data: any) {
  const { slug, ...rest } = data;

  return await prisma.learningModule.upsert({
    where: { slug },
    update: rest,
    create: data,
  });
}

async function main() {
  console.log('✅ Base de données connectée');
  console.log(`Démarrage de l'insertion/mise à jour des ${13} modules d'apprentissage...`);


  // ===============================================
  // === M0: MODULE 0 ===
  // ===============================================
  await createOrUpdateModule({
    title: "Module 0",
    slug: 'module-0',
    description: "Description du module 0",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 15,
    order_index: 0,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">🚀 Module 0 – Prêt pour le Décollage ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">“L’investissement, c’est le pont entre votre présent et votre futur.”</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif pédagogique</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Adopterez le bon état d’esprit d’investisseur à long terme.</li>
<li class="text-base text-gray-700 leading-relaxed">Comprendrez pourquoi la BRVM représente une opportunité unique pour les Africains.</li>
<li class="text-base text-gray-700 leading-relaxed">Connaîtrez la structure complète du parcours de formation.</li>
<li class="text-base text-gray-700 leading-relaxed">Serez capables de distinguer un investisseur d’un spéculateur.</li>
</ul>🪶 0.1 – Bienvenue dans l’Académie : Notre mission pour vous
<p class="text-base mb-4 leading-relaxed text-gray-700">Bienvenue dans l’Académie AfriBourse,</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">un espace pensé pour vous — l’épargnant, l’entrepreneur, le jeune professionnel — qui souhaite faire travailler son argent plutôt que de le laisser dormir.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💡 Constat de départ : L’épargne seule ne suffit plus.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L’inflation grignote la valeur de votre argent au fil du temps.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Notre mission est simple : transformer votre épargne en capital actif, grâce à une connaissance claire, à des outils accessibles, et à une pédagogie ancrée dans la réalité africaine.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Chez AfriBourse, nous croyons que :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">La connaissance est la clé de la confiance.</li>
<li class="text-base text-gray-700 leading-relaxed">La discipline est la clé de la réussite financière.</li>
<li class="text-base text-gray-700 leading-relaxed">Et que chaque Africain mérite une part du développement économique de son continent.</li>
</ul>🌍 0.2 – La Bourse, un moteur pour nos économies africaines
<p class="text-base mb-4 leading-relaxed text-gray-700">Investir à la BRVM, ce n’est pas seulement chercher un rendement — c’est participer activement à la construction économique de l’Afrique de l’Ouest.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Chaque action achetée, chaque entreprise soutenue, contribue à :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Financer la croissance de sociétés locales.</li>
<li class="text-base text-gray-700 leading-relaxed">Créer des emplois et soutenir l’innovation.</li>
<li class="text-base text-gray-700 leading-relaxed">Répartir la richesse de manière plus équitable entre citoyens et investisseurs.</li>
</ul>💬 “Quand un Africain investit dans une entreprise africaine, il investit dans le futur de son peuple.”
<p class="text-base mb-4 leading-relaxed text-gray-700">⚓ L’analogie à retenir : le piroguier prudent</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Imaginez votre richesse comme une pirogue.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le piroguier prudent ne se lance pas sans :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Vérifier la météo (analyse du marché)</li>
<li class="text-base text-gray-700 leading-relaxed">Préparer son équipage (formation)</li>
<li class="text-base text-gray-700 leading-relaxed">Définir une destination (objectifs financiers)</li>
</ul>Sur la mer de l’investissement, les vagues représentent la volatilité.
<p class="text-base mb-4 leading-relaxed text-gray-700">Mais celui qui a un cap, un plan et de la patience arrive toujours au rivage.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La bourse, ce n’est pas un sprint — c’est une navigation.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🗺️ 0.3 – Présentation du parcours : votre feuille de route vers l’autonomie</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Voici comment se déroule votre voyage au sein de l’Académie AfriBourse 👇</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Étape	Objectif	Modules concernés</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Mindset	Poser les bases mentales et émotionnelles de l’investisseur	M0, M5</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">⚙️ Fondations	Comprendre les marchés, les acteurs et les instruments	M1, M2, M3, M4</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🔍 Analyse & Stratégie	Maîtriser l’analyse fondamentale et technique	M6, M7, M8, M9, M10</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💼 Action & Gestion	Construire, exécuter et suivre son portefeuille	M11 à M16</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 À la fin du parcours, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Analyser une entreprise cotée à la BRVM,</li>
<li class="text-base text-gray-700 leading-relaxed">Identifier le bon moment pour investir,</li>
<li class="text-base text-gray-700 leading-relaxed">Construire un portefeuille cohérent et rentable,</li>
<li class="text-base text-gray-700 leading-relaxed">Et investir avec confiance et méthode.</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">💥 0.4 – Brisons les mythes : Investisseur vs Spéculateur</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">❌ Mythe 1 : “Il faut être riche pour investir”</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Faux.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la BRVM, vous pouvez commencer avec de petites sommes régulières.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le plus important n’est pas le capital de départ, mais le temps et la constance.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💬 “Le meilleur moment pour planter un arbre était il y a 20 ans.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le deuxième meilleur moment, c’est aujourd’hui.” – Proverbe africain</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">❌ Mythe 2 : “La Bourse, c’est un casino”</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Non, ce n’est pas un jeu de hasard.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La spéculation repose sur les émotions et les paris à court terme.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L’investissement repose sur l’analyse, la patience et la vision long terme.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💡 Citation clé :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">“The individual investor should act consistently as an investor and not as a speculator.”</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">— Benjamin Graham, mentor de Warren Buffett</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">En clair :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L’investisseur achète une part d’entreprise pour en partager la réussite.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le spéculateur parie sur une fluctuation de prix.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la BRVM, nous formons des investisseurs — pas des parieurs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧩 Les termes à maîtriser</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Terme	Définition simple</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">BRVM	Bourse Régionale des Valeurs Mobilières : le marché commun de 8 pays de l’UEMOA.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Investisseur	Personne qui place son argent dans des actifs pour générer un rendement à long terme.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Spéculateur	Personne qui achète et revend à court terme pour profiter de variations de prix.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Volatilité	Variation (montée et descente) du prix d’un actif sur une période donnée.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🚀 Prochaine étape :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous avez préparé votre esprit, compris la vision, et brisé les mythes.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 Passez maintenant au Module 1 : Les Fondations – Qu’est-ce que la Bourse et la BRVM ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">C’est ici que commence votre apprentissage concret du marché financier africain.</p>
`,
  });
  console.log('✅ Module 0: Module 0 mis à jour.');


  // ===============================================
  // === M1: LES ACTEURS DU JEU : QUI FAIT QUOI SUR LE MARCHÉ ? ===
  // ===============================================
  await createOrUpdateModule({
    title: "Les Acteurs du Jeu : Qui fait quoi sur le marché ?",
    slug: 'module-1',
    description: "Description du module 1",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 20,
    order_index: 1,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">📘 Module 1 : Les Fondations — Qu’est-ce que la Bourse et la BRVM ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">d’expliquer ce qu’est un marché financier et à quoi il sert ;</li>
<li class="text-base text-gray-700 leading-relaxed">de comprendre le rôle unique de la BRVM dans l’économie de la zone UEMOA ;</li>
<li class="text-base text-gray-700 leading-relaxed">de distinguer clairement le marché primaire du marché secondaire ;</li>
<li class="text-base text-gray-700 leading-relaxed">et de comprendre pourquoi et comment une entreprise choisit d’entrer en bourse.</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧩 1.1 Qu’est-ce qu’un marché financier ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Un marché financier est un espace — physique ou digital — où l’argent rencontre les opportunités.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">C’est là que se rencontrent :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">ceux qui ont de l’argent à placer (investisseurs), et</li>
<li class="text-base text-gray-700 leading-relaxed">ceux qui ont besoin d’argent pour financer leurs projets (entreprises ou États).</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">Sur ces marchés, on ne vend pas des produits physiques, mais des titres financiers :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Les actions (parts de propriété dans une entreprise)</li>
<li class="text-base text-gray-700 leading-relaxed">Les obligations (prêts faits à une entreprise ou à un État)</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">🪶 L’analogie à retenir : Le Grand Marché de la Ville</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Imaginez le grand marché central de votre ville :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Dans une zone, les producteurs viennent vendre leurs produits frais pour la première fois (🍍 marché primaire).</li>
<li class="text-base text-gray-700 leading-relaxed">Dans une autre zone, les commerçants revendent des produits déjà achetés (🍊 marché secondaire).</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 La BRVM joue le rôle de ce grand marché financier, mais avec des règles claires, un système sécurisé, et une surveillance stricte pour protéger tous les participants.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📊 Pourquoi les marchés financiers sont essentiels</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ils remplissent trois grandes fonctions :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Canaliser l’épargne vers l’investissement productif</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">→ Votre argent finance des projets réels : usines, routes, innovations.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Faciliter la liquidité</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">→ Vous pouvez revendre vos titres à tout moment.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Rendre l’économie plus transparente</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">→ Les entreprises cotées publient leurs résultats, ce qui permet de suivre leur performance.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🏛️ 1.2 Le rôle et le fonctionnement de la BRVM</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🌍 Une bourse régionale unique au monde</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La Bourse Régionale des Valeurs Mobilières (BRVM) est commune à huit pays africains partageant la même monnaie, le franc CFA (UEMOA) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🇧🇯 Bénin | 🇧🇫 Burkina Faso | 🇨🇮 Côte d’Ivoire | 🇬🇼 Guinée-Bissau | 🇲🇱 Mali | 🇳🇪 Niger | 🇸🇳 Sénégal | 🇹🇬 Togo</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Elle a été créée en 1998, avec son siège à Abidjan (Côte d’Ivoire), et son dépositaire central, le DC/BR, à Cotonou (Bénin).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">⚙️ Son fonctionnement</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Les entreprises qui souhaitent lever des fonds émettent des titres (actions ou obligations).</li>
<li class="text-base text-gray-700 leading-relaxed">Les investisseurs achètent et vendent ces titres via des Sociétés de Gestion et d’Intermédiation (SGI), qui sont les courtiers agréés.</li>
<li class="text-base text-gray-700 leading-relaxed">Le régulateur, le CREPMF, veille au respect des règles de transparence et de protection des investisseurs.</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">📈 Les indices phares</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">BRVM Composite : suit l’ensemble des sociétés cotées.</li>
<li class="text-base text-gray-700 leading-relaxed">BRVM 10 : regroupe les 10 entreprises les plus liquides et les plus importantes.</li>
</ul>Quand on dit « la BRVM a progressé de 2 % aujourd’hui », cela signifie que, globalement, les valeurs cotées ont pris de la valeur.
<p class="text-base mb-4 leading-relaxed text-gray-700">💡 À retenir</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La BRVM permet :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">aux entreprises de se financer localement sans dépendre uniquement des banques ;</li>
<li class="text-base text-gray-700 leading-relaxed">aux investisseurs de faire fructifier leur capital ;</li>
<li class="text-base text-gray-700 leading-relaxed">et à nos économies africaines de croître de manière inclusive et transparente.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">🔁 1.3 Marché primaire vs marché secondaire</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Comprendre cette distinction est fondamental :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Type de marché	Description	À qui va l’argent ?	Exemple concret</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Marché primaire	Les titres sont émis et vendus pour la première fois.	Directement à l’entreprise ou à l’État.	Une société comme NSIA Banque émet de nouvelles actions pour financer son expansion.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Marché secondaire	Les titres déjà émis sont échangés entre investisseurs.	L’argent circule entre investisseurs, pas vers l’entreprise.	Vous achetez des actions Sonatel à un autre investisseur via votre SGI.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Votre terrain de jeu principal, en tant qu’investisseur particulier, est le marché secondaire, car c’est là que vous pourrez acheter ou revendre vos titres.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🚀 1.4 Comment et pourquoi une entreprise entre en bourse (IPO)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💰 Pourquoi entrer en bourse ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Une entreprise décide de s’introduire en bourse (faire une IPO – Initial Public Offering) pour :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Lever des capitaux sans contracter de dettes bancaires.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Améliorer sa visibilité et sa crédibilité auprès des investisseurs, partenaires et clients.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Permettre à ses premiers actionnaires (fondateurs, fonds, salariés) de revendre une partie de leurs actions.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.	Diversifier ses sources de financement et accéder à un marché de capitaux plus large.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">⚙️ Comment cela se passe ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	L’entreprise prépare ses états financiers et un prospectus approuvé par le CREPMF.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Elle choisit une SGI pour la conseiller et placer ses titres.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Les investisseurs souscrivent aux actions pendant la période d’offre publique.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.	Une fois les titres émis, l’entreprise devient cotée et ses actions sont échangées sur le marché secondaire.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Exemple africain</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L’introduction en bourse de Orange Côte d’Ivoire (2022) a permis :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">à l’entreprise de lever plusieurs dizaines de milliards FCFA ;</li>
<li class="text-base text-gray-700 leading-relaxed">aux citoyens ivoiriens de devenir actionnaires d’un acteur majeur du pays ;</li>
<li class="text-base text-gray-700 leading-relaxed">et à la BRVM d’attirer de nouveaux investisseurs régionaux.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Les termes à maîtriser</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Terme	Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">BRVM	Bourse Régionale des Valeurs Mobilières, marché commun de l’UEMOA.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">BRVM Composite	Indice mesurant la performance de toutes les sociétés cotées.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">IPO (Initial Public Offering)	Introduction en bourse — première vente d’actions au public.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Marché primaire	Marché où sont émis les nouveaux titres financiers.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Marché secondaire	Marché où les titres déjà émis s’échangent entre investisseurs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">SGI	Société de Gestion et d’Intermédiation, intermédiaire agréé pour acheter/vendre des titres.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous avez maintenant compris le rôle des marchés financiers et de la BRVM dans notre économie.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 Prochaine leçon : Module 2 — Les Acteurs du Jeu : Qui fait quoi sur le marché ?</p>
`,
  });
  console.log('✅ Module 1: Les Acteurs du Jeu : Qui fait quoi sur le marché ? mis à jour.');


  // ===============================================
  // === M2: MODULE 2 ===
  // ===============================================
  await createOrUpdateModule({
    title: "Module 2",
    slug: 'module-2',
    description: "Description du module 2",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 25,
    order_index: 2,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Module 2 : Les Acteurs du Jeu — Qui fait quoi sur le marché ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">d’identifier les rôles et responsabilités des principaux acteurs du marché financier régional (SGI, AMF-UMOA, DC/BR, BCEAO, entreprises cotées) ;</li>
<li class="text-base text-gray-700 leading-relaxed">de comprendre comment vos ordres d’achat ou de vente circulent dans le système ;</li>
<li class="text-base text-gray-700 leading-relaxed">et de visualiser la chaîne complète de sécurité qui protège votre argent et vos titres à la BRVM.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">2.1 Présentation de la BRVM : Une bourse régionale au service de 8 nations</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La Bourse Régionale des Valeurs Mobilières (BRVM) est un modèle unique au monde :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 une seule bourse pour huit pays africains partageant la même monnaie (le franc CFA) et la même banque centrale.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Elle constitue le cœur du marché financier de l’UEMOA.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🌍 Les 8 pays membres de l’UEMOA :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🇧🇯 Bénin | 🇧🇫 Burkina Faso | 🇨🇮 Côte d’Ivoire | 🇬🇼 Guinée-Bissau | 🇲🇱 Mali | 🇳🇪 Niger | 🇸🇳 Sénégal | 🇹🇬 Togo</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📍 Siège de la BRVM : Abidjan (Côte d’Ivoire)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📍 Siège du DC/BR : Cotonou (Bénin)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La BRVM permet :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">aux entreprises de se financer directement auprès du public ;</li>
<li class="text-base text-gray-700 leading-relaxed">aux investisseurs d’acheter et revendre facilement leurs titres ;</li>
<li class="text-base text-gray-700 leading-relaxed">et à la région de mobiliser l’épargne locale pour le développement.</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.2 L’architecture tripartite du marché financier régional</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le marché financier de l’UEMOA repose sur trois piliers institutionnels qui assurent son bon fonctionnement et sa sécurité :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 BCEAO, AMF-UMOA, et DC/BR.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Chaque pilier joue un rôle bien précis et complémentaire.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.2.1 La BCEAO — Superviseur macroéconomique et monétaire 🏦</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">BCEAO = Banque Centrale des États de l’Afrique de l’Ouest</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Rôle principal :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Assurer la stabilité monétaire et macroéconomique dans toute la zone UEMOA.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ses principales missions :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Définir et conduire la politique monétaire (taux directeurs, inflation, masse monétaire).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Superviser le système bancaire et de paiement régional.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Assurer la stabilité financière globale.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📉 Impact sur le marché financier :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Lorsque la BCEAO baisse ses taux, les entreprises empruntent plus facilement, leurs bénéfices potentiels augmentent → les actions montent.</li>
<li class="text-base text-gray-700 leading-relaxed">Lorsqu’elle relève ses taux, le crédit devient plus cher → les valorisations boursières peuvent baisser.</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧩 À retenir :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La BCEAO ne gère pas directement la BRVM, mais influence fortement son évolution.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.2.2 L’AMF-UMOA — Le régulateur, gardien de la transparence ⚖️</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">AMF-UMOA = Autorité des Marchés Financiers de l’UEMOA</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">(anciennement CREPMF — Conseil Régional de l’Épargne Publique et des Marchés Financiers)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Rôle principal :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Veiller à la protection des investisseurs et à la transparence du marché.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ses fonctions clés :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Réglementer : elle définit les règles de fonctionnement des marchés et des acteurs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Autoriser : elle approuve les introductions en bourse, les émissions d’obligations, etc.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Surveiller et sanctionner : elle enquête sur les abus, manipulations ou délits d’initiés.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.	Agréer : elle délivre les agréments aux SGI, sociétés de gestion, fonds, etc.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💬 Pourquoi c’est important pour vous :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L’AMF-UMOA agit comme un gendarme financier. Elle s’assure que :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">les sociétés cotées publient des informations fiables ;</li>
<li class="text-base text-gray-700 leading-relaxed">les SGI respectent les règles ;</li>
<li class="text-base text-gray-700 leading-relaxed">vos transactions sont conformes aux lois LBC/FT (Lutte contre le Blanchiment et le Financement du Terrorisme).</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧩 À retenir :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">C’est votre bouclier réglementaire. Sans AMF-UMOA, la confiance dans le marché s’effondrerait.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.2.3 Le DC/BR — Le notaire du marché et le coffre-fort digital 🔐</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">DC/BR = Dépositaire Central / Banque de Règlement</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">C’est l’entité qui conserve, sécurise et fait circuler les titres financiers dans la zone UEMOA.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ses trois missions principales :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Conservation des titres :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vos actions et obligations ne sont pas stockées chez votre SGI, mais enregistrées au DC/BR à votre nom.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">→ Si votre SGI disparaît, vos titres restent intacts et récupérables.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Règlement-livraison :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Quand vous achetez, le DC/BR transfère les titres sur votre compte et l’argent vers le vendeur — tout cela simultanément pour éviter les fraudes.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Banque de règlement :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Il gère les flux financiers liés aux transactions entre les SGI.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📦 Analogie :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Imaginez le DC/BR comme le notaire digital du marché :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">il garde les registres, s’assure que chaque transaction est authentique et sécurisée, et protège votre propriété financière.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.3 L’Investisseur — C’est vous 💼</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous êtes le cœur battant du marché. Sans investisseurs, pas de liquidité, pas de dynamisme.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Deux grandes catégories :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Investisseurs particuliers</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">→ Ce sont des individus (comme vous, Mamadou ou Aïssata) qui investissent leur propre épargne.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Leur objectif : faire croître leur capital sur le long terme.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Investisseurs institutionnels</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">→ Ce sont les grands acteurs :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	compagnies d’assurances</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	fonds de pension</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	OPCVM (SICAV, FCP)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	banques et fonds souverains</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ils gèrent des milliards pour le compte de clients, salariés, ou citoyens.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📘 À retenir :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Même un petit investisseur particulier contribue à la santé économique régionale.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Votre investissement finance directement les entreprises africaines.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.4 Les Sociétés Cotées — Les “champions économiques” de la région 🏢</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ce sont les entreprises émettrices dont les titres (actions ou obligations) sont échangés à la BRVM.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Pourquoi elles se cotent :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Pour lever des fonds sans emprunter auprès des banques.</li>
<li class="text-base text-gray-700 leading-relaxed">Pour accroître leur notoriété et leur transparence.</li>
<li class="text-base text-gray-700 leading-relaxed">Pour associer les citoyens à leur réussite.</li>
</ul>Exemples d’entreprises cotées :
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Sonatel (Sénégal) – Télécommunications</li>
<li class="text-base text-gray-700 leading-relaxed">Ecobank Côte d’Ivoire – Banque</li>
<li class="text-base text-gray-700 leading-relaxed">Nestlé Côte d’Ivoire – Agroalimentaire</li>
<li class="text-base text-gray-700 leading-relaxed">Palmci (Côte d’Ivoire) – Agriculture / huile de palme</li>
<li class="text-base text-gray-700 leading-relaxed">TotalEnergies Marketing CI – Distribution énergétique</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">💬 À retenir :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Acheter une action, c’est devenir copropriétaire de l’entreprise.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Quand elle croît et fait des bénéfices, vous en profitez aussi (dividendes, plus-values).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.5 Les SGI et autres acteurs clés ⚙️</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">SGI — Société de Gestion et d’Intermédiation</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">C’est votre intermédiaire officiel pour accéder au marché.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Rôle :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Ouvrir et gérer votre compte-titres.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Transmettre vos ordres d’achat et de vente à la BRVM.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Conserver vos fonds non investis en attendant leur placement.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.	Vous conseiller sur la stratégie à adopter selon votre profil.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🛺 Analogie :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La SGI, c’est votre taxi-moto boursier : elle connaît la route, les raccourcis, les risques — et vous conduit à bon port (exécution de vos ordres) en toute sécurité.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.6 Autres acteurs importants 🌐</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Sociétés de Gestion d’OPCVM (SGO) : elles gèrent les fonds communs de placement (FCP, SICAV).</li>
<li class="text-base text-gray-700 leading-relaxed">Experts-comptables et commissaires aux comptes : ils certifient les états financiers des sociétés cotées.</li>
<li class="text-base text-gray-700 leading-relaxed">Médias économiques et analystes financiers : ils informent le public et facilitent la transparence.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Les Termes à Maîtriser</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Terme	Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">SGI	Société de Gestion et d’Intermédiation – intermédiaire entre l’investisseur et la BRVM</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">AMF-UMOA	Autorité des Marchés Financiers de l’UEMOA – régulateur du marché</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">DC/BR	Dépositaire Central / Banque de Règlement – garant de la conservation et du règlement des titres</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">BCEAO	Banque Centrale des États de l’Afrique de l’Ouest – supervise la politique monétaire régionale</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Investisseur institutionnel	Structure (assurance, fonds, banque) investissant au nom de clients</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Société cotée	Entreprise dont les titres sont listés et échangés sur le marché financier</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Bravo 🎉 Vous connaissez désormais les principaux acteurs du marché financier et comprenez comment leurs rôles s’articulent pour garantir la sécurité, la transparence et la confiance.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 Module 3 : Les Outils de l’Investisseur — Actions, Obligations et OPCVM.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous y découvrirez concrètement les instruments financiers que vous pouvez acheter à la BRVM.</p>
`,
  });
  console.log('✅ Module 2: Module 2 mis à jour.');


  // ===============================================
  // === M3: MODULE 3 ===
  // ===============================================
  await createOrUpdateModule({
    title: "Module 3",
    slug: 'module-3',
    description: "Description du module 3",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 30,
    order_index: 3,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Module 3 : Les Outils de l’Investisseur — Les Instruments Financiers de la BRVM</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Objectif pédagogique</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Distinguer les actions, obligations, ETF et OPCVM.</li>
<li class="text-base text-gray-700 leading-relaxed">Comprendre les mécanismes de rendement et de risque de chaque type d’actif.</li>
<li class="text-base text-gray-700 leading-relaxed">Identifier les produits adaptés à votre profil d’investisseur.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">3.1 Les Actions — Devenir propriétaire d’une part d’entreprise</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🔍 Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Une action représente une fraction du capital d’une société. En l’achetant, vous devenez actionnaire, donc co-propriétaire de l’entreprise.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💰 Sources de rendement</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Plus-value : Si le cours de l’action monte, vous pouvez la revendre plus cher.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Dividendes : Une part du bénéfice de l’entreprise vous est versée périodiquement (souvent chaque année).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">⚠️ Risques associés</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">La valeur de l’action peut baisser fortement.</li>
<li class="text-base text-gray-700 leading-relaxed">En cas de faillite, les actionnaires sont rémunérés en dernier.</li>
<li class="text-base text-gray-700 leading-relaxed">Les dividendes ne sont jamais garantis.</li>
</ul>📊 Exemple BRVM
<p class="text-base mb-4 leading-relaxed text-gray-700">L’action SONATEL (télécommunications) verse régulièrement des dividendes élevés, tandis que certaines entreprises comme BOA Mali offrent un rendement plus stable mais une volatilité moindre.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎓 À retenir</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Acheter une action, c’est croire en la croissance d’une entreprise.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous partagez ses succès (dividendes, hausse de valeur) mais aussi ses difficultés.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.2 Les Obligations — Prêter à une entreprise ou à l’État</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🔍 Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Une obligation est un titre de créance : vous prêtez de l’argent à un émetteur (entreprise, État ou institution publique), en échange d’intérêts fixes sur une période donnée.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💰 Fonctionnement</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Vous prêtez, par exemple, 100 000 FCFA pour 5 ans.</li>
<li class="text-base text-gray-700 leading-relaxed">L’émetteur vous verse des coupons annuels (intérêts) et vous rembourse le capital à la fin (maturité).</li>
</ul>🧭 Types d’obligations à la BRVM
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Obligations d’État : émises par les pays de l’UEMOA (très sécurisées).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Obligations d’entreprise : émises par des sociétés privées (rendement plus élevé, risque modéré).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">⚖️ Rendement / Risque</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Rendement stable, risque faible.</li>
<li class="text-base text-gray-700 leading-relaxed">Mais la contrepartie est que vous ne profitez pas de la croissance de l’entreprise.</li>
</ul>📊 Exemple BRVM
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Obligation État du Sénégal 6,5 % 2028 : verse 6,5 % d’intérêts par an.</li>
<li class="text-base text-gray-700 leading-relaxed">Obligation Oragroup 5,75 % 2027 : rendement fixe d’entreprise.</li>
</ul>🎓 À retenir
<p class="text-base mb-4 leading-relaxed text-gray-700">Une obligation, c’est un contrat de confiance : vous prêtez aujourd’hui, on vous rembourse demain avec intérêts.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.3 Les OPCVM et ETF — Investir collectivement et intelligemment</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🔍 Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Les OPCVM (Organismes de Placement Collectif en Valeurs Mobilières) sont des fonds d’investissement collectifs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ils regroupent l’argent de nombreux investisseurs pour acheter un portefeuille diversifié de titres.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📦 Deux grandes familles :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	FCP (Fonds Commun de Placement)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">→ Vous détenez des parts d’un fonds géré par une société agréée.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	SICAV (Société d’Investissement à Capital Variable)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">→ Vous êtes actionnaire d’une société qui gère le portefeuille.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🪙 Avantages</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Diversification immédiate (moins de risque).</li>
<li class="text-base text-gray-700 leading-relaxed">Gestion professionnelle (vous déléguez les décisions).</li>
<li class="text-base text-gray-700 leading-relaxed">Accessibilité (petit capital possible).</li>
</ul>📈 Les ETF (Exchange Traded Funds)
<p class="text-base mb-4 leading-relaxed text-gray-700">Les ETF sont des OPCVM cotés en Bourse.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ils répliquent la performance d’un indice comme le BRVM Composite ou le BRVM 10.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Encore peu développés dans la région, ils représentent le futur de l’investissement passif.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📊 Exemple</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Un ETF BRVM Composite pourrait suivre les 46 plus grandes capitalisations de la Bourse régionale, reproduisant automatiquement leurs performances.</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎓 À retenir</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L’OPCVM, c’est le panier diversifié.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L’ETF, c’est le panier automatisé.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.4 Les Dividendes, Splits et Augmentations de Capital</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💵 Dividende</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Part du bénéfice distribuée aux actionnaires.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Exemple : SONATEL verse souvent entre 1 500 et 2 000 FCFA par action.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📈 Split d’actions</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Une entreprise divise ses actions pour rendre leur prix plus accessible.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Exemple : 1 action à 30 000 FCFA devient 10 actions à 3 000 FCFA chacune.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La valeur totale reste la même, mais la liquidité augmente.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💹 Augmentation de capital</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L’entreprise émet de nouvelles actions pour lever des fonds.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Les anciens actionnaires ont souvent un droit préférentiel de souscription.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.5 Les Risques par Type d’Actif</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Type d’actif	Risque principal	Rendement attendu	Horizon conseillé</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Actions	Volatilité, faillite, marché	Élevé	Long terme (5–10 ans)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Obligations	Taux d’intérêt, défaut de paiement	Moyen	Moyen terme (2–5 ans)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">OPCVM / ETF	Risque de marché, gestion	Modéré	Moyen / long terme</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Liquidités	Inflation (perte de valeur)	Faible	Court terme</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎓 À retenir</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Il n’existe pas d’investissement sans risque.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La clé est de choisir un risque que vous comprenez et que vous acceptez.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Atelier Pratique — “Action vs Obligation”</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📍Situation</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous disposez de 1 000 000 FCFA et hésitez entre :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Acheter des actions SONATEL (cours : 15 000 FCFA, dividende annuel 5 %)</li>
<li class="text-base text-gray-700 leading-relaxed">Souscrire à une obligation État du Sénégal 6 % sur 5 ans.</li>
</ul>💡 Exercice
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Calculez le revenu annuel attendu dans chaque cas.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Comparez le risque (volatilité vs sécurité).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Décidez : préférez-vous la croissance (action) ou la stabilité (obligation) ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 En résumé</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Actions → propriété, potentiel élevé, risque fort.</li>
<li class="text-base text-gray-700 leading-relaxed">Obligations → prêt, rendement fixe, risque modéré.</li>
<li class="text-base text-gray-700 leading-relaxed">OPCVM/ETF → diversification, gestion professionnelle.</li>
<li class="text-base text-gray-700 leading-relaxed">Dividendes et splits → leviers de performance à suivre.</li>
<li class="text-base text-gray-700 leading-relaxed">Règle d’or : ne jamais investir sans comprendre.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">🚀 Prochaine étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎓 Cliquez ici pour le Module 4 : “Le Temps, votre meilleur allié — Définir ses objectifs et son horizon d’investissement”.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous apprendrez comment planifier vos investissements dans le temps et construire une stratégie durable.</p>
`,
  });
  console.log('✅ Module 3: Module 3 mis à jour.');


  // ===============================================
  // === M4: LE TEMPS, VOTRE MEILLEUR ALLIÉ – DÉFINIR SES OBJECTIFS ET SON HORIZON D’INVESTISSEMENT. ===
  // ===============================================
  await createOrUpdateModule({
    title: "Le Temps, votre meilleur allié – Définir ses objectifs et son horizon d’investissement.",
    slug: 'module-4',
    description: "Description du module 4",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 35,
    order_index: 4,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">⚙️ Module 4 – Produits Avancés : Explorer les Nouvelles Frontières de l’Investissement</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif pédagogique</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous comprendrez :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Les grandes familles d’actifs émergentes dans la région UEMOA ;</li>
<li class="text-base text-gray-700 leading-relaxed">Comment elles diffèrent des actions et obligations classiques ;</li>
<li class="text-base text-gray-700 leading-relaxed">Pourquoi elles représentent les tendances futures de la finance africaine.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">4.1 L’Immobilier Coté : investir sans devenir propriétaire physique</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🏢 Qu’est-ce qu’une SCPI ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Une SCPI (Société Civile de Placement Immobilier) est une structure qui collecte l’argent des investisseurs pour acheter et gérer un portefeuille d’immeubles (bureaux, commerces, logements, etc.).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Chaque investisseur détient des parts de la SCPI, et perçoit des revenus locatifs au prorata de sa mise.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🌍 L’équivalent international : les REITs</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À l’étranger, les REITs (Real Estate Investment Trusts) jouent ce même rôle : ils permettent d’investir dans l’immobilier coté en bourse.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">✅ Avantages</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Pas besoin de gérer soi-même un bien immobilier.</li>
<li class="text-base text-gray-700 leading-relaxed">Revenus réguliers sous forme de dividendes.</li>
<li class="text-base text-gray-700 leading-relaxed">Diversification géographique et sectorielle.</li>
</ul>⚠️ Risques
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Dépendance à la santé du marché immobilier.</li>
<li class="text-base text-gray-700 leading-relaxed">Rendements sensibles à la conjoncture économique et aux taux d’intérêt.</li>
</ul>🔍 Cas régional
<p class="text-base mb-4 leading-relaxed text-gray-700">Dans l’UEMOA, la SCPI reste encore marginale, mais plusieurs acteurs réfléchissent à sa mise en place. Les premiers fonds immobiliers régionaux devraient voir le jour dans les prochaines années, notamment via des OPCI (Organismes de Placement Collectif Immobilier).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.2 La Finance Islamique : une alternative éthique et en pleine croissance</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🕌 Les principes fondamentaux</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La finance islamique repose sur trois grands piliers :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	L’interdiction du riba (intérêt) : les revenus doivent provenir d’une activité réelle, pas de la spéculation monétaire.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Le partage des profits et pertes entre les parties.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	L’investissement dans des activités licites (halal), excluant les secteurs comme l’alcool, les jeux de hasard ou l’armement.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💰 Les produits phares</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Sukuk : obligations islamiques adossées à des actifs réels. Plusieurs pays africains (Sénégal, Côte d’Ivoire, Togo) ont déjà émis des Sukuk souverains.</li>
<li class="text-base text-gray-700 leading-relaxed">Fonds islamiques (OPCVM conformes à la charia) : investissent dans des actions et obligations filtrées selon les principes religieux.</li>
</ul>🌍 Enjeux et opportunités
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Marché estimé à plus de 3 000 milliards de dollars dans le monde.</li>
<li class="text-base text-gray-700 leading-relaxed">Forte croissance en Afrique de l’Ouest, où la demande locale augmente.</li>
<li class="text-base text-gray-700 leading-relaxed">Permet d’attirer de nouveaux investisseurs respectant des convictions religieuses fortes.</li>
</ul>💡 En résumé
<p class="text-base mb-4 leading-relaxed text-gray-700">La finance islamique n’est pas une “autre” finance : c’est une approche éthique et solidaire du même objectif – financer le développement économique.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.3 Introduction aux Produits Structurés : combiner rendement et protection</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">⚙️ Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Un produit structuré est un instrument financier créé par une banque ou une institution, qui combine plusieurs éléments (souvent une obligation + une option).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Objectif : protéger partiellement le capital tout en cherchant un rendement supérieur à celui des placements classiques.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📘 Exemple simple</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Une banque propose un produit :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">"100 % du capital garanti à l’échéance + 50 % de la performance de l’indice BRVM 10 sur 3 ans."</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Même si l’indice baisse, l’investisseur récupère son capital initial à la fin de la période.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">⚠️ Attention</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Ces produits sont complexes et souvent réservés à des investisseurs avertis.</li>
<li class="text-base text-gray-700 leading-relaxed">Les conditions (rendement, durée, protection du capital) doivent être lues avec soin.</li>
</ul>🔍 Dans la région
<p class="text-base mb-4 leading-relaxed text-gray-700">Encore rares dans l’UEMOA, les produits structurés pourraient se développer à mesure que les marchés se modernisent et que les besoins de gestion du risque augmentent.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.4 Les ETF et Trackers : l’avenir de l’investissement passif</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">📊 Qu’est-ce qu’un ETF ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Un ETF (Exchange Traded Fund) est un fonds coté en bourse qui réplique un indice.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Exemple : un ETF BRVM Composite suivrait les performances de toutes les actions cotées sur la BRVM.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💡 Pourquoi c’est révolutionnaire</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Frais très faibles comparés aux fonds gérés activement.</li>
<li class="text-base text-gray-700 leading-relaxed">Diversification automatique : une seule part donne accès à des dizaines d’actions.</li>
<li class="text-base text-gray-700 leading-relaxed">Transparence totale : l’investisseur sait exactement ce qu’il détient.</li>
</ul>🌍 À l’international
<p class="text-base mb-4 leading-relaxed text-gray-700">Les ETF dominent désormais les marchés américains et européens, représentant plus de 50 % des flux d’investissement boursier mondiaux.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🌍 En Afrique de l’Ouest</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La BRVM n’a pas encore d’ETF local, mais le sujet est à l’étude. Des initiatives de réplication d’indices régionaux (comme le BRVM 10 ou BRVM Composite) sont envisagées.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🚀 Pourquoi s’y intéresser dès maintenant</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Comprendre les ETF, c’est comprendre le futur de la bourse moderne : simplicité, coût bas, performance moyenne mais stable.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 En résumé : Les produits avancés, une ouverture vers demain</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Produit	Objectif principal	Niveau de risque	Accessibilité actuelle (UEMOA)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">SCPI / Immobilier coté	Revenus stables, immobilier sans gestion	Modéré	En développement</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Finance islamique (Sukuk, fonds halal)	Éthique, sans intérêt	Modéré	Déjà existant</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Produits structurés	Protection du capital + rendement ciblé	Variable	Rare</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">ETF / Trackers	Suivre un indice, faible coût	Faible à modéré	En émergence</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 À retenir</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ce module n’est pas fait pour que vous investissiez dès demain dans ces produits,</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">mais pour vous préparer à comprendre les évolutions futures de la BRVM et du marché financier africain.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🔜 Prochaine étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Cliquez ici pour accéder au Module 5 : Le Temps, votre meilleur allié – Définir ses objectifs et son horizon d’investissement.</p>
`,
  });
  console.log('✅ Module 4: Le Temps, votre meilleur allié – Définir ses objectifs et son horizon d’investissement. mis à jour.');


  // ===============================================
  // === M5: LE MENTAL DU GAGNANT : PSYCHOLOGIE ET STRATÉGIES D'INVESTISSEMENT. ===
  // ===============================================
  await createOrUpdateModule({
    title: "Le Mental du Gagnant : Psychologie et Stratégies d'Investissement.",
    slug: 'module-5',
    description: "Description du module 5",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 40,
    order_index: 5,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">⏳ Module 5 : Le Temps, Votre Meilleur Allié — Définir ses Objectifs et son Horizon</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Définir précisément votre horizon de placement (court, moyen, long terme) en fonction de vos objectifs de vie.</li>
<li class="text-base text-gray-700 leading-relaxed">Comprendre comment le temps est le facteur clé pour gérer le risque (volatilité).</li>
<li class="text-base text-gray-700 leading-relaxed">Établir votre profil d'investisseur (prudent, équilibré, dynamique) et déterminer l'allocation d'actifs (mixte Actions/Obligations) cohérente avec ce profil.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">5.1 Définir ses objectifs de vie et d’investissement</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La bourse n'est pas un jeu, c'est un outil pour réaliser vos projets de vie. Avant de choisir un titre, vous devez vous connaître vous-même, et cela commence par définir la durée pendant laquelle vous pouvez vous passer de cet argent.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">5.1.1 L'Horizon de Placement : La Durée de l'Engagement</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'horizon de placement est la période pendant laquelle vous prévoyez de garder votre investissement. Cette durée dicte le niveau de risque que vous pouvez vous permettre.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Horizon	Durée	Objectif Typique	Allocation Recommandée</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Court Terme	Moins de 2 ans	Fonds d'urgence, frais de scolarité dans 1 an	Minimal (Obligations, épargne sécurisée)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Moyen Terme	2 à 7 ans	Achat automobile, apport pour un projet	Modéré (Mélange Actions/Obligations)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Long Terme	Plus de 7 ans	Retraite, héritage, indépendance financière	Idéal pour la croissance (Majorité Actions)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💡 Conseil d'Expert : Chaque grand objectif de vie (retraite, études, achat maison) doit être traité comme un compte d'investissement séparé, avec son propre horizon et sa propre stratégie.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">5.1.2 Le Pouvoir du Temps : L'Analogie du Car de Nuit</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">La Volatilité à Court Terme : À court terme, les marchés peuvent être erratiques (une crise, une mauvaise nouvelle fait chuter les prix). C'est la volatilité.</li>
<li class="text-base text-gray-700 leading-relaxed">L'Absorption du Risque : Historiquement, les marchés boursiers (régionaux et mondiaux) ont toujours eu une tendance haussière sur des décennies. Plus votre horizon de placement est long, moins cette volatilité ponctuelle compte.</li>
</ul>L'Analogie à Retenir : Le Voyage en Car de Nuit
<p class="text-base mb-4 leading-relaxed text-gray-700">Si vous regardez par la fenêtre d'un car de nuit, le paysage semble flou et les lumières scintillent (la volatilité quotidienne). Vous ne voyez que les secousses. Mais si vous vous concentrez sur l'horloge et la destination finale (l'objectif à long terme), vous savez que, malgré les cahots, vous arriverez à bon port. L'investisseur à long terme se concentre sur la destination, pas sur les secousses.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">5.2 Lien entre horizon de temps et style d’allocation</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">5.2.1 La Tolérance au Risque : Émotionnel et Financier</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Votre profil d'investisseur est défini par votre tolérance au risque, qui est votre capacité :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Émotionnelle : À accepter psychologiquement une perte temporaire sur votre capital.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Financière : À ne pas avoir besoin de cet argent en cas de baisse du marché.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Citation de l'Expert : Warren Buffett insiste sur la patience : “If you aren't willing to own a stock for ten years, don't even think about owning it for ten minutes.”</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">5.2.2 Les Trois Profils d'Investisseur</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Votre profil vous aide à déterminer la répartition idéale entre les classes d'actifs : les Actions (croissance, risque élevé) et les Obligations/Sécurité (sécurité, risque faible).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Profil	Objectif Principal	Tolérance au Risque	Allocation d'Actifs Typique</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Prudent	Sécurité du capital, revenu stable	Faible (Ne supporte pas une perte de 10%)	Majorité Obligations/OPCVM Prudent (ex: 80% Obligations)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Équilibré	Croissance modérée et revenu	Moyenne (Accepte une perte temporaire de 15%)	Mixte Actions/Obligations (ex: 50%/50%)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Dynamique	Maximisation de la croissance	Élevée (Se concentre sur le potentiel, tolère 30% de perte)	Majorité Actions (ex: 80% et plus d'Actions)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Exemple Concret : Un Mamadou de 25 ans qui économise pour sa retraite est un investisseur dynamique, car il peut se permettre de prendre des risques sur 40 ans. Un Mamadou de 55 ans économisant pour l'achat d'une maison dans 3 ans sera prudent.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">5.3 Auto-évaluation du profil de risque (Exercice Pratique)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Pour être un bon investisseur, vous devez être honnête avec vous-même. Cette section propose une méthode pour vous auto-évaluer :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">5.3.1 Questionnaires d'Évaluation (Auto-diagnostic)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">(À formuler comme une série de questions pour l'apprenant à cocher)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Question de Capacité Financière : Avez-vous besoin de cet argent dans les 5 prochaines années ? (Oui/Non)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Question de Connaissance : Avez-vous déjà investi en bourse et comprenez-vous les risques des actions ? (Oui/Non)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Question Émotionnelle (Tolérance à la Perte) : Si votre portefeuille perd 20 % de sa valeur en un mois (par exemple, si 1 000 000 FCFA devient 800 000 FCFA), que feriez-vous ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	A) Je vends tout immédiatement pour sauver ce qui reste. (Profil Prudent)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	B) J'attends que ça remonte, mais je suis stressé(e). (Profil Équilibré)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	C) J'en profite pour acheter plus de titres à bas prix. (Profil Dynamique)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">5.3.2 Synthèse de la Stratégie</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Aligner votre horizon temporel avec votre allocation d'actifs est la première étape vers une stratégie d'investissement réussie.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Objectif de Vie (Poche)	Horizon	Profil d'Investissement	Allocation d'Actifs (Ex.)	Titres à Privilégier (BRVM)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Fonds d'Urgence	< 1 an	Sécurité	100% Liquide / Épargne	Hors Bourse (Banque)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Études des enfants	10-15 ans	Dynamique/Équilibré	60% Actions BRVM / 40% Obligations	Actions régionales solides (Sonatel, Ecobank, etc.)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Retraite	20 ans et +	Dynamique	80% Actions BRVM / 20% Obligations	Actions à fort potentiel de croissance</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Les Termes à Maîtriser</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Terme	Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Horizon de Placement	La durée pendant laquelle l'investisseur prévoit de détenir l'actif.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Volatilité	L'intensité et la fréquence des variations de prix d'un titre.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Tolérance au Risque	La capacité (émotionnelle et financière) à accepter des pertes sur son capital.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Allocation d'Actifs	La répartition de votre capital entre différentes classes d'actifs (ex: actions, obligations, liquidités).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Félicitations ! Vous savez désormais que le temps est votre plus grand atout en bourse et vous avez une méthode claire pour définir votre profil et votre stratégie d'allocation.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 Prochaine leçon : Module 6 — Le Mental du Gagnant : Psychologie et Stratégies d'Investissement.</p>
`,
  });
  console.log('✅ Module 5: Le Mental du Gagnant : Psychologie et Stratégies d'Investissement. mis à jour.');


  // ===============================================
  // === M6: ANALYSE FONDAMENTALE : APPRENDRE À CHOISIR UNE ENTREPRISE SOLIDE. ===
  // ===============================================
  await createOrUpdateModule({
    title: "Analyse Fondamentale : Apprendre à choisir une entreprise solide.",
    slug: 'module-6',
    description: "Description du module 6",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 45,
    order_index: 6,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">💭 Module 6 : Le Mental du Gagnant – Psychologie d’Investissement</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Comprendre les principes de la finance comportementale et la différence entre investir et spéculer.</li>
<li class="text-base text-gray-700 leading-relaxed">Identifier les biais cognitifs et émotionnels les plus fréquents (peur, avidité) et leur impact sur vos décisions.</li>
<li class="text-base text-gray-700 leading-relaxed">Mettre en place des stratégies (antidotes) pour une discipline d'investissement rigoureuse.</li>
<li class="text-base text-gray-700 leading-relaxed">Utiliser le pouvoir des intérêts composés comme preuve de la nécessité d'une vision à long terme.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">6.1 Introduction à la finance comportementale</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Sur les marchés financiers, la plus grande menace pour votre portefeuille n'est pas la crise économique, mais l'homme qui se regarde dans le miroir : vous-même. La finance comportementale enseigne que les émotions (la peur et l'avidité) mènent aux décisions irrationnelles, ce qui est la cause principale des erreurs chez les débutants.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">6.1.1 Investir vs. Spéculer : Une Distinction Essentielle</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Définir clairement votre rôle est la première étape pour maîtriser votre mental :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Caractéristique	L'Investisseur (Le Propriétaire)	Le Spéculateur (Le Joueur)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Objectif	Acquérir une part d’entreprise solide pour son potentiel de croissance future (Valeur interne de l’actif).	Parier sur l’évolution à court terme du prix.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Horizon de Temps	Long terme (années, décennies).	Court terme (jours, semaines).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Moteur	La patience, l’analyse des fondamentaux.	L'excitation (quand le marché monte) ou la panique (quand il descend).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Rappel de l'Expert : L'excitation et les dépenses sont vos ennemis. L'excitation conduit aux achats impulsifs aux prix trop élevés. Concentrez-vous à agir comme un propriétaire d'entreprise.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">6.2 Nos pires ennemis : La Peur, l'Avidité et les Biais Cognitifs</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Les bulles spéculatives et les krachs boursiers sont avant tout des phénomènes psychologiques, car ils sont alimentés par deux émotions primaires.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">6.2.1 La Peur et l'Avidité (Fear & Greed)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Émotion	Description	Conséquence Destructrice</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'Avidité (Greed)	Elle vous pousse à acheter lorsque les prix sont élevés, par peur de manquer le gain (FOMO - Fear of Missing Out). Elle est amplifiée lorsque "la foule crie victoire".	Achat de titres surévalués.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La Peur (Fear)	Elle vous pousse à vendre lorsque les prix baissent.	Transformation d'une perte temporaire (sur papier) en une perte réelle.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">6.2.2 Les Biais Cognitifs les Plus Fréquents</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Les biais sont des erreurs de jugement systématiques basées sur des raccourcis de pensée.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Le Biais de Confirmation : Chercher uniquement les nouvelles et les analyses qui confortent votre choix d'investissement initial, ignorant les informations négatives ou contradictoires.</li>
<li class="text-base text-gray-700 leading-relaxed">L'Ancrage : Rester figé(e) sur le prix initial auquel vous avez acheté un titre (votre "point d'ancrage"). Cela vous empêche de vendre un titre perdant pour réinvestir dans une meilleure opportunité, car vous attendez qu'il remonte à votre prix d'achat.</li>
<li class="text-base text-gray-700 leading-relaxed">L'Excès de Confiance : Surestimer sa propre capacité à battre le marché ou à prédire les mouvements de prix futurs.</li>
</ul>6.3 Les Antidotes : Discipline, Méthode et Routine
<p class="text-base mb-4 leading-relaxed text-gray-700">La seule façon de combattre vos émotions et vos biais cognitifs est la discipline.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">6.3.1 La 8ème Merveille du Monde : Les Intérêts Composés</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">C'est l'essence même de l'investissement à long terme. Les intérêts composés se produisent lorsque les gains générés par votre investissement sont réinvestis pour générer à leur tour de nouveaux gains. C'est l'argent qui travaille pour l'argent.</p>
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{Valeur Finale} = \text{Capital} \times (1 + \text{Taux d'intérêt})^{\text{Nombre d'années}} \text{}</div>
</div>
</div>
</div>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">L'effet est exponentiel : Plus vous commencez tôt et plus votre horizon est long (comme défini au Module 5), plus la courbe de votre richesse s'envole.</li>
<li class="text-base text-gray-700 leading-relaxed">L'Analogie à Retenir : La Croissance du Jeune Baobab</li>
</ul>Un jeune baobab met du temps à grandir (les premières années sont lentes), mais une fois qu'il a établi ses racines, sa croissance accélère massivement chaque année. C'est le temps, pas l'effort initial, qui crée la majesté de l'arbre.
<p class="text-base mb-4 leading-relaxed text-gray-700">6.3.2 Les 3 Erreurs Classiques du Débutant à Éviter</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Définir une routine d'investissement vous permet d'éviter les erreurs basées sur l'émotion.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Tenter de "Timer" le Marché : Essayer de deviner le point le plus bas pour acheter ou le point le plus haut pour vendre. C'est de la spéculation, qui est l'antithèse de l'investissement discipliné.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Manquer de Diversification : Mettre tout son capital sur une seule action. La diversification réduit le risque et est essentielle (sujet du Module 8).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Vendre en Panique : Réagir émotionnellement à une baisse de prix, détruisant ainsi la puissance du long terme et des intérêts composés.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">6.3.3 Les Grandes Stratégies d'Investissement</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Adopter une stratégie claire vous aide à rester discipliné(e) et à prendre des décisions basées sur une méthode, et non l'émotion.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Value Investing (Stratégie de Valeur) : Acheter une entreprise qui se négocie en dessous de sa valeur intrinsèque réelle. C'est la philosophie de Ben Graham et Warren Buffett, qui consiste à acheter de "bonnes affaires".</li>
<li class="text-base text-gray-700 leading-relaxed">Growth Investing (Stratégie de Croissance) : Acheter des entreprises qui croissent très rapidement, même si elles semblent chères. Le prix élevé est justifié par l'anticipation d'une croissance future forte.</li>
<li class="text-base text-gray-700 leading-relaxed">Dividendes (Stratégie de Revenus) : Choisir des entreprises matures (souvent des banques ou des télécoms à la BRVM) qui versent régulièrement une grande partie de leurs bénéfices.</li>
</ul>6.4 La Psychologie des Investisseurs Face à la Volatilité
<p class="text-base mb-4 leading-relaxed text-gray-700">La volatilité est la norme, pas l'exception. La psychologie du gagnant consiste à transformer la volatilité en opportunité.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le Secret de la Maîtrise (Warren Buffett) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">"Investors should remember that excitement and expenses are their enemies. And if they insist on trying to time their participation in equities, they should try to be fearful when others are greedy and greedy only when others are fearful."</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">En d'autres termes : lorsque le marché panique (la peur domine) et que les prix sont bas, c'est le moment d'acheter (être avide) ; lorsque tout le monde s'emballe (l'avidité domine) et que les prix sont hauts, c'est le moment d'être prudent (être craintif).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Les Termes à Maîtriser</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Terme	Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Intérêts Composés	Processus par lequel les gains générés sont réinvestis pour produire leurs propres gains.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Biais Cognitif	Erreur de jugement systématique basée sur des raccourcis de pensée ou des émotions.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Value Investing	Stratégie d'investissement consistant à acheter des titres que l'on considère comme sous-évalués par le marché.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ancrage	Biais psychologique qui pousse un investisseur à rester focalisé sur le prix initial d'achat d'un titre.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous avez maintenant la discipline et le mental. Il est temps de passer à l'outil le plus puissant de l'investisseur : l'analyse.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 Prochaine leçon : Module 7 — Analyse Fondamentale : Apprendre à choisir une entreprise solide.</p>
`,
  });
  console.log('✅ Module 6: Analyse Fondamentale : Apprendre à choisir une entreprise solide. mis à jour.');


  // ===============================================
  // === M7: LA MAÎTRISE DU RISQUE : DIVERSIFICATION ET GESTION DE PORTEFEUILLE. ===
  // ===============================================
  await createOrUpdateModule({
    title: "La Maîtrise du Risque : Diversification et Gestion de Portefeuille.",
    slug: 'module-7',
    description: "Description du module 7",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 50,
    order_index: 7,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">🔍 Module 7 : Analyse Fondamentale – Devenir un Analyste Éclairé</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Lire et comprendre la logique des trois principaux états financiers d'une société cotée (Compte de Résultat, Bilan, Tableau des Flux de Trésorerie).</li>
<li class="text-base text-gray-700 leading-relaxed">Calculer et interpréter les ratios fondamentaux clés (PER, ROE, Marge Nette, Gearing) pour évaluer la santé financière et la rentabilité.</li>
<li class="text-base text-gray-700 leading-relaxed">Appliquer des méthodes simples de valorisation pour déterminer si une action BRVM est chère ou bon marché.</li>
<li class="text-base text-gray-700 leading-relaxed">Utiliser une approche structurée pour choisir les meilleures entreprises où investir.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">7.1 Lecture et compréhension des états financiers</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'Analyse Fondamentale est l'art de déterminer la vraie valeur (valeur intrinsèque) d'une entreprise avant d'acheter ses actions. Elle se base sur l'étude des rapports annuels et des états financiers.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">7.1.1 Les Trois Piliers de l'Analyse</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Pour évaluer la santé d'une entreprise, vous avez besoin de ses trois états financiers :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Le Compte de Résultat (P&L - Profit and Loss) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	La question : Qu'est-ce qu'on gagne ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Le rôle : Il mesure la performance de l'entreprise sur une période donnée (une année, un trimestre).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Les éléments clés : Chiffre d'Affaires (Ventes totales), Dépenses (Charges), et le résultat final (le Bénéfice Net).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Le Bilan :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	La question : Qu'est-ce qu'on possède et qu'est-ce qu'on doit ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Le rôle : C'est une photographie à un instant T de ce que possède l'entreprise (Actifs) et de ce qu'elle doit (Passifs).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	La logique : Le total des Actifs doit toujours être égal au total des Passifs (Dettes + Capitaux Propres). Les Capitaux Propres représentent l'argent qui appartient aux actionnaires.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Le Tableau des Flux de Trésorerie (TFT/Cash Flow) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	La question : Où va l'argent liquide ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Le rôle : Il est le plus honnête ! Il montre les mouvements réels de cash (argent) entrant et sortant.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Pourquoi est-il crucial : Le Bénéfice Net du Compte de Résultat peut être manipulé par des écritures comptables (amortissements, provisions). Le Cash Flow montre si l'entreprise génère réellement du liquide, ce qui est nécessaire pour payer les dividendes, les dettes et investir.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Shutterstock</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">7.2 Analyse détaillée : Les trois volets</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'analyste éclairé étudie les tendances sur 5 ans. Une bonne entreprise présente une croissance stable et régulière de ses indicateurs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">7.2.1 Analyse du Compte de Résultat : Les Marge et la Croissance</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Croissance du Chiffre d'Affaires : L'indicateur de base. L'entreprise vend-elle de plus en plus ? Une croissance régulière est un signe de bonne santé.</li>
<li class="text-base text-gray-700 leading-relaxed">Marge Brute, Marge Opérationnelle et Marge Nette :</li>
</ul>o	La Marge Nette est le ratio le plus important. Elle mesure quel pourcentage du chiffre d'affaires est conservé comme Bénéfice Net.
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{Marge Nette} = \frac{\text{Bénéfice Net}}{\text{Chiffre d'Affaires}}</div>
</div>
</div>
</div>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Interprétation : Une Marge Nette stable ou en amélioration (ex : 15 % ou plus pour une bonne banque BRVM) montre que l'entreprise contrôle ses coûts et est capable de transformer les ventes en profit réel.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">7.2.2 Analyse du Bilan : La Solvabilité</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Capitaux Propres : L'argent qui appartient aux actionnaires doit croître année après année, signe que l'entreprise conserve et réinvestit une partie de ses bénéfices.</li>
<li class="text-base text-gray-700 leading-relaxed">Le Ratio d'Endettement (Gearing ou Ratio Dette Nette / Capitaux Propres) :</li>
</ul>
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{Gearing} = \frac{\text{Dette Nette}}{\text{Capitaux Propres}}</div>
</div>
</div>
</div>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Interprétation : Ce ratio est crucial. Un Gearing élevé (Dette > Capitaux Propres) signifie que l'entreprise est très dépendante de la dette bancaire. Elle est vulnérable en cas de hausse des taux d'intérêt (décidée par la BCEAO) ou de crise économique.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Règle du débutant : Assurez-vous que les Capitaux Propres couvrent largement les dettes.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">7.2.3 Analyse du Tableau des Flux de Trésorerie : La Qualité des Profits</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Flux de Trésorerie d'Exploitation (FTE) : C'est l'argent généré par l'activité normale de l'entreprise. S'il est positif et supérieur au Bénéfice Net, c'est un excellent signe de profits de haute qualité.</li>
<li class="text-base text-gray-700 leading-relaxed">Flux de Trésorerie d'Investissement : Montre combien l'entreprise dépense pour son avenir (usines, machines, etc.).</li>
<li class="text-base text-gray-700 leading-relaxed">Flux de Trésorerie de Financement : Montre comment l'entreprise gère sa dette et ses actionnaires (paiement de dividendes, émission de nouvelles dettes).</li>
</ul>7.3 Les ratios essentiels pour l'investisseur BRVM
<p class="text-base mb-4 leading-relaxed text-gray-700">Les ratios permettent de comparer facilement des entreprises de tailles différentes et d'évaluer leur efficacité.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">7.3.1 PER (Price-to-Earnings Ratio) : Le Prix du Bénéfice</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le PER est le ratio le plus célèbre. Il mesure combien les investisseurs sont prêts à payer pour chaque franc CFA de bénéfice net annuel d'une action.</p>
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{PER} = \frac{\text{Cours de l'action}}{\text{Bénéfice Net par Action (BPA)}}</div>
</div>
</div>
</div>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Interprétation : Un PER de 10 signifie qu'il faudrait 10 années de bénéfices stables pour "récupérer" l'investissement initial.</li>
</ul>o	PER faible (ex: 5 à 10) : Souvent considéré comme une bonne affaire (Value Investing).
<p class="text-base mb-4 leading-relaxed text-gray-700">o	PER élevé (ex: 20+) : Le marché anticipe une très forte croissance future (Growth Investing).</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Nuance BRVM (Essentiel) : La BRVM est un marché de croissance (Frontier Market). Les études montrent que les investisseurs régionaux valorisent fortement le potentiel de croissance future. Ne rejetez jamais une action uniquement à cause d'un PER élevé. Comparez-le toujours à la moyenne sectorielle et aux perspectives de croissance.</li>
</ul>7.3.2 ROE (Return on Equity) : L'Efficacité
<p class="text-base mb-4 leading-relaxed text-gray-700">Le Retour sur Capitaux Propres (ROE) mesure l'efficacité avec laquelle l'entreprise utilise l'argent investi par ses actionnaires.</p>
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{ROE} = \frac{\text{Bénéfice Net}}{\text{Capitaux Propres}}</div>
</div>
</div>
</div>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Interprétation : Un ROE de 15 % et plus est considéré comme excellent. Il indique que l'entreprise génère 15 FCFA de bénéfice pour chaque 100 FCFA que les actionnaires y ont investis. C'est le signe d'une bonne gestion.</li>
</ul>L'Analogie à Retenir : Le Gestionnaire du Maquis
<p class="text-base mb-4 leading-relaxed text-gray-700">Un maquis peut avoir de grandes ventes (chiffre d'affaires), mais s'il gaspille beaucoup d'ingrédients, il est inefficace. Le ROE mesure si le gestionnaire (l'équipe dirigeante) est efficace à transformer l'argent que vous lui donnez en profit. Plus le ROE est élevé, plus l'entreprise est efficace.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">7.4 Valorisation d’une action : Déterminer la valeur intrinsèque</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La dernière étape de l'analyse fondamentale est la valorisation : estimer la vraie valeur de l'entreprise.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">7.4.1 La Méthode des Comparables (Multiples)</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Principe : C'est la méthode la plus simple pour le débutant. Si une entreprise A (ex: Ecobank CI) se vend à un PER de 8, alors une entreprise B (ex: une autre banque) ne devrait pas se vendre à un PER de 20, sauf si elle a une croissance exceptionnelle.</li>
<li class="text-base text-gray-700 leading-relaxed">Mise en œuvre : Calculer les ratios (PER, P/B, Marge) de votre cible et les comparer à la moyenne du secteur à la BRVM. Si les ratios de votre cible sont meilleurs mais que le prix est similaire, elle pourrait être sous-évaluée.</li>
</ul>7.4.2 La Méthode des Dividendes Actualisés (DDM)
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Principe : La valeur d'une action est égale à la somme des dividendes futurs qu'elle versera, actualisée à aujourd'hui. Elle est très utile pour les entreprises matures de la BRVM qui versent des dividendes stables (Télécoms, Banques).</li>
<li class="text-base text-gray-700 leading-relaxed">Limitation : Ne fonctionne pas bien pour les entreprises qui ne versent pas ou peu de dividendes (entreprises en forte croissance).</li>
</ul>7.4.3 Le Flux de Trésorerie Actualisés (DCF - Discounted Cash Flow)
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Principe (Avancé) : La valeur d'une entreprise est déterminée par la somme de tous ses Flux de Trésorerie Futurs (Cash Flow), actualisée à aujourd'hui.</li>
<li class="text-base text-gray-700 leading-relaxed">Avantage : C'est la méthode la plus précise car elle se base sur le vrai cash généré.</li>
<li class="text-base text-gray-700 leading-relaxed">Recommandation pour le débutant : Comprenez la logique (la valeur vient du cash futur), mais laissez les calculs complexes aux professionnels. Pour l'instant, focalisez-vous sur les ratios.</li>
</ul>7.5 Étude de cas : SONATEL vs ECOBANK CI (Application BRVM)
<p class="text-base mb-4 leading-relaxed text-gray-700">L'objectif est d'appliquer les concepts appris.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Critère d'Analyse	SONATEL (Télécom / Croissance)	ECOBANK CI (Banque / Dividende)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Secteur / Croissance	Dynamique / Croissance : Investissements massifs pour la 5G, croissance du volume de données.	Mature / Dividendes : Stabilité financière, profits réguliers, distribue la majorité des bénéfices.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Tendance du Chiffre d'Affaires	Croissance soutenue, grâce aux nouveaux services digitaux.	Croissance modérée, liée à l'expansion économique régionale.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Marge Nette	Souvent élevée (position dominante, économies d'échelle).	Souvent plus faible (coût d'exploitation des agences, réglementation bancaire).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">PER	Élevé (Le marché paie cher la forte croissance future).	Faible (Le marché privilégie la régularité et le dividende, moins le potentiel d'explosion).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">ROE	Excellent (Forte rentabilité des capitaux propres, souvent supérieur à 20 %).	Bon (Doit respecter des ratios de fonds propres stricts, souvent supérieur à 15 %).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Gearing	Peut être important (besoin de financer de lourdes infrastructures).	Doit être faible (réglementation stricte sur les fonds propres bancaires).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Conclusion pour l'investisseur	Intérêt pour la croissance du capital à long terme.	Intérêt pour le revenu stable et le dividende régulier.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Les Termes à Maîtriser</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Terme	Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Bénéfice Net par Action (BPA)	Le Bénéfice Net divisé par le nombre total d'actions. Base de calcul du PER.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Marge Nette	Mesure le pourcentage du Chiffre d'Affaires conservé en Bénéfice Net.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Gearing	Ratio Dette Nette / Capitaux Propres, mesure le niveau d'endettement d'une entreprise par rapport à ses propres fonds.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Valeur Intrinsèque	La vraie valeur estimée d'une entreprise, indépendante de son prix en bourse.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">DCF	Discounted Cash Flow (Flux de Trésorerie Actualisés), méthode de valorisation basée sur les flux de trésorerie futurs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous maîtrisez désormais les outils pour choisir une bonne entreprise. Mais le risque existe toujours. Comment le gérer ?</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 Prochaine leçon : Module 8 — La Maîtrise du Risque : Diversification et Gestion de Portefeuille.</p>
`,
  });
  console.log('✅ Module 7: La Maîtrise du Risque : Diversification et Gestion de Portefeuille. mis à jour.');


  // ===============================================
  // === M8: MODULE 8 ===
  // ===============================================
  await createOrUpdateModule({
    title: "Module 8",
    slug: 'module-8',
    description: "Description du module 8",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 55,
    order_index: 8,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">💡 Module 8 : L’Évaluation d’Entreprise – Projeter l’Avenir (Valorisation Avancée)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Comprendre la logique fondamentale de la valorisation basée sur l'actualisation (méthode DCF et DDM).</li>
<li class="text-base text-gray-700 leading-relaxed">Identifier les paramètres clés (taux d'actualisation, taux de croissance, Terminal Value) et leur impact sur la valeur finale d'une action.</li>
<li class="text-base text-gray-700 leading-relaxed">Appliquer la méthode DDM pour valoriser les entreprises matures à dividendes réguliers de la BRVM.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">8.1 Méthode DCF (Discounted Cash Flow) : Actualisation des Flux de Trésorerie</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La méthode DCF est la plus respectée par les analystes professionnels. Elle repose sur le principe que la valeur d'une entreprise est égale à la somme de tous ses flux de trésorerie futurs, ramenée à sa valeur aujourd'hui.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">8.1.1 Le Principe de l'Actualisation : Pourquoi aujourd'hui est mieux que demain</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">La Valeur Temps de l'Argent : Un Franc CFA reçu aujourd'hui vaut plus qu'un Franc CFA reçu dans un an. Pourquoi ?</li>
</ul>1.	Inflation : Le pouvoir d'achat diminue avec le temps.
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Coût d'Opportunité : L'argent non investi aujourd'hui ne peut pas générer d'intérêts (composés, Module 6).</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">L'Actualisation : C'est l'opération mathématique qui permet de ramener ces flux futurs (prévus) à leur Valeur Actuelle Nette (VAN).</li>
</ul>8.1.2 Les Deux Composantes du DCF
<p class="text-base mb-4 leading-relaxed text-gray-700">L'évaluation DCF se fait en deux grandes étapes :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	La Période de Prévision Explicite (5 à 10 ans) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	L'analyste projette les Flux de Trésorerie d'Exploitation pour les 5 ou 10 prochaines années (en se basant sur l'Analyse Fondamentale du Module 7).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Clé pour la BRVM : La projection doit être prudente, car le marché régional peut être volatil (chocs sur les matières premières, politique).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	La Valeur Terminale (Terminal Value - VT) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	C'est la valeur de l'entreprise après la période de prévision explicite (de l'an 11 à l'infini).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Pourquoi ? On suppose que l'entreprise continuera d'exister et de générer du cash indéfiniment, mais à un taux de croissance plus faible et stable. La VT représente souvent 70 à 80 % de la valeur totale de l'entreprise !</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">8.1.3 Le Taux d'Actualisation (Le WACC)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le Taux d'Actualisation est le taux utilisé pour ramener les flux futurs à la valeur présente. Il est souvent appelé Coût Moyen Pondéré du Capital (CMPC ou WACC).</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Rôle : Il représente le coût total pour l'entreprise de financer ses actifs (par la dette et par les fonds propres des actionnaires).</li>
<li class="text-base text-gray-700 leading-relaxed">Impact : Plus ce taux est élevé, plus la valeur actuelle des flux futurs est faible, et donc plus la valeur intrinsèque de l'action est faible (car le risque est perçu comme élevé).</li>
</ul>Résumé du DCF :
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{Valeur Intrinsèque} = \sum_{t=1}^{N} \frac{\text{Flux de Trésorerie}_t}{(1 + \text{WACC})^t} + \frac{\text{Valeur Terminale}_N}{(1 + \text{WACC})^N}</div>
</div>
</div>
</div>
<p class="text-base mb-4 leading-relaxed text-gray-700">8.2 Méthode DDM (Dividend Discount Model) : Actualisation des Dividendes</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La méthode DDM (modèle d'actualisation des dividendes) est particulièrement utile pour les entreprises de la BRVM qui ont l'habitude de verser des dividendes stables et croissants (banques, télécoms, agro-industrie mature).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">8.2.1 Le Principe Fondamental</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Postulat : Pour un investisseur en actions de ce type, la valeur d'une action provient uniquement des dividendes futurs qu'il recevra, actualisés à aujourd'hui.</li>
<li class="text-base text-gray-700 leading-relaxed">Avantage : C'est une méthode simple, basée sur une donnée facilement observable à la BRVM (le rendement du dividende historique).</li>
</ul>8.2.2 Le Modèle de Gordon-Shapiro (DDM simplifié)
<p class="text-base mb-4 leading-relaxed text-gray-700">Le modèle de Gordon-Shapiro est une version simplifiée du DDM, utilisée lorsque l'on suppose que le dividende va croître à un taux constant ($g$) pour toujours.</p>
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{Prix de l'action} = \frac{\text{Dividende Prochain} (D_1)}{\text{Coût des Fonds Propres} (k) - \text{Taux de croissance du dividende} (g)}</div>
</div>
</div>
</div>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">$D_1$ : Le dividende prévu pour l'année prochaine.</li>
<li class="text-base text-gray-700 leading-relaxed">$k$ : Le taux d'actualisation utilisé (le coût des fonds propres, souvent proche du WACC).</li>
<li class="text-base text-gray-700 leading-relaxed">$g$ : Le taux de croissance annuel constant des dividendes.</li>
</ul>8.2.3 Application à la BRVM : L'Intérêt pour les "Dividend Kings"
<p class="text-base mb-4 leading-relaxed text-gray-700">Les entreprises de la BRVM qui versent des dividendes réguliers sont très appréciées des investisseurs régionaux car elles offrent un flux de revenus stable.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Quand l'utiliser ? Lorsque l'entreprise est mature, son marché est stable, et la croissance de ses dividendes est prévisible (ex: certaines banques ou sociétés de services publics).</li>
<li class="text-base text-gray-700 leading-relaxed">Attention : Si l'entreprise est en difficulté ou si elle réinvestit la majorité de ses bénéfices (croissance), cette méthode est inadaptée.</li>
</ul>8.3 Étapes Clés pour la Projection (Synthèse du Module)
<p class="text-base mb-4 leading-relaxed text-gray-700">Réaliser une projection est l'art de traduire l'Analyse Fondamentale (Module 7) en une valeur monétaire.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Étape	Action de l'Analyste	Risque Émotionnel à Éviter (Module 6)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1. Projection de la Croissance	Déterminer le taux de croissance futur du Chiffre d'Affaires et des marges.	Biais d'Excès de Confiance (surestimer la croissance).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2. Estimation du Risque	Déterminer le WACC (Coût du Capital) de l'entreprise.	Ignorer le risque spécifique du marché régional.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3. Calcul de la Valeur Terminale	Déterminer la valeur de l'entreprise au-delà de 10 ans.	Utiliser un taux de croissance g trop élevé, qui gonfle artificiellement la VT.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4. Comparaison	Comparer la Valeur Intrinsèque (obtenue par DCF/DDM) avec le Cours actuel de l'action (Bourse).	Ancrage (Rester bloqué sur le prix d'achat, au lieu de faire confiance au calcul).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Conclusion de l'Expert : Si le prix en bourse est significativement inférieur à votre valeur intrinsèque calculée, vous avez trouvé une marge de sécurité pour votre investissement.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Les Termes à Maîtriser</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Terme	Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Actualisation	Opération financière qui ramène la valeur future d'un montant à sa valeur présente.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">WACC (CMPC)	Coût Moyen Pondéré du Capital, le taux utilisé pour actualiser les flux futurs (taux d'actualisation).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Valeur Intrinsèque	La vraie valeur estimée d'une entreprise selon l'analyste.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Valeur Terminale (VT)	La valeur estimée de l'entreprise au-delà de la période de prévision explicite.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Marge de Sécurité	La différence positive entre la valeur intrinsèque (élevée) et le prix du marché (faible).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous avez le mental (M6) et les outils pour évaluer (M7 & M8). Il faut maintenant garantir la survie de votre capital face au risque.</p>
`,
  });
  console.log('✅ Module 8: Module 8 mis à jour.');


  // ===============================================
  // === M9: MODULE 9 ===
  // ===============================================
  await createOrUpdateModule({
    title: "Module 9",
    slug: 'module-9',
    description: "Description du module 9",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 60,
    order_index: 9,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">🌱 Module 9 : L’Analyse Extra-Financière – Comprendre le Contexte</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Mener une analyse qualitative pour évaluer la qualité de la direction, la solidité du modèle économique et le positionnement concurrentiel d'une entreprise.</li>
<li class="text-base text-gray-700 leading-relaxed">Comprendre les enjeux du reporting ESG (Environnement, Social, Gouvernance) et l'importance de la finance durable à la BRVM.</li>
<li class="text-base text-gray-700 leading-relaxed">Intégrer l'analyse quantitative (M7 & M8) et qualitative (M9) pour prendre une décision d'investissement complète.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">9.1 Analyse Qualitative : Le Cerveau de l'Entreprise</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'analyse qualitative consiste à répondre à la question : L'entreprise est-elle bien gérée, bien positionnée et son modèle est-il durable ? C'est l'étape où vous lisez le rapport annuel (non pas pour les chiffres, mais pour le texte !).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">9.1.1 La Gouvernance : L'Équipe et la Direction</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La qualité de la gestion est souvent le facteur décisif.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Le Leadership : Qui dirige l'entreprise ? Quelle est leur expérience ? Leur réputation est-elle solide ?</li>
<li class="text-base text-gray-700 leading-relaxed">Transparence et Responsabilité : L'entreprise communique-t-elle clairement ses stratégies ? La structure du Conseil d'Administration est-elle indépendante des actionnaires majoritaires ?</li>
<li class="text-base text-gray-700 leading-relaxed">Rémunération : La rémunération des dirigeants est-elle alignée avec la performance à long terme de l'entreprise (et non seulement les bénéfices à court terme) ?</li>
</ul>Pourquoi c'est vital à la BRVM : Sur un marché régional moins couvert par les analystes internationaux, la confiance accordée au management est un facteur de risque (ou d'opportunité) plus important que sur des marchés développés.
<p class="text-base mb-4 leading-relaxed text-gray-700">9.1.2 Le Modèle Économique (Business Model)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous devez comprendre comment l'entreprise gagne de l'argent et si cela est durable.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">L'Avantage Concurrentiel (Le Moat) : Qu'est-ce qui rend l'entreprise meilleure ou différente de ses concurrents ? Est-ce un brevet ? Des coûts plus bas ? Un réseau de distribution monopolistique (comme certaines entreprises de services publics) ?</li>
<li class="text-base text-gray-700 leading-relaxed">La Résilience : Le modèle économique peut-il survivre à un choc majeur (crise, pandémie, nouvelle réglementation) ?</li>
<li class="text-base text-gray-700 leading-relaxed">Diversification des Revenus : L'entreprise dépend-elle d'un seul produit ou d'un seul marché ? (La BRVM concerne 8 pays, l'expansion régionale est un signe de solidité).</li>
</ul>9.1.3 L'Analyse du Secteur et de la Concurrence
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Positionnement : L'entreprise est-elle leader, challenger ou suiveur ? Le leader (par exemple, Sonatel au Sénégal) a souvent un pouvoir de fixation des prix supérieur.</li>
<li class="text-base text-gray-700 leading-relaxed">Barrières à l'Entrée : Est-il facile pour un nouvel acteur (concurrent) d'entrer sur le marché ? Les coûts d'installation d'une banque ou d'une cimenterie sont de fortes barrières.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">9.2 Focus UEMOA : Le Reporting ESG et la Finance Durable</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'investissement ne se résume plus au seul profit. Les critères ESG sont désormais essentiels pour les investisseurs institutionnels et deviennent incontournables à la BRVM.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">9.2.1 Comprendre les Critères ESG</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'analyse ESG (Environnement, Social, Gouvernance) est une grille de lecture qui évalue les risques et opportunités extra-financiers :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">E - Environnement : Gestion des déchets, émissions de carbone, consommation d'eau et d'énergie. Exemple : Une cimenterie a-t-elle des plans pour réduire son empreinte carbone ?</li>
<li class="text-base text-gray-700 leading-relaxed">S - Social : Santé et sécurité des employés, respect des normes du travail, impact sur les communautés locales (RSE). Exemple : Comment la SGI traite-t-elle ses employés et soutient-elle l'éducation ?</li>
<li class="text-base text-gray-700 leading-relaxed">G - Gouvernance : Transparence, lutte contre la corruption, indépendance du conseil (déjà couvert en 9.1.1).</li>
</ul>9.2.2 Le Rôle du Reporting et de l'AMF-UMOA
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Reporting RSE : De plus en plus d'entreprises cotées à la BRVM publient des rapports de Responsabilité Sociale et Environnementale.</li>
<li class="text-base text-gray-700 leading-relaxed">La Finance Durable : Le marché de l'UEMOA s'oriente vers des obligations vertes (Green Bonds) et des fonds ESG. Investir dans des entreprises bien notées sur ces critères réduit le risque à long terme, car elles seront moins exposées aux amendes ou aux changements réglementaires futurs.</li>
</ul>Avantage Investisseur : Une entreprise avec un score ESG élevé est souvent synonyme de meilleure gestion des risques.
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">9.3 (Atelier) : Étude de cas intégrée (Ratios + DCF + ESG)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Cette section doit être l'apogée du parcours d'analyse, permettant à l'apprenant d'appliquer tous les concepts des modules 7, 8 et 9.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">9.3.1 Structure de l'Atelier</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'atelier prend la forme d'un document téléchargeable (ou d'une série de vidéos/quiz interactifs) qui guide l'apprenant à travers une analyse complète d'une entreprise réelle de la BRVM (ex. SONATEL ou Ecobank).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Étape de l'Atelier	Module Réf.	Action Clé pour l'Apprenant</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">I. Examen Qualitatif	M9 (9.1)	Évaluer l'équipe dirigeante, identifier l'avantage concurrentiel (Moat).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">II. Analyse de Performance	M7 (7.2/7.3)	Calculer la croissance du Chiffre d'Affaires sur 5 ans. Calculer et interpréter le ROE et la Marge Nette.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">III. Solvabilité et Endettement	M7 (7.3)	Calculer le Gearing et évaluer le risque de dette.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">IV. Valorisation par les Multiples	M7 (7.3)	Calculer le PER et le comparer à la moyenne sectorielle à la BRVM.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">V. Valorisation Projections	M8 (8.1/8.2)	Si l'entreprise est mature : Appliquer le modèle DDM (Gordon-Shapiro) pour obtenir une valeur intrinsèque.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">VI. Analyse ESG et Risque	M9 (9.2)	Synthétiser les informations ESG pour noter le risque extra-financier.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">VII. Conclusion	M5 à M9	Décision d'Investissement : Comparer la valeur intrinsèque (V) à la valeur de marché (P). Acheter si V > P, Vendre si P > V.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Résultat Attendue : L'apprenant doit être capable de rédiger une note de synthèse d'analyste argumentée.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Nous avons maintenant couvert l'analyse complète (chiffres, projections, contexte). Il est temps d'intégrer le risque dans la structure du portefeuille.</p>
`,
  });
  console.log('✅ Module 9: Module 9 mis à jour.');


  // ===============================================
  // === M10: MODULE 10 ===
  // ===============================================
  await createOrUpdateModule({
    title: "Module 10",
    slug: 'module-10',
    description: "Description du module 10",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 65,
    order_index: 10,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">📉 Module 10 : L’Art du Timing – Analyse Technique et Lecture du Marché</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Comprendre la philosophie de l'Analyse Technique (AT) et son rôle complémentaire à l'Analyse Fondamentale.</li>
<li class="text-base text-gray-700 leading-relaxed">Décoder les graphiques de prix (chandeliers, tendances, support/résistance).</li>
<li class="text-base text-gray-700 leading-relaxed">Utiliser les indicateurs techniques clés (Moyennes Mobiles, RSI, MACD, Bandes de Bollinger) pour identifier les points d'entrée et de sortie.</li>
<li class="text-base text-gray-700 leading-relaxed">Élaborer une stratégie de timing prudente et adaptée au contexte de la BRVM.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">10.1 Philosophie et Théorie de Dow</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'Analyse Technique (AT) est l'étude des mouvements de prix historiques d'un titre, généralement représentés par des graphiques. Elle repose sur des postulats clés formalisés par la Théorie de Dow, le père de l'analyse technique.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">10.1.1 Les Postulats Fondamentaux de l'AT</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Le marché actualise tout : Le prix actuel de l'action reflète déjà toutes les informations fondamentales, économiques et psychologiques connues (bénéfices, crises, rumeurs).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Les prix évoluent en tendances : Les mouvements de prix ne sont pas aléatoires ; ils suivent des directions identifiables (tendance haussière, baissière, neutre).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	L'histoire se répète : Les schémas de comportement humain (peur, avidité, Module 6) se répètent, menant à la récurrence de certaines configurations graphiques.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Rôle pour Mamadou (l'Investisseur Débutant) : Alors que l'Analyse Fondamentale (M7/M9) vous dit quoi acheter (la valeur), l'Analyse Technique vous aide à déterminer quand acheter ou vendre (le timing).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">10.2 Chartisme et Lecture de Graphiques</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">10.2.1 Un Graphique, une Histoire : Les Chandeliers Japonais</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le graphique en chandeliers est le plus utilisé. Chaque chandelier représente une période de temps (jour, semaine, etc.) et raconte l'histoire de la confrontation entre acheteurs et vendeurs.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Le Corps : Zone entre le prix d'ouverture et de clôture.</li>
</ul>o	Vert/Blanc : Prix a augmenté (Clôture > Ouverture) – Domination des Acheteurs.
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Rouge/Noir : Prix a diminué (Clôture < Ouverture) – Domination des Vendeurs.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Les Mèches (ou Ombres) : Indiquent les prix les plus hauts et les plus bas atteints pendant la période.</li>
</ul>
<p class="text-base mb-4 leading-relaxed text-gray-700">Shutterstock</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">10.2.2 Identifier les Tendances (Le Concept Clé)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le concept le plus important est la tendance, la direction générale des prix.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Tendance Haussière (Bullish) : Succession de sommets et de creux de plus en plus hauts.</li>
<li class="text-base text-gray-700 leading-relaxed">Tendance Baissière (Bearish) : Succession de sommets et de creux de plus en plus bas.</li>
<li class="text-base text-gray-700 leading-relaxed">Tendance Neutre (Latérale) : Prix se déplaçant horizontalement dans une fourchette limitée.</li>
</ul>10.2.3 Support et Résistance (Niveaux Psychologiques)
<p class="text-base mb-4 leading-relaxed text-gray-700">Ce sont des niveaux de prix importants qui agissent comme des barrières.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Support (Le Plancher) : Niveau où l'intérêt d'achat est suffisamment fort pour empêcher le prix de baisser davantage.</li>
<li class="text-base text-gray-700 leading-relaxed">Résistance (Le Plafond) : Niveau où la pression de vente est forte, empêchant le prix de monter.</li>
</ul>L'Analogie à Retenir : Le Prix du Sac de Riz au Marché
<p class="text-base mb-4 leading-relaxed text-gray-700">Le prix du sac de riz peut fluctuer, mais il y a toujours un prix minimal (le Support) en dessous duquel les producteurs refusent de vendre, et un prix maximal (la Résistance) au-delà duquel les clients refusent d'acheter.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">10.3 Indicateurs Clés : Lisser, Mesurer la Force et le Momentum</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Les indicateurs sont des formules mathématiques appliquées aux prix pour donner des signaux plus clairs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">10.3.1 Moyennes Mobiles (MM) : Lisser la Tendance</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Les Moyennes Mobiles (MM) sont des lignes qui représentent le prix moyen sur une période donnée (ex: MM 50 jours, MM 200 jours).</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Rôle : Lisser les fluctuations quotidiennes et identifier la tendance sous-jacente.</li>
<li class="text-base text-gray-700 leading-relaxed">Règles Simples : Si le prix de l'action est au-dessus de sa MM 200 jours, c'est un signal de force à long terme. Le croisement de deux MM (ex: MM 50 qui croise la MM 200 par le bas) donne des signaux d'achat (Golden Cross).</li>
</ul>10.3.2 RSI (Relative Strength Index) : Mesurer la Force
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Rôle : Indicateur de momentum qui mesure la vitesse et le changement des mouvements de prix. Il indique si l'actif est suracheté ou survendu.</li>
<li class="text-base text-gray-700 leading-relaxed">Interprétation :</li>
</ul>o	RSI > 70 : Le titre est suracheté (trop d'acheteurs) et une correction (baisse) pourrait être imminente.
<p class="text-base mb-4 leading-relaxed text-gray-700">o	RSI < 30 : Le titre est survendu (trop de vendeurs) et un rebond pourrait être proche.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">10.3.3 MACD (Moving Average Convergence Divergence) : Mesurer l'Impulsion</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Rôle : Indicateur de tendance qui montre la relation entre deux moyennes mobiles du prix d'un titre.</li>
<li class="text-base text-gray-700 leading-relaxed">Signal : Les croisements entre la ligne MACD et sa ligne de signal sont des points d'achat ou de vente potentiels.</li>
</ul>10.3.4 Bandes de Bollinger : Mesurer la Volatilité
<p class="text-base mb-4 leading-relaxed text-gray-700">Les Bandes de Bollinger sont des lignes tracées au-dessus et en dessous d'une moyenne mobile. Elles mesurent la volatilité du prix.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Interprétation : Lorsque les bandes se resserrent, cela signale une faible volatilité et l'anticipation d'un mouvement de prix important imminent.</li>
</ul>10.4 Comprendre et Utiliser la Volatilité
<p class="text-base mb-4 leading-relaxed text-gray-700">La volatilité est l'intensité et la fréquence des variations de prix (déjà abordé en M5). En Analyse Technique, la volatilité est une opportunité.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Forte Volatilité : Risque élevé, mais potentiel de gain rapide. Le timing est crucial.</li>
<li class="text-base text-gray-700 leading-relaxed">Faible Volatilité : Risque faible, mais faible potentiel de gain rapide. Idéal pour l'accumulation par l'investisseur à long terme.</li>
</ul>Stratégie BRVM : Sur un marché comme la BRVM, où la liquidité peut être intermittente, la volatilité des prix peut parfois être exagérée. L'investisseur fondamentaliste utilise ces pics de volatilité (baisse) pour acheter à bas prix.
<p class="text-base mb-4 leading-relaxed text-gray-700">10.5 Synthèse Technique et Confirmation Multi-Signaux</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Ne jamais prendre une décision sur un seul indicateur. La puissance de l'AT réside dans la confirmation de plusieurs signaux.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Signal 1 (Tendance)	Signal 2 (Momentum)	Signal 3 (Volatilité)	Décision (Confirmation)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le prix touche un Support.	Le RSI sort de la zone de survendue (remonte au-dessus de 30).	Les Bandes de Bollinger se resserrent puis s'écartent.	SIGNAL D'ACHAT FORT</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le prix atteint une Résistance.	Le RSI entre en zone de surachat (dépasse 70).	Le prix est loin de sa MM 200 jours.	SIGNAL DE VENTE/PRISE DE PROFIT</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">10.6 Lecture en Temps Réel des Graphiques BRVM</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'application des outils doit être adaptée aux réalités du marché régional :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Privilégier les Grandes Périodes : Utilisez des graphiques hebdomadaires ou mensuels (vs quotidiens) pour identifier la tendance de fond. Le trading intra-journalier est risqué sur le marché UEMOA.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Liquidity Filter : Focalisez-vous sur les titres les plus liquides (Sonatel, Ecobank, SGB-CI) où l'AT est plus fiable. Les titres peu liquides ont des graphiques erratiques.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">⚙️ Atelier Pratique : Élaboration d’une Stratégie Technique BRVM</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'apprenant doit concevoir sa propre règle de timing :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Choisissez votre actif BRVM (ex: une valeur analysée en M7/M9).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Définissez votre indicateur de tendance : (ex: MM 200 jours).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Définissez votre indicateur de timing : (ex: RSI 30/70).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.	Établissez votre règle : J'achète une fois que l'action est fondamentalement solide, si son prix est près du Support ET que le RSI est inférieur à 40.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Les Termes à Maîtriser</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Terme	Définition</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Chandelier Japonais	Représentation graphique des mouvements de prix (ouverture, clôture, haut, bas) sur une période.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Support / Résistance	Niveaux de prix psychologiques qui agissent comme plancher et plafond.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Moyenne Mobile (MM)	Ligne traçant le prix moyen lissé sur une période (ex: 50 ou 200 jours).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">RSI	Relative Strength Index, indicateur de momentum qui mesure si un titre est suracheté ou survendu.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Tendance	La direction générale des mouvements de prix sur une période.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Vous avez le mental, l'analyse fondamentale et l'outil de timing. La dernière pièce du puzzle est la gestion du risque structurel.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👉 Prochaine leçon : Module 11 — La Maîtrise du Risque : Diversification et Gestion de Portefeuille.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">💼 Module 11 : Maîtrise du Risque et Gestion de Portefeuille</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Comprendre et appliquer le principe de la diversification pour réduire le risque non systématique de votre portefeuille.</li>
<li class="text-base text-gray-700 leading-relaxed">Structurer un portefeuille cohérent en fonction de votre profil d'investisseur (M5) et des grandes stratégies (M6).</li>
<li class="text-base text-gray-700 leading-relaxed">Mettre en place des techniques de gestion du risque pour protéger votre capital contre les chocs de marché.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">11.1 Révision : La Puissance des Intérêts Composés</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Cette section sert de rappel puissant pour motiver la discipline de gestion.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">11.1.1 L'effet boule de neige du capital</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Nous avons vu au Module 6 que les intérêts composés sont le moteur de l'enrichissement à long terme. Ils ne fonctionnent que si :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Vous commencez tôt (le temps est la variable la plus importante).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Vous réinvestissez vos gains (dividendes, plus-values).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Vous évitez les pertes catastrophiques qui cassent l'effet exponentiel.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Rappel de la formule :</p>
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{Valeur Finale} = \text{Capital} \times (1 + \text{Taux d'intérêt})^{\text{Nombre d'années}} \text{}</div>
</div>
</div>
</div>
<p class="text-base mb-4 leading-relaxed text-gray-700">Conclusion : La gestion du risque (qui est le sujet principal de ce module) est la seule garantie que la courbe de vos intérêts composés ne s'arrête pas en cas de crise.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">11.2 Les Grandes Stratégies : Allocation d'Actifs et Cohérence</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Cette section réaffirme le lien entre l'analyse qualitative/quantitative et la construction de portefeuille.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">11.2.1 Réviser les Grandes Approches (M6)</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Value Investing (Valeur) : Acheter des titres sous-évalués (V > P). Ce portefeuille nécessite patience et une bonne analyse fondamentale (M7).</li>
<li class="text-base text-gray-700 leading-relaxed">Growth Investing (Croissance) : Acheter des entreprises en forte croissance. Ce portefeuille est plus volatil et nécessite d'accepter un PER plus élevé.</li>
<li class="text-base text-gray-700 leading-relaxed">Dividendes (Revenus) : Choisir des entreprises matures (BRVM) qui offrent un flux de trésorerie régulier.</li>
</ul>11.2.2 L'Allocation d'Actifs (Rappel M5)
<p class="text-base mb-4 leading-relaxed text-gray-700">Votre portefeuille doit refléter votre profil d'investisseur (M5). La première décision stratégique est l'allocation entre les grandes classes d'actifs :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Profil d'Investisseur	Objectif	Allocation Actions / Obligations (Ex.)	Rôle du Portefeuille</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Prudent	Sécurité	20% Actions / 80% Obligations	Protection du capital</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Équilibré	Croissance Modérée	50% Actions / 50% Obligations	Équilibre entre sécurité et performance</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Dynamique	Maximisation	80% Actions / 20% Obligations	Recherche de la croissance maximale</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Conseil BRVM : Les obligations (publiques ou d'entreprise) cotées à la BRVM sont un excellent outil de diversification pour la partie "sécurité" du portefeuille.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">11.3 Gestion du Risque : Le Rempart du Portefeuille</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le but de la gestion du risque n'est pas d'éviter toute perte, mais de s'assurer qu'aucune perte ne puisse mettre en péril l'intégralité de votre capital.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">11.3.1 La Diversification : La Seule Règle d'Or</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La diversification est l'art de ne pas mettre tous ses œufs dans le même panier.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">A. Risque Systématique vs. Non Systématique</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Risque Systématique (Risque de Marché) : Le risque qui affecte toutes les actions (ex: une crise régionale, une hausse des taux BCEAO). Ce risque ne peut pas être éliminé par la diversification.</li>
<li class="text-base text-gray-700 leading-relaxed">Risque Non Systématique (Risque Spécifique) : Le risque propre à une seule entreprise (ex: une mauvaise gestion chez une banque, une grève chez un agro-industriel). Ce risque peut être éliminé par la diversification.</li>
</ul>Conclusion : En investissant dans suffisamment d'entreprises (souvent 10 à 15 titres), vous éliminez la quasi-totalité du risque non systématique, vous laissant seulement face au risque de marché.
<p class="text-base mb-4 leading-relaxed text-gray-700">B. Les Piliers de la Diversification</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Par Actifs : Actions, Obligations, OPCVM, Immobilier.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Par Secteurs : Ne pas investir 80 % de votre capital dans les banques, même si vous les analysez bien (répartir entre télécoms, agro-industrie, banques, etc.).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Par Géographie : Le marché BRVM est déjà diversifié géographiquement (8 pays), mais vous pouvez ajouter des actions de marchés plus stables (Europe, USA).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">11.3.2 Les Techniques de Protection du Capital</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Même avec un bon portefeuille, vous devez vous protéger contre l'émotion et les événements imprévus.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">L'Investissement Échelonné (Dollar-Cost Averaging - DCA) :</li>
</ul>o	Principe : Au lieu d'investir 100% de votre capital en une seule fois (tentative de "Timer" le marché, M6), vous investissez le même montant régulièrement (ex: 50 000 FCFA par mois).
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Avantage : Vous achetez à la fois cher et bon marché, lissant votre prix d'achat et éliminant le risque de timing. C'est l'approche la plus disciplinée pour le débutant.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Les Ordres Stop-Loss :</li>
</ul>o	Principe : Ordre donné à votre SGI de vendre automatiquement un titre si son prix atteint un seuil de perte prédéfini (ex: 10% de perte).
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Rôle : Protéger votre portefeuille contre des chutes brutales. Il transforme la décision émotionnelle (quand vendre en cas de chute) en une règle mécanique et disciplinée.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">11.3.3 Le Rééquilibrage du Portefeuille (Rebalancing)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Avec le temps, vos actions les plus performantes vont occuper une part de plus en plus grande de votre portefeuille, déséquilibrant l'allocation initiale.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Exemple : Si vous étiez à 50% Actions / 50% Obligations, et que les actions prennent 30%, vous êtes maintenant à 65% Actions / 35% Obligations.</li>
<li class="text-base text-gray-700 leading-relaxed">Action : Le rééquilibrage consiste à vendre une partie des actifs qui ont trop monté (les actions) pour racheter des actifs qui sont en retard (les obligations), ramenant le portefeuille à sa proportion cible (50/50).</li>
<li class="text-base text-gray-700 leading-relaxed">Avantage : Cela force l'investisseur à vendre cher et acheter bon marché d'une manière mécanique et disciplinée (anticorps contre l'avidité, M6).</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Nous avons maintenant achevé le parcours complet, de la compréhension du marché à la gestion du risque. Le module suivant sera consacré à la synthèse finale et aux étapes pratiques pour l'exécution.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">👷 Module 12 : L’Art de l’Architecte – Gestion Avancée du Risque</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Différencier l'allocation d'actifs stratégique et tactique et comprendre comment ajuster votre portefeuille aux conditions du marché BRVM.</li>
<li class="text-base text-gray-700 leading-relaxed">Mettre en œuvre des techniques de diversification avancées spécifiques au marché UEMOA (sectorielle et régionale).</li>
<li class="text-base text-gray-700 leading-relaxed">Appliquer le position sizing pour gérer l'exposition au risque de chaque ligne de votre portefeuille.</li>
<li class="text-base text-gray-700 leading-relaxed">Comprendre les principes du hedging (couverture) comme outil de protection.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">12.1 Allocation d’Actifs Stratégique et Tactique</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'allocation d'actifs est la répartition de votre capital entre les grandes classes d'actifs (Actions, Obligations, Liquidités). Il existe deux manières de l'aborder :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">12.1.1 L'Allocation Stratégique (Le Plan de Route)</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Principe : C'est la répartition de base, définie par votre profil d'investisseur (M5) et votre horizon. C'est l'objectif de long terme que vous maintenez par le rééquilibrage (rebalancing, M11).</li>
<li class="text-base text-gray-700 leading-relaxed">Rôle : Elle est passive et a pour but d'atteindre vos objectifs en minimisant la volatilité à long terme.</li>
</ul>12.1.2 L'Allocation Tactique (L'Ajustement FIn)
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Principe : C'est un ajustement temporaire de l'allocation stratégique pour tirer parti des conditions de marché à court/moyen terme.</li>
<li class="text-base text-gray-700 leading-relaxed">Exemple BRVM :</li>
</ul>o	Si vous anticipez une hausse des taux d'intérêt BCEAO (M2), vous pouvez réduire temporairement votre exposition aux obligations (qui baissent en valeur quand les taux montent) et augmenter les liquidités.
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Si une crise de l'or noir affecte la Côte d'Ivoire, vous pourriez réduire légèrement l'exposition aux actions ivoiriennes pour renforcer l'exposition aux actions sénégalaises.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Attention : L'allocation tactique est une compétence avancée et ne doit jamais dévier radicalement de votre stratégie.</li>
</ul>Analogie : L'Allocation Stratégique est le plan de vol initial (Dakar à Abidjan). L'Allocation Tactique est le pilote qui ajuste l'altitude pour éviter les turbulences.
<p class="text-base mb-4 leading-relaxed text-gray-700">12.2 Diversification Sectorielle à la BRVM</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Nous avons vu que la diversification réduit le risque non systématique (M11). Sur un marché régional comme la BRVM, la diversification sectorielle est essentielle.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">12.2.1 Diversification des Moteurs de Croissance</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Les moteurs de croissance de l'UEMOA ne sont pas les mêmes dans tous les secteurs :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Secteur Bancaire (Ex: ECOBANK CI, SGB-CI) : Sensible au coût de l'argent (BCEAO) et à la croissance du crédit. Offre des dividendes stables.</li>
<li class="text-base text-gray-700 leading-relaxed">Secteur Agro-Industriel (Ex: PALM-CI, SUCRIVOIRE) : Sensible aux cours mondiaux des matières premières (cacao, huile de palme) et au climat. Offre une protection contre l'inflation locale.</li>
<li class="text-base text-gray-700 leading-relaxed">Secteur des Télécoms (Ex: SONATEL) : Sensible à la pénétration d'internet et à l'innovation. Offre un fort potentiel de croissance (Growth Investing).</li>
</ul>Règle : Ne pas dépasser 15 à 20 % de votre portefeuille total sur un seul secteur pour minimiser l'impact d'une crise sectorielle (ex: une année de mauvaise récolte sur l'agro-industrie).
<p class="text-base mb-4 leading-relaxed text-gray-700">12.2.2 Le Risque de Corrélation et la BRVM</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Corrélation : Deux actifs sont corrélés s'ils montent et descendent en même temps.</li>
<li class="text-base text-gray-700 leading-relaxed">Le Piège Régional : Sur la BRVM, les actions ont souvent une forte corrélation, car elles réagissent toutes aux mêmes chocs macroéconomiques régionaux (prix du pétrole, décisions BCEAO, etc.).</li>
<li class="text-base text-gray-700 leading-relaxed">L'Antidote : Pour une diversification efficace, il faut trouver des actifs avec une faible corrélation (ex: comparer une action BRVM avec une obligation d'État émise par un pays non UEMOA).</li>
</ul>12.3 Position Sizing – Ajuster la Taille de Position
<p class="text-base mb-4 leading-relaxed text-gray-700">Le Position Sizing est la technique qui permet de déterminer combien d'argent vous allez placer sur un titre donné. C'est le lien direct entre votre analyse de risque et l'exécution d'un ordre (M10).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">12.3.1 La Règle du Risque de Capital (La Règle des 1%)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La règle la plus stricte pour le débutant est la Règle des 1%.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Principe : Vous ne devez jamais risquer de perdre plus de 1% de votre capital total sur une seule transaction.</li>
<li class="text-base text-gray-700 leading-relaxed">Application : Si votre capital est de 1 000 000 FCFA, le risque maximal que vous acceptez est de 10 000 FCFA (1%).</li>
</ul>12.3.2 L'Utilisation du Stop-Loss (Rappel M11)
<p class="text-base mb-4 leading-relaxed text-gray-700">Pour calculer la taille de votre position ($T_{pos}$), vous devez définir où vous placez votre Stop-Loss (le seuil de vente automatique, M11).</p>
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{Taille de Position} = \frac{\text{Capital risqué maximal}}{\text{Perte unitaire acceptée}}</div>
</div>
</div>
</div>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Exemple Concret :</li>
</ul>o	Capital risqué maximal (1%) : 10 000 FCFA.
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Vous achetez une action à 10 000 FCFA et vous placez votre Stop-Loss à 9 500 FCFA. La perte unitaire acceptée est de 500 FCFA (10 000 - 9 500).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	$\text{Taille de Position} = 10 000 \text{ FCFA} / 500 \text{ FCFA} = 20$ actions.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Vous achetez seulement 20 actions. Si le Stop-Loss est touché, vous perdez exactement 10 000 FCFA.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Avantage : Cette méthode vous permet d'investir de manière disciplinée et mécanique, en vous assurant que vous pouvez survivre à une série de pertes sans dérailler.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">12.4 Hedging et Gestion de la Couverture</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le Hedging (couverture) est une technique avancée qui vise à réduire ou compenser le risque d'un portefeuille existant.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">12.4.1 Les Principes du Hedging</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Vente à Découvert (Short Selling) : Vendre un actif que vous ne possédez pas, dans l'espoir de le racheter moins cher plus tard. Cette technique est très risquée et souvent non accessible ou déconseillée aux débutants sur la BRVM.</li>
<li class="text-base text-gray-700 leading-relaxed">Utilisation d'Actifs Non Corréllés : La forme la plus simple de hedging pour l'investisseur BRVM est de détenir des actifs qui ne réagissent pas de la même manière au marché local :</li>
</ul>o	Or / Devises fortes : En cas de forte crise régionale, ces actifs conservent souvent leur valeur ou augmentent.
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Obligations d'État BRVM : Elles sont moins volatiles que les actions et servent de refuge en période d'incertitude boursière.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">12.4.2 La Couverture par l'Équilibre (Le Véritable Hedging du Débutant)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le meilleur hedging pour l'investisseur BRVM n'est pas l'utilisation de produits complexes, mais le maintien rigoureux de :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Liquidités (Cash) : Garder 10 à 20 % du portefeuille en liquidités (hors bourse) pour pouvoir saisir les opportunités d'achat en cas de krach boursier (quand tout le monde panique, M6).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Allocation Stratégique : S'assurer que les obligations ou les OPCVM Prudents couvrent une partie significative de votre portefeuille.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🧭 Prochaine Étape</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Félicitations ! Vous avez désormais le plan complet d'un investisseur averti. Le dernier module est la conclusion et la feuille de route pour passer à l'action.</p>
`,
  });
  console.log('✅ Module 10: Module 10 mis à jour.');


  // ===============================================
  // === M13: MODULE 13 ===
  // ===============================================
  await createOrUpdateModule({
    title: "Module 13",
    slug: 'module-13',
    description: "Description du module 13",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 80,
    order_index: 13,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">⚙️ Module 13 : Outils, Actualités et Fiscalité</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Maîtriser les plateformes numériques pour suivre l'actualité de la BRVM et passer vos ordres.</li>
<li class="text-base text-gray-700 leading-relaxed">Comprendre le régime fiscal des revenus de portefeuille (plus-values, dividendes) dans l'espace UEMOA.</li>
<li class="text-base text-gray-700 leading-relaxed">Mettre en place un système de suivi et de reporting régulier pour mesurer la performance réelle de vos investissements.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">13.1 Utilisation des Plateformes : Le Passage à l'Action</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">13.1.1 Le Rôle de la SGI : L'Intermédiaire Indispensable</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Votre Société de Gestion et d’Intermédiation (SGI) est votre unique point d'entrée sur le marché.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Ouverture du Compte : Un compte-titres et un compte espèces sont ouverts à votre nom. Le DC/BR (Dépositaire Central / Banque de Règlement) conserve vos titres en toute sécurité, indépendamment de la SGI.</li>
<li class="text-base text-gray-700 leading-relaxed">Plateforme de Trading : La plupart des SGI modernes offrent désormais des plateformes en ligne (ou applications mobiles) pour passer vos ordres d'achat et de vente directement.</li>
</ul>Point Clé : Assurez-vous que la plateforme de votre SGI permet de passer des ordres au prix limite (Limit Order) et des ordres de type Stop-Loss (M12) pour exécuter votre stratégie de timing et de gestion du risque.
<p class="text-base mb-4 leading-relaxed text-gray-700">13.1.2 Les Outils de Suivi : BRVM, SGI et Afribourse</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Outil	Rôle Principal	Informations Clés à Consulter</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Site Officiel BRVM	Information Légale et Marchande	Cours officiels du jour, indices (BRVM Composite), actualités réglementaires, calendrier des introductions en bourse.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Site ou App de votre SGI	Gestion du Portefeuille	Solde de votre compte espèces, valorisation de vos titres en temps réel, exécution des ordres.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Plateformes d'Actualités (ex : Afribourse)	Analyse et Média	Rapports d'analyse sur les sociétés cotées (M7/M9), articles de presse économique UEMOA, avis d'experts.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">13.2 Fiscalité des Revenus de Portefeuille dans l’UEMOA</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'optimisation fiscale est essentielle, mais il est crucial de respecter les lois en vigueur. La fiscalité dans l'UEMOA est régie par les lois nationales, mais avec certaines tendances communes.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">13.2.1 Imposition des Dividendes (Revenus)</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Principe : Les dividendes sont généralement soumis à une retenue à la source (RAS) au niveau national, souvent entre 7 % et 15 % selon le pays (ex: Sénégal, Côte d'Ivoire).</li>
<li class="text-base text-gray-700 leading-relaxed">Rôle de la SGI : La SGI ou la banque est responsable d'opérer cette retenue avant de vous verser le montant net.</li>
<li class="text-base text-gray-700 leading-relaxed">Important : Dans de nombreux pays de l'UEMOA, cette RAS est libératoire, ce qui signifie que vous n'avez pas à déclarer à nouveau ces revenus.</li>
</ul>13.2.2 Imposition des Plus-Values (Gains en Capital)
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Plus-Value : C'est le profit réalisé lorsque vous vendez une action à un prix supérieur à son prix d'achat.</li>
<li class="text-base text-gray-700 leading-relaxed">Régime Général : Les plus-values sont souvent soumises à une imposition, dont le taux varie d'un pays à l'autre de l'UEMOA (souvent faible ou nul pour encourager l'investissement en bourse).</li>
<li class="text-base text-gray-700 leading-relaxed">Vérification : Il est impératif de vérifier la législation en vigueur dans votre pays de résidence et de détenir les titres pour les exonérations de longue durée.</li>
</ul>Conseil d'Expert : Consultez toujours un expert-comptable ou le service fiscal de votre SGI pour connaître les taux et procédures spécifiques à votre pays de résidence.
<p class="text-base mb-4 leading-relaxed text-gray-700">13.3 Suivi, Reporting, et Journal de Performance</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Un investisseur discipliné (M6) est un investisseur qui mesure et analyse ses résultats.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">13.3.1 Création d'un Journal de Performance</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le journal de performance est un outil simple (un fichier Excel ou un carnet) qui assure la discipline et le reporting. Il doit contenir :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Date et Prix d'Achat : Pour chaque transaction.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Raison de l'Achat : (Réf. Analyse Fondamentale M7/M9, ou Timing M10).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Stratégie de Sortie : Où se situe votre Stop-Loss (M12) et votre objectif de vente.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.	Performance Réelle : Le taux de rendement annuel du portefeuille.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">13.3.2 Mesurer la Performance (Le Rendement Annuel)</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Le rendement annuel (Return) est le critère clé pour évaluer votre succès.</p>
<div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
<div class="text-center">
<div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
<div class="font-mono text-lg text-gray-900">\text{Rendement Annuel} = \frac{(\text{Valeur Finale} - \text{Valeur Initiale}) + \text{Dividendes Reçus}}{\text{Valeur Initiale}} \times 100</div>
</div>
</div>
</div>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Benchmark BRVM : Votre objectif doit être de surpasser l'indice de référence de la BRVM (BRVM Composite ou BRVM 10). Si votre portefeuille fait 8 % mais que l'indice fait 15 %, vous avez sous-performé le marché.</li>
<li class="text-base text-gray-700 leading-relaxed">Fréquence : Évaluez votre performance tous les trimestres ou tous les six mois. Ne laissez jamais les émotions quotidiennes (M6) influencer cette analyse structurée.</li>
</ul>13.3.3 L'Audit de Décision (Leçon d'Humbleté)
<p class="text-base mb-4 leading-relaxed text-gray-700">La dernière étape est la plus importante :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Analyser les Erreurs : Pour chaque vente perdante, demandez-vous : Était-ce une erreur d'analyse fondamentale (M7), ou une erreur de discipline (M6) ?</li>
<li class="text-base text-gray-700 leading-relaxed">Amélioration Continue : L'investissement est un marathon. Chaque erreur est une leçon pour ajuster votre stratégie d'architecte (M12).</li></ul>
`,
  });
  console.log('✅ Module 13: Module 13 mis à jour.');


  // ===============================================
  // === M14: MODULE 14 ===
  // ===============================================
  await createOrUpdateModule({
    title: "Module 14",
    slug: 'module-14',
    description: "Description du module 14",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: 85,
    order_index: 14,
    is_published: true,
    content: `
<p class="text-base mb-4 leading-relaxed text-gray-700">🌍 Module 14 : Contexte Économique – Sentir le Pouls du Marché UEMOA</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Comprendre l'influence directe de la Banque Centrale (BCEAO) sur les prix des actions et obligations à la BRVM.</li>
<li class="text-base text-gray-700 leading-relaxed">Identifier les tendances et opportunités macroéconomiques majeures (Finance Durable, croissance démographique) dans l'UEMOA.</li>
<li class="text-base text-gray-700 leading-relaxed">Lire et interpréter les indicateurs économiques clés (PIB, Inflation, Taux d'Intérêt) pour affiner votre stratégie d'investissement.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">14.1 Le Mécanisme de Transmission BCEAO → BRVM</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La Banque Centrale des États de l’Afrique de l’Ouest (BCEAO), située à Dakar, est l'autorité monétaire des huit pays de l'UEMOA. Ses décisions ont un impact direct sur le coût du capital pour les entreprises et les investisseurs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">14.1.1 Le Rôle Clé des Taux d'Intérêt Directeurs</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Taux Directeurs (Taux de Politique Monétaire) : La BCEAO fixe les taux auxquels elle prête de l'argent aux banques commerciales de l'UEMOA.</li>
<li class="text-base text-gray-700 leading-relaxed">Mécanisme de Transmission :</li>
</ul>1.	Hausse des Taux : L'argent devient plus cher pour les banques, qui le répercutent sur les entreprises et les particuliers (prêts plus chers).
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Conséquence sur la BRVM :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">	Actions : Les entreprises s'endettent moins, investissent moins et ont un coût du capital plus élevé (voir WACC, M8). Cela freine les bénéfices, ce qui peut faire baisser le prix des actions.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">	Obligations : Les obligations plus anciennes, qui offrent un rendement plus faible, deviennent moins attractives. La valeur de marché des anciennes obligations baisse.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">14.1.2 Stabilité de la Monnaie et Confiance des Investisseurs</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Le Franc CFA : Sa parité fixe avec l'Euro (garantie de la France) assure une stabilité monétaire dans la zone UEMOA.</li>
<li class="text-base text-gray-700 leading-relaxed">Impact : Cette stabilité est un facteur de confiance essentiel pour les investisseurs étrangers, qui sont assurés que leurs profits ne seront pas érodés par une dévaluation imprévue de la monnaie locale.</li>
</ul>14.2 Opportunité Majeure : La Finance Durable dans l’UEMOA
<p class="text-base mb-4 leading-relaxed text-gray-700">La Finance Durable et le reporting ESG (M9) ne sont pas seulement des tendances, ce sont des vecteurs de croissance pour la région et des opportunités d'investissement.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">14.2.1 Les Obligations Vertes (Green Bonds)</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Définition : Ce sont des titres de dette émis par des États, des entités publiques ou des entreprises pour financer des projets ayant un impact environnemental positif (énergies renouvelables, gestion de l'eau, etc.).</li>
<li class="text-base text-gray-700 leading-relaxed">Contexte UEMOA : La BRVM est de plus en plus utilisée pour émettre des Obligations Vertes et Sociales. Ces titres attirent des fonds d'investissement internationaux spécialisés et augmentent la liquidité du marché obligataire.</li>
<li class="text-base text-gray-700 leading-relaxed">Avantage Investisseur : En tant qu'investisseur, vous pouvez allier rendement et impact, tout en bénéficiant de la stabilité du marché obligataire.</li>
</ul>14.2.2 Les Sociétés Positionnées sur l'Avenir
<p class="text-base mb-4 leading-relaxed text-gray-700">L'analyse macroéconomique identifie les secteurs qui bénéficieront le plus des mégatendances régionales :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	Transition Énergétique : Les entreprises qui produisent de l'énergie propre ou offrent des services d'efficacité énergétique (opportunités ESG).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Démographie et Consommation : Les entreprises axées sur les besoins de base d'une population jeune et croissante (télécoms, banques, agro-industrie).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Digitalisation : Les entreprises technologiques et les banques qui investissent dans la FinTech pour capter une clientèle non bancarisée.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">14.3 Lecture et Interprétation des Rapports Macroéconomiques</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'investisseur éclairé utilise les rapports (BCEAO, FMI, Banques régionales) pour anticiper les chocs.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">14.3.1 Les Indicateurs Clés de l'UEMOA</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Indicateur	Définition	Signification pour l'Investisseur BRVM</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">PIB (Produit Intérieur Brut)	Valeur totale des biens et services produits dans l'UEMOA.	Une croissance du PIB (ex: > 5%) est favorable à la croissance des bénéfices des entreprises (M7).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Taux d'Inflation	Augmentation générale des prix.	Une forte inflation est un risque. Les entreprises qui peuvent augmenter leurs prix sans perdre de clients (fort pricing power) sont favorisées.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Balance Commerciale	Différence entre les exportations et les importations.	Un excédent (Export > Import) est un signe de force économique régionale.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Dette Publique / PIB	Niveau d'endettement des États membres.	Un faible niveau de dette rassure les investisseurs sur la solvabilité des obligations d'État.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">14.3.2 L'Analyse du "Sentiment" du Marché</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'Analyse Technique (M10) mesure le sentiment sur le prix. Les rapports macroéconomiques mesurent le sentiment économique global.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Analyse "Bottom-Up" (Du Bas vers le Haut) : Vous analysez une entreprise (M7) puis vous regardez le contexte. Ex: Cette banque est bonne, mais le PIB est faible, je reste prudent.</li>
<li class="text-base text-gray-700 leading-relaxed">Analyse "Top-Down" (Du Haut vers le Bas) : Vous analysez la macroéconomie puis vous choisissez le secteur. Ex: La BCEAO va baisser les taux, je mise sur le secteur du crédit.</li>
</ul>Conclusion : L'investisseur BRVM doit utiliser l'Analyse Fondamentale pour sélectionner de bonnes entreprises et l'Analyse Macroéconomique pour choisir les bons secteurs et les bons moments pour investir
<p class="text-base mb-4 leading-relaxed text-gray-700">🧠 Module 15 : La Stratégie d’Investissement Intégrée</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">🎯 Objectif Pédagogique du Module</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">À la fin de ce module, vous serez capable de :</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Intégrer l'analyse fondamentale (FA) et l'analyse technique (TA) dans une démarche unifiée pour optimiser la sélection et le timing de vos investissements.</li>
<li class="text-base text-gray-700 leading-relaxed">Appliquer une check-list rigoureuse pour valider chaque décision, de la macroéconomie (M14) à la gestion du risque (M12).</li>
<li class="text-base text-gray-700 leading-relaxed">Mener une étude de cas complète de A à Z sur une valeur BRVM, simulant un processus d'investissement réel.</li>
</ul>________________________________________
<p class="text-base mb-4 leading-relaxed text-gray-700">15.1 FA vs TA – Une Fausse Dichotomie</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Historiquement, les analystes se sont opposés : l'un ne jure que par les chiffres et la valeur (FA), l'autre par les graphiques et le prix (TA). L'investisseur expert utilise les deux.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">15.1.1 Le Rôle Complémentaire des Deux Analyses</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Type d'Analyse	Question Répondue	Objectif	Horizon	Module Réf.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Fondamentale (FA)	QUOI acheter ?	Déterminer la valeur intrinsèque (V) de l'entreprise.	Long terme	M7, M8, M9</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Technique (TA)	QUAND acheter ?	Déterminer le meilleur point d'entrée/sortie (le prix).	Court/Moyen terme	M10</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Conclusion : Acheter une action fantastique (FA) au pire moment (TA) donnera un mauvais rendement. Acheter une action médiocre (FA) au meilleur moment (TA) donnera un rendement limité. La stratégie gagnante est d'acheter une action fantastique au meilleur moment.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">15.2 La Synthèse Fondamentale + Technique : Vers la Stratégie Intégrée</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'intégration se fait en utilisant l'Analyse Fondamentale comme Filtre et l'Analyse Technique comme Déclencheur.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">15.2.1 Le Processus d'Intégration en Trois Étapes</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">1.	L'Étape de Sélection (Le Filtre FA) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Identifier les entreprises avec un solide Moat (M9) et une bonne gouvernance.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Vérifier les fondamentaux : Croissance du Chiffre d'Affaires et ROE (Retour sur Capitaux Propres) élevés et stables (M7).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Valorisation (M8) : L'action doit être sous-évaluée (Prix de marché < Valeur Intrinsèque calculée par DDM/DCF).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	L'Étape de Timing (Le Déclencheur TA) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Le prix de l'action sélectionnée (étape 1) doit approcher ou toucher un niveau de Support clé (M10).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Le RSI (M10) doit indiquer que le titre est en zone de survente (sous 40, idéalement sous 30).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	La baisse (qui crée l'opportunité) doit être due à la panique de marché (risque systémique, M6) et non à une dégradation de l'analyse fondamentale (M7).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	L'Étape de Gestion (Le Garde-Fou Risque) :</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Mettre en place la position en appliquant le Position Sizing (Règle des 1%, M12).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">o	Définir immédiatement le niveau du Stop-Loss et le placer sur la plateforme SGI (M13).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">15.2.2 Le Rôle de la Psychologie (M6) dans l'Intégration</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">La stratégie intégrée est la meilleure protection contre l'émotion.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Avidité (Greed) : Si l'action que vous suivez est chère (PER élevé) et que le RSI indique une zone de surachat, votre stratégie intégrée vous ordonne de ne pas acheter, même si la FOMO (Peur de Manquer le Gain) est forte.</li>
<li class="text-base text-gray-700 leading-relaxed">Peur (Fear) : Si le marché s'effondre et que votre titre fondamentalement excellent touche son Support (signal TA), votre stratégie intégrée vous ordonne d'acheter (respecter l'ordre : "Soyez avide quand les autres ont peur" - M6).</li>
</ul>15.3 La Check-List de l’Investisseur Expert (Synthèse des 14 Modules)
<p class="text-base mb-4 leading-relaxed text-gray-700">Avant de passer un ordre d'achat sur la BRVM, un investisseur complet doit cocher toutes les cases de ce processus.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Catégorie	Critère de Validation (OUI/NON)	Module Réf.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Macro/Contexte	Le contexte UEMOA (M14) est-il favorable (ou l'opportunité est-elle due à un choc temporaire) ?	M14</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Fondamentaux	Le ROE (M7) est-il > 15 % et stable sur 5 ans ? La Marge Nette est-elle saine ?	M7</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Qualitatif	Le Moat (avantage concurrentiel) est-il clair et la Gouvernance (M9) est-elle solide ?	M9</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Valorisation	Le prix de marché est-il inférieur à ma Valeur Intrinsèque (M8) ? Y a-t-il une Marge de Sécurité suffisante ?	M8</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Timing	Le prix est-il sur un niveau de Support ou le RSI (M10) est-il en zone de survente (< 40) ?	M10</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Risque	Ma taille de position (Position Sizing, M12) respecte-t-elle la règle des 1 % de perte ?	M12</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Portefeuille	L'achat améliore-t-il la Diversification (M11) sectorielle et régionale de mon portefeuille ?	M11</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Discipline	Ai-je un ordre Stop-Loss et un objectif de vente clairement définis (M12) ?	M6, M12</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">15.4 (Atelier Final) : Étude de Cas Complète de A à Z</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">L'atelier final est l'exercice pratique qui valide l'intégration de toutes les compétences.</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Objectif : Simuler la décision d'investissement sur une action de la BRVM (ex: une société agro-industrielle ou un acteur du secteur financier).</li>
<li class="text-base text-gray-700 leading-relaxed">Déroulement : L'apprenant reçoit un jeu de données (rapports annuels simplifiés, graphiques de prix, actualités macro) et doit produire :</li>
</ul>1.	Une Note d'Analyse Fondamentale (Vérification des ratios M7/M9 et calcul d'une Valeur Intrinsèque M8).
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Une Analyse Technique (Identification du Support/Résistance et du signal de timing M10).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Une Proposition d'Ordre (Détermination de la taille de position M12, prix d'entrée, et Stop-Loss).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">4.	Une Justification Intégrée (Synthèse des 8 points de la Check-List M15.3).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">15.5 Conclusion : Votre Voyage Vers l’Autonomie Financière</p>
<ul class="list-disc ml-6 mb-4 space-y-2">
<li class="text-base text-gray-700 leading-relaxed">Leçon Finale : Le succès en bourse n'est pas une question de chance, mais de méthode et de discipline (M6). Vous avez maintenant le savoir, les outils (M13) et la stratégie (M15) pour vous affranchir des rumeurs et des conseils non vérifiés.</li>
<li class="text-base text-gray-700 leading-relaxed">L'Importance de Commencer : L'effet des intérêts composés (M11) dépend de la rapidité de l'exécution. Commencez par de petits montants, appliquez rigoureusement les règles de Position Sizing, et laissez le temps travailler pour vous (M5).</li>
<li class="text-base text-gray-700 leading-relaxed">Prochaines Étapes Pratiques :</li>
</ul>1.	Ouvrir votre compte SGI (M13).
<p class="text-base mb-4 leading-relaxed text-gray-700">2.	Définir votre Allocation Stratégique (M11).</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">3.	Commencer l'Analyse Fondamentale de 5 entreprises BRVM qui vous intéressent.</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">________________________________________</p>
<p class="text-base mb-4 leading-relaxed text-gray-700">Félicitations ! Le programme de formation est désormais achevé. Vous êtes passé de débutant à Architecte Investisseur de la BRVM !</p>
`,
  });
  console.log('✅ Module 14: Module 14 mis à jour.');


  console.log('Traitement des modules terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✅ Base de données déconnectée');
  });
