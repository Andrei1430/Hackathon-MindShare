import { ArrowRight, Tag } from 'lucide-react';

interface TopicSuggestion {
  title: string;
  description: string;
  tags: string[];
}

interface SuggestionCardProps {
  suggestion: TopicSuggestion;
  onSelect: () => void;
}

export default function SuggestionCard({ suggestion, onSelect }: SuggestionCardProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 bg-white border border-[#AFB6D2]/20 rounded-lg hover:border-[#27A4F6] hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#1A2633] mb-1 group-hover:text-[#27A4F6] transition-colors">
            {suggestion.title}
          </h4>
          <p className="text-xs text-[#AFB6D2] mb-2 line-clamp-2">
            {suggestion.description}
          </p>
          {suggestion.tags && suggestion.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestion.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#27A4F6]/10 text-[#27A4F6] rounded text-xs"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-[#AFB6D2] group-hover:text-[#27A4F6] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
