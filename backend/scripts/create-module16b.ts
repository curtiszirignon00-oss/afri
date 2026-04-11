/// <reference types="node" />
// backend/scripts/create-module16b.ts
// Script pour créer le Module 16B — Stratégie de Sélection et Déploiement

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule16B() {
    try {
        console.log('📦 Création du Module 16B — Stratégie de Sélection et Déploiement...');

        const slug = 'module16b-strategie-selection';

        const content = `
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
`;

        const existingModule = await prisma.learningModule.findFirst({
            where: { slug }
        });

        if (existingModule) {
            console.log('⚠️  Module 16B existe déjà. Mise à jour...');
            await prisma.learningModule.update({
                where: { id: existingModule.id },
                data: {
                    title: 'Module 16B : Stratégie de Sélection et Déploiement',
                    description: "Filtrez le marché BRVM avec la méthode des 4 filtres, déployez votre capital progressivement et évitez les 7 erreurs classiques du débutant.",
                    difficulty_level: 'avance',
                    content_type: 'article',
                    duration_minutes: 25,
                    order_index: 17,
                    is_published: true,
                    has_quiz: true,
                    content,
                }
            });
            console.log('✅ Module 16B mis à jour.');
        } else {
            await prisma.learningModule.create({
                data: {
                    title: 'Module 16B : Stratégie de Sélection et Déploiement',
                    slug,
                    description: "Filtrez le marché BRVM avec la méthode des 4 filtres, déployez votre capital progressivement et évitez les 7 erreurs classiques du débutant.",
                    difficulty_level: 'avance',
                    content_type: 'article',
                    duration_minutes: 25,
                    order_index: 17,
                    is_published: true,
                    has_quiz: true,
                    content,
                }
            });
            console.log('✅ Module 16B créé.');
        }

        console.log(`   Slug: ${slug}`);
        console.log('   Quiz: oui (à créer avec create-module16-quiz.ts)');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createModule16B();
