import py2js
@py2js.js
def main():

  N_COLS = N_ROWS = 6
  
  ACTION_SPACE = N_ROWS * N_COLS + 1
  
  ACTION_NOOP = ACTION_SPACE - 1
  
  
  def xy_to_idx(row, col):
      return N_ROWS * row + col
  
  
  def idx_to_xy(i):
      x, y = i // N_ROWS, i % N_ROWS
      return x, y
  
  
  def get_initial_state():
  
      state = [0] * (N_ROWS * N_COLS)
  
      state[xy_to_idx(N_ROWS // 2 - 1, N_COLS // 2 - 1)] = 1
      state[xy_to_idx(N_ROWS // 2, N_COLS // 2)] = 1
      state[xy_to_idx(N_ROWS // 2 - 1, N_COLS // 2)] = -1
      state[xy_to_idx(N_ROWS // 2, N_COLS // 2 - 1)] = -1
  
      return state
  
  
  def get_directions(i):
  
      _, col = idx_to_xy(i)
  
      up = list(range(i, -1, -N_COLS))[1:]
      down = list(range(i, N_ROWS*N_COLS, N_COLS))[1:]
  
      left = list(reversed(range(i-col, i, 1)))
      right = list(range(i+1, i + N_COLS - col))
  
      ul = list(range(i, -1, -N_COLS-1))[1:col+1]
      ur = list(range(i, -1, -N_COLS+1))[1:N_COLS - col]
  
      ll = list(range(i, N_ROWS * N_COLS, N_COLS-1))[1:col+1]
      lr = list(range(i, N_ROWS * N_COLS, N_COLS+1))[1:N_COLS - col]
  
      return [up, down, left, right, ul, ur, ll, lr]
  
  
  def is_valid_action(state: list, action: int, player: int):
  
      #: すでに石がある
      if state[action] != 0:
          return False
  
      directions = get_directions(action)
  
      for direction in directions:
          stones = [state[i] for i in direction]
          if player in stones and -player in stones:
              stones = stones[:stones.index(player)]
              if stones and all(i == -player for i in stones):
                  return True
  
      return False
  
  
  def _get_valid_actions(state_str: list, player: int):
  
      # state = json.loads(state_str)
  
      valid_actions = [action for action in range(N_ROWS * N_COLS)
                       if is_valid_action(state, action, player)]
  
      if not valid_actions:
          #: 有効手無しの場合はパスを許可
          valid_actions = [ACTION_NOOP]
  
      return valid_actions
  
  
  def get_valid_actions(state: list, player: int):
      # state_str = json.dumps(state)
      return _get_valid_actions(state_str, player)
  
  
  def step(state: list, action: int, player: int):
  
      assert action in get_valid_actions(state, player)
  
      if action == ACTION_NOOP:
          # next_state = copy.deepcopy(state)
          next_state = state
      else:
          # next_state = copy.deepcopy(state)
          next_state = state
  
          directions = get_directions(action)
  
          for direction in directions:
              stones = [state[i] for i in direction]
              if player in stones and -player in stones:
                  idx = stones.index(player)
                  stones = stones[:idx]
                  if stones and all(i == -player for i in stones):
                      for i in direction[:idx]:
                          next_state[i] = player
  
          next_state[action] = player
  
      done = is_done(next_state, -player)
  
      return next_state, done
  
  
  def is_done(state, player):
  
      if get_valid_actions(state, player) == [ACTION_NOOP]:
          #: 自分に有効手なし
          if get_valid_actions(state, -player) == [ACTION_NOOP]:
              #: 相手に有効手なし
              return True
          else:
              #: 相手に有効手あり
              return False
      else:
          #: 自分に有効手あり
          return False
  
  
  def get_result(state: list):
  
      is_done_first = get_valid_actions(state, 1) == [ACTION_NOOP]
      is_done_second = get_valid_actions(state, -1) == [ACTION_NOOP]
  
      assert is_done_first
      assert is_done_second
  
      #: どちらも有効手無しで正常にゲーム終了
      black_stones = sum([1 for i in state if i == 1])
      white_stones = sum([1 for i in state if i == -1])
  
      if black_stones > white_stones:
          return 1, -1
      elif white_stones > black_stones:
          return -1, 1
      elif black_stones == white_stones:
          return 0, 0
  
  
  def count_stone(state: list):
      first = sum([1 for i in state if i == 1])
      second = sum([1 for i in state if i == -1])
      return (first, second)
  
  
  
  if __name__ == '__main__':
      state = get_initial_state()
      save_img(state, "img", "test_1.png", "ALphazero 1: 22 vs 12")
    