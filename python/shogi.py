# -*- coding: utf-8 -*-
import functools
from functools import cache
import json
import math
import numpy as np

from cshogi import *
#from svglib.svglib import svg2rlg
#from reportlab.graphics import renderPM
import os
import pathlib
import shutil


  # 移動方向 8 * 移動量 8 * mass 81 + 桂馬 2 * 4 + 成る8*8*81 + 成る桂馬 2 * 4 + 持ち駒 7 * マス 81
  # 出力合計 10951
ACTION_SPACE = 10951

@cache
def get_initial_state():
  board = Board()
  state = board.pieces
  in_hand = board.pieces_in_hand
  state.extend(in_hand[0])
  state.extend(in_hand[1])

  return state

def encode_state(state,current_player):
  # othello版: 引数は正規化されたndarray float32 自分と相手で２層[自分,相手]自分はcurrent_player
  # 駒ごとに駒の場所だけ1の盤面を作るので
  # 自分の駒の8種類[歩,香車,桂馬,銀,金,角,飛車,王]に成駒[成歩,成香,成桂,成銀,馬,竜]の6種類で14枚ずつ2つ
  # + 持ち駒、王以外の8枚 持ってる数で全部埋める
  # pieces 番号 角は5,21竜馬は13,29
  # おそらく[歩,  香車,  桂馬,  銀,  角,  飛車, 金,  王]という並び方
  #          1,17 2,18   3,19   4,20 5,21 6,22  7,23 8,24  成りごまはそれぞれ+8
  # とりあえず24枚
  # 盤面は左右にそれぞれの陣地
  # 左が-(相手,1)
  
  in_hand = state[81:]
  state = np.array(state[0:81]).reshape(9, 9)
  pieces_state1 = []
  pieces_state2 = []
  for i in range(32):
    if(i == 0):
      continue
    elif(15<=i and i<=16):
      continue
    elif(31<=i and i<=32):
      continue
    if(i<=14):
      pieces_state1.append((state == i))
    elif(17<=i):
      pieces_state2.append((state == i))

  #print("len(s1):{},len(s2):{}".format(len(pieces_state1), len(pieces_state2)))
  #print("piece_state1")
  #print(pieces_state2)
  assert len(pieces_state1) == len(pieces_state2) == 14

  pieces_state = []
  if(current_player == 1):
    pieces_state = pieces_state1 + pieces_state2
  elif(current_player == -1):
    pieces_state = pieces_state2 + pieces_state1
  else:
    print("error:current_player isnt 1 or -1 current_player:",current_player)

  assert len(pieces_state) == 28

  # 持ち駒部分
  in_hand_state = []
  for num in in_hand:
    in_hand_state.append(np.full((9, 9), num))
  
  pieces_state = pieces_state + in_hand_state

  x = np.stack(pieces_state, axis=2).astype(np.float32)
  #print("encode_state:",x)

  return x
  """
  #歩
  p1_hu = (state == 1)
  p2_hu = (state == 17)

  #香車
  p1_hu = (state == 2)
  p2_hu = (state == 17)
  """

def is_done(state,current_player):
  board = board_set(state,current_player)
  """
  #後一手で詰んだら終わり
  done = False
  if(board.mate_move_in_1ply() != 0):
    done = True
  elif(board.is_nyugyoku()):
    done = True
  """
  #board.is_check()は王手がかけられていればTrue
  if(board.is_check()):
    return True
  elif(board.is_nyugyoku()):
    return True
  elif(board.is_draw() == REPETITION_DRAW):
    return True
  else:
    return False
  #done = board.is_game_over()

  return done

def get_result(state,last_player):
  # 勝った方1負けたほう-1 引き分けはどちらも0
  # 右側最初
  # last_player:最後に指したプレイヤー
  board = board_set(state,-last_player)  
  """
  # last_playerの負け
  if(board.mate_move_in_1ply() != 0):
    if(last_player == 1):
      return -1, 1
    elif(last_player == -1):
      return 1 ,-1
    else:
      print("last_player is not 1 or -1")
  """

  if(board.is_nyugyoku()):
    # 入玉の条件を満たしたターンでは入玉を宣言できず
    # 相手が駒を動かしたとき条件が満たせていれば成功
    # last_playerと逆のプレイヤーが勝ち
    # 入玉が成功したらtrueと解釈(怪しい)
    if(last_player == 1):
      return -1, 1
    elif(last_player == -1):
      return 1 ,-1
    else:
      print("last_player is not 1 or -1")
  elif(board.is_draw() == REPETITION_DRAW):
    return 0, 0
  # 詰んでる状態で
  # TODO 勝利判定超怪しい
  elif(board.is_check()):
    if(last_player == 1):
      return 1, -1
    elif(last_player == -1):
      return -1 ,1
    else:
      print("last_player is not 1 or -1")

  else:
    # is_doneがtrueの場合この関数を実行するので絶対ゲームは終わっている
    # is_doneでis_check()がtrueと出ていてもこの関数ではfalseと出る事がある
    # なので勝ち負けのあるリザルトを出す
    if(last_player == 1):
      return 1, -1
    elif(last_player == -1):
      return -1 ,1
    else:
      print("last_player is not 1 or -1")
    """
    #print("done?")
    return 0, 0
    """

def div_mod(x,div_num):
  if(x < 0):
    print("x < 0 x:{}".format(x))
  # 切り捨て
  shou = math.floor(x / div_num)
  amari = x % div_num

  return shou, amari

@cache
def xy_to_usi(x,y):
  # xy はpiecesをreshapeした形式のもの
  # y は+1 xはアルファベット小文字
  # xy入れ替わる
  usi_x = str(y + 1)
  a = "abcdefghi"
  usi_y = a[x]
  usi_xy = usi_x + usi_y
  
  return usi_xy

@cache
def usi_to_xy(usi_xy):
  usi_x = usi_xy[0]
  usi_y = usi_xy[1]
  y = int(usi_x) - 1
  #abcd から0123
  a = "abcdefghi"
  x = a.find(usi_y)

  return x,y

def keima_action_xy(start_mx,start_my,action,current_player):
  if(action==0):
    goal_mx = start_mx + (-2 * current_player)
    goal_my = start_my + (1 * current_player)
  elif(action == 1):
    goal_mx = start_mx + (-2 * current_player)
    goal_my = start_my + (-1 * current_player)
  else:
    print("action is not 0 or 1, action:{}".format(action))

  valid = True
  if(goal_mx < 0 or goal_my < 0):
    valid = False
  elif(goal_mx > 8 or goal_my > 8):
    valid = False

  return goal_mx,goal_my,valid

def narikei_action_xy(start_mx,start_my,action,current_player):
  # 成桂 ごり押ししてます
  if(action == 0):
    goal_mx = start_mx + (-1 * current_player)
    goal_my = start_my + (1 * current_player)
  elif(action == 1):
    goal_mx = start_mx + (-1 * current_player)
    goal_my = start_my
  elif(action == 2):
    goal_mx = start_mx + (-1 * current_player)
    goal_my = start_my + (-1 * current_player)
  elif(action == 3):
    goal_mx = start_mx
    goal_my = start_my + (-1 * current_player)
  elif(action == 4):
    goal_mx = start_mx + (1 * current_player)
    goal_my = start_my
  elif(action == 5):
    goal_mx = start_mx
    goal_my = start_my + (1 * current_player)

  valid = True
  if(goal_mx < 0 or goal_my < 0):
    valid = False
  elif(goal_mx > 8 or goal_my > 8):
    valid = False

  return goal_mx,goal_my,valid


def seibun_to_xy(start_mx,start_my,houkou,kyori,current_player):

  # 方向と距離を解析します
  # houkouは駒に対して定義する
  # 方向は駒をまっすぐおいて左上から右回り
  if(houkou == 0):
    goal_mx = start_mx + (-kyori * current_player)
    goal_my = start_my + (kyori * current_player)
  elif(houkou == 1):
    goal_mx = start_mx + (-kyori * current_player)
    goal_my = start_my
  elif(houkou == 2):
    goal_mx = start_mx + (-kyori * current_player)
    goal_my = start_my + (-kyori * current_player)
  elif(houkou == 3):
    goal_mx = start_mx
    goal_my = start_my + (-kyori * current_player)
  elif(houkou == 4):
    goal_mx = start_mx + (kyori * current_player)
    goal_my = start_my + (-kyori * current_player)
  elif(houkou == 5):
    goal_mx = start_mx + (kyori * current_player)
    goal_my = start_my
  elif(houkou == 6):
    goal_mx = start_mx + (kyori * current_player)
    goal_my = start_my + (kyori * current_player)
  elif(houkou == 7):
    goal_mx = start_mx
    goal_my = start_my + (kyori * current_player)

  valid = True
  if(goal_mx < 0 or goal_my < 0):
    valid = False
  elif(goal_mx > 8 or goal_my > 8):
    valid = False

  return goal_mx,goal_my,valid

# ソートされた指定した駒種(敵駒、成駒を含む)の場所のリストを返す
def poslist_of_seed(pieces,og_seed):
  #場所特定
  pieces_arr = np.array(pieces)
  idxs = np.where(pieces_arr == og_seed)[0]
  # 成駒
  p_idxs = np.where(pieces_arr == og_seed + 8)[0]
  # 相手駒
  o_idxs = np.where(pieces_arr == og_seed + 16)[0]
  #相手成駒
  op_idxs = np.where(pieces_arr == og_seed + 16+8)[0]
  
  IDXs = np.concatenate([idxs,p_idxs,o_idxs,op_idxs])
  IDXs = np.sort(IDXs)

  return IDXs

def board_set(state,current_player):
  board = Board()
  if(current_player == -1):
    board.push_pass()
  pieces = state[0:81]
  in_hand = (state[81:81+7],state[81+7:81+14])
  board.set_pieces(pieces,in_hand)
  # set_pieces()ではplayerが変わらない
  # current_player -1 なら push_pass()

  return board

def action_mynum_to_usi(state,action,current_player):
  valid = True
  # ここでのactionは自分と敵の区別による合法判定をしない
  pieces = state[0:81]
  # 移動方向 8 * 移動量 8 * mass 81 + 桂馬 2 * 4 + 成る8*8*81 + 成る桂馬 2 * 4 + 持ち駒 7 * マス 81
  # 出力合計 10951
  promote = False
  keima = False
  mode = 0 # 駒を進める:0 進めて成る:1 置く:2
  if(action < 5184):
    mass,amari = div_mod(action,64)
    houkou, kyori = div_mod(amari,8)
    kyori += 1
  elif (action < 5184 + 8):
    piece,amari = div_mod(action-5184,2)
    keima = True
  elif(action < 5184 + 8 + 5184):
    mode = 1
    mass,amari = div_mod(action-(5184 + 8),64)
    houkou, kyori = div_mod(amari,8)
    kyori += 1
    promote = True
  elif (action < 5184 + 8 + 5184 + 8):
    mode = 1
    piece ,amari = div_mod(action-(5184 + 8 + 5184),2)
    keima = True
    promote = True
  elif(action < 5184 + 8 + 5184 + 8 + 567):
    mode = 2
    piece,mass = div_mod(action-(5184 + 8 + 5184 + 8),81)
  else:
    print("action >= {},action:{}".format(ACTION_SPACE,action))

  # massからpieceを出す
  if(keima):
    seed = 3
    n = piece
  elif(mode == 2):
    seed = piece

  if(mode < 2):
    if(keima):
      IDXs = poslist_of_seed(pieces,seed)
      mass = IDXs[n]
    # x はplayer0の陣地からみて左が正の向きなので注意
    # y                        下(相手から向かってくる方)が正の向き
    start_my,start_mx = div_mod(mass,9)
    if(keima):
      goal_mx,goal_my,valid = keima_action_xy(start_mx,start_my,amari,current_player)
    else:
      # 方向と距離を解析します
      goal_mx,goal_my,valid = seibun_to_xy(start_mx,start_my,houkou,kyori,current_player)
    if(not valid):
      print("goal_mx:{},goal_my:{}".format(goal_mx,goal_my))
      print("start_mx:{},start_my:{}".format(start_mx,start_my))      
  
  if(mode < 2):
    # 文字に変換
    if(promote):
      usi_promote = "+"
    else:
      usi_promote = ""
    if(valid):
      usi_action = xy_to_usi(start_mx,start_my) + xy_to_usi(goal_mx,goal_my) + usi_promote
    else:
      usi_action = ""
  elif(mode==2):
    # goal_mx,goal_myを決める
    goal_my,goal_mx = div_mod(mass,9)
    # seed からusiの最初の一文字を決める
    # 0歩,1香車,2桂馬,3銀,4角,5飛車,6金, 王
    # P,   L,    N,    S,  B,  R,   G,   K
    initials = "PLNSBRG"
    initial = initials[seed]
    if(valid):
      usi_action = initial + "*" + xy_to_usi(goal_mx,goal_my)
    else:
      usi_action = ""
    
  return usi_action,valid

def usi_keima_action_mynum(pieces,usi_action,promote,player):
  #桂馬
  valid = True
  # 移動先
  gx, gy = usi_to_xy(usi_action[2:4])
  # 最初の2文字(座標)から駒を導き出す
  sx, sy = usi_to_xy(usi_action[0:2])
  # kyoriていう変数名だけど絶対値じゃないです
  kyori_x = gx - sx
  kyori_y = gy - sy
  mass = sy * 9 + sx
  #場所特定
  IDXs = poslist_of_seed(pieces,3)
  # その駒は配列をたどっていくと何番目?
  # n番目
  n = np.where(IDXs==mass)[0][0]

  # kyori_y で決まる
  if(player==1):
    #kyori が - なら右
    if(kyori_y == 1 and kyori_x == -2):
      a = 0
    elif(kyori_y == -1 and kyori_x == -2):
      a = 1
    else:
      valid = False
      print("違和感...,usi_action:{} kyori_x:{}, kyori_y:{}".format(usi_action,kyori_x,kyori_y))
  elif(player == -1):
    if(kyori_y == -1 and kyori_x == 2):
      a = 0
    elif(kyori_y == 1 and kyori_x == 2):
      a = 1
    else:
      valid = False
      print("違和感....,usi_action:{} kyori_x:{}, kyori_y:{}".format(usi_action,kyori_x,kyori_y))
  if(valid):
    if(promote):
      action = 5184 + 8 + 5184 + 2 * n + a
    else:
      action = 5184 + 2 * n + a
  else:
    action = -1

  return action,valid

@functools.lru_cache(maxsize=1024)
def usi_move_to_mynum(usi_action,promote,player):
  valid = True
  gx, gy = usi_to_xy(usi_action[2:4])
  # 最初の2文字(座標)から駒を導き出す
  sx, sy = usi_to_xy(usi_action[0:2])
  # kyoriていう変数名だけど絶対値じゃないです
  kyori_x = gx - sx
  kyori_y = gy - sy
  
  if(kyori_x != 0):
    # kyori_x を使う
    kyori = abs(kyori_x)
  elif(kyori_y != 0):
    # kyori_y を使う
    kyori = abs(kyori_y)
  else:
    print("動いてないみたい, sx,sy:{},{},gx,gy: {},{}".format(sx,sy,gx,gy))

  if(kyori_x != 0 and kyori_y != 0):
    if(abs(kyori_x) != abs(kyori_y)):
      valid = False
      print("非合法な動き,sx,sy:{},{},gx,gy: {},{}".format(sx,sy,gx,gy))

  if(player == 1):
    if(kyori_x < 0 and kyori_y > 0):
      houkou = 0
    elif(kyori_x < 0 and kyori_y == 0):
      houkou = 1
    elif(kyori_x < 0 and kyori_y < 0):
      houkou = 2
    elif(kyori_x == 0 and kyori_y < 0):
      houkou = 3
    elif(kyori_x > 0 and kyori_y < 0):
      houkou = 4
    elif(kyori_x > 0 and kyori_y == 0):
      houkou = 5
    elif(kyori_x > 0 and kyori_y > 0):
      houkou = 6
    elif(kyori_x == 0 and kyori_y > 0):
      houkou = 7
  elif(player == -1):
    if(kyori_x < 0 and kyori_y > 0):
      houkou = 4
    elif(kyori_x < 0 and kyori_y == 0):
      houkou = 5
    elif(kyori_x < 0 and kyori_y < 0):
      houkou = 6
    elif(kyori_x == 0 and kyori_y < 0):
      houkou = 7
    elif(kyori_x > 0 and kyori_y < 0):
      houkou = 0
    elif(kyori_x > 0 and kyori_y == 0):
      houkou = 1
    elif(kyori_x > 0 and kyori_y > 0):
      houkou = 2
    elif(kyori_x == 0 and kyori_y > 0):
      houkou = 3
  else:
    print("player? player:{}".format(player))

  if(valid):
    action = (sy * 9 + sx) * 64 + houkou * 8 + kyori-1
    if(promote):
      action += 5184 + 8
  else:
    action = -1

  return action,valid

def usi_to_action_mynum(state: list, usi_action: list,player: int):

  valid = True
  #pieces = state[0:81]
  
  if("*" in usi_action):
    # 持ち駒を置くアクション
    initials = "PLNSBRG"
    seed = initials.find(usi_action[0])
    # 移動先
    gx, gy = usi_to_xy(usi_action[2:4])
    mass = gy * 9 + gx
    # convert
    action = 5184 + 8 + 5184 + 8 + 81 * seed + mass
  else:
    # 成るアクションか
    promote = False
    if("+" in usi_action):
      promote = True
    # 最初の2文字(座標)から駒を導き出す
    sx, sy = usi_to_xy(usi_action[0:2])
    mass = sy * 9 + sx
    piece_seed = state[mass]
    if(piece_seed >= 17):
      seed = piece_seed - 16
    else:
      seed = piece_seed
    if(seed ==3):
      #桂馬
      action,valid = usi_keima_action_mynum(state[0:81],usi_action,promote,player)
    else:
      action,valid = usi_move_to_mynum(usi_action,promote,player)

  return action,valid

#没案
"""
def action_mynum_to_usi(state,action,current_player):
  # 注: ここでのseedは成駒を考慮しないものとする
  board = Board()
  pieces = state[0:81]
  in_hand = (state[81:81+7],state[81+7:81+14])
  board.set_pieces(pieces,in_hand)
  # set_pieces()ではplayerが変わらない
  # current_player -1 なら push_pass()
  if(current_player == -1):
    board.push_pass()

  # 移動方向 8 * 移動量 8 * 駒 (自駒18)+(最初敵駒17) + 桂馬 2 * 4 + 成桂 6 * 4 + 成る8*8*(15+15) + 成る桂馬 2 * 4 + 持ち駒 7 * マス 81
  # 出力合計 4757
  promote = False
  keima = False
  narikei = False
  mode = 0 # 駒を進める:0 進めて成る:1 置く:2
  if(action < 2240):
    piece,amari = div_mod(action,64)
    houkou, kyori = div_mod(amari,8)
    kyori += 1
  elif (action < 2248):
    piece,amari = div_mod(action-2240,2)
    keima = True
  elif(action < 2248 + 24):
    piece,amari = div_mod(action-2248,6)
    narikei = True
  elif(action < 2248 + 24 + 1940):
    mode = 1
    piece,amari = div_mod(action-2248,64)
    houkou, kyori = div_mod(amari,8)
    kyori += 1
    promote = True
  elif (action < 2248 + 24 + 1948):
    mode = 1
    piece ,amari = div_mod(action-(2248 + 1940),2)
    keima = True
    promote = True
  elif(action < 2248 + 24 + 1948 + 567):
    mode = 2
    piece,mass = div_mod(action-(2248+1948),81)
  else:
    print("action >= {},action:{}".format(ACTION_SPACE,action))


  if(keima):
    seed = 3
    n = piece
  elif(narikei):
    seed = 3
    n = piece
  elif(mode < 2):
    if(piece < 18):
      seed = 1
      n = piece
    elif(piece<18+4):
      # 香車
      seed = 2
      n = piece - 18
    elif(piece < 18+4+4):
      # 銀
      seed = 4
      n = piece - 18+4
    elif(piece < 18+4+4+2):
      #角
      seed = 5
      n = piece - 18+4+4
    elif(piece < 18+4+4+2+2):
      # 飛車
      seed = 6
      n = piece - 18+4+4+2
    elif(piece < 18+4+4+2+2+4):
      # 金
      seed = 7
      n = piece - 18+4+4+2+2
    elif(piece < 18+4+4+2+2+4+1):
      # 王
      seed = 8
      n = piece - 18+4+4+2+2+4
      if(n!=0):
        print("piece is not valid. piece:{},n:{}".format(piece,n))
    else:
      print("piece > {}, piece:{}".format(18+4+4+2+2+4+1,piece))
  elif(mode == 2):
    seed = piece
  else:
    print("mode == 0 or 1 or 2, mode:{}".format(mode))

  pieces_arr = np.array(pieces)

  # usiに変える

  if(mode<2):
    if(current_player== -1):
      seed += 16
    idxs = np.where(pieces_arr == seed)[0]
    # 成駒
    p_idxs = np.where(pieces_arr == seed + 8)[0]
    # 相手駒
    o_idxs = np.where(pieces_arr == seed + 16)[0]
    #相手成駒
    op_idxs = np.where(pieces_arr == seed + 16+8)[0]
    
    IDXs = np.concatenate([idxs,p_idxs,o_idxs,op_idxs])
    IDXs = np.sort(IDXs)
    mass = IDXs[n]
    # 現在の駒の位置
    start_my,start_mx = div_mod(mass,9)
    # x はplayer0の陣地からみて左が正の向きなので注意
    # y                        下(相手から向かってくる方)が正の向き
    if(keima):
      goal_mx,goal_my,valid = keima_action_xy(start_mx,start_my,amari,current_player)
    elif(narikei):
      goal_mx,goal_my,valid = narikei_action_xy(start_mx,start_my,amari,current_player)
    else:
      # 方向と距離を解析します
      goal_mx,goal_my,valid = seibun_to_xy(start_mx,start_my,houkou,kyori,current_player)
      
    # 文字に変換
    if(promote):
      usi_promote = "+"
    else:
      usi_promote = ""
    usi_action = xy_to_usi(start_mx,start_my) + xy_to_usi(goal_mx,goal_my) + usi_promote
  elif(mode==2):
    # goal_mx,goal_myを決める
    goal_my,goal_mx = div_mod(mass,9)
    # seed からusiの最初の一文字を決める
    # 0歩,1香車,2桂馬,3銀,4角,5飛車,6金, 王
    # P,   L,    N,    S,  B,  R,   G,   K
    initials = "PLNSBRG"
    initial = initials[seed]
    usi_action = initial + "*" + xy_to_usi(goal_mx,goal_my)

  return usi_action


def usi_to_action_mynum(state, usi_action,player):

  board = Board()
  pieces = state[0:81]
  in_hand = (state[81:81+7],state[81+7:81+14])
  board.set_pieces(pieces,in_hand)
  # set_pieces()ではplayerが変わらない
  # current_player -1 なら push_pass()
  if(player == -1):
    board.push_pass()

  # 成るアクションか
  promote = False
  if(len(usi_action) == 5):
    if(usi_action[4] != "+"):
      print("未確認usi_action:{}".format(usi_action))
    else:
      promote = True

  # 移動先
  gx, gy = usi_to_xy(usi_action[2:4])
  
  if(usi_action[1] == "*"):
    # 持ち駒を置くアクション
    initials = "PLNSBRG"
    seed = initials.find(usi_action[0])
    mass = gy * 9 + gx
    # convert
    action = 2248 + 24 + 1948 + 81 * seed + mass
  else:
    # 最初の2文字(座標)から駒を導き出す
    # その駒は配列をたどっていくと何番目?
    sx, sy = usi_to_xy(usi_action[0:2])
    mass = sy * 9 + sx
    piece_seed = pieces[mass]
    if(player == 1):
      seed = piece_seed
    elif(player==-1):
      seed = piece_seed - 16

    # 成駒なら成る前のseed
    if(promote):
      native_seed = seed - 8
    else:
      native_seed = seed

    pieces_arr = np.array(pieces)
    idxs = np.where(pieces_arr == piece_seed)[0]
    # 成駒
    p_idxs = np.where(pieces_arr == piece_seed + 8)[0]
    # 相手駒
    o_idxs = np.where(pieces_arr == seed + 16)[0]
    #相手成駒
    op_idxs = np.where(pieces_arr == seed + 16+8)[0]
    
    IDXs = np.concatenate([idxs,p_idxs,o_idxs,op_idxs])
    IDXs = np.sort(IDXs)

    # n番目
    n = np.where(IDXs==mass)[0][0]


    if(native_seed==3):
      #桂馬
      piece = n
    elif(native_seed == 1):
      # 歩
      piece = n
    elif(native_seed == 2):
      # 香車
      piece = 18 + n
    elif(native_seed == 4):
      # 銀
      piece = 18+4 + n
    elif(native_seed == 5):
      # 角
      piece = 18+4+4 + n
    elif(native_seed == 6):
      # 飛車
      piece = 18+4+4+2 + n
    elif(native_seed == 7):
      # 金
      piece = 18+4+4+2+2 + n
    elif(native_seed == 8):
      # 王
      piece = 18+4+4+2+2+4 + n

    # kyoriていう変数名だけど絶対値じゃないです
    kyori_x = gx - sx
    kyori_y = gy - sy
    if(seed ==3):
      #桂馬
      # kyori_y で決まる
      if(player==1):
        #kyori が - なら右
        if(kyori_y == 1):
          a = 0
        elif(kyori_y == -1):
          a = 1
        else:
          print("違和感..., kyori_y:{}".format(kyori_y))
      elif(player == -1):
        if(kyori_y == -1):
          a = 0
        elif(kyori_y == 1):
          a = 1
        else:
          print("違和感..., kyori_y:{}".format(kyori_y))
      if(promote):
        action = 2248 + 24 + 1940 + 2 * piece + a
      else:
        action = 2240 + 2 * piece + a
    elif(seed == 3 + 8):
      # 成桂
      if(player == 1):
        if(kyori_x < 0 and kyori_y > 0):
          a = 0
        elif(kyori_x < 0 and kyori_y == 0):
          a = 1
        elif(kyori_x < 0 and kyori_y < 0):
          a = 2
        elif(kyori_x == 0 and kyori_y < 0):
          a = 3
        elif(kyori_x > 0 and kyori_y == 0):
          a = 4
        elif(kyori_x == 0 and kyori_y > 0):
          a = 5
      elif(player == -1):
        if(kyori_x < 0 and kyori_y == 0):
          a = 4
        elif(kyori_x == 0 and kyori_y < 0):
          a = 5
        elif(kyori_x > 0 and kyori_y < 0):
          a = 0
        elif(kyori_x > 0 and kyori_y == 0):
          a = 1
        elif(kyori_x > 0 and kyori_y > 0):
          a = 2
        elif(kyori_x == 0 and kyori_y > 0):
          a = 3
      
      action = 2248 + 6 * piece + a

    else:
      if(kyori_x != 0):
        # kyori_x を使う
        kyori = abs(kyori_x)
      elif(kyori_y != 0):
        # kyori_y を使う
        kyori = abs(kyori_y)
      else:
        print("動いてないみたい, sx,sy:{},{},gx,gy: {},{}".format(sx,sy,gx,gy))

      if(player == 1):
        if(kyori_x < 0 and kyori_y > 0):
          houkou = 0
        elif(kyori_x < 0 and kyori_y == 0):
          houkou = 1
        elif(kyori_x < 0 and kyori_y < 0):
          houkou = 2
        elif(kyori_x == 0 and kyori_y < 0):
          houkou = 3
        elif(kyori_x > 0 and kyori_y < 0):
          houkou = 4
        elif(kyori_x > 0 and kyori_y == 0):
          houkou = 5
        elif(kyori_x > 0 and kyori_y > 0):
          houkou = 6
        elif(kyori_x == 0 and kyori_y > 0):
          houkou = 7
      elif(player == -1):
        if(kyori_x < 0 and kyori_y > 0):
          houkou = 4
        elif(kyori_x < 0 and kyori_y == 0):
          houkou = 5
        elif(kyori_x < 0 and kyori_y < 0):
          houkou = 6
        elif(kyori_x == 0 and kyori_y < 0):
          houkou = 7
        elif(kyori_x > 0 and kyori_y < 0):
          houkou = 0
        elif(kyori_x > 0 and kyori_y == 0):
          houkou = 1
        elif(kyori_x > 0 and kyori_y > 0):
          houkou = 2
        elif(kyori_x == 0 and kyori_y > 0):
          houkou = 3

      else:
        print("player? player:{}".format(player))

      action = piece * 64 + houkou * 8 + kyori

  return action
"""

@functools.lru_cache(maxsize=1024)
def _get_valid_actions(state_str: list, player: int):
  state = json.loads(state_str)
  # 戻り値: list 1次元 int

  board = Board()
  # set_pieces()ではplayerが変わらない
  if(player == -1):
    board.push_pass()
  pieces = state[0:81]
  in_hand = (state[81:81+7],state[81+7:81+14])
  board.set_pieces(pieces,in_hand)

  v_usi_a = [move_to_usi(a) for a in board.legal_moves]


  valid_actions = [usi_to_action_mynum(state,valid_usi,player)[0] for valid_usi in v_usi_a]
  """
  valid_actions = []
  for i in range(len(v_usi_a)):
    usi_action, valid = usi_to_action_mynum(state,v_usi_a[i],player)
    assert valid
    valid_actions.append(usi_action)
  """
  return valid_actions

def get_valid_actions(state: list, player: int):
    state_str = json.dumps(state)
    return _get_valid_actions(state_str, player)

def step(state: list, action: int, player: int):

  assert action in get_valid_actions(state, player)

  board = Board()
  if(player == -1):
    board.push_pass()
  pieces = state[0:81]
  in_hand = (state[81:81+7],state[81+7:81+14])
  board.set_pieces(pieces,in_hand)
  # set_pieces()ではplayerが変わらない

  usi_action, valid = action_mynum_to_usi(state,action,player)
  if(not valid):
    print("in step state:{}".format(state))
    print(np.array(state[0:81]).reshape(9,9))
    print("inhand,{}".format((state[81:81+7],state[81+7:81+14])))
    print("action:{},player:{}".format(action,player))
  assert valid
  board.push_usi(usi_action)

  next_state = board.pieces
  next_in_hand = board.pieces_in_hand
  next_state.extend(next_in_hand[0])
  next_state.extend(next_in_hand[1])

  done = is_done(next_state,-player)

  return next_state, done

def save_img(state,current_player, savedir, fname, comment):
  # svgを保存してからpngに変換する
  #svg
  board = board_set(state,current_player)
  if not os.path.exists("svg"):
    os.makedirs("svg")
  svg_fname =  pathlib.PurePath(fname).stem +".svg" 
  svg_save_path = os.path.join("svg", svg_fname)
  with open(svg_save_path, mode='w') as fp:
    fp.write(str(board.to_svg()))
  """
  #png
  if not os.path.exists(savedir):
    os.makedirs(savedir)
  save_path = os.path.join(savedir, fname)
  drawing = svg2rlg(svg_save_path)
  renderPM.drawToFile(drawing, save_path, fmt="PNG")
  """
