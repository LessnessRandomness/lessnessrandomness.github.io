// Randomness stuff

var randomChoice = function(a) {
    return a[Math.floor(Math.random() * a.length)];
};

var randomInt = function(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
};

var randomIntWithFilter = function(a, b, criteria) {
    var r = randomInt(a, b);
    while (!criteria(r)) {
        r = randomInt(a, b);
    }
    return r;
};

var randomVector = function(size, a, b) {
	var v = [];
	for (var i = 0; i < size; i++) {
		v[i] = randomInt(a, b);
	}
	return v;
}

var randomMatrix = function(rows, cols, a, b) {
	var m = [];
	for (var i = 0; i < rows; i++) {
		m[i] = randomVector(cols, a, b);
	}
	return m;
}

// LinearExpression

class LinearExpression {
	constructor(coeffs) {
		this.coeffs = coeffs;
	}
	copy() {
		return new LinearExpression(this.coeffs);
	}
	opposite() {
		var copy = this.copy();
		for (var i = 0; i < copy.coeffs.length; i++) {
			copy.coeffs[i] = copy.coeffs[i].multiply(-1n);
		}
		return copy;
	}
	toMathML(namingScheme = Variable.defaultVariables) {
		var exp = new Expression();
		for (var i = 0; i < this.coeffs.length; i++) {
			var variable = new Expression(new Variable(i+1));
			var term = variable.multiply(this.coeffs[i]);
			exp = exp.add(term);
		}
		return exp.toMathML();
	}
}

//

class LinearObjective {
	constructor(coeffs, maximise = true) {
		this.coeffs = coeffs;
		this.maximise = maximise;
	}
	copy() {
		return new LinearObjective(this.coeffs, this.maximise);
	}
	opposite() {
		var t = this.copy();
		t.coeffs = t.coeffs.map((x) => x.opposite());
		return t;
	}
	toMathML() {
		var m = (new LinearExpression(this.coeffs).toMathML());
		var arrow = new MathML("mo", textNode("→"));
		m.push(arrow);
		var mi = new MathML("mi", textNode(this.maximise ? "max" : "min"));
		m.push(mi);
		return m;
	}
}

// LinearConstraint

class LinearConstraint {
	constructor(coeffs, b, sign = "le") {
		this.coeffs = coeffs;
		this.b = b;
		this.sign = sign;
	}
	copy() {
		return new LinearConstraint(this.coeffs, this.b, this.sign);
	}
	revertSign() {
		var t = this.copy();
		if (t.sign !== "eq") {
			t.coeffs = t.coeffs.map((x) => x.opposite());
			t.b = t.b.opposite();
			t.sign = (t.sign === "le") ? "ge" : "le";
		}
		return t;
	}
	toMathML() {
		var m = (new LinearExpression(this.coeffs)).toMathML();
		var mo;
		if (this.sign === "le") {
			mo = new MathML("mo", textNode("\u2264")); // &le;
		}
		if (this.sign === "eq") {
			mo = new MathML("mo", textNode("="));
		}
		if (this.sign === "ge") {
			mo = new MathML("mo", textNode("\u2265")); // &ge;
		}
		m.push(mo);
		m = m.concat(this.b.toMathML());
		return m;
	}
}

// LinearProgrammingProblem

class LinearProgrammingProblem {
	constructor(objective, constraints) {
		this.objective = objective;
		this.constraints = constraints;
	}
	toMathML() {
		
	}
}
