import type { MouseEvent, ReactNode } from "react";

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function AppModal({ open, onClose, children }: AppModalProps) {
  if (!open) return null;

  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => event.stopPropagation();
  return (
    <div onClick={onClose} className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm">
      <div onClick={stopPropagation} className="max-h-[calc(100vh-40px)] max-w-full overflow-auto">{children}</div>
    </div>
  );
}
