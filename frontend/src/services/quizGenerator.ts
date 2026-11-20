import type { QuizQuestion } from './demoData';

/**
 * Dynamically generate grounded multiple-choice quiz questions from uploaded document text.
 */
export function generateQuizFromDocument(text: string, filename: string): QuizQuestion[] {
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const lines = cleanText.split('\n').map((l) => l.trim()).filter((l) => l.length > 20);

  // If text is short or not enough lines, create targeted comprehension questions
  if (lines.length < 5) {
    return [
      {
        id: 1,
        question: `Based on ${filename}, what is the main subject covered in this material?`,
        options: [
          lines[0] ? lines[0].slice(0, 70) : 'Core principles of the subject',
          'Unrelated general introduction',
          'Historical background prior to 1900',
          'Methodological overview and lab procedures',
        ],
        correct: 0,
        explanation: `This document focuses on: ${lines[0] || 'the core subject content'}.`,
      },
      {
        id: 2,
        question: `According to the uploaded notes in ${filename}, which key term or statement is emphasized?`,
        options: [
          lines[1] ? lines[1].slice(0, 70) : 'Key definition from the document',
          'A concept not mentioned in the text',
          'An obsolete scientific hypothesis',
          'An external supplementary reference',
        ],
        correct: 0,
        explanation: 'This statement is directly highlighted in your course material.',
      },
      {
        id: 3,
        question: 'How should the ideas in these notes be applied in practice or an exam?',
        options: [
          'By understanding the definitions and applying them to case questions',
          'By ignoring definitions and guessing answers',
          'By only memorizing unrelated dates',
          'By skipping fundamental concepts',
        ],
        correct: 0,
        explanation: 'Understanding the core mechanisms enables you to solve applied exam problems.',
      },
      {
        id: 4,
        question: 'Which of the following is true according to your uploaded notes?',
        options: [
          lines[2] ? lines[2].slice(0, 70) : 'The principles detailed in the lecture',
          'All principles are mutually contradictory',
          'The material has been superseded completely',
          'None of the concepts apply to your syllabus',
        ],
        correct: 0,
        explanation: 'This follows directly from your notes.',
      },
      {
        id: 5,
        question: 'What is the most important exam takeaway from this material?',
        options: [
          'Mastering the foundational terms and their specific roles',
          'Focusing only on the first paragraph',
          'Disregarding all definitions and examples',
          'Assuming the topic will not be examined',
        ],
        correct: 0,
        explanation: 'Examiners focus on definitions, key distinctions, and practical applications.',
      },
    ];
  }

  // Pick 5 distinct informative lines from across the document
  const step = Math.max(1, Math.floor(lines.length / 5));
  const selectedLines = [
    lines[0],
    lines[Math.min(step, lines.length - 1)],
    lines[Math.min(step * 2, lines.length - 1)],
    lines[Math.min(step * 3, lines.length - 1)],
    lines[Math.min(step * 4, lines.length - 1)],
  ];

  const questions: QuizQuestion[] = selectedLines.map((line, idx) => {
    // Check if line has a colon (e.g. "Term: Definition") or dash
    const separatorMatch = line.match(/^([^:\-–]+)[:\-–]\s*(.+)$/);
    if (separatorMatch) {
      const term = separatorMatch[1].trim();
      const definition = separatorMatch[2].trim();
      return {
        id: idx + 1,
        question: `According to your notes on ${filename}, what is the role or definition of "${term}"?`,
        options: [
          definition.length > 80 ? definition.slice(0, 77) + '...' : definition,
          `Inhibits or prevents the action of ${term}`,
          'An external variable not related to the system',
          'A temporary state observed only during storage',
        ],
        correct: 0,
        explanation: `In your notes, ${term} is defined as: ${definition.slice(0, 120)}.`,
      };
    }

    // Otherwise, create a comprehension question from the line
    const snippet = line.length > 85 ? line.slice(0, 82) + '...' : line;
    return {
      id: idx + 1,
      question: `Question ${idx + 1} from ${filename}: Which statement is stated in your uploaded material?`,
      options: [
        snippet,
        'The opposite conclusion is supported by modern evidence',
        'This relationship is only valid under extreme artificial conditions',
        'This statement is explicitly refuted by the lecturer',
      ],
      correct: 0,
      explanation: `Your notes state: "${snippet}".`,
    };
  });

  return questions;
}
