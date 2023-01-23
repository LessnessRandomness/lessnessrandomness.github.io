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
		var objectiveAsMathML = MathML.row(this.objective.toMathML());
		var constraintsAsMathML = this.constraints.map((x) => MathML.row(x.toMathML()));
		var contents = [];
		for (var i = 0; i < constraintsAsMathML.length; i++) {
			contents.push([constraintsAsMathML[i]]);
		}
		var constraintsAsMathML = MathML.row(MathML.brackets(MathML.table(contents, false, (i) => "left"), "{", ""));
		var table = MathML.row(MathML.table([[objectiveAsMathML], [constraintsAsMathML]], true, (i) => "left"));
		return table;
	}
}

// Matrix stuff

class Matrix {
	constructor(matrix) {
		this.matrix = matrix;
		this.rows = matrix.length;
		this.cols = matrix[0].length;
	}
	copy() {
		return (new Matrix(this.matrix));
	}
	submatrixWithGivenRows(indexes) {
		var m = [];
		for (var i = 0; i < indexes.length; i++) {
			m.push(this.matrix[indexes[i]]);
		}
		return (new Matrix(m));
	}
	multiplyRow(row, k) {
		for (var i = 0; i < this.cols; i++) {
			this.matrix[row][i] = this.matrix[row][i].multiply(k);
		}
	}
	substractMultipliedRow(row1, row2, k = new Fraction(1)) {
		for (var i = 0; i < this.cols; i++) {
			this.matrix[row1][i] = this.matrix[row1][i].substract(this.matrix[row2][i].multiply(k));
		}
	}
	swapRows(row1, row2) {
		var t;
		t = this.matrix[row1];
		this.matrix[row1] = this.matrix[row2];
		this.matrix[row2] = t;
	}
    gaussEliminationPart1() {
		var currentRow = 0;
		for (var col = 0; col < this.cols; col++) {
			// find the necessary nonzero element in the column
			var nonzero = undefined;
			for (var row = currentRow; row < this.rows; row++) {
				if (!this.matrix[row][col].equalTo(new Fraction(0))) {
					nonzero = row;
					break;
				}
			}
			if (nonzero !== undefined) {
				this.swapRows(nonzero, currentRow);
				this.multiplyRow(currentRow, this.matrix[currentRow][col].invert());
				for (var i = currentRow + 1; i < this.rows; i++) {
					this.substractMultipliedRow(i, currentRow, this.matrix[i][col]);
				}
				currentRow += 1;
			}
		}
	}
	gaussEliminationPart2() {
		for (var row = this.rows - 1; row >= 0; row--) {
			var leading = undefined;
			for (var col = 0; col <= this.cols; col++) {
				if (!this.matrix[row][col].equalTo(new Fraction(0))) {
					leading = col;
					break;
				}
			}
			if (leading !== undefined) {
				for (var i = row - 1; i >= 0; i--) {
					this.substractMultipliedRow(i, row, this.matrix[i][leading]);
				}
			}
		}
	}

	toMathML() {
		var contents = [];
		for (var i = 0; i < this.rows; i++) {
			contents.push([]);
			for (var j = 0; j < this.cols; j++) {
				contents[i].push(this.matrix[i][j].toMathML())
			}
		}
		var table = MathML.table(contents, true, (x) => "center");
		return MathML.row(MathML.brackets(table, "(", ")")); 
	}
}


// SimplexTable, TODO

