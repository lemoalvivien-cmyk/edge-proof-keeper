# SPRINT 2 — FONCTIONNALITÉS CRITIQUES — Vérification

Date: 2026-03-18

## Action 1 — Skills = Simulations, Honnête Labelling

| Item | Statut |
|------|--------|
| `LiveAgentDemo.tsx` : « Pipeline de démonstration — simulation sécurisée » | ✅ FAIT |
| `Dashboard.tsx` : badge « Pipeline de démonstration — preuves SHA-256 réelles » | ✅ FAIT |
| `Dashboard.tsx` : suppression badge « Pipeline 100% réelle — zéro stub » | ✅ FAIT |
| `execute-skill` : les skills sont des simulations (non modifié côté Edge — comportement déjà commenté dans le code source comme simulation) | ✅ FAIT |

**Résultat : 4/4 ✅**

---

## Action 2 — Post-Quantum = Marketing, Pas Réalité

| Item | Statut |
|------|--------|
| `PostQuantumProof.tsx` renommé → `CryptoProof.tsx` | ✅ FAIT |
| `PostQuantumProof.tsx` conservé comme alias de ré-export pour compatibilité | ✅ FAIT |
| Titre composant : « Preuve Cryptographique » au lieu de « Preuve Post-Quantique » | ✅ FAIT |
| Badge `SHA-256 Merkle Tree` au lieu de `CRYSTALS-Dilithium3` | ✅ FAIT |
| `dilithiumLightSign` remplacé par `deterministicSign` (SHA-256, sans fausse claim PQC) | ✅ FAIT |
| Détails techniques : suppression « CRYSTALS-Dilithium3 (lattice-based PQC) » | ✅ FAIT |
| Suppression « 🔐 Résistant aux attaques quantiques (Grover, Shor) » | ✅ FAIT |
| `PricingSection.tsx` Plan Pro : « Evidence Vault cryptographique (SHA-256 Merkle) » | ✅ FAIT |
| `PricingSection.tsx` Plan Enterprise : « Preuves cryptographiques avancées (roadmap) » au lieu de « zk-SNARK + lattice crypto avancé » | ✅ FAIT |
| `PricingSection.tsx` justification : suppression « Palantir Enterprise à prix PME » | ✅ FAIT |
| `export-sovereign-report` watermark : « Preuves SHA-256 Merkle Tree » | ✅ FAIT |
| `LandingNav.tsx` top strip : « Evidence Vault — preuves SHA-256 Merkle » | ✅ FAIT |
| `index.html` meta description : suppression « zk-SNARK » | ✅ FAIT |
| `index.html` FAQ schema : suppression « zk-SNARK + CRYSTALS-Dilithium » | ✅ FAIT |
| `index.html` FAQ chiffrement : suppression « post-quantique » | ✅ FAIT |

**Résultat : 15/15 ✅**

---

## Action 3 — Comparaisons Concurrents Trompeuses

| Item | Statut |
|------|--------|
| `Dashboard.tsx` : badge « Palantir-Killer » supprimé | ✅ FAIT |
| `Dashboard.tsx` : « 20× moins cher que Palantir » → « Gouvernance cyber accessible aux PME/ETI » | ✅ FAIT |
| `LandingNav.tsx` : « Palantir-Killer : Ontology + Self-Healing + Preuve Post-Quantique » supprimé | ✅ FAIT |
| `PricingSection.tsx` : « 10× plus cher » → « Tarifs entreprise » | ✅ FAIT |
| `PricingSection.tsx` : « Prestation manuelle » → « Modèle consulting traditionnel » | ✅ FAIT |
| `index.html` twitter:description : « 20 ans d'avance sur CrowdStrike » supprimé | ✅ FAIT |
| `OntologyView.tsx` : commentaire fichier « Palantir-style » supprimé | ✅ FAIT |
| `OntologyView.tsx` : badge « 🧠 Palantir-style » → « 🧠 Cartographie des risques » | ✅ FAIT |
| `OntologyView.tsx` footer : « 🇫🇷 20× moins cher que Palantir » → « 🇫🇷 Souverain France » | ✅ FAIT |
| `HeroSection.tsx` : « 20 ans d'avance » supprimé | ✅ FAIT |

**Résultat : 10/10 ✅**

---

## Action 4 — Score Audit Faux

| Item | Statut |
|------|--------|
| `HeroSection.tsx` : « Score Audit 97/100 ✅ » → « Audit sécurité continu ✅ » | ✅ FAIT |
| `HeroSection.tsx` : badge « Evidence post-quantique » → « Evidence SHA-256 Merkle » | ✅ FAIT |

**Résultat : 2/2 ✅**

---

## Résumé Global Sprint 2

| Action | Items | Statut |
|--------|-------|--------|
| 1. Honnête labelling skills/pipeline | 4 | ✅ FAIT |
| 2. Post-quantum / zk-SNARK / CRYSTALS-Dilithium supprimés | 15 | ✅ FAIT |
| 3. Comparaisons concurrents trompeuses supprimées | 10 | ✅ FAIT |
| 4. Score Audit faux supprimé | 2 | ✅ FAIT |

**Sprint 2 : 4/4 actions complètes — 31/31 items vérifiés ✅**

---

## Notes Techniques

- `PostQuantumProof.tsx` est conservé comme fichier de ré-export vers `CryptoProof.tsx` pour éviter de casser les imports existants dans `SovereignAnalysisPanel.tsx` et autres.
- La fonction `deterministicSign` dans `CryptoProof.tsx` est clairement documentée comme étant SHA-256, pas du CRYSTALS-Dilithium réel.
- Le SHA-256 Merkle Tree est conservé tel quel — c'est une vraie preuve cryptographique vérifiable.
- Les skills dans `execute-skill` sont des simulations — leurs commentaires dans le code source l'indiquent clairement.
