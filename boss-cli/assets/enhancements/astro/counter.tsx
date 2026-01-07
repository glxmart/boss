import { useState } from 'react';

/**
 * Example React component (island) for Astro.
 *
 * React components in Astro are "islands" - interactive parts
 * of an otherwise static page.
 *
 * Usage in .astro files:
 * ```astro
 * ---
 * import Counter from '../components/Counter';
 * ---
 *
 * <Counter client:load />
 * ```
 *
 * Hydration directives:
 * - client:load - Hydrate immediately on page load
 * - client:idle - Hydrate when browser is idle
 * - client:visible - Hydrate when component is visible
 * - client:media="(min-width: 768px)" - Hydrate on media query match
 */
export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <button
        onClick={() => setCount((prev) => prev - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-700 transition-colors hover:bg-gray-200"
        aria-label="Decrement"
      >
        -
      </button>

      <span className="min-w-[3rem] text-center text-2xl font-bold tabular-nums">{count}</span>

      <button
        onClick={() => setCount((prev) => prev + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white transition-colors hover:bg-primary-700"
        aria-label="Increment"
      >
        +
      </button>
    </div>
  );
}
