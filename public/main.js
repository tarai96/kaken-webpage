// JavaScript source code
//-------------------------------------
// Socket.ioサーバへ接続
//-------------------------------------
const socket = io({ transports: ['websocket'] });
// サーバーから受けとったactionを置いとくjson
// usi_action : "1a2b"みたいな感じ

let action_box = {
  "usi_action": "" ,
  "received": true
}

// サーバからmember_postが送られてきたとき
socket.on("action-reply", (msg) => {
  console.log("receive action");
  console.log(msg);
  console.log(msg["action"]);
  action_box.usi_action = msg["action"]
  action_box.received = false
});



// グローバルに展開
phina.globalize();
// アセット
var ASSETS = {
	// 画像
	image: {
	  'hu': "image/syougi14_fuhyou.png",
	  'tokin' : "image/syougi15_tokin.png",
	  'osyo': "image/syougi01_ousyou.png",
    'hisya': "image/syougi03_hisya.png",
    'ryuou': "image/syougi04_ryuuou.png",
	  'kaku' : "image/syougi05_gakugyou.png",
    'ryuma': "image/syougi06_ryuuma.png",
	  'kin' : "image/syougi07_kinsyou.png",
	  'gin' : "image/syougi08_ginsyou.png",
	  'narigin' : "image/syougi09_narigin.png",
		'keima': "image/syougi10_keima.png",
		'narikei': "image/syougi11_narikei.png",
    'kyousya': "image/syougi12_kyousya.png",
    'narikyou': "image/syougi13_narikyou.png",
	  'ban': "image/syougi_ban.png",
	},
};

phina.define("Piece_class", {
  superClass: 'DisplayElement',
  init: function (seed, control_number, mass, actions, player,
                  reserve = false, evolve = false, evolves_to = 0, evolves_sprite = null) {
    this.superInit();
    this.mass = mass;
    this.previousMass = mass;
    this.actions = actions;
    this.player = player;
    this.reserve = reserve;
    this.seed = seed; // 駒種
    this.control_number = control_number;
    this.evolve = evolve;
    this.evolves_to = evolves_to;
    this.evolve_sprite = evolves_sprite;
  },
  set_size: function (width, height) {
    this.parent.width = width;
    this.parent.height = height;
    // 成ってないなら何もいじらない
    //console.log("this.evolves_sprite", this.evolves_sprite);
    if (this.evolve_sprite === null) {
      return;
    } else {
      this.evolve_sprite.width = width;
      this.evolve_sprite.height = height;
    }
  },
  set_on_mass: function (mass) {
    this.mass = mass;
    let x
    let y
    let NUM_WIDTHMASS = this.parent.parent.parent.parent.NUM_WIDTHMASS;
    let NUM_HEIGHTMASS = this.parent.parent.parent.parent.NUM_HEIGHTMASS;
    [x, y] = mass_to_xy(mass, NUM_HEIGHTMASS, NUM_WIDTHMASS);
    this.set_on_massxy(x, y);
  },
  set_on_massxy: function (x, y) {
    // mainsceneから
    let NUM_WIDTHMASS = this.parent.parent.parent.parent.NUM_WIDTHMASS;
    let NUM_HEIGHTMASS = this.parent.parent.parent.parent.NUM_HEIGHTMASS;

    this.show(48 * (x - (NUM_WIDTHMASS - 1) / 2), 52 * (y - (NUM_HEIGHTMASS - 1) / 2));
  },
  show: function (x, y, z = 0) {
    this.parent.setPosition(x, y, z);
    let reverce = 0;
    // 敵の駒なら反転
    if (this.player == 1) {
      reverce = -1;
    } else {
      reverce = 1;
    }
    this.parent.scaleY = reverce;
    // 成ってないなら何もいじらない
    //console.log("this.evolves_sprite", this.evolves_sprite);
    if (this.evolve_sprite === null) {
      return;
    } else {
      this.evolve_sprite.scaleY = reverce;
    }
    if (this.evolve) {
      this.parent.alpha = 0.5;
      // 画面外に置いときたい
      this.parent.setPosition(-500, -500);
      this.evolve_sprite.alpha = 1.0;
      this.evolve_sprite.setPosition(x, y,z);
    } else {
      this.parent.alpha = 1.0;
      this.evolve_sprite.alpha = 0.5;
      // 画面外に置いときたい
      this.evolve_sprite.setPosition(-500, -500);
    }
  },
  set_interactive: function (interactive) {
    this.parent.setInteractive(interactive);
    // 成ってないなら何もいじらない
    if (this.evolve_sprite === null) {
      return;
    } else if (this.evolve) {
      this.evolve_sprite.setInteractive(!interactive);
      this.evolve_sprite.setInteractive(interactive);
    }
  },
  evolves: function () {
    let NUM_WIDTHMASS = this.parent.parent.parent.parent.NUM_WIDTHMASS;
    let NUM_HEIGHTMASS = this.parent.parent.parent.parent.NUM_HEIGHTMASS;

    let mass_x;
    let mass_y;
    [mass_x, mass_y] = mass_to_xy(this.mass, NUM_HEIGHTMASS, NUM_WIDTHMASS);
    this.evolve = true;

    // 表示更新
    this.set_on_mass(this.mass);
  },
});


phina.define("Hu", {
	//Spriteクラスを継承
	superClass: 'Sprite',
  init: function ({ control_number, mass, actions, player,
    reserve = false, evolve = false,
    f_onpointstart = null }) {
    // 親クラス初期化
    this.superInit('hu');
    let evolves_to = 9;
    let evolves_sprite = Tokin({before_evolves_sprite :this, f_onpointstart:f_onpointstart});
    this.c = Piece_class(1, control_number, mass, actions, player,
      reserve, evolve, evolves_to, evolves_sprite).addChildTo(this);
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.c.control_number;
    });
  },
});

phina.define("Keima", {
  //Spriteクラスを継承
  superClass: 'Sprite',
  init: function ({ control_number, mass, actions, player,
    reserve = false, evolve = false,
    f_onpointstart = null
      }) {
    // 親クラス初期化
    this.superInit('keima');
    let evolves_to = 10;
    let evolves_sprite = Narikei({before_evolves_sprite :this, f_onpointstart:f_onpointstart});
    this.c = Piece_class(2, control_number, mass, actions, player,
      reserve, evolve, evolves_to, evolves_sprite).addChildTo(this);
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.c.control_number;
    });
  },
});

phina.define("Kyousya", {
  //Spriteクラスを継承
  superClass: 'Sprite',
  init: function ({ control_number, mass, actions, player,
    reserve = false, evolve = false,
    f_onpointstart = null }) {
    // 親クラス初期化
    this.superInit('kyousya');
    let evolves_to = 11;
    let evolves_sprite = Narikyou({before_evolves_sprite :this, f_onpointstart:f_onpointstart});
    this.c = Piece_class(3, control_number, mass, actions, player,
      reserve, evolve, evolves_to, evolves_sprite).addChildTo(this);
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.c.control_number;
    });
  },
});

phina.define("Kin", {
  //Spriteクラスを継承
  superClass: 'Sprite',
  init: function ({ control_number, mass, actions, player,
    reserve = false, evolve = false,
    evolves_sprite = null, f_onpointstart = null }) {
    // 親クラス初期化
    this.superInit('kin');
    let evolves_to = 0;
    this.c = Piece_class(4, control_number, mass, actions, player,
      reserve, evolve, evolves_to, evolves_sprite).addChildTo(this);
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.c.control_number;
    });
  },
});

phina.define("Gin", {
  //Spriteクラスを継承
  superClass: 'Sprite',
  init: function ({ control_number, mass, actions, player,
    reserve = false, evolve = false,
    f_onpointstart = null }) {
    // 親クラス初期化
    this.superInit('gin');
    let evolves_to = 12;
    let evolves_sprite = Narigin({before_evolves_sprite :this, f_onpointstart:f_onpointstart});
    this.c = Piece_class(5, control_number, mass, actions, player,
      reserve, evolve, evolves_to, evolves_sprite).addChildTo(this);
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.c.control_number;
    });
  },
});

phina.define("Hisya", {
  //Spriteクラスを継承
  superClass: 'Sprite',
  init: function ({ control_number, mass, actions, player,
    reserve = false, evolve = false,
    f_onpointstart = null }) {
    // 親クラス初期化
    this.superInit('hisya');
    let evolves_to = 13;
    let evolves_sprite = Ryuou({before_evolves_sprite :this, f_onpointstart:f_onpointstart});
    this.c = Piece_class(6, control_number, mass, actions, player,
      reserve, evolve, evolves_to, evolves_sprite).addChildTo(this);
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.c.control_number;
    });
  },
});

phina.define("Kaku", {
  //Spriteクラスを継承
  superClass: 'Sprite',
  init: function ({ control_number, mass, actions, player,
    reserve = false, evolve = false,
    f_onpointstart = null }) {
    // 親クラス初期化
    this.superInit('kaku');
    let evolves_to = 14;
    let evolves_sprite = Ryuma({before_evolves_sprite :this, f_onpointstart:f_onpointstart});
    this.c = Piece_class(7, control_number, mass, actions, player,
      reserve, evolve, evolves_to, evolves_sprite).addChildTo(this);
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.c.control_number;
    });
  },
});
phina.define("Osyo", {
	//Spriteクラスを継承
	superClass: 'Sprite',
  init: function ({ control_number, mass, actions, player,
    reserve = false, evolve = false, 
    f_onpointstart = null }) {
		// 親クラス初期化
    this.superInit('osyo');
    let evolves_to = 0;
    let evolves_sprite = null;
    this.c = Piece_class(8, control_number, mass, actions, player,
      reserve, evolve, evolves_to, evolves_sprite).addChildTo(this);
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.c.control_number;
    });
  },
});

phina.define("Tokin", {
  superClass: 'Sprite',
  init: function ({ before_evolves_sprite, f_onpointstart }) {
    this.superInit('tokin');
    this.before_evolves = before_evolves_sprite;
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.before_evolves.c.control_number;
    });
  },
});
phina.define("Narikei", {
  superClass: 'Sprite',
  init: function ({ before_evolves_sprite, f_onpointstart }) {
    this.superInit('narikei');
    this.before_evolves = before_evolves_sprite;
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.before_evolves.c.control_number;
    });
  },
});
phina.define("Narikyou", {
  superClass: 'Sprite',
  init: function ({ before_evolves_sprite, f_onpointstart }) {
    this.superInit('narikyou');
    this.before_evolves = before_evolves_sprite;
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.before_evolves.c.control_number;
    });
  },
});
phina.define("Narigin", {
  superClass: 'Sprite',
  init: function ({ before_evolves_sprite, f_onpointstart }) {
    this.superInit('narigin');
    this.before_evolves = before_evolves_sprite;
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.before_evolves.c.control_number;
    });
  },
});

phina.define("Ryuou", {
  superClass: 'Sprite',
  init: function ({ before_evolves_sprite, f_onpointstart }) {
    this.superInit('ryuou');
    this.before_evolves = before_evolves_sprite;
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.before_evolves.c.control_number;
    });
  },
});
phina.define("Ryuma", {
  superClass: 'Sprite',
  init: function ({ before_evolves_sprite, f_onpointstart }) {
    this.superInit('ryuma');
    this.before_evolves = before_evolves_sprite;
    this.on("pointstart", function () {
      this.parent.parent.parent.pick = true;
      this.parent.parent.parent.num_pick_piece = this.before_evolves.c.control_number;
    });
  },
});

phina.define('Board_Space',{
	superClass: 'DisplayElement',
	init: function(){
		this.superInit();
    this.ban = Sprite('ban').addChildTo(this);
    this.pieces = DisplayElement().addChildTo(this);
    this.mass = DisplayElement().addChildTo(this);
  },
});

phina.define('Mass',{
	superClass: 'RectangleShape',
	init: function(number){
		this.superInit({
      width: 45,
      height: 49,
      fill: '#D9885B',
      // stroke: 'lime',
      strokeWidth: 0,
      cornerRadius: 0
    });
		this.number = number;
  }
});

phina.define('Reserve_Space',{
	superClass: 'DisplayElement',
	init: function(){
		this.superInit();
    this.show_timing = [[], []];
    Reserve_Ban(0).addChildTo(this).setPosition(200, 350);
    Reserve_Ban(1).addChildTo(this).setPosition(-200, -350);
  },
  sort: function (piece_list) {
    console.log(this.show_timing);
    let tar1;
    let tar2;
    for (let player = 0; player < 2; player++) {
      for (let i = 0; i < this.show_timing[player].length - 1; i++) {
        tar1 = this.show_timing[player][i]

        for (let j = i + 1; j < this.show_timing[player].length; j++) {
          tar2 = this.show_timing[player][j]
          console.log(piece_list[tar1].c.seed > piece_list[tar2].c.seed);
          if (piece_list[tar1].c.seed > piece_list[tar2].c.seed) {
            this.show_timing[player][i] = tar2;
            this.show_timing[player][j] = tar1;
          }
        }
      }
    }
    console.log(this.show_timing);
    for (i = 0; i < 2; i++) {
      this.children[i].reload();
    }
  },
  add_piece: function (player,ctr_num,piece_list) {
    piece_list[ctr_num].addChildTo(this.children[player]);
    this.show_timing[player].push(ctr_num);
    console.log("reserve_group");
    console.log(this);
    console.log("this.reserve_group.show_timing");
    console.log(this.show_timing);
    this.sort(piece_list);
  },
  del_piece: function(piece,piece_list){
    console.log("del_piece, piece",piece);
    let idx = 0;
    for(let p=0;p<2;p++){
      idx = this.show_timing[p].findIndex(elem => elem === piece);
      console.log("idx",idx);
      if(idx != null){
        this.show_timing[p].splice(idx, 1);
      }
    }
    this.sort(piece_list);
    console.log("this.show_timing",this.show_timing);
    // console.log("idx",idx);
  }
});
  

phina.define('Reserve_Ban',{
	superClass: 'RectangleShape',
	init: function(player){
		this.superInit({
      width: 150,
      height: 150,
      // TODO 色
      fill: '#BB9657',
      // stroke: 'lime',
      strokeWidth: 0,
      cornerRadius: 0
    });
		this.player = player;
  },
	reload: function(){
    let piece_sprite;
    // 自分
    let x = -50;
    let y = -50;
    for (let i = 0; i < this.parent.show_timing[this.player].length; i++) {
      console.log(this.parent.show_timing[this.player].length);
      piece_sprite = this.find_piece(this.parent.show_timing[this.player][i]);
      piece_sprite.c.show(x, y, 1);
      let reverce = -1;
      if (piece_sprite.c.player == 1) {
        if (piece_sprite.scaleY > 0) {
          piece_sprite.scaleY *= reverce;
        }
      } else {
        if (piece_sprite.scaleY < 0) {
          piece_sprite.scaleY *= reverce;
        }
      }
      piece_sprite.alpha = 1.0;
      x += 50;
      if (x > 50) {
        x = -50;
        y += 50;
      }
    }
  },
  find_piece: function (ctr_num) {
    let ctrs = [];
    console.log(this.children);
    for (let i = 0; i < this.children.length; i++) {
      console.log(this.children[i].c);
      ctrs.push(this.children[i].c.control_number);
      if (this.children[i].c.control_number == ctr_num) {
        console.log("find");
        return this.children[i];
      }
    }
    console.log(ctrs);
  },
});

phina.define('Reserve_Pieces',{
  superClass: 'DisplayElement',
	init: function(){
    this.superInit();
  },
});

phina.define('Two_choiceQ_Space', {
  superClass: 'DisplayElement',
  init: function ({q_text="q_text",Y_text="yes",N_text="no" }) {
    this.superInit();
    this.R = RectangleShape({
      width: 300,
      height: 200,
      // TODO 色
      fill: 'white',
      stroke: 'lime',
      strokeWidth: 0,
      cornerRadius: 0,
    }).addChildTo(this);
    // 質問
    this.question = Label('q').addChildTo(this);
    this.question.fontFamily = "'Noto'";
    this.question.setPosition(0, -40);
    this.question.text = q_text;
    // ボタン
    const button_width = 100;
    const button_height = 50;
    this.button_yes = Button({
      width: button_width,
      height: button_height,
      // TODO 色
      fill: 'black',
      // stroke: 'lime',
      strokeWidth: 0,
      cornerRadius: 0,
      text: Y_text,
    }).addChildTo(this);
    this.button_yes.setPosition(-75, 50);

    this.button_no = Button({
      width: button_width,
      height: button_height,
      // TODO 色
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
      cornerRadius: 0,
      text: N_text,
      fontColor: 'black',
    }).addChildTo(this);
    this.button_no.setPosition(75, 50);
    this.button_yes.on("pointstart", function () {
      //console.log(this);
      this.parent.clicked = true;
      this.parent.yes = true;
    });
    this.button_no.on("pointstart", function () {
      this.parent.clicked = true;
      this.parent.yes = false;
    });
    this.clicked = false;
    this.yes = false;
    console.log(this);
  },
  get_answer: function () {
    return [this.clicked, this.yes];
  },
});

phina.define('Result',{
	superClass: 'DisplayElement',
	init: function(){
		 this.superInit();
  },
});

/*
 * メインシーン
 */
phina.define("MainScene", {
	// 継承
	superClass: 'DisplayScene',
	// 初期化
	init: function() {
	  // 親クラス初期化
	  this.superInit();
	  // 背景色
	  this.backgroundColor = 'skyblue';

    this.com_standby = false
	  this.currentMass = 0;
	  this.hold = false;
	  this.holdPiece = 0;
	  this.flag = false;
	  this.caught = false;
    this.dragging = false;
    this.dragging_piece = 0;
	  this.game_status = ""
	  this.piece_instructions = [];
	  this.piece_status = [];
	  this.piece_list = [];
	  this.pick = false;
	  this.num_pick_piece = 0;
	  this.put = false;
	  this.put_mass = 0;
	  this.previousMass = 0;
	  this.reservePieces = [];
    this.select_waiting = false;
	  this.turn = 0;

	  this.NUM_WIDTHMASS = 9;
	  this.NUM_HEIGHTMASS = 9;
	  this.NUM_ALLMASS = this.NUM_HEIGHTMASS * this.NUM_WIDTHMASS;
	  this.NUM_PIECE = [];

	  this.mass_size = 50;
	  this.BOARD_MARJIN = 5;

	  // 盤面初期化
	  // board_array　相手の駒はマイナス
	  this.board_array = [-3, -2, -5, -4, -8, -4, -5, -2, -3,
	  									0, -6, 0, 0, 0, 0, 0, -7, 0,
	  									-1,-1,-1,-1,-1,-1,-1,-1,-1,
	  									0, 0, 0, 0, 0, 0, 0, 0, 0,
	  									0, 0, 0, 0, 0, 0, 0, 0, 0,
	  									0, 0, 0, 0, 0, 0, 0, 0, 0,
	  									1, 1, 1, 1, 1, 1, 1, 1, 1,
	  									0, 7, 0, 0, 0, 0, 0, 6, 0,
	  									3, 2, 5, 4, 8, 4, 5, 2, 3,
	  									]

    let num_piece = [];
	  [this.piece_status,this.piece_instructions,num_piece] = syogi_init(this.board_array,this.NUM_WIDTHMASS,this.NUM_HEIGHTMASS);
    this.NUM_PIECE = num_piece;
    this.SUM_PIECE = sum_array(this.NUM_PIECE);
    console.log("piece_status,piece_instructions,NUM_PIECE");
	  console.log(this.piece_status,this.piece_instructions,this.NUM_PIECE);
	  // 駒初期化

	  // メモ　game本体 piece_status[駒種-1][通し番号]
	  //       Sprite piece_list[番号] 番号の求め方（仮）(駒種ごとの駒の数のそれまでの合計)+(上の通し番号)
		let control_number = 0;
	  //歩 no.1
	  for(let i=0;i<this.NUM_PIECE[0];i++){
      // mass,action,player 
      this.piece_list.push(Hu({
          control_number: control_number, mass:this.piece_status[0][i].mass,
        actions: this.piece_instructions[0].actions, player: this.piece_status[0][i].player,
        evolve: false, f_onpointstart: this.pick_piece
      }));
      control_number++;
		}
    //桂馬 no.2
    for (let i = 0; i < this.NUM_PIECE[1]; i++) {
      // mass,action,player 
      this.piece_list.push(Keima({
        control_number:control_number, mass:this.piece_status[1][i].mass,
        actions:this.piece_instructions[1].actions,player: this.piece_status[1][i].player
        ,evolve: false, f_onpointstart: this.pick_piece
      }));
			control_number++;
		}
    //香車 no.3
    for (let i = 0; i < this.NUM_PIECE[2]; i++) {
      // mass,action,player 
      this.piece_list.push(Kyousya({
        control_number: control_number, mass: this.piece_status[2][i].mass,
        actions: this.piece_instructions[2].actions, player: this.piece_status[2][i].player
        ,evolve: false, f_onpointstart: this.pick_piece
      }));
			control_number++;
		}
    //金 no.4
    for (let i = 0; i < this.NUM_PIECE[3]; i++) {
      // mass,action,player 
      this.piece_list.push(Kin({
        control_number: control_number, mass: this.piece_status[3][i].mass,
        actions: this.piece_instructions[3].actions, player: this.piece_status[3][i].player
        ,evolve: false, f_onpointstart: this.pick_piece
      }));
			control_number++;
		}
    //銀 no.5
    for (let i = 0; i < this.NUM_PIECE[4]; i++) {
      // mass,action,player 
      this.piece_list.push(Gin({
        control_number:control_number, mass:this.piece_status[4][i].mass,
        actions:this.piece_instructions[4].actions, player:this.piece_status[4][i].player
        ,evolve: false, f_onpointstart: this.pick_piece
      }));
			control_number++;
		}
    //飛車 no.6
    for (let i = 0; i < this.NUM_PIECE[5]; i++) {
      // mass,action,player 
      this.piece_list.push(Hisya({
        control_number:control_number, mass:this.piece_status[5][i].mass,
        actions:this.piece_instructions[5].actions, player:this.piece_status[5][i].player
        ,evolve: false, f_onpointstart: this.pick_piece
      }));
			control_number++;
		}
    //角 no.7
    for (let i = 0; i < this.NUM_PIECE[6]; i++) {
      // mass,action,player 
      this.piece_list.push(Kaku({
        control_number:control_number, mass:this.piece_status[6][i].mass,
        actions:this.piece_instructions[6].actions, player:this.piece_status[6][i].player
        ,evolve: false, f_onpointstart: this.pick_piece
      }));
			control_number++;
		}
	  //王将 no.8
	  for(let i=0;i<this.NUM_PIECE[7];i++){
		  // mass,action,player 
      this.piece_list.push(Osyo({
        control_number:control_number, mass:this.piece_status[7][i].mass,
        actions:this.piece_instructions[7].actions, player:this.piece_status[7][i].player
        ,evolve: false, f_onpointstart: this.pick_piece
      }));
			control_number++;
		}

	  // 持ち駒初期化
	  // reservePieces 2次元配列 0 自分　1 相手
	  for(let i = 0; i < 2; i++) { this.reservePieces.push([]); }
	
	  // Sprite
	  // board
	  this.board_group = Board_Space().addChildTo(this);
	  this.board_group.setPosition(this.gridX.center(), this.gridY.center());
 
   	
	  // 持ち駒グループ
	  this.reserve_group = Reserve_Space().addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
	  
    console.log("piece_list");
    console.log(this.piece_list);

	  // 駒
	  for(let i=0;i<this.SUM_PIECE;i++){
	  	var mass_x = this.piece_list[i].c.mass;
	  	for(var mass_y = 0;mass_x >= this.NUM_WIDTHMASS;mass_y++){
	  		mass_x -= this.NUM_WIDTHMASS;
      }
      this.piece_list[i].addChildTo(this.board_group.pieces)
      if (this.piece_list[i].c.evolve_sprite != null) {
        this.piece_list[i].c.evolve_sprite.addChildTo(this.board_group.pieces);
      }
      this.piece_list[i].c.set_size(this.mass_size, this.mass_size);
      this.piece_list[i].c.set_on_mass(this.piece_list[i].c.mass);
	  }
	  console.log(this.board_group);

	  // 将棋盤の当たり判定ます
	  for (j = 0; j < this.NUM_HEIGHTMASS; j++) {
	  	for (i = 0; i < this.NUM_WIDTHMASS; i++) {
	  	// RectangleShape
	  		let mass = xy_to_mass(i, j, this.NUM_WIDTHMASS);
        Mass(mass).addChildTo(this.board_group.mass)
          .setPosition(48 * (i - (this.NUM_WIDTHMASS - 1) / 2) + 0,
            52 * (j - (this.NUM_HEIGHTMASS - 1) / 2) + 0)
          .on('pointstart', function () {
            // 駒を置くとき(ここに動くことは確定している)
            this.parent.parent.parent.put = true;
	  				this.parent.parent.parent.put_mass = this.number;
	  			});
        this.board_group.mass.children[mass].alpha = 0.0;
      }
	  }

	  // 駒のタッチを有効にする
    for (i = 0; i < this.SUM_PIECE; i++){
      // 自分の駒だけ
      if (this.piece_list[i].c.player == 0) {
        this.piece_list[i].c.set_interactive(true);
      }
    }
	},
	// 毎フレーム更新処理
  update: function (app) {
    console.log("turn", this.turn, "dragging", this.dragging, "pick",
      this.pick, "put", this.put, "com_standby", this.com_standby);
	  // 自分の番
	  if(this.turn == 0){
      if (this.pick) {
        this.pick_piece();
      }
	  	if(this.put){
	  		this.put_piece();
      }
      if (this.select_waiting) {
        let clicked, answer;
        [clicked,answer] = this.user_evolve_select_element.get_answer();
        if (clicked) {
          console.log("answer", answer);
          let evolves = false;
          if (answer) {
            // 成る
            this.piece_list[this.dragging_piece].c.evolves();
            evolves = true;
          } else {
            //成らない
            evolves = false;
          }
          let dragging_piece = this.dragging_piece;
          let seed = 0, number = 0;
          [seed, number] = ctr_num_to_stat_num(dragging_piece, this.NUM_PIECE);
          let mass = this.put_mass;
          let mass_x = 0, mass_y = 0;
          [mass_x, mass_y] = mass_to_xy(mass, this.NUM_HEIGHTMASS, this.NUM_WIDTHMASS);
          console.log("put,action,x,y", mass, mass_x, mass_y);
          console.log(this.piece_status, seed, number);
          console.log(this.piece_status[seed_to_index(seed)]);
          let player = this.piece_status[seed_to_index(seed)][number].player;
          [this.board_array, this.piece_status, this.reservePieces, this.done]
            = syogi_step({
              board_array: this.board_array, pieces_status: this.piece_status,
              reserve_pieces: this.reservePieces, NUM_PIECE: this.NUM_PIECE,
              piece_control_number: dragging_piece, action: mass, evolves: evolves,
              player: player
            });
          // 敵のコマを取ったら
          console.log(this.reservePieces);
          this.obtain_piece(player);

          // 相手の番
          this.turn = 1;
          this.select_waiting = false;
          // 選択エレメント消去
          this.user_evolve_select_element.remove();
        }
      }
	  // 相手の番
    } else if (this.turn == 1) {
      // サーバーと通信する場合 
      if (this.com_standby) {
        //通信待機中
        if (action_box.received == false) {
          let usi_action = action_box["usi_action"];
          console.log("turn:1,usi_action:", usi_action);
          let action = 0;
          let evolves = false;
          let origin_seed = 0, piece_number = 0;
          let control_number = 0;
          [action, evolves, origin_seed, piece_number]
            = usi_to_action(usi_action, this.board_array,
              this.piece_instructions, this.piece_status,
              this.NUM_HEIGHTMASS, this.NUM_WIDTHMASS, this.NUM_PIECE);
          console.log("action,evolves, origin_seed, piece_number", action, evolves, origin_seed, piece_number)
          control_number = stat_num_to_ctr_num(origin_seed, piece_number, this.NUM_PIECE);
          [this.board_array, this.piece_status, this.reservePieces, this.done]
            = syogi_step({
              board_array: this.board_array, pieces_status: this.piece_status,
              reserve_pieces: this.reservePieces, NUM_PIECE: this.NUM_PIECE,
              piece_control_number: control_number, action: action, evolves: evolves,
              player: 1
          });

          // スプライトの位置更新
          this.piece_list[control_number].c.set_on_mass(action);
          // 成る表示処理
          if (evolves) {
            this.piece_list[control_number].c.evolves();
          }

          // 敵のコマを取ったら
          console.log(this.reservePieces);
          this.obtain_piece(player = 1);

          action_box.received = true;
          this.com_standby = false;

          this.turn = 0;
          // ターン終了
          // 駒のタッチを有効にする
          for (i = 0; i < this.SUM_PIECE; i++) {
            // 自分の駒だけ
            if (this.piece_list[i].c.player == 0) {
              this.piece_list[i].c.set_interactive(true);
            }
          }
          if (this.done == true) {
            this.turn = 10;
            this.game_status = "負け"
          }
        }
      } else {
        // 左に90度回転
        const rotate = a => a[0].map((_, c) => a.map(r => r[c])).reverse();
        state = this.board_array
        const encoding1_state = state.map(value => {
          // 2->3,3->2 ,4->7,5->4,6->6,7->5,8->8
          let encode_value = 0
          switch (Math.abs(value)) {
            case 2:
              encode_value = 3;
              break;
            case 3:
              encode_value = 2;
              break;
            case 4:
              encode_value = 7;
              break;
            case 5:
              encode_value = 4;
              break;
            case 7:
              encode_value = 5;
              break;
            default:
              encode_value = Math.abs(value);
              break;
          }
          if (value < 0) {
            return encode_value + 16;
          } else {
            return encode_value;
          }
        })
        const encoding2_state = []
        try {
          while (encoding1_state.length) encoding2_state.push(encoding1_state.splice(0, 9)); // stateの残りがある限り、stateの0番目から9つ分のデータを、encoding2_stateの最後尾にpushする
          console.log(encoding2_state);
        } catch (error) {
          console.error(error);
        }
        let encode_state = rotate(encoding2_state);
        console.log(encode_state);
        
        // 持ち駒を追加
        let in_hand = [[], []];
        for (let p = 0; p < 2; p++) {
          for (let i = 0; i < 7; i++) {
            console.log(this.reservePieces[p].filter(item => item == i).length);
            in_hand[p][i] = this.reservePieces[p].filter(item => item == i).length;
          }
        }
        // 配列の結合
        encode_state = encode_state.concat(in_hand[0], in_hand[1]);
        
        encode_state = encode_state.flat(); //１次元にする
        console.log(encode_state);
        
        // Socket.ioサーバへ送信
        socket.emit("post", {mode:'shogi', state: encode_state,current_player:1, token:IAM.token });
        // 通信待機
        this.com_standby = true;
      }
      /*
      let activePiece;
      // console.log("enemy_pieces", this.get_num_enemy_piece());
	  	let valid_actions = [];
	  	let cnt = 0;
	  	let control_number = 0;
	  	let seed = 0;
      let piece_number = 0;
      let evolve = false;
	  	while(valid_actions.length === 0){
	  		console.log("in while");
	  		// 動かすコマ
	  	  activePiece = Math.floor(Math.random() * this.get_num_enemy_piece());
	  		console.log("activePiece",activePiece);
        cnt = 0;
        for (let i = 0; i < this.SUM_PIECE; i++) {
          if (this.piece_list[i].c.player == 1) {
            // console.log("player=1,cnt,control_number",cnt,i);
            if (cnt == activePiece) {
	  		      control_number = i;
              break;
            }
	  				cnt++;
	  			}
        }
        console.log("control_number",control_number);
	  		// どこに動く
	  		seed = 0;
	  		piece_number = 0;
        [seed, piece_number] = ctr_num_to_stat_num(control_number, this.NUM_PIECE);
        console.log(this.piece_list[control_number]);
        if (this.piece_list[control_number].c.evolve) {
          seed = this.piece_list[control_number].c.evolves_to;
          evolve = true;
        }
        valid_actions = get_valid_actions(this.board_array, this.piece_instructions, this.piece_status, seed, piece_number,evolve, this.NUM_HEIGHTMASS, this.NUM_WIDTHMASS)
        console.log("valid_actions, control_number,seed, piece_number", valid_actions, control_number, seed, piece_number);
	  	}
	  	let action_idx = Math.floor(Math.random() * valid_actions.length);
	  	let action = valid_actions[action_idx];
      console.log("mass,action", this.piece_list[control_number].c.mass, action);
      console.log("piece_status", this.piece_status);
      console.log("board_group", this.board_group);
      this.piece_list[control_number].c.mass = action;
      // todo evolves
      evolves = false;
      [this.board_array, this.piece_status, this.reservePieces, this.done]
        = syogi_step({
          board_array: this.board_array, pieces_status: this.piece_status,
          reserve_pieces: this.reservePieces, NUM_PIECE: this.NUM_PIECE,
          piece_control_number: control_number, action: action, evolves: evolves,
          player: 1
        });
	  	console.log("turn:1,piece,action",control_number,action)
	  	// 駒の表示位置更新
	  	let mass_x = 0;
	  	let mass_y = 0;
	  	[mass_x,mass_y] = mass_to_xy(this.piece_list[control_number].c.mass,this.NUM_HEIGHTMASS,this.NUM_WIDTHMASS);
	  	console.log("action,x,y",this.piece_list[control_number].c.mass,mass_x,mass_y);
      this.piece_list[control_number].c.set_on_mass(this.piece_list[control_number].c.mass);

      // 敵のコマを取ったら
      console.log(this.reservePieces);
      this.obtain_piece(player=1);

	  	this.turn = 0;
	  	// ターン終了
	  	// 駒のタッチを有効にする
	  	for(i=0;i<this.SUM_PIECE;i++){
	  		// 自分の駒だけ
	  		if(this.piece_list[i].c.player == 0){
	  			this.piece_list[i].c.set_interactive(true);
        }
	  	}
      
	  	if(this.done == true){
	  		this.turn = 10;
	  		this.game_status = "enemy win"
      }
      */
	  }else if(this.turn == 10){
	  	 // ゲーム終了
	  	 this.show_result();
	  	 this.turn = 11;
    }
	},
	pick_piece: function(sender){
    console.log("pick_piece")

    console.log("SUM_PIECE",this.SUM_PIECE);
    piece_class = sender;
    // sender 駒のスプライト
		// 駒を選ぶとき
		// 駒のタッチを無効にする
		for(i=0;i<this.SUM_PIECE;i++){
			this.piece_list[i].c.set_interactive(false);
		}
    this.dragging = true;
    this.dragging_piece = this.num_pick_piece;
    /*
		console.log("dragging_piece",this.dragging_piece);
    console.log("NUM_PIECE", this.NUM_PIECE);
    */
    console.log("piece_list", this.piece_list);
    if (this.piece_list[this.dragging_piece].c.reserve === true){
      this.pick_reserve_piece();
    }else{
      let seed = 0;
      let piece_number = 0;
      let evolve = false;
      [seed, piece_number] = ctr_num_to_stat_num(this.dragging_piece, this.NUM_PIECE);
      console.log("seed,piece_number", seed, piece_number);
      console.log(this.piece_list[this.dragging_piece]);
      if (this.piece_list[this.dragging_piece].c.evolve) {
        seed = this.piece_list[this.dragging_piece].c.evolves_to;
        evolve = true;
      }
      console.log("seed", seed);
      let mass = this.piece_list[this.dragging_piece].c.mass;
		  this.piece_list[this.dragging_piece].c.previousMass = mass;
      // コマがある場所を光らせる
      this.board_group.mass.children[mass].alpha = 0.5;
      // 将棋盤の当たり判定オブジェクト(マス)のタッチイベントを有効にする
      // 駒が動ける場所だけ
      let valid_actions = get_valid_actions(this.board_array, this.piece_instructions, this.piece_status, seed, piece_number,evolve, this.NUM_HEIGHTMASS, this.NUM_WIDTHMASS);
      console.log("valid_actions", valid_actions);
      // 動ける場所がなければキャンセルする
      if (valid_actions.length == 0) {
        console.log("cancel");
        this.pick = false;
        this.num_pick_piece = 0;
        // コマがある場所を暗くする
        this.board_group.mass.children[mass].alpha = 0.0;
        // 駒のタッチを有効にする
        for (i = 0; i < this.SUM_PIECE; i++) {
          // 自分の駒だけ
          if (this.piece_list[i].c.player == 0) {
            this.piece_list[i].c.set_interactive(true);
          }
        }
      }
      for (let j = 0; j < this.NUM_WIDTHMASS * this.NUM_HEIGHTMASS; j++){
		  	if(valid_actions.includes(j)){
          this.board_group.mass.children[j].setInteractive(true);
          // コマが動けるところを光らせる
          this.board_group.mass.children[j].alpha = 0.5;
		  	}
		  }
    }
		this.pick = false;
		this.num_pick_piece = 0;
  },
  // pick_pieceの中に埋め込む
  pick_reserve_piece: function () {
    console.log("pick_reserve_piece");
    NUM_HEIGHTMASS = this.NUM_HEIGHTMASS;
    NUM_WIDTHMASS = this.NUM_WIDTHMASS;
    let pick_piece = this.dragging_piece;
    let seed = 0;
    let piece_number = 0;
    [seed, piece_number] = ctr_num_to_stat_num(pick_piece, this.NUM_PIECE);
    let player = this.piece_status[seed_to_index(seed)][piece_number].player;
    // 空のますを光らせてタッチを有効にする
    let empty_mass = this.get_empty_mass();
    for (let i = 0; i < empty_mass.length; i++) {
      this.board_group.mass.children[empty_mass[i]].alpha = 0.5;
      this.board_group.mass.children[empty_mass[i]].setInteractive(true);
    }
    let mass = 0;
    let valid = true;
    for (let i = 0; i < this.NUM_HEIGHTMASS; i++) {
      for (let j = 0; j < this.NUM_WIDTHMASS; j++) {
        valid = true;
      /*
        if (i < 3 || i >= this.NUM_HEIGHTMASS - 3) {
          dummy_board = this.board_array.concat();
          dummy_board[mass_to_xy(j, i, this.NUM_WIDTHMASS)] = seed * player;
          // dummy_valid_actions = get_valid_actions(this.board_array, this.piece_instructions, this.piece_status, seed, piece_number, this.NUM_HEIGHTMASS, this.NUM_WIDTHMASS);
          
          // 置けないマスは光を消すタッチ無効
          if (dummy_valid_actions == []) {
            mass = xy_to_mass(j, i); 
            this.board_group.mass.children[mass].alpha = 0.0;
            this.board_group.mass.children[mass].set_interactive(false);
          }
        }
        */
        if(i < 2 && player == 0){
          if(i == 0 && [1,2,3].includes(seed)){
            valid = false;
          }else if(i==1 && [2].includes(seed)){
            valid = false;
          }
        }else if(i >= NUM_HEIGHTMASS - 2 && player == 1){
          if(i == NUM_HEIGHTMASS -1 && [1,2,3].includes(seed)){
            valid = false;
          }else if(i == NUM_HEIGHTMASS -2 && [2].includes(seed)){
            valid = false;
          }
        }
        if (valid == false) {
          mass = xy_to_mass(j, i,this.NUM_WIDTHMASS); 
          this.board_group.mass.children[mass].alpha = 0.0;
          this.board_group.mass.children[mass].setInteractive(false);
        }
      }
    }
  },

	put_piece: function(){
    // 駒を置くとき(ここに動くことは確定している)
    // piece は通し番号
    let mass = this.put_mass;
    // console.log("put_mass", mass);
    let dragging_piece = this.dragging_piece;
    let seed = 0;
    let number = 0;
    let was_reserve = false;
    [seed, number] = ctr_num_to_stat_num(dragging_piece, this.NUM_PIECE);
    if (this.piece_list[dragging_piece].c.reserve) {
      was_reserve = true;
      this.piece_list[dragging_piece].c.reserve = false;
      this.piece_list[dragging_piece].addChildTo(this.board_group.pieces);
      this.reserve_group.del_piece(dragging_piece, this.piece_list);
    }
    // 光らせた場所を暗くする
    for (let i = 0; i < this.NUM_ALLMASS; i++){
      this.board_group.mass.children[i].alpha = 0.0;
      this.board_group.mass.children[i].setInteractive(false);
    }
    /*
    let previous_mass = this.piece_list[dragging_piece].mass;
    this.board_group.mass.children[previous_mass].alpha = 0.0;
    let valid_actions = get_valid_actions(this.board_array, this.piece_instructions, this.piece_status, seed, number);
    for (let l = 0; l < this.NUM_WIDTHMASS * this.NUM_HEIGHTMASS; l++) {
      if (valid_actions.includes(l)) {
        // タッチイベントを無効にする
        this.board_group.mass.children[l].set_interactive(false);
        // 光らせた場所を暗くする
        this.board_group.mass.children[l].alpha = 0.0;
      }
    }
    */
		// 駒の表示位置更新
    this.piece_list[dragging_piece].c.mass = mass;
    this.piece_list[dragging_piece].c.set_on_massxy(mass);

    console.log("was_reserve, mass <(3 * this.NUM_WIDTHMASS)", was_reserve, mass < (3 * this.NUM_WIDTHMASS));
    
    // 成れる駒が相手側から３ます以内に入ったとき(持ち駒から置いたときを除く)
    if ((!was_reserve
      && !this.piece_list[dragging_piece].c.evolve)
      && mass < (3 * this.NUM_WIDTHMASS)) {
      this.user_evolve_select_element = Two_choiceQ_Space({ q_text: "成りますか?", Y_text: "はい", N_text: "いいえ" }).addChildTo(this);
      this.user_evolve_select_element.setPosition(this.gridX.center(), this.gridY.center());
      this.select_waiting = true;
    } else {
      let mass_x = 0;
      let mass_y = 0;
      [mass_x, mass_y] = mass_to_xy(mass, this.NUM_HEIGHTMASS, this.NUM_WIDTHMASS);
      console.log("put,action,x,y", mass, mass_x, mass_y);
      this.piece_list[dragging_piece].c.set_on_mass(mass);

      let player = this.piece_status[seed_to_index(seed)][number].player;
      [this.board_array, this.piece_status, this.reservePieces, this.done]
        = syogi_step({
          board_array: this.board_array, pieces_status: this.piece_status,
          reserve_pieces: this.reservePieces, NUM_PIECE: this.NUM_PIECE,
          piece_control_number: dragging_piece, action: mass, evolves: false, player: player
        });

      // 敵のコマを取ったら
      console.log(this.reservePieces);
      this.obtain_piece(player);

      this.turn = 1;
      this.put_mass = 0;
    }
    
    this.put = false;
		
    this.dragging = false;
		if(this.done == true){
			this.turn = 10;
			this.game_status = "勝ち"
    }
  },
  
  // 盤面に駒がどこにあるかの配列を返す
  get_piece_mass: function(number_piece){
    let mass_list =[];
    for(var j = 0; j<NUM_HEIGHTMASS;j++){
      for (i = 0; i < NUM_WIDTHMASS; i++) {
        // 
        if (this.board_array[i + (NUM_WIDTHMASS * j)] == number_piece) {
          mass_list.push(new position(i, j));
        }
      }
    }
    return mass_list;
  },

  get_num_enemy_piece: function() {
    let cnt = 0;
    for (i = 0; i < this.SUM_PIECE; i++) {
      if (this.piece_list[i].c.player == 1) {
        cnt++;
      }
    }
    return cnt;
  },
  get_empty_mass: function(){
    let empty_mass = [];
    let idx = 0;
    for(let i=0;i<this.NUM_ALLMASS;i++){
      empty_mass.push(i);
    }
    for(i=0;i<this.SUM_PIECE;i++){
      if(this.piece_list[i].c.mass === -1){
        continue;
      }
      idx = empty_mass.findIndex(elem => elem === this.piece_list[i].c.mass);
      empty_mass.splice(idx, 1);
    }
    console.log(empty_mass);
    return empty_mass;
  },
  // 何もないマスを光らせる
  flash_empty_mass: function () {
    for (let i = 0; i < this.NUM_ALLMASS; i++) {
      if (this.board_array[i] == 0) {
        console.log("this.board_group.mass.children[i]",this.board_group.mass.children[i]);
        this.board_group.mass.children[i].alpha = 0.5;
      }
    }
  },
  // 駒をとる
  obtain_piece: function (player) {
    for (let i = 0; i < this.reservePieces[player].length; i++) {
      ctr_num = this.reservePieces[player][i];
      // まだパラメータを更新していなければ
      if (this.piece_list[ctr_num].c.reserve == false) {
        this.piece_list[ctr_num].c.reserve = true;
        this.piece_list[ctr_num].c.mass = -1;
        if (this.piece_list[ctr_num].c.player == 0) {
          this.piece_list[ctr_num].c.player = 1;
        } else if (this.piece_list[ctr_num].c.player == 1) {
          this.piece_list[ctr_num].c.player = 0;
        }
        if (this.piece_list[ctr_num].c.evolve) {
          this.piece_list[ctr_num].c.evolve = false;
        }
        this.reserve_group.add_piece(player,ctr_num, this.piece_list);
      }
    }
    
  },

	show_result: function() {
		let result_elements = Result().addChildTo(this)
																	.setPosition(this.gridX.center(),this.gridY.center());
		let rect = RectangleShape({
      width: 300,
      height: 200,
      //fill: '#5BA8D9',
      fill: 'white',
      // stroke: 'lime',
      strokeWidth: 0,
      cornerRadius: 0
    }).addChildTo(result_elements);
		rect.alpha = 0.9;
		// ラベル表示
    let label = Label(this.game_status).addChildTo(result_elements);
    label.fontSize = 50;
		// label.setPosition(result_elements.gridX.center(), result_elements.gridY.center());
  }
});

/*
 * メイン処理
 */
phina.main(function() {
	// アプリケーションを生成
	var app = GameApp({
	// MainScene から開始
	startLabel: 'main',
	// アセット読み込み
	assets: ASSETS,
	});
	// fps表示
	//app.enableStats();
	// 実行
	app.run();
});
