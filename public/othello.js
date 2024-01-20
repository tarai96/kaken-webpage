const N_COLS = N_ROWS = 6;

const ACTION_SPACE = N_ROWS * N_COLS + 1;

const ACTION_NOOP = ACTION_SPACE - 1;

function xyToIdx(row, col) {
  return N_ROWS * row + col;
}

function idxToXY(i) {
  const x = Math.floor(i / N_ROWS);
  const y = i % N_ROWS;
  return [x, y];
}

function getInitialstate() {
  const state = Array(N_ROWS * N_COLS).fill(0);

  state[xyToIdx(Math.floor(N_ROWS / 2) - 1, Math.floor(N_COLS / 2) - 1)] = 1;
  state[xyToIdx(Math.floor(N_ROWS / 2), Math.floor(N_COLS / 2))] = 1;
  state[xyToIdx(Math.floor(N_ROWS / 2) - 1, Math.floor(N_COLS / 2))] = -1;
  state[xyToIdx(Math.floor(N_ROWS / 2), Math.floor(N_COLS / 2) - 1)] = -1;

  return state;
}

function getDirections(i) {
  const [, col] = idxToXY(i);

  const up = Array.from({ length: i / N_COLS }, (_, index) => i - index * N_COLS).slice(1);
  const down = Array.from({ length: (N_ROWS * N_COLS - i) / N_COLS }, (_, index) => i + index * N_COLS).slice(1);

  const left = Array.from({ length: col }, (_, index) => i - (col - index)).reverse();
  const right = Array.from({ length: N_COLS - col - 1 }, (_, index) => i + index + 1);

  const ul = Array.from({ length: col }, (_, index) => i - index * (N_COLS + 1)).slice(1);
  const ur = Array.from({ length: N_COLS - col - 1 }, (_, index) => i - index * (N_COLS - 1)).slice(1);

  const ll = Array.from({ length: col }, (_, index) => i + index * (N_COLS - 1)).slice(1);
  const lr = Array.from({ length: N_COLS - col - 1 }, (_, index) => i + index * (N_COLS + 1)).slice(1);

  return [up, down, left, right, ul, ur, ll, lr];
}

function isValidAction(state, action, player) {
  if (state[action] !== 0) {
    return false;
  }

  const directions = getDirections(action);

  for (const direction of directions) {
    const stones = direction.map(i => state[i]);
    if (stones.includes(player) && stones.includes(-player)) {
      const index = stones.indexOf(player);
      const subset = stones.slice(0, index);
      if (subset.length > 0 && subset.every(val => val === -player)) {
        return true;
      }
    }
  }

  return false;
}

function getValidActions(state, player) {

  const validActions = Array.from({ length: N_ROWS * N_COLS }, (_, index) => index)
    .filter(action => isValidAction(state, action, player));

  if (validActions.length === 0) {
    validActions.push(ACTION_NOOP);
  }

  return validActions;
}

function step(state, action, player) {
  const next_state = state.concat();
  if (action === ACTION_NOOP) {
    // Do nothing
  } else {
    //console.log("state");
    //console.log(state);
    const directions = getDirections(action);

    for (const direction of directions) {
      const stones = direction.map(i => state[i]);
      if (stones.includes(player) && stones.includes(-player)) {
        const idx = stones.indexOf(player);
        const subset = stones.slice(0, idx);
        if (subset.length > 0 && subset.every(val => val === -player)) {
          for (const i of direction.slice(0, idx)) {
            next_state[i] = player;
          }
        }
      }
    }

    next_state[action] = player;
  }

  const done = isDone([...state], -player);

  return [next_state, done];
}

function isDone(state, player) {
  if (getValidActions(state, player).length === 1 && getValidActions(state, player)[0] === ACTION_NOOP) {
    if (getValidActions(state, -player).length === 1 && getValidActions(state, -player)[0] === ACTION_NOOP) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function getResult(state) {
  const isDoneFirst = getValidActions(state, 1).length === 1 && getValidActions(state, 1)[0] === ACTION_NOOP;
  const isDoneSecond = getValidActions(state, -1).length === 1 && getValidActions(state, -1)[0] === ACTION_NOOP;

  if (isDoneFirst && isDoneSecond) {
    const blackStones = state.filter(val => val === 1).length;
    const whiteStones = state.filter(val => val === -1).length;

    if (blackStones > whiteStones) {
      return [1, -1];
    } else if (whiteStones > blackStones) {
      return [-1, 1];
    } else {
      return [0, 0];
    }
  } else {
    throw new Error("Game is not finished");
  }
}

function greedyAction(state, player, epsilon = 0) {
  const validActions = getValidActions(state, player);

  if (Math.random() > epsilon) {
    let bestAction = null;
    let bestScore = 0;

    for (const action of validActions) {
      const [nextState, done] = step(state, action, player);
      const [_, score] = countStone(nextState);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction;
  } else {
    const action = validActions[Math.floor(Math.random() * validActions.length)];
    return action;
  }
}

function countStone(state) {
  const first = state.filter(val => val === 1).length;
  const second = state.filter(val => val === -1).length;
  return [first, second];
}
