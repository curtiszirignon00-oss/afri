// src/components/community/CommunitySectionBar.tsx
import { SECTION_CONFIG, SECTION_ORDER, type CommunitySection } from '../../config/communitySections';

interface Props {
    active: CommunitySection;
    onChange: (section: CommunitySection) => void;
}

export default function CommunitySectionBar({ active, onChange }: Props) {
    return (
        <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {SECTION_ORDER.map((key) => {
                    const cfg = SECTION_CONFIG[key];
                    const isActive = active === key;
                    const Icon = cfg.icon;
                    return (
                        <button
                            key={key}
                            onClick={() => onChange(key)}
                            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                                isActive
                                    ? 'bg-brand-navy text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {cfg.label}
                        </button>
                    );
                })}
            </div>
            <p className="text-sm text-gray-500 px-1">{SECTION_CONFIG[active].description}</p>
        </div>
    );
}
