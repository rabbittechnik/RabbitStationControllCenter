export type ActionMenuPlacementInput = {
  anchor: DOMRect;
  menuWidth: number;
  menuHeight: number;
  viewportWidth?: number;
  viewportHeight?: number;
  gap?: number;
  margin?: number;
};

export type ActionMenuPlacement = {
  top: number;
  left: number;
};

/**
 * Positioniert ein Dropdown per fixed coords relativ zum Anchor.
 * Öffnet nach links/oben, wenn rechts/unten nicht genug Platz ist.
 */
export function computeActionMenuPlacement(input: ActionMenuPlacementInput): ActionMenuPlacement {
  const {
    anchor,
    menuWidth,
    menuHeight,
    viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280,
    viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 720,
    gap = 4,
    margin = 8,
  } = input;

  const spaceBelow = viewportHeight - anchor.bottom - margin;
  const spaceAbove = anchor.top - margin;
  const openUp = menuHeight + gap > spaceBelow && spaceAbove > spaceBelow;

  let top = openUp ? anchor.top - menuHeight - gap : anchor.bottom + gap;
  top = Math.max(margin, Math.min(top, viewportHeight - menuHeight - margin));

  const spaceRight = viewportWidth - anchor.right - margin;
  const spaceLeft = anchor.left - margin;
  const preferRightAligned = anchor.right - menuWidth >= margin;
  let left = preferRightAligned ? anchor.right - menuWidth : anchor.left;

  if (left + menuWidth > viewportWidth - margin) {
    left = viewportWidth - menuWidth - margin;
  }
  if (left < margin) {
    left = margin;
  }

  if (spaceRight < menuWidth && spaceLeft >= spaceRight) {
    left = Math.max(margin, anchor.left - menuWidth);
  }

  return { top, left };
}
