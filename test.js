JSON.stringify(x.map(x => {
	x.activity = x.activity.map(a => {
		a.text = a.elements.join('\n');
		delete a.elements;
		return a;
	});
	return x;
}), null, '\t');
