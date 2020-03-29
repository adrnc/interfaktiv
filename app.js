const querySelector = document.querySelector.bind(document),
querySelectorAll = document.querySelectorAll.bind(document),
createElement = document.createElement.bind(document),
createTextNode = document.createTextNode.bind(document),

hidden = 'hidden',
content = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'],
media = ['img', 'iframe'],
addClass = (element, className = hidden) => element.classList.add(className),
removeClass = (element, className = hidden) => element.classList.remove(className),
wait = seconds => new Promise(resolve => setTimeout(resolve, seconds));

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
	topicData = await (await fetch(`/data/${topic}/source.json`)).json(),
	introduction = querySelector('.js-introduction'),
	activity = querySelector('.js-activity'),
	text = querySelector('.js-text'),
	quiz = querySelector('.js-quiz'),
	results = querySelector('.js-results'),
	sources = querySelector('.js-sources');

	while (introduction.firstChild) introduction.removeChild(introduction.firstChild);
	topicData.introduction.forEach(item => {
		const element = createElement(item[0]);
		if (content.includes(item[0])) element.innerHTML = item[1].replace(/>/gm, '</strong>').replace(/<(?!\/strong>)/gm, '<strong>');
		else if (media.includes(item[0])) {
			element.src = `/data/${topic}/${item[1]}`;
			if (item[2]) element.alt = element.title = item[2];
		}
		introduction.appendChild(element);
	});

	const contentList = createElement('ul'),
	contentItems = [
		[activity, 'Aktivität'],
		[quiz, 'Quiz'],
		[text, 'Text'],
		[sources, 'Quellen']
	];

	contentList.className = 'topics overview';
	contentItems.forEach(item => {
		const li = createElement('li'),
		button = createElement('button');

		button.dataset.anchor = `${item[0].dataset.page}${(item[0] === activity || item[0] === quiz) ? '-1' : ''}`;
		button.appendChild(createTextNode(item[1]));
		li.appendChild(button);
		contentList.appendChild(li);
	});
	buttonMap(contentList);
	introduction.appendChild(contentList);

	while (activity.firstChild) activity.removeChild(activity.firstChild);
	while (text.firstChild) text.removeChild(text.firstChild);

	let subnumber = 1;
	topicData.activity.forEach(item => {
		const subActivity = createElement('div');
		subActivity.dataset.subpage = subnumber++;
		subActivity.className = 'hidden';

		let delay = 0;
		item.forEach(subItem => {
			const element = createElement(subItem[1]);
			delay += subItem[0];

			if (content.includes(subItem[1])) element.innerHTML = subItem[2].replace(/>/gm, '</strong>').replace(/<(?!\/strong>)/gm, '<strong>');
			else if (media.includes(subItem[1])) {
				element.src = `/data/${topic}/${subItem[2]}`;
				if (subItem[3]) element.alt = element.title = subItem[3];
			}

			text.appendChild(element);

			const elementClone = element.cloneNode(true);

			elementClone.className = 'activity-animation';
			elementClone.style.animationDelay = `${delay}s`;

			subActivity.appendChild(elementClone);
		});
		
		const button = createElement('button');
		button.appendChild(createTextNode('Weiter'));
		button.className = 'activity-animation continuebutton';
		button.dataset.anchor = `aktivitaet-${subnumber}`;
		button.style.animationDelay = `${delay + 0.5}s`;

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
	lastActivity.appendChild(quizButton);
	lastActivity.appendChild(homeButton);
	activity.appendChild(lastActivity);
	buttonMap(activity);

	topicData.sources.forEach(item => {
		const p = createElement('p'),
		a = createElement('a');

		a.appendChild(createTextNode(item[0]));
		if (item[1]) a.href = item[1];

		p.appendChild(a);
		sources.appendChild(p);
	});

	history.replaceState(null, document.title, '#einfuehrung');
	pageSelect();
}


const topicList = querySelector('.js-topics'),
topics = JSON.parse(querySelector('script[type="application/json"]').innerHTML);

topics.forEach(topic => {
	const li = createElement('li'),
	button = createElement('button');

	button.appendChild(createTextNode(topic[1]));
	button.dataset.anchor = 'laden';
	button.dataset.topic = topic[0]
	button.addEventListener('click', loadTopic, false);

	li.appendChild(button);
	topicList.appendChild(li);
});

function buttonMap (document) {
	document.querySelectorAll('[data-anchor]').forEach(element => element.addEventListener('click', event => location.hash = event.currentTarget.dataset.anchor), false);
}

buttonMap(document);
history.replaceState(null, document.title, `${location.origin}${location.pathname}`);
pageSelect();
window.addEventListener('hashchange', pageSelect, false);
removeClass(querySelector('.js-main'));
