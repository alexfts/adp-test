'use strict';

(function() {

 /*
  * Helper class to load JSON
  */
	class Helpers {
		static loadJSON(callback) {   
			var req = new XMLHttpRequest();
			req.responseType = 'json';
			req.open(
				'GET',
				'https://raw.githubusercontent.com/alexfts/adp-test/master/src/quiz.json', 
				true
			);
			req.onload = function () { callback(req.response); };
			req.send(null);  
	 	}
	}

	/*
	 * Controller for the quiz game
	 */
	class GameHandler {

		constructor() {
			Helpers.loadJSON(response => {
	   			let quizzes = response.quizzes;
	   			this.game = new Game(quizzes);
	   			this.view = new GameView(this);
	   		});
		}

		startGame(quizButton) {
			let quizTitle = quizButton.innerText;
			this.game.selectedQuizQuestions = this.game.quizzes.filter(
				quiz => quiz.title === quizTitle
			)[0].questions;

			this.view.showGameView();
			this.showNextQuestion();
		}

		showNextQuestion() {
			if (!this.game.isGameOver) {
				this.view.displayNextQuestionAndScore(
					this.game.currentQuestion,
					this.game.currentAnswerOptions,
					this.game.score
				);

			} else {
				this.finishGame();
			}
		}

		handleAnswerClick(option) {
			let id = parseInt(option.id);
			let isCorrect = this.game.processAnswer(id);
			if (isCorrect) this.view.updateScore(this.game.score);

			this.view.showAnswerFeedback(option, isCorrect);
			setTimeout(this.showNextQuestion.bind(this), 2000);
		}

		finishGame() {
			let pass = this.game.didWin;
			this.view.showScoreView(
				this.game.score,
				this.game.selectedQuizQuestions.length,
				pass
			);
		}

		get quizNames() {
			return this.game.quizzes.map(({title}) => title);
		}

	}


	/*
	 * Model for the quiz game; stores quizzes and the game state
	 */
	class Game {

		constructor(quizzes) {
			this.quizzes = quizzes;
			this.selectedQuizQuestions = [];
			this.score = 0;
			this.currentQuestionIndex = 0;
		}

		get isGameOver() {
			return this.currentQuestionIndex >= this.selectedQuizQuestions.length;
		}

		get currentQuestion() {
			return this.selectedQuizQuestions[this.currentQuestionIndex].question;
		}

		get currentAnswerOptions() {
			return this.selectedQuizQuestions[this.currentQuestionIndex].answers;
		}

		processAnswer(index) {
			let answers = this.currentAnswerOptions;
			let isCorrect = answers[index].value;

			if (isCorrect) {
				this.score++;
			}
			this.currentQuestionIndex++;
			return isCorrect;
		}

		get didWin() {
			return this.score / this.selectedQuizQuestions.length > 0.5;
		}

	}

 /*
  * View class for the quiz game; manipulates the DOM
  */
	class GameView {

		constructor(handler) {
			this.handler = handler;
			this.welcomeView = document.getElementById("welcomeView");
			this.quizView = document.getElementById("quizView");
			this.scoreView = document.getElementById("scoreView");

			this.setupEventListeners();
			this.showWelcomeView();
		}

		showWelcomeView() {
			this.welcomeView.style.display = "block";
			
			let selectQuizContainer = document.getElementById('selectQuizContainer');
			for (let quizName of this.handler.quizNames) {
				let quizButton = document.createElement('button');
				quizButton.className = 'selectQuizButton';
				quizButton.innerHTML = quizName;
				selectQuizContainer.appendChild(quizButton);
			}
		}

		showGameView() {
			this.quizView.style.display = "block";
			this.welcomeView.style.display = "none";

			this.answerButtons = document.querySelectorAll(".optionButton");
		}

		showScoreView(score, total, pass) {
			this.quizView.style.display = "none";
			this.scoreView.style.display = "block";

			let finalScoreMessage = document.getElementById("finalScore");
			finalScoreMessage.innerHTML = `You scored: ${score} out of ${total}`;

			let didPassMessage = document.getElementById("didPassMessage");
			didPassMessage.innerHTML = pass ? 
				"Congratulations!" : ":( Next time!";
		}

		displayNextQuestionAndScore(currentQuestion, answers, score) {
			document.getElementById("answerFeedback").style.display = "none";
			let question = document.getElementById("question");
			question.innerHTML = currentQuestion;

			answers.forEach((answer, i) => {
				let button = this.answerButtons[i];
				button.innerHTML = answer.content;
				button.style.backgroundColor = "#f5f4ff";
			});

			this.updateScore(score);
		}

		updateScore(score) {
			document.getElementById("score").innerHTML = `Score: ${score}`;
		}

		showAnswerFeedback(button, isCorrect) {
			let answerFeedback = document.getElementById("answerFeedback");

			if (isCorrect) {
				button.style.backgroundColor = "#cefcba";
				answerFeedback.innerText = "Correct!";
				answerFeedback.style.color = "green";
			} else {
				button.style.backgroundColor = "#fcabab";
				answerFeedback.innerText = "Incorrect!";
				answerFeedback.style.color = "red";
			}

			answerFeedback.style.display = "block";
		}

		setupEventListeners() {
			let answerOptionsContainer = document.getElementById("answerOptions");
			answerOptionsContainer.addEventListener('click', e => {
				let clickedAnswer = e.target;
				if (clickedAnswer.className === "optionButton") {
					this.handler.handleAnswerClick(clickedAnswer);
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
	}

	let gameHandler;
	window.addEventListener('load', () => {
		gameHandler = new GameHandler();
	});

})();

