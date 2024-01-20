phina.globalize();
const ASSETS = {
  // 画像
  image: {
    'othello_ban': "image/game_reversi_board.png",
    'black': "image/game_reversi_black.png",
    'white': "image/game_reversi_white.png",
  },
};
phina.define('Board_Space', {
  superClass: 'DisplayElement',
  init: function () {
    this.superInit();
    this.ban = Sprite('othello_ban').addChildTo(this);
    this.pieces = DisplayElement().addChildTo(this);
    this.mass = DisplayElement().addChildTo(this);
    // 将棋盤の当たり判定ます
    console.log("N_COLS, N_ROWS", N_COLS, N_ROWS);
    for (let j = 0; j < N_ROWS; j++) {
      for (let i = 0; i < N_COLS; i++) {
        // RectangleShape
        let mass = xyToIdx(j, i);
        //console.log("mass:", mass);
        Mass(mass).addChildTo(this.mass)
          .setPosition(48 * (i - (N_ROWS - 1) / 2) + 0,
            52 * (j - (N_COLS - 1) / 2) + 0)
          .on('pointstart', function () {
            // 駒を置くとき(ここに動くことは確定している)
            this.parent.parent.put_stone(this.number);
          });
        this.mass.children[mass].off_lighting();
      }
    }
    this.state = getInitialstate();
    this.turn = 1; // 1 or -1
    this.done = false;
  },
  ready_put: function () {
    const valid_actions = getValidActions(this.state, this.turn);
    // 石を置けるところのタッチイベントを有効にして光らせる
    for (let j = 0; j < N_ROWS * N_COLS; j++) {
      if (valid_actions.includes(j)) {
        this.mass.children[j].setInteractive(true);
        this.mass.children[j].on_lighting();
      }
    }
  },
  put_stone: function (action) {
    const valid_actions = getValidActions(this.state, this.turn);
    if (!valid_actions.includes(action)) {
      throw new Error("action is not valid");
    }
    for (let j = 0; j < N_ROWS * N_COLS; j++) {
      this.mass.children[j].setInteractive(false);
      this.mass.children[j].off_lighting();
    }
    let done;
    console.log("state,action,turn");
    console.log(this.state, action, this.turn);
    [this.state, done] = step(this.state, action, this.turn);
    this.show();
    if (done) {
      this.done = true;
      return done;
    } else {
      this.turn = this.turn * -1;
      return done;
    }
  },
  get_valid_actions: function () {
    return getValidActions(this.state, this.turn);
  },
  is_game_over: function () {
    return this.done;
  },
  get_result: function () {
    return getResult(this.state);
  },
  count_stone: function () {
    return countStone(this.state);
  },
  show: function () {
    for (let j = 0; j < N_ROWS * N_COLS; j++) {
      //console.log("mass,this.state[j]", j, this.state[j]);
      this.mass.children[j].set_stone(this.state[j]);
    }
  },
  interactive_click: function (flag) {
    for(let i = 0; i< this.mass.children.length; i++) {
      this.mass.children[i].setInteractive(flag);
    }
  },
    
  });

phina.define('Mass', {
  superClass: 'DisplayElement',
  init: function (number) {
    let width = 45, height = 49;
    this.superInit({
      width: width,
      height: height,
    });
    this.light = RectangleShape({
      width: width,
      height: height,
      fill: '#D9885B',
      // stroke: 'lime',
      strokeWidth: 0,
      cornerRadius: 0
    }).addChildTo(this);
    this.number = number;
    this.black = Sprite('black').addChildTo(this);
    this.black.alpha = 0.0;
    this.white = Sprite('white').addChildTo(this);
    this.white.alpha = 0.0;
    // 1:black,-1:white,0:empty
  },
  set_stone: function (stone) {
    if (stone == 1) {
      this.black.alpha = 1.0;
      this.white.alpha = 0.0;
    } else if (stone == -1) {
      this.black.alpha = 0.0;
      this.white.alpha = 1.0;
    } else if (stone == 0) {
      this.black.alpha = 0.0;
      this.white.alpha = 0.0;
    }
  },
  on_lighting: function () {
    this.light.alpha = 0.5;
  },
  off_lighting: function () {
    this.light.alpha = 0.0;
  },
});

/*
 * メインシーン
 */
phina.define("MainScene", {
  // 継承
  superClass: 'DisplayScene',
  // 初期化
  init: function () {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'skyblue';

    this.last_turn = 1;

    this.board = Board_Space().addChildTo(this);
    this.board.setPosition(this.gridX.center(), this.gridY.center());
    this.board.show();
    // 入力を受け付ける
    this.board.ready_put()
  },
  // 毎フレーム更新処理
  update: function (app) {
    //console.log("turn", this.turn, "dragging", this.dragging, "pick",
    //this.pick, "put", this.put, "com_standby", this.com_standby);
    if (this.board.is_game_over()) {
      console.log("geme finished");
    }
    if (this.board.turn == 1) {
      this.last_turn = 1;
      // 自分の番
    } else if (this.board.turn == -1) {
      // 相手の番
      if (this.last_turn == 1) {
        this.player_turn_finished_time = Math.floor(new Date().getTime() / 1000);
        this.last_turn = -1;
      }
      let current_time = Math.floor(new Date().getTime() / 1000);
      // 2秒待つ
      if (current_time - this.player_turn_finished_time > 1) {
        const valid_actions = this.board.get_valid_actions();
        let action_idx = Math.floor(Math.random() * valid_actions.length);
        let action = valid_actions[action_idx];
        this.board.put_stone(action);
        // 入力を受け付ける
        this.board.ready_put()
        this.player_turn_finished_time = -1;
      }
    }
  },
});

/*
 * メイン処理
 */
phina.main(function () {
  // アプリケーションを生成
  var app = GameApp({
    // MainScene から開始
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  // fps表示
  app.enableStats();
  // 実行
  app.run();
});
