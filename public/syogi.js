// JavaScript source code

function seed_to_index(seed){
	return seed - 1;
}

function sum_array(arr) {
  let sum = 0;
	for (let i = 0; i < arr.length; i++) {
		sum += arr[i];
  }
	return sum;
}

// piece_listの番号からpiece_statusの番号へ
function ctr_num_to_stat_num(control_number, NUM_PIECE) {
  let status_number = control_number;
  if (control_number >= sum_array(NUM_PIECE)) {
    console.log("error");
    console.log("control_number,NUM_PIECE", control_number, NUM_PIECE);
  }
  for (let seed_idx = 0; seed_idx < NUM_PIECE.length; seed_idx++) {
    // console.log("seed_idx","status_number",seed_idx, status_number);
		if (status_number >= NUM_PIECE[seed_idx]) {
      status_number -= NUM_PIECE[seed_idx];
    } else {
      // seedは１から始まる
      return [seed_idx+1, status_number];
		}
	}
}

function stat_num_to_ctr_num(seed, status_number, NUM_PIECE) {
  let control_number = 0;
  let seed_idx = seed_to_index(seed);
	for (let i = 0; i < seed_idx; i++) {
		control_number += NUM_PIECE[i];
	}
	control_number += status_number;
	const sum_piece = sum_array(NUM_PIECE);
	if (control_number >= sum_piece) {
		console.log("error control_number >= sum_piece");
		console.log("control_number, sum_piece,NUM_PIECE");
		console.log(control_number, sum_piece, NUM_PIECE);
	}
	return control_number;
}

function mass_to_xy(mass, NUM_HEIGHTMASS, NUM_WIDTHMASS) {
  if (mass >= 0) {
    let x = mass;
    for (let y = 0; y < NUM_HEIGHTMASS; y++) {
      if (x < NUM_WIDTHMASS) {
        return [x, y];
      }
      x -= NUM_WIDTHMASS;
    }
  } else {
    let x = -mass;
    for (let y = 0; y < NUM_HEIGHTMASS; y++) {
      if (x < NUM_WIDTHMASS) {
        return [-x, -y];
      }
      x -= NUM_WIDTHMASS;
    }
  }
}

function xy_to_mass(x, y, NUM_WIDTHMASS) {
  let mass = y * NUM_WIDTHMASS + x;
  // console.log(mass);
  return mass;
}

function is_valid_action(board_array, action, player,NUM_HEIGHTMASS,NUM_WIDTHMASS) {
  // console.log("action, player",action, player);
  let NUM_ALLMASS = NUM_HEIGHTMASS * NUM_WIDTHMASS;
	if (action < 0 && action >= NUM_ALLMASS) {
		// 将棋盤の外
	  console.log("error,action,board_array[action]",action,board_array[action]);
		  return false;
	}	else if (board_array[action] < 0 && player == 0) {
		// 動こうとするマスにこの駒の味方の駒がいなければ動ける
		  return true;
	} else if (board_array[action] > 0 && player == 1) {
		  return true;
	} else if (board_array[action] == 0) {
    return true;
  } else if (board_array[action] > 0 && player == 0) {
    return false;
  } else if (board_array[action] < 0 && player == 1) {
    return false;
  } else {
	  console.log("error,action,board_array[action]",action,board_array[action]);
	}
}

// 駒種 歩桂香金銀飛角王と金成桂成香成銀竜王竜馬
// seed 1 2 3 4 5 6 7 8 9   10  11  12  13  14
// idx  0 1 2 3 4 5 6 7 8   9   10  11  12  13
function seed_evo_to_og(evo_seed) {
  let og_seed;
  if (9 <= evo_seed) {
    if (evo_seed <= 11) {
      og_seed = evo_seed - 8;
    } else if (evo_seed <= 14) {
      og_seed = evo_seed - 7;
    }
  } else {
    console.log("error evo_seed", evo_seed);
  }
  return og_seed;
}

function usi_to_xy(usi_xy) {
  usi_x = usi_xy[0];
  usi_y = usi_xy[1];
  bx = [8, 7, 6, 5, 4, 3, 2, 1, 0];
  x = bx[parseInt(usi_x) - 1];
  //abcd から0123
  a = "abcdefghi";
  y = a.indexOf(usi_y);
  
  return [x, y];
}

function usi_to_action(usi_action, board_array, piece_instructions, pieces_status, NUM_HEIGHTMASS, NUM_WIDTHMASS,NUM_PIECE) {
  let board = board_array.concat();
  let piece_status = pieces_status.concat();
  let sx;
  let sy;
  let gx;
  let gy;
  let start_mass;
  let goal_mass;
  let seed;
  let origin_seed;
  let og_seed_idx;
  let piece_idx;
  let evolves = false;
  if (usi_action[4] == "+") {
    evolves = true;
  }
  console.log(usi_action);
  [sx, sy] = usi_to_xy(usi_action.substr(0, 2));
  [gx, gy] = usi_to_xy(usi_action.substr(2, 4));
  start_mass = xy_to_mass(sx, sy, NUM_WIDTHMASS);
  goal_mass = xy_to_mass(gx, gy, NUM_WIDTHMASS);
  console.log("smass,gmass", start_mass, goal_mass);
  [origin_seed, piece_idx] = find_piece_for_mass(piece_status, start_mass, NUM_PIECE);
  og_seed_idx = seed_to_index(origin_seed);
  if (origin_seed == -1) {
    console.log("error cant find piece");
  }
  console.log(origin_seed);
  let evolve = false;
  if (piece_status[og_seed_idx][piece_idx].evolve) {
    seed = piece_instructions[og_seed_idx].evolves_to_seed;
    evolve = true;
  } else {
    seed = origin_seed;
  }
  if (piece_status[og_seed_idx][piece_idx].reserve) {
    return [];
  }
  valid_actions = get_valid_actions(board, piece_instructions,
    piece_status, seed, piece_idx, evolve, NUM_HEIGHTMASS, NUM_WIDTHMASS);
  if (valid_actions.includes(goal_mass)) {
    return [goal_mass, evolves, origin_seed, piece_idx];
  } else {
    console.log("error usi_action isnt in valid_action");
  }

}
// 一つの駒を指定し動けるマスを座標で返す
function get_valid_actions(board_array, piece_instructions, pieces_status, seed, piece_number,is_evolve,NUM_HEIGHTMASS,NUM_WIDTHMASS) {
	let board = board_array.concat();
  let seed_idx = seed_to_index(seed);
	let piece_status = pieces_status.concat();
  let piece_actions = piece_instructions[seed_idx].actions.concat();
  console.log("piece_actions",piece_actions);
	let valid_actions = [];
    console.log("board");
  for(let i=0;i<NUM_HEIGHTMASS;i++){
    console.log(board_array.slice(i*NUM_WIDTHMASS,(i+1)*NUM_WIDTHMASS));
  }
  let origin_seed;
  if (is_evolve) {
    origin_seed = seed_evo_to_og(seed);
  } else {
    origin_seed = seed;
  }
  let og_seed_idx = seed_to_index(origin_seed);
  if (piece_status[og_seed_idx][piece_number].reserve) {
		return [];
	}
  // 香車飛車系統
  if([3,6,7,13,14].includes(seed)){
    let position = 0;
    let action = 0;
    let player = piece_status[og_seed_idx][piece_number].player;
		if(piece_status[og_seed_idx][piece_number].player == 1){
			opponent = 1;
		}else if(piece_status[og_seed_idx][piece_number].player == 0){
			opponent = -1;
    }
    position = piece_status[og_seed_idx][piece_number].mass;
    let x = 0;
    let y = 0;
    [x, y] = mass_to_xy(position, NUM_HEIGHTMASS, NUM_WIDTHMASS);
    let action_x = 0;
    let action_y = 0;
    let last_action_x = 0;
    let last_action_y = 0;
    for (let i = 0; i < piece_actions.length; i++) {
      if (piece_status[og_seed_idx][piece_number].player == 1) {
        action = position - piece_actions[i][0];
      } else if (piece_status[og_seed_idx][piece_number].player == 0) {
        action = position + piece_actions[i][0];
      }
      [last_action_x, last_action_y] = mass_to_xy(position, NUM_HEIGHTMASS, NUM_WIDTHMASS);
      //last_action_x -= 1; // わざと一つずらす
      //last_action_y -= 1; // わざと一つずらす
      //console.log("last_action_x,x", last_action_x, x);
      if (x === 0 && [-NUM_WIDTHMASS - 1, -1, NUM_WIDTHMASS - 1].includes(action - position)) {
        //左端にいて画面横端を越えたら
        continue;
      } else if (x === NUM_WIDTHMASS - 1 && [-NUM_WIDTHMASS + 1, 1, NUM_WIDTHMASS + 1].includes(action - position)) {
        //右端にいて画面横端を越えたら
        continue;
      }
      for(let j =0;j<piece_actions[i].length;j++){
        // 敵のアクションは反転させる
		    if(piece_status[og_seed_idx][piece_number].player == 1){
          action = position - piece_actions[i][j];
		    }else if(piece_status[og_seed_idx][piece_number].player == 0){
          action = position + piece_actions[i][j];
        }
        console.log("action, NUM_HEIGHTMASS, NUM_WIDTHMASS", action, NUM_HEIGHTMASS, NUM_WIDTHMASS);
        [action_x, action_y] = mass_to_xy(action, NUM_HEIGHTMASS, NUM_WIDTHMASS);
        //console.log("action_x,x", action_x, x);
        //console.log("last_action_x", last_action_x);
        //let ysa = Math.abs(last_action_y - action_y);
        //let xsa = Math.abs(last_action_x - action_x);
        //console.log("xsa,ysa",xsa, ysa);
        /*
        if ([6].includes(seed) && (action_x < 0 || NUM_WIDTHMASS <= action_x)) {
          // 画面横端を越えたら飛車
          break;
        */
        if (last_action_x === 0 && [-NUM_WIDTHMASS - 1, -1, NUM_WIDTHMASS - 1].includes(action - xy_to_mass(last_action_x, last_action_y, NUM_WIDTHMASS))) {
          //左端にいて画面横端を越えたら
          break;
        } else if (last_action_x === NUM_WIDTHMASS - 1 && [-NUM_WIDTHMASS + 1, 1, NUM_WIDTHMASS + 1].includes(action - xy_to_mass(last_action_x, last_action_y, NUM_WIDTHMASS))) {
          //右端にいて画面横端を越えたら
          break;
        }else if (is_valid_action(board, action, piece_status[og_seed_idx][piece_number].player, NUM_HEIGHTMASS, NUM_WIDTHMASS)) {
          // もし動いたとき駒をとるなら終わり
          if (board[action] > 0 && player == 1) {
            valid_actions.push(action);
            break;
          } else if (board[action] < 0 && player == 0) {
            valid_actions.push(action);
            break;
          }
          valid_actions.push(action);
        }else{
          // 途中で進めなくなったら終わり
          break;
        }
        last_action_x = action_x;
        last_action_y = action_y;
      }
    }
  }else{
    // 駒種のアクションを実際の座標に直す
    let position = 0;
    let action = 0;
      console.log("actions",piece_instructions[seed_idx].actions);
    for (var i in piece_instructions[seed_idx].actions) {
      position = piece_status[og_seed_idx][piece_number].mass;
      // 敵のアクションは反転させる
		  if(piece_status[og_seed_idx][piece_number].player == 1){
			  action = position - piece_instructions[seed_idx].actions[i];
		  }else if(piece_status[og_seed_idx][piece_number].player == 0){
			  action = position + piece_instructions[seed_idx].actions[i];
      }else{
			  console.log("error");
      }
		  if (is_valid_action(board, action, piece_status[og_seed_idx][piece_number].player, NUM_HEIGHTMASS, NUM_WIDTHMASS)) {
			  valid_actions.push(action);
		  }
	  }
  }
	return valid_actions;
}

function find_piece_for_mass(piece_status,mass,NUM_PIECE) {
	for (var seed_idx = 0; seed_idx < NUM_PIECE.length; seed_idx++) {
		for (var piece_idx = 0; piece_idx < NUM_PIECE[seed_idx]; piece_idx++) {
      if (piece_status[seed_idx][piece_idx].mass == mass) {
				return [seed_idx+1, piece_idx];
			}
		}
  }
  console.log("not find");
  console.log("NUM_PIECE", NUM_PIECE);
  console.log("NUM_PIECE.length, NUM_PIECE[seed_idx]", NUM_PIECE.length, NUM_PIECE[seed_idx]);
	return [-1, -1];
}

function syogi_init(board_array, NUM_WIDTHMASS, NUM_HEIGHTMASS) {
	// 配列を読み込んで、piece_status,piece_instructions,NUM_PIECEを返す
	console.log("board_array");
	console.log(board_array);
	// メモ配列初期化 var board_array = new Array(NUM_ALLMASS).fill(0);
	var piece_status = [[], [], [], [], [], [], [], [], [], [], []];
	var seed = 0;
	var NUM_PIECE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let control_number = 0;
	for (var i = 0; i < NUM_WIDTHMASS * NUM_HEIGHTMASS; i++) {
		if (board_array[i] != 0) {
			if (board_array[i] < 0) {
				seed = -board_array[i];
				player = 1;
			} else {
				seed = board_array[i];
				player = 0;
			}
			piece_status[seed_to_index(seed)].push(new SyogiPieceStatus(seed, control_number, player, mass = i));
			NUM_PIECE[seed_to_index(seed)] += 1;
		}
	}
	seed = 1;
	let j = 0;
	control_number = 0;
	for(let i = 0;i < sum_array(NUM_PIECE);i++){
		piece_status[seed_to_index(seed)][j].control_number = control_number;
		control_number++;
		if(j >= NUM_PIECE[seed_to_index(seed)] - 1){
			j++;
			j -= NUM_PIECE[seed_to_index(seed)];
			seed++;
    }else{
			j++;
    }
  }
  // 駒種 歩桂香金銀飛角王と金成桂成香成銀竜王竜馬
  // seed 1 2 3 4 5 6 7 8 9   10  11  12  13  14
  // idx  0 1 2 3 4 5 6 7 8   9   10  11  12  13
	// 駒種クラスの初期化
	// 各駒種のアクション
	// メモ actions １次元相対座標そのコマの座標を0として
	//              x+y*(横のマス数)
	/*
	for (var i = 0; i < 2; i++) {
		actions[i] = [];
	}
	*/
  let actions = new Array(20);
  for (let i = 0; i < 20; i++) {
    actions[i] = [];
  }
	//var actions = [[], [], [], [], [], [],[], [], [], [], [], [], []];
	var cnt = 0;
	actions[0][0] = -1 * NUM_WIDTHMASS;

  // action
  // 歩
  actions[0][0] = -1 * NUM_WIDTHMASS;
  //桂馬
  actions[1][0] = -2 * NUM_WIDTHMASS - 1;
  actions[1][1] = -2 * NUM_WIDTHMASS + 1;
  // 香車
  actions[2][0] = [];
  for (let j = 1; j <= NUM_HEIGHTMASS - 1; j++) {
    actions[2][0][j - 1] = -j * NUM_WIDTHMASS;
  }
  console.log(actions);
  // 金
  actions[3][0] = -1 * NUM_WIDTHMASS - 1;
  actions[3][1] = -1 * NUM_WIDTHMASS;
  actions[3][2] = -1 * NUM_WIDTHMASS + 1;
  actions[3][3] = -1;
  actions[3][4] = 1;
  actions[3][5] = 1 * NUM_WIDTHMASS;

  // 銀
  actions[4][0] = -1 * NUM_WIDTHMASS - 1;
  actions[4][1] = -1 * NUM_WIDTHMASS;
  actions[4][2] = -1 * NUM_WIDTHMASS + 1;
  actions[4][3] = 1 * NUM_WIDTHMASS - 1;
  actions[4][4] = 1 * NUM_WIDTHMASS + 1;

  // 飛車

  for(let j = 0;j<4;j++){
    actions[5][j] = [];
  }
  for (let j = 1; j <= NUM_HEIGHTMASS; j++) {
    /*
    console.log("actions[5]",actions[5]);
    console.log("actions[5][0]",actions[5][0]);
    console.log("actions[5][0][0]",actions[5][0][0]);
    */
    actions[5][0][j - 1] = -j * NUM_WIDTHMASS;
    actions[5][1][j - 1] = j * NUM_WIDTHMASS;
  }
  for (let j = 1; j <= NUM_WIDTHMASS; j++) {
    if (j == 0) {
      continue
    }
    actions[5][2][j - 1] = -j;
    actions[5][3][j - 1] = j;
  }
  // 角
  for(let j = 0;j<4;j++){
    actions[6][j] = [];
  }
  for (let j = 1; j <= NUM_HEIGHTMASS; j++) {
    actions[6][0][j - 1] = -j * NUM_WIDTHMASS - j;
    actions[6][1][j - 1] = -j * NUM_WIDTHMASS + j;
  }
  for (let j = 1; j <= NUM_HEIGHTMASS; j++) {
    actions[6][2][j - 1] = j * NUM_WIDTHMASS - j;
    actions[6][3][j - 1] = j * NUM_WIDTHMASS + j;
  }
  // 王
  actions[7][0] = -1 * NUM_WIDTHMASS - 1;
  actions[7][1] = -1 * NUM_WIDTHMASS;
  actions[7][2] = -1 * NUM_WIDTHMASS + 1;
  actions[7][3] = -1;
  actions[7][4] = 1;
  actions[7][5] = 1 * NUM_WIDTHMASS - 1;
  actions[7][6] = 1 * NUM_WIDTHMASS;
  actions[7][7] = 1 * NUM_WIDTHMASS + 1;

  // 竜王
  actions[8] = actions[5].concat();
  for (let j = 4; j <= 7; j++) {
    actions[8][j] = [];
  }
  /*
  for (let j = 1; j <= NUM_HEIGHTMASS; j++) {
    actions[8][j - 1] = -j * NUM_WIDTHMASS;
    actions[8][NUM_HEIGHTMASS + j - 1] = j * NUM_WIDTHMASS;
  }
  //actions[8][2 * NUM_HEIGHTMASS + 4] = j * NUM_WIDTHMASS;
  for (let j = 1; j <= NUM_WIDTHMASS; j++) {
    if (j == 0) {
      continue;
    }
    actions[8][2 * NUM_HEIGHTMASS + 5 + j - 1] = -j;
    actions[8][2 * NUM_HEIGHTMASS + 5 + NUM_WIDTHMASS + j - 1] = j;
  }
  */
  actions[8][4][0] = -1 * NUM_WIDTHMASS - 1;
  actions[8][5][0] = -1 * NUM_WIDTHMASS + 1;
  actions[8][6][0] = 1 * NUM_WIDTHMASS - 1;
  actions[8][7][0] = 1 * NUM_WIDTHMASS + 1;
  // 竜馬
  actions[9] = actions[6].concat();
  for (let j = 4; j <= 7; j++) {
    actions[9][j] = [];
  }
  /*
  for (let j = 1; j <= NUM_HEIGHTMASS; j++) {
    actions[9][j - 1] = -j * NUM_WIDTHMASS - j;
    actions[9][NUM_HEIGHTMASS + j - 1] = -j * NUM_WIDTHMASS + j;
  }
  for (let j = 1; j <= NUM_HEIGHTMASS; j++) {
    actions[9][2 * NUM_HEIGHTMASS + j - 1] = j * NUM_WIDTHMASS - j;
    actions[9][3 * NUM_HEIGHTMASS + j - 1] = j * NUM_WIDTHMASS + j;
  }
  */
  actions[9][4][0] = -1 * NUM_WIDTHMASS;
  actions[9][5][0] = 1 * NUM_WIDTHMASS;
  actions[9][6][0] = -1;
  actions[9][7][0] = 1;

  console.log("actions", actions);
	let piece_instructions = [];

  for (var i = 0; i <= 7; i++) {
    if (i == 3,7) {
      piece_instructions.push(new SyogiPiece(actions[i], i + 1, 0,0));
    } else if (4 <= i && i <= 6) {
      piece_instructions.push(new SyogiPiece(actions[i], i + 1, i+8,0));
    }else {
      piece_instructions.push(new SyogiPiece(actions[i], i + 1, i + 9,0));
    }
  }
  // 成った後の動きが金と同じ
  for (var i = 8; i <= 11; i++) {
    if (i <= 10) {
      piece_instructions.push(new SyogiPiece(actions[3], i + 1, 0, i - 7));
    } else {
		  piece_instructions.push(new SyogiPiece(actions[3],i+1,0,i-6));
    }
  }
  // 竜王竜馬
  for (var i = 8; i <= 9; i++) {
		piece_instructions.push(new SyogiPiece(actions[i],i+4,0,i-2));
  }
  

	// TODO ほかの初期化追加
  /*
	console.log("piece_status,piece_instructions,NUM_PIECE");
	console.log(piece_status, piece_instructions, NUM_PIECE);
  */
	return [piece_status, piece_instructions, NUM_PIECE];
}

// 戻り値 board_array, reserve_pieces, done
function syogi_step({ board_array = [], pieces_status = [], reserve_pieces = [],
  NUM_PIECE = 0, piece_control_number = 0, action = 0, evolves = false, player = 0 }) {
  // 引数の配列を変えたくないのでコピーを取る
  let board = board_array.concat();
  let piece_status = pieces_status.concat();
  let reserve_piece = reserve_pieces.concat();
  let done = false;
  let seed = 0;
  let seed_idx = 0;
  let piece_idx = 0;
  let reverse = 1; // 1なら味方-1なら相手

  [seed, piece_idx] = ctr_num_to_stat_num(piece_control_number, NUM_PIECE);
  seed_idx = seed_to_index(seed);
  if ((board[action] < 0 && player == 0) || (board[action] > 0 && player == 1)) {
    // 動こうとするマスにこの駒の敵の駒がいれば
    // TODO 王を取った時の処理
    // 持ち駒にするコマ
    [seed, piece_idx] = find_piece_for_mass(piece_status,action ,NUM_PIECE);
    seed_idx = seed_to_index(seed);
		console.log(piece_status,seed_idx,piece_idx);
    piece_status[seed_idx][piece_idx].reserve = true;
    if (piece_status[seed_idx][piece_idx].player == 0) {
      piece_status[seed_idx][piece_idx].player = 1;
    } else {
      piece_status[seed_idx][piece_idx].player = 0;
    }
    piece_status[seed_idx][piece_idx].mass = -1;
    console.log("seed, piece_idx", seed, piece_idx);
    reserve_piece_number = stat_num_to_ctr_num(seed, piece_idx, NUM_PIECE);
    reserve_piece[player].push(reserve_piece_number);
    if([8].includes(seed) === true){
      done = true;
    }
    // 動かすコマ
    [seed, piece_idx] = ctr_num_to_stat_num(piece_control_number, NUM_PIECE);
    seed_idx = seed_to_index(seed);
    board[piece_status[seed_idx][piece_idx].mass] = 0;
    piece_status[seed_idx][piece_idx].mass = -1;
    if(piece_status[seed_idx][piece_idx].player === 0){
      reverse = 1;
    }else{
      reverse = -1;
    }
    board[action] = seed * reverse;
    piece_status[seed_idx][piece_idx].mass = action;
  }else if(piece_status[seed_idx][piece_idx].reserve === true){
    // 持ち駒を置いた
    piece_status[seed_idx][piece_idx].reserve = false;
    let idx = 0;
    for(let player=0;player<2;player++){
      idx = reserve_piece[player].findIndex(elem => elem === piece_control_number);
      if(idx != null){
        reserve_piece[player].splice(idx, 1);
      }
    }
    board[action] = seed * reverse;
    piece_status[seed_idx][piece_idx].mass = action;
  } else if (board[action] === 0) {
    board[piece_status[seed_idx][piece_idx].mass] = 0;
    if(piece_status[seed_idx][piece_idx].player === 0){
      reverse = 1;
    }else{
      reverse = -1;
    }
    board[action] = seed * reverse;
    piece_status[seed_idx][piece_idx].mass = action;
  } else {
    console.log("error");
    console.log("board, action,player, reserve_piece");
    console.log(board, action, player, reserve_piece);
    // TODO エラー処理
  }
  if (evolves) {
    piece_status[seed_idx][piece_idx].evolve = true;
  }
  console.log("reserve_piece")
  console.log(reserve_piece)
  return [board, piece_status, reserve_piece, done];
}