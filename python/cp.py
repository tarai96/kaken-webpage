import time
import random
from pathlib import Path
import shutil
from scipy.sparse import coo_matrix
import json
import sys
import os
import functools

os.chdir('./python')

import tensorflow as tf
import numpy as np
from cshogi import *

from network import AlphaZeroResNet
from shogi_mcts import MCTS as shogi_MCTS
from othello_mcts import MCTS as othello_MCTS
import shogi
import othello

from myLogger import set_logger, getLogger
set_logger()
logger = getLogger(__name__)
logger.info("start running")

shogi_network = AlphaZeroResNet(action_space=shogi.ACTION_SPACE)
shogi_network.load_weights("checkpoints/network")
dummy_state = shogi.encode_state(shogi.get_initial_state(), 1)
#shogi_network.predict(dummy_state)

if len(dummy_state.shape) == 3:
    dummy_state = dummy_state[np.newaxis, ...]
with tf.device("/gpu:0"):
    nn_policy, nn_value = shogi_network(
        dummy_state)

othello_network = AlphaZeroResNet(action_space=othello.ACTION_SPACE)
othello_network.load_weights("weights/othello/network")
dummy_state = othello.encode_state(othello.get_initial_state(), 1)
#othello_network.predict(dummy_state)

if len(dummy_state.shape) == 3:
    dummy_state = dummy_state[np.newaxis, ...]
with tf.device("/gpu:0"):
    nn_policy, nn_value = othello_network(
        dummy_state)


def preparation_best_action(root_srate,current_player,current_weights):
  # プレイヤーが指す前に返しの一手を考えておく
  global network

def shogi_get_best_action(state,current_player,num_mcts_simulations):
  state_str = json.dumps(state)
  return _shogi_get_best_action(state_str,current_player,num_mcts_simulations)

@functools.lru_cache(maxsize=4096)
def _shogi_get_best_action(state_str,current_player,num_mcts_simulations):
  global shogi_network
  state = json.loads(state_str)
  dirichlet_alpha = None
  mcts = shogi_MCTS(network=shogi_network, alpha=dirichlet_alpha)
  
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

def othello_get_best_action(state,current_player,num_mcts_simulations):
  state_str = json.dumps(state)
  return _othello_get_best_action(state_str,current_player,num_mcts_simulations)

@functools.lru_cache(maxsize=4096)
def _othello_get_best_action(state_str,current_player,num_mcts_simulations):
  global othello_network
  state = json.loads(state_str)
  dirichlet_alpha = None
  mcts = othello_MCTS(network=othello_network, alpha=dirichlet_alpha)
  shaped_state = np.array(state).reshape(6,6)
  logger.info(f"shaped_state:{shaped_state}")
  valid_actions = othello.get_valid_actions(state,current_player)
  logger.info(f"valid_actions:{valid_actions}")
  logger.info("mcts.search start")
  mcts_policy = mcts.search(root_state=state,
                          current_player=current_player,
                          num_simulations=num_mcts_simulations)
  action = random.choice(
                np.where(np.array(mcts_policy) == max(mcts_policy))[0])
  if(not (action in valid_actions)):
    logger.info(f"not valid action:{action}")
    # randomにしてみる
    #action = othello.greedy_action(state, current_player, epsilon=0.3)
    action = random.choice(valid_actions)

  return action

if __name__ == "__main__":
  last_data = "null"
  while(True):
    data = sys.stdin.readline()
    if(data == last_data):
      logger.info(f"last_data == data:{data}")
      continue
    last_data = data
    if data != "":
      logger.info(f"data:{data}")
      json_data = json.loads(data)
      logger.info(f"json_data:{json_data}")
      mode = json_data["mode"]
      state = json_data["state"]
      current_player = json_data["current_player"]
      if(mode == "shogi"):
        if(current_player == 1):
          current_player = -1
        elif(current_player == 0):
          current_player = 1
        else:
          logger.warning("unexpect current_player")
        
        usi_action = shogi_get_best_action(state,current_player,num_mcts_simulations=20)

        #print('2c4d')
        logger.info(f"out best_action:{usi_action}")
        logger.info(f"token:{json_data['token']}")
        #出力
        print(json.dumps({"token": json_data["token"], "action": usi_action}))
      elif(mode == "othello"):
        action = othello_get_best_action(state,current_player,num_mcts_simulations=30)
        logger.info(f"out best_action:{action}")
        logger.info(f"token:{json_data['token']}")
        #出力 actionはnumpyのint64型になっているのでpythonのint型に変える
        print(json.dumps({"token": json_data["token"], "action": action.item()}))
    