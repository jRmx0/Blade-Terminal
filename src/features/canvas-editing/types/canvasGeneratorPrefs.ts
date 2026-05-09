/**
 * Canvas Generator UI Preferences
 */

export interface CanvasGeneratorFloatingControlPrefs {
    isOpen: boolean;
    position: { x: number; y: number };
    values: {
        width: string;
        height: string;
        cellSize: string;
        obstacleRatio: string;
        clusteringRatio: string;
        seed: string;
        lastSeedHex: string | null;
    };
}
