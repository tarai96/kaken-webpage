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

from network import AlphaZeroResNet
from mcts import MCTS
import shogi


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
  """
  network = AlphaZeroResNet(action_space=shogi.ACTION_SPACE)
  network.load_weights("checkpoints/network")

  #: initialize network parameters
  # dummy_state = othello.encode_state(othello.get_initial_state(), 1)
  dummy_state = shogi.encode_state(shogi.get_initial_state(), 1)
  #network.predict(dummy_state)
  
  if len(dummy_state.shape) == 3:
      dummy_state = dummy_state[np.newaxis, ...]
  with tf.device("/gpu:0"):
      nn_policy, nn_value = network(
          dummy_state)

  #network.set_weights(current_weights)
  """
  global network
  dirichlet_alpha = None
  mcts = MCTS(network=network, alpha=dirichlet_alpha)

  mcts_policy = mcts.search(root_state=state,
                            current_player=current_player,
                            num_simulations=num_mcts_simulations)
  action = np.argmax(mcts_policy)
  usi_action = shogi.action_mynum_to_usi(state,action,current_player)[0]
  """
  # randomにしてみる
  #action = othello.greedy_action(state, current_player, epsilon=0.3)
  action = random.choice(shogi.get_valid_actions(state, current_player))
  """
  return usi_action

if __name__ == "__main__":
  while(True):
    json_data = json.loads(sys.stdin.readline())
    print(json_data)
    """
    state = json_data["state"]
    current_player = json_data["current_player"]
    #print("state,current_player")
    #print(state)
    #print(current_player)
    usi_action = get_best_action(state,current_player,num_mcts_simulations=30)

    #出力
    print(usi_action)
    """