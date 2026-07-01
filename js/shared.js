(function () {
  "use strict";

  const lesson = Number(document.body.dataset.lesson || 1);
  const config = window.GAME_CONFIGS[lesson];
  const bank = window.CIVICS_TERMS.filter((item) => item.lesson === lesson);

  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let correctCount = 0;
  let wrongItems = [];
  let answered = false;
  let selectedTerm = null;
  let matchedTerms = new Set();
  let validationPair = null;
  let pairCodes = {};

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function titleFor(percent) {
    if (percent <= 40) return config.titles[0];
    if (percent <= 70) return config.titles[1];
    return config.titles[2];
  }

  function sampleTerms(answer) {
    const avoid = new Set(answer.avoid || []);
    const distractors = bank.filter((item) => item.term !== answer.term && !avoid.has(item.term));
    return shuffle([answer.term, ...shuffle(distractors).slice(0, 3).map((item) => item.term)]);
  }

  function sampleDefinitions(answer) {
    return shuffle([answer.definition, ...shuffle(bank.filter((item) => item.term !== answer.term)).slice(0, 3).map((item) => item.definition)]);
  }

  function buildShell() {
    const root = document.getElementById("game-root");
    root.innerHTML = `
      <header class="game-topbar">
        <div>
          <p class="lesson-title">${config.lessonTitle}</p>
          <h1>${config.gameTitle}</h1>
        </div>
        <a class="ghost-link" href="../index.html">回首頁</a>
      </header>
      <section class="game-layout" id="game-view">
        <aside class="side-panel">
          <p class="eyebrow">使用題庫：第 ${lesson} 課｜10 個專有名詞</p>
          <p class="howto">${config.instructions}</p>
          <div class="hud">
            <div>分數<strong id="score">0</strong></div>
            <div>進度<strong id="counter">0 / 10</strong></div>
          </div>
          <div class="progress-shell" aria-label="進度"><div class="progress-bar" id="progress"></div></div>
          <div class="visual-zone" id="visual-zone"></div>
        </aside>
        <section class="play-panel">
          <div id="start-screen">
            <div class="question-card">
              <h2>${config.role}</h2>
              <p class="definition">${config.startText}</p>
            </div>
            <div class="action-row"><button class="main-btn" type="button" onclick="startGame()">開始遊戲</button></div>
          </div>
          <div id="question-screen" class="hidden">
            <div class="question-meta" id="question-meta"></div>
            <div class="question-card" id="question-card"></div>
            <div id="play-area"></div>
            <div class="feedback" id="feedback">請依照畫面任務完成名詞與定義配對。</div>
            <div class="action-row"><button id="next-btn" class="main-btn hidden" type="button" onclick="nextQuestion()">下一題</button></div>
          </div>
        </section>
      </section>
      <section class="result-panel hidden" id="result-view"></section>
    `;
    renderVisual();
  }

  function startGame() {
    questions = shuffle(bank).slice(0, 10);
    pairCodes = {};
    for (let i = 0; i < questions.length; i += 1) {
      pairCodes[questions[i].term] = i;
    }
    currentIndex = 0;
    score = 0;
    correctCount = 0;
    wrongItems = [];
    answered = false;
    selectedTerm = null;
    matchedTerms = new Set();
    validationPair = null;
    document.getElementById("result-view").classList.add("hidden");
    document.getElementById("game-view").classList.remove("hidden");
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("question-screen").classList.remove("hidden");
    renderQuestion();
  }

  function progressDone() {
    if (config.mode === "match-board") return matchedTerms.size;
    return currentIndex + (answered ? 1 : 0);
  }

  function updateHud() {
    const total = questions.length || 10;
    const done = Math.min(progressDone(), total);
    document.getElementById("score").textContent = score;
    document.getElementById("counter").textContent = `${done} / ${total}`;
    document.getElementById("progress").style.width = `${Math.round((done / total) * 100)}%`;
  }

  function renderVisual() {
    const zone = document.getElementById("visual-zone");
    if (!zone) return;
    if (lesson === 1) {
      zone.innerHTML = `<div class="route-track">${Array.from({ length: 10 }, (_, i) => `<span class="${i < correctCount ? "done" : ""}">${i + 1}</span>`).join("")}</div><div class="zone-pill">公民權利路線圖</div>`;
      return;
    }
    if (lesson === 2) {
      const items = questions.length ? questions : bank;
      zone.innerHTML = `<div class="map-board">${items.slice(0, 10).map((item) => `<span class="${matchedTerms.has(item.term) ? "done" : ""}">${item.category}</span>`).join("")}</div>`;
      return;
    }
    if (lesson === 3) {
      zone.innerHTML = `<div class="diagnosis-grid">${["觀察", "判讀", "診斷", "報告"].map((step, i) => `<span class="${correctCount > i * 2 ? "done" : ""}">${step}</span>`).join("")}</div>`;
      return;
    }
    if (lesson === 4) {
      zone.innerHTML = `<div class="ballot-stack">${Array.from({ length: 10 }, (_, i) => `<span class="${i < correctCount ? "done" : ""}"></span>`).join("")}</div><div class="zone-pill">驗票正確數</div>`;
      return;
    }
    if (lesson === 5) {
      zone.innerHTML = `<div class="evidence-board">${Array.from({ length: Math.max(correctCount, 1) }, (_, i) => `<span>${i < correctCount ? "證據" : "等待線索"}</span>`).join("")}</div>`;
      return;
    }
    const lastWrong = wrongItems.length ? wrongItems[wrongItems.length - 1] : null;
    const tilt = answered && lastWrong && lastWrong.round === currentIndex ? "-9deg" : "0deg";
    zone.innerHTML = `<div class="balance" style="--tilt:${tilt}"><div class="beam"></div></div><div class="zone-pill">正義天平配對中</div>`;
  }

  function renderQuestion() {
    answered = false;
    selectedTerm = null;
    validationPair = null;
    document.getElementById("feedback").className = "feedback";
    document.getElementById("feedback").textContent = config.promptText;
    document.getElementById("next-btn").classList.add("hidden");
    document.getElementById("question-meta").innerHTML = `<span class="chip">${config.roundLabel}</span><span class="chip">${config.focus}</span>`;
    if (config.mode === "match-board") renderMatchBoard();
    if (config.mode === "definition-choice") renderDefinitionChoice();
    if (config.mode === "term-choice") renderTermChoice();
    if (config.mode === "pair-validation") renderPairValidation();
    if (config.mode === "detective") renderDetective();
    if (config.mode === "scale-match") renderScaleMatch();
    updateHud();
    renderVisual();
  }

  function renderMatchBoard() {
    document.getElementById("question-card").innerHTML = `<h2>把 10 張名詞卡配到正確定義</h2><p class="definition">先點左邊名詞，再點右邊定義。配對成功會鎖定，配錯會留下錯題紀錄。</p>`;
    document.getElementById("play-area").innerHTML = `
      <div class="match-board">
        <div><h3>名詞卡</h3><div class="card-list">${shuffle(questions).map((item) => `<button class="mini-card term-card" data-code="${String.fromCharCode(65 + pairCodes[item.term])}" data-term="${escapeHtml(item.term)}" type="button" onclick="selectTerm('${encodeURIComponent(item.term)}')">${item.term}</button>`).join("")}</div></div>
        <div><h3>定義卡</h3><div class="card-list">${shuffle(questions).map((item) => `<button class="mini-card def-card" data-code="${String.fromCharCode(65 + pairCodes[item.term])}" data-term="${escapeHtml(item.term)}" type="button" onclick="selectDefinition('${encodeURIComponent(item.term)}')">${item.definition}</button>`).join("")}</div></div>
      </div>`;
  }

  function selectTerm(encodedTerm) {
    if (config.mode !== "match-board") return;
    const term = decodeURIComponent(encodedTerm);
    if (matchedTerms.has(term)) return;
    selectedTerm = term;
    document.querySelectorAll(".term-card").forEach((button) => {
      button.classList.toggle("active", button.dataset.term === term);
    });
  }

  function selectDefinition(encodedTerm) {
    if (config.mode !== "match-board" || !selectedTerm) return;
    const definitionTerm = decodeURIComponent(encodedTerm);
    const termItem = questions.find((item) => item.term === selectedTerm);
    const defItem = questions.find((item) => item.term === definitionTerm);
    const feedback = document.getElementById("feedback");
    if (selectedTerm === definitionTerm) {
      matchedTerms.add(selectedTerm);
      correctCount += 1;
      score += 10;
      feedback.className = "feedback good";
      feedback.innerHTML = `<strong>配對成功：${termItem.term}</strong><br>${termItem.explanation}`;
      document.querySelectorAll("[data-term]").forEach((button) => {
        if (button.dataset.term === selectedTerm) {
          button.disabled = true;
          button.classList.add("correct");
          button.classList.add("matched-pair");
          button.classList.add("pair-" + pairCodes[selectedTerm]);
          button.setAttribute("aria-label", "已配對 " + button.dataset.code + " " + selectedTerm);
        }
      });
    } else {
      wrongItems.push(Object.assign({}, termItem, { selected: defItem.definition, correctAnswer: termItem.definition, round: matchedTerms.size }));
      feedback.className = "feedback bad";
      feedback.innerHTML = `<strong>${termItem.term} 沒有配到正確定義。</strong><br>正確定義：${termItem.definition}`;
    }
    selectedTerm = null;
    document.querySelectorAll(".term-card").forEach((button) => button.classList.remove("active"));
    updateHud();
    renderVisual();
    if (matchedTerms.size === questions.length) showResult();
  }

  function renderDefinitionChoice() {
    const item = questions[currentIndex];
    document.getElementById("question-card").innerHTML = `<h2>${item.term}</h2><p class="definition">${config.cardHint}</p>`;
    document.getElementById("play-area").innerHTML = `<div class="map-options">${sampleDefinitions(item).map((option) => `<button class="option-btn" type="button" onclick="checkAnswer('${encodeURIComponent(option)}')">${option}</button>`).join("")}</div>`;
  }

  function renderTermChoice() {
    const item = questions[currentIndex];
    document.getElementById("question-card").innerHTML = `<h2 class="small-prompt">${config.questionLead}</h2><p class="definition big-definition">${item.definition}</p>`;
    document.getElementById("play-area").innerHTML = `<div class="options">${sampleTerms(item).map((option) => `<button class="option-btn" type="button" onclick="checkAnswer('${encodeURIComponent(option)}')">${option}</button>`).join("")}</div>`;
  }

  function renderPairValidation() {
    const item = questions[currentIndex];
    const shouldMatch = Math.random() > 0.45;
    const shownDefinition = shouldMatch ? item.definition : shuffle(bank.filter((candidate) => candidate.term !== item.term))[0].definition;
    validationPair = { item, shownDefinition, shouldMatch };
    document.getElementById("question-card").innerHTML = `<h2>${item.term}</h2><p class="definition">${shownDefinition}</p>`;
    document.getElementById("play-area").innerHTML = `<div class="ballot-choice"><button class="option-btn" type="button" onclick="checkValidation(true)">配對正確</button><button class="option-btn" type="button" onclick="checkValidation(false)">配對錯誤</button></div>`;
  }

  function renderDetective() {
    const item = questions[currentIndex];
    document.getElementById("question-card").innerHTML = `<h2 class="small-prompt">線索 ${currentIndex + 1}</h2><p class="definition big-definition">${item.definition}</p>`;
    document.getElementById("play-area").innerHTML = `<div class="evidence-options">${sampleTerms(item).map((option, i) => `<button class="evidence-card" type="button" onclick="checkAnswer('${encodeURIComponent(option)}')"><span>證物 ${i + 1}</span>${option}</button>`).join("")}</div>`;
  }

  function renderScaleMatch() {
    const item = questions[currentIndex];
    document.getElementById("question-card").innerHTML = `<h2>左盤名詞：${item.term}</h2><p class="definition">請把右盤放上相符的定義。</p>`;
    document.getElementById("play-area").innerHTML = `<div class="scale-options">${sampleDefinitions(item).map((option) => `<button class="option-btn" type="button" onclick="checkAnswer('${encodeURIComponent(option)}')">${option}</button>`).join("")}</div>`;
  }

  function expectedAnswer(item) {
    return ["definition-choice", "scale-match"].includes(config.mode) ? item.definition : item.term;
  }

  function checkAnswer(encodedOption) {
    if (answered) return;
    answered = true;
    const selected = decodeURIComponent(encodedOption);
    const item = questions[currentIndex];
    finishRound(selected === expectedAnswer(item), selected, expectedAnswer(item), item);
  }

  function checkValidation(userSaysMatch) {
    if (answered || !validationPair) return;
    answered = true;
    const item = validationPair.item;
    const shouldMatch = validationPair.shouldMatch;
    const shownDefinition = validationPair.shownDefinition;
    const selected = userSaysMatch ? "配對正確" : "配對錯誤";
    const correctAnswer = shouldMatch ? "配對正確" : "配對錯誤";
    finishRound(userSaysMatch === shouldMatch, selected, correctAnswer, item, shownDefinition);
  }

  function finishRound(isCorrect, selected, correctAnswer, item, shownDefinition = "") {
    const feedback = document.getElementById("feedback");
    document.querySelectorAll("button.option-btn, button.evidence-card").forEach((button) => {
      button.disabled = true;
      if (button.textContent.trim() === correctAnswer || button.textContent.includes(correctAnswer)) button.classList.add("correct");
      if ((button.textContent.trim() === selected || button.textContent.includes(selected)) && !isCorrect) button.classList.add("wrong");
    });
    if (isCorrect) {
      correctCount += 1;
      score += 10;
      matchedTerms.add(item.term);
      feedback.className = "feedback good";
      feedback.innerHTML = `<strong>${config.correctText}</strong><br>${item.term}：${item.definition}<br>${item.explanation}`;
    } else {
      wrongItems.push(Object.assign({}, item, { selected: shownDefinition || selected, correctAnswer: config.mode === "pair-validation" ? `${item.term}：${item.definition}` : correctAnswer, round: currentIndex }));
      feedback.className = "feedback bad";
      feedback.innerHTML = `<strong>正確配對：${item.term}</strong><br>${item.definition}<br>${item.explanation}`;
    }
    document.getElementById("next-btn").classList.remove("hidden");
    updateHud();
    renderVisual();
  }

  function nextQuestion() {
    currentIndex += 1;
    if (currentIndex >= questions.length) {
      showResult();
      return;
    }
    renderQuestion();
  }

  function showResult() {
    const total = questions.length || 10;
    const percent = Math.round((correctCount / total) * 100);
    const passed = correctCount >= 8;
    try {
      const key = "civicsGameLesson" + lesson;
      const old = JSON.parse(localStorage.getItem(key) || "{}");
      const oldBest = Number(old.bestCorrect || 0);
      localStorage.setItem(key, JSON.stringify({
        bestCorrect: Math.max(oldBest, correctCount),
        bestPercent: Math.max(Number(old.bestPercent || 0), percent),
        passed: Boolean(old.passed || passed),
        lastCorrect: correctCount,
        lastPercent: percent,
        updatedAt: new Date().toLocaleString("zh-TW")
      }));
    } catch (error) {}
    document.getElementById("game-view").classList.add("hidden");
    const result = document.getElementById("result-view");
    const uniqueMistakes = [];
    const seen = new Set();
    wrongItems.forEach((item) => {
      if (!seen.has(item.term)) {
        uniqueMistakes.push(item);
        seen.add(item.term);
      }
    });
    const mistakes = uniqueMistakes.length
      ? uniqueMistakes.map((item) => `<div class="mistake-item"><strong>${item.term}</strong><br>正確定義：${item.definition}<br>本題提醒：${item.explanation}</div>`).join("")
      : `<div class="mistake-item"><strong>本次沒有錯題。</strong><br>10 個名詞都配對成功，可以挑戰重新開始確認熟練度。</div>`;
    result.innerHTML = `
      <p class="lesson-title">${config.lessonTitle}</p>
      <h1>${config.reportTitle}</h1>
      <div class="result-stats">
        <div class="stat-card">總分<strong>${percent}</strong></div>
        <div class="stat-card">正確題數<strong>${correctCount}</strong></div>
        <div class="stat-card">錯誤名詞<strong>${uniqueMistakes.length}</strong></div>
      </div>
      <div class="question-card result-status ${passed ? "passed" : "failed"}"><h2>${passed ? "挑戰成功" : "未達標，請重新挑戰"}</h2><p class="definition">答對 ${correctCount} / ${total} 題。8 題以上為挑戰成功。${config.resultText}</p><h3>學習稱號：${titleFor(percent)}</h3></div>
      <h2>錯題整理</h2>
      <div class="mistake-list">${mistakes}</div>
      <div class="action-row"><button class="main-btn" type="button" onclick="startGame()">重新開始</button><a class="secondary-btn" href="../index.html">回首頁</a></div>
    `;
    result.classList.remove("hidden");
  }

  window.shuffle = shuffle;
  window.startGame = startGame;
  window.renderQuestion = renderQuestion;
  window.checkAnswer = checkAnswer;
  window.nextQuestion = nextQuestion;
  window.showResult = showResult;
  window.selectTerm = selectTerm;
  window.selectDefinition = selectDefinition;
  window.checkValidation = checkValidation;

  document.addEventListener("DOMContentLoaded", buildShell);
}());