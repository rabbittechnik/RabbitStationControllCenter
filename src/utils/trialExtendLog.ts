const TRIAL_EXTENDED_ACTIONS = new Set(['trial_extended', 'trial.extend']);

export function isTrialExtendedLogAction(action: string): boolean {
  const key = action.trim().toLowerCase().replace(/\./g, '_');
  return TRIAL_EXTENDED_ACTIONS.has(key) || key === 'trial_extended';
}
