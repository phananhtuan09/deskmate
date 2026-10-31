export interface DragFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Screen-space hit test for a card dropped on a column. `slop` covers the gap between columns.
export function columnAtPoint<Column extends string>(frames: Partial<Record<Column, DragFrame>>, order: readonly Column[], x: number, y: number, slop = 6): Column | null {
  for (const column of order) {
    const frame = frames[column];
    if (!frame) continue;
    if (x < frame.x - slop || y < frame.y - slop || x > frame.x + frame.width + slop || y > frame.y + frame.height + slop) continue;
    return column;
  }
  return null;
}
