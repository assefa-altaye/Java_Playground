let currentProblem = "two-sum";
let currentLang = "js";

function loadProblem(name) {
  currentProblem = name;
  document.getElementById("problem-frame").src = "problems/" + name + ".html";
  changeLanguage(); // load default selected language
}

function changeLanguage() {
  const lang = document.getElementById("language-select").value;
  currentLang = lang;
  document.getElementById("solution-frame").src = `solutions/${currentProblem}-${lang}.html`;
}
