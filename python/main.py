from dataclasses import dataclass
import time
import random
from pathlib import Path
import shutil

import tensorflow as tf
import numpy as np
import ray
from tqdm import tqdm

from network import AlphaZeroResNet
from mcts import MCTS
from buffer import ReplayBuffer
#import othello
import shogi
from scipy.sparse import coo_matrix
import tracemalloc

@dataclass
class Sample:

    state: list
    mcts_policy: list
    player: int
    reward: int

@ray.remote(num_cpus=1, num_gpus=0)
def selfplay(weights, num_mcts_simulations, dirichlet_alpha):
    #test
    #tracemalloc.start()


    record = []

    #stateは一次元配列int
    state = shogi.get_initial_state()

    #othello (ACTION_SPACE= N_ROWS * N_COLS + 1)
    network = AlphaZeroResNet(action_space=shogi.ACTION_SPACE)
    #自分　メモリ開放
    tf.keras.backend.clear_session()
    # othello版: 引数は正規化されたndarray float32 自分と相手で２層[自分,相手]自分はcurrent_player
    # 駒ごとに層を作るので
    # 自分の駒の8種類[歩,香車,桂馬,銀,金,角,飛車,王]に成駒[成歩,成香,成桂,成銀,馬,竜]の6種類で14枚ずつ2つ
    # とりあえず24枚

    #network.predict(shogi.encode_state(state, 1))
    # 自分で
    encode_state = shogi.encode_state(state, 1)
    if len(encode_state.shape) == 3:
        encode_state = encode_state[np.newaxis, ...]
    with tf.device("/gpu:0"):
        nn_policy, nn_value = network(
            encode_state)


    network.set_weights(weights)

    mcts = MCTS(network=network, alpha=dirichlet_alpha)

    current_player = 1

    done = False

    i = 0

    while not done:

        mcts_policy = mcts.search(root_state=state,
                                  current_player=current_player,
                                  num_simulations=num_mcts_simulations)

        if i <= 10:
            # For the first 30 moves of each game, the temperature is set to τ = 1;
            # this selects moves proportionally to their visit count in MCTS
                #range(othello.ACTION_SPACE), p=mcts_policy)
            action = np.random.choice(
                range(shogi.ACTION_SPACE), p=mcts_policy)
        else:
            action = random.choice(
                np.where(np.array(mcts_policy) == max(mcts_policy))[0])

        #record.append(Sample(state, mcts_policy, current_player, None))
        record.append(Sample(state, coo_matrix(mcts_policy), current_player, None))

        # next_state, done = othello.step(state, action, current_player)

        next_state, done = shogi.step(state, action, current_player)

        state = next_state

        current_player = -current_player

        i += 1
        #ここから下は自分で書いた
        if(i % 20 == 0):
          print(f"step:{i}")
          
        """
        if(i==30):
          done = True
        """
    #: win: 1, lose: -1, draw: 0
    #reward_first, reward_second = othello.get_result(state)
    #reward_first, reward_second = shogi.get_result(state,last_player=-current_player)
    reward_first,reward_second = 0,0
    for sample in reversed(record):
        sample.reward = reward_first if sample.player == 1 else reward_second

    #test
    #snapshot = tracemalloc.take_snapshot()

    return record


@ray.remote(num_cpus=1, num_gpus=0)
def testplay(current_weights, num_mcts_simulations,
             dirichlet_alpha=None, n_testplay=24):

    t = time.time()

    win_count = 0

    #network = AlphaZeroResNet(action_space=othello.ACTION_SPACE)
    network = AlphaZeroResNet(action_space=shogi.ACTION_SPACE)

    # dummy_state = othello.get_initial_state()
    dummy_state = shogi.get_initial_state()

    # network.predict(othello.encode_state(dummy_state, 1))
    network.predict(shogi.encode_state(dummy_state, 1))

    network.set_weights(current_weights)

    for n in range(n_testplay):

        alphazero = random.choice([1, -1])

        mcts = MCTS(network=network, alpha=dirichlet_alpha)

        # state = othello.get_initial_state()
        state = shogi.get_initial_state()

        current_player = 1

        done = False

        while not done:

            if current_player == alphazero:
                mcts_policy = mcts.search(root_state=state,
                                          current_player=current_player,
                                          num_simulations=num_mcts_simulations)
                action = np.argmax(mcts_policy)
            else:
                # randomにしてみる
                #action = othello.greedy_action(state, current_player, epsilon=0.3)
                action = random.choice(shogi.get_valid_actions(state, current_player))

            next_state, done = shogi.step(state, action, current_player)

            state = next_state

            current_player = -1 * current_player

        #reward_first, reward_second = othello.get_result(state)
        reward_first, reward_second = shogi.get_result(state,-current_player)

        reward = reward_first if alphazero == 1 else reward_second
        result = "win" if reward == 1 else "lose" if reward == -1 else "draw"

        if reward > 0:
            win_count += 1
        """
        stone_first, stone_second = othello.count_stone(state)
        if alphazero == 1:
            stone_az, stone_tester = stone_first, stone_second
            color = "black"
        else:
            stone_az, stone_tester = stone_second, stone_first
            color = "white"
        """
        #message = f"AlphaZero ({color}) {result}: {stone_az} vs {stone_tester}"
        message = ""

        #othello.save_img(state, "img", f"test_{n}.png", message)
        shogi.save_img(state,current_player, "img", f"test_{n}_az{alphazero}.png", message)

    elapsed = time.time() - t

    return win_count, win_count / n_testplay, elapsed


def main(num_cpus, n_episodes=10000, buffer_size=40000,
         batch_size=64, epochs_per_update=5,
         num_mcts_simulations=50,
         update_period=300, test_period=300,
         n_testplay=20,
         save_period=3000,
         dirichlet_alpha=0.35):

    ray.init(num_cpus=num_cpus, num_gpus=1, local_mode=False)

    logdir = Path(__file__).parent / "log"
    if logdir.exists():
        shutil.rmtree(logdir)
    summary_writer = tf.summary.create_file_writer(str(logdir))

    network = AlphaZeroResNet(action_space=shogi.ACTION_SPACE)
    # 自分で書いた 前回の続きから学習を始める NNの重みをロードする
    weights_dir = Path(__file__).parent / "checkpoints"
    if not weights_dir.exists():
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


    current_weights = ray.put(network.get_weights())

    #optimizer = tf.keras.optimizers.SGD(lr=lr, momentum=0.9)
    optimizer = tf.keras.optimizers.Adam(lr=0.0005)

    replay = ReplayBuffer(buffer_size=buffer_size)

    #: 並列Selfplay
    work_in_progresses = [
        selfplay.remote(current_weights, num_mcts_simulations, dirichlet_alpha)
        for _ in range(num_cpus)] # 自分で上書きした
        #for _ in range(num_cpus - 2)]
    """
    test_in_progress = testplay.remote(
        current_weights, num_mcts_simulations, n_testplay=n_testplay)
    """
    n_updates = 0
    n = 0
    n_episodes = 15 #自分で上書きした
    while n <= n_episodes:
        update_period = 5 # 自分で上書きした
        for _ in tqdm(range(update_period)):
            #: selfplayが終わったプロセスを一つ取得
            finished, work_in_progresses = ray.wait(work_in_progresses, num_returns=1)
            replay.add_record(ray.get(finished[0]))
            work_in_progresses.extend([
                selfplay.remote(current_weights, num_mcts_simulations, dirichlet_alpha)
            ])
            n += 1

        #: Update network
        #if len(replay) >= 20000:
        #if len(replay) >= 2000:
        if len(replay) >= 4:

            num_iters = epochs_per_update * (len(replay) // batch_size)
            for i in range(num_iters):

                states, mcts_policy, rewards = replay.get_minibatch(batch_size=batch_size)
                with tf.GradientTape() as tape:

                    p_pred, v_pred = network(states, training=True)
                    value_loss = tf.square(rewards - v_pred)

                    policy_loss = -mcts_policy * tf.math.log(p_pred + 0.0001)
                    policy_loss = tf.reduce_sum(
                        policy_loss, axis=1, keepdims=True)

                    loss = tf.reduce_mean(value_loss + policy_loss)

                grads = tape.gradient(loss, network.trainable_variables)
                optimizer.apply_gradients(
                    zip(grads, network.trainable_variables))

                n_updates += 1

                #if i % 100 == 0:
                if i % 5 == 0:
                    with summary_writer.as_default():
                        tf.summary.scalar("v_loss", value_loss.numpy().mean(), step=n_updates)
                        tf.summary.scalar("p_loss", policy_loss.numpy().mean(), step=n_updates)

            current_weights = ray.put(network.get_weights())
        """
        if n % test_period == 0:
            print(f"{n - test_period}: TEST")
            win_count, win_ratio, elapsed_time = ray.get(test_in_progress)
            print(f"SCORE: {win_count}, {win_ratio}, Elapsed: {elapsed_time}")
            test_in_progress = testplay.remote(
                current_weights, num_mcts_simulations, n_testplay=n_testplay)

            with summary_writer.as_default():
                tf.summary.scalar("win_count", win_count, step=n-test_period)
                tf.summary.scalar("win_ratio", win_ratio, step=n-test_period)
                tf.summary.scalar("buffer_size", len(replay), step=n)
        """
        if n % save_period == 0:
            network.save_weights("checkpoints/network")

def selfplay_test():
  # selfplayのテスト
  network = AlphaZeroResNet(action_space=shogi.ACTION_SPACE)

  #: initialize network parameters
  # dummy_state = othello.encode_state(othello.get_initial_state(), 1)
  dummy_state = shogi.encode_state(shogi.get_initial_state(), 1)

  #network.predict(dummy_state)
  if len(dummy_state.shape) == 3:
      dummy_state = dummy_state[np.newaxis, ...]
  with tf.device("/gpu:0"):
      nn_policy, nn_value = network(
          dummy_state)
  
  current_weights = network.get_weights()

  #optimizer = tf.keras.optimizers.SGD(lr=lr, momentum=0.9)
  optimizer = tf.keras.optimizers.Adam(lr=0.0005)

  #: not 並列Selfplay
  num_mcts_simulations=50
  dirichlet_alpha=0.35
  _, snapshot = selfplay(current_weights, num_mcts_simulations, dirichlet_alpha)
  return snapshot

def test(num_mcts_simulations=50,
         n_testplay=20,num_cpus = 3):
  ray.init(num_cpus=num_cpus, num_gpus=1, local_mode=False)

  logdir = Path(__file__).parent / "log"
  if logdir.exists():
      shutil.rmtree(logdir)
  summary_writer = tf.summary.create_file_writer(str(logdir))
  
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
  
  current_weights = ray.put(network.get_weights())
  
  #optimizer = tf.keras.optimizers.SGD(lr=lr, momentum=0.9)
  optimizer = tf.keras.optimizers.Adam(lr=0.0005)
  
  test_in_progress = testplay.remote(
      current_weights, num_mcts_simulations, n_testplay=n_testplay)
  
  for n in range(n_testplay):
    print(f"{n}: TEST")
    win_count, win_ratio, elapsed_time = ray.get(test_in_progress)
    print(f"SCORE: {win_count}, {win_ratio}, Elapsed: {elapsed_time}")
    test_in_progress = testplay.remote(
        current_weights, num_mcts_simulations, n_testplay=n_testplay)

    with summary_writer.as_default():
        tf.summary.scalar("win_count", win_count, step=n)
        tf.summary.scalar("win_ratio", win_ratio, step=n)
        #tf.summary.scalar("buffer_size", len(replay), step=n)
  
if __name__ == "__main__":
    #main(num_cpus=23)
    main(num_cpus=3,buffer_size = 50,batch_size=4,save_period = 3,num_mcts_simulations=30)
    #test(n_testplay=3)
    """
    snapshot = selfplay_test()
    top_stats = snapshot.statistics('lineno')
    print("[ TOP 10 ]")
    for stat in top_stats[:10]:
      print(stat)
      for line in stat.traceback.format():
        print(line)
      print("=====")
    """