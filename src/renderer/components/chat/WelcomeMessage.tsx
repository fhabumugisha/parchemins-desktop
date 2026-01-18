import { MessageSquare, Search, FileText, Sparkles } from 'lucide-react';

interface WelcomeMessageProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function WelcomeMessage({ onSuggestionClick }: WelcomeMessageProps) {
  const suggestions = [
    { icon: Search, text: 'Trouve mes sermons sur la grace' },
    { icon: FileText, text: 'Resume mon dernier sermon' },
    { icon: Sparkles, text: 'Quels themes pour Paques ?' },
    { icon: MessageSquare, text: 'Ai-je deja parle du pardon ?' },
  ];

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <MessageSquare className="w-8 h-8 text-burgundy" />
      </div>

      <h2 className="text-2xl font-serif text-burgundy mb-3">Bienvenue, cher pasteur</h2>

      <p className="text-muted mb-8 max-w-md mx-auto">
        Posez-moi vos questions sur vos sermons. Je peux rechercher, resumer, comparer et vous aider a preparer vos
        predications.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {suggestions.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onSuggestionClick(text)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-left bg-white border border-gray-200 rounded-xl hover:border-burgundy hover:bg-burgundy/5 transition-colors"
          >
            <Icon className="w-4 h-4 text-burgundy flex-shrink-0" />
            <span className="text-gray-700">{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
