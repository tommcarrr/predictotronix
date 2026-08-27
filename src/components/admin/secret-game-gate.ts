export const SECRET_GAME_PRESS_COUNT = 4;
export const SECRET_GAME_PRESS_WINDOW_MS = 1800;
export const SECRET_GAME_INVITE_DELAY_MS = 30_000;

export interface SecretGameGateState {
  count: number;
  lastPressedAt: number;
}

export function registerSecretGamePress(
  state: SecretGameGateState,
  pressedAt: number,
): { state: SecretGameGateState; unlocked: boolean } {
  const consecutive =
    state.count > 0 && pressedAt - state.lastPressedAt <= SECRET_GAME_PRESS_WINDOW_MS;
  const count = consecutive ? state.count + 1 : 1;

  if (count >= SECRET_GAME_PRESS_COUNT) {
    return {
      state: { count: 0, lastPressedAt: 0 },
      unlocked: true,
    };
  }

  return {
    state: { count, lastPressedAt: pressedAt },
    unlocked: false,
  };
}
