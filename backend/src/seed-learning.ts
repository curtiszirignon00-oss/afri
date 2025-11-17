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
    console.log("Démarrage de l'insertion/mise à jour des 11 modules d'apprentissage...");

    // ===================================
    // === M0 : PRÊT POUR LE DÉCOLLAGE ===
    // ===================================
    await createOrUpdateModule({
        title: "Prêt pour le décollage? (Mindset)",
        slug: 'pret-decollage',
        description: "Adoptez le bon état d'esprit et comprenez pourquoi la BRVM est une opportunité unique.",
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 10,
        order_index: 0,
        is_published: true,
        content: `
            <div class="bg-blue-600 text-white p-8 min-h-screen">
                <p class="text-xl italic mb-12 text-center">"L'investissement, c'est le pont entre votre présent et votre futur."</p>


                <h2 class="text-3xl font-bold mb-8">🎯 Objectif pédagogique</h2>

                <p class="text-lg mb-4 leading-relaxed">À la fin de ce module, vous :</p>

                <ul class="space-y-3 text-lg mb-12 leading-relaxed">
                    <li>• Adopterez le bon état d'esprit d'investisseur à long terme.</li>
                    <li>• Comprendrez pourquoi la BRVM représente une opportunité unique pour les Africains.</li>
                    <li>• Connaîtrez la structure complète du parcours de formation.</li>
                    <li>• Serez capables de distinguer un investisseur d'un spéculateur.</li>
                </ul>


                <h2 class="text-3xl font-bold mb-8">🪶 0.1 – Bienvenue dans l'Académie : Notre mission pour vous</h2>

                <p class="text-lg mb-4 leading-relaxed">Bienvenue dans l'Académie AfriBourse,</p>

                <p class="text-lg mb-4 leading-relaxed">Un espace pensé pour vous — l'épargnant, l'entrepreneur, le jeune professionnel — qui souhaite faire travailler son argent plutôt que de le laisser dormir.</p>

                <p class="text-lg mb-4 leading-relaxed font-semibold">💡 Constat de départ : L'épargne seule ne suffit plus.</p>

                <p class="text-lg mb-4 leading-relaxed">L'inflation grignote la valeur de votre argent au fil du temps.</p>

                <p class="text-lg mb-4 leading-relaxed">Notre mission est simple : transformer votre épargne en capital actif, grâce à une connaissance claire, à des outils accessibles, et à une pédagogie ancrée dans la réalité africaine.</p>

                <p class="text-lg mb-3 leading-relaxed font-semibold">Chez AfriBourse, nous croyons que :</p>

                <ul class="space-y-3 text-lg mb-12 leading-relaxed">
                    <li>• La connaissance est la clé de la confiance.</li>
                    <li>• La discipline est la clé de la réussite financière.</li>
                    <li>• Et que chaque Africain mérite une part du développement économique de son continent.</li>
                </ul>


                <h2 class="text-3xl font-bold mb-8">🌍 0.2 – La Bourse, un moteur pour nos économies africaines</h2>

                <p class="text-lg mb-4 leading-relaxed">Investir à la BRVM, ce n'est pas seulement chercher un rendement — c'est participer activement à la construction économique de l'Afrique de l'Ouest.</p>

                <p class="text-lg mb-3 leading-relaxed">Chaque action achetée, chaque entreprise soutenue, contribue à :</p>

                <ul class="space-y-3 text-lg mb-6 leading-relaxed">
                    <li>• Financer la croissance de sociétés locales.</li>
                    <li>• Créer des emplois et soutenir l'innovation.</li>
                    <li>• Répartir la richesse de manière plus équitable entre citoyens et investisseurs.</li>
                </ul>

                <p class="text-lg mb-8 italic text-center leading-relaxed">💬 "Quand un Africain investit dans une entreprise africaine, il investit dans le futur de son peuple."</p>


                <h3 class="text-2xl font-bold mb-6">⚓ L'analogie à retenir : le piroguier prudent</h3>

                <p class="text-lg mb-4 leading-relaxed">Imaginez votre richesse comme une pirogue.</p>

                <p class="text-lg mb-3 leading-relaxed">Le piroguier prudent ne se lance pas sans :</p>

                <ul class="space-y-3 text-lg mb-6 leading-relaxed">
                    <li>• Vérifier la météo (analyse du marché)</li>
                    <li>• Préparer son équipage (formation)</li>
                    <li>• Définir une destination (objectifs financiers)</li>
                </ul>

                <p class="text-lg mb-4 leading-relaxed">Sur la mer de l'investissement, les vagues représentent la volatilité.</p>

                <p class="text-lg mb-4 leading-relaxed">Mais celui qui a un cap, un plan et de la patience arrive toujours au rivage.</p>

                <p class="text-xl mb-12 font-bold text-center leading-relaxed">La bourse, ce n'est pas un sprint — c'est une navigation.</p>


                <h2 class="text-3xl font-bold mb-8">🗺️ 0.3 – Présentation du parcours : votre feuille de route vers l'autonomie</h2>

                <p class="text-lg mb-6 leading-relaxed">Voici comment se déroule votre voyage au sein de l'Académie AfriBourse 👇</p>

                <table class="table-auto w-full text-left border-collapse border border-white my-6">
                    <thead class="bg-blue-800">
                        <tr>
                            <th class="border border-white px-4 py-3 font-bold">Étape</th>
                            <th class="border border-white px-4 py-3 font-bold">Objectif</th>
                            <th class="border border-white px-4 py-3 font-bold">Modules concernés</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-white px-4 py-3">🧠 <strong>Mindset</strong></td>
                            <td class="border border-white px-4 py-3">Poser les bases mentales et émotionnelles de l'investisseur</td>
                            <td class="border border-white px-4 py-3">M0, M5</td>
                        </tr>
                        <tr>
                            <td class="border border-white px-4 py-3">⚙️ <strong>Fondations</strong></td>
                            <td class="border border-white px-4 py-3">Comprendre les marchés, les acteurs et les instruments</td>
                            <td class="border border-white px-4 py-3">M1, M2, M3, M4</td>
                        </tr>
                        <tr>
                            <td class="border border-white px-4 py-3">🔍 <strong>Analyse & Stratégie</strong></td>
                            <td class="border border-white px-4 py-3">Maîtriser l'analyse fondamentale et technique</td>
                            <td class="border border-white px-4 py-3">M6, M7, M8, M9, M10</td>
                        </tr>
                        <tr>
                            <td class="border border-white px-4 py-3">💼 <strong>Action & Gestion</strong></td>
                            <td class="border border-white px-4 py-3">Construire, exécuter et suivre son portefeuille</td>
                            <td class="border border-white px-4 py-3">M11 à M16</td>
                        </tr>
                    </tbody>
                </table>

                <p class="text-lg mb-4 font-semibold leading-relaxed">🎯 À la fin du parcours, vous serez capable de :</p>

                <ul class="space-y-3 text-lg mb-12 leading-relaxed">
                    <li>• Analyser une entreprise cotée à la BRVM,</li>
                    <li>• Identifier le bon moment pour investir,</li>
                    <li>• Construire un portefeuille cohérent et rentable,</li>
                    <li>• Et investir avec confiance et méthode.</li>
                </ul>


                <h2 class="text-3xl font-bold mb-8">💥 0.4 – Brisons les mythes : Investisseur vs Spéculateur</h2>


                <h3 class="text-2xl font-bold mb-6">❌ Mythe 1 : "Il faut être riche pour investir"</h3>

                <p class="text-2xl mb-6 font-bold text-center leading-relaxed">FAUX.</p>

                <p class="text-lg mb-4 leading-relaxed">À la BRVM, vous pouvez commencer avec de petites sommes régulières.</p>

                <p class="text-lg mb-6 font-semibold leading-relaxed">Le plus important n'est pas le capital de départ, mais le temps et la constance.</p>

                <p class="text-lg mb-12 italic text-center leading-relaxed">💬 "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment, c'est aujourd'hui." – Proverbe africain</p>


                <h3 class="text-2xl font-bold mb-6">❌ Mythe 2 : "La Bourse, c'est un casino"</h3>

                <p class="text-2xl mb-6 font-bold text-center leading-relaxed">NON, ce n'est pas un jeu de hasard.</p>

                <p class="text-lg mb-4 leading-relaxed">La <strong>spéculation</strong> repose sur les émotions et les paris à court terme.</p>

                <p class="text-lg mb-6 leading-relaxed">L'<strong>investissement</strong> repose sur l'analyse, la patience et la vision long terme.</p>

                <p class="text-lg mb-4 font-semibold leading-relaxed">💡 Citation clé :</p>

                <p class="text-lg mb-4 italic leading-relaxed">"The individual investor should act consistently as an investor and not as a speculator."</p>

                <p class="text-base mb-6 leading-relaxed">— Benjamin Graham, mentor de Warren Buffett</p>

                <p class="text-lg mb-3 font-semibold leading-relaxed">En clair :</p>

                <p class="text-lg mb-3 leading-relaxed">L'<strong>investisseur</strong> achète une part d'entreprise pour en partager la réussite.</p>

                <p class="text-lg mb-6 leading-relaxed">Le <strong>spéculateur</strong> parie sur une fluctuation de prix.</p>

                <p class="text-xl mb-12 font-bold text-center leading-relaxed">À la BRVM, nous formons des investisseurs — pas des parieurs.</p>


                <h2 class="text-3xl font-bold mb-8">🧩 Les termes à maîtriser</h2>

                <table class="table-auto w-full text-left border-collapse border border-white my-6">
                    <thead class="bg-blue-800">
                        <tr>
                            <th class="border border-white px-4 py-3 font-bold">Terme</th>
                            <th class="border border-white px-4 py-3 font-bold">Définition simple</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-white px-4 py-3 font-bold">BRVM</td>
                            <td class="border border-white px-4 py-3">Bourse Régionale des Valeurs Mobilières : le marché commun de 8 pays de l'UEMOA.</td>
                        </tr>
                        <tr>
                            <td class="border border-white px-4 py-3 font-bold">Investisseur</td>
                            <td class="border border-white px-4 py-3">Personne qui place son argent dans des actifs pour générer un rendement à long terme.</td>
                        </tr>
                        <tr>
                            <td class="border border-white px-4 py-3 font-bold">Spéculateur</td>
                            <td class="border border-white px-4 py-3">Personne qui achète et revend à court terme pour profiter de variations de prix.</td>
                        </tr>
                        <tr>
                            <td class="border border-white px-4 py-3 font-bold">Volatilité</td>
                            <td class="border border-white px-4 py-3">Variation (montée et descente) du prix d'un actif sur une période donnée.</td>
                        </tr>
                    </tbody>
                </table>


                <h3 class="text-2xl font-bold mb-6">🚀 Prochaine étape :</h3>

                <p class="text-lg mb-4 leading-relaxed">Vous avez préparé votre esprit, compris la vision, et brisé les mythes.</p>

                <p class="text-xl mb-4 font-bold leading-relaxed">👉 Passez maintenant au Module 1 : Les Fondations – Qu'est-ce que la Bourse et la BRVM ?</p>

                <p class="text-base italic leading-relaxed">C'est ici que commence votre apprentissage concret du marché financier africain.</p>
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
            <div class="space-y-8">
                <div class="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-8 rounded-xl">
                    <h2 class="text-3xl font-bold mb-6">🎯 Objectif Pédagogique</h2>
                    <p class="text-lg mb-4 leading-relaxed">À la fin de ce module, vous serez capable :</p>
                    <ul class="space-y-2 text-lg leading-relaxed">
                        <li>• d'expliquer ce qu'est un marché financier et à quoi il sert ;</li>
                        <li>• de comprendre le rôle unique de la BRVM dans l'économie de la zone UEMOA ;</li>
                        <li>• de distinguer clairement le marché primaire du marché secondaire ;</li>
                        <li>• et de comprendre pourquoi et comment une entreprise choisit d'entrer en bourse.</li>
                    </ul>
                </div>

                <div class="border-l-4 border-blue-600 pl-6 py-4">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">🧩 1.1 Qu'est-ce qu'un marché financier ?</h2>

                    <p class="text-lg mb-4 leading-relaxed">Un marché financier est un espace — physique ou digital — où l'argent rencontre les opportunités.</p>

                    <p class="text-base mb-3 leading-relaxed">C'est là que se rencontrent :</p>
                    <ul class="list-disc ml-6 mb-4 space-y-1">
                        <li>ceux qui ont de l'argent à placer (investisseurs), et</li>
                        <li>ceux qui ont besoin d'argent pour financer leurs projets (entreprises ou États).</li>
                    </ul>

                    <p class="text-base mb-3 leading-relaxed">Sur ces marchés, on ne vend pas des produits physiques, mais des titres financiers :</p>
                    <ul class="list-disc ml-6 mb-6 space-y-1">
                        <li>Les <strong>actions</strong> (parts de propriété dans une entreprise)</li>
                        <li>Les <strong>obligations</strong> (prêts faits à une entreprise ou à un État)</li>
                    </ul>

                    <div class="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 my-6">
                        <h3 class="text-xl font-bold text-amber-900 mb-3">🪶 L'analogie à retenir : Le Grand Marché de la Ville</h3>
                        <p class="text-base mb-3 leading-relaxed">Imaginez le grand marché central de votre ville :</p>
                        <ul class="list-disc ml-6 mb-3 space-y-1">
                            <li>Dans une zone, les producteurs viennent vendre leurs produits frais pour la première fois (🍍 marché primaire).</li>
                            <li>Dans une autre zone, les commerçants revendent des produits déjà achetés (🍊 marché secondaire).</li>
                        </ul>
                        <p class="text-base font-semibold leading-relaxed">👉 La BRVM joue le rôle de ce grand marché financier, mais avec des règles claires, un système sécurisé, et une surveillance stricte pour protéger tous les participants.</p>
                    </div>

                    <h3 class="text-xl font-bold text-gray-900 mb-3">📊 Pourquoi les marchés financiers sont essentiels</h3>
                    <p class="text-base mb-3 leading-relaxed">Ils remplissent trois grandes fonctions :</p>
                    <ol class="list-decimal ml-6 mb-4 space-y-2">
                        <li><strong>Canaliser l'épargne vers l'investissement productif</strong><br/>→ Votre argent finance des projets réels : usines, routes, innovations.</li>
                        <li><strong>Faciliter la liquidité</strong><br/>→ Vous pouvez revendre vos titres à tout moment.</li>
                        <li><strong>Rendre l'économie plus transparente</strong><br/>→ Les entreprises cotées publient leurs résultats, ce qui permet de suivre leur performance.</li>
                    </ol>
                </div>

                <div class="border-l-4 border-green-600 pl-6 py-4">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">🏛️ 1.2 Le rôle et le fonctionnement de la BRVM</h2>

                    <h3 class="text-xl font-bold text-gray-900 mb-3">🌍 Une bourse régionale unique au monde</h3>
                    <p class="text-base mb-3 leading-relaxed">La <strong>Bourse Régionale des Valeurs Mobilières (BRVM)</strong> est commune à huit pays africains partageant la même monnaie, le franc CFA (UEMOA) :</p>
                    <p class="text-base mb-4 leading-relaxed">🇧🇯 Bénin | 🇧🇫 Burkina Faso | 🇨🇮 Côte d'Ivoire | 🇬🇼 Guinée-Bissau | 🇲🇱 Mali | 🇳🇪 Niger | 🇸🇳 Sénégal | 🇹🇬 Togo</p>
                    <p class="text-base mb-6 leading-relaxed">Elle a été créée en 1998, avec son siège à Abidjan (Côte d'Ivoire), et son dépositaire central, le DC/BR, à Cotonou (Bénin).</p>

                    <h3 class="text-xl font-bold text-gray-900 mb-3">⚙️ Son fonctionnement</h3>
                    <ul class="list-disc ml-6 mb-6 space-y-1">
                        <li>Les entreprises qui souhaitent lever des fonds émettent des titres (actions ou obligations).</li>
                        <li>Les investisseurs achètent et vendent ces titres via des Sociétés de Gestion et d'Intermédiation (SGI), qui sont les courtiers agréés.</li>
                        <li>Le régulateur, le CREPMF, veille au respect des règles de transparence et de protection des investisseurs.</li>
                    </ul>

                    <h3 class="text-xl font-bold text-gray-900 mb-3">📈 Les indices phares</h3>
                    <ul class="list-disc ml-6 mb-4 space-y-1">
                        <li><strong>BRVM Composite</strong> : suit l'ensemble des sociétés cotées.</li>
                        <li><strong>BRVM 10</strong> : regroupe les 10 entreprises les plus liquides et les plus importantes.</li>
                    </ul>
                    <p class="text-sm italic mb-4 leading-relaxed">Quand on dit « la BRVM a progressé de 2 % aujourd'hui », cela signifie que, globalement, les valeurs cotées ont pris de la valeur.</p>

                    <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6">
                        <p class="text-base font-semibold mb-2">💡 À retenir</p>
                        <p class="text-base leading-relaxed">La BRVM permet :</p>
                        <ul class="list-disc ml-6 mt-2 space-y-1">
                            <li>aux entreprises de se financer localement sans dépendre uniquement des banques ;</li>
                            <li>aux investisseurs de faire fructifier leur capital ;</li>
                            <li>et à nos économies africaines de croître de manière inclusive et transparente.</li>
                        </ul>
                    </div>
                </div>

                <div class="border-l-4 border-purple-600 pl-6 py-4">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">🔁 1.3 Marché primaire vs marché secondaire</h2>
                    <p class="text-base mb-4 leading-relaxed">Comprendre cette distinction est fondamental :</p>

                    <div class="overflow-x-auto">
                        <table class="min-w-full border-collapse border-2 border-gray-300 my-4">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="border border-gray-300 px-4 py-3 text-left font-bold">Type de marché</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left font-bold">Description</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left font-bold">À qui va l'argent ?</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left font-bold">Exemple concret</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border border-gray-300 px-4 py-3">Marché primaire</td>
                                    <td class="border border-gray-300 px-4 py-3">Les titres sont émis et vendus pour la première fois.</td>
                                    <td class="border border-gray-300 px-4 py-3">Directement à l'entreprise ou à l'État.</td>
                                    <td class="border border-gray-300 px-4 py-3">Une société comme NSIA Banque émet de nouvelles actions pour financer son expansion.</td>
                                </tr>
                                <tr class="bg-gray-50">
                                    <td class="border border-gray-300 px-4 py-3">Marché secondaire</td>
                                    <td class="border border-gray-300 px-4 py-3">Les titres déjà émis sont échangés entre investisseurs.</td>
                                    <td class="border border-gray-300 px-4 py-3">L'argent circule entre investisseurs, pas vers l'entreprise.</td>
                                    <td class="border border-gray-300 px-4 py-3">Vous achetez des actions Sonatel à un autre investisseur via votre SGI.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="bg-green-50 border-2 border-green-500 rounded-lg p-4 my-6">
                        <p class="text-base font-bold leading-relaxed">🎯 Votre terrain de jeu principal, en tant qu'investisseur particulier, est le marché secondaire, car c'est là que vous pourrez acheter ou revendre vos titres.</p>
                    </div>
                </div>

                <div class="border-l-4 border-orange-600 pl-6 py-4">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">🚀 1.4 Comment et pourquoi une entreprise entre en bourse (IPO)</h2>

                    <h3 class="text-xl font-bold text-gray-900 mb-3">💰 Pourquoi entrer en bourse ?</h3>
                    <p class="text-base mb-3 leading-relaxed">Une entreprise décide de s'introduire en bourse (faire une IPO – Initial Public Offering) pour :</p>
                    <ol class="list-decimal ml-6 mb-6 space-y-2">
                        <li>Lever des capitaux sans contracter de dettes bancaires.</li>
                        <li>Améliorer sa visibilité et sa crédibilité auprès des investisseurs, partenaires et clients.</li>
                        <li>Permettre à ses premiers actionnaires (fondateurs, fonds, salariés) de revendre une partie de leurs actions.</li>
                        <li>Diversifier ses sources de financement et accéder à un marché de capitaux plus large.</li>
                    </ol>

                    <h3 class="text-xl font-bold text-gray-900 mb-3">⚙️ Comment cela se passe ?</h3>
                    <ol class="list-decimal ml-6 mb-6 space-y-2">
                        <li>L'entreprise prépare ses états financiers et un prospectus approuvé par le CREPMF.</li>
                        <li>Elle choisit une SGI pour la conseiller et placer ses titres.</li>
                        <li>Les investisseurs souscrivent aux actions pendant la période d'offre publique.</li>
                        <li>Une fois les titres émis, l'entreprise devient cotée et ses actions sont échangées sur le marché secondaire.</li>
                    </ol>

                    <div class="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 my-6">
                        <h3 class="text-lg font-bold text-orange-900 mb-3">🎯 Exemple africain</h3>
                        <p class="text-base mb-2 leading-relaxed">L'introduction en bourse de Orange Côte d'Ivoire (2022) a permis :</p>
                        <ul class="list-disc ml-6 space-y-1">
                            <li>à l'entreprise de lever plusieurs dizaines de milliards FCFA ;</li>
                            <li>aux citoyens ivoiriens de devenir actionnaires d'un acteur majeur du pays ;</li>
                            <li>et à la BRVM d'attirer de nouveaux investisseurs régionaux.</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-gray-100 rounded-xl p-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">🧠 Les termes à maîtriser</h2>
                    <table class="min-w-full border-collapse border-2 border-gray-300">
                        <thead class="bg-gray-200">
                            <tr>
                                <th class="border border-gray-300 px-4 py-3 text-left font-bold">Terme</th>
                                <th class="border border-gray-300 px-4 py-3 text-left font-bold">Définition</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="bg-white">
                                <td class="border border-gray-300 px-4 py-3 font-bold">BRVM</td>
                                <td class="border border-gray-300 px-4 py-3">Bourse Régionale des Valeurs Mobilières, marché commun de l'UEMOA.</td>
                            </tr>
                            <tr class="bg-gray-50">
                                <td class="border border-gray-300 px-4 py-3 font-bold">BRVM Composite</td>
                                <td class="border border-gray-300 px-4 py-3">Indice mesurant la performance de toutes les sociétés cotées.</td>
                            </tr>
                            <tr class="bg-white">
                                <td class="border border-gray-300 px-4 py-3 font-bold">IPO (Initial Public Offering)</td>
                                <td class="border border-gray-300 px-4 py-3">Introduction en bourse — première vente d'actions au public.</td>
                            </tr>
                            <tr class="bg-gray-50">
                                <td class="border border-gray-300 px-4 py-3 font-bold">Marché primaire</td>
                                <td class="border border-gray-300 px-4 py-3">Marché où sont émis les nouveaux titres financiers.</td>
                            </tr>
                            <tr class="bg-white">
                                <td class="border border-gray-300 px-4 py-3 font-bold">Marché secondaire</td>
                                <td class="border border-gray-300 px-4 py-3">Marché où les titres déjà émis s'échangent entre investisseurs.</td>
                            </tr>
                            <tr class="bg-gray-50">
                                <td class="border border-gray-300 px-4 py-3 font-bold">SGI</td>
                                <td class="border border-gray-300 px-4 py-3">Société de Gestion et d'Intermédiation, intermédiaire agréé pour acheter/vendre des titres.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl">
                    <h3 class="text-xl font-bold mb-3">🧭 Prochaine étape</h3>
                    <p class="text-base mb-3 leading-relaxed">Vous avez maintenant compris le rôle des marchés financiers et de la BRVM dans notre économie.</p>
                    <p class="text-lg font-bold leading-relaxed">👉 Prochaine leçon : Module 2 — Les Acteurs du Jeu : Qui fait quoi sur le marché ?</p>
                </div>
            </div>
        `,
    });

    // =====================================
    // === M2 : LES ACTEURS DU JEU ===
    // =====================================
  
await createOrUpdateModule({
    title: "Les Acteurs du Jeu – Qui fait quoi sur le marché ?",
    slug: "acteurs-du-jeu", // garder ou remplacer selon ta structure
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
                    <li>• d'identifier les principaux acteurs du marché financier régional ;</li>
                    <li>• de comprendre comment vos ordres d'achat ou de vente circulent ;</li>
                    <li>• de visualiser la chaîne de sécurité qui protège votre argent et vos titres.</li>
                </ul>
            </div>

        <hr/>

        <h2>2.1 La BRVM : Une Bourse Unique au Monde</h2>

        <p>
            La <strong>BRVM</strong> est une bourse régionale partagée par
            <strong>8 pays de l’UEMOA</strong> utilisant la même monnaie et la même banque centrale.
        </p>

        <p><strong>Pays membres :</strong> Bénin, Burkina Faso, Côte d’Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo.</p>

        <ul>
            <li><strong>Siège de la BRVM :</strong> Abidjan</li>
            <li><strong>Siège du DC/BR :</strong> Cotonou</li>
        </ul>

        <p>
            La BRVM permet aux entreprises de se financer auprès du public et aux investisseurs
            d’acheter ou de revendre facilement leurs titres.
        </p>

        <hr/>

        <h2>2.2 Les Trois Piliers Institutionnels du Marché</h2>
        <p>Le marché financier régional repose sur trois institutions clés :</p>
        <ul>
            <li><strong>BCEAO</strong> – stabilité monétaire</li>
            <li><strong>AMF-UMOA</strong> – régulation et protection des investisseurs</li>
            <li><strong>DC/BR</strong> – conservation et sécurisation des titres</li>
        </ul>

        <hr/>

        <h3>2.2.1 BCEAO – Le Pilier Monétaire 🏦</h3>
        <p>
            La <strong>BCEAO</strong> assure la stabilité monétaire de la région.
            Elle influence fortement les marchés par :
        </p>
        <ul>
            <li>la fixation des taux directeurs ;</li>
            <li>la gestion de l’inflation ;</li>
            <li>la supervision du système bancaire.</li>
        </ul>

        <p>
            <strong>Impact :</strong> Une baisse des taux stimule les entreprises et les marchés.
            Une hausse rend le crédit plus cher et peut peser sur les valorisations.
        </p>

        <hr/>

        <h3>2.2.2 AMF-UMOA – Le Gendarme du Marché ⚖️</h3>
        <p>
            L’<strong>AMF-UMOA</strong> protège les investisseurs et veille à la transparence.
            Elle :
        </p>
        <ul>
            <li>définit les règles du marché ;</li>
            <li>approuve les introductions en bourse ;</li>
            <li>surveille et sanctionne les abus ;</li>
            <li>agrée les SGI, fonds et acteurs financiers.</li>
        </ul>

        <p>
            C’est votre <strong>bouclier réglementaire</strong>. Sans elle, la confiance s’effondrerait.
        </p>

        <hr/>

        <h3>2.2.3 DC/BR – Le Notaire Digital du Marché 🔐</h3>
        <p>
            Le <strong>DC/BR</strong> est l’entité qui conserve les titres et sécurise les transactions.
        </p>

        <ul>
            <li><strong>Conservation :</strong> Vos titres ne sont pas stockés chez la SGI mais chez le DC/BR.</li>
            <li><strong>Règlement-livraison :</strong> Transfert simultané des titres et de l’argent.</li>
            <li><strong>Banque de règlement :</strong> Gestion des flux financiers entre SGI.</li>
        </ul>

        <p>
            <strong>Analogie :</strong> C’est le notaire digital qui garantit votre propriété financière.
        </p>

        <hr/>

        <h2>2.3 L’Investisseur – C’est Vous 💼</h2>

        <p>Deux grandes catégories d'investisseurs existent :</p>

        <h4>1. Investisseurs particuliers</h4>
        <p>Ils investissent leur propre épargne pour faire croître leur capital.</p>

        <h4>2. Investisseurs institutionnels</h4>
        <p>Ils gèrent des milliards pour le compte de clients ou salariés :</p>
        <ul>
            <li>assurances,</li>
            <li>fonds de pension,</li>
            <li>banques,</li>
            <li>OPCVM.</li>
        </ul>

        <p><strong>À retenir :</strong> Même un petit investisseur contribue au financement des entreprises africaines.</p>

        <hr/>

        <h2>2.4 Les Sociétés Cotées – Les Champions Économiques 🏢</h2>

        <p>
            Les entreprises cotées lèvent des fonds, gagnent en transparence et impliquent les citoyens
            dans leur croissance.
        </p>

        <p>Quelques exemples :</p>
        <ul>
            <li>Sonatel – Télécommunications</li>
            <li>Ecobank CI – Banque</li>
            <li>Nestlé CI – Agroalimentaire</li>
            <li>Palmci – Agriculture</li>
            <li>TotalEnergies CI – Distribution énergétique</li>
        </ul>

        <p>
            Acheter une action = devenir <strong>copropriétaire</strong> de l’entreprise.
        </p>

        <hr/>

        <h2>2.5 Les SGI – Votre Intermédiaire Officiel ⚙️</h2>

        <p>La <strong>SGI</strong> joue un rôle central :</p>
        <ul>
            <li>ouvrir et gérer votre compte-titres ;</li>
            <li>transmettre vos ordres à la BRVM ;</li>
            <li>conserver vos fonds en attente d’investissement ;</li>
            <li>vous conseiller selon votre profil.</li>
        </ul>

        <p><strong>Analogie :</strong> Votre “taxi-moto boursier”.</p>

        <hr/>

        <h2>2.6 Autres Acteurs Clés 🌐</h2>
        <ul>
            <li>SGO : gestionnaires d’OPCVM (FCP, SICAV)</li>
            <li>Experts-comptables : certification des états financiers</li>
            <li>Médias financiers : information et transparence</li>
        </ul>

        <hr/>

        <h2>🧠 Termes à Maîtriser</h2>
        <ul>
            <li><strong>SGI</strong> : Intermédiaire entre vous et la BRVM</li>
            <li><strong>AMF-UMOA</strong> : Régulateur du marché</li>
            <li><strong>DC/BR</strong> : Conservation des titres et règlement</li>
            <li><strong>BCEAO</strong> : Banque centrale de la région</li>
            <li><strong>Investisseur institutionnel</strong> : Assurance, fonds, banques</li>
            <li><strong>Société cotée</strong> : Entreprise listée à la BRVM</li>
        </ul>

        <hr/>

        <h2>👉 Prochaine étape</h2>
        <p>
            Le <strong>Module 3</strong> vous présentera les outils de l’investisseur : actions,
            obligations et OPCVM.
        </p>
    `,
});

    // ==================================================
    // === M3 : LES OUTILS DE L'INVESTISSEUR ===
    // ==================================================
    await createOrUpdateModule({
       title: "Les Outils de l’Investisseur — Les Instruments Financiers de la BRVM",
        slug: 'outils-investisseur',
        description:"Découvrez les principaux instruments financiers de la BRVM : actions, obligations, OPCVM, ETF. Comprenez leur fonctionnement, leurs risques et comment les choisir en fonction de votre profil.",
  difficulty_level: "debutant",
  content_type: "article",
  duration_minutes: 25,
  order_index: 3,
  is_published: true,
        content: `
           <div class="space-y-8">
               <div class="bg-gradient-to-r from-purple-600 to-violet-700 text-white p-8 rounded-xl">
                   <h2 class="text-3xl font-bold mb-6">🎯 Objectif Pédagogique</h2>
                   <p class="text-lg mb-4 leading-relaxed">À la fin de ce module, vous serez capable de :</p>
                   <ul class="space-y-2 text-lg leading-relaxed">
                       <li>• Distinguer les actions, obligations, ETF et OPCVM.</li>
                       <li>• Comprendre les mécanismes de rendement et de risque de chaque type d'actif.</li>
                       <li>• Identifier les produits adaptés à votre profil d'investisseur.</li>
                   </ul>
               </div>

           <h2>3.1 Les Actions — Devenir propriétaire d'une part d'entreprise</h2>
<p>Une action représente une fraction du capital d’une société. En l’achetant, vous devenez actionnaire, c’est-à-dire copropriétaire de l’entreprise.</p>

<h3>💰 Sources de rendement</h3>
<ul>
  <li><strong>Plus-value</strong> : revendre plus cher que le prix d’achat.</li>
  <li><strong>Dividendes</strong> : part du bénéfice distribuée annuellement.</li>
</ul>

<h3>⚠️ Risques associés</h3>
<ul>
  <li>Forte volatilité possible.</li>
  <li>Risque de faillite (actionnaires payés en dernier).</li>
  <li>Dividendes non garantis.</li>
</ul>

<p><strong>Exemple BRVM :</strong> SONATEL offre historiquement des dividendes élevés ; BOA Mali propose un rendement plus stable avec moins de volatilité.</p>

<p><strong>🎓 À retenir :</strong> Acheter une action, c’est parier sur la croissance future d’une entreprise.</p>

<hr/>

<h2>3.2 Les Obligations — Prêter à une entreprise ou à l’État</h2>
<p>Une obligation est un titre de créance : vous prêtez de l'argent à un émetteur en échange d’intérêts fixes sur une durée définie.</p>

<h3>💰 Fonctionnement</h3>
<ul>
  <li>Versement de coupons annuels (intérêts).</li>
  <li>Remboursement du capital à l’échéance.</li>
</ul>

<h3>🧭 Types d'obligations à la BRVM</h3>
<ul>
  <li><strong>Obligations d’État</strong> : très sécurisées.</li>
  <li><strong>Obligations d’entreprise</strong> : rendement plus élevé, risque modéré.</li>
</ul>

<h3>📊 Exemple BRVM</h3>
<ul>
  <li>État du Sénégal 6,5% 2028</li>
  <li>Oragroup 5,75% 2027</li>
</ul>

<p><strong>🎓 À retenir :</strong> Une obligation est un prêt avec rendement stable et risque limité.</p>

<hr/>

<h2>3.3 Les OPCVM et ETF — Investissement collectif intelligent</h2>

<p>Les OPCVM regroupent l’argent de plusieurs investisseurs pour constituer un portefeuille diversifié, géré par des professionnels.</p>

<h3>📦 Deux familles :</h3>
<ul>
  <li><strong>FCP</strong> : fonds communs de placement.</li>
  <li><strong>SICAV</strong> : sociétés d’investissement à capital variable.</li>
</ul>

<h3>🪙 Avantages</h3>
<ul>
  <li>Diversification immédiate.</li>
  <li>Gestion professionnelle.</li>
  <li>Accessibilité avec un petit capital.</li>
</ul>

<h3>📈 ETF — Fonds indiciels cotés</h3>
<p>Les ETF répliquent un indice comme le BRVM Composite ou le BRVM 10. Encore rares dans l'UEMOA, ils représentent le futur de l'investissement passif.</p>

<p><strong>🎓 À retenir :</strong> L’OPCVM est le panier diversifié, l’ETF est le panier automatisé.</p>

<hr/>

<h2>3.4 Dividendes, Splits et Augmentations de Capital</h2>

<h3>💵 Dividendes</h3>
<p>Part du bénéfice versée aux actionnaires. Exemple : SONATEL distribue souvent 1 500 à 2 000 FCFA par action.</p>

<h3>📈 Splits</h3>
<p>Division des actions pour les rendre plus accessibles. Exemple : 1 action à 30 000 FCFA devient 10 à 3 000 FCFA.</p>

<h3>💹 Augmentation de capital</h3>
<p>Émission de nouvelles actions pour lever des fonds. Les anciens actionnaires bénéficient d’un droit préférentiel de souscription.</p>

<hr/>

<h2>3.5 Risques par Type d’Actif</h2>

<table>
<thead>
<tr>
<th>Type d'actif</th>
<th>Risque principal</th>
<th>Rendement attendu</th>
<th>Horizon conseillé</th>
</tr>
</thead>
<tbody>
<tr>
<td>Actions</td>
<td>Volatilité, faillite</td>
<td>Élevé</td>
<td>5–10 ans</td>
</tr>
<tr>
<td>Obligations</td>
<td>Taux d’intérêt, défaut</td>
<td>Moyen</td>
<td>2–5 ans</td>
</tr>
<tr>
<td>OPCVM / ETF</td>
<td>Marché, gestion</td>
<td>Modéré</td>
<td>Moyen / long terme</td>
</tr>
<tr>
<td>Liquidités</td>
<td>Inflation</td>
<td>Faible</td>
<td>Court terme</td>
</tr>
</tbody>
</table>

<p><strong>🎓 À retenir :</strong> Aucun investissement n’est sans risque. Le plus important est de choisir un risque adapté à votre profil.</p>

<hr/>

<h2>🧠 Atelier Pratique — “Action vs Obligation”</h2>
<p><strong>Situation :</strong> Vous avez 1 000 000 FCFA et hésitez entre :</p>
<ul>
  <li>Actions SONATEL (cours 15 000 FCFA, dividende 5%)</li>
  <li>Obligation État du Sénégal 6% sur 5 ans</li>
</ul>

<p><strong>Exercice :</strong></p>
<ol>
  <li>Calculez le revenu annuel attendu de chaque option.</li>
  <li>Comparez les risques.</li>
  <li>Choisissez selon votre profil (croissance vs stabilité).</li>
</ol>

<hr/>

<h2>🧭 En Résumé</h2>
<ul>
  <li>Actions : propriété, potentiel élevé, risque fort.</li>
  <li>Obligations : prêt, rendement fixe, risque modéré.</li>
  <li>OPCVM/ETF : diversification, gestion professionnelle.</li>
  <li>Dividendes/splits : leviers de performance.</li>
  <li>Règle d’or : comprendre avant d’investir.</li>
</ul>

<hr/>

<p>🚀 <strong>Prochaine étape :</strong> Module 4 — “Le Temps, votre meilleur allié : définir son horizon et sa stratégie d’investissement”.</p>
`,
    });

    // ==================================================
    // === M4 : LE TEMPS, VOTRE MEILLEUR ALLIÉ ===
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
            <div class="space-y-8">
                <div class="bg-gradient-to-r from-orange-600 to-amber-700 text-white p-8 rounded-xl">
                    <h2 class="text-3xl font-bold mb-6">🎯 Objectif Pédagogique</h2>
                    <p class="text-lg mb-4 leading-relaxed">À la fin de ce module, vous comprendrez :</p>
                    <ul class="space-y-2 text-lg leading-relaxed">
                        <li>• Les grandes familles d'actifs émergentes dans la région UEMOA ;</li>
                        <li>• Comment elles diffèrent des actions et obligations classiques ;</li>
                        <li>• Pourquoi elles représentent les tendances futures de la finance africaine.</li>
                    </ul>
                </div>

            <h2>4.1 L'Immobilier Coté : investir sans devenir propriétaire physique</h2>

<h3>🏢 Qu’est-ce qu’une SCPI ?</h3>
<p>
Une SCPI (Société Civile de Placement Immobilier) collecte l’argent des investisseurs pour acheter et gérer un portefeuille d’immeubles (bureaux, commerces, logements…).  
Chaque investisseur détient des parts et perçoit une partie des revenus locatifs.
</p>

<h3>🌍 Équivalent international : les REITs</h3>
<p>Les REITs (Real Estate Investment Trusts) permettent d’investir dans l’immobilier coté en bourse.</p>

<h3>✅ Avantages</h3>
<ul>
  <li>Aucun besoin de gérer un bien soi-même.</li>
  <li>Revenus réguliers sous forme de dividendes.</li>
  <li>Diversification géographique et sectorielle.</li>
</ul>

<h3>⚠️ Risques</h3>
<ul>
  <li>Dépendance au marché immobilier.</li>
  <li>Sensibilité aux taux d’intérêt.</li>
</ul>

<h3>🔍 Cas régional</h3>
<p>
Dans l’UEMOA, la SCPI est encore marginale, mais des initiatives émergent, notamment via les futurs OPCI (Organismes de Placement Collectif Immobilier).
</p>

<hr/>

<h2>4.2 La Finance Islamique : une alternative éthique et en pleine croissance</h2>

<h3>🕌 Principes fondamentaux</h3>
<ol>
  <li>Interdiction du <em>riba</em> (intérêt) : les revenus doivent venir d’une activité réelle.</li>
  <li>Partage des profits et pertes.</li>
  <li>Investissements dans des activités licites.</li>
</ol>

<h3>💰 Produits phares</h3>
<ul>
  <li><strong>Sukuk</strong> : obligations islamiques adossées à des actifs réels.</li>
  <li><strong>Fonds islamiques</strong> : OPCVM filtrés selon la charia.</li>
</ul>

<h3>🌍 Enjeux et opportunités</h3>
<ul>
  <li>Plus de 3 000 milliards USD gérés dans le monde.</li>
  <li>Forte demande en Afrique de l’Ouest.</li>
  <li>Permet d’attirer des investisseurs en quête d’éthique.</li>
</ul>

<p><strong>💡 En résumé :</strong> La finance islamique est une approche éthique du financement, pas une alternative marginale.</p>

<hr/>

<h2>4.3 Introduction aux Produits Structurés : combiner rendement et protection</h2>

<h3>⚙️ Définition</h3>
<p>
Un produit structuré combine plusieurs éléments (souvent une obligation + une option) pour offrir un rendement ciblé avec une protection partielle du capital.
</p>

<h3>📘 Exemple simple</h3>
<p>
"100 % du capital garanti à l’échéance + 50 % de la performance de l’indice BRVM 10 sur 3 ans."
</p>

<h3>⚠️ Attention</h3>
<ul>
  <li>Produits complexes, destinés aux investisseurs avertis.</li>
  <li>Les conditions doivent être lues avec précision.</li>
</ul>

<h3>🔍 Dans la région</h3>
<p>
Encore rares dans l’UEMOA, mais voués à se développer avec la modernisation des marchés.
</p>

<hr/>

<h2>4.4 Les ETF et Trackers : l’avenir de l’investissement passif</h2>

<h3>📊 Définition</h3>
<p>Un ETF est un fonds coté qui réplique un indice boursier.</p>

<p><strong>Exemple :</strong> un ETF BRVM Composite reproduirait les performances de toutes les grandes valeurs de la BRVM.</p>

<h3>💡 Pourquoi c’est révolutionnaire</h3>
<ul>
  <li>Frais très faibles.</li>
  <li>Diversification automatique.</li>
  <li>Transparence totale.</li>
</ul>

<h3>🌍 À l’international</h3>
<p>Les ETF représentent plus de 50 % des flux d’investissement mondiaux.</p>

<h3>🌍 En Afrique de l’Ouest</h3>
<p>
Pas encore d’ETF local, mais des projets de réplication d’indices régionaux (BRVM 10, Composite) sont envisagés.
</p>

<h3>🚀 Pourquoi s’y intéresser</h3>
<p>
Comprendre les ETF aujourd’hui, c’est comprendre la bourse de demain : simple, efficace, accessible.
</p>

<hr/>

<h2>🧭 En résumé : les produits avancés, une ouverture vers demain</h2>

<table>
<thead>
<tr>
  <th>Produit</th>
  <th>Objectif principal</th>
  <th>Niveau de risque</th>
  <th>Accessibilité (UEMOA)</th>
</tr>
</thead>
<tbody>
<tr>
  <td>SCPI / Immobilier coté</td>
  <td>Revenus stables</td>
  <td>Modéré</td>
  <td>En développement</td>
</tr>
<tr>
  <td>Finance islamique</td>
  <td>Investissement éthique</td>
  <td>Modéré</td>
  <td>Déjà existant</td>
</tr>
<tr>
  <td>Produits structurés</td>
  <td>Protection + rendement ciblé</td>
  <td>Variable</td>
  <td>Rare</td>
</tr>
<tr>
  <td>ETF / Trackers</td>
  <td>Répliquer un indice</td>
  <td>Faible à modéré</td>
  <td>En émergence</td>
</tr>
</tbody>
</table>

<hr/>

<h2>🧠 À retenir</h2>
<p>
Ce module ne vise pas à vous pousser à investir immédiatement dans ces produits,  
mais à vous préparer aux évolutions futures du marché financier africain et de la BRVM.
</p>

<hr/>

<p>🔜 <strong>Prochaine étape :</strong> Module 5 — Le Temps, votre meilleur allié : définir ses objectifs et son horizon d’investissement.</p>
`,
    });

    // ================================================
    // === M5 : LE MENTAL DU GAGNANT ===
    // ================================================
    await createOrUpdateModule({
        title: "Le Mental du Gagnant - Psychologie et stratégies d'investissement",
        slug: 'mental-du-gagnant',
        description: "Maîtrisez vos émotions, comprenez les intérêts composés et différencier les grandes stratégies d'investissement.",
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 15,
        order_index: 5,
        is_published: true,
        content: `
            <h2>1. Investir vs. Spéculer : La différence fondamentale</h2>
            <p>La plus grande menace pour votre portefeuille n'est pas la crise, mais vous-même. L'investisseur se concentre sur la valeur interne de l'actif, tandis que le spéculateur parie sur les mouvements de prix et est souvent guidé par l'excitation ou la panique.</p>

            <h2>2. La 8ème merveille du monde : Le pouvoir des intérêts composés</h2>
            <p>Les <strong>intérêts composés</strong> se produisent lorsque les gains générés par votre investissement sont réinvestis pour générer à leur tour de nouveaux gains. C'est l'argent qui travaille pour l'argent. L'effet est <strong>exponentiel</strong>.</p>
            <p class="text-center font-mono my-4 text-xl">\\[\\text{Valeur Finale} = \\text{Capital} \\times (1 + \\text{Taux d'intérêt})^{\\text{Nombre d'années}}\\]</p>
            <h3>L'Analogie à Retenir : La Croissance du Jeune Baobab</h3>
            <p>Un jeune baobab met du temps à grandir, mais une fois qu'il a établi ses racines, sa croissance accélère massivement. C'est le temps, pas l'effort initial, qui crée la majesté de l'arbre.</p>

            <h2>3. Nos pires ennemis : La peur, l'avidité et les biais cognitifs</h2>
            <ul>
                <li><strong>L'Avidité (Greed)</strong> : Elle vous pousse à acheter lorsque les prix sont élevés, par peur de manquer le gain (FOMO - Fear of Missing Out).</li>
                <li><strong>La Peur (Fear)</strong> : Elle vous pousse à vendre lorsque les prix baissent, transformant une perte temporaire en une perte réelle.</li>
            </ul>
            <p><strong>Citation de l'Expert :</strong> <em>"Be fearful when others are greedy and greedy only when others are fearful."</em>.</p>
            <p>Les <strong>Biais Cognitifs</strong> (comme le biais de confirmation ou l'ancrage) peuvent être destructeurs. La seule façon de les combattre est la <strong>discipline</strong>.</p>

            <h2>4. Les 3 erreurs classiques du débutant à éviter absolument</h2>
            <ul>
                <li>Tenter de "Timer" le Marché (spéculation).</li>
                <li>Manquer de <strong>Diversification</strong> (Module 8).</li>
                <li>Vendre en Panique (détruisant la puissance du long terme).</li>
            </ul>

            <h2>5. Les grandes stratégies d'investissement</h2>
            <ul>
                <li><strong>Value Investing (Valeur)</strong> : Acheter une entreprise qui se négocie <strong>en dessous</strong> de sa valeur intrinsèque réelle (acheter de bonnes affaires).</li>
                <li><strong>Growth Investing (Croissance)</strong> : Acheter des entreprises qui croissent très rapidement, même si elles semblent chères.</li>
                <li><strong>Dividendes (Revenus)</strong> : Choisir des entreprises matures qui versent régulièrement une grande partie de leurs bénéfices (souvent les banques ou télécoms à la BRVM).</li>
            </ul>

            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>Intérêts Composés</strong> : Processus par lequel les gains sont réinvestis pour produire leurs propres gains.</li>
                <li><strong>Value Investing</strong> : Stratégie d'investissement consistant à acheter des titres sous-évalués.</li>
                <li><strong>Biais Cognitif</strong> : Erreur de jugement systématique basée sur des raccourcis de pensée ou des émotions.</li>
            </ul>
        `,
    });

    // =======================================================
    // === M6 : ANALYSE FONDAMENTALE (INTERMÉDIAIRE) ===
    // =======================================================
    await createOrUpdateModule({
        title: "Analyse Fondamentale - Apprendre à choisir une entreprise solide",
        slug: 'analyse-fondamentale',
        description: "Lisez les chiffres clés et appliquez les ratios fondamentaux (PER, ROE, Endettement) pour évaluer la santé financière.",
        difficulty_level: 'intermediaire',
        content_type: 'article',
        duration_minutes: 20,
        order_index: 6,
        is_published: true,
        content: `
            <h2>1. Lire les chiffres clés : Compte de résultat et bilan</h2>
            <p>L'Analyse Fondamentale est l'art de déterminer la <strong>vraie valeur</strong> d'une entreprise avant d'acheter ses actions. Elle se base sur les rapports annuels.</p>
            <ul>
                <li><strong>Le Compte de Résultat</strong> : Mesure la performance (Chiffre d'affaires, dépenses, <strong>Bénéfice Net</strong>).</li>
                <li><strong>Le Bilan</strong> : Photographie à un instant T. Il répertorie les <strong>Actifs</strong>, les <strong>Dettes</strong> et les <strong>Capitaux Propres</strong>.</li>
            </ul>

            <h2>2. Les ratios essentiels pour le débutant</h2>

            <h3>A. PER (Price-to-Earnings Ratio) : L'action est-elle chère ou bon marché?</h3>
            <p>Le PER mesure combien les investisseurs sont prêts à payer pour chaque franc CFA de bénéfice net annuel d'une action.</p>
            <p class="text-center font-mono my-4 text-xl">\\[\\text{PER} = \\frac{\\text{Cours de l'action}}{\\text{Bénéfice Net par Action (BPA)}}\\]</p>
            <ul>
                <li><strong>Interprétation</strong> : Un PER de 10 signifie qu'il faudrait 10 années de bénéfices stables pour récupérer l'investissement initial.</li>
                <li><strong>Nuance BRVM</strong> : La BRVM est un marché de croissance. Ne rejetez jamais une action uniquement à cause d'un PER élevé. Le marché régional valorise fortement le potentiel de croissance future.</li>
            </ul>

            <h3>B. ROE (Return on Equity) : L'entreprise est-elle rentable?</h3>
            <p>Le <strong>Retour sur Capitaux Propres (ROE)</strong> mesure l'efficacité avec laquelle l'entreprise utilise l'argent investi par ses actionnaires.</p>
            <p class="text-center font-mono my-4 text-xl">\\[\\text{ROE} = \\frac{\\text{Bénéfice Net}}{\\text{Capitaux Propres}}\\]</p>
            <ul>
                <li><strong>Interprétation</strong> : Un ROE de 15 % est excellent. Plus le ROE est élevé, plus l'entreprise est efficace à transformer l'argent que vous lui donnez en profit.</li>
            </ul>

            <h3>C. Ratio d'endettement : L'entreprise est-elle trop endettée?</h3>
            <p>Ce ratio compare la dette de l'entreprise par rapport à ses propres fonds (Capitaux Propres). Il faut s'assurer que les Capitaux Propres couvrent largement les dettes.</p>

            <h2>3. Étude de cas : Analyse fondamentale simplifiée</h2>
            <p>En consultant un rapport annuel, un investisseur examine : la Croissance du Chiffre d'Affaires sur 5 ans, l'évolution du Bénéfice Net, le ROE (doit être > 15 %) et le PER par rapport au secteur.</p>

            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>PER</strong> : Price-to-Earnings Ratio (Ratio Cours/Bénéfice).</li>
                <li><strong>ROE</strong> : Return on Equity (Retour sur Capitaux Propres), mesure la rentabilité des fonds propres.</li>
                <li><strong>Capitaux Propres</strong> : L'argent appartenant réellement aux actionnaires (Actifs moins les Dettes).</li>
            </ul>
        `,
    });

    // ====================================================
    // === M7 : ANALYSE TECHNIQUE (INTERMÉDIAIRE) ===
    // ====================================================
    await createOrUpdateModule({
        title: "Analyse Technique - Apprendre à lire les graphiques de prix",
        slug: 'analyse-technique',
        description: "Décodez l'information des graphiques (chandeliers), identifiez les tendances et les niveaux psychologiques (Support et Résistance).",
        difficulty_level: 'intermediaire',
        content_type: 'article',
        duration_minutes: 20,
        order_index: 7,
        is_published: true,
        content: `
            <h2>1. Un graphique, une histoire : Comprendre les chandeliers japonais</h2>
            <p>L'Analyse Technique est l'étude des mouvements de prix historiques. Elle vous aide à déterminer <strong>quand</strong> acheter ou vendre.</p>
            <p>Chaque <strong>chandelier</strong> représente une période de temps et raconte l'histoire de l'action du prix :</p>
            <ul>
                <li><strong>Le Corps</strong> : La zone entre le prix d'ouverture et de clôture. [cite_start]Vert = prix a augmenté, Rouge = prix a diminué [cite: 325-327].</li>
                <li><strong>Les Mèches (ou Ombres)</strong> : Indiquent les prix les plus hauts et les plus bas atteints pendant la période.</li>
            </ul>

            <h2>2. Identifier la tendance : Haussière, baissière ou neutre?</h2>
            <p>La <strong>tendance</strong> est la direction générale des prix :</p>
            <ul>
                <li><strong>Haussière (Bullish)</strong> : Succession de sommets et de creux de plus en plus hauts.</li>
                <li><strong>Baissière (Bearish)</strong> : Succession de sommets et de creux de plus en plus bas.</li>
                <li><strong>Neutre (Latérale)</strong> : Les prix se déplacent horizontalement dans une fourchette limitée.</li>
            </ul>
            <p>Pour l'investisseur à long terme, l'Analyse Technique sert à confirmer l'analyse fondamentale.</p>

            <h2>3. Les concepts de Support et Résistance</h2>
            <p>Ce sont des niveaux de prix psychologiques importants qui agissent comme des barrières.</p>
            <ul>
                <li><strong>Support (Le Plancher)</strong> : Un niveau de prix où l'intérêt d'achat est suffisamment fort pour empêcher le prix de baisser davantage.</li>
                <li><strong>Résistance (Le Plafond)</strong> : Un niveau de prix où la pression de vente est suffisamment forte pour empêcher le prix d'augmenter davantage.</li>
            </ul>
            <h3>L'Analogie à Retenir : Le Prix du Sac de Riz au Marché</h3>
            <p>Le Support et la Résistance sont les seuils psychologiques de l'offre et de la demande.</p>

            <h2>4. Indicateurs de base : Les moyennes mobiles</h2>
            <p>Les <strong>moyennes mobiles</strong> sont des lignes qui représentent le prix moyen du titre sur une période donnée (ex : 50 ou 200 jours). Elles permettent de lisser les fluctuations et de mieux visualiser la tendance sous-jacente.</p>

            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>Chandelier Japonais</strong> : Représentation graphique des mouvements de prix.</li>
                <li><strong>Support</strong> : Niveau de prix qui agit comme un plancher.</li>
                <li><strong>Résistance</strong> : Niveau de prix qui agit comme un plafond.</li>
            </ul>
        `,
    });

    // ====================================================
    // === M8 : L'ART DE L'ARCHITECTE (AVANCÉ) ===
    // ====================================================
    await createOrUpdateModule({
        title: "L'Art de l'Architecte - Construire et gérer son portefeuille",
        slug: 'construire-portefeuille',
        description: "Comprenez et appliquez la diversification (sectorielle, d'actifs) et saurez comment l'allocation d'actifs réduit le risque global de votre portefeuille.",
        difficulty_level: 'avance',
        content_type: 'article',
        duration_minutes: 15,
        order_index: 8,
        is_published: true,
        content: `
            <h2>1. Ne pas mettre tous ses œufs dans le même panier : Le principe de diversification</h2>
            <p>La <strong>diversification</strong> est la seule règle d'or universelle en finance. Son objectif est de <strong>maîtriser le risque</strong>. Si une entreprise subit un choc, la performance positive des autres actifs compense la perte.</p>
            <h3>L'Analogie à Retenir : La Ferme aux Cultures Multiples</h3>
            <p>Le fermier intelligent cultive du maïs, du mil et de l'igname. [cite_start]S'il y a une mauvaise saison pour le maïs, les autres cultures sauvent la ferme de la faillite [cite: 370-372]. Votre portefeuille doit contenir différents types de "cultures" (actifs).</p>

            <h2>2. L'allocation d'actifs : La "recette" de votre portefeuille</h2>
            <p>L'<strong>allocation d'actifs</strong> est la répartition de votre capital entre les grandes classes d'actifs (Actions, Obligations, Liquide). Cette répartition doit être dictée par votre profil d'investisseur (M4).</p>
            <p>C'est cette décision initiale (le pourcentage d'Actions vs. Obligations) qui déterminera 90 % de la performance et du risque de votre portefeuille sur le long terme.</p>

            <h2>3. Diversification sectorielle et géographique</h2>
            <p>À la BRVM, la <strong>diversification sectorielle</strong> est cruciale. Il est bon de posséder une banque (sensible aux taux), une Telco (défensive et stable) et une société industrielle (sensible aux cycles).</p>
            <p>La diversification entre les actions de différents pays (Côte d'Ivoire, Sénégal, Togo, etc.) permet de réduire le risque lié aux politiques nationales spécifiques.</p>

            <h2>4. Le rééquilibrage : La maintenance annuelle de votre portefeuille</h2>
            <p>Le <strong>Rééquilibrage</strong> consiste à rétablir l'équilibre initial de votre allocation (ex: 50/50) en vendant une partie des actifs qui ont monté (les actions) et en achetant les actifs qui ont sous-performé (les obligations).</p>
            <p>Cette discipline force l'investisseur à vendre cher et à acheter "moins cher", et doit être faite au moins une fois par an.</p>

            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>Diversification</strong> : Répartition des investissements pour réduire le risque.</li>
                <li><strong>Allocation d'Actifs</strong> : Le ratio de répartition entre les grandes catégories d'investissement (Actions, Obligations, Cash).</li>
                <li><strong>Rééquilibrage</strong> : Opération périodique visant à rétablir l'allocation d'actifs initiale.</li>
            </ul>
        `,
    });

    // ====================================================
    // === M9 : LE CONTEXTE ÉCONOMIQUE (AVANCÉ) ===
    // ====================================================
    await createOrUpdateModule({
        title: "Le Contexte Économique - Sentir le pouls du marché",
        slug: 'contexte-economique',
        description: "Comprenez l'impact des indicateurs macroéconomiques (Inflation, Taux d'intérêt, PIB) et le rôle de la BCEAO sur la performance des entreprises BRVM.",
        difficulty_level: 'avance',
        content_type: 'article',
        duration_minutes: 15,
        order_index: 9,
        is_published: true,
        content: `
            <h2>1. Les 3 indicateurs à suivre</h2>
            <p>Les entreprises cotées à la BRVM n'existent pas dans un vide. Leurs bénéfices dépendent de la santé de l'économie régionale.</p>
            <ul>
                <li><strong>La Croissance du PIB</strong> : Une croissance élevée est positive pour la bourse, car elle signifie que les entreprises vendent plus et font plus de bénéfices.</li>
                <li><strong>L'Inflation</strong> : Une augmentation trop élevée des prix peut nuire aux entreprises (augmentation des coûts) et éroder le pouvoir d'achat.</li>
                <li><strong>Les Taux d'Intérêt</strong> : Ils représentent le coût de l'argent.</li>
            </ul>

            <h2>2. Le rôle de la BCEAO : Comment ses décisions influencent les marchés</h2>
            <p>La <strong>Banque Centrale des États de l'Afrique de l'Ouest (BCEAO)</strong> a pour mission principale de maintenir la stabilité des prix et de soutenir la croissance économique.</p>
            <ul>
                <li><strong>Hausse des taux par la BCEAO</strong> : Les entreprises cotées (qui empruntent) voient le coût de leur dette augmenter, ce qui réduit potentiellement leurs bénéfices. Les obligations deviennent plus attrayantes.</li>
                <li><strong>Baisse des taux</strong> : Stimule l'économie et est généralement positif pour les Actions.</li>
            </ul>

            <h2>3. Cycles économiques : Quels secteurs performent le mieux et à quel moment?</h2>
            <p>L'économie passe par des phases (Expansion, Récession). Certains secteurs y sont sensibles :</p>
            <ul>
                <li><strong>Secteurs Cycliques</strong> : Matières premières, industries, certaines banques. Ils performent bien en période d'expansion.</li>
                <li><strong>Secteurs Défensifs</strong> : Télécommunications, services publics, alimentation. Ils sont stables et recherchés en période de ralentissement.</li>
            </ul>
            <p>Comprendre le cycle vous aide à diversifier stratégiquement (M8).</p>

            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>Inflation</strong> : Augmentation générale et durable des prix des biens et services.</li>
                <li><strong>BCEAO</strong> : Banque Centrale des États de l'Afrique de l'Ouest, responsable de la politique monétaire régionale.</li>
                <li><strong>PIB</strong> : Produit Intérieur Brut, mesure de la production de richesse d'une économie.</li>
            </ul>
        `,
    });

    // ====================================================
    // === M10 : PASSAGE À L'ACTION ! (AVANCÉ) ===
    // ====================================================
    await createOrUpdateModule({
        title: "Passage à l'Action! - Ouvrir son compte et investir",
        slug: 'passage-a-l-action',
        description: "Soyez 100% autonome pour choisir sa SGI, ouvrir son compte, passer ses premiers ordres d'achat, et comprendre les implications fiscales de son investissement à la BRVM.",
        difficulty_level: 'avance',
        content_type: 'article',
        duration_minutes: 20,
        order_index: 10,
        is_published: true,
        content: `
            <h2>1. Guide pratique : Comment choisir sa SGI?</h2>
            <p>Le choix de votre <strong>SGI</strong> (Société de Gestion et d'Intermédiation, M2) est critique, car les frais de courtage sont vos dépenses d'investissement.</p>
            <table class="table-auto w-full text-left border-collapse border border-gray-300 my-4">
                <thead class="bg-gray-100">
                    <tr><th>Critère Clé</th><th>Question à Poser</th><th>Importance pour Mamadou (Novice)</th></tr>
                </thead>
                <tbody>
                    <tr><td>Agrément & Réputation</td><td>La SGI est-elle agréée par l'AMF-UMOA?</td><td>Essentielle (Sécurité légale et fiabilité)</td></tr>
                    <tr><td>Frais de Courtage</td><td>Quel est le pourcentage prélevé sur mes ordres d'achat/vente? Y a-t-il des frais de garde?</td><td>Haute (Impact direct sur la rentabilité à long terme)</td></tr>
                    <tr><td>Accessibilité/Plateforme</td><td>La plateforme est-elle simple, intuitive et accessible via mobile?</td><td>Haute (Facilite l'action, réduit la friction)</td></tr>
                    <tr><td>Service Client & Conseil</td><td>Le service client est-il réactif et capable de m'accompagner en tant que débutant?</td><td>Haute (Rassurance et guidage initial)</td></tr>
                </tbody>
            </table>

            <h2>2. Étape par étape : Le processus d'ouverture d'un compte-titres</h2>
            <p>Le processus est standardisé :</p>
            <ul>
                <li>Choix et contact de la SGI (vérifiez l'agrément).</li>
                <li>Remplissage du dossier et fourniture des documents (KYC).</li>
                <li>Signature de la convention de compte-titres.</li>
                <li>La SGI procède à l'ouverture de votre code investisseur au Dépositaire Central (DC/BR, M2).</li>
            </ul>

            <h2>3. Passer son premier ordre d'achat : Ordre au marché, ordre à cours limité</h2>
            <p>Vous passez un <strong>ordre</strong> à votre SGI.</p>
            <ul>
                <li><strong>Ordre au Marché</strong> : Vous garantissez l'exécution de la quantité, mais vous acceptez le meilleur prix disponible au moment de l'exécution. <strong>Risque</strong> : Le prix d'exécution peut être très éloigné de la dernière cotation visible si le marché est peu liquide.</li>
                <li><strong>Ordre à Cours Limité</strong> : Vous fixez un prix maximal d'achat. L'ordre ne sera exécuté que si le marché atteint ou dépasse ce prix. <strong>Avantage</strong> : Contrôle total sur le prix.</li>
            </ul>
            <p><strong>Conseil de l'Expert</strong> : Privilégiez l'<strong>Ordre à Cours Limité</strong> pour garantir le prix payé et éviter les mauvaises surprises.</p>
            
            <h2>4. La fiscalité de l'investisseur pour les nuls (UEMOA)</h2>
            <p>Selon la Directive UEMOA 02/2010, les prélèvements effectués sur les revenus des valeurs mobilières (dividendes) et les plus-values résultant de la cession (gain à la revente) sont généralement <strong>libératoires</strong> de tous autres impôts.</p>
            <p><strong>Signification pour Mamadou</strong> : L'impôt est retenu à la source par l'entreprise ou votre SGI, et vous n'avez pas besoin de déclarer ou de payer un impôt supplémentaire sur ces gains dans les autres États membres de l'Union.</p>

            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>Ordre au Marché</strong> : Ordre exécuté immédiatement au meilleur prix disponible.</li>
                <li><strong>Ordre à Cours Limité</strong> : Ordre qui ne s'exécute que si le prix atteint ou est meilleur que le prix fixé par l'investisseur.</li>
                <li><strong>Prélèvement Libératoire</strong> : Impôt retenu à la source qui libère l'investisseur de toute autre obligation fiscale sur ce revenu.</li>
            </ul>
            <p class="mt-8 text-center text-lg font-bold text-blue-600">Le parcours est terminé. Vous avez désormais toutes les connaissances pour investir avec confiance et discipline.</p>
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