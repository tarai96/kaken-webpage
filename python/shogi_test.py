import shogi
from cshogi import *
import numpy as np
import random as rd

import timeit

"""
state=[9, 9, 0, 0, 0, 0, 30, 0, 0, 12, 0, 0, 0, 0, 0, 0, 1, 25, 7, 10, 13, 0, 0, 0, 0, 8, 1, 0, 0, 0, 0, 17, 23, 0, 0, 27, 0, 0, 9, 0, 0, 0, 14, 25, 23, 9, 2, 0, 17, 0, 0, 1, 0, 27, 7, 0, 24, 4, 1, 0, 0, 0, 25, 12, 11, 0, 0, 1, 0, 0, 17, 27, 0, 0, 10, 2, 1, 0, 0, 0, 28, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
print(f"state length{len(state)}")
board = Board()
board.push_pass()
pieces = state[0:81]
#print("pieces")
#print(np.array(pieces).reshape(9,9))
in_hand = (state[81:81+7],state[81+7:81+14])
print(f"in_hand:{in_hand}")
board.set_pieces(pieces,in_hand)
print("board")
print(board)
print(f"board.is_ok():{board.is_ok()}")
print(f"board.is_game_over():{board.is_game_over()}")
done = shogi.is_done(state,-1)
print(f"done:{done}")
print(f"get_results:{shogi.get_result(state,1)}")
"""
def demoplay():
  done = False
  state = shogi.get_initial_state()
  current_player = 1
  step = 0
  while not done:
    valid_actions = shogi.get_valid_actions(state,current_player)
    action = rd.choice(valid_actions)
    n_state, done = shogi.step(state,action,current_player)
    state = n_state
    current_player = -current_player
    step += 1
    """
    if(step % 500 == 0):
      print(step)
    """
  print(f"step:{step}")
  board = Board()
  # set_pieces()ではplayerが変わらない
  if(current_player == -1):
    board.push_pass()
  pieces = state[0:81]
  in_hand = (state[81:81+7],state[81+7:81+14])
  board.set_pieces(pieces,in_hand)
  print(board)
  #print("pieces")
  #print(np.array(state[0:81]).reshape(9,9))
  return state,current_player,step
for i in range(100):
  demoplay()
"""
state,current_player,step = demoplay()
print(f"step:{step}")
print(np.array(state[0:81]).reshape(9,9))
board = Board()
if(current_player == -1):
  board.push_pass()
pieces = state[0:81]
#print("pieces")
print(f"state={state}")
in_hand = (state[81:81+7],state[81+7:81+14])
print(f"in_hand:{in_hand}")
print(f"get_results:{shogi.get_result(state,1)}")
board.set_pieces(pieces,in_hand)
print(board)
"""
"""
loop = 100
result = timeit.timeit(lambda: demoplay(), number=loop)
print(result / loop)
#print(result)
"""