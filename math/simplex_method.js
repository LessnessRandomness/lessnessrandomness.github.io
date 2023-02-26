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
		var t = [];
		for (var i = 0; i < this.coeffs.length; i++) {
			t.push(this.coeffs[i]);
		}
		return (new LinearExpression(t));
	}
	opposite() {
		return (new LinearExpression(this.coeffs.map((x) => x.opposite())));
	}
	replaceVariableWithDifference(n) {
		var newCoeffs = [];
		for (var i = 0; i < this.coeffs.length; i++) {
			newCoeffs.push(this.coeffs[i]);
		}
		newCoeffs.push(this.coeffs[n].opposite());
		return (new LinearExpression(newCoeffs));
	}
	toMathML(namingScheme = Variable.defaultVariables) {
		var exp = new Expression();
		for (var i = 0; i < this.coeffs.length; i++) {
			var variable = new Expression(new Variable(i));
			var term = variable.multiply(this.coeffs[i]);
			exp = exp.add(term);
		}
		return exp.toMathML(namingScheme);
	}
}

//

class LinearObjective {
	constructor(linexp, maximise = true) {
		this.linexp = linexp;
		this.maximise = maximise;
	}
	copy() {
		return new LinearObjective(this.linexp.copy(), this.maximise);
	}
	replaceVariableWithDifference(n) {
		return (new LinearObjective(this.linexp.replaceVariableWithDifference(n), this.maximise));
	}
	opposite() {
		var t = this.copy();
		t.linexp = this.linexp.opposite();
		t.maximise = !this.maximise;
		return t;
	}
	toMathML() {
		var m = (this.linexp.toMathML());
		var arrow = new MathML("mo", textNode("→"));
		m.push(arrow);
		var mi = new MathML("mi", textNode(this.maximise ? "max" : "min"));
		m.push(mi);
		return m;
	}
}

// LinearConstraint

class LinearConstraint {
	constructor(linexp, b, sign = "le") {
		this.linexp = linexp;
		this.b = b;
		this.sign = sign;
	}
	copy() {
		return new LinearConstraint(this.linexp.copy(), this.b, this.sign);
	}
	revertSign() {
		var t = this.copy();
		if (t.sign !== "eq") {
			t.linexp = t.linexp.opposite();
			t.b = t.b.opposite();
			t.sign = (t.sign === "le") ? "ge" : "le";
		}
		return t;
	}
	equalityIntoTwoInequalities() {
		if (this.sign === "eq") {
			var c1 = new LinearConstraint(this.linexp, this.b, "le");
			var c2 = new LinearConstraint(this.linexp.opposite(), this.b.opposite(), "le");
			return [c1, c2];
		}
	}
	replaceVariableWithDifference(n) {
		return (new LinearConstraint(this.linexp.replaceVariableWithDifference(n), this.b, this.sign));
	}
	// for 2D case (two variables)
	intersection(other) {
		var a11 = this.linexp.coeffs[0], a12 = this.linexp.coeffs[1], b1 = this.b;
		var a21 = other.linexp.coeffs[0], a22 = other.linexp.coeffs[1], b2 = other.b;
		var delta = a11.multiply(a22).add(a12.multiply(a21));
		if (delta.equalTo(new Fraction(0))) {
			return undefined;
		} else {
			var deltaX = b1.multiply(a22).add(a12.multiply(b2));
			var deltaY = a11.multiply(b2).add(b1.multiply(a21));
			return [deltaX.divide(delta), deltaY.divide(delta)];
		}
	}
	pointSatisfies(coords) {
		var value = new Fraction(0);
		for (var i = 0; i < this.linexp.coeffs.length; i++) {
			value = value.add(this.linexp.coeffs[i].multiply(coords[i]));
		}
		if (this.sign === "eq") {
			return value.equalTo(this.b);
		}
		if (this.sign === "le") {
			return value.lessOrEqual(this.b);
		}
		if (this.sign === "ge") {
			return this.b.lessOrEqual(value);
		}
	}
	toMathML() {
		var m = this.linexp.toMathML();
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

// Matrix stuff

class Matrix {
	constructor(matrix) {
		this.matrix = matrix;
		this.rows = matrix.length;
		this.cols = matrix[0].length;
	}
	copy() {
		var m = [];
		for (var i = 0; i < this.rows; i++) {
			var r = [];
			for (var j = 0; j < this.cols; j++) {
				r.push(this.matrix[i][j]);
			}
			m.push(r);
		}
		return (new Matrix(m));
	}
	removeColumn(col) {
		var m = [];
		for (var i = 0; i < this.rows; i++) {
			var r = [];
			for (var j = 0; j < this.cols; j++) {
				if (j !== col) {
					r.push(this.matrix[i][j]);
				}
			}
			m.push(r);
		}
		this.matrix = m;
		this.cols -= 1;
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
				contents[i].push(this.matrix[i][j].toMathML());
			}
		}
		var table = MathML.table(contents, true, (x) => "center");
		return MathML.row(MathML.brackets(table, "(", ")")); 
	}
}

class SimplexTable {
	constructor(table, objective, basicVariables, startVariables, artificialVariables = [], iteration = 0) {
		this.table = new Matrix(table);
		this.objective = objective;
		this.basicVariables = basicVariables;
		this.startVariables = startVariables;
		this.artificialVariables = artificialVariables;
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
		var bV = [];
		for (var i = 0; i < this.basicVariables.length; i++) {
			bV.push(this.basicVariables[i]);
		}
		return (new SimplexTable(this.table.copy().matrix, this.objective, bV, this.startVariables, this.artificialVariables, this.iteration));
	}
	removeColumn(i) {
		this.table.removeColumn(i);
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
	colsWithNegativeD() {
		var cols = [];
		for (var col = 0; col < this.table.cols - 1; col++) {
			if (this.D(col).lessThan(new Fraction(0))) {
				cols.push(col);
			}
		}
		return cols;
	}
	allPossiblePivots() {
		var t = [];
		var cols = this.colsWithNegativeD();
		if (cols.length > 0) {
			for (var row = 0; row < this.table.rows - 1; row++) {
				for (var i = 0; i < cols.length; i++) {
					var col = cols[i];
					if (this.isPossiblePivot(row, col)) {
						t.push([row, col]);
					}
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
		}
		this.basicVariables[row] = col;
		this.iteration += 1;

	}
	getPlan() {
		var temp = [];
		for (var i = 0; i < this.startVariables.length; i++) {
			var index = this.basicVariables.indexOf(this.startVariables[i]);
			if (index > -1) {
				temp.push(this.B(index));
			} else {
				temp.push(new Fraction(0));
			}
		}
		return temp;
	}
	solution() {
		var temp = this.copy();
		var s = {};
		s["phaseI"] = {};
		s["phaseII"] = {};
		// Phase 1
		s["phaseI"]["rowsToSubstract"] = [];
		for (var i = 0; i < temp.artificialVariables.length; i++) {
			var index = temp.basicVariables.indexOf(temp.artificialVariables[i]);
			if (index > -1) {
				temp.table.substractMultipliedRow(temp.table.rows-1, index);
				s["phaseI"]["rowsToSubstract"].push(index);
			}
		}
		s["phaseI"]["listOfPivots"] = [];
		while (temp.allPossiblePivots().length > 0) {
			var pivot = randomChoice(temp.allPossiblePivots());
			s["phaseI"]["listOfPivots"].push(pivot);
			temp.moveToNextIteration(pivot[0], pivot[1]);
		}
		s["phaseI"]["success"] = (temp.d().lessThan(new Fraction(0)));
		if (temp.d().lessThan(new Fraction(0))) {
			s["phaseI"]["success"] = false;
			return s;
		} else {
			s["phaseI"]["success"] = true;
			s["phaseI"]["resultingPlan"] = temp.getPlan();
		}
		// Phase 2
		s["phaseII"]["columnsToRemove"] = [];
		for (var i = 0; i < temp.table.cols; i++) {
			if (temp.artificialVariables.indexOf(i) > -1) {
				s["phaseII"]["columnsToRemove"].push(i);
				temp.removeColumn(i);
			}
		}
		temp.artificialVariables = [];
		for (var i = 0; i < temp.table.cols; i++) {
			if (i < temp.objective.linexp.coeffs.length) {
				temp.table.matrix[temp.table.rows-1][i] = temp.objective.linexp.coeffs[i].opposite();
			} else {
				temp.table.matrix[temp.table.rows-1][i] = new Fraction(0);
			}
		}
		s["phaseII"]["rowsToSubstract"] = [];
		for (var i = 0; i < temp.objective.linexp.coeffs.length; i++) {
			var index = temp.basicVariables.indexOf(i);
			if (index > -1) {
				var k = temp.D(i);
				temp.table.substractMultipliedRow(temp.table.rows-1, index, k);
				s["phaseII"]["rowsToSubstract"].push([index, k]);
			}
		}
		s["phaseII"]["listOfPivots"] = []
		while (temp.allPossiblePivots().length > 0) {
			var pivot = randomChoice(temp.allPossiblePivots());
			s["phaseII"]["listOfPivots"].push(pivot);
			temp.moveToNextIteration(pivot[0], pivot[1]);
		}
		if (temp.colsWithNegativeD().length > 0) {
			s["phaseII"]["success"] = false;
			return s;
		} else {
			s["phaseII"]["success"] = true;
			s["phaseII"]["resultingPlan"] = temp.getPlan();
			s["phaseII"]["objectiveValue"] = temp.d();
			return s;
		}
	}
	toMathML(row = undefined, col = undefined) {
		var i, j, mtd;
		var theFirstRow = [];
		var mi = new MathML("mi", textNode("T"));
		var mn = new MathML("mn", textNode(this.iteration));
		var msup = new MathML("msup", [mi, mn]);
		var cell_T = new MathML("mtd", msup, {"style": "border-right: solid; border-bottom: solid;"});
		theFirstRow.push(cell_T);
		for (i = 0; i < this.table.cols - 1; i++) {
			var cell;
			var style = (i === col) ? "border-bottom: solid; background-color: pink;" : "border-bottom: solid;";
			cell = new MathML("mtd", Variable.defaultVariables(new Variable(i)), {"style": style});
			theFirstRow.push(cell);
		}
		mi = new MathML("mi", textNode("b"));
		var cell_b = new MathML("mtd", mi, {"style": "border-bottom: solid; border-left: solid;"});
		theFirstRow.push(cell_b);
		theFirstRow = new MathML("mtr", theFirstRow);
		var rows = [theFirstRow];
		for (i = 0; i < this.table.rows - 1; i++) {
			var t = Variable.defaultVariables(new Variable(this.basicVariables[i]));
			var style = (i === row) ? "border-right: solid; background-color: pink;" : "border-right: solid;";
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


// Polytope (or simply lots of linear constraints)

class Polytope {
	constructor(constraints, nonnegativeVariables = []) {
		this.constraints = constraints; // nonempty array of LinearConstraint
		this.nonnegativeVariables = nonnegativeVariables; // array
	}
	copy() {
		var t = [];
		for (var i = 0; i < this.constraints.length; i++) {
			t.push(this.constraints[i].copy());
		}
		return (new Polytope(t, this.nonnegativeVariables));
	}
	hasPoint(coords) {
		for (var i = 0; i < this.constraints.length; i++) {
			if (!this.constraints[i].pointSatisfies(coords)) {
				return false;
			}
		}
		for (var i = 0; i < this.nonnegativeVariables.length; i++) {
			if (coords[this.nonnegativeVariables[i]].lessThan(new Fraction(0))) {
				return false;
			}
		}
		return true;
	}
	// for 2D case (two variables)
	allVertices() {
		var constraints = this.copy().constraints;
		if (this.nonnegativeVariables.indexOf(0) > -1) {
			constraints.push(new LinearConstraint(new LinearExpression([new Fraction(1), new Fraction(0)]), new Fraction(0), "ge"));
		}
		if (this.nonnegativeVariables.indexOf(1) > -1) {
			constraints.push(new LinearConstraint(new LinearExpression([new Fraction(0), new Fraction(1)]), new Fraction(0), "ge"));
		}
		alert("constraints: " + JSON.stringify(constraints));
		var vertices = [];
		for (var i = 0; i < constraints.length; i++) {
			for (var j = i + 1;j < constraints.length; j++) {
				var intersectionPoint = constraints[i].intersection(constraints[j]);
				if (intersectionPoint !== undefined) {
					if (this.hasPoint(intersectionPoint)) {
						vertices.push(intersectionPoint);
					}
				}
			}
		}
		return vertices;
	}
	toMathML() {
		var contents = this.constraints.map((x) => [MathML.row(x.toMathML())]);
		var numberOfVariables = this.constraints[0].linexp.coeffs.length;
		var nonnegativityConstraints = [];
		if (this.nonnegativeVariables.length > 0) {
			var b = true;
			var nonnegative = [];
			for (i = 0; i < this.nonnegativeVariables.length; i++) {
				if (b) {
					b = false;
				} else {
					nonnegative.push(new MathML("mo", textNode(",")));
				}
				nonnegative = nonnegative.concat(Variable.defaultVariables(new Variable(this.nonnegativeVariables[i])));
			}
			nonnegative.push(new MathML("mo", textNode("\u2265"))); // &ge;
			nonnegative = nonnegative.concat((new Fraction(0)).toMathML());
			contents.push([MathML.row(nonnegative)]);
		}
		var contentsAsMathML = MathML.row(MathML.brackets(MathML.table(contents, false, (i) => "left"), "{", ""));
		return contentsAsMathML;
	}
}

// LinearProgrammingProblem

class LinearProgrammingProblem {
	constructor(objective, constraints, nonnegativeVariables, integerVariables = []) {
		this.objective = objective; // LinearObjective
		this.polytope = new Polytope(constraints, nonnegativeVariables); // Polytope
		this.integerVariables = integerVariables.sort();
	}
	copy() {
		return (new LinearProgrammingProblem(this.objective.copy(), this.polytope.copy(), this.nonnegativeVariables, this.integerVariables));
	}
	canonicalForm() {
		var newObjective = (this.objective.maximise) ? this.objective.copy() : this.objective.opposite();
		var newConstraints = [];
		for (var i = 0; i < this.polytope.constraints.length; i++) {
			if (this.polytope.constraints[i].sign === "le") {
				newConstraints.push(this.polytope.constraints[i].copy());
			}
			if (this.polytope.constraints[i].sign === "ge") {
				newConstraints.push(this.polytope.constraints[i].revertSign());
			}
			if (this.polytope.constraints[i].sign === "eq") {
				var pair = this.polytope.constraints[i].equalityIntoTwoInequalities();
				newConstraints.push(pair[0]);
				newConstraints.push(pair[1]);
			}
		}
		var newIntegerVariables = this.integerVariables;
		for (var i = 0; i < this.objective.linexp.coeffs.length; i++) {
			if (this.polytope.nonnegativeVariables.indexOf(i) < 0) {
				newObjective = newObjective.replaceVariableWithDifference(i);
				for (var j = 0; j < newConstraints.length; j++) {
					newConstraints[j] = newConstraints[j].replaceVariableWithDifference(i);
				}
				newIntegerVariables.push(newObjective.linexp.coeffs.length);
			}
		}
		var newNonnegativeVariables = [];
		for (var i = 0; i < newObjective.linexp.coeffs.length; i++) {
			newNonnegativeVariables.push(i);
		}
		return (new LinearProgrammingProblem(newObjective, newConstraints, newNonnegativeVariables, newIntegerVariables))
	}
	// for Linear Programming Problems without integer variables
	toSimplexTable() {
		var t = this.canonicalForm();
		var matrix = [], artificialVariables = [];
		var numberOfVariables = t.polytope.constraints[0].linexp.coeffs.length;
		var numberOfInequalities = t.polytope.constraints.length;
		var numberOfArtificialVariables = 0;
		for (var i = 0; i < t.polytope.constraints.length; i++) {
			if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				artificialVariables.push(numberOfInequalities + numberOfVariables + numberOfArtificialVariables);
				numberOfArtificialVariables += 1;
			}
		}
		for (var i = 0; i < numberOfInequalities; i++) {
			var row = t.polytope.constraints[i].linexp.copy().coeffs;
			for (var j = 0; j < numberOfInequalities + numberOfArtificialVariables; j++) {
				if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
					for (var k = 0; k < numberOfVariables; k++) {
						row[k] = row[k].opposite();
					}
					if (i === j) {
						row.push(new Fraction(-1));
					} else {
						if (artificialVariables.indexOf(j+numberOfVariables) > -1) {
							row.push(new Fraction(1));
						} else {
							row.push(new Fraction(0));
						}
					}
				} else {
					if (i === j) {
						row.push(new Fraction(1));
					} else {
						row.push(new Fraction(0));
					}
				}
			}
			if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				row.push(t.polytope.constraints[i].b.opposite());
			} else {
				row.push(t.polytope.constraints[i].b);
			}
			matrix.push(row);
		}
		var lastRow = [];
		for (var i = 0; i < numberOfVariables; i++) {
			lastRow.push(new Fraction(0));
		}
		for (var i = 0; i < numberOfInequalities; i++) {
			lastRow.push(new Fraction(0));
		}
		for (var i = 0; i < numberOfArtificialVariables; i++) {
			lastRow.push(new Fraction(1));
		}
		lastRow.push(new Fraction(0));
		matrix.push(lastRow);		
		var basicVariables = [];
		var currentArtificialVariable = 0;
		for (var i = 0; i < numberOfInequalities; i++) {
			if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				basicVariables.push(numberOfVariables + numberOfInequalities + currentArtificialVariable);
				currentArtificialVariable += 1;
			} else {
				basicVariables.push(numberOfVariables + i);
			}
		}
		var startVariables = [];
		for (var i = 0; i < numberOfVariables; i++) {
			startVariables.push(i);
		}
		return (new SimplexTable(matrix, t.objective, basicVariables, startVariables, artificialVariables));
	}
	toMathML() {
		var i, j;
		var objectiveAsMathML = MathML.row(this.objective.toMathML());
		var contents = this.polytope.constraints.map((x) => [MathML.row(x.toMathML())]);
		var numberOfVariables = this.objective.linexp.coeffs.length;
		var nonnegativityConstraints = [];
		if (this.polytope.nonnegativeVariables.length > 0) {
			var b = true;
			var nonnegative = [];
			for (i = 0; i < this.polytope.nonnegativeVariables.length; i++) {
				if (b) {
					b = false;
				} else {
					nonnegative.push(new MathML("mo", textNode(",")));
				}
				nonnegative = nonnegative.concat(Variable.defaultVariables(new Variable(this.polytope.nonnegativeVariables[i])));
			}
			nonnegative.push(new MathML("mo", textNode("\u2265"))); // &ge;
			nonnegative = nonnegative.concat((new Fraction(0)).toMathML());
			contents.push([MathML.row(nonnegative)]);
		}
		if (this.integerVariables.length > 0) {
			var b = true;
			var integers = [];
			for (i = 0; i < this.integerVariables.length; i++) {
                if (b) {
                    b = false;
                } else {
                    integers.push(new MathML("mo", textNode(",")));
                }
                integers = integers.concat(Variable.defaultVariables(new Variable(this.integerVariables[i])));
            }
            integers.push(new MathML("mo", textNode("\u2208"))); // &isin;
            integers.push(new MathML("mi", textNode("\u2124"), {"mathvariant": "normal"})); // &integers;
			contents.push([MathML.row(integers)]);
		}
		var contentsAsMathML = MathML.row(MathML.brackets(MathML.table(contents, false, (i) => "left"), "{", ""));
		var table = MathML.row(MathML.table([[objectiveAsMathML], [contentsAsMathML]], true, (i) => "left"));
		return table;
	}
}

// 2d polytopes and 2d linear programming

function unitVector(numberOfDimensions, i) {
	var t = [];
	for (var j = 0; j < numberOfDimensions; j++) {
		if (j === i) {
			t.push(new Fraction(1));
		} else {
			t.push(new Fraction(0));
		}
	}
	return t;
}

Polytope.prototype.information = function() {
	var inf = {}, t = [];
	var numberOfVariables = this.constraints[0].linexp.coeffs.length;
	for (var i = 0; i < numberOfVariables; i++) {
		t.push(new Fraction(0));
	}
	var objective = new LinearObjective(new LinearExpression(t));
	var problem = new LinearProgrammingProblem(objective, this.constraints, this.nonnegativeVariables);
	var solution = problem.toSimplexTable().solution();
	if (solution["phaseI"]["success"]) {
		inf["nonempty"] = true;
		inf["bounded"] = true;
		inf["boundaries"] = [];
		for (var i = 0; i < numberOfVariables; i++) {
			t = [];
			var linexp = new LinearExpression(unitVector(numberOfVariables, i));
			objective = new LinearObjective(linexp);
			problem = new LinearProgrammingProblem(objective, this.constraints, this.nonnegativeVariables);
			solution = problem.toSimplexTable().solution();
			if (solution["phaseII"]["success"]) {
				t.push(solution["phaseII"]["objectiveValue"]);
			} else {
				t.push(undefined);
				inf["bounded"] = false;
			}
			objective = new LinearObjective(linexp.opposite());
			problem = new LinearProgrammingProblem(objective, this.constraints, this.nonnegativeVariables);
			solution = problem.toSimplexTable().solution();
			if (solution["phaseII"]["success"]) {
				t.push(solution["phaseII"]["objectiveValue"]);
			} else {
				t.push(undefined);
				inf["bounded"] = false;
			}
			inf["boundaries"].push(t);
		}
		return inf;
	} else {
		inf["nonempty"] = false;
		return inf;
	}
}

	