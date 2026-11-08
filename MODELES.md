# Bibliothèque de modèles NovaGen

Pages de référence de Sylvain, reproduites dans `public/modeles.js` (registre `MODELES`) et choisies automatiquement selon les données de la fiche. Choix manuel : sélecteur de style par page (5 = Signature, 6 = Vitrine pour Point Info). Ajouter un modèle = une entrée dans `MODELES` + une fonction page.

| Page | Modèle | Référence | Choisi quand |
|---|---|---|---|
| Intro | Cinéma : Ken Burns, logo 3D + reflet + anneaux, titre lettre par lettre, iris NovaTour conservé | https://gaiacuisine.vercel.app/ | restaurant/commerce avec photo |
| Point Info | Fiche : cartes à icônes, jour courant en gras, avis Google, grande carte + Maps/Waze/Plans | https://miozavercel3dvista.vercel.app/ | par défaut (1 établissement sur 2) |
| Point Info | Vitrine : hero, note Google, pills sticky, sections sombres | https://gaia-infos.vercel.app/ | 2 photos ou plus (1 sur 2) |
| Carte | Éditoriale : photo + liste, pointillés, 🌿 végé, pied de page | https://miozacarte.vercel.app/ | restaurant avec photos |
| Vidéo | Cadre téléphone, son / pause / rejouer, progression multi-vidéos | https://flambadou-gaia.vercel.app/ | au moins une vidéo ajoutée |

Syntaxe carte : `# Catégorie | sous-titre | 2` (le 2 = n° de photo, facultatif) ; `Plat 🌿 | prix | description` (🌿 ou `(végé)` = végétarien).
Champs fiche ajoutés : `avis` (note Google), `videoSur`, `videoTitre`, `videoTexte`.
Vidéos : stockées sur l'ordinateur (non synchronisées), ~3 Mo max par fichier pour « Déployer » ; au-delà, ZIP à déposer sur Vercel.

## Boutons glossy — style « bille de verre » (validé le 8 nov.)
Prompt : Bouton rond glossy en verre : sphère très sombre (couleur de marque assombrie à 55 %) avec lueur douce au centre-haut, calotte de verre translucide sur la moitié haute (dégradé blanc 75 % vers transparent), petit éclat blanc ovale incliné en haut à gauche, fin liseré sable/doré, ombre ovale diffuse sous la bille, icône pictogramme à trait épais arrondi couleur crème.
États : normal (icône crème) · survol (icône couleur d'accent chaude) · pressé (bille claire crème, liseré et icône foncés, reflet atténué, légère réduction).
Implémenté dans `public/gen.js` (`btnPalette`, `btnSvg`, constante `BTN_STYLE_PROMPT`) : s'applique aux aperçus, à la simulation de barre et aux PNG exportés (256 et 128 px).
