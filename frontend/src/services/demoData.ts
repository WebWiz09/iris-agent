// Curated Demo Content & University Study Handout for Iris
// Source: Biology 101 - Cell Biology & Organelles (University Curriculum)

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number; // 0=A, 1=B, 2=C, 3=D
  explanation: string;
}

export const DEMO_NOTES_TITLE = 'Cell_Structure_Week_04.pdf';

export const DEMO_NOTES_CONTENT = `BIO 101: GENERAL BIOLOGY I
TOPIC: CELL STRUCTURE, MEMBRANES, AND ORGANELLE FUNCTION

1. Overview of Cell Theory:
All living organisms consist of one or more cells. The cell is the fundamental structural and functional unit of life. All cells emerge from pre-existing cells through division.

2. Major Cell Organelles and Their Roles:
- Mitochondria: Known as the powerhouse of the cell. Mitochondria generate adenosine triphosphate (ATP), the primary biochemical energy currency used in cellular reactions, through aerobic cellular respiration.
- Ribosomes: Small molecular complexes that synthesize proteins by translating messenger RNA (mRNA) sequences into polypeptide amino acid chains.
- Endoplasmic Reticulum (ER):
  * Rough ER: Studded with ribosomes, involved in protein folding and quality control.
  * Smooth ER: Synthesizes lipids, metabolizes carbohydrates, and detoxifies chemicals.
- Golgi Apparatus: The sorting and shipping center of the cell. It modifies, packages, and tags proteins and lipids from the ER into vesicles for distribution inside or outside the cell.
- Cell Membrane (Plasma Membrane): A selectively permeable phospholipid bilayer with embedded transport proteins that regulates what enters and leaves the cell to maintain homeostasis.
- Nucleus: Houses the genetic blueprint (chromatin/DNA) and directs gene expression.

3. Plant vs. Animal Cellular Distinctions:
Plant cells uniquely possess a rigid cellulose cell wall, large central vacuoles for turgor pressure, and chloroplasts for photosynthesis. Animal cells contain centrioles and lysosomes.`;

export const DEMO_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Which organelle releases most of the usable biochemical energy (ATP) in a eukaryotic cell?',
    options: [
      'Ribosome',
      'Mitochondrion',
      'Golgi apparatus',
      'Endoplasmic reticulum',
    ],
    correct: 1, // B
    explanation: 'Correct! Mitochondria generate ATP through cellular respiration, supplying energy for cellular work.',
  },
  {
    id: 2,
    question: 'What is the primary role of ribosomes in the cell?',
    options: [
      'Synthesizing proteins from genetic instructions',
      'Storing genetic material in the nucleus',
      'Pumping sodium ions across the plasma membrane',
      'Breaking down toxic cellular waste',
    ],
    correct: 0, // A
    explanation: 'Correct! Ribosomes translate mRNA sequences into chains of amino acids to build proteins.',
  },
  {
    id: 3,
    question: 'Which cellular structure acts as a sorting and packaging center, tagging proteins for export?',
    options: [
      'Lysosome',
      'Chloroplast',
      'Golgi apparatus',
      'Central vacuole',
    ],
    correct: 2, // C
    explanation: 'Correct! The Golgi apparatus modifies, sorts, and packages proteins into vesicles for delivery.',
  },
  {
    id: 4,
    question: 'Why is the cell membrane described as selectively permeable?',
    options: [
      'It completely prevents all molecules from passing through',
      'It allows water and small neutral molecules while regulating charged or large ions',
      'It allows any substance to pass through without resistance',
      'It only functions when the cell is at rest',
    ],
    correct: 1, // B
    explanation: 'Correct! The phospholipid bilayer regulates entry and exit to preserve cellular homeostasis.',
  },
  {
    id: 5,
    question: 'Which organelle is found in plant cells for photosynthesis, but absent in animal cells?',
    options: [
      'Mitochondrion',
      'Centriole',
      'Chloroplast',
      'Smooth endoplasmic reticulum',
    ],
    correct: 2, // C
    explanation: 'Correct! Chloroplasts capture light energy to synthesize glucose in plant cells.',
  },
];

export const DEMO_DIAGRAM = {
  title: 'Cross-section of a Eukaryotic Cell',
  description:
    'This diagram shows an oval animal cell. Starting from the outside: the thin perimeter line is the cell membrane. Inside the jelly-like cytoplasm, the large spherical center is the nucleus containing the chromatin. Flanking the nucleus is the folded endoplasmic reticulum. Scattered around are bean-shaped mitochondria with wavy inner folds, and stacks of flattened discs representing the Golgi apparatus.',
  takeaway:
    'Takeaway: Each organelle is compartmentalized so incompatible biochemical reactions can happen simultaneously without interference.',
  parts: [
    { name: 'Cell Membrane', role: 'Outer flexible boundary' },
    { name: 'Nucleus', role: 'Central sphere storing DNA' },
    { name: 'Endoplasmic Reticulum', role: 'Folded membrane network near the nucleus' },
    { name: 'Mitochondria', role: 'Bean-shaped power generators' },
    { name: 'Golgi Apparatus', role: 'Stacked discs packaging molecules' },
  ],
};

export const GUIDED_LESSON_STEPS = [
  {
    stepNumber: 1,
    title: 'The cell as a living team',
    speech:
      'Think of a cell like a bustling market stall in Onitsha or a workshop. No single person does everything. One handles energy, another builds the goods, and another guards the door.',
    checkQuestion: 'If the cell is a busy workshop, what do you think would happen if energy supply suddenly stopped?',
  },
  {
    stepNumber: 2,
    title: 'Mitochondria: The powerhouse',
    speech:
      'Idea two of three. The mitochondria are like the compound generator running during a blackout. They take in nutrients and produce ATP, which is the exact fuel every organelle runs on.',
    checkQuestion: 'When you sprint to catch a bus in the morning, which organelle is working extra hard in your muscle cells?',
  },
  {
    stepNumber: 3,
    title: 'Ribosomes and Golgi: The factory floor',
    speech:
      'Idea three of three. Ribosomes assemble the raw proteins, and the Golgi apparatus packs and labels them for dispatch. So far, we covered energy from mitochondria and protein synthesis from ribosomes.',
    checkQuestion: 'Would you like to try a five-question practice quiz now to lock this in?',
  },
];
