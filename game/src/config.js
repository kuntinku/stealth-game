// nightfall: tuning constants for the whole game.
export const TILE = 32;                 // pixels per map tile
export const VIEW_W = 960;              // canvas width
export const VIEW_H = 600;              // canvas height

// player movement speeds, px/s
export const SPEED_RUN = 150;
export const SPEED_WALK = 105;
export const SPEED_SNEAK = 60;

// noise radius per movement mode, px (guards hear you inside it)
export const NOISE_RUN = 110;
export const NOISE_WALK = 55;
export const NOISE_SNEAK = 12;
export const WHISTLE_NOISE = 260;       // E = whistle lure

// vision cones
export const GUARD_RANGE = 230;
export const GUARD_HALF_ANGLE = Math.PI / 6;   // 30 degrees
export const PLAYER_LIGHT_RANGE = 150;

// detection meter, 0..1
export const DETECT_RATE = 1.4;         // per second at point blank, falls with distance
export const DETECT_COOL = 0.8;         // decay per second out of sight
export const CATCH_RADIUS = 22;         // guard touches you while alert = caught
export const SEARCH_TIME = 6;           // seconds a guard searches before calming

// world
export const INTEL_TOTAL = 3;
export const ALARM_DECAY = 0.05;        // alarm level cools per second while hidden
