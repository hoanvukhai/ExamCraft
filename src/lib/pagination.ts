export type PageUnit = {
  /** Distance from the top of the sheet, with no push applied yet. */
  top: number;
  height: number;
  /** Always starts a new page ("Bắt đầu ở trang mới"). */
  force?: boolean;
};

export type PageGeometry = {
  /** Height of one page in px (A4 is 1122.5px at 96dpi). */
  page: number;
  padTop: number;
  padBottom: number;
};

export type PageResult = {
  /** Extra space to add above each unit so that it starts a page, in px. */
  push: number[];
  /** The page (0-based) each unit starts on. */
  pageOf: number[];
  pages: number;
};

/**
 * Put whole blocks on pages. A block that does not fit in what is left of its page moves to the top of the next
 * page; only a block taller than a whole page is left to run over the page line. The first block never moves.
 */
export function paginate(units: PageUnit[], geometry: PageGeometry, tailBottom = 0): PageResult {
  const { page, padTop, padBottom } = geometry;
  const usable = page - padTop - padBottom;
  const push: number[] = [];
  const pageOf: number[] = [];
  let shift = 0;
  let bottom = 0;
  units.forEach((unit, index) => {
    const top = unit.top + shift;
    const current = Math.floor((top + 0.5) / page);
    const pageStart = current * page + padTop;
    const limit = (current + 1) * page - padBottom;
    const atStart = top <= pageStart + 4;
    let delta = 0;
    if (index > 0 && !atStart && (unit.force || (top + unit.height > limit + 0.5 && unit.height <= usable)))
      delta = (current + 1) * page + padTop - top;
    push.push(delta);
    shift += delta;
    const placed = top + delta;
    pageOf.push(Math.floor((placed + 0.5) / page));
    bottom = Math.max(bottom, placed + unit.height);
  });
  const end = Math.max(bottom, tailBottom + shift);
  return { push, pageOf, pages: Math.max(1, Math.ceil((end + padBottom - 0.5) / page)) };
}
