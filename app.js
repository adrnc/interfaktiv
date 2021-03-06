const querySelector = document.querySelector.bind(document),
querySelectorAll = document.querySelectorAll.bind(document),
createElement = document.createElement.bind(document),
createTextNode = document.createTextNode.bind(document),

hidden = 'hidden',
addClass = (element, className = hidden) => element.classList.add(className),
removeClass = (element, className = hidden) => element.classList.remove(className),
wait = ms => new Promise(resolve => setTimeout(resolve, ms)),

data = fetch('/data.json')
	.then(response => response.json())
	.then(topics => topics.filter(topic => !topic.archived));

function pageSelect()  {
	const page = location.hash ? location.hash.substr(1).split('-') : ['index'];
	querySelectorAll(`[data-page]:not(.${hidden})`).forEach(element => addClass(element));
	removeClass(querySelector(`[data-page="${page[0]}"]`));
	if (page[1]) {
		querySelectorAll(`[data-page="${page[0]}"] > [data-subpage]:not(.${hidden})`).forEach(element => addClass(element));
		removeClass(querySelector(`[data-page="${page[0]}"] > [data-subpage="${page[1]}"]`));
	}
}

async function loadTopic(event) {
	const topic = event.currentTarget.dataset.topic,
	home = querySelector('.js-index'),
	introduction = querySelector('.js-introduction'),
	activity = querySelector('.js-activity'),
	text = querySelector('.js-text'),
	quiz = querySelector('.js-quiz'),
	results = querySelector('.js-results'),
	sources = querySelector('.js-sources');

	let topicData;
	for (let topicItem of await data) {
		if (topicItem.name == topic) {
			topicData = topicItem;
			break;
		}
	}

	while (introduction.firstChild) introduction.removeChild(introduction.firstChild);
	while (activity.firstChild) activity.removeChild(activity.firstChild);
	while (text.firstChild) text.removeChild(text.firstChild);
	while (quiz.firstChild) quiz.removeChild(quiz.firstChild);
	while (results.firstChild) results.removeChild(results.firstChild);
	while (sources.firstChild) sources.removeChild(sources.firstChild);

	const name = createElement('h1');
	name.appendChild(createTextNode(topicData.name));
	introduction.appendChild(name);

	if (topicData.author) {
		const author = createElement('h2');
		author.appendChild(createTextNode(topicData.author));
		introduction.appendChild(author);
	}

	const contentList = createElement('ul'),
	contentItems = [
		...(topicData.activity.length ? [[activity, 'Aktivität']] : []),
		...(topicData.quiz.length ? [[quiz, 'Quiz']] : []),
		...(topicData.activity.length ? [[text, 'Text']] : []),
		...(topicData.sources.length ? [[sources, 'Quellen']] : []),
		[home, 'Zurück zur Übersicht']
	];

	contentList.className = 'topics overview';
	contentItems.forEach(item => {
		const li = createElement('li'),
		button = createElement('button');
		if (item[0] === activity) button.className = 'mainbutton';

		button.dataset.anchor = item[0] === home ? '' : `${item[0].dataset.page}${(item[0] === activity || item[0] === quiz) ? '-1' : ''}`;
		button.appendChild(createTextNode(item[1]));
		li.appendChild(button);
		contentList.appendChild(li);
	});
	buttonMap(contentList);
	introduction.appendChild(contentList);

	let subnumber = 1;
	topicData.activity.forEach(item => {
		const subActivity = createElement('div');
		subActivity.dataset.subpage = subnumber++;
		subActivity.className = 'hidden';

		let delay = 0,
		currentDelay = delay,
		count = 0;
		[
			item.title,
			...(item.subtitle ? [item.subtitle] : []),
			...item.text.split(/^\s*$/gm)
		].forEach(subItem => {
			subItem = subItem.trim();
			const isImg = subItem.match(/^https?:\/\//g),
			tag = item.section && count == 0 ? 'h1' : count == 0 || (count == 1 && item.section && item.subtitle) ? 'h2' : isImg ? 'img' : 'p',
			isValidImg = isImg && tag != 'h1' && tag != 'h2',
			element = createElement(tag);

			currentDelay = delay;
			delay += isValidImg ? 300 : subItem.length * (count == 0 ? 40 : 20);
			count++;

			if (isValidImg) {
				element.src = subItem;
				element.setAttribute('aria-hidden', 'true');
			}
			else element.innerHTML = subItem.replace(/>/gm, '</strong>').replace(/<(?!\/strong>)/gm, '<strong>');

			text.appendChild(element);

			const elementClone = element.cloneNode(true);

			elementClone.className = 'activity-animation';
			elementClone.style.animationDelay = `${currentDelay + 500}ms`;

			subActivity.appendChild(elementClone);
		});

		const button = createElement('button'),
		skipSpan = createElement('span'),
		continueSpan = createElement('span'),
		delayOffset = currentDelay + 800;

		skipSpan.className = 'skipspan';
		continueSpan.className = 'continuespan';
		skipSpan.appendChild(createTextNode('Überspringen'));
		continueSpan.appendChild(createTextNode('Weiter'));
		skipSpan.style.animationDelay = `${delayOffset}ms`;
		continueSpan.style.animationDelay = `${delayOffset}ms`;

		button.setAttribute('data-ignore', '');
		button.appendChild(skipSpan);
		button.appendChild(continueSpan);
		button.className = 'continuebutton button-animation';
		button.dataset.anchor = `aktivitaet-${subnumber}`;

		button.addEventListener('click', async event => {
			if (getComputedStyle(skipSpan).visibility == 'visible') {
				addClass(subActivity, 'skip-animation');
				await wait(delayOffset);
				removeClass(subActivity, 'skip-animation');
			}
			else buttonClick(event);
		}, false);

		subActivity.appendChild(button);
		activity.appendChild(subActivity);
	});

	const lastActivity = createElement('div'),
	whatNext = createElement('h2'),
	quizButton = createElement('button'),
	homeButton = createElement('button');

	quizButton.dataset.anchor = 'quiz-1';
	homeButton.dataset.anchor = 'einfuehrung';

	lastActivity.dataset.subpage = subnumber;
	lastActivity.className = 'activity-animation hidden';
	quizButton.className = 'mainbutton';

	whatNext.appendChild(createTextNode('Was nun?'));
	quizButton.appendChild(createTextNode('Mach das Quiz'));
	homeButton.appendChild(createTextNode('Zurück zum Start'));

	lastActivity.appendChild(whatNext);
	if (topicData.quiz.length) lastActivity.appendChild(quizButton);
	lastActivity.appendChild(homeButton);
	activity.appendChild(lastActivity);
	buttonMap(activity);

	subnumber = 1;
	topicData.quiz.forEach(item => {
		const subActivity = createElement('div'),
		question = createElement('h2'),
		questionList = createElement('p'),
		answer = createElement('h2'),
		answerList = createElement('p');

		addClass(questionList, 'answerwidth');
		addClass(answerList, 'answerwidth');

		subActivity.dataset.subpage = subnumber++;
		addClass(subActivity, 'activity-animation');
		question.appendChild(createTextNode(item.question));
		answer.appendChild(createTextNode(item.question));

		const continueButton = createElement('button');
		continueButton.appendChild(createTextNode('Weiter'));
		continueButton.className = 'js-continue continuebutton invisiblebutton';
		continueButton.dataset.anchor = topicData.quiz.length + 1 == subnumber ? 'ergebnisse' : `quiz-${subnumber}`;
		continueButton.disabled = true;
		
		let choice = 1;
		item.answers.forEach(response => {
			const button = createElement('button'),
			answerButton = createElement('button');

			button.dataset.choice = choice;
			button.dataset.correct = response.correct;
			answerButton.dataset.choice = choice++;

			button.appendChild(createTextNode(response.text));
			answerButton.appendChild(createTextNode(response.text));
			questionList.appendChild(button);
			answerList.appendChild(answerButton);

			addClass(answerButton, response.correct ? 'correctanswer' : 'wronganswer');

			button.addEventListener('click', event => {
				event.currentTarget.parentElement.querySelectorAll('.selectedbutton').forEach(element => removeClass(element, 'selectedbutton'));
				continueButton.disabled = false;
				removeClass(continueButton, 'invisiblebutton');
				addClass(event.currentTarget, 'selectedbutton');

				answerList.querySelectorAll('.correctchoice, .wrongchoice').forEach(element => {
					removeClass(element, 'correctchoice');
					removeClass(element, 'wrongchoice');
				});

				addClass(answerList.querySelector(`[data-choice="${event.currentTarget.dataset.choice}"]`), event.currentTarget.dataset.correct == 'true' ? 'correctchoice' : 'wrongchoice');
			}, false);
		});

		subActivity.appendChild(question);
		subActivity.appendChild(questionList);
		subActivity.appendChild(continueButton);
		results.appendChild(answer);
		results.appendChild(answerList);

		quiz.appendChild(subActivity);
	});
	buttonMap(quiz);

	const resultsHead = createElement('h1'),
	quizBack = createElement('button');

	resultsHead.appendChild(createTextNode('Ergebnisse'));
	quizBack.dataset.anchor = 'einfuehrung';
	quizBack.appendChild(createTextNode('Zurück zum Start'));
	quizBack.style.width = 'auto';
	results.insertBefore(resultsHead, results.firstChild);
	results.appendChild(quizBack);
	buttonMap(results);

	topicData.sources.forEach(item => {
		const p = createElement('p'),
		a = createElement('a');

		a.appendChild(createTextNode(item.text));
		if (item.url) {
			a.href = item.url;
			a.target = '_blank';
			a.rel = 'noopener norefferer';
		}

		p.appendChild(a);
		sources.appendChild(p);
	});

	history.pushState(null, document.title, '#einfuehrung');
	pageSelect();
}


const topicList = querySelector('.js-topics');

data.then(topics => topics.forEach(topic => {
	const li = createElement('li'),
	button = createElement('button');

	button.appendChild(createTextNode(topic.name));
	button.dataset.topic = topic.name;
	button.addEventListener('click', loadTopic, false);

	li.appendChild(button);
	topicList.appendChild(li);
}));

function buttonMap (document) {
	document.querySelectorAll('[data-anchor]:not([data-ignore])').forEach(element => element.addEventListener('click', buttonClick, false));
}

function buttonClick(event) {
	location.hash = event.currentTarget.dataset.anchor;
}

buttonMap(document);
history.replaceState(null, document.title, `${location.origin}${location.pathname}`);
window.addEventListener('hashchange', pageSelect, false);
data.then(pageSelect);
