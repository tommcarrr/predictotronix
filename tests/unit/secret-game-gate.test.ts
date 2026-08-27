import { describe, expect, it } from 'vitest';
import {
  registerSecretGamePress,
  SECRET_GAME_PRESS_COUNT,
  SECRET_GAME_PRESS_WINDOW_MS,
  type SecretGameGateState,
} from '@/components/admin/secret-game-gate';

describe('secret game gate', () => {
  it('unlocks on exactly four consecutive theme presses and resets immediately', () => {
    let state: SecretGameGateState = { count: 0, lastPressedAt: 0 };
    for (let press = 1; press <= SECRET_GAME_PRESS_COUNT; press += 1) {
      const result = registerSecretGamePress(state, press * 100);
      state = result.state;
      expect(result.unlocked).toBe(press === SECRET_GAME_PRESS_COUNT);
    }
    expect(state).toEqual({ count: 0, lastPressedAt: 0 });
    expect(registerSecretGamePress(state, 1000).unlocked).toBe(false);
  });

  it('breaks the sequence when the user waits too long', () => {
    const first = registerSecretGamePress({ count: 0, lastPressedAt: 0 }, 100);
    const second = registerSecretGamePress(
      first.state,
      100 + SECRET_GAME_PRESS_WINDOW_MS + 1,
    );
    expect(second.state.count).toBe(1);
    expect(second.unlocked).toBe(false);
  });
});
