//建立pixi實體
let Application = PIXI.Application;

//Create a Pixi Application
var app = new Application({
	width: 1200,
	height: 600,
	antialiasing: true,
	transparent: false,
	resolution: 1
});

//載入聲音
var music_bg = new Howl({
	src: ['./sound/bgm.mp3'],
	loop: true,
});
var sound_correct = new Howl({
	src: ['./sound/goodjob.mp3']
});
var sound_wrong = new Howl({
	src: ['./sound/wronganswer.mp3']
});
var sound_btn = new Howl({
	src: ['./sound/button.mp3']
});
var sound_win = new Howl({
	src: ['./sound/win.mp3']
});
var sound_lose = new Howl({
	src: ['./sound/lose.mp3']
});


//將實體加載到html位置上
$('.gametable').append(app.view);

//Aliases
var loader = PIXI.loader;

var resources = PIXI.loader.resources;
var Sprite = PIXI.Sprite;

//LoadQueue需要再加入一個功能:因為元件無法透過z-index來設定前後，只能透過載入順序，因此需要再多加一個參數
//元件載入步驟
// 1.將圖片加載入loader中
// 2.loader調用方法產生元件
// 由於1、2步驟是依序漸進的，但設計遊戲時很難一開始就知道有多少元件要載入，於是需要再設計一個佇列在程式的最後來執行此步驟
var LoaderQueue = {
	imgPaths: [],
	imgFuncs: [],
	imgReFuncs: [],
	gameFuncs: [],
	HasImg: function (imgPath) {
		let issame = false;
		this.imgPaths.forEach(path => {
			if (imgPath === path) {
				issame = true;
			}
		});
		return issame;
	},
	AddImg(imgPath) {
		this.imgPaths.push(imgPath);
	},
	AddGameFunc(gmaeFunc) {
		this.gameFuncs.push(gmaeFunc);
	},
	AddFunc(imgFunc) {
		this.imgFuncs.push(imgFunc);
	},
	AddReFunc(imgReFunc) {
		this.imgReFuncs.push(imgReFunc);
	},
	ExecuteQueue() {
		this.imgPaths.forEach(path => {
			loader.add(path, {
				crossOrigin: 'anonymous',
				loadType: PIXI.loaders.Resource.LOAD_TYPE.XHR,
			});
		});
		this.imgFuncs.forEach(func => {
			loader.load(func);
		});
	},
	ReExecuteQueue() {
		this.imgReFuncs.forEach(func => {
			loader.load(func);
		});
	},
	ExecuteGame() {
		this.gameFuncs.forEach(func => {
			loader.load(func);
		});
	}
}

//暫停時須取消事件的按鈕群組
var pausebtngroups = [];

//font
const white_big_style = new PIXI.TextStyle({
	fontFamily: 'Noto Sans',
	fontSize: 24,
	fill: 0xffffff,
});
const white_Style = new PIXI.TextStyle({
	fontFamily: 'Noto Sans',
	fontSize: 16,
	fill: 0xffffff,
});
const black_Style = new PIXI.TextStyle({
	fontFamily: 'Noto Sans',
	fontSize: 16,
	fill: 0x000000,
	align: 'center'
});
const white_En_big_Style = new PIXI.TextStyle({
	fontFamily: 'Microsoft JhengHei',
	fontSize: 24,
	fill: 0xffffff,
});
const white_En_Style = new PIXI.TextStyle({
	fontFamily: 'Microsoft JhengHei',
	fontSize: 16,
	fill: 0xffffff,
});
const red_En_small_Style = new PIXI.TextStyle({
	fontFamily: 'Microsoft JhengHei',
	fontSize: 14,
	fill: 0xff0000,
});


//載入背景
var bgimg;

//載入勝利失敗背景
var winlightbox;
var winlight;

function setupwinlightbox() {
	winlight = new Sprite(resources["./img/winlight.png"].texture);
	winlight.width = 400;
	winlight.height = 400;
	winlight.position.set(600, 210);
	winlight.anchor.set(0.5, 0.5);
	app.stage.addChild(winlight);

	winlightbox = new Sprite(resources["./img/youwin.png"].texture);
	winlightbox.width = 550;
	winlightbox.height = 355;
	winlightbox.y = 50;
	winlightbox.x = 315;
	app.stage.addChild(winlightbox);
	app.ticker.add((delta) => {
		winlight.rotation -= 0.01 * delta;
	});
}
LoaderQueue.AddImg('./img/youwin.png');
LoaderQueue.AddImg('./img/winlight.png');
//LoaderQueue.AddFunc(setupwinlightbox);

var lostlightbox;
function setuplostlightbox() {
	lostlightbox = new Sprite(resources["./img/gameover.png"].texture);
	lostlightbox.width = 550;
	lostlightbox.height = 360;
	lostlightbox.y = 50;
	lostlightbox.x = 325;
	app.stage.addChild(lostlightbox);
}
LoaderQueue.AddImg('./img/gameover.png');


//載入獎勵背景
var bunuslightbox;
var bunusText;

function setupbunuslightbox() {
	bunuslightbox = new Sprite(resources["./img/bunus.png"].texture);
	bunuslightbox.width = 600;
	bunuslightbox.height = 300;
	bunuslightbox.y = 110;
	bunuslightbox.x = 297;
	app.stage.addChild(bunuslightbox);
	let awardprice = PlayerAward.playprice == undefined ? 0 : PlayerAward.playprice;
	bunusText = new PIXI.Text('+ ' + awardprice, black_Style);
	bunusText.x = 585;
	bunusText.y = 320;
	app.stage.addChild(bunusText);
}
LoaderQueue.AddImg('./img/bunus.png');

//設定離開提示lightbox
var quitalert_lightbox;
var quitalert_Title;
var quitalert_Text;
var quitalert_confirmbtn_Text;
var quitalert_confirmbtn;
var quitalert_cancelbtn;

function setupquitalert_lightbox() {
	pauseevent();
	quitalert_lightbox = new Sprite(resources["./img/quit_lightbox.png"].texture);
	quitalert_lightbox.width = 550;
	quitalert_lightbox.height = 350;
	quitalert_lightbox.y = 110;
	quitalert_lightbox.x = 322;
	app.stage.addChild(quitalert_lightbox);
	quitalert_Title = new PIXI.Text('提示', white_Style);
	quitalert_Title.x = 582;
	quitalert_Title.y = 150;
	app.stage.addChild(quitalert_Title);
	quitalert_Text = new PIXI.Text('亲爱的小朋友，\n游戏还没有完成，\n确定要退出吗?', black_Style);
	quitalert_Text.x = 540;
	quitalert_Text.y = 250;
	app.stage.addChild(quitalert_Text);
	let confirmbtntexture = PIXI.Texture.fromImage('./img/bluebtn.png');
	let confirmbtntexture_down = PIXI.Texture.fromImage('./img/bluedarkbtn.png');
	quitalert_confirmbtn = new Sprite(resources["./img/bluebtn.png"].texture);
	quitalert_confirmbtn.width = 135;
	quitalert_confirmbtn.height = 45;
	quitalert_confirmbtn.y = 420;
	quitalert_confirmbtn.x = 530;
	quitalert_confirmbtn.buttonMode = true;
	quitalert_confirmbtn.interactive = true;
	quitalert_confirmbtn.on("pointerdown", function () {
		quitalert_confirmbtn.texture = confirmbtntexture_down;
	});
	quitalert_confirmbtn.on("pointerup", function () {
		quitalert_confirmbtn.texture = confirmbtntexture;
		Exitgame();
	});
	app.stage.addChild(quitalert_confirmbtn);
	quitalert_confirmbtn_Text = new PIXI.Text('确定', white_Style);
	quitalert_confirmbtn_Text.x = 582;
	quitalert_confirmbtn_Text.y = 433;
	app.stage.addChild(quitalert_confirmbtn_Text);
	
	let cancelbtntexture = PIXI.Texture.fromImage('./img/close_btn.png');
	let cancelbtntexture_down = PIXI.Texture.fromImage('./img/close_none_btn.png');
	quitalert_cancelbtn = new Sprite(resources["./img/close_btn.png"].texture);
	quitalert_cancelbtn.width = 50;
	quitalert_cancelbtn.height = 55;
	quitalert_cancelbtn.y = 115;
	quitalert_cancelbtn.x = 825;
	quitalert_cancelbtn.buttonMode = true;
	quitalert_cancelbtn.interactive = true;
	quitalert_cancelbtn.on("pointerdown", function () {
		quitalert_cancelbtn.texture = cancelbtntexture_down;
	});
	quitalert_cancelbtn.on("pointerup", function () {
		quitalert_cancelbtn.texture = cancelbtntexture;
		removequitalert_lightbox();
		pauseevent();
	});
	app.stage.addChild(quitalert_cancelbtn);
}
function removequitalert_lightbox() {
	app.stage.removeChild(quitalert_lightbox);
	app.stage.removeChild(quitalert_Title);
	app.stage.removeChild(quitalert_Text);
	app.stage.removeChild(quitalert_confirmbtn);
	app.stage.removeChild(quitalert_confirmbtn_Text);
	app.stage.removeChild(quitalert_cancelbtn);
}
LoaderQueue.AddImg('./img/close_btn.png');
LoaderQueue.AddImg('./img/bluebtn.png');
LoaderQueue.AddImg('./img/quit_lightbox.png');


//載入確定鍵
var okaybtn;
var okaybtn_Text;
function setupokaybtn() {
	let okaybtntexture = PIXI.Texture.fromImage('./img/bluebtn.png');
	let okaybtntexture_down = PIXI.Texture.fromImage('./img/bluedarkbtn.png');
	okaybtn = new Sprite(resources["./img/bluebtn.png"].texture);
	okaybtn.width = 135;
	okaybtn.height = 45;
	okaybtn.y = 420;
	okaybtn.x = 530;
	okaybtn.buttonMode = true;
	okaybtn.interactive = true;
	okaybtn.on("pointerdown", function () {
		okaybtn.texture = okaybtntexture_down;
		if (StarCounts >= StarTotal) {
			setupwinlightbox();
			setupplayagainbtn();
			setupexitbtn();
			sound_win.play();
			music_bg.stop();
		}
		//lost
		else if (HeartCounts <= 0) {
			setuplostlightbox();
			setuptryagainbtn();
			setupexitbtn();
			music_bg.stop();
			sound_lose.play();
		}
		app.stage.removeChild(bunuslightbox);
		app.stage.removeChild(okaybtn);
		app.stage.removeChild(okaybtn_Text);
	});
	okaybtn.on("pointerup", function () {
		okaybtn.texture = okaybtntexture;
	});
	app.stage.addChild(okaybtn);
	okaybtn_Text = new PIXI.Text('确定', white_Style);
	okaybtn_Text.x = 583;
	okaybtn_Text.y = 433;
	app.stage.addChild(okaybtn_Text);
}


//載入再試一次鍵
var tryagainbtn;

function setuptryagainbtn() {
	let tryagainbtntexture = PIXI.Texture.fromImage('./img/tryagain.png');
	let tryagainbtntexture_down = PIXI.Texture.fromImage('./img/tryagain_none.png');
	tryagainbtn = new Sprite(resources["./img/tryagain.png"].texture);
	tryagainbtn.width = 135;
	tryagainbtn.height = 90;
	tryagainbtn.y = 420;
	tryagainbtn.x = 380;
	tryagainbtn.buttonMode = true;
	tryagainbtn.interactive = true;
	tryagainbtn.on("pointerup", function () {
		ReLoadgame();
		tryagainbtn.texture = tryagainbtntexture;
	});
	tryagainbtn.on("pointerdown", function () {
		tryagainbtn.texture = tryagainbtntexture_down;
	});
	app.stage.addChild(tryagainbtn);
}
LoaderQueue.AddImg('./img/tryagain.png');

//載入再玩一次鍵
var playagainbtn;

function setupplayagainbtn() {
	let playagainbtntexture = PIXI.Texture.fromImage('./img/playagain.png');
	let playagainbtntexture_down = PIXI.Texture.fromImage('./img/playagain_none.png');
	playagainbtn = new Sprite(resources["./img/playagain.png"].texture);
	playagainbtn.width = 135;
	playagainbtn.height = 90;
	playagainbtn.y = 420;
	playagainbtn.x = 380;
	playagainbtn.buttonMode = true;
	playagainbtn.interactive = true;
	playagainbtn.on("pointerup", function () {
		ReLoadgame();
		playagainbtn.texture = playagainbtntexture;
	});
	playagainbtn.on("pointerdown", function () {
		playagainbtn.texture = playagainbtntexture_down;
	});
	app.stage.addChild(playagainbtn);
}
LoaderQueue.AddImg('./img/playagain.png');

//載入離開鍵
var exitbtn;

function setupexitbtn() {
	let exitbtntexture = PIXI.Texture.fromImage('./img/exit.png');
	let exitbtntexture_down = PIXI.Texture.fromImage('./img/exit_none.png');
	exitbtn = new Sprite(resources["./img/exit.png"].texture);
	exitbtn.width = 135;
	exitbtn.height = 90;
	exitbtn.y = 420;
	exitbtn.x = 680;
	exitbtn.buttonMode = true;
	exitbtn.interactive = true;
	exitbtn.on("pointerup", function () {
		exitbtn.texture = exitbtntexture;
		Exitgame();
	});
	exitbtn.on("pointerdown", function () {
		exitbtn.texture = exitbtntexture_down;
	});
	app.stage.addChild(exitbtn);
}
LoaderQueue.AddImg('./img/exit.png');


//載入玩家
var man;
var playertimer = 0;
var manface = "thinking";

function setupMan() {
	let playertexture_01 = PIXI.Texture.fromImage('./img/dogimg/1-1.png');
	let playertexture_02 = PIXI.Texture.fromImage('./img/dogimg/1-2.png');
	let playertexture_03 = PIXI.Texture.fromImage('./img/dogimg/1-3.png');
	man = new Sprite(resources["./img/dogimg/1-1.png"].texture);
	man.texture = playertexture_01;
	man.width = 180;
	man.height = 240;
	man.y = 120;
	man.x = 260;
	app.stage.addChild(man);
	app.ticker.add((delta) => {
		if(!IsQuitPause){
			if (!IsPause) {
				manface = "thinking";
			}
			switch (manface) {
				case "thinking":
					man.texture = playertexture_01;
					break;
				case "smile":
					man.texture = playertexture_02;
					break;
				case "cry":
					man.texture = playertexture_03;
					break;
			}
		}
	});
}

function ResetupMan() {
	app.stage.removeChild(man);
	app.stage.addChild(man);
}
LoaderQueue.AddImg('./img/dogimg/1-1.png');
LoaderQueue.AddImg('./img/dogimg/1-2.png');
LoaderQueue.AddImg('./img/dogimg/1-3.png');
LoaderQueue.AddFunc(setupMan);
LoaderQueue.AddReFunc(ResetupMan);

var dog;
var playertimer = 0;
var dogface = "cry";

function setupDog() {
	let playertexture_01 = PIXI.Texture.fromImage('./img/dogimg/2-1.png');
	let playertexture_02 = PIXI.Texture.fromImage('./img/dogimg/2-2.png');
	dog = new Sprite(resources["./img/dogimg/2-1.png"].texture);
	dog.texture = playertexture_01;
	dog.width = 160;
	dog.height = 200;
	dog.y = 165;
	dog.x = 495;
	app.stage.addChild(dog);
	app.ticker.add((delta) => {
		if (!IsPause && !IsQuitPause) {
			dogface = "cry";
		}
		switch (dogface) {
			case "cry":
				dog.texture = playertexture_01;
				break;
			case "smile":
				dog.texture = playertexture_02;
				break;
		}
	});
}

function ResetupDog() {
	app.stage.removeChild(dog);
	app.stage.addChild(dog);
}
LoaderQueue.AddImg('./img/dogimg/2-1.png');
LoaderQueue.AddImg('./img/dogimg/2-2.png');
LoaderQueue.AddFunc(setupDog);
LoaderQueue.AddReFunc(ResetupDog);


//載入題目背板
// var questionboard;
// function setupquestionboard() {
// 	questionboard = new Sprite(resources['./img/dogimg/board.png'].texture);
// 	questionboard.x = 700;
// 	questionboard.y = 50;
// 	questionboard.width = 350;
// 	questionboard.height = 300;

// 	app.stage.addChild(questionboard);
// }
// function Resetupquestionboard() {
// 	app.stage.removeChild(questiontext);
// 	setupquestiontext();
// }
// LoaderQueue.AddImg('./img/dogimg/board.png');
// LoaderQueue.AddFunc(setupquestionboard);
// LoaderQueue.AddReFunc(Resetupquestionboard);

//載入id
var idtext;
function setupidtext() {
	idtext = new PIXI.Text('ID : ' + DataObj.steps_id, red_En_small_Style);
	idtext.position.set(240, 75);
	idtext.anchor.set(0.5, 0.5);
	app.stage.addChild(idtext);
}
LoaderQueue.AddFunc(setupidtext);

//載入題目文字
var questiontext;
function setupquestiontext() {
	questiontext = new Sprite(resources[CurrentQuestion.textimg].texture);
	questiontext.width = 300;
	questiontext.height = 250;
	questiontext.x = 725;
	questiontext.y = 50;
	app.stage.addChild(questiontext);
}
function Resetupquestiontext() {
	app.stage.removeChild(questiontext);
	setupquestiontext();
}
LoaderQueue.AddGameFunc(setupquestiontext);
LoaderQueue.AddReFunc(Resetupquestiontext);



//載入題目圖片
var CurrentQuestion = {
	questions: [{
		path: "",
		name: "",
		target: null
	},
	{
		path: "",
		name: "",
		target: null
	},
	{
		path: "",
		name: "",
		target: null
	}],
	textimg:"",
	sound: null,
	answerName: "",
	answerNum: 0
}

var QusetionLeftFrame, QusetionMiddleFrame, QusetionRightFrame;
var QusetionLeft, QusetionMiddle, QusetionRight;

function setupQuestionPic() {	
	QusetionLeftFrame = new Sprite(resources['./img/dogimg/3.png'].texture);
	QusetionLeftFrame.width = 160;
	QusetionLeftFrame.height = 220;
	QusetionLeftFrame.y = 420;
	QusetionLeftFrame.x = -500;
	CurrentQuestion.questions[0].targetframe = QusetionLeftFrame;
	CurrentQuestion.questions[0].targetframe.anchor.set(0.5, 0.5);
	QusetionLeftFrame.alpha = 0;
	QusetionLeftFrame.buttonMode = true;
	QusetionLeftFrame.interactive = false;
	QusetionLeftFrame.on("pointerdown", function () {
		AnswerFunc("left");
	});
	app.stage.addChild(QusetionLeftFrame);

	QusetionMiddleFrame = new Sprite(resources['./img/dogimg/3.png'].texture);
	QusetionMiddleFrame.width = 160;
	QusetionMiddleFrame.height = 220;
	QusetionMiddleFrame.y = 420;
	QusetionMiddleFrame.x = -330;
	CurrentQuestion.questions[1].targetframe = QusetionMiddleFrame;
	CurrentQuestion.questions[1].targetframe.anchor.set(0.5, 0.5);
	QusetionMiddleFrame.alpha = 0;
	QusetionMiddleFrame.buttonMode = true;
	QusetionMiddleFrame.interactive = false;
	QusetionMiddleFrame.on("pointerdown", function () {
		AnswerFunc("middle");
	});
	app.stage.addChild(QusetionMiddleFrame);

	QusetionRightFrame = new Sprite(resources['./img/dogimg/3.png'].texture);
	QusetionRightFrame.width = 160;
	QusetionRightFrame.height = 220;
	QusetionRightFrame.y = 420;
	QusetionRightFrame.x = -160;
	CurrentQuestion.questions[2].targetframe = QusetionRightFrame;
	CurrentQuestion.questions[2].targetframe.anchor.set(0.5, 0.5);
	QusetionRightFrame.alpha = 0;
	QusetionRightFrame.buttonMode = true;
	QusetionRightFrame.interactive = false;
	QusetionRightFrame.on("pointerdown", function () {
		AnswerFunc("right");
	});
	app.stage.addChild(QusetionRightFrame);


	QusetionLeft = new Sprite(resources[CurrentQuestion.questions[0].path].texture);
	QusetionLeft.width = 80;
	QusetionLeft.height = 80;
	QusetionLeft.y = 440;
	QusetionLeft.x = -500;
	QusetionLeft.name = CurrentQuestion.questions[0].name;
	CurrentQuestion.questions[0].target = QusetionLeft;
	CurrentQuestion.questions[0].target.anchor.set(0.5, 0.5);
	QusetionLeft.alpha = 0;
	
	app.stage.addChild(QusetionLeft);

	QusetionMiddle = new Sprite(resources[CurrentQuestion.questions[1].path].texture);
	QusetionMiddle.width = 80;
	QusetionMiddle.height = 80;
	QusetionMiddle.y = 440;
	QusetionMiddle.x = -330;
	QusetionMiddle.name = CurrentQuestion.questions[1].name;
	CurrentQuestion.questions[1].target = QusetionMiddle;
	CurrentQuestion.questions[1].target.anchor.set(0.5, 0.5);
	QusetionMiddle.alpha = 0;
	app.stage.addChild(QusetionMiddle);

	QusetionRight = new Sprite(resources[CurrentQuestion.questions[2].path].texture);
	QusetionRight.width = 80;
	QusetionRight.height = 80;
	QusetionRight.y = 440;
	QusetionRight.x = -160;
	QusetionRight.name = CurrentQuestion.questions[2].name;
	CurrentQuestion.questions[2].target = QusetionRight;
	CurrentQuestion.questions[2].target.anchor.set(0.5, 0.5);
	QusetionRight.alpha = 0;
	app.stage.addChild(QusetionRight);

	pausebtngroups.push(QusetionLeftFrame);
	pausebtngroups.push(QusetionMiddleFrame);
	pausebtngroups.push(QusetionRightFrame);
}


var soundtime_timer;
function ResetupQuestionPic() {
	app.stage.removeChild(QusetionLeftFrame);
	app.stage.removeChild(QusetionMiddleFrame);
	app.stage.removeChild(QusetionRightFrame);
	
	app.stage.removeChild(QusetionLeft);
	app.stage.removeChild(QusetionMiddle);
	app.stage.removeChild(QusetionRight);
	
	setupQuestionPic();
	QusetionLeftFrame.alpha = 1;
	QusetionMiddleFrame.alpha = 1;
	QusetionRightFrame.alpha = 1;

	QusetionLeft.alpha = 1;
	QusetionMiddle.alpha = 1;
	QusetionRight.alpha = 1;
	//sound
	answersound = CurrentQuestion.sound;
	setTimeout(() => {
		clearTimeout(soundtime_timer);
		IssoundPlay = true;
		answersound.play();
		soundtime_timer = setTimeout(() => {
			QuestionBtnActive(true);
			IssoundPlay = false;
		}, soundtime);
	}, 200);
}
function QuestionBtnActive(IsActive) {
	if (IsActive){
		QusetionRightFrame.interactive = true;
		QusetionMiddleFrame.interactive = true;
		QusetionLeftFrame.interactive = true;
		repeatbtn.interactive = true;
		repeatbtn.texture = repeattexture;
	}
	else{
		QusetionRightFrame.interactive = false;
		QusetionMiddleFrame.interactive = false;
		QusetionLeftFrame.interactive = false;
		repeatbtn.interactive = false;
		repeatbtn.texture = repeattexture_none;
	}
}
CorrectAnimeTimer = 0;
var answersound;
var speed = 50;
var offsetdistance = 950;
var offsetcurrent = 0;
var Isarrived = false;
var AnswerpauseTime = 1600;
var wrongPosTemp = 0;
var wrongFramePosTemp = 0;
function setupQuestionPicGame() {
	//sound
	answersound = CurrentQuestion.sound;
	offsetcurrent = offsetdistance;
	setTimeout(() => {
		clearTimeout(soundtime_timer);
		IssoundPlay = true;
		answersound.play();
		soundtime_timer = setTimeout(() => {
			QuestionBtnActive(true);
			IssoundPlay = false;
		}, soundtime);
	}, 200);
	app.ticker.add((delta) => {
		if (!IsPause && !IsQuitPause && !Isarrived) {
			offsetcurrent -= speed;
			if (offsetcurrent > 0)
			{
				QusetionLeftFrame.x += speed;
				QusetionMiddleFrame.x += speed;			
				QusetionRightFrame.x += speed;
				
				QusetionLeft.x += speed;
				QusetionMiddle.x += speed;
				QusetionRight.x += speed;
			}
			else if (offsetcurrent>-5000){
			}
			else{
				Isarrived = true;
			}
		} else if (IsPlayAnime != "no") {
			CorrectAnimeTimer += speed;
			switch (IsPlayAnime) {
				case "correct":
					if (CorrectAnimeTimer > AnswerpauseTime) {
						QusetionLeftFrame.x += 1 * speed;
						QusetionMiddleFrame.x += 1 * speed;
						QusetionRightFrame.x += 1 * speed;
		
						QusetionLeft.x += 1 * speed;
						QusetionMiddle.x += 1 * speed;
						QusetionRight.x += 1 * speed;
					} else if (CorrectAnimeTimer > 1500) {
						CurrentQuestion.questions[chooseNum].target.alpha = 0;
						CurrentQuestion.questions[chooseNum].targetframe.alpha = 0;
					} else if (CorrectAnimeTimer > 500) {
						CurrentQuestion.questions[chooseNum].target.y -= 0.1 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.y -= 0.1 * speed;
						CurrentQuestion.questions[chooseNum].target.scale.x -= 0.00012 * speed;
						CurrentQuestion.questions[chooseNum].target.scale.y -= 0.00012 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.scale.x -= 0.00005 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.scale.y -= 0.00005 * speed;
					} else {
						CurrentQuestion.questions[chooseNum].target.scale.x += 0.00012 * speed;
						CurrentQuestion.questions[chooseNum].target.scale.y += 0.00012 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.scale.x += 0.00005 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.scale.y += 0.00005 * speed;
					}
					break;
				case "wrong":
					if (CorrectAnimeTimer > AnswerpauseTime) {
						QusetionLeftFrame.x += 1 * speed;
						QusetionMiddleFrame.x += 1 * speed;
						QusetionRightFrame.x += 1 * speed;

						QusetionLeft.x += 1 * speed;
						QusetionMiddle.x += 1 * speed;
						QusetionRight.x += 1 * speed;
					}
					else if (CorrectAnimeTimer > 825) {
						CurrentQuestion.questions[chooseNum].target.x = wrongPosTemp;
						CurrentQuestion.questions[chooseNum].targetframe.x = wrongFramePosTemp;
					}
					else if (CorrectAnimeTimer > 750) {
						CurrentQuestion.questions[chooseNum].target.x -= 0.1 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.x -= 0.1 * speed;
					}
					else if (CorrectAnimeTimer > 600) {
						CurrentQuestion.questions[chooseNum].target.x += 0.1 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.x += 0.1 * speed;
					}
					else if (CorrectAnimeTimer > 450) {
						CurrentQuestion.questions[chooseNum].target.x -= 0.1 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.x -= 0.1 * speed;
					}
					else if (CorrectAnimeTimer > 300) {
						CurrentQuestion.questions[chooseNum].target.x += 0.1 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.x += 0.1 * speed;
					} else if (CorrectAnimeTimer > 150) {
						CurrentQuestion.questions[chooseNum].target.x -= 0.1 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.x -= 0.1 * speed;
					} else {
						CurrentQuestion.questions[chooseNum].target.x += 0.1 * speed;
						CurrentQuestion.questions[chooseNum].targetframe.x += 0.1 * speed;
					}					
					break;
			}
		}
	});
}

var chooseAnswer = null;
var chooseNum = 0;
function AnswerFunc(answer) {
	if (!IsQuitPause && !IssoundPlay) {
		switch (answer) {
			case "left":
				chooseAnswer = QusetionLeft;
				chooseNum = 0;
				break;
			case "middle":
				chooseAnswer = QusetionMiddle;			
				chooseNum = 1;
				break;
			case "right":
				chooseAnswer = QusetionRight;					
				chooseNum = 2;
				break;
		}
	
		answersound.stop();
		wrongPosTemp = CurrentQuestion.questions[chooseNum].target.x;
		wrongFramePosTemp = CurrentQuestion.questions[chooseNum].targetframe.x;
	}
}
LoaderQueue.AddImg('./img/dogimg/3.png');

// LoaderQueue.AddImg('./img/car.png');
// LoaderQueue.AddImg('./img/bike.png');
// LoaderQueue.AddImg('./img/moto.png');
// LoaderQueue.AddImg('./img/taxi.png');
LoaderQueue.AddFunc(setupQuestionPic);
LoaderQueue.AddReFunc(ResetupQuestionPic);
LoaderQueue.AddGameFunc(setupQuestionPicGame);

// var Isclickable = true;
// function IsClicking() {
// 	Isclickable = false;
// 	setTimeout(() => {
// 		Isclickable = true;
// 	}, 100);
// }


//載入血條
var hearts = [];
function setupBlood() {
	for (i = 0; i < HeartTotal; i++) {
		hearts[i] = new Sprite(resources["./img/heart-red.png"].texture);
		hearts[i].width = 50;
		hearts[i].height = 50;
		hearts[i].x = 50 + 50 * i;
		hearts[i].y = 50;
		app.stage.addChild(hearts[i]);
	}
}

function ResetupBlood() {
	for (i = 0; i < HeartTotal; i++) {
		app.stage.removeChild(hearts[i]);
	}
	for (i = 0; i < HeartTotal; i++) {
		if (i > HeartCounts - 1) {
			hearts[i] = new Sprite(resources["./img/heart-gray.png"].texture);
		} else {
			hearts[i] = new Sprite(resources["./img/heart-red.png"].texture);
		}
		hearts[i].width = 50;
		hearts[i].height = 50;
		hearts[i].x = 50 + 50 * i;
		hearts[i].y = 50;
		app.stage.addChild(hearts[i]);
	}
}
LoaderQueue.AddImg('./img/heart-gray.png');
LoaderQueue.AddImg('./img/heart-red.png');
LoaderQueue.AddFunc(setupBlood);
LoaderQueue.AddReFunc(ResetupBlood);

//載入星星
var stars = [];
function setupStar() {
	for (i = 0; i < StarTotal; i++) {
		stars[i] = new Sprite(resources["./img/star-gray.png"].texture);
		stars[i].width = 50;
		stars[i].height = 50;
		stars[i].x = 1100 - 50 * i;
		stars[i].y = 50;
		app.stage.addChild(stars[i]);
	}
}

function ResetupStar() {
	for (i = 0; i < StarTotal; i++) {
		app.stage.removeChild(stars[i]);
	}
	for (i = 0; i < StarTotal; i++) {
		if (i <= StarCounts - 1) {
			stars[i] = new Sprite(resources["./img/star-yellow.png"].texture);
		} else {
			stars[i] = new Sprite(resources["./img/star-gray.png"].texture);
		}
		stars[i].width = 50;
		stars[i].height = 50;
		stars[i].x = 1100 - 50 * i;
		stars[i].y = 50;
		app.stage.addChild(stars[i]);
	}
}
LoaderQueue.AddImg('./img/star-gray.png');
LoaderQueue.AddImg('./img/star-yellow.png');
LoaderQueue.AddFunc(setupStar);
LoaderQueue.AddReFunc(ResetupStar);

function pauseevent() {
	if (Isgamestart) {
		if (IsQuitPause) {
			IsQuitPause = false;
			app.stage.removeChild(blackfield);
			pausebtngroups.forEach(btn => {
				btn.interactive = true;
			});
		} else {
			IsQuitPause = true;
			setupblackfield();
			pausebtngroups.forEach(btn => {
				btn.interactive = false;
			});
		}
	}
}


//載入音樂鍵
var musicbtn, IsSound = true;
function setupmusicbtn() {
	let musictexture_play = PIXI.Texture.fromImage('./img/music.png');
	let musictexture_stop = PIXI.Texture.fromImage('./img/music_mute.png');
	let musictexture_none = PIXI.Texture.fromImage('./img/music_none.png');
	musicbtn = new Sprite(resources["./img/music.png"].texture);
	musicbtn.width = 105;
	musicbtn.height = 75;
	musicbtn.y = 200;
	musicbtn.x = 30;
	musicbtn.buttonMode = true;
	musicbtn.interactive = false;
	pausebtngroups.push(musicbtn);
	musicbtn.on("pointerup", function () {
		if (IsSound) {
			IsSound = false;
			music_bg.pause();
			musicbtn.texture = musictexture_stop;
		} else {
			IsSound = true;
			music_bg.play();
			musicbtn.texture = musictexture_play;
		}
	});
	musicbtn.on("pointerdown", function () {
		musicbtn.texture = musictexture_none;		
	});
	app.stage.addChild(musicbtn);
}
LoaderQueue.AddImg('./img/music.png');
LoaderQueue.AddFunc(setupmusicbtn);

//載入重來鍵
var repeatbtn;
var IssoundPlay = false;
var repeattexture = PIXI.Texture.fromImage('./img/repeat.png');
var repeattexture_none = PIXI.Texture.fromImage('./img/repeat_none.png');
//soundtime要自己算
var soundtime = 2000;
function setuprepeatbtn() {
	repeatbtn = new Sprite(resources["./img/repeat_none.png"].texture);
	repeatbtn.width = 105;
	repeatbtn.height = 75;
	repeatbtn.y = 130;
	repeatbtn.x = 30;
	repeatbtn.buttonMode = true;
	repeatbtn.interactive = false;
	pausebtngroups.push(repeatbtn);
	repeatbtn.on("pointerup", function () {
		if (!IssoundPlay && !IsQuitPause) {	
			Repeatsound();
		}
	});
	repeatbtn.on("pointerdown", function () {
		if (!IssoundPlay && !IsQuitPause) {	
			repeatbtn.texture = repeattexture_none;
		}
	});
	app.stage.addChild(repeatbtn);
}
LoaderQueue.AddImg('./img/repeat_none.png');
LoaderQueue.AddImg('./img/repeat.png');
LoaderQueue.AddFunc(setuprepeatbtn);

//載入離開鍵
var quitbtn;
function setupquitbtn() {
	let quittexture = PIXI.Texture.fromImage('./img/quit.png');
	let quittexture_none = PIXI.Texture.fromImage('./img/quit_none.png');
	quitbtn = new Sprite(resources["./img/quit.png"].texture);
	quitbtn.width = 105;
	quitbtn.height = 75;
	quitbtn.y = 520;
	quitbtn.x = 1060;
	quitbtn.buttonMode = true;
	quitbtn.interactive = false;
	pausebtngroups.push(quitbtn);
	quitbtn.on("pointerup", function () {
		if (!IsQusetionPause){
			setupquitalert_lightbox();
			quitbtn.texture = quittexture;
		}
	});
	quitbtn.on("pointerdown", function () {
		quitbtn.texture = quittexture_none;
	});
	app.stage.addChild(quitbtn);
}
LoaderQueue.AddImg('./img/quit.png');
LoaderQueue.AddFunc(setupquitbtn);


//載入黑屏
var blackfield;
function setupblackfield() {
	blackfield = new Sprite(resources["./img/blackfield.png"].texture);
	blackfield.width = 1200;
	blackfield.height = 600;
	app.stage.addChild(blackfield);
}
LoaderQueue.AddImg('./img/blackfield.png');
LoaderQueue.AddFunc(setupblackfield);

//載入暫停文字
// var pausetext;

// function setuppausetext() {
// 	pausetext = new PIXI.Text('PAUSE', {
// 		fontSize: 36,
// 		fill: 0xffffff,
// 	});
// 	pausetext.x = 540;
// 	pausetext.y = 300;
// 	app.stage.addChild(pausetext);
// }


//載入開始
var startbtn;
var Isgamestart = false;
var startbtnText;

function setupstartbtn() {
	startbtn = new Sprite(resources["./img/bluebtn.png"].texture);
	let starttextture = PIXI.Texture.fromImage('./img/bluebtn.png');
	let starttextture_none = PIXI.Texture.fromImage('./img/bluedarkbtn.png');
	startbtn.width = 180;
	startbtn.height = 75;
	startbtn.y = 280;
	startbtn.x = 510;
	startbtn.buttonMode = true;
	startbtn.interactive = true;
	startbtn.on("pointerup", function () {
		startbtn.texture = starttextture;
		startevent();
	});
	startbtn.on("pointerdown", function () 
	{
		startbtn.texture = starttextture_none;
	});
	app.stage.addChild(startbtn);
	
	startbtnText = new PIXI.Text('START', white_En_big_Style);
	startbtnText.x = 565;
	startbtnText.y = 305;
	app.stage.addChild(startbtnText);
}
function removestartbtn() {
	app.stage.removeChild(startbtnText);
	app.stage.removeChild(startbtn);
}
LoaderQueue.AddFunc(setupstartbtn);

//載入鍵盤開始事件
function startbtnkeyboard() {
	let enter = keyboard(13);
	enter.press = () => {
		startevent();
	};
}
LoaderQueue.AddFunc(startbtnkeyboard);

function startevent() {
	if (!Isgamestart) {
		// if (IsOpenFullScreen)
		// {
		// 	$.confirm({
		// 		title: '是否開啟全螢幕模式?',
		// 		content: '',
		// 		buttons: {
		// 			Yes: {
		// 				text: '是',
		// 				action: function () {
		// 					OpenFullScreen();
		// 					startgame();
		// 				}
		// 			},
		// 			No: {
		// 				text: '否',
		// 				action: function () {
		// 					startgame();
		// 				}
		// 			}
		// 		}
		// 	});
		// }
		// else{
		// 	startgame();
		// }
		startgame();
	}
}

var IsOpenFullScreen = true;
function startgame() {
	app.ticker.start();
	QusetionLeftFrame.alpha = 1;
	QusetionMiddleFrame.alpha = 1;
	QusetionRightFrame.alpha = 1;
	Isgamestart = true;
	IsPause = false;
	music_bg.play();
	QusetionLeft.alpha = 1;
	QusetionMiddle.alpha = 1;
	QusetionRight.alpha = 1;
	LoaderQueue.ExecuteGame();
	removestartbtn();
	app.stage.removeChild(blackfield);
	pausebtngroups.forEach(btn => {
		btn.interactive = true;
	});
}

function DetectBroswer() {
	// CHROME
	if (navigator.userAgent.indexOf("Chrome") != -1) {

	}
	// FIREFOX
	else if (navigator.userAgent.indexOf("Firefox") != -1) {

	}
	// INTERNET EXPLORER
	else if (navigator.userAgent.indexOf("MSIE") != -1) {

	}
	// EDGE
	else if (navigator.userAgent.indexOf("Edge") != -1) {

	}
	// SAFARI
	else if (navigator.userAgent.indexOf("Safari") != -1) {
		//暫時先把iphone的全螢幕詢問關閉
		IsOpenFullScreen = false;
	}
	// OPERA
	else if (navigator.userAgent.indexOf("Opera") != -1) {

	}
	// YANDEX BROWSER
	else if (navigator.userAgent.indexOf("Opera") != -1) {

	}
	// OTHERS
	else {

	}
}

//遊戲結束設定
function FinishSetting() {
	setupbunuslightbox();
	//pausebtn.interactive = false;
	pausebtngroups.forEach(btn => {
		btn.interactive = false;
	});
	setupokaybtn();
}

//動態載入
var HeartTotal = 0;
var StarTotal = 0;
//非動態載入
var TotalSpendTime = 0;
var MainTimer;
var HeartCounts = 0;
var StarCounts = 0;
var IsPause = true;
//IsQusetionPause無暫停功能，只有區別功能，功能是當題目達對或錯的暫停間關掉按鍵事件
var IsQusetionPause = false;
var IsQuitPause = false;
var IsPlayAnime = "no";

function maincontroler() {
	if (!IsPause && IsQuitPause) {
		TotalSpendTime += app.ticker.deltaTime;
	}
	if (Isarrived) {
		IsPause = true;
		if (chooseAnswer != null)
		{
			QuestionBtnActive(false);
			//correct
			if (chooseAnswer.name == CurrentQuestion.questions[CurrentQuestion.answerNum].name) {	
				IsPlayAnime = "correct";
				sound_correct.play();
				StarCounts++;
				
				manface = "smile";
				dogface = "smile";
			}
			//wrong
			else {
				IsPlayAnime = "wrong";
				sound_wrong.play();
				HeartCounts--;
				manface = "cry";
			}
	
			//win or lose
			if (StarCounts >= StarTotal || HeartCounts <= 0) {
				loader.load(ResetupStar);
				loader.load(ResetupBlood);
				setupblackfield();
				if (StarCounts >= StarTotal) {
					PostResultToServer(1, TotalSpendTime / 10);
				}
				//lost
				else if (HeartCounts <= 0) {
					PostResultToServer(0, TotalSpendTime / 10);
				}
			} else {
				//答題暫停
				//設定取消事件貼圖
				//pausebtn.texture = pausetexture_stop;
				//題目顯示
				IsQusetionPause = true;
				setTimeout(function () {
					//題目一定要先載入完畢才能ReExecuteQueue
					QuestionList();					
				}, AnswerpauseTime);
			}
			offsetcurrent = offsetdistance;
			Isarrived = false;
			chooseAnswer = null;
		}
	}
}

(function () {
	InitialDataLoad();
	//DetectBroswer();
	//SizeFitScreen();
})();


$(window).resize(function () {
	//SizeFitScreen();
});
function OpenFullScreen() {
	if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
		if (document.cancelFullScreen) {
			document.cancelFullScreen();
		} else {
			if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else {
				if (document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen();
				}
			}
		}
	} else {
		const _element = document.documentElement;
		if (_element.requestFullscreen) {
			_element.requestFullscreen();
		} else {
			if (_element.mozRequestFullScreen) {
				_element.mozRequestFullScreen();
			} else {
				if (_element.webkitRequestFullscreen) {
					_element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
				}
			}
		}
	}
}
function CloseFullScreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	}
}

function SizeFitScreen() {
	// if ($(window).height() * 1.8 > $(window).width()) {
	// 	$('.gametable').addClass('width_main');
	// } else {
	// 	$('.gametable').removeClass('width_main');
	// }
}

function Loadgame() {
	LoaderQueue.ExecuteQueue();
	MainTimer = setInterval(function () {
		maincontroler();
	}, 100);
}

function ReLoadgame() {
	location.reload();
}

function Repeatsound() {
	if (answersound != null && answersound != undefined) {
		clearTimeout(soundtime_timer);
		IssoundPlay = true;
		answersound.play();
		soundtime_timer = setTimeout(() => {
			QuestionBtnActive(true);
			IssoundPlay = false;
		}, soundtime);
	}
}

function Exitgame() {
	location.reload();
	CloseFullScreen();
	window.history.go(-1);
}

function QuestionList() {
	if (QuestionCount + 1 == QuestionTotal){
		QuestionCount = 0;
	}else{
		QuestionCount++;
	}
	IsQusetionPause = false;
	$.when(DataChangeQuestion(DataQuestions, QuestionCount)).done(function () {
		//答題暫停結束
		//設定開啟事件貼圖
		//pausebtn.texture = pausetexture_play;

		LoaderQueue.ReExecuteQueue();
		IsPause = false;
		IsPlayAnime = "no";
		CorrectAnimeTimer = 0;
	});
}

//偵測手機翻轉
// var orientation = window.orientation;
// window.addEventListener('devicemotion', function () {
// 	if (orientation != undefined) {
// 		if (Math.abs(orientation) == 90) {
// 			$('.gametable').removeClass('slide');
// 		} else {
// 			$('.gametable').addClass('slide');
// 			if (!IsPause) {
// 				IsPause = true;
// 				setupblackfield();
// 				setuppausetext();
// 				pausebtngroups.forEach(btn => {
// 					btn.interactive = false;
// 				});
// 				app.stage.removeChild(pausebtn);
// 				setuppausebtn();
// 				music_bg.stop();
// 			}
// 		}
// 	}
// });


//偵測手機翻轉
$(document).ready(function () {
	// window.addEventListener("orientationchange", centerLoginBox);
	// window.addEventListener("load", centerLoginBox);
});

// function centerLoginBox() {
// 	if (window.orientation == 90 || window.orientation == -90) { //Landscape Mode
// 		$('.gametable').removeClass('slide');
// 	} else if (window.orientation == 0 || window.orientation == 180) { //Portrait Mode
// 		$('.gametable').addClass('slide');
// 		if (!IsPause) {
// 			IsPause = true;
// 			setupblackfield();
// 			setuppausetext();
// 			pausebtngroups.forEach(btn => {
// 				btn.interactive = false;
// 			});
// 			//app.stage.removeChild(pausebtn);
// 			setuppausebtn();
// 			music_bg.stop();
// 		}
// 	}
// }

//鍵盤函數
function keyboard(keyCode) {
	let key = {};
	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;
	//The `downHandler`
	key.downHandler = event => {
		if (event.keyCode === key.code) {
			if (key.isUp && key.press) key.press();
			key.isDown = true;
			key.isUp = false;
		}
		event.preventDefault();
	};

	//The `upHandler`
	key.upHandler = event => {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

	//Attach event listeners
	window.addEventListener(
		"keydown", key.downHandler.bind(key), false
	);
	window.addEventListener(
		"keyup", key.upHandler.bind(key), false
	);
	return key;
}


var DataObj;
function InitialDataLoad() {
	DataObj = {
		id: "",
		member_id: "",
		student_id: "",
		token: "",
		steps_id: "",
		taskitem_id: ""
	};
	LoadLoiginDataByUrl(DataObj);
	LoadGameDataByAjax(DataObj.id, DataObj.member_id, DataObj.student_id, DataObj.token, DataObj.steps_id, DataObj.taskitem_id);
}


function LoadLoiginDataByUrl(_Data) {
	let data = new URL(location.href);
	let hostname = data.hostname;
	let path = data.pathname;
	let protocol = data.protocol;
	let query = data.search;
	let params = data.searchParams;
	for (let [key, value] of params.entries()) {
		switch (key) {
			case "member_id":
				_Data.member_id = value;
				break;
			case "token":
				_Data.token = value;
				break;
			case "student_id":
				_Data.student_id = value;
				break;
			case "steps_id":
				_Data.steps_id = value;
				break;
			case "taskitem_id":
				_Data.taskitem_id = value;
				break;
		}
	}

}


//載入線上資料(Ajax)
function LoadGameDataByAjax(_id, _member_id, student_id, _token, steps_id, taskitem_id) {
	$.ajax({
		url: "https://stuapi.kidcastle.cn/Goover/getMapsStepsMedias",
		//url: "https://work.howdesign.com.tw/doggame--test/doggame_data/game_data.json",
		dataType: "json",
		async: true,
		data: {
			"id": _id,
			"member_id": _member_id,
			"student_id": student_id,
			"token": _token,
			"steps_id": steps_id
		},
		type: "GET",
		beforeSend: function () {
			//請求前的處理
		},
		success: function (data) {
			if (_member_id == "" || student_id == "" || _token == "" || steps_id == "") {
				alert('登入失敗');
			}
			else {
				$.when(initialize(data)).done(
					Loadgame()
				);
			}
			// $.when(initialize(data)).done(
			// 	Loadgame()
			// );
		},
		complete: function () {
			//請求完成的處理
		},
		error: function () {
			//請求出錯處理
			alert('伺服器連線失敗');
		}
	});
}

var PlayerAward = {
	playprice: 0,
	playclass: 0,
	totalPrice: 0
}
function PostResultToServer(_issucceed, _time) {
	$.ajax({
		url: "https://stuapi.kidcastle.cn/Goover/saveStepsLog",
		dataType: "json",
		async: true,
		data: {
			"id": DataObj.id,
			"member_id": DataObj.member_id,
			"token": DataObj.token,
			"student_id": DataObj.student_id,
			"steps_id": DataObj.steps_id,
			"issucceed": _issucceed,
			"operatetime": _time,
			"class": 0,
			"taskitem_id": DataObj.taskitem_id

		},
		type: "POST",
		beforeSend: function () {
			//請求前的處理
		},
		success: function (data) {
			PlayerAward.playprice = data.result.list.playprice;
			PlayerAward.playclass = data.result.list.playclass;
			PlayerAward.totalPrice = data.result.list.totalPrice;
			setTimeout(() => {
				FinishSetting();
			}, 1000);
		},
		complete: function () {
			//請求完成的處理
		},
		error: function () {
			//請求出錯處理
			alert('伺服器連線失敗');
		}
	});
}

var DataQuestions = [];
var QuestionTotal = 0;
var QuestionCount = 0;

//初始化資料
function initialize(data) {
	if (data != null) {
		//載入環境聲音
		music_bg = new Howl({
			src: [data.result.list.steps_sound],
			loop: true,
		});
		sound_correct = new Howl({
			src: [data.result.list.audio_true_url]
		});
		sound_wrong = new Howl({
			src: [data.result.list.audio_false_url]
		});
		sound_btn = new Howl({
			src: ['./sound/button.mp3']
		});
		sound_win = new Howl({
			src: ['./sound/win.mp3']
		});
		sound_lose = new Howl({
			src: ['./sound/lose.mp3']
		});

		//星星數 = 10		
		//載入血量
		HeartTotal = data.result.list.heart_num;
		HeartCounts = HeartTotal;
		QuestionTotal = data.result.list.question_count;
		// if (QuestionTotal < 10){
		// 	StarTotal = QuestionTotal - 2;
		// }
		// else{
		// 	StarTotal = 10;
		// }
		//StarTotal=1;
		StarTotal = QuestionTotal;

		//載入背景
		bgimg = new Sprite();
		bgimg.texture = PIXI.Texture.fromImage(data.result.list.steps_coverimg);
		bgimg.width = 1200;
		bgimg.height = 600;
		app.stage.addChild(bgimg);

		//載入題目
		data.result.list.medias.forEach(element => {
			DataQuestions.push({
				answer: element.answer,
				questions: {
					left: {
						key: element.options[0].key,
						img: element.options[0].img
					},
					center: {
						key: element.options[1].key,
						img: element.options[1].img
					},
					right: {
						key: element.options[2].key,
						img: element.options[2].img
					}
				},
				sound: new Howl({
					src: [element.question_audio]
				}),
				textimg: element.question_img
			});
			//預先載入所有圖片到LoaderQueue
			element.options.forEach(obj => {
				ImgLoadQueue(obj.img);
			});
			ImgLoadQueue(element.question_img);
		});
		//加載關卡
		DataChangeQuestion(DataQuestions, QuestionCount);
	}
}

function ImgLoadQueue(img) {
	if (!LoaderQueue.HasImg(img)) {
		LoaderQueue.AddImg(img);
	}
}


//資料結構轉換(DataQuestions >> CurrentQuestion)
//_Num代表第幾題
function DataChangeQuestion(_Data, _Num) {
	CurrentQuestion.questions[0].path = _Data[_Num].questions.left.img;
	CurrentQuestion.questions[0].name = _Data[_Num].questions.left.key;

	CurrentQuestion.questions[1].path = _Data[_Num].questions.center.img;
	CurrentQuestion.questions[1].name = _Data[_Num].questions.center.key;

	CurrentQuestion.questions[2].path = _Data[_Num].questions.right.img;
	CurrentQuestion.questions[2].name = _Data[_Num].questions.right.key;

	CurrentQuestion.sound = _Data[_Num].sound;
	CurrentQuestion.answerName = _Data[_Num].answer;
	CurrentQuestion.textimg = _Data[_Num].textimg;
	let ansNum = 0;
	switch (CurrentQuestion.answerName) {
		case 'A':
			ansNum = 0;
			break;
		case 'B':
			ansNum = 1;
			break;
		case 'C':
			ansNum = 2;
			break;
	}
	CurrentQuestion.answerNum = ansNum;
}

