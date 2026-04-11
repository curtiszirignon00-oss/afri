/// <reference types="node" />
// backend/scripts/create-module16a.ts
// Script pour créer le Module 16A — Préparation et Infrastructure Financière

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule16A() {
    try {
        console.log('📦 Création du Module 16A — Préparation et Infrastructure Financière...');

        const slug = 'module16a-preparation-infrastructure';

        const content = `
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
`;

        const existingModule = await prisma.learningModule.findFirst({
            where: { slug }
        });

        if (existingModule) {
            console.log('⚠️  Module 16A existe déjà. Mise à jour...');
            await prisma.learningModule.update({
                where: { id: existingModule.id },
                data: {
                    title: 'Module 16A : Préparation et Infrastructure Financière',
                    description: "Mettez votre maison financière en ordre : règle des 3 enveloppes, ouverture du compte SGI et maîtrise des outils AfriBourse.",
                    difficulty_level: 'avance',
                    content_type: 'article',
                    duration_minutes: 20,
                    order_index: 16,
                    is_published: true,
                    has_quiz: false,
                    content,
                }
            });
            console.log('✅ Module 16A mis à jour.');
        } else {
            await prisma.learningModule.create({
                data: {
                    title: 'Module 16A : Préparation et Infrastructure Financière',
                    slug,
                    description: "Mettez votre maison financière en ordre : règle des 3 enveloppes, ouverture du compte SGI et maîtrise des outils AfriBourse.",
                    difficulty_level: 'avance',
                    content_type: 'article',
                    duration_minutes: 20,
                    order_index: 16,
                    is_published: true,
                    has_quiz: false,
                    content,
                }
            });
            console.log('✅ Module 16A créé.');
        }

        console.log(`   Slug: ${slug}`);
        console.log('   Quiz: non (module de lecture/checkbox)');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createModule16A();
