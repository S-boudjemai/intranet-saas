// src/components/ui/index.ts
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type { CardProps } from './Card';

export { default as Input, TextArea } from './Input';
export type { InputProps } from './Input';

export { default as Loading, SkeletonLoader, CardSkeleton, ListSkeleton, TableSkeleton } from './Loading';
export type { LoadingProps } from './Loading';

export { default as Modal, ConfirmModal, AlertModal } from './Modal';
export type { ModalProps } from './Modal';

export { 
  PageTransition, 
  ContentTransition, 
  ListTransition, 
  TabTransition,
  useStaggeredAnimation 
} from './PageTransition';

export { 
  PageHeader, 
  PageContent, 
  PageCard, 
  PageList, 
  TabContent,
  useGridAnimation 
} from './PageAnimations';

// Réexport du Badge existant si il existe
export { default as Badge } from './Badge';