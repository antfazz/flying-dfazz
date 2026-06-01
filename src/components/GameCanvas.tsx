/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useRef, useEffect, useState } from 'react';
import { GameState, GameSettings, PlaneEntity, Obstacle, FriendlyCloud, Bullet, Particle, StarCollectible } from '../types';
import { drawNotebookBackground, drawDoodlePlane, drawFriendlyCloud, drawBlackCloud, drawEnemyPlane, drawStarCollectible, drawBullet, drawParticle } from './DoodleRenderer';
import { audio } from '../utils/audio';
import { 
  Heart, 
  Layers, 
  Volume2, 
  VolumeX, 
  Pause, 
  RotateCcw,
  Zap,
  Target
} from 'lucide-react';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  settings: GameSettings;
  updateScoreAndDistance: (score: number, distance: number) => void;
  onGameOver: (finalScore: number, finalDistance: number) => void;
  triggerResetRef: React.MutableRefObject<(() => void) | null>;
}

// Fixed internal arena size for physics stability; CSS scales the canvas beautifully
const GAME_WIDTH = 850;
const GAME_HEIGHT = 480;

export default function GameCanvas({
  gameState,
  setGameState,
  settings,
  updateScoreAndDistance,
  onGameOver,
  triggerResetRef,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core Game Loop State
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [bullets, setBullets] = useState(15);
  const [isGamePaused, setIsGamePaused] = useState(false);

  // Keep references to mute stale closure issues in the render loop animations
  const stateRef = useRef<{
    gameState: GameState;
    plane: PlaneEntity;
    obstacles: Obstacle[];
    friendlyClouds: FriendlyCloud[];
    bullets: Bullet[];
    particles: Particle[];
    starCollectibles: StarCollectible[];
    frameCount: number;
    score: number;
    distance: number;
    screenShake: number;
    isPointerDown: boolean;
    keys: { [key: string]: boolean };
  }>({
    gameState: 'MENU',
    plane: createDefaultPlane(),
    obstacles: [],
    friendlyClouds: [],
    bullets: [],
    particles: [],
    starCollectibles: [],
    frameCount: 0,
    score: 0,
    distance: 0,
    screenShake: 0,
    isPointerDown: false,
    keys: {},
  });

  // Export local state properties to variables occasionally for HUD binding
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  function createDefaultPlane(): PlaneEntity {
    const startingLives = settings.difficulty === 'easy' ? 4 : settings.difficulty === 'hard' ? 2 : 3;
    return {
      x: 80,
      y: GAME_HEIGHT / 2 - 20,
      width: 75,
      height: 40,
      vy: 0,
      targetY: GAME_HEIGHT / 2,
      angle: 0,
      lives: startingLives,
      maxLives: startingLives,
      invulnFrames: 0,
      score: 0,
      distance: 0,
      bullets: settings.difficulty === 'easy' ? 25 : settings.difficulty === 'hard' ? 10 : 15,
      propellerAngle: 0,
      fuel: 100,
      lastShotFrame: 0,
    };
  }

  // Register parent triggers (e.g. from the MenuOverlay play/restart actions)
  useEffect(() => {
    triggerResetRef.current = restartGame;
    return () => {
      triggerResetRef.current = null;
    };
  }, [settings.difficulty]);

  // Restart the game context
  function restartGame() {
    const defaultPlane = createDefaultPlane();
    setLives(defaultPlane.lives);
    setScore(0);
    setDistance(0);
    setBullets(defaultPlane.bullets);
    setIsGamePaused(false);

    stateRef.current.plane = defaultPlane;
    stateRef.current.obstacles = [];
    stateRef.current.friendlyClouds = createInitialFriendlyClouds();
    stateRef.current.bullets = [];
    stateRef.current.particles = [];
    stateRef.current.starCollectibles = [];
    stateRef.current.score = 0;
    stateRef.current.distance = 0;
    stateRef.current.screenShake = 0;
    stateRef.current.frameCount = 0;

    audio.stopMotor();
    if (gameState === 'PLAYING') {
      audio.startMotor();
    }
  }

  function createInitialFriendlyClouds(): FriendlyCloud[] {
    const initial: FriendlyCloud[] = [];
    // Distribute 4 starter clouds across the landscape
    for (let i = 0; i < 4; i++) {
      initial.push({
        id: `cloud_init_${i}`,
        x: (GAME_WIDTH / 4) * i + Math.random() * 80,
        y: 40 + Math.random() * (GAME_HEIGHT - 120),
        width: 100,
        height: 60,
        vx: -(0.5 + Math.random() * 0.8),
        scale: 0.7 + Math.random() * 0.6,
        opacity: 0.65 + Math.random() * 0.35,
        loopsCount: 4,
      });
    }
    return initial;
  }

  // Trigger weapon firing
  const firePlaneBullet = () => {
    if (gameState !== 'PLAYING' || isGamePaused) return;
    const { plane, frameCount } = stateRef.current;
    
    // Enforce moderate shooter firewall cooldown
    if (frameCount - plane.lastShotFrame < 10) return;
    if (plane.bullets <= 0 && settings.shootingEnabled) {
      // Empty tank warning particles
      spawnParticles(plane.x + plane.width, plane.y + plane.height / 2, 'rgba(0,0,0,0.4)', 3, 'No Ammo!');
      return;
    }

    if (settings.shootingEnabled) {
      plane.bullets -= 1;
      setBullets(plane.bullets);
    } else {
      // Always allow firing if weapon system is bypassed
    }

    plane.lastShotFrame = frameCount;

    // Play synthesized pencil-pop sound
    audio.playShoot();

    // Add bullet structure
    stateRef.current.bullets.push({
      id: `bullet_player_${Date.now()}_${Math.random()}`,
      x: plane.x + plane.width - 5,
      y: plane.y + plane.height / 2 + 2,
      vx: 9.5, // fast linear trajectory
      vy: plane.vy * 0.15, // mild climbing velocity skew
      radius: 4,
      isEnemy: false,
    });

    // Flash small recoil sparkles
    spawnParticles(plane.x + plane.width + 2, plane.y + plane.height / 2, '#e67e22', 4);
  };

  // Setup initial key listeners for desktop keybinding support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { keys } = stateRef.current;
      keys[e.key.toLowerCase()] = true;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // prevent scrolling
        firePlaneBullet();
      }
      if (e.key.toLowerCase() === 'p') {
        togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { keys } = stateRef.current;
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isGamePaused, bullets, settings.shootingEnabled]);

  // Handle touch interactions safely across tablet aspect ratios (relative pointer movement!)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || isGamePaused) return;
    stateRef.current.isPointerDown = true;
    stateRef.current.lastPointerX = e.clientX;
    stateRef.current.lastPointerY = e.clientY;

    // Set pointer capture to track moves smoothly even outside the canvas boundaries!
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // safe fallback if not supported in iframe sandbox
    }

    // Direct tap initial snap:
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;
      const targetY = (e.clientY - rect.top) * scaleY;
      const targetX = (e.clientX - rect.left) * scaleX;
      
      const { plane } = stateRef.current;
      plane.targetY = Math.max(25, Math.min(GAME_HEIGHT - 45, targetY));
      // Give initial target horizontal position clamped to halfway
      plane.x = Math.max(30, Math.min(GAME_WIDTH / 2, targetX - plane.width / 2));
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { isPointerDown, lastPointerX, lastPointerY, plane } = stateRef.current;
    if (gameState !== 'PLAYING' || isGamePaused || !isPointerDown) return;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;

      const dx = (e.clientX - lastPointerX) * scaleX;
      const dy = (e.clientY - lastPointerY) * scaleY;

      // Update plane position directly based on dragging deltas!
      plane.x = Math.max(30, Math.min(GAME_WIDTH / 2, plane.x + dx));
      plane.y = Math.max(10, Math.min(GAME_HEIGHT - 45, plane.y + dy));
      plane.targetY = plane.y + plane.height / 2;
    }

    stateRef.current.lastPointerX = e.clientX;
    stateRef.current.lastPointerY = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.isPointerDown = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // safe fallback
    }
  };

  // Toggle paused mode helper
  const togglePause = () => {
    if (gameState !== 'PLAYING') return;
    setIsGamePaused(prev => {
      const newVal = !prev;
      if (newVal) {
        audio.stopMotor();
      } else {
        audio.startMotor();
      }
      return newVal;
    });
  };

  // Helper to spawn explosion graphite crumbs
  function spawnParticles(x: number, y: number, color: string, count: number = 8, text?: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = text ? 0.8 : 1.5 + Math.random() * 3;
      stateRef.current.particles.push({
        id: `p_${Date.now()}_${Math.random()}_${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (text ? 1.0 : 0),
        radius: 2 + Math.random() * 4,
        color,
        life: text ? 55 : 30 + Math.floor(Math.random() * 20),
        maxLife: text ? 55 : 45,
        text,
      });
    }
  }

  // CORE ENGINE LOGIC loop running nested inside canvas animation frame
  useEffect(() => {
    if (gameState === 'MENU' || gameState === 'GAMEOVER') {
      audio.stopMotor();
    }
    if (gameState !== 'PLAYING' || isGamePaused) return;

    audio.startMotor();

    let animationID: number;
    let lastTime = performance.now();
    
    const update = () => {
      const { 
        plane, 
        obstacles, 
        friendlyClouds, 
        bullets, 
        particles, 
        starCollectibles, 
        keys, 
        isPointerDown,
        frameCount 
      } = stateRef.current;
      
      const now = performance.now();
      let dt = now - lastTime;
      lastTime = now;
      
      // Target frame time is 16.67ms (60 FPS).
      if (isNaN(dt) || dt <= 0) dt = 16.67;
      let frameComp = dt / 16.67;
      if (frameComp > 3.0) frameComp = 3.0; // avoid clipping/teleportation jumps
      
      const newFrameCount = frameCount + 1;
      stateRef.current.frameCount = newFrameCount;

      // Match speed coefficients depending on difficulty levels chosen
      const speedMultiplier = settings.difficulty === 'easy' ? 0.75 : settings.difficulty === 'hard' ? 1.35 : 1.0;

      // 1. UPDATE MILEAGE & SCORES (Frame rate compensated!)
      stateRef.current.distance += 0.08 * speedMultiplier * frameComp;
      const roundedDist = Math.round(stateRef.current.distance);
      setDistance(roundedDist);

      // Squeeze mini tick marks into standard score state
      const computedScore = stateRef.current.score + (newFrameCount % 150 === 0 ? 10 : 0);
      updateScoreAndDistance(computedScore, stateRef.current.distance);

      // Decrement invulnerability frame timer safely
      if (plane.invulnFrames > 0) {
        plane.invulnFrames = Math.max(0, plane.invulnFrames - frameComp);
      }

      // 2. UPDATE PLANE POSITION (AERODYNAMIC HEAVY PHYSICS INTERPOLATION)
      // Check keyboard keybinding overrides (W/S or Up/Down directional mapping)
      if (keys['w'] || keys['arrowup']) {
        plane.targetY = Math.max(25, plane.targetY - 5.5 * frameComp);
      }
      if (keys['s'] || keys['arrowdown']) {
        plane.targetY = Math.min(GAME_HEIGHT - 45, plane.targetY + 5.5 * frameComp);
      }
      
      // Horizontal key movement: A/D or ArrowLeft/ArrowRight (clamped to halfway of horizontal screen width!)
      if (keys['a'] || keys['arrowleft']) {
        plane.x = Math.max(30, plane.x - 4.5 * speedMultiplier * frameComp);
      }
      if (keys['d'] || keys['arrowright']) {
        plane.x = Math.min(GAME_WIDTH / 2, plane.x + 4.5 * speedMultiplier * frameComp);
      }

      // Smooth horizontal hover
      const hoverOscillation = Math.sin(newFrameCount * 0.06) * 0.45;
      
      // Interpolate plane vertical center toward target position
      const diffY = (plane.targetY - (plane.y + plane.height / 2)) + hoverOscillation;
      const lerpFactor = 1 - Math.pow(1 - 0.12, frameComp);
      plane.vy = diffY * lerpFactor; // drag ratio
      plane.y += plane.vy * frameComp;
      
      // Aerodynamic pitch angle rotation
      plane.angle = Math.max(-0.25, Math.min(0.25, plane.vy * 0.04));
      
      // Rotate active propeller hub
      plane.propellerAngle += (0.28 + Math.abs(plane.vy * 0.02)) * frameComp;

      // Pitch the Web Audio hum context
      const verticalRatio = (GAME_HEIGHT - plane.y) / GAME_HEIGHT;
      const normalizedVelocity = Math.max(-1, Math.min(1, plane.vy / 10));
      audio.updateMotorPitch(normalizedVelocity, verticalRatio);

      // 3. SPAWNING ENGINE (WHITE CLOUDS, BLACK CHARCOAL CRUSHERS, GLIDERS, BONUS STARS)
      
      // A. Drifting scenery clouds
      if (friendlyClouds.length < 5 && Math.random() < 0.008) {
        friendlyClouds.push({
          id: `cloud_drift_${Date.now()}`,
          x: GAME_WIDTH + 120,
          y: Math.random() * (GAME_HEIGHT - 130) + 15,
          width: 90 + Math.random() * 50,
          height: 50 + Math.random() * 30,
          vx: -(0.4 + Math.random() * 0.8) * speedMultiplier,
          scale: 0.6 + Math.random() * 0.7,
          opacity: 0.5 + Math.random() * 0.5,
          loopsCount: 3 + Math.floor(Math.random() * 2),
        });
      }

      // B. Obstacles: Black clouds & fighter red paper gliders spawn intervals
      const obstacleSpawnChance = settings.difficulty === 'easy' ? 0.009 : settings.difficulty === 'hard' ? 0.025 : 0.016;
      if (newFrameCount % 60 === 0 && Math.random() < obstacleSpawnChance * 60) {
        // Randomly split between black pencil cloud and red crayon paper glider plane
        const isFighter = Math.random() < (settings.difficulty === 'hard' ? 0.6 : settings.difficulty === 'easy' ? 0.15 : 0.35);
        
        if (isFighter) {
          // Spawn enemy red plane
          const size = 50;
          obstacles.push({
            id: `enemy_plane_${Date.now()}`,
            type: 'ENEMY_PLANE',
            x: GAME_WIDTH + 60,
            y: size + Math.random() * (GAME_HEIGHT - size * 2),
            width: size + 6,
            height: size - 10,
            vx: -(2.8 + Math.random() * 1.8) * speedMultiplier,
            vy: Math.sin(Math.random() * 10) * 0.65, // small wavy path
            health: settings.difficulty === 'hard' ? 2 : 1,
            maxHealth: settings.difficulty === 'hard' ? 2 : 1,
            jitterOffset: Math.random() * 200,
            rotation: 0,
            rotationSpeed: 0,
            shootCooldown: 80 + Math.random() * 100,
          });
        } else {
          // Spawn big charcoal storm cloud
          const width = 60 + Math.random() * 45;
          const height = 45 + Math.random() * 30;
          obstacles.push({
            id: `black_cloud_${Date.now()}`,
            type: 'BLACK_CLOUD',
            x: GAME_WIDTH + 100,
            y: height + Math.random() * (GAME_HEIGHT - height * 2.2),
            width,
            height,
            vx: -(1.8 + Math.random() * 1.5) * speedMultiplier,
            vy: 0,
            health: settings.difficulty === 'easy' ? 1 : 2, // harder clouds require 2 scribbles
            maxHealth: settings.difficulty === 'easy' ? 1 : 2,
            jitterOffset: Math.random() * 200,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.015,
          });
        }
      }

      // C. Golden and bonus crayons star collection spawns (Frame rate compensated timing!)
      const starSpawnChance = 0.004;
      if (Math.random() < starSpawnChance * frameComp) {
        // Decide item category: standard STAR (80%), ammo parachute (15%), or healing hearts (5%)
        const roll = Math.random();
        let starType: 'SCORE_STAR' | 'BULLET_RECHARGE' | 'LIFE_HEAL' | 'AMMO_PARACHUTE' = 'SCORE_STAR';
        if (roll < 0.15 && settings.shootingEnabled) {
          starType = 'AMMO_PARACHUTE'; // Falling Daniel's Ammo Parachute!
        } else if (roll > 0.95) {
          starType = 'LIFE_HEAL'; // rare heal
        }

        let sY = 40 + Math.random() * (GAME_HEIGHT - 90);
        let sX = GAME_WIDTH + 40;
        let sW = 24;
        let sH = 24;

        if (starType === 'AMMO_PARACHUTE') {
          sY = -60; // falls from the absolute top of the sky!
          sX = 150 + Math.random() * (GAME_WIDTH - 300); // spawned randomly across horizontal screen
          sW = 46;
          sH = 70;
        }

        starCollectibles.push({
          id: `star_${Date.now()}`,
          x: sX,
          y: sY,
          width: sW,
          height: sH,
          collected: false,
          angle: starType === 'AMMO_PARACHUTE' ? 0 : Math.random() * Math.PI,
          type: starType,
        });
      }

      // 4. ENTITY TICK POSITION RE-EVALUATORS (All frame compensated!)
      
      // A. Drift Background white clouds
      friendlyClouds.forEach(cloud => {
        cloud.x += cloud.vx * frameComp;
      });
      // Flush off-canvas clouds
      stateRef.current.friendlyClouds = friendlyClouds.filter(cloud => cloud.x > -180);

      // B. Update obstacle movements & occasional gun fire for hard plane fighters
      obstacles.forEach(obs => {
        obs.x += obs.vx * frameComp;
        obs.y += obs.vy * frameComp;
        obs.rotation += obs.rotationSpeed * frameComp;

        if (obs.type === 'ENEMY_PLANE' && settings.difficulty === 'hard') {
          // Harder planes occasionally shoot small black graphite dust bullets
          if (obs.shootCooldown !== undefined) {
            obs.shootCooldown -= frameComp;
            if (obs.shootCooldown <= 0 && obs.x < GAME_WIDTH - 50 && obs.x > 150) {
              obs.shootCooldown = 130 + Math.random() * 100;
              stateRef.current.bullets.push({
                id: `ebullet_${Date.now()}_${Math.random()}`,
                x: obs.x - 5,
                y: obs.y + obs.height / 2,
                vx: -5.5, // pointing left straight
                vy: 0,
                radius: 3,
                isEnemy: true,
              });
            }
          }
        }
      });
      // Flush off-canvas obstacles
      stateRef.current.obstacles = obstacles.filter(obs => obs.x > -120);

      // C. Update projectiles
      bullets.forEach(b => {
        b.x += b.vx * frameComp;
        b.y += b.vy * frameComp;
      });
      stateRef.current.bullets = bullets.filter(b => b.x < GAME_WIDTH + 40 && b.x > -40);

      // D. Update star collection drift speeds
      starCollectibles.forEach(star => {
        if (star.type === 'AMMO_PARACHUTE') {
          star.x -= 0.8 * speedMultiplier * frameComp; // drifts gently with the wind
          star.y += 1.35 * speedMultiplier * frameComp; // falls down from the sky
          star.x += Math.sin(newFrameCount * 0.05) * 0.75 * frameComp; // swaying horizontal physics!
        } else {
          star.x -= 2.0 * speedMultiplier * frameComp; // drift left
          star.angle += 0.02 * frameComp; // spin gently
        }
      });
      stateRef.current.starCollectibles = starCollectibles.filter(
        star => !star.collected && star.x > -60 && star.y < GAME_HEIGHT + 100
      );

      // E. Update particle countdown states
      particles.forEach(p => {
        p.x += p.vx * frameComp;
        p.y += p.vy * frameComp;
        p.life -= frameComp;
      });
      stateRef.current.particles = particles.filter(p => p.life > 0);

      // Reduce shaking screen rumble filter over time
      if (stateRef.current.screenShake > 0) {
        stateRef.current.screenShake *= 0.88;
        if (stateRef.current.screenShake < 0.1) stateRef.current.screenShake = 0;
      }

      // 5. COLLISION DETECTION AND RESPONSE CORE
      
      // Colliders logic
      const planeBox = {
        left: plane.x + 8,
        right: plane.x + plane.width - 10,
        top: plane.y + 6,
        bottom: plane.y + plane.height - 6,
      };

      // A. Player projectiles hitting charcoal clouds or gliders
      bullets.forEach(bullet => {
        if (bullet.isEnemy) {
          // Enemy bullets hit player
          if (plane.invulnFrames === 0 && 
              bullet.x > planeBox.left && bullet.x < planeBox.right &&
              bullet.y > planeBox.top && bullet.y < planeBox.bottom) {
            
            // Hit! Remove bullet and trigger hurt event
            bullet.x = -999; // trigger cleanup filter
            triggerHurt();
          }
        } else {
          // Player bullets hitting hostile obstacles
          obstacles.forEach(obs => {
            const obsBox = {
              left: obs.x,
              right: obs.x + obs.width,
              top: obs.y,
              bottom: obs.y + obs.height,
            };

            if (bullet.x > obsBox.left && bullet.x < obsBox.right &&
                bullet.y > obsBox.top && bullet.y < obsBox.bottom) {
              
              // Projectile impact!
              bullet.x = 9999; // erase player bullet
              obs.health--;

              // Draw spark/graphite debris chips on impact
              spawnParticles(bullet.x - 10, bullet.y, obs.type === 'ENEMY_PLANE' ? '#e74c3c' : '#7f8c8d', 4);

              if (obs.health <= 0) {
                // Erase obstacle! Trigger crinkle explosion or boom, score bonuses
                obs.x = -9999; // flush
                
                const scoreReward = obs.type === 'ENEMY_PLANE' ? 150 : 80;
                setScore(current => {
                  const s = current + scoreReward;
                  stateRef.current.score = s;
                  return s;
                });

                audio.playExplode();
                const explosionColor = obs.type === 'ENEMY_PLANE' ? '#e74c3c' : '#2c3e50';
                spawnParticles(obsBox.left + obs.width / 2, obsBox.top + obs.height / 2, explosionColor, 12);
                
                // Spawn nice numeric score text popup
                spawnParticles(
                  obsBox.left + obs.width / 2, 
                  obsBox.top, 
                  obs.type === 'ENEMY_PLANE' ? '#c0392b' : '#333333', 
                  1, 
                  `+${scoreReward}`
                );
              }
            }
          });
        }
      });

      // Cleanup bullets relocated out-of-bounds at -999 / 9999
      stateRef.current.bullets = stateRef.current.bullets.filter(b => b.x < GAME_WIDTH && b.x > 0);

      // B. Plane colliding with moving columns of obstacles
      if (plane.invulnFrames === 0) {
        obstacles.forEach(obs => {
          if (obs.x < -20) return; // ignore deleted
          
          const obsBox = {
            left: obs.x + 4,
            right: obs.x + obs.width - 4,
            top: obs.y + 4,
            bottom: obs.y + obs.height - 4,
          };

          // Simple AABB Box overlap checks
          if (planeBox.right > obsBox.left &&
              planeBox.left < obsBox.right &&
              planeBox.bottom > obsBox.top &&
              planeBox.top < obsBox.bottom) {
            
            // CRASH HIT INDEED!
            triggerHurt();
            obs.x = -9999; // erase crashed obstacle
            // explode crashed obstacle nicely
            spawnParticles(obsBox.left + obs.width/2, obsBox.top + obs.height/2, obs.type === 'ENEMY_PLANE' ? '#e74c3c' : '#2c3e50', 10);
          }
        });
      }

      // C. Plane colliding with shiny cute stars
      starCollectibles.forEach(star => {
        if (star.collected) return;
        
        const starBox = {
          left: star.x,
          right: star.x + star.width,
          top: star.y,
          bottom: star.y + star.height,
        };

        if (planeBox.right > starBox.left &&
            planeBox.left < starBox.right &&
            planeBox.bottom > starBox.top &&
            planeBox.top < starBox.bottom) {
          
          star.collected = true;
          audio.playCollectStar();

          // Apply award based on star categories
          if (star.type === 'BULLET_RECHARGE' || star.type === 'AMMO_PARACHUTE') {
            const addedBullets = star.type === 'AMMO_PARACHUTE' ? 12 : 8;
            plane.bullets += addedBullets;
            setBullets(plane.bullets);
            spawnParticles(star.x + star.width/2, star.y + star.height/2, '#2ecc71', 10, `+${addedBullets} Ammo ✎`);
          } else if (star.type === 'LIFE_HEAL') {
            const addedLife = Math.min(plane.maxLives, plane.lives + 1);
            plane.lives = addedLife;
            setLives(addedLife);
            spawnParticles(star.x + 8, star.y + 8, '#e74c3c', 8, '+1 Heart');
          } else {
            // Standard gold score star
            setScore(current => {
              const s = current + 100;
              stateRef.current.score = s;
              return s;
            });
            spawnParticles(star.x + 8, star.y + 8, '#f1c40f', 8, '+100');
          }
        }
      });

      // TRIGGER DAMAGE IMPACT SUBPROCESS
      function triggerHurt() {
        plane.lives -= 1;
        setLives(plane.lives);
        plane.invulnFrames = 75; // roughly 1.2s invulnerability
        stateRef.current.screenShake = 16; // heavy retro screen shake
        
        audio.playDamage();
        spawnParticles(plane.x + plane.width / 2, plane.y + plane.height / 2, '#e74c3c', 16, 'CRASH!');

        if (plane.lives <= 0) {
          // GAME OVER DIAL TRANSITION
          audio.stopMotor();
          audio.playGameOver();
          setGameState('GAMEOVER');
          onGameOver(stateRef.current.score, stateRef.current.distance);
        }
      }

      // 6. DRAW AND RENDER ALL LAYERS ON CANVAS
      renderCanvas();

      // Trigger next animation loop iteration
      animationID = requestAnimationFrame(update);
    };

    animationID = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(animationID);
    };
  }, [gameState, isGamePaused, settings.difficulty, settings.shootingEnabled, settings.soundEnabled]);

  // Initial cloud generator setup
  useEffect(() => {
    stateRef.current.friendlyClouds = createInitialFriendlyClouds();
    renderCanvas();
  }, []);

  // Synchronous draw call
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { 
      plane, 
      obstacles, 
      friendlyClouds, 
      bullets, 
      particles, 
      starCollectibles, 
      frameCount,
      screenShake 
    } = stateRef.current;

    ctx.save();
    
    // Apply neat screen vibrating shake on damage crash
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw notebook paper lined background
    drawNotebookBackground(ctx, GAME_WIDTH, GAME_HEIGHT, frameCount * 0.5);

    // 2. Draw drifting background white clouds (scenery)
    friendlyClouds.forEach(cloud => {
      drawFriendlyCloud(ctx, cloud, frameCount);
    });

    // 3. Draw collectible stars
    starCollectibles.forEach(star => {
      drawStarCollectible(ctx, star, frameCount);
    });

    // 4. Draw hostile columns (black clouds, gliding planes)
    obstacles.forEach(obs => {
      if (obs.type === 'ENEMY_PLANE') {
        drawEnemyPlane(ctx, obs, frameCount);
      } else {
        drawBlackCloud(ctx, obs, frameCount);
      }
    });

    // 5. Draw active lasers / crayons
    bullets.forEach(bullet => {
      drawBullet(ctx, bullet, frameCount);
    });

    // 6. Draw the user's 10-year-old child-drawn airplane
    drawDoodlePlane(ctx, plane, frameCount);

    // 7. Draw particle debris fields
    particles.forEach(p => {
      drawParticle(ctx, p, frameCount);
    });

    // Draw a neat hand-pencil boundary border around notebook page
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4);
    ctx.stroke();

    ctx.restore();
  };

  // Relative steer pad touch handlers for optimal hand placement
  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING' || isGamePaused) return;
    stateRef.current.isPointerDown = true;
    stateRef.current.lastPointerX = e.clientX;
    stateRef.current.lastPointerY = e.clientY;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { isPointerDown, lastPointerX, lastPointerY, plane } = stateRef.current;
    if (gameState !== 'PLAYING' || isGamePaused || !isPointerDown) return;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;

      // Make relative drag slightly more sensitive/responsive inside the dedicated panel
      const dx = (e.clientX - lastPointerX) * scaleX * 1.35;
      const dy = (e.clientY - lastPointerY) * scaleY * 1.35;

      plane.x = Math.max(30, Math.min(GAME_WIDTH / 2, plane.x + dx));
      plane.y = Math.max(10, Math.min(GAME_HEIGHT - 45, plane.y + dy));
      plane.targetY = plane.y + plane.height / 2;
    }

    stateRef.current.lastPointerX = e.clientX;
    stateRef.current.lastPointerY = e.clientY;
  };

  const handlePadPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    stateRef.current.isPointerDown = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Immediate layout render check triggering initially
  useEffect(() => {
    renderCanvas();
  }, [lives, score, distance, bullets, gameState, isGamePaused]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-none mx-auto flex flex-col items-center justify-center p-0.5 landscape:p-0 select-none"
    >
      {/* MOBILE GAME HUD DISPLAY BAR */}
      <div className="w-full flex justify-between items-center bg-[#faf8f2] border-2 border-slate-800 rounded-xl px-2 py-1 landscape:px-2.5 landscape:py-1 sm:px-4 sm:py-2 mb-1 landscape:mb-1 font-mono shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] select-none">
        {/* Lives / Heart fuel display */}
        <div id="hud-lives" className="flex items-center gap-1">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold mr-1 sm:mr-1.5 flex items-center gap-0.5"><Target className="w-3 h-3 text-emerald-500" /> Crew</span>
          {[...Array(settings.difficulty === 'easy' ? 4 : settings.difficulty === 'hard' ? 2 : 3)].map((_, i) => (
            <Heart 
              key={i} 
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                i < lives 
                  ? 'fill-rose-500 text-rose-600 scale-100' 
                  : 'text-slate-300 scale-90'
              }`} 
            />
          ))}
        </div>

        {/* Dynamic score dashboard stats */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="text-center">
            <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-widest font-semibold leading-none mb-0.5">Distance</span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 leading-none">{distance}m</span>
          </div>

          <div className="text-center">
            <span className="block text-[8px] sm:text-[9px] text-sky-500 uppercase tracking-widest font-semibold leading-none mb-0.5">Score</span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">{score}</span>
          </div>

          {settings.shootingEnabled && (
            <div className="text-center bg-amber-50 px-1.5 py-0.5 sm:px-2 border border-amber-200 rounded-md">
              <span className="block text-[8px] sm:text-[9px] text-amber-600 uppercase tracking-widest font-semibold leading-none mb-0.5">Ammo</span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-700 font-mono leading-none">✎ x{bullets}</span>
            </div>
          )}
        </div>

        {/* Control utility cluster (Mute & Pause togglers) */}
        <div className="flex gap-1">
          <button 
            onClick={() => audio.setEnabled(!audio.isEnabled())}
            className="p-1 px-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center justify-center cursor-pointer"
          >
            {audio.isEnabled() ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />}
          </button>

          {gameState === 'PLAYING' && (
            <button 
              onClick={togglePause}
              className="p-1 px-1.5 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded text-sky-700 transition flex items-center justify-center cursor-pointer font-bold text-xs gap-1"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          )}
        </div>
      </div>

      {/* PAUSE SCREEN GAMEPLAY CARD OVERLAY */}
      {isGamePaused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 backdrop-blur-[2px] rounded-2xl">
          <div className="bg-[#faf8f2] border-4 border-slate-800 rounded-xl p-6 text-center shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] max-w-xs transform rotate-1">
            <h2 className="text-2xl font-black font-mono text-slate-800 mb-1 select-none">GAME PAUSED</h2>
            <p className="text-xs text-slate-500 font-mono mb-4">Sputtering prop is resting nicely...</p>

            <div className="space-y-2">
              <button 
                onClick={togglePause}
                className="w-full bg-[#fed330] hover:bg-[#f7b731] py-2 px-4 rounded-lg font-bold border-2 border-slate-800 text-slate-900 font-mono shadow-sm transition active:scale-95"
              >
                RESUME FLIGHT
              </button>
              
              <button 
                onClick={() => {
                  setGameState('MENU');
                  audio.stopMotor();
                  setIsGamePaused(false);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 py-1.5 px-4 rounded-lg text-xs font-bold border border-slate-400 text-slate-600 font-mono transition"
              >
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HORIZONTAL WRAP CONSOLE WITH TACTILE SIDE CONTROLLERS */}
      <div className="w-full flex flex-row items-stretch justify-center gap-1.5 sm:gap-3 select-none">
        
        {/* LEFT STEERPAD AREA (ONLY VISIBLE IN HORIZONTAL MODE/LANDSCAPE) */}
        {gameState === 'PLAYING' && !isGamePaused && (
          <div 
            onPointerDown={handlePadPointerDown}
            onPointerMove={handlePadPointerMove}
            onPointerUp={handlePadPointerUp}
            onPointerLeave={handlePadPointerUp}
            className="hidden landscape:flex flex-col items-center justify-between w-24 sm:w-32 md:w-36 bg-[#faf8f2] border-4 border-slate-800 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-2 font-mono hover:bg-[#fffdf7] cursor-ns-resize touch-none select-none transition-colors"
          >
            <span className="text-[7px] sm:text-[9px] text-slate-400 font-extrabold uppercase tracking-widest text-center leading-none">STEER</span>
            <div className="flex flex-col items-center gap-1 sm:gap-2 pointer-events-none">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] sm:text-xs font-bold animate-bounce mb-0.5">↑</div>
              <div className="text-[7px] sm:text-[9px] text-slate-500 font-extrabold text-center leading-none uppercase tracking-tight">DRAG<br/>HERE</div>
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] sm:text-xs font-bold mt-0.5">↓</div>
            </div>
            <span className="text-[7px] sm:text-[9px] text-slate-400 font-bold uppercase leading-none">PAD</span>
          </div>
        )}

        {/* CANVAS DRAWING ELEMENT FRAME */}
        <div className="relative overflow-hidden border-4 border-slate-800 rounded-2xl bg-[#faf8f2] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] shrink select-none flex items-center justify-center max-w-full max-h-[calc(100vh-80px)] max-h-[calc(100dvh-80px)] sm:max-h-[calc(100dvh-100px)] w-fit aspect-[850/480] shadow-slate-800">
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="max-w-full max-h-[calc(100vh-82px)] max-h-[calc(100dvh-82px)] sm:max-h-[calc(100dvh-108px)] w-auto h-auto aspect-[850/480] block select-none bg-inherit cursor-pointer touch-none"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* INSTRUCTIONS FLINT INTRO (DRAG TO FLY) */}
          {gameState === 'PLAYING' && stateRef.current.frameCount < 120 && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] sm:text-xs font-semibold rounded-full py-1 px-3 sm:py-1.5 sm:px-4 text-center font-mono pointer-events-none animate-pulse">
              👆 Touch & Drag anywhere to navigate!
            </div>
          )}

          {/* PORTRAIT BACKUP BLAST BUTTON (Only visible in vertical portrait state) */}
          {gameState === 'PLAYING' && !isGamePaused && settings.shootingEnabled && (
            <div className="absolute right-2 bottom-2 sm:right-4 sm:bottom-4 z-10 select-none landscape:hidden">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  firePlaneBullet();
                }}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-500 hover:bg-rose-600 active:scale-90 text-white rounded-full border-2 sm:border-4 border-slate-800 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-center items-center cursor-pointer outline-none select-none"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-rose-100 animate-pulse pointer-events-none" />
                <span className="text-[8px] sm:text-[10px] font-black font-mono tracking-widest pointer-events-none leading-none">BLAST</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT WEAPONS BLAST PAD AREA (ONLY VISIBLE IN HORIZONTAL MODE/LANDSCAPE) */}
        {gameState === 'PLAYING' && !isGamePaused && settings.shootingEnabled && (
          <div className="hidden landscape:flex flex-col items-center justify-between w-12 sm:w-16 md:w-18 bg-[#faf8f2] border-4 border-slate-800 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-1.5 font-mono select-none">
            <span className="text-[6px] sm:text-[8px] text-slate-400 font-extrabold uppercase tracking-widest text-center leading-none">WEAPON</span>
            
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                firePlaneBullet();
              }}
              className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-rose-500 hover:bg-rose-600 active:scale-95 hover:scale-105 rounded-full border-2 border-slate-800 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-center items-center cursor-pointer outline-none select-none transition-all active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_0px_rgba(15,23,42,1)]"
            >
              <Zap className="w-3 h-3 sm:w-4.5 sm:h-4.5 fill-white text-rose-100 pointer-events-none" />
              <span className="text-[5px] sm:text-[7px] md:text-[8px] font-black tracking-widest leading-none mt-0.5 sm:mt-1 pointer-events-none">BLAST</span>
            </button>

            <span className="text-[6px] sm:text-[8px] text-slate-400 font-bold uppercase leading-none">FIRE</span>
          </div>
        )}

      </div>
    </div>
  );
};
