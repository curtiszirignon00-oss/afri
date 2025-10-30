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
            <h2>1. Bienvenue dans l'Académie : Notre Mission pour Vous</h2>
            <p>Vous êtes ici parce que vous savez que l'épargne seule ne suffit pas. Vous avez raison. L'inflation et le temps érodent la valeur de l'argent dormant.</p>
            <p>Notre mission chez AfriBourse est de retirer la friction, d'éliminer le jargon intimidant, et de vous prendre par la main pour transformer votre épargne en capital actif, spécifiquement sur notre marché régional, la <strong>BRVM</strong>.</p>
            <p>Nous croyons que la connaissance est la clé de la confiance.</p>

            <h2>2. La Bourse, un Moteur pour Nos Économies : Le "Pourquoi" de l'Investissement</h2>
            <p>Investir à la BRVM, ce n'est pas seulement enrichir votre compte en banque ; c'est participer activement au développement et à la richesse mieux partagée de notre région. Lorsque vous achetez des actions d'une entreprise locale, vous lui fournissez le capital nécessaire pour grandir, innover, créer des emplois et, in fine, distribuer des bénéfices à ses propriétaires – dont vous faites partie.</p>
            <h3>L'Analogie à Retenir : Le Piroguier Prudent</h3>
            <p>Imaginez que votre richesse est une pirogue. Le piroguier prudent ne se lance pas en mer sans vérifier la météo et sans une destination claire. Il sait que le voyage sera long et qu'il y aura des vagues (volatilité), mais il se concentre sur l'arrivée. L'investissement est un voyage : il demande de la préparation (la formation) et un cap (vos objectifs).</p>

            <h2>3. Présentation du Parcours : Votre Feuille de Route vers l'Autonomie</h2>
            <ul>
                <li><strong>Mindset</strong> : Définir la philosophie et l'état d'esprit de l'investisseur (M0, M5).</li>
                <li><strong>Fondations</strong> : Comprendre l'écosystème, les instruments et les acteurs (M1, M2, M3).</li>
                <li><strong>Stratégie</strong> : Aligner le temps et l'analyse (M4, M6, M7).</li>
                <li><strong>Action</strong> : Construire, gérer et exécuter (M8, M9, M10).</li>
            </ul>

            <h2>4. Brisons les Mythes : "Il ne faut pas être riche", "Ce n'est pas un casino"</h2>
            <p>Le mythe selon lequel il faut être millionnaire pour commencer est faux. Sur la BRVM, vous pouvez investir avec de petites sommes régulières. <strong>Le temps est plus important que le capital de départ</strong>.</p>
            <p>L'autre grand mythe est que la bourse est un jeu de hasard. C'est le cas si l'on <em>spécule</em> (parier sans analyse), mais pas si l'on <em>investit</em> (acheter une part d'entreprise solide avec une vision à long terme).</p>
            <p><strong>Citation de l'Expert :</strong> Le célèbre investisseur Ben Graham a dit : <em>"The individual investor should act consistently as an investor and not as a speculator."</em> En clair : agissez comme un propriétaire qui évalue la valeur de son affaire, pas comme un parieur qui espère un coup de chance.</p>
            
            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>BRVM</strong> : Bourse Régionale des Valeurs Mobilières, le marché financier commun des huit pays de l'UEMOA.</li>
                <li><strong>Investisseur</strong> : Quelqu'un qui achète des actifs en espérant des rendements futurs (bénéfices, dividendes) sur le long terme.</li>
                <li><strong>Spéculateur</strong> : Quelqu'un qui tente de prédire les mouvements de prix à court terme pour réaliser un profit rapide, souvent sans analyse fondamentale.</li>
            </ul>
        `,
    });

    // ==============================================
    // === M1 : LES FONDATIONS - BOURSE ET BRVM ===
    // ==============================================
    await createOrUpdateModule({
        title: "Les Fondations - Qu'est-ce que la Bourse et la BRVM?",
        slug: 'fondations-bourse-brvm',
        description: "Comprenez le rôle d'un marché financier et la distinction entre le marché primaire et secondaire.",
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 15,
        order_index: 1,
        is_published: true,
        content: `
            <h2>1. Qu'est-ce qu'un marché financier?</h2>
            <p>Un marché financier est simplement un lieu, physique ou virtuel, où l'argent rencontre des opportunités. Au lieu de vendre des mangues ou du pagne, on échange des <strong>titres financiers</strong> (actions, obligations). Ces titres représentent une petite part de la propriété (action) ou une dette (obligation) des grandes entreprises ou des États.</p>
            <h3>L'Analogie à Retenir : Le Grand Marché de Quartier</h3>
            <p>Imaginez le grand marché central de votre ville. Certains viennent vendre leurs produits directement au public (c'est le <strong>Marché Primaire</strong>), tandis que d'autres échangent des produits d'occasion entre eux (c'est le <strong>Marché Secondaire</strong>). La BRVM est ce marché qui garantit la transparence et la sécurité de ces échanges.</p>

            <h2>2. Le rôle de la Bourse : Financer les entreprises, créer de la richesse</h2>
            <p>La bourse régionale joue deux rôles fondamentaux pour l'UEMOA :</p>
            <ul>
                <li><strong>Financement</strong> : Elle permet aux entreprises (les émetteurs) de lever des capitaux nécessaires à leur expansion.</li>
                <li><strong>Liquidité</strong> : Elle offre aux investisseurs (comme vous) la possibilité d'acheter et de vendre facilement leurs titres, transformant ainsi l'investissement en capital liquide.</li>
            </ul>

            <h2>3. Présentation de la BRVM : Notre bourse régionale</h2>
            <p>La <strong>Bourse Régionale des Valeurs Mobilières (BRVM)</strong> est la bourse commune aux huit États membres de l'Union Économique et Monétaire Ouest Africaine (UEMOA) : Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal et Togo.</p>
            <h3>Indices Clés :</h3>
            <ul>
                <li><strong>BRVM Composite</strong> : Représente l'ensemble des sociétés cotées.</li>
                <li><strong>BRVM 10</strong> : Représente les 10 actions les plus liquides et les plus capitalisées.</li>
            </ul>

            <h2>4. Marché primaire vs. Marché secondaire</h2>
            <ul>
                <li><strong>Le Marché Primaire (L'IPO)</strong> : C'est ici qu'une entreprise vend ses titres pour la première fois (lors d'une Introduction en Bourse, ou IPO). L'argent va directement à l'entreprise pour financer ses projets.</li>
                <li><strong>Le Marché Secondaire (La Revente)</strong> : C'est le marché de la revente. Si vous achetez une action d'une société cotée aujourd'hui, vous l'achetez à un autre investisseur qui souhaite la vendre. C'est sur le Marché Secondaire que vous effectuerez la majorité de vos transactions.</li>
            </ul>

            <h2>5. Comment et pourquoi une entreprise entre en bourse (IPO)</h2>
            [cite_start]<p>Une entreprise fait une <strong>Introduction en Bourse (IPO)</strong> pour plusieurs raisons, toutes liées à la croissance : lever des capitaux sans s'endetter, gagner en notoriété et offrir une porte de sortie aux premiers actionnaires [cite: 80-82].</p>
            
            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>BRVM Composite</strong> : L'indice boursier général qui suit la performance de toutes les actions cotées sur la BRVM.</li>
                <li><strong>IPO</strong> : Introduction en Bourse, première vente des actions d'une entreprise au public (Marché Primaire).</li>
                <li><strong>Marché Secondaire</strong> : Le marché où les titres déjà émis sont échangés entre investisseurs (votre terrain de jeu quotidien).</li>
            </ul>
        `,
    });

    // =====================================
    // === M2 : LES ACTEURS DU JEU ===
    // =====================================
    await createOrUpdateModule({
        title: "Les Acteurs du Jeu - Qui fait quoi sur le marché?",
        slug: 'acteurs-du-jeu',
        description: "Identifiez les rôles des intervenants (SGI, AMF-UMOA, DC/BR, BCEAO) et le circuit de sécurité d'un ordre d'achat.",
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 15,
        order_index: 2,
        is_published: true,
        content: `
            <h2>1. L'Investisseur : C'est Vous!</h2>
            <p>Vous êtes un investisseur <strong>particulier</strong>, un individu qui investit avec sa propre épargne, par opposition aux investisseurs institutionnels (banques, assurances, fonds de pension).</p>

            <h2>2. Les SGI (Sociétés de Gestion et d'Intermédiation) : Votre courtier</h2>
            <p>La <strong>SGI</strong> est votre porte d'entrée obligatoire vers la BRVM. Vous devez passer par elle pour acheter ou vendre des actions.</p>
            <ul>
                <li><strong>Rôle</strong> : Ouvrir et gérer votre compte-titres, transmettre vos ordres, et conserver votre argent.</li>
            </ul>
            <h3>L'Analogie à Retenir : Votre "Taxi Moto" de Confiance</h3>
            <p>La SGI est votre chauffeur de confiance qui connaît le marché et s'assure que votre ordre est exécuté rapidement et en toute sécurité.</p>

            <h2>3. Le "gendarme" du marché : L’AMF-UMOA</h2>
            <p>L'<strong>Autorité des Marchés Financiers de l'UMOA (AMF-UMOA)</strong> est le régulateur suprême. Elle garantit l'intégrité et la transparence du marché.</p>
            <ul>
                <li><strong>Rôle</strong> : Surveiller, sanctionner les abus et agréer tous les intervenants (y compris les SGI et le DC/BR).</li>
                <li><strong>Gage de Sécurité</strong> : L'AMF-UMOA assure la conformité du marché régional, y compris la mise en œuvre des exigences de <strong>Lutte contre le Blanchiment de Capitaux</strong> (LBC/FT/FP).</li>
            </ul>

            <h2>4. Le "notaire" du marché : Le Dépositaire Central/Banque de Règlement (DC/BR)</h2>
            <p>Le <strong>DC/BR</strong> est le coffre-fort digital centralisé du marché UEMOA. Son rôle est essentiel :</p>
            <ul>
                <li><strong>Conservation des titres</strong> : Il assure la conservation scripturale (digitale) de tous les titres. Vos actions sont enregistrées en votre nom au DC/BR, et non par votre SGI.</li>
                <li><strong>Règlement-Livraison</strong> : Il s'assure que les titres sont livrés et l'argent réglé au vendeur (et inversement).</li>
            </ul>
            <p><strong>La garantie fondamentale de la sécurité de votre capital investi</strong> est que le DC/BR conserve vos titres de manière centralisée et séparée des SGI.</p>

            <h2>5. La "grande banque centrale" : Le rôle de supervision de la BCEAO</h2>
            <p>La <strong>Banque Centrale des États de l'Afrique de l'Ouest (BCEAO)</strong> supervise le système bancaire et monétaire. Ses décisions sur les taux d'intérêt et la politique monétaire ont un impact majeur sur les marchés et sur les taux d'emprunt des entreprises cotées.</p>
            
            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>SGI</strong> : Société de Gestion et d'Intermédiation, votre intermédiaire boursier obligatoire.</li>
                <li><strong>AMF-UMOA</strong> : Autorité des Marchés Financiers de l'UMOA, le régulateur (le gendarme).</li>
                <li><strong>DC/BR</strong> : Dépositaire Central/Banque de Règlement, l'entité qui conserve vos titres (le notaire).</li>
            </ul>
        `,
    });

    // ==================================================
    // === M3 : LES OUTILS DE L'INVESTISSEUR ===
    // ==================================================
    await createOrUpdateModule({
        title: "Les Outils de l'Investisseur - Actions, Obligations et OPCVM",
        slug: 'outils-investisseur',
        description: "Distinguez les Actions des Obligations et des OPCVM, et comprenez leur niveau de risque et de rendement.",
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 15,
        order_index: 3,
        is_published: true,
        content: `
            <h2>1. Les Actions : Devenir propriétaire d'une part d'entreprise</h2>
            <p>Acheter une action, c'est acquérir une fraction du capital d'une entreprise. Vous passez du statut de consommateur à celui de co-propriétaire.</p>
            <ul>
                <li><strong>Avantages (Rendement)</strong> : Plus-value et distribution de <strong>Dividendes</strong>.</li>
                <li><strong>Risques</strong> : Le risque est plus élevé car vous pouvez perdre tout votre capital si l'entreprise échoue.</li>
            </ul>
            <h3>L'Analogie à Retenir : L'Achat d'une Petite Échoppe de Quartier</h3>
            <p>Votre richesse est directement liée à la performance de l'affaire. Si elle réussit, vous partagez les profits (dividendes), mais vous partagez aussi les pertes (risque de baisse de l'action).</p>

            <h2>2. Les Obligations : Prêter de l'argent à une entreprise ou un État</h2>
            <p>Une obligation est une reconnaissance de dette. Vous prêtez de l'argent à une entreprise ou à un État pour une durée déterminée.</p>
            <ul>
                <li><strong>Sécurité</strong> : Moins risquées que les actions car les créanciers (porteurs d'obligations) sont remboursés avant les actionnaires en cas de liquidation.</li>
                <li><strong>Rendement</strong> : Vous recevez des paiements d'intérêts réguliers appelés <strong>coupons</strong>. Ce revenu est stable et prédéterminé.</li>
            </ul>
            <h3>L'Analogie à Retenir : Le Prêt à un Commerçant Sérieux</h3>
            <p>Même si l'emprunteur devient très riche, votre rendement reste fixé par le taux d'intérêt convenu (le coupon).</p>

            <h2>3. Le Match : Actions vs. Obligations (Rendement vs. Risque)</h2>
            <p>Le tableau comparatif ci-dessous résume le choix crucial selon votre profil :</p>
            <table class="table-auto w-full text-left border-collapse border border-gray-300 my-4">
                <thead class="bg-gray-100">
                    <tr><th>Caractéristique</th><th>Actions</th><th>Obligations</th><th>OPCVM (Fonds Commun)</th></tr>
                </thead>
                <tbody>
                    <tr><td>Nature de l'Investissement</td><td>Propriété (Actionnaire)</td><td>Prêt (Créancier)</td><td>Panier de titres (Gestion déléguée)</td></tr>
                    <tr><td>Revenu Potentiel</td><td>Dividendes et Plus-value (variable)</td><td>Intérêts (coupons) (stable)</td><td>Variable (selon le fonds)</td></tr>
                    <tr><td>Niveau de Risque</td><td>Élevé (Volatilité)</td><td>Faible à Modéré (Stabilité)</td><td>Modéré (Diversification)</td></tr>
                </tbody>
            </table>

            <h2>4. Les OPCVM (SICAV & FCP) : Le "panier garni" pour diversifier facilement</h2>
            <p>Les <strong>Organismes de Placement Collectif en Valeurs Mobilières (OPCVM)</strong> sont des fonds qui collectent l'argent de nombreux investisseurs pour acheter un portefeuille diversifié.</p>
            <ul>
                <li><strong>Types</strong> : SICAV (Société d'Investissement à Capital Variable) et FCP (Fonds Commun de Placement).</li>
                <li><strong>Avantage majeur</strong> : Ils offrent une diversification immédiate et la gestion est déléguée à des professionnels.</li>
            </ul>
            <h3>L'Analogie à Retenir : L'Achat d'un Panier de Fruits au Marché</h3>
            <p>Si un fruit est gâté, les autres compensent.</p>
            
            <h2>5. Introduction aux ETF : Le futur de l'investissement indiciel</h2>
            <p>Les <strong>ETF (Exchange Traded Funds)</strong> sont des OPCVM qui répliquent la performance d'un indice (comme le BRVM Composite). Ils offrent une diversification maximale à très faibles coûts et représentent l'avenir de l'investissement passif.</p>

            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>Dividende</strong> : Part du bénéfice d'une entreprise versée aux actionnaires (revenu d'action).</li>
                <li><strong>Coupon</strong> : Paiement d'intérêt périodique versé au détenteur d'une obligation (revenu d'obligation).</li>
                <li><strong>OPCVM</strong> : Organisme de Placement Collectif, un fonds qui gère un portefeuille diversifié pour le compte des investisseurs.</li>
            </ul>
        `,
    });

    // ==================================================
    // === M4 : LE TEMPS, VOTRE MEILLEUR ALLIÉ ===
    // ==================================================
    await createOrUpdateModule({
        title: "Le Temps, votre meilleur allié - Définir ses objectifs et son horizon",
        slug: 'le-temps-meilleur-allie',
        description: "Définissez votre horizon de placement (court, moyen, long terme) et votre profil d'investisseur (prudent, équilibré, dynamique).",
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 15,
        order_index: 4,
        is_published: true,
        content: `
            <h2>1. Court, moyen, long terme : Définir son horizon de placement</h2>
            <p>L'horizon de placement est la période pendant laquelle vous prévoyez de garder votre investissement.</p>
            <ul>
                <li><strong>Court Terme (moins de 2 ans)</strong> : Risque minimal (privilégiez les obligations ou l'épargne sécurisée).</li>
                <li><strong>Moyen Terme (2 à 7 ans)</strong> : Risque modéré (mélange d'actions et d'obligations).</li>
                <li><strong>Long Terme (plus de 7 ans)</strong> : Objectifs lointains (idéal pour les actions, car le temps absorbe la volatilité).</li>
            </ul>

            <h2>2. Comment le temps réduit le risque perçu</h2>
            <p>À court terme, les marchés peuvent être erratiques (volatilité). Mais sur le long terme, les marchés boursiers régionaux et mondiaux ont toujours eu une tendance haussière. <strong>Plus votre horizon est long, moins la volatilité ponctuelle compte</strong>.</p>
            <h3>L'Analogie à Retenir : Le Voyage en Car de Nuit</h3>
            <p>Si vous regardez par la fenêtre, le paysage semble flou (la volatilité quotidienne). [cite_start]Mais si vous vous concentrez sur l'horloge et la destination finale (l'objectif à long terme), vous savez que, malgré les cahots, vous arriverez à bon port [cite: 197-199].</p>
            <p><strong>Citation de l'Expert :</strong> Warren Buffett insiste sur la patience : <em>"If you aren't willing to own a stock for ten years, don't even think about owning it for ten minutes."</em></p>

            <h2>3. Quel investisseur êtes-vous? Profils prudent, équilibré, dynamique</h2>
            <p>Votre profil est défini par votre <strong>tolérance au risque</strong> (votre capacité émotionnelle et financière à accepter une perte temporaire) et votre horizon.</p>
            <table class="table-auto w-full text-left border-collapse border border-gray-300 my-4">
                <thead class="bg-gray-100">
                    <tr><th>Profil</th><th>Objectif Principal</th><th>Tolérance au Risque</th><th>Allocation d'Actifs Typique (Ex.)</th></tr>
                </thead>
                <tbody>
                    <tr><td>Prudent</td><td>Sécurité du capital, revenu stable.</td><td>Faible (Ne supporte pas une perte de 10%)</td><td>Majorité Obligations/OPCVM Prudent (ex: 80% Obligations)</td></tr>
                    <tr><td>Équilibré</td><td>Croissance modérée et revenu.</td><td>Moyenne (Accepte une perte temporaire de 15%)</td><td>Mixte Actions/Obligations (ex: 50%/50%)</td></tr>
                    <tr><td>Dynamique</td><td>Maximisation de la croissance.</td><td>Élevée (Se concentre sur le potentiel, tolère 30% de perte)</td><td>Majorité Actions (ex: 80% et plus d'Actions)</td></tr>
                </tbody>
            </table>
            <p>Un investisseur de 25 ans qui économise pour sa retraite est généralement <strong>dynamique</strong>.</p>

            <h2>4. Construire sa stratégie selon ses buts</h2>
            <p>Chaque objectif mérite sa propre "poche" d'investissement. Aligner votre horizon temporel avec votre allocation d'actifs est la première étape vers une stratégie d'investissement réussie.</p>

            <h3>Les Termes à Maîtriser :</h3>
            <ul>
                <li><strong>Horizon de Placement</strong> : La durée pendant laquelle l'investisseur prévoit de détenir l'actif.</li>
                <li><strong>Volatilité</strong> : L'intensité et la fréquence des variations de prix d'un titre.</li>
                <li><strong>Tolérance au Risque</strong> : La capacité (émotionnelle et financière) à accepter des pertes sur son capital.</li>
            </ul>
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