(function () {
  "use strict";

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function lessonTotal(lesson) {
    var list = window.REVIEW_TERMS || [];
    var count = 0;
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].lesson === lesson) count += 1;
    }
    return count;
  }

  function render() {
    for (var lesson = 1; lesson <= 6; lesson += 1) {
      var el = document.querySelector('[data-progress="' + lesson + '"]');
      if (!el) continue;
      var review = readJSON("civicsReviewLesson" + lesson, []);
      var game = readJSON("civicsGameLesson" + lesson, { bestCorrect: 0, passed: false });
      var total = lessonTotal(lesson);
      var reviewDone = Array.isArray(review) ? review.length : 0;
      var passedText = game.passed ? "挑戰成功" : "尚未過關";
      var passedClass = game.passed ? "ok" : "wait";
      el.innerHTML =
        '<div class="progress-pill"><span>複習章</span><strong>' + reviewDone + ' / ' + total + '</strong></div>' +
        '<div class="progress-pill ' + passedClass + '"><span>闖關紀錄</span><strong>' + (game.bestCorrect || 0) + ' / 10｜' + passedText + '</strong></div>';
    }
  }

  render();
}());