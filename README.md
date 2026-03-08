# lbc_client

Client TypeScript pour interagir avec les endpoints Leboncoin utilises dans ce projet.

## Provenance

Ce dossier a ete copie et adapte avec Claude a partir du projet suivant :

- https://github.com/etienne-hd/lbc/tree/main

Le code a ensuite ete ajuste pour fonctionner dans ce depot avec Bun, CycleTLS et une resolution manuelle du captcha DataDome si necessaire.

## Fonctionnalites

- recherche d'annonces via arguments structures ou via une URL Leboncoin
- recuperation d'une annonce par son identifiant
- recuperation d'un utilisateur par son identifiant
- support optionnel d'un proxy
- contournement de certains blocages DataDome via ouverture d'un navigateur

## Installation

Il n'y a pas de package separé dans ce dossier : les dependances sont declarees dans le `package.json` a la racine du workspace.

Depuis la racine du projet :

```bash
bun install
```

Dependances principales utilisees par ce client :

- `cycletls`
- `puppeteer-real-browser`
- `typescript`

## Utilisation rapide

```ts
import {
  Client,
  Category,
  Sort,
  Region,
} from "./lbc_client";

async function main() {
  const client = await new Client().init();

  try {
    const results = await client.search({
      text: "velo",
      category: Category.VEHICULES_VELOS,
      sort: Sort.NEWEST,
      locations: {
        type: "region",
        value: Region.ILE_DE_FRANCE,
      },
      limit: 10,
    });

    console.log(results.ads[0]);
  } finally {
    await client.exit();
  }
}

main();
```

## API exposee

### `new Client(options?)`

Options disponibles :

- `proxy`: proxy optionnel
- `timeout`: timeout des requetes
- `maxRetries`: nombre maximum de retries en cas de blocage ou d'echec

### `await client.init()`

Initialise CycleTLS et tente d'etablir une session valide. Si DataDome bloque la requete, un navigateur peut etre ouvert pour resoudre le captcha manuellement.

### `await client.search(options)`

Recherche des annonces.

Options principales :

- `url`: URL complete de recherche Leboncoin
- `text`: texte libre
- `category`: categorie issue de `Category`
- `sort`: tri issu de `Sort`
- `locations`: region, departement ou ville
- `page`, `limit`, `limitAlu`
- `adType`, `ownerType`
- `shippable`
- `searchInTitleOnly`
- `extras`: filtres additionnels sous forme d'objets

### `await client.getAd(adId)`

Retourne une annonce normalisee.

### `await client.getUser(userId)`

Retourne un utilisateur normalise. Pour les comptes professionnels, le client tente aussi de recuperer les informations de boutique quand elles existent.

### `await client.exit()`

Ferme proprement la session CycleTLS.

## Recherche par URL

Le client peut reconstruire une requete API directement depuis une URL Leboncoin :

```ts
const results = await client.search({
  url: "https://www.leboncoin.fr/recherche?category=9&text=maison&locations=d_75",
});
```

## Tests

Depuis la racine du projet :

```bash
bun lbc_client/test.ts
```

Pour activer les tests reseau :

```bash
bun lbc_client/test.ts --integration
```

## Limites et remarques

- les requetes peuvent etre bloquees par DataDome
- un proxy de bonne qualite peut etre necessaire
- en cas de captcha, le navigateur s'ouvre et l'utilisateur doit valider manuellement puis appuyer sur Entree dans le terminal
- ce dossier n'est pas publie comme package npm autonome dans l'etat actuel