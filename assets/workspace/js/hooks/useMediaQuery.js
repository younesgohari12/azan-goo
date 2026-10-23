import { afterRender, stateCell } from '../native/dom.js';
export function useMediaQuery(query) {
    const [matches, setMatches] = stateCell(() => typeof window === 'undefined' ? false : window.matchMedia(query).matches);
    afterRender(() => {
        const list = window.matchMedia(query);
        const update = () => setMatches(list.matches);
        update();
        list.addEventListener('change', update);
        return () => list.removeEventListener('change', update);
    }, [query]);
    return matches;
}
/** Breakpoints used by the layout (desktop drawers vs. docks). */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsWide = () => useMediaQuery('(min-width: 1280px)');
