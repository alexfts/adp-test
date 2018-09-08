'use strict';

let helpers = {
	loadJSON: function(callback) {   
		var req = new XMLHttpRequest();
        req.overrideMimeType("application/json");
    	req.open(
    		'GET', 
    		'https://raw.githubusercontent.com/alexfts/adp-test/master/src/quiz.json', 
    		true
    	);
    	req.onreadystatechange = function () {
    		if (req.readyState == 4 && req.status == "200") {
            	callback(req.responseText);
          	}
    	};
    	req.send(null);  
 	}
};


/*
 * Main class
 */
class Game {

	constructor(quizzes) {
		this.quizzes = quizzes;
		this.currentQuiz = quizzes[0]; // FIXIT
		this.score = 0;
		this.nextQuestion = 0;
	}

	gameOver() {
		return this.nextQuestion >= this.currentQuiz.questions.length;
	}

	getNextQuestionAndAnswers() {
		return this.currentQuiz.questions[this.nextQuestion];
	}

	processAnswer(index) {
		let answers = this.getNextQuestionAndAnswers().answers;
		let isCorrect = answers[index].value;
		if (isCorrect) {
			this.score++;
		}
		this.nextQuestion++;
		return isCorrect;
	}

}

class GameHandler {
	constructor() {
		helpers.loadJSON(response => {
   			let quizzes = JSON.parse(response).quizzes;
   			this.game = new Game(quizzes);
   			this.view = new GameView(this);
   		});
	}

	showNextQuestionAndScore() {
		if (!this.game.gameOver()) {
			this.view.displayNextQuestionAndScore(
				this.game.getNextQuestionAndAnswers(),
				this.game.score
			);
		} else {
			this.finishGame();
		}
	}

	handleSelectedAnswer(option) {
		let id = parseInt(option.id);
		let isCorrect = this.game.processAnswer(id);
		// TODO highlight if the answer is correct
		if (isCorrect) {
			this.view.updateScore(this.game.score);
		}
		this.showNextQuestionAndScore();
	}

	startGame(quizButton) {
		let quizIndex = parseInt(quizButton.id[quizButton.id.length-1]);
		this.game.currentQuiz = this.game.quizzes[quizIndex];
		this.view.showGameView();
		this.showNextQuestionAndScore();
	}

	finishGame() {
		let pass = this.game.score / this.game.currentQuiz.questions.length >= 0.5;
		this.view.showScoreView(
			this.game.score, 
			pass
		);
	}

	get numberOfAvailableQuizzes() {
		return this.game.quizzes.length;
	}

}

class GameView {
	constructor(handler) {
		this.handler = handler;
		this.welcomeView = document.getElementById("welcomeView");
		this.quizView = document.getElementById("quizView");
		this.scoreView = document.getElementById("scoreView");
		this.showWelcomeView();
		this.setupEventListeners();
	}

	showWelcomeView() {
		this.quizView.style.display = "none";
		this.scoreView.style.display = "none";
		let selectQuizContainer = document.getElementById('selectQuizContainer');
		for (let i = 0; i < this.handler.numberOfAvailableQuizzes; i++) {
			let quizButton = document.createElement('button');
			quizButton.id = `quiz${i}`;
			quizButton.className = 'selectQuizButton';
			quizButton.innerHTML = `Quiz ${i + 1}`;
			selectQuizContainer.appendChild(quizButton);
		}

	}

	showGameView() {
		this.quizView.style.display = "block";
		this.welcomeView.style.display = "none";
	}

	showScoreView(score, pass) {
		this.quizView.style.display = "none";
		this.scoreView.style.display = "block";
		let finalScoreMessage = document.getElementById("finalScore");
		finalScoreMessage.innerHTML = `You scored: ${score}`;

		let didPassMessage = document.getElementById("didPassMessage");
		didPassMessage.innerHTML = pass ? 
			"Congratulations!" : ":( Next time!";
	}

	displayNextQuestionAndScore(questionAndAnswers, score) {
		console.log(questionAndAnswers, score);
		let question = document.getElementById("question");
		question.innerHTML = questionAndAnswers.question;

		questionAndAnswers.answers.forEach((answer, i) => {
			let button = document.getElementById(`${i}`);
			button.innerHTML = answer.content;
		});

		this.updateScore(score);
	}

	setupEventListeners() {
		let answerOptionsContainer = document.getElementById("answerOptions");
		answerOptionsContainer.addEventListener('click', e => {
			let clickedOption = e.target;
			if (clickedOption.className === "optionButton") {
				this.handler.handleSelectedAnswer(clickedOption);
			}
		});

		let selectQuizContainer = document.getElementById("selectQuizContainer");
		selectQuizContainer.addEventListener('click', e => {
			let selectedQuizButton = e.target;
			if (selectedQuizButton.className === "selectQuizButton") {
				this.handler.startGame(selectedQuizButton);
			}
		});
	}

	updateScore(score) {
		document.getElementById("score").innerHTML = `Score: ${score}`;
	}
}

let gameHandler;
window.addEventListener('load', () => {
	gameHandler = new GameHandler();
});

