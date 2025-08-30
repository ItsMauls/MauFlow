export interface IconConfig {
  id: string;
  name: string;
  emoji: string;
  category: 'status' | 'priority' | 'general';
}

export interface IconSettings {
  titleIcon: string;
  defaultIcons: {
    status: Record<string, string>;
    priority: Record<string, string>;
  };
  customIcons: IconConfig[];
}

export interface IconManagerProps {
  currentIcon?: string;
  availableIcons: IconConfig[];
  onIconSelect: (iconId: string) => void;
  editable?: boolean;
  className?: string;
}

export interface IconSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onIconSelect: (iconId: string) => void;
  currentIcon?: string;
  availableIcons: IconConfig[];
  title?: string;
}

export type IconCategory = 'status' | 'priority' | 'general';