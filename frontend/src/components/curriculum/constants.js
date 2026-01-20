import { FileText, HelpCircle, Puzzle, ListChecks, Edit3 } from 'lucide-react';

export const API = process.env.REACT_APP_BACKEND_URL;

export const NIVEAU_LABELS = {
  G: { name: 'Grundlegend', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  M: { name: 'Mittel', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  E: { name: 'Erweitert', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
};

export const MATERIAL_TYPEN = [
  { id: 'arbeitsblatt', name: 'Arbeitsblatt', icon: FileText },
  { id: 'quiz', name: 'Quiz', icon: HelpCircle },
  { id: 'raetsel', name: 'Kreuzworträtsel', icon: Puzzle },
  { id: 'zuordnung', name: 'Zuordnung', icon: ListChecks },
  { id: 'lueckentext', name: 'Lückentext', icon: Edit3 }
];
