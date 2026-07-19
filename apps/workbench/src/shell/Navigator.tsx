import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { setActivePanel } from "../store/editorSlice.js";
import type { EditorPanel } from "../store/types.js";

interface NavItem {
  id: EditorPanel;
  label: string;
}

const NAV_GROUPS: Array<{ group: string; items: NavItem[] }> = [
  {
    group: "MATERIAL",
    items: [
      { id: "source", label: "Source" },
      { id: "materials", label: "Banks & Samples" },
      { id: "forms", label: "Forms" },
    ],
  },
  {
    group: "INSTRUMENT",
    items: [
      { id: "instruments", label: "Devices" },
    ],
  },
  {
    group: "COMPOSITION",
    items: [
      { id: "composition", label: "Patterns" },
    ],
  },
  {
    group: "AUTOMATION",
    items: [
      { id: "automation", label: "Triggers" },
    ],
  },
  {
    group: "PERFORMANCE",
    items: [
      { id: "performance", label: "Cue & Surface" },
    ],
  },
  {
    group: "ARCHIVE",
    items: [
      { id: "archive", label: "Import & Export" },
    ],
  },
];

export function Navigator() {
  const dispatch = useAppDispatch();
  const activePanel = useAppSelector((s) => s.editor.activePanel);

  return (
    <nav id="tr-navigator" className="tr-navigator" aria-label="Editor sections">
      {NAV_GROUPS.map(({ group, items }) => (
        <section key={group} className="tr-navigator__group">
          <h2 className="tr-navigator__group-label">{group}</h2>
          <ul className="tr-navigator__list" role="list">
            {items.map((item) => (
              <li key={item.id} className="tr-navigator__item">
                <button
                  className={[
                    "tr-navigator__btn",
                    activePanel === item.id ? "tr-navigator__btn--active" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => dispatch(setActivePanel(item.id))}
                  aria-current={activePanel === item.id ? "page" : undefined}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
