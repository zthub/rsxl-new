// Utility for Visual Stimulation Background Rendering
// Used across multiple games to ensure consistent stimulation effects

export const getStripeSize = (acuity: string, minDimension: number): number => {
  switch (acuity) {
    case '0.0-0.1': return Math.max(20, Math.floor(minDimension / 6));
    case '0.2-0.4': return Math.max(10, Math.floor(minDimension / 12));
    case '0.5-0.6': return Math.max(5, Math.floor(minDimension / 25));
    case '0.7-0.9': return Math.max(2, Math.floor(minDimension / 50));
    default: return Math.floor(minDimension / 12);
  }
};

export const getFrequencies = (acuity: string) => {
    switch (acuity) {
        case '0.0-0.1': return { freq: 1, rotSpeed: 0.005 };
        case '0.2-0.4': return { freq: 2, rotSpeed: 0.01 };
        case '0.5-0.6': return { freq: 4, rotSpeed: 0.02 };
        case '0.7-0.9': return { freq: 6, rotSpeed: 0.04 };
        default: return { freq: 2, rotSpeed: 0.01 };
    }
};

export const renderCommonBackground = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
  acuity: string
) => {
  const minDimension = Math.min(w, h);
  const stripeSize = getStripeSize(acuity, minDimension);
  const { freq, rotSpeed } = getFrequencies(acuity);
  const flashPeriod = Math.floor(60 / freq);

  // Background Cycle Timing (approx 30s loop at 60fps)
  const fps = 60;
  const cycleFrames = 30 * fps;
  const currentFrameInCycle = frame % cycleFrames;
  const timeInCycle = currentFrameInCycle / fps;

  // --- Drawing Helpers ---
  const drawScrollingGratings = (c1: string, c2: string) => {
    const step = Math.floor(frame / flashPeriod);
    const offset = (step * stripeSize) % (stripeSize * 2);
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = c2;
    for (let x = -stripeSize * 2; x < w + stripeSize; x += stripeSize * 2) {
      ctx.fillRect(x + offset, 0, stripeSize, h);
    }
  };

  const drawFlippingCheckerboard = (c1: string, c2: string) => {
    const invert = Math.floor(frame / flashPeriod) % 2 === 0;
    for (let x = 0; x < w; x += stripeSize) {
      for (let y = 0; y < h; y += stripeSize) {
        const isEven = ((x / stripeSize) + (y / stripeSize)) % 2 === 0;
        ctx.fillStyle = (isEven === invert) ? c1 : c2;
        ctx.fillRect(x, y, stripeSize, stripeSize);
      }
    }
  };

  const drawRotatedPattern = (type: 'stripes' | 'checker', c1: string, c2: string) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const maxDim = Math.sqrt(w * w + h * h);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(frame * rotSpeed);
    ctx.fillStyle = c2;
    ctx.fillRect(-maxDim, -maxDim, maxDim * 2, maxDim * 2);
    ctx.fillStyle = c1;
    if (type === 'stripes') {
      for (let x = -maxDim; x < maxDim; x += stripeSize * 2) {
        ctx.fillRect(x, -maxDim, stripeSize, maxDim * 2);
      }
    } else {
      for (let x = -maxDim; x < maxDim; x += stripeSize) {
        for (let y = -maxDim; y < maxDim; y += stripeSize) {
          const i = Math.floor(x / stripeSize);
          const j = Math.floor(y / stripeSize);
          if ((i + j) % 2 === 0) {
            ctx.fillRect(x, y, stripeSize, stripeSize);
          }
        }
      }
    }
    ctx.restore();
  };

  const drawAlternatingFlash = (c1: string, c2: string) => {
    const showFirst = Math.floor(frame / flashPeriod) % 2 === 0;
    ctx.fillStyle = showFirst ? c1 : c2;
    ctx.fillRect(0, 0, w, h);
  };

  // --- Sequence Logic ---
  if (timeInCycle < 4) drawScrollingGratings('#000000', '#FFFFFF');
  else if (timeInCycle < 8) drawScrollingGratings('#FF0000', '#FFFF00');
  else if (timeInCycle < 12) drawFlippingCheckerboard('#000000', '#FFFFFF');
  else if (timeInCycle < 16) drawFlippingCheckerboard('#FF0000', '#FFFF00');
  else if (timeInCycle < 19) drawAlternatingFlash('#000000', '#FFFFFF');
  else if (timeInCycle < 22) drawAlternatingFlash('#FF0000', '#FFFF00');
  else if (timeInCycle < 24) drawRotatedPattern('stripes', '#000000', '#FFFFFF');
  else if (timeInCycle < 26) drawRotatedPattern('stripes', '#FF0000', '#FFFF00');
  else if (timeInCycle < 28) drawRotatedPattern('checker', '#000000', '#FFFFFF');
  else drawRotatedPattern('checker', '#FF0000', '#FFFF00');
};