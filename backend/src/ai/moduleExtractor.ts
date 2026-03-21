/**
 * Module Extractor — Aplatit la structure JSON des modules en texte lisible par le LLM
 * Gère tous les types de blocs définis dans le format de contenu Afribourse
 */

interface Block {
  type: string;
  content?: any;
}

interface Section {
  number?: string | number;
  title?: string;
  blocks?: Block[];
}

interface ModuleHeader {
  moduleNumber?: string | number;
  lessonNumber?: string | number;
  title?: string;
  objectives?: string[];
}

interface ModuleDoc {
  header?: ModuleHeader;
  sections?: Section[];
}

function extractBlock(block: Block): string {
  if (!block?.type) return '';

  switch (block.type) {
    case 'paragraph':
      return block.content?.replace(/<[^>]+>/g, '') ?? '';

    case 'grid-cards':
      return block.content?.cards
        ?.map((c: any) => `${c.title} : ${c.description}`)
        .join('\n') ?? '';

    case 'analogy': {
      const a = block.content;
      const zones = a?.zones?.map((z: any) => `${z.label} : ${z.description}`).join('\n') ?? '';
      return [a?.title, a?.intro, zones, a?.conclusion].filter(Boolean).join('\n');
    }

    case 'subsection': {
      const s = block.content;
      const items = s?.items?.map((i: any) => String(i).replace(/<[^>]+>/g, '')).join('\n') ?? '';
      return [s?.title, items].filter(Boolean).join('\n');
    }

    case 'key-points':
    case 'list':
      return block.content?.items
        ?.map((i: any) => (typeof i === 'string' ? i.replace(/<[^>]+>/g, '') : i?.text ?? ''))
        .join('\n') ?? '';

    case 'definition':
      return `Définition — ${block.content?.term ?? ''} : ${block.content?.definition ?? ''}`;

    case 'example':
      return `Exemple : ${block.content?.text ?? block.content ?? ''}`;

    case 'quiz': {
      const q = block.content;
      const options = q?.options?.map((o: any, i: number) => `${i + 1}. ${o}`).join('\n') ?? '';
      return `Question : ${q?.question}\n${options}\nRéponse correcte : ${q?.correctAnswer}\nExplication : ${q?.explanation ?? ''}`;
    }

    default:
      if (typeof block.content === 'string') return block.content.replace(/<[^>]+>/g, '');
      if (typeof block.content === 'object') return JSON.stringify(block.content);
      return '';
  }
}

function extractSection(section: Section): string {
  const title = `### ${section.number ?? ''} ${section.title ?? ''}`.trim();
  const blocks = (section.blocks ?? []).map(extractBlock).filter(Boolean).join('\n\n');
  return [title, blocks].filter(Boolean).join('\n');
}

/** Module JSON → texte plat indexable par le RAG */
export function flattenModule(moduleDoc: ModuleDoc): string {
  const { header, sections = [] } = moduleDoc;

  const headerText = [
    `# Module ${header?.moduleNumber ?? ''} — Leçon ${header?.lessonNumber ?? ''}`,
    `Titre : ${header?.title ?? ''}`,
    header?.objectives?.length
      ? `Objectifs :\n${header.objectives.map((o) => `- ${o}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const sectionsText = sections.map(extractSection).join('\n\n');
  return [headerText, sectionsText].filter(Boolean).join('\n\n');
}

/** Résumé court pour l'index de recherche */
export function summarizeModule(moduleDoc: ModuleDoc) {
  const { header } = moduleDoc;
  return {
    moduleNumber: header?.moduleNumber,
    lessonNumber: header?.lessonNumber,
    title: header?.title ?? '',
    objectives: header?.objectives ?? [],
    sectionTitles: (moduleDoc.sections ?? []).map((s) => s.title).filter(Boolean) as string[],
  };
}
