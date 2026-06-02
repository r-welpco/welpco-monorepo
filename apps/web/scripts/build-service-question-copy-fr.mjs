/**
 * Builds messages/service-question-copy.fr.json from BFF seed English strings.
 * Re-run when seed copy changes: node apps/web/scripts/build-service-question-copy-fr.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** English → Canadian French (BFF CMS questions; keyed by exact EN string). */
const FR = {
  // —— labels ——
  "How many children": "Combien d'enfants",
  "Age of each child": "Âge de chaque enfant",
  "Age of the person": "Âge de la personne",
  Gender: "Genre",
  "What is the special need?": "Quel est le besoin particulier?",
  "How many dogs?": "Combien de chiens?",
  "Size of each dog": "Taille de chaque chien",
  "Type of pet?": "Type d'animal?",
  "Approximate size of Terrarium": "Taille approximative du terrarium",
  "How many pets?": "Combien d'animaux?",
  "Types of pets": "Types d'animaux",
  "Size of the pet": "Taille de l'animal",
  "Duration or number of hours": "Durée ou nombre d'heures",
  "In-person or online?": "En personne ou en ligne?",
  "Student grade/level": "Niveau scolaire de l'élève",
  "Which instrument?": "Quel instrument?",
  "Student level": "Niveau de l'élève",
  "Number of participants": "Nombre de participants",
  Age: "Âge",
  "Current level": "Niveau actuel",
  "Number of rooms": "Nombre de pièces",
  "Number of bathrooms": "Nombre de salles de bain",
  "Are there pets in your space?": "Y a-t-il des animaux chez vous?",
  "How would you describe your space?": "Comment décririez-vous votre espace?",
  "Which area needs organizing?": "Quelle zone doit être organisée?",
  "Approximate yard size": "Taille approximative du terrain",
  "Which area?": "Quelle zone?",
  "How many trees need to be planted?": "Combien d'arbres à planter?",
  "Is digging required?": "Un creusage est-il requis?",
  "What type of gardening help?": "Quel type d'aide en jardinage?",
  "Approximate garden size": "Taille approximative du jardin",
  "How many vehicles need service?": "Combien de véhicules?",
  "Type of vehicle": "Type de véhicule",
  "What type of wash would you like?": "Quel type de lavage souhaitez-vous?",
  "Approximate condition of the vehicle": "État approximatif du véhicule",
  "Interior / Exterior / Both": "Intérieur / Extérieur / Les deux",
  "Number of windows": "Nombre de fenêtres",
  "What areas need cleaning?": "Quelles zones à nettoyer?",
  "Approximate size of the area": "Taille approximative de la zone",
  "Type of cleaning needed": "Type de nettoyage requis",
  "Do you require pressure washing?": "Avez-vous besoin d'un nettoyage à pression?",
  "Opening, closing or cleaning": "Ouverture, fermeture ou nettoyage",
  "Type of pool": "Type de piscine",
  "Type of seasonal preparation": "Type de préparation saisonnière",
  "What areas need preparation?": "Quelles zones à préparer?",
  "Do you need furniture moved or stored?": "Devez-vous déplacer ou entreposer des meubles?",
  "What items need assembly?": "Quels articles à assembler?",
  "Number of items": "Nombre d'articles",
  "Do you have instructions available?": "Avez-vous les instructions?",
  "What needs to be mounted?": "Quoi installer au mur?",
  "TV size (if applicable)": "Taille du téléviseur (le cas échéant)",
  "Wall type (if known)": "Type de mur (si connu)",
  "Do you already have brackets/anchors?": "Avez-vous déjà supports/ancrages?",
  "What devices need setup?": "Quels appareils à configurer?",
  "Wi-Fi already installed?": "Wi-Fi déjà installé?",
  "What needs to be repaired?": "Quoi réparer?",
  "Location in home": "Emplacement dans la maison",
  Severity: "Gravité",
  "What appliance needs installation?": "Quel appareil à installer?",
  "Move type": "Type de déménagement",
  "Pickup location": "Lieu de ramassage",
  "Drop-off location": "Lieu de livraison",
  "Number of rooms/items": "Nombre de pièces/articles",
  "Elevator available?": "Ascenseur disponible?",
  "What needs to be moved?": "Quoi déplacer?",
  "Approximate weight/size": "Poids/taille approximatif",
  "Same building": "Même immeuble",
  "Surface area": "Surface",
  "Number of items to hang": "Nombre d'articles à accrocher",
  "Type of items": "Type d'articles",
  "Do you have hooks/anchors?": "Avez-vous crochets/ancrages?",
  "Age of client": "Âge du client",
  Needs: "Besoins",
  "Date needed": "Date souhaitée",
  Time: "Heure",
  Description: "Description",
  Notes: "Remarques",
  "One time or recurring?": "Ponctuel ou récurrent?",
  "If recurring, choose": "Si récurrent, choisir",
  "Pay per hour": "Tarif horaire",
  "Who needs babysitting?": "Qui a besoin de garde?",
  "Who needs care?": "Qui a besoin de soins?",
  "Estimated Start date": "Date de début estimée",
  "Estimated End date": "Date de fin estimée",
  "How many people?": "Combien de personnes?",
  "Ages of each person": "Âge de chaque personne",
  "How many days?": "Combien de jours?",
  "How many meals per day?": "Combien de repas par jour?",
  "Is the event for": "L'événement est pour",
  "How many people are attending the event?": "Combien de personnes à l'événement?",
  "What do you need for your event?": "De quoi avez-vous besoin pour l'événement?",

  // —— placeholders ——
  "Additional details": "Détails supplémentaires",
  "e.g. 3, 7": "p. ex. 3, 7",
  "e.g. small, medium, large": "p. ex. petit, moyen, grand",
  "Dog, cat, other": "Chien, chat, autre",
  "Driveway, walkways, patio, etc.": "Entrée, trottoirs, patio, etc.",
  "Thermostat, cameras, doorbell, etc.": "Thermostat, caméras, sonnette, etc.",
  "Yard, patio, driveway, etc.": "Cour, patio, entrée, etc.",
  "Select date": "Choisir une date",
  "Select time": "Choisir une heure",
  "Choose one": "Choisir une option",
  "Select frequency": "Choisir la fréquence",
  "Enter amount": "Entrer le montant",
  "Additional notes": "Notes supplémentaires",
  "Enter number": "Entrer un nombre",
  "Enter pet type": "Type d'animal",
  "Enter size": "Entrer la taille",
  "Describe your needs": "Décrivez vos besoins",
  "Select size": "Choisir la taille",

  // —— help texts ——
  "Indicate size for each dog (small, medium, large).":
    "Indiquez la taille de chaque chien (petit, moyen, grand).",
  "Select all that apply — list each area.":
    "Cochez tout ce qui s'applique — listez chaque zone.",
  "Select all that apply — list each device.":
    "Cochez tout ce qui s'applique — listez chaque appareil.",
  "This will help your Welper bring the right tools for the job.":
    "Cela aidera votre Welper à apporter les bons outils.",
  "We'll ask about the bathrooms next.":
    "Nous demanderons les salles de bain ensuite.",

  // —— option labels ——
  Yes: "Oui",
  No: "Non",
  Male: "Homme",
  Female: "Femme",
  Other: "Autre",
  "Prefer not to say": "Préfère ne pas répondre",
  Dog: "Chien",
  Cat: "Chat",
  Beginner: "Débutant",
  Intermediate: "Intermédiaire",
  Advanced: "Avancé",
  "In-person": "En personne",
  Online: "En ligne",
  "One time": "Ponctuel",
  Recurring: "Récurrent",
  Daily: "Quotidien",
  Weekly: "Hebdomadaire",
  "Bi-weekly": "Aux deux semaines",
  None: "Aucun",
  Dogs: "Chiens",
  Cats: "Chats",
  "Dogs and cats": "Chiens et chats",
  "Regularly cleaned": "Entretien régulier",
  "Needs a deep clean": "Grand ménage requis",
  "After construction": "Après des travaux",
  "Front yard": "Cour avant",
  Backyard: "Cour arrière",
  Both: "Les deux",
  Small: "Petit",
  Medium: "Moyen",
  Large: "Grand",
  Interior: "Intérieur",
  Exterior: "Extérieur",
  "Light cleaning (dust / dirt / surface wash)":
    "Nettoyage léger (poussière / saleté / surface)",
  "Deep cleaning (stains / pressure washing)":
    "Nettoyage en profondeur (taches / pression)",
  Driveway: "Entrée de garage",
  Walkway: "Trottoir",
  Stairs: "Escaliers",
  Opening: "Ouverture",
  Closing: "Fermeture",
  Cleaning: "Nettoyage",
  "Above-ground": "Hors terre",
  "In-ground": "Creusée",
  "Summer preparation": "Préparation estivale",
  "Winter preparation": "Préparation hivernale",
  Apartment: "Appartement",
  House: "Maison",
  Office: "Bureau",
  TV: "Téléviseur",
  Shelves: "Étagères",
  Drywall: "Gypse",
  Concrete: "Béton",
  Brick: "Brique",
  "Not sure": "Je ne sais pas",
  Washer: "Laveuse",
  Dryer: "Sécheuse",
  Dishwasher: "Lave-vaisselle",
  Fridge: "Réfrigérateur",
  Stove: "Cuisinière",
  SUV: "VUS",
  Car: "Voiture",
  "Sports car": "Voiture sport",
  Truck: "Camion",
  Van: "Fourgonnette",
  "Exterior only": "Extérieur seulement",
  "Interior only": "Intérieur seulement",
  "Interior & Exterior": "Intérieur et extérieur",
  "Light cleaning": "Nettoyage léger",
  "Moderate cleaning": "Nettoyage modéré",
  "Heavy cleaning": "Nettoyage intensif",
  Light: "Léger",
  Heavy: "Lourd",
  "Minor fix": "Réparation mineure",
  Moderate: "Modéré",
  Urgent: "Urgent",
  "When do you need care?": "Quand avez-vous besoin de soins?",
  "Preferred date": "Date préférée",
  "Date and time": "Date et heure",
  "Question 1": "Question 1",
  Wall: "Mur",
  Ceiling: "Plafond",
  Trim: "Moulures",
  Frames: "Cadres",
  Mirrors: "Miroirs",
  "Art pieces": "Œuvres d'art",
  Adults: "Adultes",
  Children: "Enfants",
  Family: "Famille",
  "Build muscle": "Prise de muscle",
  "Lose weight": "Perte de poids",
  Coaching: "Encadrement",
};

function extractFromFile(filePath) {
  const s = fs.readFileSync(filePath, "utf8");
  const labels = new Set();
  const placeholders = new Set();
  const helpTexts = new Set();
  const optionLabels = new Set();

  for (const m of s.matchAll(/^\s+label:\s*['"]([^'"]+)['"],?\s*$/gm)) labels.add(m[1]);
  for (const m of s.matchAll(/placeholder:\s*['"]([^'"]+)['"]/g)) placeholders.add(m[1]);
  for (const m of s.matchAll(/helpText:\s*(['"])([\s\S]*?)\1/g)) helpTexts.add(m[2]);
  for (const m of s.matchAll(/\{\s*value:\s*['"][^'"]+['"],\s*label:\s*['"]([^'"]+)['"]\s*\}/g)) {
    optionLabels.add(m[1]);
  }

  return { labels, placeholders, helpTexts, optionLabels };
}

const seedFiles = [
  path.join(root, "../bff/src/database/seeds/service-selection-question-definitions.ts"),
  path.join(root, "../bff/src/database/seeds/seed-content.ts"),
];

const merged = {
  labels: new Set(),
  placeholders: new Set(),
  helpTexts: new Set(),
  optionLabels: new Set(),
};

for (const f of seedFiles) {
  const e = extractFromFile(f);
  e.labels.forEach((x) => merged.labels.add(x));
  e.placeholders.forEach((x) => merged.placeholders.add(x));
  e.helpTexts.forEach((x) => merged.helpTexts.add(x));
  e.optionLabels.forEach((x) => merged.optionLabels.add(x));
}

function buildMap(set, bucket) {
  const out = {};
  const missing = [];
  for (const en of [...set].sort()) {
    const fr = FR[en];
    if (!fr) {
      missing.push(en);
      out[en] = en;
    } else {
      out[en] = fr;
    }
  }
  if (missing.length) {
    console.warn(`[${bucket}] missing FR for ${missing.length}:`, missing.join(" | "));
  }
  return out;
}

const output = {
  labels: buildMap(merged.labels, "labels"),
  placeholders: buildMap(merged.placeholders, "placeholders"),
  helpTexts: buildMap(merged.helpTexts, "helpTexts"),
  optionLabels: buildMap(merged.optionLabels, "optionLabels"),
};

/** E2E/unit-test mock questions (not in production seeds). */
const EXTRA_COPY = {
  labels: ["When do you need care?", "Preferred date", "Question 1"],
  placeholders: ["Date and time"],
};
for (const [bucket, keys] of Object.entries(EXTRA_COPY)) {
  for (const en of keys) {
    if (FR[en]) output[bucket][en] = FR[en];
  }
}

const outPath = path.join(root, "messages/service-question-copy.fr.json");
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
console.log("Wrote", outPath);
