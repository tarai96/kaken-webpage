import time
import random
from pathlib import Path
import shutil
from scipy.sparse import coo_matrix
import json
import sys
import os

#print(os.getcwd())
os.chdir('./python')
#print(os.getcwd())
#print(sys.executable)

import tensorflow as tf
import numpy as np
from cshogi import *

from network import AlphaZeroResNet
from mcts import MCTS
import shogi

from myLogger import set_logger, getLogger
set_logger()
logger = getLogger(__name__)


network = AlphaZeroResNet(action_space=shogi.ACTION_SPACE)
network.load_weights("checkpoints/network")
dummy_state = shogi.encode_state(shogi.get_initial_state(), 1)
#network.predict(dummy_state)

if len(dummy_state.shape) == 3:
    dummy_state = dummy_state[np.newaxis, ...]
with tf.device("/gpu:0"):
    nn_policy, nn_value = network(
        dummy_state)


def preparation_best_action(root_srate,current_player,current_weights):
  # プレイヤーが指す前に返しの一手を考えておく
  global network


def get_best_action(state,current_player,num_mcts_simulations):

  global network
  dirichlet_alpha = None
  mcts = MCTS(network=network, alpha=dirichlet_alpha)
  
  #logger.info(f"len(state):{len(state)}")
  #logger.info(f"state[0:81]:{state[0:81]}")
  #logger.info(f"state[81:81+7]:{state[81:81+7]}")
  #logger.info(f"state[81+7:81+14]:{state[81+7:81+14]}")
  in_hand = (state[81:81+7],state[81+7:81+14])
  board = shogi.board_set(state,current_player)
  
  #logger.info(f"board.legal_moves:{list(board.legal_moves)}")
  v_usi_a = [move_to_usi(a) for a in board.legal_moves]
  logger.info(f"valid_usi:{v_usi_a}")
  shogi.save_img(state,current_player, "img", f"cppy.png", "")
  valid_actions = shogi.get_valid_actions(state, current_player)
  logger.info(f"valid_action:{valid_actions}")
  logger.info("mcts.search start")
  mcts_policy = mcts.search(root_state=state,
                            current_player=current_player,
                            num_simulations=num_mcts_simulations)
  action = np.argmax(mcts_policy)
  logger.info(f"action:{action}")
  if(not (action in valid_actions)):
    # randomにしてみる
    #action = othello.greedy_action(state, current_player, epsilon=0.3)
    action = random.choice(valid_actions)
  
  [usi_action,valid] = shogi.action_mynum_to_usi(state,action,current_player)
  if not valid:
    logger.info(f"usi_action:{usi_action}")
  return usi_action

if __name__ == "__main__":
  while(True):
    data = sys.stdin.readline()
    logger.info(f"data:{data}")
    if data != "":
      json_data = json.loads(data)
      #json_data = json.loads(json_data)
      #json_data = data
      logger.info(f"json_data:{json_data}")
      #print(json_data["current_player"])
      state = json_data["state"]
      current_player = json_data["current_player"]
      if(current_player == 1):
        current_player = -1
      elif(current_player == 0):
        current_player = 1
      else:
        logger.warning("unexpect current_player")
      
      #print("state,current_player")
      #print(state)
      #print(current_player)
      usi_action = get_best_action(state,current_player,num_mcts_simulations=1)

      #出力

      #print('2c4d')
      logger.info(f"out best_action:{usi_action}")
      print(usi_action)
    