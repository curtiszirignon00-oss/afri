// src/components/nudges/NudgeRenderer.tsx
// Pont entre NudgeContext et NudgeBanner

import { useNudgeContext } from '../../contexts/NudgeContext';
import NudgeBanner from './NudgeBanner';

export default function NudgeRenderer() {
  const { activeNudge } = useNudgeContext();

  if (!activeNudge) return null;

  return <NudgeBanner nudge={activeNudge} />;
}
