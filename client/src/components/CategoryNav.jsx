import React, { useEffect, useRef, useState } from "react";
import { LABELS } from "../lib/events.js";

export default function CategoryNav({ model }) {
  const host = useRef(null);
  const links = useRef(null);
  const [compact, setCompact] = useState(true);
  const categories = [["", "All listings"], ...Object.entries(LABELS)];
  function destination(category) {
    const params = new URLSearchParams(model.query);
    params.delete("page");
    category ? params.set("category", category) : params.delete("category");
    return (
      (model.path === "/" ? "/" : model.path) +
      (params.size ? "?" + params : "")
    );
  }
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setCompact(links.current.scrollWidth > host.current.clientWidth);
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="category-host" ref={host}>
      <nav
        className={"category-links " + (compact ? "measuring" : "")}
        ref={links}
        aria-label="Event categories"
        aria-hidden={compact}
      >
        {categories.map(([id, label]) => (
          <a
            key={id}
            href={destination(id)}
            tabIndex={compact ? -1 : undefined}
            aria-current={model.filters.category === id ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      {compact && (
        <form className="category-picker" method="get" action={model.path}>
          <label htmlFor="quick-category">Category</label>
          <select
            id="quick-category"
            name="category"
            defaultValue={model.filters.category}
            onChange={(event) => {
              window.location.href = destination(event.target.value);
            }}
          >
            {categories.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <noscript>
            <button type="submit">Apply</button>
          </noscript>
        </form>
      )}
    </div>
  );
}
