
export interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export enum StatusType {
  Success = 'success',
  Error = 'error',
}

export interface AppStatus {
    type: StatusType;
    message: string;
}

export type CardSide = 'front' | 'back';

export interface CameraTarget {
    cardId: string;
    side: CardSide;
}

export type Priority = 'Low' | 'Medium' | 'High';

export interface CardData {
  id: string;
  frontImageFile: File | null;
  frontImagePreview: string | null;
  backImageFile: File | null;
  backImagePreview: string | null;
  priority: Priority;
  notes: string;
  showBack: boolean;
  showDetails: boolean;
}