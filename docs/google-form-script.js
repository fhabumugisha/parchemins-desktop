/**
 * Script Google Apps Script pour créer le formulaire de feedback Parchemins
 *
 * INSTRUCTIONS :
 * 1. Va sur https://script.google.com
 * 2. Clique sur "Nouveau projet"
 * 3. Supprime le contenu par défaut et colle ce script
 * 4. Clique sur "Exécuter" (icône play)
 * 5. Autorise les permissions demandées
 * 6. Le formulaire sera créé dans ton Google Drive
 * 7. Ouvre le formulaire et copie le lien de partage
 */

function createParcheminsFeedbackForm() {
  // Créer le formulaire
  const form = FormApp.create('Parchemins - Feedback Beta Testeurs');

  // Description du formulaire
  form.setDescription(
    'Merci de prendre quelques minutes pour nous faire part de vos retours sur Parchemins. ' +
    'Vos commentaires sont précieux pour améliorer l\'application.'
  );

  // Activer la collecte d'emails (optionnel)
  form.setCollectEmail(false);

  // ========================================
  // SECTION 1 : Identification (optionnel)
  // ========================================
  form.addSectionHeaderItem()
    .setTitle('Identification')
    .setHelpText('Cette section est optionnelle');

  form.addTextItem()
    .setTitle('Votre nom (optionnel)')
    .setRequired(false);

  // ========================================
  // SECTION 2 : Votre retour
  // ========================================
  form.addSectionHeaderItem()
    .setTitle('Votre retour');

  // Type de retour
  const typeItem = form.addMultipleChoiceItem();
  typeItem.setTitle('Type de retour')
    .setChoices([
      typeItem.createChoice('Bug / Problème technique'),
      typeItem.createChoice('Suggestion d\'amélioration'),
      typeItem.createChoice('Question'),
      typeItem.createChoice('Compliment'),
      typeItem.createChoice('Autre')
    ])
    .setRequired(true);

  // Description
  form.addParagraphTextItem()
    .setTitle('Description de votre retour')
    .setHelpText('Décrivez votre retour le plus précisément possible. Pour un bug, indiquez les étapes pour le reproduire.')
    .setRequired(true);

  // Lien capture d'écran (alternative au file upload qui n'est pas supporté)
  form.addTextItem()
    .setTitle('Lien vers une capture d\'écran (optionnel)')
    .setHelpText('Si vous avez une capture d\'écran, uploadez-la sur imgur.com ou Google Drive et collez le lien ici')
    .setRequired(false);

  // ========================================
  // SECTION 3 : Utilisation
  // ========================================
  form.addSectionHeaderItem()
    .setTitle('Votre utilisation');

  // Fonctionnalités utilisées
  const featuresItem = form.addCheckboxItem();
  featuresItem.setTitle('Quelles fonctionnalités utilisez-vous le plus ?')
    .setChoices([
      featuresItem.createChoice('Recherche dans les sermons'),
      featuresItem.createChoice('Chat avec l\'assistant IA'),
      featuresItem.createChoice('Consultation et lecture des documents'),
      featuresItem.createChoice('Résumé automatique de sermons')
    ])
    .setRequired(false);

  // ========================================
  // SECTION 4 : Satisfaction
  // ========================================
  form.addSectionHeaderItem()
    .setTitle('Votre satisfaction');

  // Satisfaction globale
  form.addScaleItem()
    .setTitle('Satisfaction globale')
    .setHelpText('1 = Très insatisfait, 5 = Très satisfait')
    .setBounds(1, 5)
    .setLabels('Très insatisfait', 'Très satisfait')
    .setRequired(true);

  // Facilité d'utilisation
  form.addScaleItem()
    .setTitle('Facilité d\'utilisation')
    .setHelpText('1 = Très difficile, 5 = Très facile')
    .setBounds(1, 5)
    .setLabels('Très difficile', 'Très facile')
    .setRequired(true);

  // Recommandation
  const recommendItem = form.addMultipleChoiceItem();
  recommendItem.setTitle('Recommanderiez-vous Parchemins à un collègue pasteur ?')
    .setChoices([
      recommendItem.createChoice('Oui, certainement'),
      recommendItem.createChoice('Oui, probablement'),
      recommendItem.createChoice('Je ne sais pas'),
      recommendItem.createChoice('Non, probablement pas'),
      recommendItem.createChoice('Non, certainement pas')
    ])
    .setRequired(true);

  // Commentaire libre
  form.addParagraphTextItem()
    .setTitle('Commentaire libre (optionnel)')
    .setHelpText('Avez-vous autre chose à nous dire ?')
    .setRequired(false);

  // ========================================
  // Message de confirmation
  // ========================================
  form.setConfirmationMessage(
    'Merci beaucoup pour votre retour ! ' +
    'Vos commentaires nous aident à améliorer Parchemins.'
  );

  // Log l'URL du formulaire
  Logger.log('========================================');
  Logger.log('FORMULAIRE CRÉÉ AVEC SUCCÈS !');
  Logger.log('========================================');
  Logger.log('URL d\'édition : ' + form.getEditUrl());
  Logger.log('URL de partage : ' + form.getPublishedUrl());
  Logger.log('========================================');
  Logger.log('Copie l\'URL de partage ci-dessus et colle-la dans constants.ts');

  return form.getPublishedUrl();
}
