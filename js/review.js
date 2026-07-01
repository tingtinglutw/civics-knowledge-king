(function () {
  "use strict";
  var lesson = Number(document.body.getAttribute("data-lesson") || 1);
  var config = window.GAME_CONFIGS && window.GAME_CONFIGS[lesson];
  var all = window.REVIEW_TERMS || [];
  var terms = [];
  var i;
  for (i = 0; i < all.length; i += 1) {
    if (all[i].lesson === lesson) terms.push(all[i]);
  }
  var root = document.getElementById("review-root");
  var key = "civicsReviewLesson" + lesson;

  function readChecked() {
    try {
      var saved = JSON.parse(localStorage.getItem(key));
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveChecked(list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  function checkedSet() {
    var list = readChecked();
    var set = {};
    for (var j = 0; j < list.length; j += 1) set[list[j]] = true;
    return set;
  }

  function toggleTerm(index) {
    var list = readChecked();
    var id = terms[index].term;
    var pos = list.indexOf(id);
    if (pos >= 0) list.splice(pos, 1);
    else list.push(id);
    saveChecked(list);
    render();
  }

  function markAll() {
    var list = [];
    for (var j = 0; j < terms.length; j += 1) list.push(terms[j].term);
    saveChecked(list);
    render();
  }

  function render() {
    if (!root) return;
    if (!config || !terms.length) {
      root.innerHTML = '<section class="result-panel"><h1>資料載入中斷</h1><p class="definition">請回首頁重新進入，或檢查 js/data.js 是否存在。</p><a class="ghost-link" href="../index.html">回首頁</a></section>';
      return;
    }
    var set = checkedSet();
    var done = Object.keys(set).length;
    var cards = "";
    for (i = 0; i < terms.length; i += 1) {
      var isDone = !!set[terms[i].term];
      cards += '<article class="term-review-card ' + (isDone ? 'checked' : '') + '"><span>' + String(i + 1).padStart(2, "0") + '</span><h2>' + terms[i].term + '</h2><p>' + terms[i].definition + '</p><button class="check-term-btn" type="button" onclick="toggleReviewTerm(' + i + ')">' + (isDone ? '已看過' : '我看過了') + '</button></article>';
    }
    root.innerHTML =
      '<header class="game-topbar"><div><p class="lesson-title">' + config.lessonTitle + '</p><h1>專有名詞</h1></div>' +
      '<div class="review-nav"><a class="secondary-btn" href="../games/lesson' + lesson + '.html">開始闖關</a><a class="ghost-link" href="../index.html">回首頁</a></div></header>' +
      '<section class="review-check-panel"><div><strong>複習章進度：' + done + ' / ' + terms.length + '</strong><p>讀完一張卡後按「我看過了」，首頁會留下紀錄。</p></div><button class="main-btn" type="button" onclick="markAllReviewTerms()">全部都看過了</button></section>' +
      '<section class="term-review-grid">' + cards + '</section>';
  }

  window.toggleReviewTerm = toggleTerm;
  window.markAllReviewTerms = markAll;
  render();
}());