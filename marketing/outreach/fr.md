# France : séquence e-mail à froid à partir du check (français)

4 e-mails, texte brut, une seule demande par e-mail. Corps : 100 à 130 mots (hors pied de page). Lire `README.md` d'abord.

**Qui on peut contacter (art. L34-5 CPCE, CNIL) :** une adresse professionnelle (nominative ou générique type contact@), quand l'offre concerne l'activité professionnelle du destinataire. Le titulaire du cabinet, le gérant, l'artisan : oui. Une adresse personnelle (Gmail, Orange, Free) d'un artisan : non, on saute. Pas de pixel de suivi (consentement requis selon la CNIL). Désinscription simple et gratuite dans chaque e-mail. Mention de la source de l'adresse (RGPD art. 14) dans le pied de page.

Prix : 99 € / 199 € / 299 € HT par mois. Le check interroge les IA en français ; la page du rapport est en anglais pour l'instant (à dire, comme sur alphaa.app/fr).

## Champs de fusion

| Champ | Source |
|---|---|
| `{{prenom}}` / `{{civilite_nom}}` | Liste de prospects. On écrit « Bonjour {{civilite_nom}}, » (ex. « Bonjour Docteur Martin, », « Bonjour Monsieur Petit, »). Vide : « Bonjour, » |
| `{{business_name}}` | `ScanLead.businessName`, sinon le domaine de `ScanLead.businessUrl` |
| `{{clients}}` | Liste : patients / clients |
| `{{question}}` | `ScanLead.engineResponses.<moteur>.query` (en français, telle que posée) ; sinon `ogData.insights.query` |
| `{{answered_count}}`, `{{missed_count}}`, `{{missed_engines}}` | `ScanLead.engineResponses` (voir `README.md`) |
| `{{rival_1}}`, `{{rival_engine}}` | `engineResponses.<moteur manqué>.mentioned`, hors l'entreprise elle-même, le plus cité d'abord |
| `{{broad_question}}`, `{{broad_missed_count}}`, `{{broad_answered_count}}`, `{{broad_rival_1}}` | `ogData.questions[1]` (segment C) |
| `{{score}}` | `ScanLead.visibilityScore` (on saute si `ogData.auditFallback` est vrai) |
| `{{gap_1}}`, `{{gap_2}}` | `ogData.siteChecks.you.checks[]` avec `ok === false`, `CHECK_IMPACT` le plus fort d'abord, via le tableau ci-dessous |
| `{{gap_rival_domain}}` | `ogData.siteChecks.competitors[].domain` qui passe ce même contrôle |
| `{{scan_date}}` | `ScanLead.createdAt`, écrit « 30 octobre » |
| `{{scan_url}}` | `https://alphaa.app/scan/results?id=` + `ScanLead.id` |
| `{{source_url}}` | Liste : page où l'adresse est publiée |
| `{{sender_name}}`, `{{sender_email}}`, `{{unsubscribe_link}}` | Outil d'envoi |

### Tableau des manques (clé → `{{gap_1}}`)

| Clé | Texte |
|---|---|
| aibots | Votre site ferme la porte aux assistants IA |
| robots | Un réglage de votre site demande aux IA de ne pas le lire |
| indexable | Votre page d'accueil demande à Google de ne pas l'afficher |
| render | L'IA voit une page vide : vos textes n'apparaissent qu'après un code supplémentaire |
| canonical | Vos pages indiquent à Google qu'une autre page est la bonne |
| https | Votre site répond à plusieurs adresses, ou n'est pas entièrement sécurisé |
| bing | Rien n'indique que votre site est déclaré sur Bing, dont dépend la recherche de ChatGPT |
| llms | Aucun résumé de votre activité écrit pour les assistants IA |
| sitemap | Aucune liste de vos pages pour Google et les IA |
| speed | Votre site est lent à charger |
| schema | Les informations de votre entreprise ne sont pas dans le code invisible que lisent les IA |
| schemaFacts | Ce code invisible ne contient pas votre adresse, votre téléphone ou vos horaires |
| facts | L'IA n'a trouvé ni téléphone, ni adresse, ni horaires sur la page |
| local | Votre site ne dit pas clairement dans quelle ville vous travaillez |
| meta | Le titre de votre page et son résumé Google ne disent pas clairement ce que vous faites |
| headings | Votre page d'accueil n'a pas de titre principal clair |
| depth | Il y a trop peu de texte sur la page pour que l'IA puisse vous citer |
| pages | Vous n'avez pas une page par prestation |
| faq | Aucune réponse publiée aux questions que posent vos clients |
| reviews | Vos avis ne sont pas sur votre site sous forme de texte lisible par l'IA |
| profiles | Votre site ne renvoie pas vers votre fiche Google, PagesJaunes ou vos réseaux |
| about | Aucune page « À propos » qui dit qui vous êtes |
| blog | Rien de nouveau publié récemment |

## Pied de page (chaque e-mail)

```
{{sender_name}}, Alphaa
9629033 Canada Inc., 1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada
alphaa.app | {{sender_email}}
J'ai trouvé votre adresse professionnelle sur {{source_url}} et je vous écris parce que cela concerne la façon dont on trouve {{business_name}}. Vos données et vos droits : alphaa.app/privacy. Pour ne plus recevoir mes messages, répondez « stop » ou cliquez ici : {{unsubscribe_link}}
```

---

## E-mail 1 (J0)

**Objet :** A : `{{rival_engine}} cite {{rival_1}}, pas {{business_name}}` / B : `{{business_name}} absent de la réponse` / C : `{{business_name}} et la question plus large`

```
Bonjour {{civilite_nom}},

Avant de vous écrire, j'ai posé à ChatGPT, Gemini, Claude et Perplexity la question que posent vos {{clients}} :

« {{question}} »

[A] {{missed_count}} des {{answered_count}} IA qui ont répondu n'ont pas cité {{business_name}}. {{rival_engine}} a cité {{rival_1}} à la place.
[B] {{missed_engines}} ont répondu sans jamais mentionner {{business_name}}.
[C] Les {{answered_count}} vous ont cité. Très bien. Puis j'ai posé la question plus large que l'on pose d'abord, « {{broad_question}} », et {{broad_missed_count}} sur {{broad_answered_count}} vous ont laissé de côté[, en citant {{broad_rival_1}}].

Toutes les réponses mot pour mot, sans inscription (page en anglais pour l'instant) : {{scan_url}}

Votre score sur ce check : {{score}}/100. Il est mesuré, pas estimé.

Je travaille avec Alphaa, un agent IA qui découvre pourquoi l'IA cite quelqu'un d'autre, puis corrige.

Voulez-vous les deux corrections par lesquelles je commencerais ? Répondez « oui ».

{{sender_name}}
```

## E-mail 2 (J3)

**Objet :** A : `Pourquoi {{rival_1}} est cité` / B et C : `Pourquoi l'IA passe à côté de {{business_name}}`

```
Bonjour {{civilite_nom}},

Voici la partie du check que je ne vous ai pas envoyée : le pourquoi.

En lisant le site de {{business_name}} comme le fait un assistant IA, deux points ressortent :

1. {{gap_1}}.[ {{gap_rival_domain}}, lui, l'a.]
2. {{gap_2}}.

L'IA cite les entreprises qu'elle peut vérifier. Si elle ne trouve ni vos horaires, ni votre ville, ni une réponse claire à la question posée, elle choisit quelqu'un d'autre.

Rien de compliqué. Il faut simplement le faire, puis l'entretenir chaque semaine.

Je vous envoie le texte exact de la correction n° 1, pour que vous ou votre prestataire web puissiez la faire cette semaine ?

{{sender_name}}
```

**Repli (aucun contrôle échoué) :** remplacer le bloc numéroté par : `Votre site passe les contrôles que j'ai faits. L'écart n'est donc pas sur votre site, mais sur les pages sur lesquelles ces IA se sont appuyées pour répondre : annuaires comme PagesJaunes, sites d'avis, pages qui répondent exactement à la question.` Demande : `Je vous envoie la liste de ces pages ?`

## E-mail 3 (J7)

**Objet :** `99 € HT par mois, et si ça ne marche pas`

```
Bonjour {{civilite_nom}},

Le coût, en clair.

Alphaa coûte 99 € HT par mois. Un seul nouveau {{client_singulier}} vaut souvent plus qu'une année entière d'Alphaa (1 188 €).

Pour ce prix, l'agent IA pose chaque semaine aux quatre IA les questions de vos {{clients}}, rédige les pages et les réponses qu'elles citent, fait vivre votre fiche Google et vous dit simplement ce qu'il a fait. Rien n'est publié sans votre accord.

Si aucune IA ne vous cite sous 90 jours, le mois suivant vous est offert. Sans engagement, remboursé sous 7 jours sur le premier paiement.

Faire recommander {{business_name}} par ChatGPT : https://alphaa.app/fr

{{sender_name}}
```

`{{client_singulier}}` : liste (patient / client / chantier). Pour les artisans : « Un seul nouveau chantier ».

## E-mail 4 (J12)

**Objet :** `Les réponses de l'IA changent. Voulez-vous savoir quand ?`

```
Bonjour {{civilite_nom}},

Dernier message de ma part.

Les réponses des IA bougent d'une semaine à l'autre, au fil des pages publiées et des avis reçus. Ce que les quatre IA disaient de {{business_name}} le {{scan_date}} ne restera pas figé, dans un sens comme dans l'autre.

Une option simple : répondez « check » et dans 30 jours je repose la même question, « {{question}} », puis je vous envoie uniquement ce qui a changé. Si {{business_name}} commence à être cité, vous le verrez. Si un concurrent passe devant, aussi.

Votre rapport reste en ligne : {{scan_url}}

Si c'est non, inutile de répondre. Vous n'aurez plus de nouvelles de moi.

{{sender_name}}
```
