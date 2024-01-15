import shogi
from cshogi import *
import numpy as np

import timeit

def lists_match(l1, l2):
  if len(l1) != len(l2):
      return False
  return all(x == y and type(x) == type(y) for x, y in zip(l1, l2))



state = shogi.get_initial_state()
board = Board()
pieces = board.pieces

def func1(state):
  pieces = state[0:81]
  in_hand = (state[81:81+7],state[81+7:81+14])
  return pieces,in_hand

usi_action = "2b3c+"
def func2(usi_action):
  xy = usi_action[0:2]

def func3(usi_action):
  xy = usi_action[0] + usi_action[1]

def func4(usi_action):
  # 成るアクションか
  """
  promote = False
  if("+" in usi_action):
    promote = True
  """
  # 最初の2文字(座標)から駒を導き出す
  #sx, sy = shogi.usi_to_xy(usi_action[0:2])
  """
  mass = sy * 9 + sx
  piece_seed = state[mass]
  """
  """
  if(piece_seed >= 17):
    seed = piece_seed - 16
  else:
    seed = piece_seed
  """

def func5(state):
  state_arr = np.array(state)
  pieces , in_hand0,in_hand1 =  np.split(state_arr,[81,81+7])
  in_hand = (in_hand0.tolist(),in_hand1.tolist())
  return pieces.tolist(),in_hand
"""
pieces1,in_hand1 = func1(state)
pieces2,in_hand2 = func5(state)
print(pieces1,in_hand1)
print(pieces2,in_hand2)
board.set_pieces(pieces2,in_hand2)

print(f"match?:{lists_match(pieces1, pieces2)}")
print(f"match?:{in_hand1 == in_hand2}")
print(f"match?:{lists_match(in_hand1[0], in_hand2[0])}")
print(f"match?:{lists_match(in_hand1[1], in_hand2[1])}")
"""
#loop = 3700000
loop = 76000

result = timeit.timeit(lambda: func5(state), number=loop)
#print(result / loop)
print(result)
