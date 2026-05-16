/**
 * One-off generator for marketing i18n message files.
 * Run: node scripts/generate-marketing-messages.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const en = {
  marketing: {
    a11y: {
      skipToContent: "Skip to main content",
      siteFooter: "Site footer",
      primaryNav: "Primary",
      mobileNav: "Mobile menu",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      home: "Welpco — home",
      comingSoon: "Coming soon",
    },
    languageSwitcher: {
      en: "EN",
      fr: "FR",
      english: "English",
      french: "Français",
    },
    nav: {
      home: "Home",
      about: "About",
      howItWorks: "How it works",
      faq: "FAQ",
      contact: "Contact",
      signIn: "Sign in",
      findHelp: "Find help",
    },
    footer: {
      tagline:
        "A local-services marketplace. Vetted providers, escrow payments, on-platform messaging.",
      cols: {
        welpco: "Welpco",
        customers: "For customers",
        welpers: "For Welpers",
        support: "Support",
      },
      links: {
        aboutUs: "About us",
        ourMission: "Our mission",
        findWelper: "Find a Welper",
        categories: "Categories",
        howItWorks: "How it works",
        trustSafety: "Trust & safety",
        welperHandbook: "Welper handbook",
        weeklyPayouts: "Weekly payouts (Friday)",
        community: "Community",
        faq: "FAQ",
        contactUs: "Contact us",
      },
      copyright: "© 2026 Welpco — Built for community",
      terms: "Terms",
      privacy: "Privacy",
      cookies: "Cookies",
    },
    home: {
      hero: {
        line1: "Local help.",
        line2: "Real neighbours.",
        subhead:
          "Connect with trusted Welpers in your community — childcare, lawn care, tutoring, tech help, and more.",
        findHelp: "Find help",
        becomeWelper: "Become a Welper",
      },
      categories: {
        eyebrow: "Categories",
        titleLine1: "Eight categories.",
        titleLine2: "Hundreds of services.",
        subtitle: "Examples of services Welpers offer within each category.",
        hideServices: "Hide services in {name}",
        showServices: "Show {count} services in {name}",
        items: {
          care: {
            name: "Care",
            services: ["Babysitter", "Child care", "Elderly care", "Special needs"],
          },
          pet: {
            name: "Pet care",
            services: [
              "Dog walks",
              "Pet grooming",
              "Pet sitting",
              "Aquarium and terrarium cleaning/maintenance",
              "Dog training",
            ],
          },
          learning: {
            name: "Learning & Lessons",
            services: ["Tutoring", "Music lessons", "Cooking lessons", "Swimming lessons"],
          },
          exterior: {
            name: "Exterior maintenance",
            services: [
              "Lawn-mowing",
              "Tree-planting",
              "Gardening",
              "Car washing",
              "Gutter cleaning",
              "Window cleaning",
              "Exterior property cleaning",
              "Snow removal",
              "Pool opening/closing",
              "Leaf cleanup",
              "Summer/winter preparation",
            ],
          },
          health: {
            name: "Health and wellness",
            services: ["Meal preparation", "Personal trainer", "Wellness support", "Nutritionist"],
          },
          events: {
            name: "Events & Hospitality",
            services: ["Catering help", "Bartending", "Serving", "Party assistance", "Entertainer"],
          },
          cleaning: {
            name: "Home Cleaning",
            services: [
              "Housekeeping",
              "Deep cleaning",
              "Organizing",
              "Laundry",
              "Move-in/move-out cleaning",
            ],
          },
          homeHelp: {
            name: "Home Help",
            services: [
              "Furniture assembly",
              "TV & shelf mounting",
              "Smart home setup",
              "Small repairs",
              "Appliance installation",
              "Moving help",
              "Heavy lifting",
              "Home organization",
              "Painting touch-ups",
              "Picture hanging",
            ],
          },
        },
      },
      howItWorks: {
        eyebrow: "How it works",
        titleLine1: "Three steps.",
        titleLine2: "No friction.",
        subtitle:
          "Whether you're booking a service or providing one, getting started takes minutes.",
        tabCustomer: "I need help",
        tabWelper: "I want to Welp",
        customerSteps: [
          {
            n: "01",
            title: "Search nearby",
            body: "Enter the service you need and your zip code. Browse vetted Welpers in your area in seconds.",
          },
          {
            n: "02",
            title: "Book & schedule",
            body: "Pick a Welper, set a time, and confirm. Pay securely — funds are held until the job is complete.",
          },
          {
            n: "03",
            title: "Confirm & rate",
            body: "Welper confirms the job is done and submits end time. Payment is taken and the customer is sent the final invoice. Leave a rating for the Welper, which helps keep the platform accountable.",
          },
        ],
        welperSteps: [
          {
            n: "01",
            title: "Build your profile",
            body: "Sign up, list your services, set your rates and weekly availability. Adults complete a background check.",
          },
          {
            n: "02",
            title: "Accept jobs that fit",
            body: "Get matched with requests that match your skills and schedule. Part-time, full-time, or occasional — your call.",
          },
          {
            n: "03",
            title: "Get paid",
            body: "Welper confirms job is complete and submits end time. Invoice is sent to the customer and payment is taken. Welpco transfers weekly payouts to Welper's Stripe account the following week on the Friday.",
          },
        ],
      },
      minors: {
        badge: "New · April 2026",
        titleLine1: "Service-provider accounts",
        titleLine2: "for minors.",
        body: "Welpers aged 14 and up can now sign up under a guardian-managed account. Background checks are waived; guardians review every booking.",
        ctaPrimary: "Set up a guardian account",
        ctaFaq: "Read the FAQ",
        cardTitle: "Guardian-verified",
        cardSub: "Approved · monitored",
        imageAlt: "Guardian and teen walking together in the neighborhood",
      },
      trust: {
        eyebrow: "— Trust & safety",
        titleLine1: "Trust,",
        titleLine2: "by design.",
        subtitle:
          "Background checks, escrow payments, on-platform messaging, and two-way ratings — baked into every booking.",
        items: [
          {
            title: "Background-checked Welpers",
            body: "Every adult Welper passes a background check before they can take their first booking.",
          },
          {
            title: "Funds held until done",
            body: "You pay upfront, but we hold the money until you confirm the job is complete.",
          },
          {
            title: "On-platform messaging",
            body: "All communication runs through Welpco — transparent, respectful, and on the record.",
          },
          {
            title: "Two-way ratings",
            body: "Customers and Welpers rate each other after every job. The community keeps itself accountable.",
          },
        ],
      },
      becomeWelper: {
        eyebrow: "— For service providers",
        titleLine1: "Set your rates.",
        titleLine2: "Set your hours.",
        body: "A first job, a flexible side income, or a structured way to use free time in retirement — Welping fits around your life. You decide what you offer, when you work, and what you charge.",
        points: [
          "Pick the services that match your skills",
          "Set your own rates and weekly availability",
          "Get paid the following week on the Friday on a weekly basis",
          "Build a profile, ratings, and a regular client base",
        ],
        ctaPrimary: "Become a Welper",
        ctaSecondary: "See how Welpers get paid",
        footnote: "Create your profile today · Welp tomorrow",
        images: {
          lawn: "Welper providing lawn care in a neighborhood yard",
          baking: "Welper baking in a home kitchen",
          tutoring: "Welper tutoring a student at home",
        },
      },
      faqTeaser: {
        eyebrow: "— FAQ",
        titleLine1: "Common",
        titleLine2: "questions.",
        subtitle: "On Welping, booking, payments and platform safety.",
        readAll: "Read all FAQs",
        items: [
          {
            q: "How can I become a Welper?",
            a: "Sign up via our website or app, create your profile, list your services and rates, and set up Stripe for weekly payouts.",
          },
          {
            q: "How do I get paid as a Welper?",
            a: "Confirm \"Job Done\" when the work is finished. Customers are charged, and Welpers receive weekly payouts every Friday of the following week.",
          },
          {
            q: "When and how do I pay for a service?",
            a: "Payment is taken when your booking is confirmed and held until the job is complete. Once you confirm completion, funds are released to the Welper.",
          },
          {
            q: "How do I know that having a Welper at my home is safe?",
            a: "Adult Welpers complete background checks and earn a certified badge on their profile. Minor Welpers display a Minor badge and sign up under a guardian-managed account.",
          },
        ],
      },
    },
    about: {
      meta: {
        title: "About",
        description:
          "Welpco connects people who need everyday services with vetted providers in their area.",
      },
      hero: {
        eyebrow: "— About us",
        titleLine1: "A local-services",
        titleLine2: "marketplace.",
        lead: "Welpco connects people who need everyday services with vetted providers in their area.",
        sub:
          "From last-minute babysitting to seasonal yard work, Welpco runs the search, scheduling, payment and review layer — so the only thing left is the work itself.",
        imageAlt: "Neighbours helping each other in the community on a sunny afternoon",
      },
      mission: {
        eyebrow: "— Our mission",
        title: "Connecting neighbours who need help",
        titleItalic: "with those ready to Welp.",
        paragraphs: [
          "Welpco is uniquely designed to connect people in need of services to those who provide services within their community. Whether it's parents searching for a last-minute babysitter to someone needing a hand with household maintenance, Welpco facilitates your needs by connecting you to a friendly face within your community who is willing to lend a hand. Our mission is to bring forward a user-friendly platform, where people can utilize their skills and provide services within their community with the freedom of selecting their own schedule while accommodating to the needs of others. We provide a safe environment for both our service providers, who we refer to as our \"Welpers\", and our customers.",
          "Being a Welper comes with many advantages. You decide which services you'd like to provide. You choose your work schedule, since you provide us with your availability, so you can be a part-time Welper or a full-time Welper. For some, becoming a Welper can be your first job. It can teach adolescents and young adults, quality life skills, such as: responsibility, commitment, communication, and kindness. For others, becoming a Welper is a way to make money outside the hours of your daily job/career, allowing you to have more income on your own time. For retirees who'd like to increase their income by utilizing their free time and perhaps, doing something they enjoy, becoming a Welper is absolutely perfect. Welpco offers many services provided by our Welpers, such as: babysitting, tutoring, lawn-mowing, seasonal outdoor maintenance, household chores, moving, dog-walking, technological assistance, installations, among many others.",
          "In today's fast paced society, it can be challenging to accomplish everything you need to get done in a day's time. We all have obligations, whether it's to our jobs, our family, our homes, or our communities. Welpco facilitates your needs by giving you the means of scheduling whichever services you need to alleviate some of that stress or free up some much needed time. You can schedule a daily, weekly, or monthly routine of services via our platform. From scheduling tutoring for your children on Wednesday evenings to having your lawn mowed Sunday mornings, Welpco is there. Too busy to prepare a home cooked meal throughout the week, why not have a Welper prepare your meals in advance for you? Not only can you schedule services in advance, but we at Welpco understand that sometimes services are needed now, today, as soon as possible, so we cater to your needs. With a simple search on our platform, you can find the service you're looking for from a friendly Welper in no time!",
        ],
      },
      personas: {
        eyebrow: "Who Welps",
        titleLine1: "Three kinds of",
        titleLine2: "Welper.",
        items: [
          {
            label: "Teens & young adults",
            body: "Welping as a structured first job — flexible hours, real income, and verifiable work history.",
            imageAlt: "Young adult working flexibly on a laptop",
          },
          {
            label: "Working adults",
            body: "A side income on top of an existing career. Pick up bookings on evenings and weekends.",
            imageAlt: "Working adult managing a side hustle from a home desk",
          },
          {
            label: "Retirees",
            body: "Use existing skills to supplement retirement income, on a self-managed schedule.",
            imageAlt: "Retiree enjoying meaningful work in the garden",
          },
        ],
      },
      values: {
        eyebrow: "What we believe",
        titleLine1: "Four operating",
        titleLine2: "principles.",
        items: [
          {
            n: "01",
            t: "Local first",
            b: "The product is designed around proximity. Search defaults to your zip; matching prioritizes nearby Welpers.",
          },
          {
            n: "02",
            t: "Trust by system",
            b: "Background checks, escrow payments, on-platform messaging, two-way ratings. Trust is engineered, not assumed.",
          },
          {
            n: "03",
            t: "Provider autonomy",
            b: "Welpers control what they offer, when they work, and what they charge. The platform follows their constraints.",
          },
          {
            n: "04",
            t: "Direct human work",
            b: "No subcontracting. Every booking is a single Welper with a profile, ratings, and a verifiable track record.",
          },
        ],
      },
    },
    howItWorksPage: {
      meta: {
        title: "How it works",
        description: "How Welpco works for customers and Welpers.",
      },
      hero: {
        eyebrow: "— How it works",
        title: "How Welpco",
        titleItalic: "works.",
        sub: "Two flows — booking and providing. Both take three steps.",
      },
      welper: {
        eyebrow: "— Become a Welper",
        title: "What it takes to",
        titleItalic: "join the community.",
        steps: [
          ["Sign up & build a profile", "Add your experience, the services you provide, and what you charge."],
          ["Pass a background check", "Required for adult Welpers — keeps customers confident, keeps Welpers credible."],
          ["Set your availability", "You tell us when you work. Part-time, full-time, weekends, evenings — all welcome."],
          ["Accept your first booking", "Browse incoming requests, accept what fits, and meet your first neighbor."],
          [
            "Get paid, get reviewed",
            "Payment is sent the following week on the Friday on a weekly basis. Reviews are submitted by the customer when the job is complete.",
          ],
        ],
        cta: "Start your Welper profile",
        images: {
          onboarding: "Welper completing profile signup on a laptop",
          profile: "Friendly professional headshot for a Welper profile",
          verification: "Identity and background check verification documents",
        },
      },
    },
    faqPage: {
      meta: {
        title: "FAQ",
        description: "Frequently asked questions about Welpco for customers and Welpers.",
      },
      hero: {
        eyebrow: "— FAQ",
        title: "Frequently asked",
        titleItalic: "questions.",
      },
      groups: [
        {
          label: "For Welpers",
          heading: "About",
          headingItalic: "Welping.",
          items: [
            [
              "How can I become a Welper?",
              "To become a Welper, simply sign up via our website or app and create your profile. You can include your experience and the type of services you provide. You will also need to choose the amount you will charge for the service(s) you will provide.",
            ],
            [
              "Why do I need a background check?",
              "Welpco identifies itself as a safe and user-friendly platform. We want to ensure, to the best of our ability, that our platform is a safe environment for our customers. A background check gives our customers the ease of mind they require when having a Welper enter their home and/or their property. If you pass the background check, you will receive a certified badge on your profile. If you fail the background check, you will not receive a certified badge on your profile, but you will still be able to be a Welper.",
            ],
            [
              "How do I get paid?",
              [
                "Once the job is completed, the Welper will confirm \"Job Done\" through the app or website. A receipt will automatically be sent to the customer, and the payment process will then be finalized.",
                "Welpers receive their payouts on a weekly basis, every Friday of the following week.",
                "Example: If you begin completing jobs on Monday and continue working throughout that week, you will receive payment on the Friday of the following week, and so on.",
                "When creating your profile, you will also need to set up your own Stripe account in order to receive your weekly payouts.",
                "Once your payout becomes available in your Stripe account, you can manually transfer your funds to your bank account at no cost.",
              ],
            ],
            [
              "Can a minor sign up as a Welper?",
              "Minors over the age of 14 can become a Welper via our platform, however, their account must be created and managed by a legal guardian. Welpers who are minors will not be subjected to a background check.",
            ],
            [
              "What happens if a customer refuses to pay for the service they received?",
              "If a customer refuses to pay for the service you provided, they would need to have a valid reason, and they would need to discuss it with you to see if you can resolve the issue. If the issue cannot be resolved between the Welper and the customer, they will need to contact us directly, so we can determine the issue and resolve it based on the facts provided to us by both parties.",
            ],
          ],
        },
        {
          label: "For Customers",
          heading: "About",
          headingItalic: "booking.",
          items: [
            [
              "How do I sign up to use your services?",
              "To sign up, simply use our website or app. You can then get started searching for the service you need being offered within your community.",
            ],
            [
              "When and how do I pay for a service?",
              "When a booking is confirmed between yourself and a Welper, you will complete the payment, but we will hold the money until the job is completed. Once the job is completed, you will confirm via the website or app that the job is completed and we will then release payment to the Welper for the service they provided.",
            ],
            [
              "What happens if a Welper does an unsatisfactory job?",
              "If a Welper does an unsatisfactory job, discuss with them the issue you have with the job they did. If it cannot be resolved between both parties, please contact us directly and we will determine the outcome, whether or not, a refund or credit will be issued to you and if any disciplinary actions need to be taken in regards to the Welper using our platform. There is also a rating system, so you can rate the job provided by the Welper, which will also appear in their profile.",
            ],
            [
              "How do I know that allowing a Welper on my property, or in my home, is safe?",
              "Welpco prides itself on providing a safe and secure environment for both our customers and our Welpers. Welpers will need to pass a background check during sign up to insure the integrity of the work they will provide. Welpers who pass their background check, will have a certified badge on their profile. Welpers who are minors, will not need to complete a background check, so their profiles will display a \"Minor badge\".",
            ],
            [
              "What if there is a service I need that I don't see offered on the platform?",
              "If there is a service you need that you don't see offered on our platform, you can post the job description you need in the job postings section on our platform and Welpers will contact you if they are able and willing to do the job. You can also contact us directly via our \"Contact us\" page.",
            ],
            [
              "What happens if I contact a Welper for services outside of the platform?",
              "Contacting a Welper outside of our platform can lead to many issues and an unsafe environment. You will not be secure and any contact made outside of the platform with a Welper that was not made during the completion of a task will not be permitted by Welpco; thus we will provide no assistance with any issues that may arise. Welpers via our platform are vetted and any communication you have with them will be conducted via our platform's messenger system to insure a respectful and transparent exchange of information. Transactions made via our platform are also secure and we offer our support for any questions or concerns you may have.",
            ],
          ],
        },
      ],
      cta: {
        title: "Still have questions?",
        sub: "We respond within 48 hours.",
        button: "Contact us →",
      },
    },
    contactPage: {
      meta: {
        title: "Contact",
        description: "Contact Welpco support — we respond within 48 hours.",
      },
      hero: {
        eyebrow: "— Contact us",
        title: "Contact",
        titleItalic: "support.",
        sub: "Questions, concerns or feedback. We respond within 48 hours.",
      },
      info: [
        { l: "Email us", v: "support@welpco.com" },
        { l: "Response time", v: "Within 48 hours" },
        { l: "Hours", v: "Mon – Fri, 9am – 6pm ET" },
      ],
      form: {
        eyebrow: "— Send a message",
        name: "Name",
        namePlaceholder: "Jane Cooper",
        email: "Email address",
        emailPlaceholder: "jane@neighborhood.com",
        phone: "Phone number",
        phonePlaceholder: "(555) 010-0123",
        roleLegend: "I am a…",
        roleAria: "I am a",
        roles: ["Customer", "Welper", "General inquiry"],
        message: "Message",
        messagePlaceholder: "Tell us what's on your mind…",
        privacy: "By submitting, you agree to our Privacy Policy.",
        submit: "Send message",
        submitting: "Sending…",
        success:
          "Thanks — your message is in. We'll get back to you within 48 hours.",
        error:
          "We couldn't send your message. Email support@welpco.com directly and we'll get back to you.",
      },
    },
    layout: {
      title: "Welpco — Local services, real neighbours",
      description:
        "Welpco connects you with vetted Welpers in your community — for the everyday services you need.",
      ogDescription:
        "Vetted local providers for everyday services — childcare, lawn care, tutoring, tech help and more.",
      twitterDescription:
        "Vetted local providers for everyday services in your neighborhood.",
    },
  },
};

// French translations — professional Canadian French where applicable
const fr = JSON.parse(JSON.stringify(en));
// Apply FR overrides via a shallow merge helper for key sections
Object.assign(fr.marketing.a11y, {
  skipToContent: "Passer au contenu principal",
  siteFooter: "Pied de page",
  primaryNav: "Principal",
  mobileNav: "Menu mobile",
  openMenu: "Ouvrir le menu",
  closeMenu: "Fermer le menu",
  home: "Welpco — accueil",
  comingSoon: "Bientôt disponible",
});
Object.assign(fr.marketing.languageSwitcher, {
  en: "EN",
  fr: "FR",
  english: "English",
  french: "Français",
});
Object.assign(fr.marketing.nav, {
  home: "Accueil",
  about: "À propos",
  howItWorks: "Comment ça marche",
  faq: "FAQ",
  contact: "Contact",
  signIn: "Connexion",
  findHelp: "Trouver de l'aide",
});
Object.assign(fr.marketing.footer, {
  tagline:
    "Une place de marché de services locaux. Prestataires vérifiés, paiements sous séquestre, messagerie sur la plateforme.",
  cols: {
    welpco: "Welpco",
    customers: "Pour les clients",
    welpers: "Pour les Welpers",
    support: "Soutien",
  },
  links: {
    aboutUs: "À propos",
    ourMission: "Notre mission",
    findWelper: "Trouver un Welper",
    categories: "Catégories",
    howItWorks: "Comment ça marche",
    trustSafety: "Confiance et sécurité",
    welperHandbook: "Guide du Welper",
    weeklyPayouts: "Paiements hebdomadaires (vendredi)",
    community: "Communauté",
    faq: "FAQ",
    contactUs: "Nous joindre",
  },
  copyright: "© 2026 Welpco — Construit pour la communauté",
  terms: "Conditions",
  privacy: "Confidentialité",
  cookies: "Témoins",
});
Object.assign(fr.marketing.home.hero, {
  line1: "De l'aide locale.",
  line2: "De vrais voisins.",
  subhead:
    "Connectez-vous à des Welpers de confiance dans votre communauté — garde d'enfants, entretien de pelouse, tutorat, aide technologique et plus.",
  findHelp: "Trouver de l'aide",
  becomeWelper: "Devenir Welper",
});
Object.assign(fr.marketing.home.categories, {
  eyebrow: "Catégories",
  titleLine1: "Huit catégories.",
  titleLine2: "Des centaines de services.",
  subtitle: "Exemples de services offerts par les Welpers dans chaque catégorie.",
  hideServices: "Masquer les services dans {name}",
  showServices: "Afficher {count} services dans {name}",
});
fr.marketing.home.categories.items.care = {
  name: "Soins",
  services: ["Gardienne", "Garde d'enfants", "Soins aux aînés", "Besoins particuliers"],
};
fr.marketing.home.categories.items.pet = {
  name: "Soins aux animaux",
  services: [
    "Promenades de chiens",
    "Toilettage",
    "Garde d'animaux",
    "Entretien d'aquariums et terrariums",
    "Dressage canin",
  ],
};
fr.marketing.home.howItWorks = {
  eyebrow: "Comment ça marche",
  titleLine1: "Trois étapes.",
  titleLine2: "Sans friction.",
  subtitle:
    "Que vous réserviez un service ou que vous en offriez un, la mise en route prend quelques minutes.",
  tabCustomer: "J'ai besoin d'aide",
  tabWelper: "Je veux Welper",
  customerSteps: en.marketing.home.howItWorks.customerSteps.map((s, i) => [
    { title: ["Rechercher à proximité", "Réserver et planifier", "Confirmer et évaluer"][i], body: [
      "Indiquez le service dont vous avez besoin et votre code postal. Parcourez les Welpers vérifiés près de chez vous en quelques secondes.",
      "Choisissez un Welper, fixez un horaire et confirmez. Payez en toute sécurité — les fonds sont retenus jusqu'à la fin du travail.",
      "Le Welper confirme que le travail est terminé et soumet l'heure de fin. Le paiement est prélevé et la facture finale est envoyée au client. Laissez une évaluation pour maintenir la responsabilité sur la plateforme.",
    ][i] },
  ][0] ? [] : []),
};
// Simpler: deep assign welper/customer steps manually
fr.marketing.home.howItWorks.customerSteps = [
  { n: "01", title: "Rechercher à proximité", body: "Indiquez le service dont vous avez besoin et votre code postal. Parcourez les Welpers vérifiés près de chez vous en quelques secondes." },
  { n: "02", title: "Réserver et planifier", body: "Choisissez un Welper, fixez un horaire et confirmez. Payez en toute sécurité — les fonds sont retenus jusqu'à la fin du travail." },
  { n: "03", title: "Confirmer et évaluer", body: "Le Welper confirme que le travail est terminé et soumet l'heure de fin. Le paiement est prélevé et la facture finale est envoyée au client. Laissez une évaluation pour maintenir la responsabilité sur la plateforme." },
];
fr.marketing.home.howItWorks.welperSteps = [
  { n: "01", title: "Créez votre profil", body: "Inscrivez-vous, listez vos services, fixez vos tarifs et votre disponibilité hebdomadaire. Les adultes passent une vérification des antécédents." },
  { n: "02", title: "Acceptez les mandats qui vous conviennent", body: "Recevez des demandes qui correspondent à vos compétences et à votre horaire. Temps partiel, temps plein ou occasionnel — c'est vous qui décidez." },
  { n: "03", title: "Recevez votre paiement", body: "Le Welper confirme que le travail est terminé et soumet l'heure de fin. La facture est envoyée au client et le paiement est prélevé. Welpco transfère les paiements hebdomadaires au compte Stripe du Welper le vendredi de la semaine suivante." },
];

writeFileSync(join(root, "messages/en.json"), JSON.stringify(en, null, 2));
writeFileSync(join(root, "messages/fr.json"), JSON.stringify(fr, null, 2));
console.log("Wrote messages/en.json and messages/fr.json");
