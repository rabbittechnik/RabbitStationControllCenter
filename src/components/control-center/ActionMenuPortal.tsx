import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { computeActionMenuPlacement } from '../../utils/actionMenuPlacement';

const MENU_WIDTH = 248;
const MENU_Z_INDEX = 1200;

export type ActionMenuPortalProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  menuWidth?: number;
  ariaLabel?: string;
};

export function ActionMenuPortal({
  open,
  onClose,
  anchorRef,
  children,
  menuWidth = MENU_WIDTH,
  ariaLabel = 'Aktionen',
}: ActionMenuPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    const rect = anchor.getBoundingClientRect();
    const menuHeight = menu.offsetHeight || 280;
    const placement = computeActionMenuPlacement({
      anchor: rect,
      menuWidth,
      menuHeight,
    });
    setCoords(placement);
  }, [anchorRef, menuWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [open, updatePosition, children]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const onReposition = () => updatePosition();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, onClose, anchorRef, updatePosition]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      className="fixed rounded-lg border border-white/10 bg-navy-850 py-1 shadow-2xl ring-1 ring-black/20"
      style={{
        top: coords?.top ?? -9999,
        left: coords?.left ?? -9999,
        width: menuWidth,
        zIndex: MENU_Z_INDEX,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function ActionMenuItem({
  label,
  onClick,
  disabled,
  title,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/5 hover:text-neon-cyan disabled:cursor-not-allowed disabled:opacity-45"
    >
      {icon ? <span className="inline-flex h-4 w-4 shrink-0 text-slate-500">{icon}</span> : null}
      <span className="min-w-0 flex-1 whitespace-normal leading-snug">{label}</span>
    </button>
  );
}

export function ActionMenuDivider() {
  return <div className="my-1 border-t border-white/10" role="separator" />;
}
