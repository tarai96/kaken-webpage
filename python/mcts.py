import math
import random
import json

import numpy as np
import tensorflow as tf

#import othello
import shogi
import gc
#自分で書いた
def dict_sum(dict):
  """
  sum = 0
  for v in dict.values():
    sum += v
  """
  return sum(list(dict.values()))
class Count(object):
    def __init__(self):
        self.count = 0
    def addCount(self):
        self.count += 1
    def reset(self):
        self.count = 0


class MCTS:

    def __init__(self, network, alpha, c_puct=1.0, epsilon=0.25):

        self.network = network

        self.alpha = alpha

        self.c_puct = c_puct

        self.eps = epsilon

        #: prior probability
        self.P = {}

        #: visit count
        self.N = {}

        #: W is total action-value and Q is mean action-value
        self.W = {}

        #: cache next states to save computation
        self.next_states = {}

        #: string is hashable
        self.state_to_str = (
            lambda state, player: json.dumps(state) + str(player)
            )

        #自分で書いた evaluateの再起処理をカウントする
        self.recursion_count = Count()

    def search(self, root_state, current_player, num_simulations):

        s = self.state_to_str(root_state, current_player)

        if s not in self.P:
            _ = self._expand(root_state, current_player)

        # valid_action
        # valid_actions = othello.get_valid_actions(root_state, current_player)
        valid_actions = shogi.get_valid_actions(root_state, current_player)

        #: Adding Dirichlet noise to the prior probabilities in the root node
        if self.alpha is not None:
            dirichlet_noise = np.random.dirichlet(alpha=[self.alpha]*len(valid_actions))
            for a, noise in zip(valid_actions, dirichlet_noise):
                self.P[s][a] = (1 - self.eps) * self.P[s][a] + self.eps * noise

        #: MCTS simulation
        for _ in range(num_simulations):
            # TODO ACTION_SPACE
                 #for a in range(othello.ACTION_SPACE)]
            #U = [self.c_puct * self.P[s][a] * math.sqrt(sum(self.N[s])) / (1 + self.N[s][a])
            #U = [self.c_puct * self.P[s][a] * math.sqrt(np.sum(self.N[s])) / (1 + self.N[s][a])
            U = [self.c_puct * self.P[s][a] * math.sqrt(dict_sum(self.N[s])) / (1 + self.N[s].get(a, 0))
                 for a in range(shogi.ACTION_SPACE)]
            #Q = [w / n if n != 0 else 0 for w, n in zip(self.W[s], self.N[s])]
            Q = np.zeros(shogi.ACTION_SPACE)
            for wt,nt in zip(self.W[s].items(),self.N[s].items()):
              kw, w = wt[0],wt[1]
              kn, n = nt[0],nt[1]
              assert kw == kn
              k = kn
              Q[k] = w / n
            #assert len(U) == len(Q) == othello.ACTION_SPACE
            assert len(U) == len(Q) == shogi.ACTION_SPACE

            scores = [u + q for u, q in zip(U, Q)]

            #: Mask invalid actions
            scores = np.array([score if action in valid_actions else -np.inf
                               for action, score in enumerate(scores)])

            #: np.argmaxでは同値maxで偏るため
            action = random.choice(np.where(scores == scores.max())[0])

            next_state = self.next_states[s].get(action, None)

            v = -self._evaluate(next_state, -current_player)

            self.W[s][action] = self.W[s].get(action, 0) + v

            self.N[s][action] = self.N[s].get(action, 0) + 1

        #mcts_policy = [n / sum(self.N[s]) for n in self.N[s]]
        #mcts_policy = [n / np.sum(self.N[s]) for n in self.N[s]]
        mcts_policy = np.zeros(shogi.ACTION_SPACE, dtype=np.float32)
        summm = dict_sum(self.N[s])
        for k, n in self.N[s].items():
          mcts_policy[k] = n / summm

        #自分で書いたメモリ使用量を減らす
        """
        print("gc.get_referrers(self.next_states[s])")
        print(gc.get_referrers(self.next_states[s]))
        print("gc.get_referrers(self.N[s])")
        print(gc.get_referrers(self.N[s]))
        print("gc.get_referrers(self.W[s])")
        print(gc.get_referrers(self.W[s]))
        print("gc.get_referrers(self.P[s])")
        print(gc.get_referrers(self.P[s]))
        """

        #del self.N[s],self.W[s],self.P[s],self.next_states[s]

        return mcts_policy

    def _expand(self, state, current_player):

        s = self.state_to_str(state, current_player)

                # othello.encode_state(state, current_player))
        """ もともと
        with tf.device("/cpu:0"):
            nn_policy, nn_value = self.network.predict(
                shogi.encode_state(state, current_player))
        """
        encode_state = shogi.encode_state(state, current_player)
        if len(encode_state.shape) == 3:
            encode_state = encode_state[np.newaxis, ...]
        with tf.device("/gpu:0"):
            nn_policy, nn_value = self.network(
                encode_state)
            tf.keras.backend.clear_session()
        gc.collect()
        nn_policy, nn_value = nn_policy.numpy().tolist()[0], nn_value.numpy()[0][0]

        self.P[s] = nn_policy
        #self.N[s] = [0] * othello.ACTION_SPACE
        #self.W[s] = [0] * othello.ACTION_SPACE
        #self.N[s] = [0] * shogi.ACTION_SPACE
        #self.W[s] = [0] * shogi.ACTION_SPACE
        #self.N[s] = np.zeros(ACTION_SPACE).astype(np.int64) #自分で変更
        self.N[s] = {} #自分で変更
        self.W[s] = {} #自分で変更

        valid_actions = shogi.get_valid_actions(state, current_player)

        #: cache valid actions and next state to save computation
        self.next_states[s] = {}
        for action in valid_actions:
          self.next_states[s][action] = shogi.step(state, action, current_player)[0]
        """
        self.next_states[s] = [
            shogi.step(state, action, current_player)[0]
            if (action in valid_actions) else None
            for action in range(shogi.ACTION_SPACE)]
        """
        #self.next_states[s] = [
            #step(state, action, current_player)[0]
            #if (action in valid_actions) else None
            #for action in range(ACTION_SPACE)]

        return nn_value

    def _evaluate(self, state, current_player):
        #自分でかいた 再帰回数を調べて長すぎたら途中で終わらせる
        self.recursion_count.addCount()
        try:
          s = self.state_to_str(state, current_player)
        except RecursionError as e:
          print(e)
          print(state)
          print("pieces")
          print(np.array(state[0:81]).reshape(9,9))
          # もう一回チャレンジ
          s = self.state_to_str(state, current_player)

        #s = self.state_to_str(state, current_player)

        # if othello.is_done(state, current_player):
        if shogi.is_done(state, current_player):
            #: ゲーム終了
            # reward_first, reward_second = othello.get_result(state)
            reward_first, reward_second = shogi.get_result(state,current_player)
            reward = reward_first if current_player == 1 else reward_second
            # 自分で書いたreturnすればすべての再帰処理が終わるのでリセットする
            self.recursion_count.reset()
            return reward
        
        elif s not in self.P:
            #: ゲーム終了していないリーフノードの場合は展開
            nn_value = self._expand(state, current_player)
            # 自分で書いた returnすればすべての再帰処理が終わるのでリセットする
            self.recursion_count.reset()

            return nn_value

        elif self.recursion_count.count >= 50:
            #自分で書いた
            #再帰回数が100回になったらニューラルネットワークの評価値を返して終わらせる
            encode_state = shogi.encode_state(state, current_player)
            if len(encode_state.shape) == 3:
                encode_state = encode_state[np.newaxis, ...]
            with tf.device("/gpu:0"):
                nn_policy, nn_value = self.network(
                    encode_state)
                tf.keras.backend.clear_session()
            gc.collect()
            nn_policy, nn_value = nn_policy.numpy().tolist()[0], nn_value.numpy()[0][0]
            self.recursion_count.reset()
            return nn_value

        else:
            #: 子ノードをevaluate
                 #for a in range(othello.ACTION_SPACE)]
            #U = [self.c_puct * self.P[s][a] * math.sqrt(sum(self.N[s])) / (1 + self.N[s][a])
            #U = [self.c_puct * self.P[s][a] * math.sqrt(np.sum(self.N[s])) / (1 + self.N[s][a])
            U = [self.c_puct * self.P[s][a] * math.sqrt(dict_sum(self.N[s])) / (1 + self.N[s].get(a, 0))
                 for a in range(shogi.ACTION_SPACE)]
            #Q = [q / n if n != 0 else q for q, n in zip(self.W[s], self.N[s])]
            Q = np.zeros(shogi.ACTION_SPACE)
            for wt,nt in zip(self.W[s].items(),self.N[s].items()):
              kw, w = wt[0],wt[1]
              kn, n = nt[0],nt[1]
              assert kw == kn
              k = kn
              Q[k] = w / n

            #assert len(U) == len(Q) == othello.ACTION_SPACE
            assert len(U) == len(Q) == shogi.ACTION_SPACE

            valid_actions = shogi.get_valid_actions(state, current_player)

            scores = [u + q for u, q in zip(U, Q)]
            scores = np.array([score if action in valid_actions else -np.inf
                               for action, score in enumerate(scores)])

            best_action = random.choice(np.where(scores == scores.max())[0])

            next_state = self.next_states[s].get(best_action, None)

            v = -self._evaluate(next_state, -current_player)

            self.W[s][best_action] = self.W[s].get(best_action, 0) + v
            #self.N[s][best_action] += 1
            self.N[s][best_action] = self.N[s].get(best_action, 0) + 1
            # 自分で書いたreturnすればすべての再帰処理が終わるのでリセットする
            self.recursion_count.reset()
            return v
