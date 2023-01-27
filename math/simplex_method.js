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
	submatrixWithGivenRows(indexes) { // will I need this?
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


class SimplexTable {
	constructor(table, basicVariables, startVariables, iteration = 0) {
		this.table = new Matrix(table);
		this.basicVariables = basicVariables;
		this.startVariables = startVariables;
		this.iteration = iteration;
	}
	B(n) {
		return this.table.matrix[n][this.table.cols-1];
	}
	D(n) {
		return this.table.matrix[this.table.rows-1][n];
	}
	d() {
		return this.table.matrix[this.table.rows-1][this.table.cols-1];
	}
	copy() {
		return (new SimplexTable(this.table.matrix, this.basicVariables, this.startVariables, this.iteration));
	}
	isPossiblePivot(row, col) {
		var zero = new Fraction(0);
		if (this.D(col).lessThan(zero)) {
			if (zero.lessThan(this.table.matrix[row][col])) {
				for (var i = 0; i < this.table.rows - 1; i++) {
					if (zero.lessThan(this.table.matrix[i][col])) {
						var t1 = this.B(i).divide(this.table.matrix[i][col]);
						var t2 = this.B(row).divide(this.table.matrix[row][col]);
						if (t1.lessThan(t2)) {
							return false;
						}
					}
				}
				return true;
			}
		}
		return false;
	}
	allPossiblePivots() {
		var t = [];
		for (var row = 0; row < this.table.rows - 1; row++) {
			for (var col = 0; col < this.table.cols - 1; col++) {
				if (this.isPossiblePivot(row, col)) {
					t.push([row, col]);
				}
			}
		}
		return t;
	}
	moveToNextIteration(row, col) {
		this.table.multiplyRow(row, this.table.matrix[row][col].invert());
		for (var i = 0; i < this.table.rows; i++) {
			if (i !== row) {
				this.table.substractMultipliedRow(i, row, this.table.matrix[i][col]);
			}
			this.basicVariables[row] = col;
			this.iteration += 1;
		}
	}
	getPlan() {
		var temp = [];
		for (var i = 0; i < this.startVariables.length; i++) {
			var index = this.basicVariables.indexOf(this.startVariables[i]);
			if (index >= 0) {
				temp.push(this.B(index));
			} else {
				temp.push(new Fraction(0));
			}
		}
		return temp;
	}
	solution() {
		var temp = this.copy();
		var listOfPivots = [];
		while (temp.allPossiblePivots().length > 0) {
			var pivot = randomChoice(temp.allPossiblePivots());
			listOfPivots.push(pivot);
			temp.moveToNextIteration(pivot[0], pivot[1]);
			alert(JSON.stringify(pivot));
		}
		return {"plan": temp.getPlan(), "objectiveValue": temp.d(), "listOfPivots": listOfPivots};
	}
	toMathML(row = undefined, col = undefined) {
		var i, j, mtd;
		var theFirstRow = [];
		var mi = new MathML("mi", textNode("T"));
		var mn = new MathML("mn", textNode(this.iteration));
		var msup = new MathML("msup", [mi, mn]);
		var cell_T = new MathML("mtd", msup, {"style": "border-right: solid; border-bottom: solid;"});
		theFirstRow.push(cell_T);
		for (i = 0; i < this.table.matrix[0].length - 1; i++) {
			var cell;
			var style = (i === col) ? "border-bottom: solid; background-color: pink;" : "border-bottom: solid;";
			cell = new MathML("mtd", Variable.defaultVariables(new Variable(i+1)), {"style": style});
			theFirstRow.push(cell);
		}
		mi = new MathML("mi", textNode("b"));
		var cell_b = new MathML("mtd", mi, {"style": "border-bottom: solid; border-left: solid;"});
		theFirstRow.push(cell_b);
		theFirstRow = new MathML("mtr", theFirstRow);
		var rows = [theFirstRow];
		for (i = 0; i < this.table.rows - 1; i++) {
			var t = Variable.defaultVariables(new Variable(this.basicVariables[i]));
			var style = (i === row) ? "border-right; solid; background-color: pink;" : "border-right: solid;";
			var cell_basicVariable = new MathML("mtd", t, {"style": style});
			var thisRow = [cell_basicVariable];
			for (j = 0; j < this.table.cols - 1; j++) {
				if (i === row || j === col) {
					mtd = new MathML("mtd", this.table.matrix[i][j].toMathML(), {"style": "background-color: pink;"});
				} else {
					mtd = new MathML("mtd", this.table.matrix[i][j].toMathML());
				}
				thisRow.push(mtd);
			}
			style = (i === row) ? "border-left: solid; background-color: pink;" : "border-left: solid;";
			mtd = new MathML("mtd", this.B(i).toMathML(), {"style": style});
			thisRow.push(mtd);
			thisRow = new MathML("mtr", thisRow);
			rows.push(thisRow);
		}
		var theLastRow = [];
        var justF = new MathML("mi", textNode("f"));
        justF = new MathML("mtd", justF, {"style": "border-right: solid; border-top: solid;"});
        theLastRow.push(justF);
		for (j = 0; j < this.table.cols - 1; j++) {
			var style = (j === col) ? "border-top: solid; background-color: pink;" : "border-top: solid;";
			var currentCell = new MathML("mtd", this.D(j).toMathML(), {"style": style});
			theLastRow.push(currentCell);
		}
		var lastCell = new MathML("mtd", this.d().toMathML(), {"style": "border-top: solid; border-left: solid;"});
		theLastRow.push(lastCell);
		theLastRow = new MathML("mtr", theLastRow);
		rows.push(theLastRow);
		var center = [];
		for (i = 0; i < this.table.cols; i++) {
			center.push("center");
		}
		center = center.join(" ");
		return (new MathML("mtable", rows, {"columnalign": center}));
	}
}
