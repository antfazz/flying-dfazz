/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlaneEntity, Obstacle, FriendlyCloud, Bullet, Particle, StarCollectible } from '../types';

// Deterministic wiggle based on frame groups to create a "boiling" hand-drawn effect
function getWobble(seed: number, frameCheck: number, maxOffset: number = 1.5): number {
  const step = Math.floor(frameCheck / 6); // Change wobble 10 times a sec
  const value = Math.sin(seed * 73 + step * 97) * Math.cos(seed * 13 + step * 43);
  return value * maxOffset;
}

// Draw a sketched line with slight natural imperfections
export function drawSketchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  frameCheck: number,
  seed: number = 0
) {
  const wX1 = x1 + getWobble(seed, frameCheck, 1.2);
  const wY1 = y1 + getWobble(seed + 1, frameCheck, 1.2);
  const wX2 = x2 + getWobble(seed + 2, frameCheck, 1.2);
  const wY2 = y2 + getWobble(seed + 3, frameCheck, 1.2);

  // Subdivided middle point to simulate hand-drawn curves/bending
  const midX = (wX1 + wX2) / 2 + getWobble(seed + 4, frameCheck, 1.4);
  const midY = (wY1 + wY2) / 2 + getWobble(seed + 5, frameCheck, 1.4);

  ctx.beginPath();
  ctx.moveTo(wX1, wY1);
  ctx.quadraticCurveTo(midX, midY, wX2, wY2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Draw a simple notebook paper sheet in the canvas background
export function drawNotebookBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scrollX: number
) {
  // Clear with soft off-white/cream paper color
  ctx.fillStyle = '#faf8f2';
  ctx.fillRect(0, 0, width, height);

  // Draw pale-blue horizontal lines (ruled paper lines)
  ctx.strokeStyle = 'rgba(74, 144, 226, 0.15)';
  ctx.lineWidth = 1.2;
  const lineSpacing = 36;
  const startY = lineSpacing - (Math.floor(0) % lineSpacing);

  for (let y = startY; y < height; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw red vertical margin line (notebook margin)
  ctx.strokeStyle = 'rgba(231, 76, 60, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(85, 0);
  ctx.lineTo(85, height);
  ctx.stroke();

  // Draw math grid check paper lines lightly if desired (looks like mathematical paper)
  ctx.strokeStyle = 'rgba(74, 144, 226, 0.05)';
  ctx.lineWidth = 0.8;
  for (let x = 0; x < width; x += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

// Draw the custom airplane sketched by the user's 10-year-old son
export function drawDoodlePlane(
  ctx: CanvasRenderingContext2D,
  plane: PlaneEntity,
  frameCheck: number
) {
  const seed = 42; // static seed
  ctx.save();
  ctx.translate(plane.x + plane.width / 2, plane.y + plane.height / 2);
  ctx.rotate(plane.angle);

  // Invulnerablity flash
  if (plane.invulnFrames > 0 && Math.floor(frameCheck / 4) % 2 === 0) {
    ctx.globalAlpha = 0.3;
  }

  // Deep graphite color
  const graphiteColor = '#2b2b2b';
  const paperFillColor = 'rgba(255, 255, 255, 0.85)'; // semi-transparent white-out feel for hand-filled parts

  // Draw wings FIRST (lower and upper) so they sit under/above the body
  
  // UPPER WING (points up-left/towards top-left from body perspective)
  ctx.save();
  // We offset it and draw a diagonal rounded wing
  ctx.translate(0, -10);
  ctx.beginPath();
  const upWob1 = getWobble(seed + 1, frameCheck, 1.5);
  const upWob2 = getWobble(seed + 2, frameCheck, 1.5);
  // Drawing wing boundary
  ctx.moveTo(-35 + upWob1, -5 + upWob2);
  ctx.quadraticCurveTo(0, -40, 20 + upWob1, -30 + upWob2);
  ctx.quadraticCurveTo(30, -20, 10, 0);
  ctx.closePath();
  ctx.fillStyle = paperFillColor;
  ctx.fill();
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw number '8' on upper wing
  ctx.fillStyle = graphiteColor;
  ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
  ctx.fillText("8", -2, -18);

  // Draw two circular propellers with crosshairs on upper wing (as drawn)
  // Turbine 1: close to body
  const upPropX1 = -12;
  const upPropY1 = -16;
  ctx.beginPath();
  ctx.arc(upPropX1, upPropY1, 6, 0, Math.PI * 2);
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Crosshair + spinning line
  ctx.beginPath();
  const pA_upper = plane.propellerAngle * 1.5;
  ctx.moveTo(upPropX1 + Math.cos(pA_upper) * 6, upPropY1 + Math.sin(pA_upper) * 6);
  ctx.lineTo(upPropX1 - Math.cos(pA_upper) * 6, upPropY1 - Math.sin(pA_upper) * 6);
  ctx.moveTo(upPropX1 + Math.cos(pA_upper + Math.PI/2) * 6, upPropY1 + Math.sin(pA_upper + Math.PI/2) * 6);
  ctx.lineTo(upPropX1 - Math.cos(pA_upper + Math.PI/2) * 6, upPropY1 - Math.sin(pA_upper + Math.PI/2) * 6);
  ctx.stroke();

  // Turbine 2: further out on wing
  const upPropX2 = 8;
  const upPropY2 = -26;
  ctx.beginPath();
  ctx.arc(upPropX2, upPropY2, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(upPropX2 + Math.cos(pA_upper + 0.5) * 6, upPropY2 + Math.sin(pA_upper + 0.5) * 6);
  ctx.lineTo(upPropX2 - Math.cos(pA_upper + 0.5) * 6, upPropY2 - Math.sin(pA_upper + 0.5) * 6);
  ctx.moveTo(upPropX2 + Math.cos(pA_upper + Math.PI/2 + 0.5) * 6, upPropY2 + Math.sin(pA_upper + Math.PI/2 + 0.5) * 6);
  ctx.lineTo(upPropX2 - Math.cos(pA_upper + Math.PI/2 + 0.5) * 6, upPropY2 - Math.sin(pA_upper + Math.PI/2 + 0.5) * 6);
  ctx.stroke();
  ctx.restore();

  // LOWER WING (points down-left/towards bottom-left)
  ctx.save();
  ctx.translate(-5, 10);
  ctx.beginPath();
  const loWob1 = getWobble(seed + 10, frameCheck, 1.5);
  const loWob2 = getWobble(seed + 11, frameCheck, 1.5);
  ctx.moveTo(-20 + loWob1, 0);
  ctx.quadraticCurveTo(-35, 45, -25 + loWob2, 50 + loWob1);
  ctx.quadraticCurveTo(5, 45, 12, 10);
  ctx.closePath();
  ctx.fillStyle = paperFillColor;
  ctx.fill();
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw "7²" on lower wing
  ctx.fillStyle = graphiteColor;
  ctx.font = 'bold 15px "Comic Sans MS", cursive, sans-serif';
  ctx.fillText("7²", -18, 32);

  // Draw two propellers with crosshairs on lower wing (as drawn)
  // Turbine 1: near body
  const loPropX1 = -4;
  const loPropY1 = 20;
  ctx.beginPath();
  ctx.arc(loPropX1, loPropY1, 6, 0, Math.PI * 2);
  ctx.stroke();
  const pA_lower = plane.propellerAngle * 1.3;
  ctx.beginPath();
  ctx.moveTo(loPropX1 + Math.cos(pA_lower) * 6, loPropY1 + Math.sin(pA_lower) * 6);
  ctx.lineTo(loPropX1 - Math.cos(pA_lower) * 6, loPropY1 - Math.sin(pA_lower) * 6);
  ctx.moveTo(loPropX1 + Math.cos(pA_lower + Math.PI/2) * 6, loPropY1 + Math.sin(pA_lower + Math.PI/2) * 6);
  ctx.lineTo(loPropX1 - Math.cos(pA_lower + Math.PI/2) * 6, loPropY1 - Math.sin(pA_lower + Math.PI/2) * 6);
  ctx.stroke();

  // Turbine 2: further down on wing
  const loPropX2 = -16;
  const loPropY2 = 36;
  ctx.beginPath();
  ctx.arc(loPropX2, loPropY2, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(loPropX2 + Math.cos(pA_lower + 0.8) * 6, loPropY2 + Math.sin(pA_lower + 0.8) * 6);
  ctx.lineTo(loPropX2 - Math.cos(pA_lower + 0.8) * 6, loPropY2 - Math.sin(pA_lower + 0.8) * 6);
  ctx.moveTo(loPropX2 + Math.cos(pA_lower + Math.PI/2 + 0.8) * 6, loPropY2 + Math.sin(pA_lower + Math.PI/2 + 0.8) * 6);
  ctx.lineTo(loPropX2 - Math.cos(pA_lower + Math.PI/2 + 0.8) * 6, loPropY2 - Math.sin(pA_lower + Math.PI/2 + 0.8) * 6);
  ctx.stroke();
  ctx.restore();


  // MAIN FUSELAGE / BODY
  // Form a capsule-like cylinder angled slightly downwards to the left, nose is to the right
  ctx.beginPath();
  const fuseWobY = getWobble(seed + 20, frameCheck, 1.2);
  const fuseWobX = getWobble(seed + 21, frameCheck, 1.2);
  
  // Nose is on the right (+35), Tail on the left (-35)
  ctx.moveTo(-35 + fuseWobX, 2 + fuseWobY);
  ctx.bezierCurveTo(-38, -13, 0, -18, 30 + fuseWobX, -10 + fuseWobY);  // Top curve
  ctx.quadraticCurveTo(42, -5, 45, 0); // Nose curve
  ctx.quadraticCurveTo(42, 10, 30, 11); // Nose lower curve
  ctx.bezierCurveTo(0, 13, -32, 15, -35 + fuseWobX, 2 + fuseWobY); // Bottom curve
  ctx.fillStyle = paperFillColor;
  ctx.fill();
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Box with number '3' in the middle of the body
  ctx.save();
  ctx.translate(-15, -3);
  ctx.beginPath();
  const boxWob = getWobble(seed + 25, frameCheck, 1);
  ctx.rect(-10 + boxWob, -9 + boxWob, 18, 17);
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  
  ctx.fillStyle = graphiteColor;
  ctx.font = 'bold 13px "Comic Sans MS", cursive, sans-serif';
  ctx.fillText("3", -5, 4);
  ctx.restore();

  // Cockpit dome window on the upper front side
  ctx.save();
  ctx.translate(13, -8);
  ctx.beginPath();
  const domeWob = getWobble(seed + 30, frameCheck, 1);
  // Draw a lovely dome
  ctx.arc(domeWob, domeWob, 11, Math.PI, 0, false);
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Draw the pilot stick figure inside!
  const pilotHeadX = 0;
  const pilotHeadY = -4;
  // Head
  ctx.beginPath();
  ctx.arc(pilotHeadX, pilotHeadY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.stroke();
  // Body (looks like "A-like shape")
  ctx.beginPath();
  ctx.moveTo(pilotHeadX, pilotHeadY + 3.5);
  ctx.lineTo(pilotHeadX - 4, 10); // Left leg
  ctx.moveTo(pilotHeadX, pilotHeadY + 3.5);
  ctx.lineTo(pilotHeadX + 4, 10); // Right leg
  ctx.moveTo(pilotHeadX - 3, 5);
  ctx.lineTo(pilotHeadX + 3, 5); // Cross arm bar
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  
  ctx.restore();

  // Front Propeller spinner hub
  ctx.save();
  ctx.translate(42, 1);
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = graphiteColor;
  ctx.fill();
  ctx.stroke();

  // Draw 3 spinning propeller blades
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2.5;
  for (let b = 0; b < 3; b++) {
    const angle = b * (Math.PI * 2 / 3) + plane.propellerAngle;
    const bladeLength = 18 + getWobble(seed + b*10, frameCheck, 1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Control point to draw a cute leaf shaped propeller blade
    const endX = Math.cos(angle) * bladeLength;
    const endY = Math.sin(angle) * bladeLength;
    const cpX = Math.cos(angle + 0.2) * (bladeLength * 0.6);
    const cpY = Math.sin(angle + 0.2) * (bladeLength * 0.6);
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.quadraticCurveTo(Math.cos(angle - 0.2) * (bladeLength * 0.6), Math.sin(angle - 0.2) * (bladeLength * 0.6), 0, 0);
    ctx.fillStyle = 'rgba(100, 100, 100, 0.15)';
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Rear tail/rudder (with curves and fine details)
  ctx.beginPath();
  const tailWob = getWobble(seed + 35, frameCheck, 1.2);
  ctx.moveTo(-35 + tailWob, 2);
  ctx.quadraticCurveTo(-45, -3, -48 + tailWob, -25 + tailWob); // vertical tail top
  ctx.quadraticCurveTo(-43, -28, -39, -15);
  ctx.quadraticCurveTo(-37, -8, -32, -9);
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Scribed lines detail in the tail
  drawSketchLine(ctx, -41, -14, -45, -20, graphiteColor, 1.2, frameCheck, seed + 38);

  ctx.restore();
}

// Draw friendly White cloud (loopy cartoon style)
export function drawFriendlyCloud(
  ctx: CanvasRenderingContext2D,
  cloud: FriendlyCloud,
  frameCheck: number
) {
  ctx.save();
  ctx.translate(cloud.x, cloud.y);
  ctx.scale(cloud.scale, cloud.scale);
  ctx.globalAlpha = cloud.opacity;

  const color = '#3498db'; // Soft sky blue sketch line
  const fillColor = '#ffffff';
  ctx.lineWidth = 2.2;

  // Let's draw overlapping circles/loops like the hand drawn picture
  // The picture has clouds with spirals and overlapping curly loops!
  // We can draw a series of curly loops using bezier curves that intersect/loop back!
  ctx.beginPath();
  const wobble1 = getWobble(12, frameCheck, 2);
  const wobble2 = getWobble(83, frameCheck, 2);
  const wobble3 = getWobble(47, frameCheck, 2);

  // Cloud drawing with loops:
  // We'll approximate the child's sketch clouds which are curly outline clusters
  ctx.beginPath();
  ctx.moveTo(-40 + wobble1, 10);
  // Bottom loops
  ctx.bezierCurveTo(-50, -10, -20, -35, -10 + wobble2, -20 + wobble3);
  ctx.bezierCurveTo(-5, -45, 30, -45, 35 + wobble1, -15 + wobble1);
  ctx.bezierCurveTo(55, -30, 80, -10, 65 + wobble2, 10 + wobble2);
  ctx.bezierCurveTo(80, 30, 50, 45, 30 + wobble3, 30 + wobble1);
  ctx.bezierCurveTo(15, 45, -15, 45, -20 + wobble1, 25);
  ctx.bezierCurveTo(-45, 35, -55, 20, -40 + wobble2, 10);
  ctx.closePath();
  
  // Fill solid white to hide background notebook lines, then draw curly loop details!
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();

  // Draw cute internal cloud loops/spirals as drawn by the child (he did loose loops inside)
  ctx.beginPath();
  // Left swirl loops
  ctx.arc(-20, 0, 10, Math.PI, 1.8 * Math.PI);
  ctx.stroke();
  
  ctx.beginPath();
  // Middle top swirl
  ctx.arc(10, -15, 12, 1.2 * Math.PI, 2.2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  // Right lower loop
  ctx.arc(38, 8, 11, 0, 1.3 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

// Draw dangerous scribbled charcoal Black cloud
export function drawBlackCloud(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
  frameCheck: number
) {
  ctx.save();
  ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
  ctx.rotate(obstacle.rotation);

  const seed = parseInt(obstacle.id.substring(0, 3)) || 100;
  
  // Outer boundary
  const w = obstacle.width;
  const h = obstacle.height;

  // Let's create a messy charcoal sketch look - lots of intersecting scribbled lines
  // Draw a dirty central cluster
  ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
  ctx.beginPath();
  
  // Dynamic sketchy capsule bubble
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const rCurrent = (w * 0.45) + Math.sin(angle * 3 + seed) * 8 + getWobble(seed + i, frameCheck, 3);
    const px = Math.cos(angle) * rCurrent;
    const py = Math.sin(angle) * rCurrent;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Draw scribbly graphite outlines that extend out
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  
  for (let j = 0; j < 8; j++) {
    const angle = (j / 8) * Math.PI * 2;
    const rx = (w * 0.45) + getWobble(seed + j * 10, frameCheck, 4);
    const ry = (h * 0.45) + getWobble(seed + j * 12, frameCheck, 4);
    
    // Draw loops on the perimeter
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * (w*0.25), Math.sin(angle) * (h*0.25), rx * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cross-hatching scribbles in the center to look like frantic lead drawing
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 1.5;
  for (let i = -w/3; i < w/3; i += 7) {
    // Left diagonal scribbles
    drawSketchLine(ctx, i - 10, -h/3, i + 10, h/3, 'rgba(0, 0, 0, 0.7)', 1.5, frameCheck, seed + i);
    // Right diagonal scribbles
    drawSketchLine(ctx, i + 10, -h/3, i - 10, h/3, 'rgba(0, 0, 0, 0.7)', 1.5, frameCheck, seed + i + 50);
  }

  // Draw scary yellow lightning sparks occasionally
  if (Math.floor(frameCheck / 15) % 3 === 0) {
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(wobbleX(seed, frameCheck), 25);
    ctx.lineTo(wobbleX(seed+1, frameCheck) - 10, 40);
    ctx.stroke();
  }

  ctx.restore();
}

function wobbleX(seed: number, frameCheck: number): number {
  return Math.sin(seed + frameCheck / 5) * 10;
}

// Draw other pencil enemy planes
export function drawEnemyPlane(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
  frameCheck: number
) {
  ctx.save();
  ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
  // Facing left default, so rotate or reverse scale
  ctx.scale(-1, 1); 
  ctx.rotate(-obstacle.rotation);

  const seed = 50;
  const graphiteColor = '#c0392b'; // Sketched in red crayon
  const paperFill = 'rgba(255, 230, 230, 0.9)';
  
  // Sketching a cute simple enemy glider/potato plane
  ctx.beginPath();
  ctx.moveTo(-25, 0);
  ctx.bezierCurveTo(-20, -15, 10, -15, 20, -5); // Fuselage top
  ctx.quadraticCurveTo(28, 0, 25, 5); // nose
  ctx.bezierCurveTo(10, 15, -20, 12, -25, 0); // Fuselage bottom
  ctx.fillStyle = paperFill;
  ctx.fill();
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Big wing
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(-15, -25);
  ctx.lineTo(5, -25);
  ctx.closePath();
  ctx.fillStyle = paperFill;
  ctx.fill();
  ctx.stroke();

  // Bottom wing
  ctx.beginPath();
  ctx.moveTo(5, 5);
  ctx.lineTo(-8, 20);
  ctx.lineTo(8, 20);
  ctx.closePath();
  ctx.fillStyle = paperFill;
  ctx.fill();
  ctx.stroke();

  // Little pilot eye window
  ctx.beginPath();
  ctx.arc(10, -3, 4, 0, Math.PI * 2);
  ctx.strokeStyle = graphiteColor;
  ctx.stroke();
  // Simple angry eye dot
  ctx.fillStyle = graphiteColor;
  ctx.beginPath();
  ctx.arc(9, -3, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Spinning back propeller (since it's a glider back prop)
  const propAngle = (frameCheck * 0.3);
  ctx.save();
  ctx.translate(-26, 0);
  ctx.rotate(propAngle);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 10);
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Draw some scary "fire" scribbles coming out of back
  if (frameCheck % 4 < 2) {
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-27, -2);
    ctx.lineTo(-38, -5);
    ctx.moveTo(-27, 2);
    ctx.lineTo(-36, 4);
    ctx.stroke();
  }

  ctx.restore();
}

// Draw Daniel's awesome Ammo Parachute boxes (Child sketch design)
export function drawAmmoParachute(
  ctx: CanvasRenderingContext2D,
  star: StarCollectible,
  frameCheck: number
) {
  const seed = 123;
  ctx.save();
  ctx.translate(star.x + star.width / 2, star.y + star.height / 2);

  // Sway angle horizontal physics
  const swayAngle = Math.sin(frameCheck * 0.05) * 0.12;
  ctx.rotate(swayAngle);

  const graphiteColor = '#2b2b2b';
  const paperFillColor = 'rgba(255, 255, 255, 0.95)';
  const stripeColors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6']; // Retro crayon colors

  const w = star.width;   // 50
  const h = star.height;  // 80

  const canopyWidth = w;
  const canopyHeight = h * 0.38;
  const canopyTop = -h / 2;
  const canopyBottom = canopyTop + canopyHeight;

  // 1. Draw Parachute Canopy dome
  ctx.beginPath();
  // ellipse top-dome
  ctx.ellipse(0, canopyBottom, canopyWidth / 2, canopyHeight, 0, Math.PI, 0, false);
  
  // Wavy bottom scallops path
  const scallopCount = 5;
  const step = canopyWidth / scallopCount;
  for (let i = scallopCount - 1; i >= 0; i--) {
    const xEnd = -canopyWidth / 2 + i * step;
    const xMid = xEnd + step / 2;
    const yControl = canopyBottom + 3;
    ctx.quadraticCurveTo(xMid, yControl, xEnd, canopyBottom);
  }
  ctx.closePath();
  ctx.fillStyle = paperFillColor;
  ctx.fill();
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw colorful horizontal canopy stripes like in Daniel's sketch
  for (let i = 1; i < scallopCount; i++) {
    const fraction = i / scallopCount;
    const yHeight = canopyHeight * fraction;
    const xOffset = Math.sqrt(1 - Math.pow(1 - fraction, 2)) * (canopyWidth / 2);
    
    // Colored crayon bands filling
    ctx.strokeStyle = stripeColors[i % stripeColors.length];
    ctx.lineWidth = 3;
    ctx.beginPath();
    const wY = canopyBottom - yHeight;
    ctx.moveTo(-xOffset + 2, wY);
    ctx.lineTo(xOffset - 2, wY);
    ctx.stroke();
  }

  // Canopy outline details
  drawSketchLine(ctx, -canopyWidth / 2, canopyBottom, canopyWidth / 2, canopyBottom, graphiteColor, 2, frameCheck, seed);

  // 2. Parachute Cargo: Ammo Box carrying Pencils!
  const boxW = w * 0.55;
  const boxH = h * 0.35;
  const boxTop = h / 2 - boxH;
  const boxBottom = h / 2;

  // Parachute suspension strings converging
  ctx.strokeStyle = 'rgba(43, 43, 43, 0.45)';
  ctx.lineWidth = 1.2;
  drawSketchLine(ctx, -canopyWidth / 2 + 1, canopyBottom, -boxW / 2, boxTop, 'rgba(43,43,43,0.5)', 1.2, frameCheck, seed + 10);
  drawSketchLine(ctx, -canopyWidth / 4, canopyBottom, -boxW / 4, boxTop, 'rgba(43,43,43,0.5)', 1.2, frameCheck, seed + 11);
  drawSketchLine(ctx, 0, canopyBottom, 0, boxTop, 'rgba(43,43,43,0.5)', 1.2, frameCheck, seed + 12);
  drawSketchLine(ctx, canopyWidth / 4, canopyBottom, boxW / 4, boxTop, 'rgba(43,43,43,0.5)', 1.2, frameCheck, seed + 13);
  drawSketchLine(ctx, canopyWidth / 2 - 1, canopyBottom, boxW / 2, boxTop, 'rgba(43,43,43,0.5)', 1.2, frameCheck, seed + 14);

  // Draw the Pencil Ammo Box outlines
  ctx.beginPath();
  ctx.moveTo(-boxW / 2, boxTop);
  ctx.lineTo(boxW / 2, boxTop);
  ctx.lineTo(boxW * 0.6, boxBottom);
  ctx.lineTo(-boxW * 0.6, boxBottom);
  ctx.closePath();
  ctx.fillStyle = paperFillColor;
  ctx.fill();
  ctx.strokeStyle = graphiteColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw pencils popping out of the crate!
  const pY = boxTop + 2;

  // 1. Standing Yellow Pencil (focused in center)
  const pW = 5;
  const pH = boxH * 0.75;
  const pX = -2.5;
  ctx.fillStyle = '#f1c40f'; // yellow body
  ctx.fillRect(pX, pY + 4, pW, pH - 4);
  // wood cone
  ctx.fillStyle = '#f5e0c3';
  ctx.beginPath();
  ctx.moveTo(pX, pY + 4);
  ctx.lineTo(pX + pW / 2, pY);
  ctx.lineTo(pX + pW, pY + 4);
  ctx.closePath();
  ctx.fill();
  // lead tip
  ctx.fillStyle = graphiteColor;
  ctx.beginPath();
  ctx.moveTo(pX + pW/4, pY + 2);
  ctx.lineTo(pX + pW/2, pY);
  ctx.lineTo(pX + 3*pW/4, pY + 2);
  ctx.closePath();
  ctx.fill();

  // 2. Hanging Left Pencil (Red)
  const pX_L = -boxW/2 + 2;
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(pX_L, pY + 6, pW, pH - 6);
  ctx.fillStyle = '#f5e0c3';
  ctx.beginPath();
  ctx.moveTo(pX_L, pY + 6);
  ctx.lineTo(pX_L + pW/2, pY + 2);
  ctx.lineTo(pX_L + pW, pY + 6);
  ctx.closePath();
  ctx.fill();
  // lead tip
  ctx.fillStyle = graphiteColor;
  ctx.beginPath();
  ctx.moveTo(pX_L + pW/4, pY + 4);
  ctx.lineTo(pX_L + pW/2, pY + 2);
  ctx.lineTo(pX_L + 3*pW/4, pY + 4);
  ctx.closePath();
  ctx.fill();

  // 3. Horizontal Bottom Pencil (Blue, lying in bottom of the box)
  const bluePencilX = -boxW/3;
  const bluePencilY = boxBottom - 6;
  const bluePencilW = boxW * 0.7;
  const bluePencilH = 4;
  ctx.fillStyle = '#3498db';
  ctx.fillRect(bluePencilX, bluePencilY, bluePencilW - 3, bluePencilH);
  ctx.fillStyle = '#f5e0c3';
  ctx.beginPath();
  ctx.moveTo(bluePencilX + bluePencilW - 3, bluePencilY);
  ctx.lineTo(bluePencilX + bluePencilW, bluePencilY + bluePencilH / 2);
  ctx.lineTo(bluePencilX + bluePencilW - 3, bluePencilY + bluePencilH);
  ctx.closePath();
  ctx.fill();
  // blue lead tip
  ctx.fillStyle = graphiteColor;
  ctx.beginPath();
  ctx.moveTo(bluePencilX + bluePencilW - 2, bluePencilY + bluePencilH / 4);
  ctx.lineTo(bluePencilX + bluePencilW, bluePencilY + bluePencilH / 2);
  ctx.lineTo(bluePencilX + bluePencilW - 2, bluePencilY + 3*bluePencilH / 4);
  ctx.closePath();
  ctx.fill();

  // Hand-penciled details inside the cardboard box
  ctx.strokeStyle = 'rgba(43,43,43,0.35)';
  ctx.lineWidth = 1;
  drawSketchLine(ctx, -boxW / 2 + 3, boxTop + boxH / 2, boxW / 2 - 3, boxTop + boxH / 2, 'rgba(43,43,43,0.3)', 1, frameCheck, seed + 30);
  
  // "AMMO" label drawn in messy ink
  ctx.fillStyle = graphiteColor;
  ctx.font = 'bold 8px Courier, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AMMO', 0, boxBottom - 8);

  ctx.restore();
}

// Draw dynamic hand-drawn Star Collectible
export function drawStarCollectible(
  ctx: CanvasRenderingContext2D,
  star: StarCollectible,
  frameCheck: number
) {
  if (star.collected) return;

  if (star.type === 'AMMO_PARACHUTE') {
    drawAmmoParachute(ctx, star, frameCheck);
    return;
  }

  ctx.save();
  ctx.translate(star.x + star.width / 2, star.y + star.height / 2);
  ctx.rotate(star.angle);

  // Wobble scale a bit
  const scale = 1.0 + Math.sin(frameCheck * 0.1) * 0.08;
  ctx.scale(scale, scale);

  // Coloring:
  // Yellow pencil sketch for standard score stars
  // Neon green for green crayon extra bullets
  // Soft pink/red for hearts life heal
  let mainColor = '#f1c40f'; // Golden standard star
  let helperText = '';
  
  if (star.type === 'BULLET_RECHARGE') {
    mainColor = '#2ecc71'; // Green crayon
    helperText = '✎';
  } else if (star.type === 'LIFE_HEAL') {
    mainColor = '#e74c3c'; // Red crayon
    helperText = '♥';
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // opaque backing
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2.5;

  // Draw a standard 5-point star but with slight child-like uneven edges
  ctx.beginPath();
  const numPoints = 5;
  const innerRadius = 6;
  const outerRadius = 13;
  const seed = 505;

  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const wR = r + getWobble(seed + i, frameCheck, 1.2);
    const px = Math.cos(angle) * wR;
    const py = Math.sin(angle) * wR;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Internal visual details
  if (helperText) {
    ctx.fillStyle = mainColor;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(helperText, 0, 1);
  } else {
    // Quick pencil swirl in the middle
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  ctx.restore();
}

// Draw a bullet/crayon blast projectile
export function drawBullet(
  ctx: CanvasRenderingContext2D,
  bullet: Bullet,
  frameCheck: number
) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);

  if (bullet.isEnemy) {
    // Enemy bullet: small aggressive graphite dots
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    // Scribble halo
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Player bullet: custom colored crayon stick or missile!
    // Drawn like a little sharpened drawing pencil/crayon shooting across
    ctx.rotate(Math.atan2(bullet.vy, bullet.vx));

    const beamColor = '#e67e22'; // Orange colored crayon bullet
    const leadColor = '#2c3e50';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // backer
    ctx.beginPath();
    ctx.moveTo(-10, -3.5);
    ctx.lineTo(2, -3.5);
    ctx.lineTo(10, 0); // Sharpened tip
    ctx.lineTo(2, 3.5);
    ctx.lineTo(-10, 3.5);
    ctx.closePath();
    ctx.fill();

    // Outlines
    ctx.strokeStyle = beamColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // pencil eraser tip backing
    ctx.fillStyle = leadColor;
    ctx.beginPath();
    ctx.moveTo(2, -3.5);
    ctx.lineTo(10, 0);
    ctx.lineTo(2, 3.5);
    ctx.closePath();
    ctx.fill();

    // Little motion air trails
    ctx.strokeStyle = 'rgba(230, 126, 34, 0.3)';
    ctx.lineWidth = 1.2;
    drawSketchLine(ctx, -18, -4, -12, -4, 'rgba(230, 126, 34, 0.4)', 1, frameCheck, 99);
    drawSketchLine(ctx, -20, 0, -14, 0, 'rgba(230, 126, 34, 0.4)', 1.2, frameCheck, 100);
    drawSketchLine(ctx, -18, 4, -12, 4, 'rgba(230, 126, 34, 0.4)', 1, frameCheck, 101);
  }

  ctx.restore();
}

// Draw cute particle physics
export function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  frameCheck: number
) {
  const alpha = p.life / p.maxLife;
  ctx.save();
  ctx.globalAlpha = alpha;

  if (p.text) {
    // Drawn comic text values or bubbles (+100, CRASH!)
    ctx.fillStyle = p.color;
    ctx.font = 'bold 13px "Courier New", monospace, sans-serif';
    ctx.fillText(p.text, p.x, p.y);
  } else {
    // Standard graphite/eraser crumble particles
    ctx.fillStyle = p.color;
    ctx.beginPath();
    // Instead of perfect circles, draw adorable sketchy triangles/polygon crumbles
    const sides = 3 + (Math.floor(p.x) % 3);
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + (p.life * 0.1);
      const radius = p.radius * (0.8 + Math.sin(p.y + i) * 0.2);
      const px = p.x + Math.cos(angle) * radius;
      const py = p.y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    
    // Add tiny sketchy lines inside
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  ctx.restore();
}
