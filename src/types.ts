/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'PAUSED';

export type ControlScheme = 'TOUCH_DIRECT' | 'TAP_FLAP';

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  controlScheme: ControlScheme;
  soundEnabled: boolean;
  shootingEnabled: boolean;
  scoreMultiplier: number;
}

export interface PlaneEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  targetY: number; // For touch tracking
  angle: number;
  lives: number;
  maxLives: number;
  invulnFrames: number;
  score: number;
  distance: number;
  bullets: number;
  propellerAngle: number;
  fuel: number;
  lastShotFrame: number;
}

export type ObstacleType = 'BLACK_CLOUD' | 'ENEMY_PLANE' | 'SPINNING_CRAYON';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  jitterOffset: number; // for sketch effect variation
  rotation: number;
  rotationSpeed: number;
  shootCooldown?: number;
}

export interface FriendlyCloud {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  scale: number;
  opacity: number;
  loopsCount: number; // structure factor for drawing
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isEnemy: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number; // remaining life frames
  maxLife: number;
  text?: string; // e.g. "+100" or scribble
}

export interface StarCollectible {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  angle: number;
  type: 'SCORE_STAR' | 'BULLET_RECHARGE' | 'LIFE_HEAL' | 'AMMO_PARACHUTE';
}
