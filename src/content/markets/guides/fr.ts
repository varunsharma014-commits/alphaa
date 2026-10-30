import type { MarketGuides } from "../guides-types"

export const guides: MarketGuides = {
  base: "guide",
  label: "Guides",
  guides: [
    {
      slug: "etre-recommande-par-chatgpt",
      title: "Être recommandé par ChatGPT : le guide pour les pros",
      description:
        "Artisans, cabinets, instituts : la méthode pas à pas pour que ChatGPT, Gemini, Claude et Perplexity citent votre entreprise quand un client demande.",
      h1: "Comment faire recommander votre entreprise par ChatGPT, en sept étapes",
      answer:
        "ChatGPT, Gemini, Claude et Perplexity recommandent les entreprises sur lesquelles ils trouvent des informations claires, cohérentes et bien notées. Pour un professionnel en France, cela veut dire : une fiche d’établissement Google complète, les mêmes coordonnées sur PagesJaunes et les annuaires, des avis récents sur la plateforme de votre métier, et un site qui répond en phrases simples aux questions de vos clients.",
      takeaways: [
        "Commencez par interroger les IA comme le feraient vos clients : avec la ville, le quartier et le problème concret.",
        "Nom, adresse et téléphone doivent être strictement identiques partout, des mentions légales à PagesJaunes.",
        "Une page par prestation vaut mieux qu’une seule page « Nos services ».",
        "Des avis réguliers et authentiques comptent parmi les signaux les plus forts.",
        "Refaites le test chaque mois : les réponses des IA changent en permanence.",
      ],
      sections: [
        {
          h2: "Pourquoi la recommandation des IA compte pour un commerce local",
          paragraphs: [
            "Un mardi soir ordinaire : une cliente à Lyon demande à ChatGPT quel chauffagiste appeler, parce que sa chaudière ne redémarre plus. L’IA donne un nom, peut-être deux. Le vôtre n’y est pas. Elle appelle l’autre entreprise, et vous ne saurez jamais que cette demande a existé. Ce guide explique ce que vous pouvez faire pour que cela change.",
            "De plus en plus de gens ne tapent plus trois mots-clés dans Google. Ils posent une vraie question à un assistant IA, comme à un ami : « Tu connais un plombier sérieux à Montpellier qui peut passer demain ? » ou « Quel ostéopathe à Rennes pour un mal de dos après la grossesse ? »",
            "La différence avec Google est nette. Google affiche une liste, une carte et des annonces ; le client choisit. ChatGPT ou Perplexity répondent avec deux, trois, parfois cinq noms, souvent avec une courte justification. Si vous n’êtes pas dans la réponse, vous n’existez pas pour cette demande. Les spécialistes parlent de GEO (Generative Engine Optimization), d’AEO (Answer Engine Optimization) ou simplement de référencement dans les IA. Le nom importe peu : l’essentiel est que l’IA trouve assez d’informations fiables sur vous.",
            "Bonne nouvelle : presque tout ce qui suit peut se faire soi-même, sans agence. Les étapes sont classées de la plus rentable à la plus fine.",
          ],
        },
        {
          h2: "Étape 1 : demandez aux IA ce qu’elles disent de vous aujourd’hui",
          paragraphs: [
            "Avant de changer quoi que ce soit, faites un état des lieux. Ouvrez ChatGPT, Gemini, Claude et Perplexity et posez à chacun trois à cinq questions, formulées comme vos clients les poseraient. Pas « avocat droit du travail Lille », mais « Mon employeur veut me licencier, quel avocat en droit du travail à Lille tu me conseilles ? »",
            "Notez pour chaque réponse : êtes-vous cité ? Qui est cité à votre place ? Quelles sources l’IA affiche-t-elle ? Perplexity et ChatGPT avec la recherche web montrent généralement leurs sources. Ces sources sont votre liste de travail : si l’IA s’appuie sur PagesJaunes, Planity ou un article de la presse régionale pour vos concurrents, vous savez où vous devez être présent.",
            "Demandez aussi directement : « Que sais-tu de la boulangerie Martin à Annecy ? » Vous verrez vite si l’IA connaît des horaires périmés, une ancienne adresse ou une mauvaise activité.",
          ],
        },
        {
          h2: "Étape 2 : complétez votre fiche d’établissement Google",
          paragraphs: [
            "La fiche d’établissement Google (l’ancien Google My Business) est la source la plus importante pour les recherches locales. Gemini s’appuie directement sur les données de Google, et les autres assistants retrouvent souvent des informations de Google Maps via leur recherche web.",
          ],
          bullets: [
            "Choisissez la catégorie principale la plus précise possible : « Chauffagiste » plutôt que « Entreprise du bâtiment », « Avocat en droit de la famille » plutôt qu’« Avocat ».",
            "Ajoutez chaque prestation séparément, avec une courte description dans les mots de vos clients.",
            "Tenez à jour les horaires, y compris jours fériés, ponts et fermetures d’août.",
            "Publiez de vraies photos de l’équipe, des locaux et des réalisations, pas des images de banque.",
            "Utilisez les publications et la rubrique questions-réponses lorsqu’elles sont disponibles sur votre fiche.",
          ],
        },
        {
          h2: "Étape 3 : les mêmes coordonnées partout",
          paragraphs: [
            "Les IA recoupent les informations de plusieurs sources. Si PagesJaunes affiche un ancien numéro, si une autre plateforme garde l’adresse d’avant le déménagement et si votre nom commercial varie d’un site à l’autre, l’IA devient prudente. Elle préfère citer une entreprise dont tout concorde.",
            "Fixez une version de référence : nom exact (tel qu’il figure au registre et dans vos mentions légales), adresse, téléphone, site. Puis vérifiez PagesJaunes, Bing Places, Apple Business Connect et la fiche publique de votre entreprise sur l’Annuaire des Entreprises de l’État, alimenté par le répertoire SIRENE. Bing compte parce que plusieurs assistants IA s’appuient aussi sur ses résultats pour leur recherche web. Apple Business Connect contrôle ce que Plans et Siri affichent.",
            "N’oubliez pas vos mentions légales. Elles sont de toute façon obligatoires pour un site professionnel en France, et c’est souvent la page que l’IA considère comme la plus fiable pour vos coordonnées.",
          ],
        },
        {
          h2: "Étape 4 : une page par prestation, avec de vraies réponses",
          paragraphs: [
            "Les assistants IA citent volontiers un texte qui répond directement à une question. Une page d’accueil qui annonce « Votre partenaire de confiance pour tous vos projets » ne leur donne rien. Une page « Rénovation de salle de bains à Nantes : déroulé, délais, accessibilité PMR » leur donne tout.",
            "Créez une page pour chaque prestation importante. Ouvrez-la par deux ou trois phrases qui répondent à l’essentiel : ce que vous faites, pour qui, où et comment ça se passe. Ensuite viennent les détails, les questions fréquentes et votre zone d’intervention en toutes lettres, par exemple « Nous intervenons à Toulouse, Blagnac, Colomiers et Balma ».",
            "Ajoutez une FAQ avec les questions que vous entendez au téléphone : « C’est remboursé par la Sécu ? », « Vous êtes RGE ? », « Combien coûte un premier rendez-vous ? » Si votre profession le permet, donnez au moins une fourchette de prix ou la façon dont le tarif est calculé.",
            "Un exemple à reprendre. Voici comment une cliente pourrait poser sa question à ChatGPT, en français et avec sa ville : « Ma chaudière gaz affiche un code erreur depuis hier à Villeurbanne, on n’a plus d’eau chaude. Quel chauffagiste peut passer rapidement, et ça coûte combien à peu près ? » L’IA cherche alors des entreprises dont le site répond précisément à ce type de question : lieu, situation, délai, prix.",
            "Sur votre page « Dépannage chaudière à Lyon », une réponse de FAQ pourrait ressembler à ceci :",
            "« En combien de temps pouvez-vous intervenir pour une chaudière en panne à Lyon ? À Lyon 3e, Lyon 7e, Villeurbanne et Vénissieux, nous intervenons en général le jour même ou le lendemain en semaine. Le week-end, une astreinte est assurée avec une majoration. Le déplacement et la première demi-heure de diagnostic sont facturés au forfait ; nous vous annonçons le montant au téléphone, avant de partir. Une pression d’eau trop basse, cause fréquente, se règle souvent dès le premier passage. Au moment d’appeler, gardez sous la main la marque et le modèle de votre chaudière. »",
            "Pourquoi cette réponse fonctionne : elle reprend la question avec les mots du client, cite des quartiers et des communes précis, donne un délai honnête au lieu de « rapide et efficace », explique comment le prix est calculé et dit quoi faire ensuite. Ce sont exactement les éléments qu’une IA peut reprendre dans sa propre réponse.",
            "Notez dix questions que vous avez entendues cette semaine au téléphone ou par e-mail : c’est votre FAQ. N’inventez rien ; prix, délais et prestations doivent être exacts, sinon cela se verra dans le prochain avis.",
          ],
        },
        {
          h2: "Étape 5 : données structurées et accès des IA à votre site",
          paragraphs: [
            "Les données structurées (le balisage Schema.org) sont un petit bloc de code invisible qui dit aux machines, dans un format standard : ceci est un dentiste, voici l’adresse, voici les horaires. Pour une entreprise locale, on utilise le type « LocalBusiness » ou un sous-type précis comme « Dentist », « Attorney » ou « Plumber ». Sur WordPress, des extensions comme Yoast ou Rank Math le font sans coder.",
            "Vérifiez aussi que les IA ont le droit de lire votre site. Le fichier robots.txt, ou certains réglages d’hébergeurs et de CDN, bloquent parfois les robots des IA sans que le propriétaire le sache. Votre prestataire web peut le contrôler en quelques minutes.",
          ],
        },
        {
          h2: "Étape 6 : des avis réguliers, dans les règles",
          paragraphs: [
            "Pour une IA, les avis prouvent que de vrais clients sont satisfaits. Ce qui compte : le nombre, la fraîcheur et le contenu. Un avis qui décrit le travail (« fuite réparée un samedi, devis respecté ») aide davantage que cinq étoiles sans texte.",
            "Demandez un avis à vos clients satisfaits, par exemple avec un lien envoyé après le rendez-vous. Les faux avis et les avis achetés sont à proscrire : ils enfreignent les règles des plateformes et peuvent constituer une pratique commerciale trompeuse. Répondez à tous les avis, y compris les négatifs, calmement et sans détails confidentiels.",
            "Les professions réglementées ont leurs propres règles. Les médecins et chirurgiens-dentistes peuvent informer le public, mais leur code de déontologie exclut toute démarche commerciale ; les avocats doivent respecter les principes de dignité et de loyauté fixés par leur règlement. Des contenus sobres, factuels et utiles respectent ces règles, et ce sont justement ceux que les IA citent le plus volontiers.",
          ],
        },
        {
          h2: "Étape 7 : obtenez des mentions et mesurez chaque mois",
          paragraphs: [
            "Au-delà des annuaires, les IA lisent des sources éditoriales : presse régionale comme Ouest-France ou La Dépêche, sites de la mairie, chambres de métiers, CCI, associations professionnelles. Un article sur votre entreprise, une fiche dans l’annuaire de votre chambre de métiers ou votre inscription dans l’annuaire des professionnels RGE sont autant de confirmations indépendantes.",
            "Ensuite, refaites l’étape 1 une fois par mois, avec les mêmes questions. Les réponses fluctuent, et une correction d’annuaire met plusieurs semaines à se propager. Notez quels assistants vous citent et lesquels non.",
          ],
        },
        {
          h2: "Les erreurs les plus fréquentes",
          paragraphs: [
            "La plupart des entreprises ne butent pas sur la technique, mais sur des détails accumulés au fil des années. Voici ceux que l’on retrouve le plus souvent :",
          ],
          bullets: [
            "Un ancien numéro de téléphone resté sur un annuaire après un déménagement. L’IA le reprend et envoie vos clients vers une ligne qui n’existe plus.",
            "Des tarifs et des prestations publiés uniquement en PDF scanné ou en image. Une IA ne les lit pas toujours correctement ; les informations importantes doivent figurer en texte sur la page.",
            "Du discours publicitaire au lieu de réponses : « Votre satisfaction, notre priorité » ne répond à aucune question. « Nous rénovons des salles de bains à Nantes en trois à quatre semaines », si.",
            "Aucune zone d’intervention : si vous n’écrivez pas que vous travaillez aussi à Rezé et Saint-Herblain, l’IA a peu de raisons de vous citer pour ces communes.",
            "Des avis par vagues : vingt avis en une semaine, puis plus rien pendant un an, inspirent moins confiance que deux ou trois chaque mois.",
          ],
        },
        {
          h2: "Vos 30 premiers jours",
          paragraphs: [
            "Un plan réaliste, à côté du travail quotidien. Jours 1 à 3 : noter dix questions de clients, faire le test de l’étape 1 et consigner les résultats dans un simple tableau. Jours 4 à 10 : compléter la fiche d’établissement Google et aligner tous les annuaires sur la même orthographe. Jours 11 à 20 : réécrire vos deux pages de prestations les plus importantes avec une réponse directe et une FAQ, puis faire installer les données structurées par une extension ou par votre prestataire. Jours 21 à 30 : demander un avis à dix clients satisfaits, répondre à chaque nouvel avis et reposer les mêmes questions aux IA.",
            "N’attendez pas de miracle au bout de 30 jours. Certains assistants réagissent vite, d’autres mettent des mois. Mais vous aurez une base propre, un tableau de comparaison et une liste à reprendre chaque mois.",
            "Si ce suivi vous prend trop de temps : sur alphaa.app/fr, vous pouvez voir gratuitement, en une minute environ, ce que ChatGPT, Gemini, Claude et Perplexity répondent aujourd’hui en français à propos de votre entreprise. Alphaa est un agent IA qui refait ce contrôle chaque semaine et prépare les corrections ; vous validez chaque changement.",
          ],
        },
      ],
      faq: [
        {
          q: "Peut-on payer pour que ChatGPT recommande son entreprise ?",
          a: "Non, les recommandations dans les réponses classiques ne s’achètent pas. L’IA cite des entreprises en fonction de ce qu’elle trouve en ligne. Vous pouvez seulement faire en sorte que ces informations soient complètes, exactes et convaincantes.",
        },
        {
          q: "Combien de temps avant d’être cité par une IA ?",
          a: "Cela varie. Les assistants qui cherchent en direct sur le web, comme Perplexity, prennent souvent en compte un nouveau contenu en quelques semaines. Les corrections d’annuaires et les avis demandent plus de temps. Comptez quelques semaines à quelques mois, et mesurez chaque mois.",
        },
        {
          q: "Faut-il refaire son site ?",
          a: "Rarement. Il suffit en général de compléter l’existant : une page par prestation, une FAQ, des coordonnées exactes et des données structurées. C’est faisable sur WordPress, Wix ou n’importe quel outil courant.",
        },
        {
          q: "Est-ce différent du référencement naturel classique ?",
          a: "Beaucoup de choses se recoupent, comme des coordonnées propres et de bons contenus. La différence : l’IA ne cite que quelques noms et s’appuie davantage sur les avis, les annuaires et les réponses directement citables que sur une position dans une liste de résultats.",
        },
      ],
      date: "2026-10-30",
    },
    {
      slug: "sites-que-lia-consulte-sur-votre-entreprise",
      title: "Les sites que l’IA consulte sur votre entreprise",
      description:
        "Fiche Google, PagesJaunes, Doctolib, Planity, Trustpilot, annuaires des ordres : les sources que lisent les IA en France, et comment corriger chacune.",
      h1: "Les sites que ChatGPT et les autres IA lisent sur votre entreprise, et comment corriger chacun",
      answer:
        "En France, ChatGPT, Gemini, Claude et Perplexity s’appuient surtout sur la fiche d’établissement Google, PagesJaunes, les plateformes de réservation et d’avis comme Doctolib, Planity, Trustpilot ou Avis Vérifiés, les annuaires officiels des ordres professionnels et votre propre site. Plus ces informations sont cohérentes et à jour, plus l’IA a de chances de vous citer.",
      takeaways: [
        "L’IA croit ce que plusieurs sources disent de la même façon ; une contradiction coûte de la confiance.",
        "Revendiquez vos fiches au lieu de laisser des données générées automatiquement.",
        "Chaque métier a sa plateforme clé : Doctolib pour la santé, Planity pour la beauté, l’annuaire de l’ordre pour les professions réglementées.",
        "Une fiche avec un ancien numéro fait plus de tort que pas de fiche du tout.",
      ],
      sections: [
        {
          h2: "Comment une IA se renseigne sur une entreprise",
          paragraphs: [
            "Un patient à Bordeaux demande à Perplexity un dentiste ouvert le samedi matin. L’IA cite un cabinet et affiche en source sa page Doctolib et sa fiche Google. Votre cabinet ouvre aussi le samedi, mais votre fiche PagesJaunes affiche encore les horaires d’il y a deux ans. La recommandation part chez le confrère. Ce genre de situation tient presque toujours à quelques fiches précises, et ce sont ces fiches que ce guide passe en revue.",
            "Quand quelqu’un demande « Quel électricien à Strasbourg a de bons avis ? », les assistants qui font une recherche web s’appuient sur des résultats récents : Gemini sur Google, les autres sur différents index, dont celui de Bing. S’y ajoute ce que les modèles ont appris pendant leur entraînement. L’IA résume ensuite quelles entreprises reviennent dans plusieurs sources, avec des avis positifs et des informations qui concordent.",
            "Conclusion : être bien noté sur une seule plateforme ne suffit pas. L’IA cherche des confirmations sur plusieurs sites indépendants. Avant de passer en revue les sources qui comptent en France, faites un exercice simple : rédigez une fiche de référence avec le nom exact, l’adresse, le téléphone, le site, l’e-mail, les horaires, l’activité et une description de deux phrases. C’est ce texte que vous recopierez partout, sans variation.",
          ],
        },
        {
          h2: "La fiche d’établissement Google : la base",
          paragraphs: [
            "Si vous ne faites qu’une chose, faites celle-ci. Connectez-vous sur business.google.com, revendiquez votre fiche et faites-la valider si ce n’est pas déjà fait.",
          ],
          bullets: [
            "Catégorie principale précise, plus deux à quatre catégories secondaires pertinentes.",
            "Prestations listées une par une, décrites avec les mots de vos clients.",
            "Horaires, horaires exceptionnels et lien de prise de rendez-vous à jour.",
            "Une réponse à chaque avis, polie et sans information confidentielle.",
            "Contrôle régulier des modifications suggérées par les internautes, que Google applique parfois automatiquement.",
          ],
        },
        {
          h2: "PagesJaunes et les registres officiels",
          paragraphs: [
            "PagesJaunes reste l’annuaire de référence des professionnels en France. Il est bien référencé et apparaît souvent dans les recherches locales, donc l’IA le lit. Le problème : beaucoup de fiches ont été créées automatiquement et ne sont jamais mises à jour. Cherchez votre entreprise, revendiquez la fiche via l’espace professionnel et corrigez nom, adresse, téléphone, horaires et activités. La fiche gratuite suffit en général ; une offre payante n’est pas nécessaire pour être lu par l’IA.",
            "Vérifiez aussi les sources publiques qui reprennent vos données légales : l’Annuaire des Entreprises de l’État, ainsi que des sites comme Societe.com ou Pappers, qui republient les informations du registre. Si votre adresse de siège ou votre activité ont changé, la mise à jour passe par une formalité auprès du guichet unique des formalités d’entreprises. Une adresse de siège différente de votre adresse d’accueil n’est pas un problème, à condition que votre site indique clairement où vous recevez les clients.",
          ],
        },
        {
          h2: "Doctolib et l’annuaire santé pour les professionnels de santé",
          paragraphs: [
            "Pour un médecin, un dentiste, un kiné ou un ostéopathe, Doctolib indique à l’IA que vous êtes réservable en ligne et que vous acceptez de nouveaux patients. Soignez la présentation : spécialités, actes pratiqués, langues parlées, accès, informations sur le conventionnement et l’accessibilité. À la question « Quel dentiste à Lyon prend encore de nouveaux patients ? », l’IA cite volontiers des cabinets dont les créneaux sont visibles.",
            "Contrôlez aussi les annuaires officiels : l’annuaire santé d’Ameli et l’annuaire de votre ordre (médecins, chirurgiens-dentistes, masseurs-kinésithérapeutes). Ils confirment votre inscription et votre lieu d’exercice. Tout contenu doit rester informatif, dans le respect de votre code de déontologie : pas de promesse de résultat ni de démarche commerciale.",
          ],
        },
        {
          h2: "Planity pour la beauté et le bien-être",
          paragraphs: [
            "Pour les coiffeurs, barbiers, instituts de beauté et spas, Planity est l’une des plateformes de réservation les plus utilisées en France. Les fiches y détaillent les prestations, les durées, les tarifs et les avis liés à une vraie réservation, autant d’éléments concrets que l’IA peut reprendre quand on lui demande « un bon salon pour un balayage à Bordeaux ».",
            "Rédigez une description claire de votre établissement, nommez vos prestations comme vos clientes les cherchent (« soin du visage hydratant » plutôt qu’un nom de protocole maison), ajoutez des photos récentes et répondez aux avis. Si vous utilisez un autre outil de réservation, appliquez la même logique : fiche complète, prestations nommées simplement, coordonnées identiques à votre fiche Google.",
          ],
        },
        {
          h2: "Trustpilot, Avis Vérifiés et la règle des avis",
          paragraphs: [
            "Trustpilot est surtout lu pour les entreprises qui vendent en ligne ou sur une grande zone, mais il apparaît aussi pour certains services locaux. Avis Vérifiés (Skeepers) est courant chez les commerçants et les réseaux, car il collecte les avis après un achat réel. Choisissez la plateforme utilisée dans votre secteur plutôt que d’ouvrir partout des profils à moitié vides.",
            "En France, le code de la consommation impose aux sites d’avis d’indiquer s’ils vérifient les avis et comment. Faux avis, avis rémunérés ou suppression sélective des avis négatifs sont à proscrire : ils enfreignent les règles des plateformes et exposent à des sanctions pour pratique commerciale trompeuse. Invitez vos clients via les outils officiels de la plateforme, sans contrepartie.",
          ],
        },
        {
          h2: "Annuaires des ordres, labels et votre propre site",
          paragraphs: [
            "Pour les professions réglementées, l’annuaire de l’ordre est une source que l’IA considère comme fiable. Les avocats vérifieront leur fiche dans l’annuaire du Conseil national des barreaux et celui de leur barreau, avec leurs spécialisations certifiées. Les architectes, experts-comptables et notaires ont leurs propres annuaires officiels. Pour les artisans du bâtiment, l’annuaire France Rénov’ des professionnels RGE et les fiches Qualibat ou Qualit’EnR confirment vos qualifications, et les clients le demandent souvent explicitement à l’IA.",
            "Sur votre site, faites le lien : indiquez vos qualifications, votre numéro d’inscription si votre profession l’exige, et renvoyez vers vos fiches officielles. L’IA peut ainsi rattacher sans doute possible ces mentions à votre entreprise.",
          ],
          bullets: [
            "Une page par prestation, qui commence par une réponse directe.",
            "Votre zone d’intervention en toutes lettres : quartiers et communes voisines.",
            "Une FAQ avec les vraies questions de vos clients.",
            "Des liens vers votre fiche Google, PagesJaunes, Doctolib ou Planity et vos annuaires officiels.",
          ],
        },
        {
          h2: "Comment les clients posent la question, et ce que l’IA lit ensuite",
          paragraphs: [
            "Il est utile de mettre côte à côte les questions typiques de votre métier et les sources que l’IA consulte pour y répondre. Trois exemples, formulés comme les gens les posent vraiment en France. Vous verrez que l’IA s’appuie rarement sur une seule source : elle croise avis, annuaires et votre site pour se faire une idée d’ensemble, et chaque trou dans ce tableau est une raison de citer quelqu’un d’autre.",
          ],
          bullets: [
            "« Quel électricien à Marseille peut installer une borne de recharge rapidement ? » L’IA lit en général les fiches Google, les avis qui mentionnent une borne, l’annuaire des installateurs qualifiés IRVE et les pages de prestations qui citent à la fois la borne et la ville.",
            "« Je cherche un médecin généraliste à Nantes qui accepte de nouveaux patients. » Ici se combinent Doctolib, l’annuaire santé d’Ameli et un site de cabinet qui écrit simplement « Nous acceptons de nouveaux patients ».",
            "« Il me faut un avocat en droit routier à Toulouse, l’assurance de l’autre conducteur ne veut pas payer. » Comptent alors l’annuaire du Conseil national des barreaux, celui du barreau de Toulouse et une page du cabinet qui explique en mots simples comment se déroule une indemnisation après un accident.",
          ],
        },
        {
          h2: "La liste de contrôle par plateforme, et les erreurs à éviter",
          paragraphs: [
            "Faites l’exercice pour votre entreprise : trois questions de clients et, à côté, les sources que l’IA affiche dans sa réponse. Là où vos concurrents apparaissent et pas vous se trouve votre prochaine tâche. Souvent, il manque une seule phrase : si une patiente demande un médecin qui « accepte de nouveaux patients » et que cette phrase n’apparaît nulle part, l’IA ne peut pas la trouver.",
            "Les erreurs les plus courantes n’ont rien de spectaculaire. Un nom de fiche Google du type « Peinture Martin SARL peintre pas cher Lille », parce que quelqu’un y a ajouté des mots-clés ; c’est contraire aux règles de Google et ne correspond à aucune autre fiche. Un cabinet qui existe sous deux noms après une reprise. Des fiches créées par une agence, sans que l’entreprise ait les identifiants. Des plateformes d’avis où personne n’a répondu depuis deux ans. Chacun de ces points se corrige souvent en une heure, à condition de le connaître.",
            "Prévoyez un quart d’heure par plateforme et cochez ces points :",
          ],
          bullets: [
            "Fiche d’établissement Google : nom sans mots-clés ajoutés, catégorie principale juste, horaires y compris jours fériés, chaque prestation listée, tous les avis des trois derniers mois avec une réponse.",
            "PagesJaunes : fiche revendiquée, numéro à jour, site lié, aucun doublon à une ancienne adresse.",
            "Bing Places et Apple Business Connect : fiche présente, informations identiques à Google, bonne catégorie.",
            "Doctolib ou annuaire santé : spécialités, horaires, langues, mention des nouveaux patients, photo récente.",
            "Planity ou votre outil de réservation : prestations nommées comme les clients les cherchent, durées et tarifs, photos récentes.",
            "Annuaire de l’ordre, RGE ou Qualibat : inscription à jour, adresse d’exercice exacte, qualifications en cours de validité.",
            "Trustpilot ou Avis Vérifiés, si vous les utilisez : même nom d’entreprise, invitations via l’outil officiel uniquement, réponses aux avis critiques.",
            "Votre site : mentions légales avec les mêmes coordonnées, liens vers toutes vos fiches, une page par prestation.",
          ],
        },
        {
          h2: "Un plan simple sur quatre semaines",
          paragraphs: [
            "Semaine 1 : rédiger la fiche de référence, compléter la fiche d’établissement Google. Semaine 2 : corriger PagesJaunes, Bing Places, Apple Business Connect et vérifier l’Annuaire des Entreprises. Semaine 3 : mettre à jour la plateforme clé de votre métier et l’annuaire de votre ordre ou de votre label, puis demander un avis à dix clients satisfaits. Semaine 4 : compléter les pages de prestations et la FAQ, puis reposer vos questions aux IA.",
            "Après ces quatre semaines, un rendez-vous fixe par mois suffit, par exemple le premier lundi. Vérifiez les modifications suggérées sur votre fiche Google, répondez aux nouveaux avis, reposez vos trois questions aux IA et comparez les sources citées avec le mois précédent. En cas de déménagement, de nouveau numéro ou de changement d’horaires, reprenez la liste de contrôle tout de suite, sans attendre le rendez-vous suivant.",
            "Pour savoir quelles sources l’IA utilise réellement pour votre entreprise, vous pouvez lancer la vérification gratuite sur alphaa.app/fr : elle interroge ChatGPT, Gemini, Claude et Perplexity en français et montre qui est cité à votre place.",
          ],
        },
      ],
      faq: [
        {
          q: "Faut-il payer une offre PagesJaunes pour être cité par l’IA ?",
          a: "Non. Ce qui compte pour l’IA, c’est que les informations soient exactes et identiques partout. Une fiche gratuite, revendiquée et complète suffit dans la plupart des cas.",
        },
        {
          q: "Que faire d’une ancienne fiche avec mon ancienne adresse ?",
          a: "Revendiquez-la et corrigez-la, ou demandez sa suppression à la plateforme. Les doublons et fiches périmées brouillent l’IA et ne doivent pas rester en ligne.",
        },
        {
          q: "Peut-on faire supprimer un avis négatif ?",
          a: "Seulement s’il enfreint les règles de la plateforme ou contient des propos diffamatoires ou mensongers. Sinon, une réponse calme et factuelle est la meilleure option : l’IA lit aussi votre réponse.",
        },
        {
          q: "Sur combien de plateformes faut-il être présent ?",
          a: "La fiche Google, PagesJaunes, une ou deux plateformes de votre métier et l’annuaire officiel de votre profession suffisent pour la plupart des entreprises. Mieux vaut peu de fiches bien tenues que beaucoup à moitié vides.",
        },
        {
          q: "Comment savoir quelles sources l’IA utilise pour mon entreprise ?",
          a: "Posez à Perplexity ou à ChatGPT avec recherche web une question typique de client, avec la ville, et regardez les sources affichées sous la réponse. Recommencez avec deux ou trois autres questions ; les sites qui reviennent plusieurs fois sont ceux à corriger en premier.",
        },
      ],
      date: "2026-10-30",
    },
  ],
}
