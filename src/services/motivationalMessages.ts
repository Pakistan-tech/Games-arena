/**
 * Motivational Messages & Brain-Training Explanation Engine
 * 
 * Main Theme:
 * "Train your brain to keep looking for possibilities, even when the obvious path is blocked."
 */

export interface BrainSkill {
  id: string;
  title: string;
  shortDesc: string;
  detail: string;
  iconName: string;
}

export const BRAIN_SKILLS: BrainSkill[] = [
  {
    id: 'bigger_picture',
    title: 'Looking at the Bigger Picture',
    shortDesc: 'Observe the entire field instead of focusing only on the obvious option.',
    detail: 'When one arrow is blocked, zooming your vision out to see the perimeter and opposite corridors reveals openings that narrow tunnel vision misses.',
    iconName: 'Maximize2'
  },
  {
    id: 'alternative_paths',
    title: 'Exploring Alternative Possibilities',
    shortDesc: 'Discover fresh pathways when the easiest or most direct path is unavailable.',
    detail: 'In life and puzzles, hitting a roadblock is an invitation to scan in 360 degrees. There is almost always a secondary route waiting to be unlocked.',
    iconName: 'Compass'
  },
  {
    id: 'adaptability',
    title: 'Adapting to Changing Situations',
    shortDesc: 'Update your mental model as each solved piece reshapes the landscape.',
    detail: 'Every arrow that slides off the board alters the clearances for everything behind it. Flexible minds adapt in real time to new board states.',
    iconName: 'Shuffle'
  },
  {
    id: 'decision_pressure',
    title: 'Decisive Composure Under Time',
    shortDesc: 'Make thoughtful decisions calmly while the clock counts down.',
    detail: 'Practicing calm deliberation while the timer runs trains you to breathe, verify lines of sight, and act with intention rather than panic.',
    iconName: 'Clock'
  },
  {
    id: 'patience_persistence',
    title: 'Patient Persistence',
    shortDesc: 'Stay determined and avoid giving up when an arrangement feels difficult.',
    detail: 'Intricate knots are untangled one strand at a time. Embracing the challenge with patience turns frustration into steady, rewarding progress.',
    iconName: 'Flame'
  },
  {
    id: 'first_instinct',
    title: 'Rethinking the First Instinct',
    shortDesc: 'Recognize that the best solution is often not the first one you see.',
    detail: 'The most tempting move can sometimes lock the board. Pausing to check dependencies teaches the art of second-order thinking.',
    iconName: 'Lightbulb'
  }
];

/**
 * 30 Distinct, curated motivational messages.
 * Suitable for both completion and game-over screens.
 */
export const MOTIVATIONAL_MESSAGES: string[] = [
  "You looked beyond the obvious and found another way forward. That is how problem-solving begins.",
  "When the easiest option disappears, take a moment to look around. There may be another path waiting.",
  "Every challenge is an opportunity to practice patience, focus, and flexible thinking.",
  "You kept going when the solution was not immediately visible. That is a skill worth building.",
  "The bigger picture often reveals possibilities that are easy to miss when you focus on only one option.",
  "Sometimes taking a step back is the fastest way to move forward.",
  "Obstacles are simply signals to look in a different direction.",
  "True progress happens when you stay calm and search for the hidden opening.",
  "Flexibility in thinking turns complicated roadblocks into simple stepping stones.",
  "When one direction is firmly closed, another corridor is waiting for your attention.",
  "Patience is not just waiting—it is actively observing until the right solution appears.",
  "Great problem solvers do not rush; they trace the dependencies and choose with clarity.",
  "Every knot you untangle strengthens your ability to navigate complex situations.",
  "Your willingness to adapt when a path is blocked is your greatest cognitive advantage.",
  "Do not let a closed door distract you from the open windows all around you.",
  "Progress often comes from exploring the quiet edges rather than forcing the center.",
  "When you resist the impulse to guess, clarity naturally replaces confusion.",
  "A momentary pause is often the catalyst for the next breakthrough.",
  "Every arrow that finds its exit started by waiting for its rightful turn.",
  "Trust the process: what seems tangled at first becomes clear with methodical focus.",
  "Small, observant adjustments lead to extraordinary chain reactions.",
  "Training your mind to search for second and third options changes how you meet every challenge.",
  "Mistakes are not dead ends; they are clear indicators of which paths to reconsider.",
  "A flexible perspective transforms an intimidating labyrinth into an enjoyable puzzle.",
  "Keep your eyes open to subtle opportunities; the breakthrough is often right beside you.",
  "Resilience is holding your composure and continuing to scan until you find the open line.",
  "When the obvious choice is blocked, curiosity becomes your most reliable guide.",
  "The most rewarding solutions are usually the ones that required you to rethink your approach.",
  "Patience, persistence, and perspective will untangle even the tightest clusters.",
  "Train your brain to keep looking for possibilities, even when the obvious path is blocked."
];

let lastMessageIndex: number = -1;

/**
 * Returns a motivational message ensuring no consecutive repeats.
 */
export function getNonRepeatingMotivationalMessage(): string {
  let nextIndex: number;
  if (MOTIVATIONAL_MESSAGES.length <= 1) return MOTIVATIONAL_MESSAGES[0];

  do {
    nextIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
  } while (nextIndex === lastMessageIndex);

  lastMessageIndex = nextIndex;
  return MOTIVATIONAL_MESSAGES[nextIndex];
}

/**
 * Generates dynamic stage completion feedback using real player stats.
 */
export function generateStageCompletionFeedback(
  stageNum: number,
  timeSec: number,
  arrowsCleared: number,
  livesRemaining: number
): { summary: string; quote: string; encouragement: string } {
  const mins = Math.floor(timeSec / 60);
  const secs = timeSec % 60;
  const timeFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs} seconds`;
  const livesText = livesRemaining === 1 ? '1 life remaining' : `${livesRemaining} lives remaining`;

  let performanceTone = '';
  if (livesRemaining === 3 && timeSec <= 60) {
    performanceTone = 'Flawless precision! You kept your composure under pressure and read the board with complete clarity.';
  } else if (livesRemaining === 3) {
    performanceTone = 'Remarkable patience! You preserved all your lives by checking dependencies before every move.';
  } else if (livesRemaining === 2) {
    performanceTone = 'Excellent adaptability! You looked beyond the obvious options, corrected your course, and found a way forward.';
  } else {
    performanceTone = 'True perseverance! Down to your final life, you stayed calm, explored alternative angles, and finished strong.';
  }

  const summary = `Great work! You cleared Stage ${stageNum} in ${timeFormatted} with ${livesText}.`;
  const quote = getNonRepeatingMotivationalMessage();

  return {
    summary,
    encouragement: performanceTone,
    quote
  };
}

/**
 * Generates dynamic defeat feedback without guilt, encouraging persistence and alternative thinking.
 */
export function generateDefeatFeedback(
  stageNum: number,
  arrowsRemaining: number,
  totalArrows: number
): { summary: string; quote: string; tip: string } {
  const quote = getNonRepeatingMotivationalMessage();
  const summary = `Don't give up! ${arrowsRemaining} of ${totalArrows} arrows were still waiting for their clearance.`;
  const tip = "Sometimes the best option is not immediately visible. Take a step back, look at the bigger picture, and try another approach.";

  return {
    summary,
    quote,
    tip
  };
}
