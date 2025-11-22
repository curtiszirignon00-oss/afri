// src/components/learning/ContentRenderer.tsx
import React from 'react';
import {
  Lightbulb, Globe, Book, ArrowRightLeft,
  CheckCircle, AlertCircle, Info
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface ContentBlock {
  type: string;
  content: any;
}

// Structure complète d'un module JSON
export interface ModuleContent {
  header: {
    moduleNumber: number;
    lessonNumber: number;
    title: string;
    objectives: string[];
  };
  sections: {
    type: string;
    number: string;
    title: string;
    blocks: ContentBlock[];
  }[];
  glossary?: {
    term: string;
    definition: string;
  }[];
}

interface ContentRendererProps {
  blocks?: ContentBlock[];
  moduleContent?: ModuleContent;
  sectionNumber?: string;
}

// ============================================
// MAIN CONTENT RENDERER
// ============================================

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  blocks,
  moduleContent,
  sectionNumber
}) => {
  // Si on a un moduleContent complet, on affiche la structure complète
  if (moduleContent) {
    return (
      <div className="space-y-8">
        {/* Header avec objectifs */}
        <ModuleHeader header={moduleContent.header} />

        {/* Sections */}
        {moduleContent.sections.map((section, index) => (
          <ModuleSection key={index} section={section} />
        ))}

        {/* Glossaire */}
        {moduleContent.glossary && moduleContent.glossary.length > 0 && (
          <GlossarySection terms={moduleContent.glossary} />
        )}
      </div>
    );
  }

  // Fallback: si on a juste des blocks
  if (blocks) {
    return (
      <div className="space-y-6">
        {blocks.map((block, index) => (
          <BlockRenderer
            key={index}
            block={block}
            sectionNumber={sectionNumber}
          />
        ))}
      </div>
    );
  }

  return null;
};

// ============================================
// MODULE HEADER (avec objectifs)
// ============================================

interface ModuleHeaderProps {
  header: ModuleContent['header'];
}

const ModuleHeader: React.FC<ModuleHeaderProps> = ({ header }) => {
  return (
    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
      <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-4">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Objectif Pédagogique
      </h3>
      <p className="text-sm text-blue-800 mb-3">À la fin de ce module, vous serez capable :</p>
      <ul className="space-y-2">
        {header.objectives.map((obj, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {obj}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ============================================
// MODULE SECTION (carte blanche avec numéro)
// ============================================

interface ModuleSectionProps {
  section: ModuleContent['sections'][0];
}

const ModuleSection: React.FC<ModuleSectionProps> = ({ section }) => {
  return (
    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-lg">
          {section.number}
        </span>
        {section.title}
      </h2>

      {section.blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
    </div>
  );
};

// ============================================
// BLOCK RENDERER (Intelligent Switching)
// ============================================

const BlockRenderer: React.FC<{
  block: ContentBlock;
  sectionNumber?: string;
}> = ({ block, sectionNumber }) => {

  switch (block.type) {
    case 'section-header':
      return <SectionHeader {...block.content} sectionNumber={sectionNumber} />;

    case 'subsection':
      return <Subsection {...block.content} />;

    case 'paragraph':
      return <Paragraph {...block.content} />;

    case 'paragraph-group':
      return <ParagraphGroup {...block.content} />;

    case 'analogy':
      return <AnalogyBox {...block.content} />;

    case 'table':
      return <TableBlock {...block.content} />;

    case 'info-box':
      return <InfoBox {...block.content} />;

    case 'grid-cards':
      return <GridCards {...block.content} />;

    case 'country-badges':
      return <CountryBadges {...block.content} />;

    case 'glossary':
      return <GlossarySection {...block.content} />;

    case 'list':
      return <ListBlock {...block.content} />;

    default:
      return null;
  }
};

// ============================================
// SECTION HEADER
// ============================================

interface SectionHeaderProps {
  title: string;
  sectionNumber?: string;
  intro?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  sectionNumber,
  intro
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
        {sectionNumber && (
          <span className="text-base font-semibold text-slate-500">
            {sectionNumber}
          </span>
        )}
        {title}
      </h2>
      {intro && (
        <p className="text-slate-600 leading-relaxed">
          {intro}
        </p>
      )}
    </div>
  );
};

// ============================================
// SUBSECTION (Card blanche avec icône)
// ============================================

interface SubsectionProps {
  icon?: string;
  title: string;
  content: string;
  additionalContent?: React.ReactNode;
}

const Subsection: React.FC<SubsectionProps> = ({
  icon,
  title,
  content,
  additionalContent
}) => {
  const IconComponent = getIconComponent(icon);

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-100">
      <div className="flex items-start gap-4">
        {IconComponent && (
          <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
            <IconComponent className="w-6 h-6 text-blue-600" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-lg mb-3">
            {title}
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            {content}
          </p>
          {additionalContent}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PARAGRAPH (Simple)
// ============================================

const Paragraph: React.FC<{ content: string }> = ({ content }) => {
  return (
    <p className="text-slate-600 leading-relaxed">
      {content}
    </p>
  );
};

// ============================================
// PARAGRAPH GROUP (2-3 paragraphes liés)
// ============================================

const ParagraphGroup: React.FC<{ paragraphs: string[] }> = ({ paragraphs }) => {
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-slate-600 leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
};

// ============================================
// ANALOGY BOX (Style amber)
// ============================================

interface AnalogyBoxProps {
  title: string;
  intro: string;
  zones?: { label: string; description: string; emoji?: string }[];
  conclusion?: string;
  // Alternative: contenu HTML brut
  htmlContent?: string;
}

const AnalogyBox: React.FC<AnalogyBoxProps> = ({
  title,
  intro,
  zones,
  conclusion,
  htmlContent
}) => {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl">
      <h3 className="text-amber-900 font-bold flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5" />
        L'analogie à retenir : {title}
      </h3>

      {htmlContent ? (
        // Si on a du contenu HTML brut
        <p
          className="text-amber-800 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        // Sinon on utilise la structure zones
        <>
          <p className="text-amber-800 text-sm leading-relaxed mb-4">
            {intro}
          </p>

          {zones && zones.length > 0 && (
            <div className="space-y-1 mb-4">
              {zones.map((zone, i) => (
                <p key={i} className="text-amber-800 text-sm leading-relaxed">
                  {zone.emoji || '👉'} <strong>{zone.label} :</strong> {zone.description}
                </p>
              ))}
            </div>
          )}

          {conclusion && (
            <p className="text-amber-800 text-sm leading-relaxed mt-4">
              {conclusion}
            </p>
          )}
        </>
      )}
    </div>
  );
};

// ============================================
// TABLE BLOCK
// ============================================

interface TableBlockProps {
  headers: string[];
  rows: (string | { value: string; emphasis?: boolean })[][];
  highlightFirstRow?: boolean;
}

const TableBlock: React.FC<TableBlockProps> = ({
  headers,
  rows,
  highlightFirstRow = false
}) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 text-slate-700">
            {headers.map((header, i) => (
              <th
                key={i}
                className="p-4 text-left font-semibold border-b border-slate-200"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={
                highlightFirstRow && rowIndex === 0
                  ? 'bg-blue-50'
                  : rowIndex % 2 === 0
                    ? 'bg-slate-50'
                    : 'bg-white'
              }
            >
              {row.map((cell, cellIndex) => {
                const cellContent = typeof cell === 'string' ? cell : cell.value;
                const isEmphasis = typeof cell === 'object' && cell.emphasis;

                return (
                  <td
                    key={cellIndex}
                    className={`p-4 border-b border-slate-100 ${
                      isEmphasis ? 'font-semibold text-blue-800' : 'text-slate-600'
                    } ${cellIndex === 0 && rowIndex === 0 ? 'font-bold' : ''}`}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// INFO BOX
// ============================================

interface InfoBoxProps {
  icon?: 'info' | 'alert' | 'check' | 'arrow';
  content: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({ icon = 'arrow', content }) => {
  const icons = {
    info: <Info className="w-5 h-5" />,
    alert: <AlertCircle className="w-5 h-5" />,
    check: <CheckCircle className="w-5 h-5" />,
    arrow: <ArrowRightLeft className="w-5 h-5" />,
  };

  return (
    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
      <div className="text-slate-400 flex-shrink-0 mt-0.5">
        {icons[icon]}
      </div>
      <p
        className="text-sm text-slate-600 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

// ============================================
// GRID CARDS
// ============================================

interface GridCardsProps {
  title?: string;
  cards: { title: string; description: string }[];
  columns?: 2 | 3;
}

const GridCards: React.FC<GridCardsProps> = ({
  title,
  cards,
  columns = 2
}) => {
  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
      {title && (
        <h4 className="font-bold text-slate-900 mb-4">{title}</h4>
      )}
      <div className={`grid grid-cols-1 ${
        columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
      } gap-4`}>
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-slate-200">
            <h5 className="font-bold text-blue-600 mb-1 text-sm">
              {card.title}
            </h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// COUNTRY BADGES
// ============================================

interface CountryBadgesProps {
  countries: string[];
  metadata?: string;
}

const CountryBadges: React.FC<CountryBadgesProps> = ({
  countries,
  metadata
}) => {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {countries.map((country, i) => (
          <span
            key={i}
            className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200"
          >
            {country}
          </span>
        ))}
      </div>
      {metadata && (
        <p className="text-xs text-slate-400 mt-3">
          {metadata}
        </p>
      )}
    </div>
  );
};

// ============================================
// GLOSSARY SECTION
// ============================================

interface GlossarySectionProps {
  terms: { term: string; definition: string }[];
}

const GlossarySection: React.FC<GlossarySectionProps> = ({ terms }) => {
  return (
    <div className="bg-slate-50 rounded-xl p-8">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
        <Book className="w-5 h-5 text-slate-400" />
        Termes à maîtriser
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {terms.map((term, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              {term.term}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {term.definition}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// LIST BLOCK
// ============================================

interface ListBlockProps {
  items: string[];
  ordered?: boolean;
  title?: string;
}

const ListBlock: React.FC<ListBlockProps> = ({ items, ordered = false, title }) => {
  return (
    <div className={title ? "bg-slate-50 p-4 rounded-xl border border-slate-100" : ""}>
      {title && (
        <h4 className="font-bold text-slate-900 mb-3 text-sm uppercase">{title}</h4>
      )}
      {ordered ? (
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ol>
      ) : (
        <ul className="space-y-2 list-disc list-inside text-slate-600">
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      )}
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getIconComponent(iconName?: string) {
  const icons: Record<string, any> = {
    globe: Globe,
    lightbulb: Lightbulb,
    book: Book,
    info: Info,
  };

  return iconName ? icons[iconName] : null;
}

// Export all components for individual use
export {
  SectionHeader,
  Subsection,
  Paragraph,
  ParagraphGroup,
  AnalogyBox,
  TableBlock,
  InfoBox,
  GridCards,
  CountryBadges,
  GlossarySection,
  ListBlock
};

export default ContentRenderer;
