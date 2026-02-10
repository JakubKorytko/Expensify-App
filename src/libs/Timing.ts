const namedStarts = new Map<string, number>();

/**
 * Lightweight timing between two actions. Uses Date.now() only; no Performance marks or observers.
 *
 * Same flow (pass token):
 *   const token = measureTiming.start();
 *   const ms = measureTiming.end(token);
 *
 * Across components (use name):
 *   measureTiming.startNamed('navigateToSearch');  // e.g. in NavigationTabBar
 *   const ms = measureTiming.endNamed('navigateToSearch');  // e.g. in Search onLayout
 */

/**
 * Start a named timer. Call endNamed(name) from any component to get the duration.
 */
function start(name: string): void {
    namedStarts.set(name, Date.now());
}

/**
 * Returns elapsed ms since startNamed(name), then clears the timer. Returns null if no start exists for name.
 */
function end(name: string): number | null {
    const startTime = namedStarts.get(name);
    namedStarts.delete(name);
    if (startTime == null) {
        return null;
    }
    console.log(`[Timing] ${name}: ${Date.now() - startTime}ms`);
    return Date.now() - startTime;
}

export default {
    start,
    end,
};
