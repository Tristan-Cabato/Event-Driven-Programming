const StartScreen = document.getElementById("start-screen");
const QuizScreen = document.getElementById("quiz-screen");
const ResultsScreen = document.getElementById("results-screen");
const startButton = document.getElementById("start-button");
const questionText = document.getElementById("question-text");
const homeButton = document.getElementById("home-button");
const answersContainer = document.getElementById("answers-container");
const currentQuestionSpan = document.getElementById("current-question");
const totalQuestionsSpan = document.getElementById("total-questions");
const scoreSpan = document.getElementById("score");
const finalScoreSpan = document.getElementById("final-score");
const maxScoreSpan = document.getElementById("max-score");
const resultMessage = document.getElementsByClassName("result-message")[0];
const restartButton = document.getElementById("restart-button");
const progressBar = document.getElementById("progress");

const quizQuestions = [
    {
        question: "Who serves under Darcia in Stella Sora?",
        answers: [
            { text: "Nyx", correct: false },
            { text: "Sapphire", correct: false },
            { text: "Firenze", correct: true },
            { text: "Ridge", correct: false }
        ]
    },
    {
        question: "In the 5th focus event of Mizuki Akiyama in Project SEKAI, what was her event song?",
        answers: [
            { text: "Kitty", correct: false },
            { text: "IDSMILE", correct: false },
            { text: "Give Me Your Night", correct: false },
            { text: "Lower", correct: false },
            { text: "Bake No Hana", correct: true }
        ]
    },
    {
        question: "What is the name of Aino's assistant in Genshin Impact?",
        answers: [
            { text: "Ineffa", correct: true },
            { text: "Xilonen", correct: false },
            { text: "Noelle", correct: false },
            { text: "Sandrone", correct: false }
        ]
    },
    {
        question: "Who is NOT a character in Honkai: Star Rail that is an expy of a character in Honkai Impact 3rd?",
        answers: [
            { text: "Welt Yang", correct: false },
            { text: "The Herta", correct: true },
            { text: "Kafka", correct: false },
            { text: "Natasha", correct: false }
        ]
    },
    {
        question: "Who is the least talked about Uma that raced alongside Vodka and Daiwa Scarlet in Uma Musume?",
        answers: [
            { text: "Red Desire", correct: false },
            { text: "Dream Journey", correct: false },
            { text: "Aston Macchan", correct: true },
            { text: "Special Week", correct: false }
        ]
    }
];

// Quiz State Variables
let currentQuestionIndex = 0;
let score = 0;
let answersDisabled = false;

totalQuestionsSpan.textContent = quizQuestions.length;
maxScoreSpan.textContent = quizQuestions.length;

// Event Listeners
startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", retry);
homeButton.addEventListener("click", home);

function startQuiz() {
    console.log("Quiz Button Clicked");
    currentQuestionIndex = 0;
    score = 0;
    scoreSpan.textContent = 0;

    StartScreen.classList.remove("visible");
    QuizScreen.classList.add("visible");

    showQuestion();
}

function showQuestion() {
    answersDisabled = false;

    const currentQuestion = quizQuestions[currentQuestionIndex];
    currentQuestionSpan.textContent = currentQuestionIndex + 1;

    const progressPercent = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
    progressBar.style.width = progressPercent + "%";

    questionText.textContent = currentQuestion.question;
    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.textContent = answer.text;
        button.classList.add("answers-button");

        button.dataset.correct = answer.correct;

        button.addEventListener("click", selectAnswer);

        answersContainer.appendChild(button);
    });
}

function selectAnswer(event) {
    if(answersDisabled) return;
    
    answersDisabled = true;
    const clickedButton = event.target;
    const isCorrect = clickedButton.dataset.correct === "true";

    Array.from(answersContainer.children).forEach(button => {
        console.log(button);
        if(button.dataset.correct === "true") button.classList.add("correct");
        else button.classList.add("wrong");
    });
    
    if(isCorrect) {
        score++;
        scoreSpan.textContent = score;
    }

    setTimeout(() => {
        answersContainer.innerHTML = "";
        currentQuestionIndex++;
        if(currentQuestionIndex < quizQuestions.length) { showQuestion(); }
        else { showResults(); }
    }, 700);
}

function showResults() {
    QuizScreen.classList.remove("visible");
    ResultsScreen.classList.add("visible");
    finalScoreSpan.textContent = score;
    
    const percentage = (score / quizQuestions.length) * 100;
    if(percentage >= 70) {
        resultMessage.textContent = "Goated!";
    } else if(percentage >= 50) {
        resultMessage.textContent = "Well done, you can do better!";
    } else {
        resultMessage.textContent = "Keep practicing, you will improve!";
    }
}

function retry() {
    ResultsScreen.classList.remove("visible");
    startQuiz();
}

function home() {
    ResultsScreen.classList.remove("visible");
    StartScreen.classList.add("visible");
}