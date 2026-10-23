import { afterRender, stateCell } from '../native/dom.js';
/**
 * Ticking clock for the "AI is working" elapsed time and relative timestamps.
 * Ticks only while `active`, so an idle screen costs nothing.
 */
export function useNow(active, intervalMs = 500) {
    const [now, setNow] = stateCell(() => Date.now());
    afterRender(() => {
        if (!active)
            return;
        setNow(Date.now());
        const id = window.setInterval(() => setNow(Date.now()), intervalMs);
        return () => window.clearInterval(id);
    }, [active, intervalMs]);
    return now;
}
