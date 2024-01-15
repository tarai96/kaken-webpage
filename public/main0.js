// - global -------------------------------------------------------------------
var screenCanvas, info;
var run = true;
var fps = 1000 / 30;
var mouse = new Point();
var actions = [];
var boardImg = new Image();
var huImg = new Image();
var ousyouImage = new Image();
var ctx;
var click = false;
var cnt = 0;
var capturedPiece = [];
var currentMass = 0;
var gameStatus = "stop";    // stop, play, win, lose
var turn = 0;
var hold = false;
var holdPiece = 0;
var flag = false;
var caught = false;
var pieceList = [];
var previousMass = 0;
var i = 0;
var j = 0;

// - const
var CHARA_COLOR = 'rgba(0, 0, 255, 0.75)';
var CHARA_SHOT_COLOR = 'rgba(0, 255, 0, 0.75)';
var CHARA_SHOT_MAX_COUNT = 10;
var NUM_WIDTHMASS = 9;
var NUM_HEIGHTMASS = 9;
var NUM_ALLMASS = NUM_HEIGHTMASS * NUM_WIDTHMASS;
var BOARD_MARJIN = 5;
var NUM_HU = 2;
var NUM_OSYO = 2;

// - main ---------------------------------------------------------------------
window.onload = function () {

    // スクリーンの初期化
    screenCanvas = document.getElementById('screen');
    screenCanvas.width = 256;
    screenCanvas.height = 256;

    // 2dコンテキスト
    ctx = screenCanvas.getContext('2d');

    // イベントの登録
    screenCanvas.addEventListener('mousemove', mouseMove, true);
    screenCanvas.addEventListener('mousedown', mouseDown, true);
    window.addEventListener('keydown', keyDown, true);

    // エレメント関連
    info = document.getElementById('info');

    // 駒初期化
    // メモ actions １次元相対座標そのコマの座標を0として
    //              x+y*(横のマス数)
    for (i = 0; i < 2; i++) {
        actions[i] = []
    }
    var size = new Size(0,0);
    size.x = 30;
    size.y = 30;

    //歩 no.1
    actions[0][0] = -1 * NUM_WIDTHMASS;
    var hu = new SyogiPiece(size,actions[0]);
    var husStatus = new Array(NUM_HU).fill(new SyogiPieceStatus(0));
    husStatus[1].player = 1;
    console.log(actions[0]);

    //王将 no.2
    cnt = 0;
    for(j = -(NUM_WIDTHMASS + 1); j <= NUM_WIDTHMASS; j++){
        if (-1 * (NUM_WIDTHMASS + 1) <= j && j <= -1 * (NUM_WIDTHMASS - 1)) {
            actions[1][cnt] = j;
            cnt++;
        }else if(j == -1 || j == 1){
            actions[1][cnt] = j;
            cnt++;
		}else if(NUM_WIDTHMASS - 1 <= j && j <= NUM_WIDTHMASS + 1){
            actions[1][cnt] = j;
            cnt++;
		}
    }
    var A = actions[1];
    console.log(A);
    var osyo = new SyogiPiece(size,actions[1]);
    var osyosStatus = new Array(NUM_OSYO).fill(new SyogiPieceStatus(0));
    osyosStatus[1].player = 1;

    // 駒のリスト
    pieceList[0] = hu;
    pieceList[1] = osyo;

    // 持ち駒初期化
    // capturedPiece 2次元配列 0 自分　1 相手
    for(i = 0; i < 2; i++) { capturedPiece.push(Array(64).fill(0)); }

    // 盤面初期化
    // board　相手の駒はマイナス
    var board = new Array(NUM_ALLMASS).fill(0);
    var mass_positionx = 0;
    var mass_positiony = 0;
    var mass_size = (screenCanvas.width - 2*BOARD_MARJIN) / NUM_WIDTHMASS;
    
    board[3] = 2;
    board[3 + (NUM_WIDTHMASS * 1)] = 1;
    board[3 + (NUM_WIDTHMASS * 4)] = 1;
    board[3 + (NUM_WIDTHMASS * 5)] = 2;


    /*
    // 自機初期化
    var chara = new Character();
    chara.init(10);

    //ショットの初期化
    var charaShot = new Array(CHARA_SHOT_MAX_COUNT);
    for(i = 0; i < CHARA_SHOT_MAX_COUNT; i++){
        charaShot[i] = new CharacterShot();
    }
    */
    gameStatus = "play";
    // レンダリング処理を呼び出す
    (function(){
        

        // HTMLを更新
        info.innerHTML = mouse.x + ' : ' + mouse.y;

        if(turn == 0){
            // 将棋盤面 i->x j->y
            flag = false;
            for(var j = 0;j < NUM_HEIGHTMASS;j++){
                for(i = 0;i < NUM_WIDTHMASS;i++){
                    // 位置を設定(左上)
                    mass_positionx = i * mass_size + BOARD_MARJIN;
                    mass_positiony = j * mass_size +  BOARD_MARJIN;

                    // マウスが現在の四角の中にあるかどうかをチェックする
                    if ((mass_positionx < mouse.x && mouse.x < mass_positionx + mass_size) &&
                        (mass_positiony < mouse.y && mouse.y < mass_positiony + mass_size)) {
                        currentMass = i + j * NUM_WIDTHMASS;
                        flag = true;
                        break;
                    }
                }
                if(flag) {
                    break;
                }
            }
            // マウスクリックでコマを置くか選ぶ
            if (click && hold) {
                console.log(pieceList[holdPiece - 1].actions);
                for (i in pieceList[holdPiece - 1].actions){
                    if (currentMass == previousMass + pieceList[holdPiece - 1].actions[i]) {
                        // 行動可能なマスならば
                        // おく
                        // おこうとしているマスに相手の駒があるなら
                        if (board[currentMass] > 0) {
                            // もしそれが王だったら
                            if (board[currentMass] == 2) {
                                // 勝利
                                gameStatus = "win"
                                console.log("win!");
                                break;
                            }
                            for (i = 0; i < 64; i++) {
                                if (capturedPiece[0][i] == 0) {
                                    break;
                                }
                            }
                            capturedPiece[0][i] = board[currentMass];
                        }
                        board[currentMass] = holdPiece;
                        holdPiece = 0;
                        hold = false;
                        turn = 1;
                        break;
                    } else {
                        // そこには動けない
                        console.log("unable action");
                    }
				}
            } else if (click) {
                console.log(currentMass);
                if (board[currentMass] != 0){
                    // えらぶ
                    holdPiece = board[currentMass];
                    previousMass = currentMass;
                    board[currentMass] = 0;
                    hold = true;
                    console.log("hold!");
                }
			}
		}
        if(turn == 1){
            // 相手のターン
            turn = 0;
		}


        /*********************************************************
                                描写
        **********************************************************/

        // screenクリア 
        ctx.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
        
        // パスの設定を開始
        ctx.beginPath();

        // 将棋盤面
        for(var j = 0;j < NUM_HEIGHTMASS;j++){
            for(i = 0;i < NUM_WIDTHMASS;i++){
                // 位置を設定(左上)
                mass_positionx = i * mass_size + BOARD_MARJIN;
                mass_positiony = j * mass_size +  BOARD_MARJIN;

                // マウスが現在の四角の中にあるかどうかをチェックする
                if((mass_positionx < mouse.x && mouse.x < mass_positionx+mass_size) && 
                    (mass_positiony < mouse.y && mouse.y < mass_positiony+mass_size)){
                    // マウスが四角の中に入っているので、塗りつぶしスタイルを青に設定する
                    // ctx.fillStyle = 'rgba(0, 0, 255, 0.75)';
				}else{
                    // マウスが四角の中に入っていない場合は、塗りつぶしスタイルをデフォルトの色に設定します。
                    // ctx.fillStyle = 'rgba(255, 0, 0, 0.75)';
                }

                // パスを設定
                // ctx.fillRect(mass_positionx, mass_positiony, mass_size, mass_size);
                ctx.closePath();

                if (board[i + (NUM_WIDTHMASS * j)] != 0){
                    // 歩
                    if (board[i + (NUM_WIDTHMASS * j)] == 1){
                        ctx.beginPath();
                        ctx.fillStyle = 'rgba(0, 255, 0, 0.75)';
                        // ctx.fillRect(mass_positionx, mass_positiony, hu.size.x, hu.size.y);
                    // 王将
					}else if (board[i + (NUM_WIDTHMASS * j)] == 2){
                        ctx.beginPath();
                        ctx.fillStyle = 'rgba(150, 255, 0, 0.75)';
                        // ctx.fillRect(mass_positionx, mass_positiony, hu.size.x, hu.size.y);
                    }
                    
				}
            }
        }

        // 画像表示
        boardImg.onload = function onImageLoad() {
            ctx.drawImage(boardImg, 0, 0, screenCanvas.width, screenCanvas.height)  
		}
        boardImg.src = "Image/syougi_ban.png"

        var huPositions = [];
        var osyoPositions = [];
        for(var j = 0;j < NUM_HEIGHTMASS;j++){
            for(i = 0;i < NUM_WIDTHMASS;i++){
                if (board[i + (NUM_WIDTHMASS * j)] != 0){
                    // 歩
                    if (board[i + (NUM_WIDTHMASS * j)] == 1){
                        ctx.beginPath();
                        ctx.fillStyle = 'rgba(0, 255, 0, 0.75)';
                        // ctx.fillRect(mass_positionx, mass_positiony, hu.size.x, hu.size.y);
                    // 王将
					}else if (board[i + (NUM_WIDTHMASS * j)] == 2){
                        ctx.beginPath();
                        ctx.fillStyle = 'rgba(150, 255, 0, 0.75)';
                        // ctx.fillRect(mass_positionx, mass_positiony, hu.size.x, hu.size.y);
                    }
                    
				}
            }
        }
        huImg.onload = function onImageLoad() {
            ctx.drawImage(huImg, mass_positionx, mass_positiony, hu.size.x, hu.size.y)  
		}
        huImg.src = "Image/syougi14_fuhyou.png"

        ousyouImage.onload = function onImageLoad() {
            ctx.drawImage(ousyouImage, mass_positionx, mass_positiony, hu.size.x, hu.size.y)  
		}
        ousyouImage.src = "Image/syougi01_ousyou.png"

        if(gameStatus == "win"){
            ctx.fillStyle = 'rgba(30,90,30,0.75)';
            // ctx.fillRect(50,50,100,100);
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.font = '48px serif';
            ctx.strokeText('WIN', 60, 150);
		}
        
        ctx.fill();
        
        /*
        // パスの設定を開始
        ctx.beginPath();

        // 円の色を設定する
        ctx.fillStyle = 'rgba(0, 0, 255, 0.75)';

        // 自機の位置を設定
        chara.position.x = mouse.x;
        chara.position.y = mouse.y;

        // 自機を描くパスを設定
        ctx.arc(chara.position.x, chara.position.y, chara.size, 0, Math.PI * 2, false);

        // 自機の色を設定する
        ctx.fillStyle = CHARA_COLOR;

        ctx.closePath();
        ctx.fill();

        // fireフラグの値により分岐
        if(fire){
            // すべての自機ショットを調査する
            for(i = 0; i < CHARA_SHOT_MAX_COUNT; i++){
                // 自機ショットが既に発射されているかチェック
                if(!charaShot[i].alive){
                    // 自機ショットを新規にセット
                    charaShot[i].set(chara.position, 3, 5);
    
                    // ループを抜ける
                    break;
                }
            }
            // フラグを降ろしておく
            fire = false;
        }

        // パスの設定を開始
        ctx.beginPath();

        // すべての自機ショットを調査する
        for(i = 0; i < CHARA_SHOT_MAX_COUNT; i++){
        // 自機ショットが既に発射されているかチェック
            if(charaShot[i].alive){
                // 自機ショットを動かす
                charaShot[i].move();

                // 自機ショットを描くパスを設定
                ctx.arc(
                    charaShot[i].position.x,
                    charaShot[i].position.y,
                    charaShot[i].size,
                    0, Math.PI * 2, false
                );

                // パスをいったん閉じる
                ctx.closePath();
            }
        }

        // 自機ショットの色を設定する
        ctx.fillStyle = CHARA_SHOT_COLOR;

        // 自機ショットを描く
        ctx.fill();
        */

        //フラグを戻す
        click = false;

        // フラグにより再帰呼び出し
        if (run) { setTimeout(arguments.callee, fps); }
    })();
};

// - event --------------------------------------------------------------------
function mouseMove(event) {
    // マウスカーソル座標の更新
    mouse.x = event.clientX - screenCanvas.offsetLeft;
    mouse.y = event.clientY - screenCanvas.offsetTop;
}

function mouseDown(event) {
    // フラグを立てる
    click = true;
}

function keyDown(event) {
    // キーコードを取得
    var ck = event.keyCode;

    // Escキーが押されていたらフラグを降ろす
    if (ck === 27) { run = false; }
}