import type { Market } from "./types"

export const market: Market = {
  copy: {
    key: "fr",
    path: "/fr",
    lang: "fr-FR",
    hreflang: "fr-FR",
    country: "France",
    title: "Être recommandé par ChatGPT en France | Alphaa",
    description:
      "Alphaa est un agent IA qui fait recommander votre entreprise par ChatGPT, Gemini, Claude et Perplexity. Il agit, vous validez. Vérification gratuite.",
    h1a: "Des clients grâce à",
    h1b: "Votre agent IA fait le travail.",
    sub: "Vos clients demandent à ChatGPT qui appeler à Paris, Lyon ou Bordeaux. Il cite un nom. Ce n’est pas le vôtre. Je découvre pourquoi, je corrige, et je vous dis exactement ce que j’ai fait.",
    cta: "Vérifier mon entreprise, c’est gratuit",
    guarantee: ["Si aucune IA ne vous cite sous 90 jours,", "le mois suivant vous est offert."],
    fine: "Sans carte bancaire. ChatGPT, Gemini, Claude et Perplexity vérifiés en direct.",
    arrows: ["c’est en direct, essayez", "les vraies réponses en 60 s"],
    greet: {
      startHere: "Commencez ici",
      lines: [
        "Bonjour, je suis Alphaa, un agent IA.",
        "Je fais en sorte que ChatGPT, Gemini, Claude et Perplexity recommandent votre entreprise.",
      ],
      ask: "Quelle est l’adresse de votre site ?",
      hint: "Rien à installer, pas de carte bancaire. Juste votre site. J’interroge les IA en français ; le rapport est en anglais pour l’instant.",
      idleHint:
        "Tapez l’adresse de votre site et appuyez sur Entrée. Je pose la question à ChatGPT, Gemini, Claude et Perplexity en direct, en français, en 60 secondes environ. Le rapport est rédigé en anglais pour l’instant.",
    },
    pillarsTitle: "Ce que je fais pour les entreprises en France",
    pillars: [
      {
        title: "Je découvre pourquoi l’IA cite un concurrent",
        body: "Chaque semaine, je pose aux quatre IA les questions que posent vos clients, en français et comme on les pose chez vous (« un bon dentiste dans le 15e », « un plombier dispo ce soir à Villeurbanne »), et je vous montre qui est cité à votre place, et pourquoi.",
      },
      {
        title: "Je fais le travail, pas une liste de tâches",
        body: "J’écris les pages et les réponses que l’IA reprend, je corrige les informations fausses (téléphone, adresse, horaires, activité), j’ajoute le code en arrière-plan que l’IA lit, et je fais vivre votre fiche Google : publications et réponses aux avis. Vous validez chaque changement d’un simple geste.",
      },
      {
        title: "Je vous rends compte, simplement",
        body: "Un court point chaque semaine, sans jargon : ce que j’ai fait, ce qui a bougé dans les réponses des IA, et ce qui attend votre accord. Et une alerte le jour où une IA vous cite pour la première fois.",
      },
    ],
    whereTitle: "Où l’IA se renseigne sur vous en France",
    whereIntro:
      "Avant de recommander une entreprise, l’IA vérifie ce que d’autres sites disent d’elle. En France, voici ce qui pèse le plus :",
    where: [
      { name: "Fiche d’établissement Google", why: "Activité, horaires, photos et avis : c’est souvent la première source que l’IA recoupe." },
      { name: "PagesJaunes", why: "L’annuaire de référence des pros en France, que l’IA consulte pour vérifier vos coordonnées." },
      { name: "Doctolib, Planity, Trustpilot, Avis Vérifiés", why: "Selon votre métier, les plateformes de rendez-vous et d’avis qui confirment que vous existez et que vos clients sont satisfaits." },
      { name: "Votre propre site", why: "Des pages claires par prestation et par ville, et des réponses en français que l’IA peut citer telles quelles." },
    ],
    priceTitle: "Un agent IA. Au lieu d’une agence.",
    priceSub: "Tout ce qu’il faut pour que l’IA vous recommande, fait pour vous, sur votre feu vert.",
    priceItems: [
      "Chaque semaine, je vérifie ce que répondent ChatGPT, Gemini, Claude et Perplexity",
      "Pages, FAQ et articles rédigés pour vous, en français",
      "Votre fiche Google tenue à jour : publications et réponses aux avis",
      "Rien n’est publié sans votre accord, et chaque modification peut être annulée",
      "Sans engagement, résiliable en deux clics, remboursement possible sous 7 jours après le premier prélèvement",
      "Si aucune IA ne vous cite sous 90 jours, le mois suivant vous est offert.",
    ],
    priceCta: "Être recommandé par l’IA, {starter}/mois",
    priceNote:
      "Starter {starter}/mois, Pro {pro}/mois (jusqu’à 3 établissements), Accompagnement complet {full}/mois (une personne publie tout pour vous). Facturation mensuelle, sans engagement. Prix HT pour les professionnels.",
    faqTitle: "Les questions des pros en France",
    faq: [
      {
        q: "Est-ce que ça marche pour une entreprise française ?",
        a: "Oui. Je pose à ChatGPT, Gemini, Claude et Perplexity les questions de vos clients, en français et avec votre ville, je vérifie les sites que l’IA lit (votre fiche Google, PagesJaunes, les plateformes d’avis de votre métier) et je corrige ce qui manque ou ce qui est faux.",
      },
      {
        q: "Combien ça coûte ?",
        a: "Starter : {starter} par mois. Pro : {pro} par mois, jusqu’à 3 établissements. Accompagnement complet : {full} par mois, une personne publie tout pour vous. Sans engagement, résiliable en deux clics, et remboursement sous 7 jours sur le premier prélèvement. La vérification sur cette page est gratuite.",
      },
      {
        q: "Je dois vous donner mes mots de passe ?",
        a: "Non. Je me connecte avec une simple autorisation sécurisée (WordPress, Shopify, Webflow). Si c’est un prestataire qui gère votre site, je lui envoie par e-mail la modification exacte à faire.",
      },
      {
        q: "Et le RGPD ?",
        a: "Je n’utilise que votre site et des informations publiques pour vérifier ce que disent les IA. Les cookies de mesure et de publicité ne sont déposés qu’avec votre consentement, et vous pouvez demander la suppression de vos données à tout moment.",
      },
      {
        q: "Le produit est-il en français ?",
        a: "La vérification interroge les IA en français, comme vos clients. Le rapport et le point hebdomadaire sont en anglais pour l’instant ; la version française arrive.",
      },
    ],
    english: "English version",
  },

  extra: {
    questionsTitle: "Ce que vos clients demandent vraiment à l’IA",
    questionsIntro:
      "Ils ne tapent plus trois mots-clés dans Google. Ils posent une vraie question à ChatGPT, comme à un ami, et l’IA répond avec deux ou trois noms. Quelques exemples :",
    questions: [
      { q: "Tu peux me conseiller un dentiste à Lyon qui prend encore de nouveaux patients ?", who: "Un patient qui vient d’emménager" },
      { q: "Ma chaudière est en panne, quel chauffagiste sérieux peut passer demain à Toulouse ?", who: "Un propriétaire, un dimanche soir" },
      { q: "Quel avocat en droit du travail à Lille pour contester un licenciement ?", who: "Un salarié qui cherche de l’aide" },
      { q: "Un bon institut à Bordeaux pour un soin du visage avant un mariage ?", who: "Une cliente qui veut réserver vite" },
      { q: "Quelle agence immobilière à Nantes pour vendre un appartement rapidement ?", who: "Un vendeur qui compare" },
    ],
    industriesTitle: "Les métiers que j’accompagne en France",
    industriesIntro:
      "Pour ces métiers, un seul nouveau client rapporte souvent plus qu’une année d’Alphaa. Je connais les sites que l’IA y consulte et les questions que posent vos clients.",
    industryLinkPrefix: "En savoir plus pour les",
    industries: [
      {
        slug: "dentiste",
        name: "dentistes",
        title: "Dentistes : être recommandé par ChatGPT",
        description:
          "Quand un patient demande à ChatGPT un dentiste à Paris ou à Lyon, l’IA cite deux ou trois cabinets. Alphaa fait en sorte que le vôtre en fasse partie.",
        h1: "Quand un patient demande un dentiste à l’IA, votre cabinet doit être dans la réponse",
        sub: "De plus en plus de patients demandent à ChatGPT où trouver un dentiste près de chez eux, ou un spécialiste des implants. Je découvre quels cabinets l’IA cite à votre place, je corrige ce qui vous manque, et vous validez chaque changement.",
        questions: [
          "Quel dentiste à Paris 15e accepte de nouveaux patients et a des rendez-vous rapides ?",
          "Un bon cabinet dentaire à Marseille pour des implants, avec un devis clair ?",
          "Un dentiste à Nantes doux avec les enfants et les patients anxieux ?",
        ],
        where: [
          { name: "Doctolib", why: "Actes pratiqués, langues parlées, accès et créneaux : l’IA s’en sert pour savoir ce que fait votre cabinet et s’il prend de nouveaux patients." },
          { name: "Fiche d’établissement Google", why: "Les avis patients, les horaires et la catégorie exacte du cabinet sont repris presque mot pour mot par l’IA." },
          { name: "Annuaire de l’Assurance Maladie (ameli)", why: "Il confirme votre secteur de conventionnement et votre adresse, des informations que l’IA recoupe." },
          { name: "Le site du cabinet", why: "Une page par soin (implants, orthodontie, blanchiment) avec des réponses factuelles que l’IA peut citer." },
        ],
        steps: [
          { title: "Je pose les questions de vos patients", body: "Chaque semaine, je demande aux quatre IA qui consulter pour un implant, une urgence ou un premier rendez-vous dans votre quartier, et je vous montre quels cabinets sont cités." },
          { title: "J’écris des informations factuelles, dans les règles", body: "Je rédige des pages par soin et des réponses aux questions fréquentes, informatives et sobres, sans promesse de résultat ni ton publicitaire, dans le respect des règles de communication de la profession." },
          { title: "Je garde vos informations justes partout", body: "Horaires, adresse, accès, soins pratiqués : je repère les écarts entre votre site, Google et Doctolib, je corrige votre site et votre fiche Google, et je vous signale ce qu’il faut changer ailleurs." },
        ],
        faq: [
          { q: "Est-ce compatible avec les règles de communication des chirurgiens-dentistes ?", a: "Je rédige des informations factuelles et utiles aux patients, sans comparaison ni promesse de résultat. Rien n’est publié sans votre accord, et vous gardez la main sur chaque mot." },
          { q: "Je suis déjà sur Doctolib, ça ne suffit pas ?", a: "Doctolib aide l’IA à savoir que vous existez. Pour qu’elle vous recommande, elle a aussi besoin de pages claires sur vos soins et d’informations cohérentes partout. C’est ce que je complète." },
          { q: "Vous répondez aux avis Google de mes patients ?", a: "Je prépare des réponses courtes et courtoises, sans jamais révéler d’information médicale. Vous les validez avant publication." },
        ],
      },
      {
        slug: "plombier-chauffagiste",
        name: "plombiers-chauffagistes",
        title: "Plombier-chauffagiste : être cité par ChatGPT",
        description:
          "Fuite, chaudière en panne, pompe à chaleur : vos clients demandent à ChatGPT qui appeler. Alphaa fait en sorte que l’IA donne le nom de votre entreprise.",
        h1: "Fuite, chaudière en panne : quand le client demande à l’IA, c’est votre numéro qu’elle doit donner",
        sub: "Avant d’appeler un artisan, beaucoup demandent maintenant à ChatGPT qui est sérieux dans le coin. Je découvre quels artisans l’IA cite à votre place, je fais le travail pour que vous y soyez, et vous validez d’un geste, même depuis le chantier.",
        questions: [
          "Un plombier fiable à Toulouse pour une fuite ce soir, sans tarif abusif ?",
          "Quel chauffagiste RGE à Lyon pour remplacer ma chaudière fioul par une pompe à chaleur ?",
          "Qui fait l’entretien annuel de chaudière gaz à Lille avec un bon rapport qualité-prix ?",
        ],
        where: [
          { name: "Fiche d’établissement Google", why: "Zone d’intervention, horaires, urgences et avis : l’IA s’appuie dessus pour décider qui recommander près de chez le client." },
          { name: "PagesJaunes", why: "Toujours très consulté pour les artisans, il confirme votre activité, votre numéro et votre secteur." },
          { name: "Annuaire France Rénov’ des artisans RGE", why: "Pour les pompes à chaleur et la rénovation énergétique, il prouve votre qualification RGE, que l’IA mentionne quand le client parle d’aides." },
          { name: "Habitatpresto, Travaux.com et Houzz", why: "Les avis et les réalisations publiés sur ces plateformes servent de preuves que l’IA reprend." },
        ],
        steps: [
          { title: "Je vois quels artisans l’IA cite", body: "Chaque semaine, je pose aux quatre IA les questions de vos clients (fuite, débouchage, chaudière, pompe à chaleur) ville par ville, et je vous montre qui passe devant vous." },
          { title: "J’écris une page par intervention et par secteur", body: "Dépannage, entretien de chaudière, installation de pompe à chaleur, communes desservies : des pages claires, avec les réponses que l’IA peut reprendre, et vos qualifications (RGE, Qualibat) bien en vue." },
          { title: "Je fais vivre votre fiche Google", body: "Je prépare des publications sur vos chantiers et des réponses à chaque avis. Vous validez depuis votre téléphone en une seconde." },
        ],
        faq: [
          { q: "Je n’ai pas le temps de m’en occuper, je suis sur les chantiers.", a: "C’est prévu pour ça. Je fais le travail et je vous envoie juste de quoi valider d’un geste. Avec l’Accompagnement complet, une personne publie tout pour vous." },
          { q: "Je travaille sur plusieurs communes, ça se gère ?", a: "Oui. Je crée des pages pour les secteurs où vous intervenez vraiment, et la formule Pro couvre jusqu’à 3 établissements." },
          { q: "Et si un client laisse un avis négatif ?", a: "Je prépare une réponse calme et professionnelle, sans polémique. Vous la relisez et la validez avant qu’elle soit publiée." },
        ],
      },
      {
        slug: "avocat",
        name: "avocats",
        title: "Avocats : être recommandé par ChatGPT et l’IA",
        description:
          "Divorce, licenciement, création de société : vos futurs clients demandent un avocat à ChatGPT. Alphaa aide votre cabinet à faire partie de la réponse.",
        h1: "Quand un justiciable demande un avocat à l’IA, votre cabinet doit être cité",
        sub: "Avant de prendre rendez-vous, beaucoup demandent à ChatGPT quel avocat consulter pour leur problème, dans leur ville. Je découvre quels cabinets l’IA cite à votre place et je rédige des contenus sobres et exacts, que vous validez avant toute publication.",
        questions: [
          "Quel avocat en droit de la famille à Bordeaux pour un divorce par consentement mutuel ?",
          "Un avocat en droit du travail à Paris pour une rupture conventionnelle, et combien ça coûte ?",
          "Quel avocat à Nice pour créer une SAS et rédiger un pacte d’associés ?",
        ],
        where: [
          { name: "Annuaire du Conseil national des barreaux (avocat.fr)", why: "Il confirme votre inscription au barreau et vos spécialisations : une source officielle que l’IA prend au sérieux." },
          { name: "Le site de votre barreau", why: "L’annuaire de l’ordre local recoupe votre adresse et vos domaines d’intervention." },
          { name: "Fiche d’établissement Google", why: "Les avis clients et la catégorie du cabinet pèsent lourd quand l’IA cherche un avocat près de chez quelqu’un." },
          { name: "Le site du cabinet", why: "Des pages par domaine de droit, avec des réponses claires sur la procédure et le déroulé du premier rendez-vous." },
        ],
        steps: [
          { title: "Je pose les questions de vos futurs clients", body: "Chaque semaine, je demande aux quatre IA quel avocat consulter pour un divorce, un licenciement ou un litige commercial dans votre ville, et je vous montre quels confrères sont cités." },
          { title: "J’écris des contenus dignes de la profession", body: "Des pages par domaine et des réponses aux questions fréquentes, informatives, sans promesse de résultat ni comparaison avec des confrères, conformes à l’esprit du RIN. Vous validez chaque mot." },
          { title: "J’harmonise vos informations", body: "Adresse, barreau, domaines, honoraires indicatifs si vous le souhaitez : je fais en sorte que votre site et votre fiche Google disent la même chose que l’annuaire officiel." },
        ],
        faq: [
          { q: "Est-ce compatible avec la déontologie ?", a: "Je rédige de l’information juridique générale et factuelle, sans démarchage, sans promesse de résultat et sans comparaison. Rien n’est publié sans votre accord : vous restez seul juge de ce qui engage le cabinet." },
          { q: "Vous parlez de mes dossiers ?", a: "Jamais. Je n’utilise que votre site et des informations publiques. Aucune information sur vos clients ou vos affaires n’entre dans ce que j’écris." },
          { q: "Je suis spécialisé dans un seul domaine, ça vaut le coup ?", a: "Oui, souvent plus encore : l’IA cherche le bon avocat pour une question précise. Des pages précises sur votre domaine aident l’IA à vous citer quand c’est pertinent." },
        ],
      },
      {
        slug: "institut-de-beaute",
        name: "instituts de beauté",
        title: "Institut de beauté : être recommandé par l’IA",
        description:
          "Soin du visage, cils, ongles : vos clientes demandent à ChatGPT un bon institut près de chez elles. Alphaa fait en sorte que le vôtre soit dans la réponse.",
        h1: "Quand une cliente demande un bon institut à l’IA, c’est le vôtre qu’elle doit entendre",
        sub: "Vos clientes demandent à ChatGPT où se faire un soin du visage ou un rehaussement de cils près de chez elles. Je découvre quels instituts l’IA cite à votre place, je fais le travail, et vous validez entre deux rendez-vous.",
        questions: [
          "Un bon institut à Nice pour un soin du visage anti-âge, avec des avis sérieux ?",
          "Où faire un rehaussement de cils à Lyon 6e, avec de la disponibilité ce samedi ?",
          "Un institut à Lille pour une beauté des mains et un semi-permanent qui tient ?",
        ],
        where: [
          { name: "Planity", why: "Prestations, tarifs, créneaux et avis vérifiés : l’IA s’en sert pour savoir ce que vous proposez et si l’on peut réserver." },
          { name: "Treatwell", why: "Autre plateforme de réservation très utilisée en France, avec des avis que l’IA peut recouper." },
          { name: "Fiche d’établissement Google", why: "Photos, avis et horaires : l’IA s’y fie pour recommander un institut près de chez la cliente." },
          { name: "Votre site et votre Instagram", why: "Des pages par soin, avec durée et déroulé, que l’IA peut citer ; vos photos confirment votre savoir-faire." },
        ],
        steps: [
          { title: "Je vois quels instituts l’IA recommande", body: "Chaque semaine, je pose aux quatre IA les questions de vos clientes (soin du visage, cils, ongles, épilation) dans votre ville et votre quartier, et je vous montre qui est cité." },
          { title: "J’écris une page par soin", body: "Déroulé, durée, pour qui, comment préparer sa peau : des réponses claires que l’IA reprend, et des informations cohérentes avec votre page Planity." },
          { title: "Je réponds à vos avis", body: "Je prépare des réponses chaleureuses et personnelles à chaque avis Google, et des publications sur vos nouveautés. Vous validez d’un geste." },
        ],
        faq: [
          { q: "Je suis déjà sur Planity, ça ne suffit pas ?", a: "Planity aide l’IA à savoir ce que vous proposez. Pour qu’elle vous recommande, elle a aussi besoin d’avis, d’une fiche Google à jour et de pages claires sur vos soins. C’est ce que je complète." },
          { q: "J’ai deux instituts, c’est possible ?", a: "Oui. La formule Pro couvre jusqu’à 3 établissements, chacun avec ses propres pages et sa fiche Google." },
          { q: "Vous publiez à ma place ?", a: "Je prépare tout, vous validez d’un geste. Avec l’Accompagnement complet, une personne publie tout pour vous." },
        ],
      },
    ],
    backToMarket: "Retour à Alphaa France",
    industryCta: "Vérifier mon entreprise, c’est gratuit",
  },
}
