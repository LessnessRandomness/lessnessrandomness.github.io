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
	toMathML(namingScheme = Variable.defaultVariables) {
		var m = (this.linexp.toMathML(namingScheme));
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
		var delta = a11.multiply(a22).substract(a12.multiply(a21));
		if (delta.equalTo(new Fraction(0))) {
			return undefined;
		} else {
			var deltaX = b1.multiply(a22).substract(a12.multiply(b2));
			var deltaY = a11.multiply(b2).substract(b1.multiply(a21));
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
	toMathML(namingScheme = Variable.defaultVariables) {
		var m = this.linexp.toMathML(namingScheme);
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
		var bV = [], sV = [], aV = [];
		for (var i = 0; i < this.basicVariables.length; i++) {
			bV.push(this.basicVariables[i]);
		}
		for (var i = 0; i < this.startVariables.length; i++) {
			sV.push(this.startVariables[i]);
		}
		for (var i = 0; i < this.artificialVariables.length; i++) {
			aV.push(this.artificialVariables[i]);
		}
		return (new SimplexTable(this.table.copy().matrix, this.objective.copy(), bV, sV, aV, this.iteration));
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
		for (var i = 0; i < temp.table.cols - 1; i++) {
			if (temp.artificialVariables.indexOf(i) > -1) {
				s["phaseII"]["columnsToRemove"].push(i);
			}
		}
		for (var i = temp.artificialVariables.length - 1; i >= 0; i--) {
			temp.removeColumn(temp.artificialVariables[i]);
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
		for (var i = 0; i < temp.table.cols-1; i++) {
			var index = temp.basicVariables.indexOf(i);
			if (index > -1) {
				var k = temp.D(i);
				if (!k.equalTo(new Fraction(0))) {
					temp.table.substractMultipliedRow(temp.table.rows-1, index, k);
					s["phaseII"]["rowsToSubstract"].push([index, k]);
				}
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
		var aV = this.artificialVariables;
		var variableNames = function(v) {
			var index = aV.indexOf(v.variable);
			if (index >= 0) {
				var a = new MathML("mi", textNode("A"));
				var i = new MathML("mn", textNode(index + 1));
				return (new MathML("msub", [a, i]));
			} else {
				var a = new MathML("mi", textNode("x"));
				var i = new MathML("mn", textNode(v.variable + 1));
				return (new MathML("msub", [a, i]));
			}
		};
		
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
			cell = new MathML("mtd", variableNames(new Variable(i)), {"style": style});
			theFirstRow.push(cell);
		}
		mi = new MathML("mi", textNode("b"));
		var cell_b = new MathML("mtd", mi, {"style": "border-bottom: solid; border-left: solid;"});
		theFirstRow.push(cell_b);
		theFirstRow = new MathML("mtr", theFirstRow);
		var rows = [theFirstRow];
		for (i = 0; i < this.table.rows - 1; i++) {
			var t = variableNames(new Variable(this.basicVariables[i]));
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
		var t = [], nV = [];
		for (var i = 0; i < this.constraints.length; i++) {
			t.push(this.constraints[i].copy());
		}
		for (var i = 0; i < this.nonnegativeVariables.length; i++) {
			nV.push(this.nonnegativeVariables[i]);
		}
		return (new Polytope(t, nV));
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
		var vertices = [];
		for (var i = 0; i < constraints.length; i++) {
			for (var j = i + 1; j < constraints.length; j++) {
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
	// constructor(objective, polytope, integerVariables = [], artificialVariables = []) {
		// this.objective = objective;
		// this.polytope = polytope;
		// this.integerVariables = integerVariables.sort();
		// this.artificialVariables = artificialVariables;
	// }
	constructor(objective, constraints, nonnegativeVariables = [], integerVariables = [], artificialVariables = []) {
		this.objective = objective; // LinearObjective
		this.polytope = new Polytope(constraints, nonnegativeVariables); // Polytope
		this.integerVariables = integerVariables.sort();
		this.artificialVariables = artificialVariables;
	}
	copy() {
		var nV = [], iV = [], aV = [];
		for (var i = 0; i < this.polytope.nonnegativeVariables.length; i++) {
			nV.push(this.polytope.nonnegativeVariables[i]);
		}
		for (var i = 0; i < this.integerVariables.length; i++) {
			iV.push(this.integerVariables[i]);
		}
		for (var i = 0; i < this.artificialVariables.length; i++) {
			aV.push(this.artificialVariables[i]);
		}
		return (new LinearProgrammingProblem(this.objective.copy(), this.polytope.copy().constraints, nV, iV, aV));
	}
	alreadyInCanonicalForm() {
		if (!this.objective.maximise) {
			return false;
		}
		for (var i = 0; i < this.objective.linexp.coeffs.length; i++) {
			if (this.polytope.nonnegativeVariables.indexOf(i) < 0) {
				return false;
			}
		}
		for (var i = 0; i < this.polytope.constraints.length; i++) {
			if (this.polytope.constraints[i].sign !== "le") {
				return false;
			}
		}
		return true;
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
		var transformations = [];
		for (var i = 0; i < this.objective.linexp.coeffs.length; i++) {
			if (this.polytope.nonnegativeVariables.indexOf(i) < 0) {
				var t = [i];
				newObjective = newObjective.replaceVariableWithDifference(i);
				t.push(i);
				t.push(newObjective.linexp.coeffs.length - 1);
				transformations.push(t);
				for (var j = 0; j < newConstraints.length; j++) {
					newConstraints[j] = newConstraints[j].replaceVariableWithDifference(i);
				}
				if (this.integerVariables.indexOf(i) > -1) {
					newIntegerVariables.push(newObjective.linexp.coeffs.length);
				}
			}
		}
		var newNonnegativeVariables = [];
		for (var i = 0; i < newObjective.linexp.coeffs.length; i++) {
			newNonnegativeVariables.push(i);
		}
		var artificialVariables = [];
		for (var i = 0; i < this.artificialVariables.length; i++) {
			artificialVariables.push(this.artificialVariables[i]);
		}
		return [new LinearProgrammingProblem(newObjective, newConstraints, newNonnegativeVariables, newIntegerVariables, artificialVariables), transformations];
	}
	// for Linear Programming Problems without integer variables
	toSimplexTable() {
		var t = this.canonicalForm()[0];
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
		var currentArtificialVariable = 0;
		for (var i = 0; i < numberOfInequalities; i++) {
			var row;
			if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				row = t.polytope.constraints[i].linexp.opposite().coeffs;
			} else {
				row = t.polytope.constraints[i].linexp.copy().coeffs;
			}
			for (var j = 0; j < numberOfInequalities + numberOfArtificialVariables; j++) {
				if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
					if (i === j) {
						row.push(new Fraction(-1));
					} else {
						if (j === numberOfInequalities + currentArtificialVariable) {
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
				currentArtificialVariable += 1;
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
		var aV = this.artificialVariables;
		var variableNames = function(v) {
			var index = aV.indexOf(v.variable);
			if (index > -1) {
				var a = new MathML("mi", textNode("A"));
				var i = new MathML("mn", textNode(index + 1));
				return (new MathML("msub", [a, i]));
			} else {
				var a = new MathML("mi", textNode("x"));
				var i = new MathML("mn", textNode(v.variable + 1));
				return (new MathML("msub", [a, i]));
			}
		};
		var i, j;
		var objectiveAsMathML = MathML.row(this.objective.toMathML(variableNames));
		var contents = [];
		var contents = this.polytope.constraints.map((x) => [MathML.row(x.toMathML(variableNames))]);
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
				nonnegative = nonnegative.concat(variableNames(new Variable(this.polytope.nonnegativeVariables[i])));
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
                integers = integers.concat(variableNames(new Variable(this.integerVariables[i])));
            }
            integers.push(new MathML("mo", textNode("\u2208"))); // &isin;
            integers.push(new MathML("mi", textNode("\u2124"), {"mathvariant": "normal"})); // &integers;
			contents.push([MathML.row(integers)]);
		}
		var contentsAsMathML = MathML.row(MathML.brackets(MathML.table(contents, false, (i) => "left"), "{", ""));
		var table = MathML.row(MathML.table([[objectiveAsMathML], [contentsAsMathML]], true, (i) => "left"));
		return table;
	}
	solution(place, language = "LV") {
		var paragraph;
		paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Dots šāds lineārās programmēšanas uzdevums:"));
		paragraph.appendChild(document.createElement("br"));
		paragraph.appendChild(MathML.done(this.toMathML()));
		place.appendChild(paragraph);
		var canonicalForm, transformations = [];
		var isMinProblem = !this.objective.maximise;
		paragraph = document.createElement("p");
		if (this.alreadyInCanonicalForm()) {
			paragraph.appendChild(textNode("Šis LPU jau ir kanoniskajā formā, tāpēc nekas nav jāpārveido."));
			place.appendChild(paragraph);
			canonicalForm = this.copy();
		} else {
			var t = this.canonicalForm();
			canonicalForm = t[0];
			transformations = t[1];
			var hasTransformations = (transformations.length > 0);
			if (hasTransformations) {
				if (transformations.length > 1) {
					paragraph.appendChild(textNode("Ir mainīgie bez nenegativitātes nosacījumiem. Katru no tiem aizvietosim ar divu nenegatīvu mainīgo starpību: "));
				} else {
					paragraph.appendChild(textNode("Ir mainīgais bez nenegativitātes nosacījuma. To aizvietosim ar divu nenegatīvu mainīgo starpību: "));
				}
				for (var i = 0; i < transformations.length; i++) {
					var oldVariable = transformations[i][0], newVariableOne = transformations[i][1], newVariableTwo = transformations[i][2];
					paragraph.appendChild(MathML.done(Variable.defaultVariables(new Variable(oldVariable))));
					paragraph.appendChild(textNode(" tiks aizvietots ar "));
					var difference = new Expression();
					newVariableOne = new Expression(new Variable(newVariableOne));
					difference = difference.add(newVariableOne);
					newVariableTwo = new Expression(new Variable(newVariableTwo));
					difference = difference.add(newVariableTwo.multiply(new Fraction(-1)));
					paragraph.appendChild(MathML.done(MathML.row(difference.toMathML())));
					if (i < transformations.length - 1) {
						paragraph.appendChild(textNode(", "));
					} else {
						paragraph.appendChild(textNode("."));
					}
				}
			}
			paragraph.appendChild(document.createElement("br"));
			paragraph.appendChild(textNode("Pārveidojot sākotnējo LPU kanoniskā formā, iegūstam:"));
			paragraph.appendChild(document.createElement("br"));
			paragraph.appendChild(MathML.done(canonicalForm.toMathML()));
			place.appendChild(paragraph);
		}
		var hasPhaseI = false;
		for (var i = 0; i < canonicalForm.polytope.constraints.length; i++) {
			if (canonicalForm.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				hasPhaseI = true;
			}
		}
		var simplexTable = this.toSimplexTable();
		var solution = simplexTable.solution();
		if (hasPhaseI) {
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Redzams, ka šim LPU ir jārisina palīgproblēma. Izveidojam tabulu:"));
			paragraph.appendChild(document.createElement("br"));
			paragraph.appendChild(MathML.done(simplexTable.toMathML()));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Atņemam no tabulas pēdējās rindas visas rindas, kuras atbilst mākslīgajiem mainīgiem. "));
			var rowsToSubstract = solution["phaseI"]["rowsToSubstract"];
			if (rowsToSubstract.length === 1) {
				paragraph.appendChild(textNode("Tas ir, atņemam no pēdējās rindas " + (rowsToSubstract[0] + 1).toString() + ". rindu. Iegūstam šādu tabulu:"));
			} else {
				paragraph.appendChild(textNode("Tas ir, atņemam no pēdējās rindas " + (rowsToSubstract[0] + 1).toString() + "."));
				for (var i = 1; i < rowsToSubstract.length - 1; i++) {
					paragraph.appendChild(textNode(", " + (rowsToSubstract[i] + 1).toString() + "."));
				}
				paragraph.appendChild(textNode(" un " + (rowsToSubstract[rowsToSubstract.length - 1] + 1).toString() + ". rindu. Iegūstam šādu tabulu:"));
			}
			for (var i = 0; i < solution["phaseI"]["rowsToSubstract"].length; i++) {			
				simplexTable.table.substractMultipliedRow(simplexTable.table.rows-1, solution["phaseI"]["rowsToSubstract"][i]);
			}
			paragraph.appendChild(document.createElement("br"));
			paragraph.appendChild(MathML.done(simplexTable.toMathML()));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Tagad var uzsākt iterāciju procesu jeb izmantot simpleksa algoritmu, lai atrisinātu palīgproblēmu."));
			var listOfPivots = solution["phaseI"]["listOfPivots"];
			for (var i = 0; i < listOfPivots.length; i++) {
				var row = listOfPivots[i][0];
				var col = listOfPivots[i][1];
				paragraph.appendChild(document.createElement("br"));
				paragraph.appendChild(MathML.done(simplexTable.toMathML(row, col)));
				simplexTable.moveToNextIteration(row, col);
			}
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Rezultātā iegūta šāda tabula:"));
			paragraph.appendChild(document.createElement("br"));
			paragraph.appendChild(MathML.done(simplexTable.toMathML()));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			if (solution["phaseI"]["success"]) {
				paragraph.appendChild(textNode("Palīgproblēmas mērķa funkcijas maksimālā vērtība ir nulle, tātad ir atrasts atbalsta plāns."));
				paragraph.appendChild(document.createElement("br"));
				paragraph.appendChild(textNode("Izmetam kolonnas, kuras atbilst mākslīgajiem mainīgiem, iegūstot šādu tabulu:"));
				paragraph.appendChild(document.createElement("br"));
				var columnsToRemove = solution["phaseII"]["columnsToRemove"];
				for (var i = columnsToRemove.length - 1; i >= 0; i--) {
					simplexTable.removeColumn(columnsToRemove[i]);
				}
				paragraph.appendChild(MathML.done(simplexTable.toMathML()));
				place.appendChild(paragraph);
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode("Nākamais solis ir tabulas pēdējās rindas aizpildīšana atbilstoši mērķa funkcijai:"));
				paragraph.appendChild(document.createElement("br"));
				for (var i = 0; i < simplexTable.table.cols; i++) {
					if (i < simplexTable.objective.linexp.coeffs.length) {
						simplexTable.table.matrix[simplexTable.table.rows-1][i] = simplexTable.objective.linexp.coeffs[i].opposite();
					} else {
						simplexTable.table.matrix[simplexTable.table.rows-1][i] = new Fraction(0);
					}
				}
				paragraph.appendChild(MathML.done(simplexTable.toMathML()));
				place.appendChild(paragraph);
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode("Tālāk mērķa funkcijā visus bāzes mainīgos izsakām ar citiem mainīgajiem. Tabulā tas nozīmē - attiecīgajam bāzes mainīgam atbilstošo tabulas rindu pareizina ar vajadzīgo skaitli un atņem no tabulas pēdējās rindas tā, lai pēdējā rindā pozīcijā, kas atbilst šim bāzes mainīgam, sanāktu nulle."));
				for (var i = 0; i < solution["phaseII"]["rowsToSubstract"].length; i++) {
					var r = solution["phaseII"]["rowsToSubstract"][i][0];
					var k = solution["phaseII"]["rowsToSubstract"][i][1];
					paragraph.appendChild(document.createElement("br"));
					paragraph.appendChild(textNode("Atņemam no pēdējās rindas " + (r + 1).toString() + ". rindu, pareizinātu ar "));
					paragraph.appendChild(MathML.done(MathML.row(k.toMathML())));
					paragraph.appendChild(textNode("."));
					simplexTable.table.substractMultipliedRow(simplexTable.table.rows-1, r, k);
				}
				place.appendChild(paragraph);
			} else {
				paragraph.appendChild(textNode("Palīgproblēmas mērķa funkcijas maksimālā vērtība nav nulle, tātad sākotnējā LPU plānu kopa ir tukša."));
				place.appendChild(paragraph);
				return;
			}
		} else {
			for (var i = 0; i < simplexTable.table.cols; i++) {
				if (i < simplexTable.objective.linexp.coeffs.length) {
					simplexTable.table.matrix[simplexTable.table.rows-1][i] = simplexTable.objective.linexp.coeffs[i].opposite();
				} else {
					simplexTable.table.matrix[simplexTable.table.rows-1][i] = new Fraction(0);
				}
			}
		}
		paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Iegūta šāda tabula:"));
		paragraph.appendChild(document.createElement("br"));
		paragraph.appendChild(MathML.done(simplexTable.toMathML()));
		place.appendChild(paragraph);
		paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Tagad var uzsākt iterāciju procesu jeb izmantot simpleksa algoritmu, lai atrisinātu doto LPU."));
		for (var i = 0; i < solution["phaseII"]["listOfPivots"].length; i++) {
			var row = solution["phaseII"]["listOfPivots"][i][0];
			var col = solution["phaseII"]["listOfPivots"][i][1];
			paragraph.appendChild(document.createElement("br"));
			paragraph.appendChild(MathML.done(simplexTable.toMathML(row, col)));
			simplexTable.moveToNextIteration(row, col);
		}
		place.appendChild(paragraph);
		paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Rezultātā iegūta šāda tabula:"));
		paragraph.appendChild(document.createElement("br"));
		paragraph.appendChild(MathML.done(simplexTable.toMathML()));
		place.appendChild(paragraph);
		if (solution["phaseII"]["success"]) {
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Redzams, ka iterāciju process beidzies veiksmīgi. No tabulas var nolasīt mērķa funkcijas optimālo vērtību, kas ir "));
			paragraph.appendChild(MathML.done(MathML.row(solution["phaseII"]["objectiveValue"].toMathML())));
			paragraph.appendChild(textNode(", kā arī optimālo plānu, kas ir "));
			var optimalPlan = solution["phaseII"]["resultingPlan"];
			var t1 = [], t2 = [];
			for (var i = 0; i < optimalPlan.length; i++) {
				t1 = t1.concat(Variable.defaultVariables(new Variable(i)));
				t2 = t2.concat(optimalPlan[i].toMathML());
				if (i < optimalPlan.length - 1) {
					t1.push(new MathML("mo", textNode(",")));
					t2.push(new MathML("mo", textNode(",")));
				}
			}
			var t = MathML.brackets(t1, "(", ")");
			t.push(new MathML("mo", textNode("=")));
			t = t.concat(MathML.brackets(t2, "(", ")"));
			paragraph.appendChild(MathML.done(MathML.row(t)));
			paragraph.appendChild(textNode("."));
			place.appendChild(paragraph);
			if (isMinProblem) {
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode("Sākotnējais LPU ir minimizācijas uzdevums, tāpēc tā mērķa funkcijas optimālā (minimālā) vērtība ir pretēja iegūtajai jeb "));
				paragraph.appendChild(MathML.done(MathML.row(solution["phaseII"]["objectiveValue"].opposite().toMathML())));
				paragraph.appendChild(textNode("."));
				place.appendChild(paragraph);
			}
			if (hasTransformations) {
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode("Sākotnējais LPU satur mainīgos bez nenegativitātes nosacījumiem, kuri tika aizvietoti ar nenegatīvu mainīgo starpību. Tātad ir jāveic attiecīgie aprēķini, lai iegūtu sākotnējā LPU optimālo plānu."));
				place.appendChild(paragraph);
				var variables = [], newOptimalPlan = [];
				for (var i = 0; i < transformations.length; i++) {
					var oldVariable = transformations[i][0], newVariableOne = transformations[i][1], newVariableTwo = transformations[i][2];
					paragraph = document.createElement("p");
					paragraph.appendChild(textNode("Mainīgā "));
					paragraph.appendChild(MathML.done(Variable.defaultVariables(new Variable(oldVariable))));
					paragraph.appendChild(textNode(" vērtība sanāk "));
					var difference = new Expression();
					var t1 = new Expression(new Variable(newVariableOne));
					difference = difference.add(t1);
					var t2 = new Expression(new Variable(newVariableTwo));
					difference = difference.add(t2.multiply(new Fraction(-1)));
					var math = difference.toMathML();
					math.push(new MathML("mo", textNode("=")));
					var value = optimalPlan[newVariableOne].substract(optimalPlan[newVariableTwo]);
					newOptimalPlan[oldVariable] = value;
					math = math.concat(value.toMathML());
					paragraph.appendChild(MathML.done(MathML.row(math)));
					place.appendChild(paragraph);
				}
				paragraph = document.createElement("p");
				var t1 = [], t2 = [];
				for (var i = 0; i < newOptimalPlan.length; i++) {
					t1 = t1.concat(Variable.defaultVariables(new Variable(i)));
					t2 = t2.concat(newOptimalPlan[i].toMathML());
					if (i < newOptimalPlan.length - 1) {
						t1.push(new MathML("mo", textNode(",")));
						t2.push(new MathML("mo", textNode(",")));
					}
				}
				var t = MathML.brackets(t1, "(", ")");
				t.push(new MathML("mo", textNode("=")));
				t = t.concat(MathML.brackets(t2, "(", ")"));
				paragraph.appendChild(textNode("Sākotnējā LPU optimālais plāns ir "));
				paragraph.appendChild(MathML.done(MathML.row(t)));
				paragraph.appendChild(textNode("."));
				place.appendChild(paragraph);
			}
		} else {
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Redzams, ka iterāciju process beidzies ar neveiksmi. Tas ir, LPU mērķa funkcija ir neierobežota."));
			place.appendChild(paragraph);
		}
	}
	static calculator(place) {
		var inputFields = {};
		var buttons = {};
		var paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Mainīgo skaits: "));
		inputFields["numberOfVariables"] = document.createElement("input");
		inputFields["numberOfVariables"].type = "text";
		inputFields["numberOfVariables"].size = 2;
		paragraph.appendChild(inputFields["numberOfVariables"]);
		paragraph.appendChild(textNode(" Lineāro ierobežojumu skaits: "));
		inputFields["numberOfInequalities"] = document.createElement("input");
		inputFields["numberOfInequalities"].type = "text";
		inputFields["numberOfInequalities"].size = 2;
		paragraph.appendChild(inputFields["numberOfInequalities"]);
		paragraph.appendChild(textNode(" "));
		buttons["start"] = document.createElement("button");
		buttons["start"].textContent = "OK";
		paragraph.appendChild(buttons["start"]);
		place.appendChild(paragraph);
		buttons["start"].onclick = function() {
			var numberOfVariables = parseInt(inputFields["numberOfVariables"].value);
			var numberOfInequalities = parseInt(inputFields["numberOfInequalities"].value);
			if (isNaN(numberOfVariables) || isNaN(numberOfInequalities)) {
				alert("Ievadi veselus skaitļus, kas lielāki par nulli!");
				return;
			}
			if (numberOfVariables < 1 || numberOfInequalities < 1) {
				alert("Ievadi veselus skaitļus, kas lielāki par nulli!");
				return;
			}
			inputFields["numberOfVariables"].disabled = true;
			inputFields["numberOfInequalities"].disabled = true;
			buttons["start"].disabled = true;
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Izvēlies 'max', ja vēlies maksimizēt mērķa funkciju, vai arī 'min', ja vēlies to minimizēt: "));
			inputFields["maxOrMin"] = document.createElement("select");
			var options = ["max", "min"];
			for (var i = 0; i < options.length; i++) {
				var op = document.createElement("option");
				op.value = options[i];
				op.text = options[i];
				inputFields["maxOrMin"].appendChild(op);
			}
			paragraph.appendChild(inputFields["maxOrMin"]);
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Ievadi mērķa funkcijas koeficientus!"));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			inputFields["objective"] = [];
			for (var i = 0; i < numberOfVariables; i++) {
				var c = document.createElement("input");
				c.type = "text";
				c.size = 6;
				paragraph.appendChild(c);
				paragraph.appendChild(textNode(" "));
				inputFields["objective"].push(c);
			}
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Ievadi LPU nevienādības (koeficientus, zīmes, brīvos locekļus)!"));
			place.appendChild(paragraph);
			inputFields["constraints"] = [];
			for (var i = 0; i < numberOfInequalities; i++) {
				var o = {};
				var t = [];
				paragraph = document.createElement("p");
				for (var j = 0; j < numberOfVariables; j++) {
					var c = document.createElement("input");
					c.type = "text";
					c.size = 6;
					paragraph.appendChild(c);
					paragraph.appendChild(textNode(" "));
					t.push(c);
				}
				o["coeffs"] = t;
				o["sign"] = document.createElement("select");
				options = ["<=", "=", ">="];
				for (var k = 0; k < options.length; k++) {
					var op = document.createElement("option");
					op.value = options[k];
					op.text = options[k];
					o["sign"].appendChild(op);
				}
				var b = document.createElement("input");
				b.type = "text";
				b.size = 6;
				o["B"] = b;
				paragraph.appendChild(o["sign"]);
				paragraph.appendChild(textNode(" "));
				paragraph.appendChild(b);
				inputFields["constraints"].push(o);
				place.appendChild(paragraph);
			}
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Ieraksti kārtas numurus (sākot skaitīt no 1 un atdalot ar atstarpi) mainīgajiem, kuriem ir nenegativitātes nosacījumi!"));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			inputFields["nonnegativeVariables"] = document.createElement("input");
			inputFields["nonnegativeVariables"].type = "text";
			inputFields["nonnegativeVariables"].size = 6;
			paragraph.appendChild(inputFields["nonnegativeVariables"]);
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			buttons["final"] = document.createElement("button");
			buttons["final"].textContent = "OK";
			paragraph.appendChild(buttons["final"]);
			place.appendChild(paragraph);
			buttons["final"].onclick = function() {
				var maximise = (inputFields["maxOrMin"].value === "max");
				var coeffs = [];
				for (var i = 0; i < numberOfVariables; i++) {
					var fraction = Fraction.parse(inputFields["objective"][i].value);
					if (fraction === undefined) {
						alert("Ievadītais mērķa funkcijas " + (i+1).toString() + ". koeficients nav ievadīts pareizi!");
						return;
					}
					coeffs.push(fraction);
				}
				var objective = new LinearObjective(new LinearExpression(coeffs), maximise);
				var constraints = [];
				for (var i = 0; i < numberOfInequalities; i++) {
					var coeffs = [];
					for (var j = 0; j < numberOfVariables; j++) {
						var fraction = Fraction.parse(inputFields["constraints"][i]["coeffs"][j].value);
						if (fraction === undefined) {
							alert((i+1).toString() + ". nevienādības " + (j+1).toString() + ". koeficients nav ievadīts pareizi!");
							return;
						}
						coeffs.push(fraction);
					}
					var index = ["<=", "=", ">="].indexOf(inputFields["constraints"][i]["sign"].value);
					var sign = ["le", "eq", "ge"][index];
					var fraction = Fraction.parse(inputFields["constraints"][i]["B"].value);
					if (fraction === undefined) {
						alert((i+1).toString() + ". nevienādības brīvais loceklis nav ievadīts pareizi!");
						return;
					}
					constraints.push(new LinearConstraint(new LinearExpression(coeffs), fraction, sign));
				}
				var nonnegativeVariables = [];
				var indexes = inputFields["nonnegativeVariables"].value.split(" ");
				for (var i = 0; i < indexes.length; i++) {
					if (indexes[i] !== "") {
						var index = parseInt(indexes[i]);
						if (isNaN(index)) {
							alert("Nenegatīvo mainīgo sarakstā ir ieviesusies kļūda!");
							return;
						} else {
							if (index < 1) {
								alert("Nenegatīvo mainīgo sarakstā ir ieklīdusi vērtība, kas mazāka par 1");
								return;
							}
							if (index > numberOfVariables) {
								alert("Pavisam ir " + numberOfVariables.toString() + " mainīgie. Sarakstā ir ieklīdusi vērtība, kas ir lielāka par mainīgo skaitu.");
								return;
							}
							if (nonnegativeVariables.indexOf(index - 1) < 0) {
								nonnegativeVariables.push(index - 1);
							}
						}
					}
				}
				nonnegativeVariables.sort();
				var LPP = new LinearProgrammingProblem(objective, constraints, nonnegativeVariables);
				inputFields["maxOrMin"].disabled = true;
				for (var i = 0; i < numberOfVariables; i++) {
					inputFields["objective"][i].disabled = true;
				}
				for (var i = 0; i < numberOfInequalities; i++) {
					for (var j = 0; j < numberOfVariables; j++) {
						inputFields["constraints"][i]["coeffs"][j].disabled = true;
					}
					inputFields["constraints"][i]["sign"].disabled = true;
					inputFields["constraints"][i]["B"].disabled = true;
				}
				inputFields["nonnegativeVariables"].disabled = true;
				buttons["final"].disabled = true;
				LPP.solution(place);
			}
		}
	}
	static getForDrawing(place) {
		var inputFields = {};
		var buttons = {};
		var paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Mainīgo skaits: "));
		inputFields["numberOfVariables"] = document.createElement("input");
		inputFields["numberOfVariables"].type = "text";
		inputFields["numberOfVariables"].size = 2;
		inputFields["numberOfVariables"].value = 2;
		inputFields["numberOfVariables"].disabled = true;
		paragraph.appendChild(inputFields["numberOfVariables"]);
		paragraph.appendChild(textNode(" Lineāro ierobežojumu skaits: "));
		inputFields["numberOfInequalities"] = document.createElement("input");
		inputFields["numberOfInequalities"].type = "text";
		inputFields["numberOfInequalities"].size = 2;
		paragraph.appendChild(inputFields["numberOfInequalities"]);
		paragraph.appendChild(textNode(" "));
		buttons["start"] = document.createElement("button");
		buttons["start"].textContent = "OK";
		paragraph.appendChild(buttons["start"]);
		place.appendChild(paragraph);
		buttons["start"].onclick = function() {
			var numberOfVariables = parseInt(inputFields["numberOfVariables"].value);
			var numberOfInequalities = parseInt(inputFields["numberOfInequalities"].value);
			if (isNaN(numberOfVariables) || isNaN(numberOfInequalities)) {
				alert("Ievadi veselus skaitļus, kas lielāki par nulli!");
				return;
			}
			if (numberOfVariables < 1 || numberOfInequalities < 1) {
				alert("Ievadi veselus skaitļus, kas lielāki par nulli!");
				return;
			}
			inputFields["numberOfVariables"].disabled = true;
			inputFields["numberOfInequalities"].disabled = true;
			buttons["start"].disabled = true;
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Izvēlies 'max', ja vēlies maksimizēt mērķa funkciju, vai arī 'min', ja vēlies to minimizēt: "));
			inputFields["maxOrMin"] = document.createElement("select");
			var options = ["max", "min"];
			for (var i = 0; i < options.length; i++) {
				var op = document.createElement("option");
				op.value = options[i];
				op.text = options[i];
				inputFields["maxOrMin"].appendChild(op);
			}
			paragraph.appendChild(inputFields["maxOrMin"]);
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Ievadi mērķa funkcijas koeficientus!"));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			inputFields["objective"] = [];
			for (var i = 0; i < numberOfVariables; i++) {
				var c = document.createElement("input");
				c.type = "text";
				c.size = 6;
				paragraph.appendChild(c);
				paragraph.appendChild(textNode(" "));
				inputFields["objective"].push(c);
			}
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Ievadi LPU nevienādības (koeficientus, zīmes, brīvos locekļus)!"));
			place.appendChild(paragraph);
			inputFields["constraints"] = [];
			for (var i = 0; i < numberOfInequalities; i++) {
				var o = {};
				var t = [];
				paragraph = document.createElement("p");
				for (var j = 0; j < numberOfVariables; j++) {
					var c = document.createElement("input");
					c.type = "text";
					c.size = 6;
					paragraph.appendChild(c);
					paragraph.appendChild(textNode(" "));
					t.push(c);
				}
				o["coeffs"] = t;
				o["sign"] = document.createElement("select");
				options = ["<=", "=", ">="];
				for (var k = 0; k < options.length; k++) {
					var op = document.createElement("option");
					op.value = options[k];
					op.text = options[k];
					o["sign"].appendChild(op);
				}
				var b = document.createElement("input");
				b.type = "text";
				b.size = 6;
				o["B"] = b;
				paragraph.appendChild(o["sign"]);
				paragraph.appendChild(textNode(" "));
				paragraph.appendChild(b);
				inputFields["constraints"].push(o);
				place.appendChild(paragraph);
			}
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Abi divi mainīgie būs obligāti nenegatīvi, jo citādi sanāk palielināt mainīgo skaitu un vairs nevar uzzīmēt plaknē."));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			inputFields["nonnegativeVariables"] = document.createElement("input");
			inputFields["nonnegativeVariables"].type = "text";
			inputFields["nonnegativeVariables"].size = 6;
			inputFields["nonnegativeVariables"].value = "1 2";
			inputFields["nonnegativeVariables"].disabled = true;
			paragraph.appendChild(inputFields["nonnegativeVariables"]);
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			buttons["final"] = document.createElement("button");
			buttons["final"].textContent = "OK";
			paragraph.appendChild(buttons["final"]);
			place.appendChild(paragraph);
			buttons["final"].onclick = function() {
				var maximise = (inputFields["maxOrMin"].value === "max");
				var coeffs = [];
				for (var i = 0; i < numberOfVariables; i++) {
					var fraction = Fraction.parse(inputFields["objective"][i].value);
					if (fraction === undefined) {
						alert("Ievadītais mērķa funkcijas " + (i+1).toString() + ". koeficients nav ievadīts pareizi!");
						return;
					}
					coeffs.push(fraction);
				}
				var objective = new LinearObjective(new LinearExpression(coeffs), maximise);
				var constraints = [];
				for (var i = 0; i < numberOfInequalities; i++) {
					var coeffs = [];
					for (var j = 0; j < numberOfVariables; j++) {
						var fraction = Fraction.parse(inputFields["constraints"][i]["coeffs"][j].value);
						if (fraction === undefined) {
							alert((i+1).toString() + ". nevienādības " + (j+1).toString() + ". koeficients nav ievadīts pareizi!");
							return;
						}
						coeffs.push(fraction);
					}
					var index = ["<=", "=", ">="].indexOf(inputFields["constraints"][i]["sign"].value);
					var sign = ["le", "eq", "ge"][index];
					var fraction = Fraction.parse(inputFields["constraints"][i]["B"].value);
					if (fraction === undefined) {
						alert((i+1).toString() + ". nevienādības brīvais loceklis nav ievadīts pareizi!");
						return;
					}
					constraints.push(new LinearConstraint(new LinearExpression(coeffs), fraction, sign));
				}
				var nonnegativeVariables = [];
				var indexes = inputFields["nonnegativeVariables"].value.split(" ");
				for (var i = 0; i < indexes.length; i++) {
					if (indexes[i] !== "") {
						var index = parseInt(indexes[i]);
						if (isNaN(index)) {
							alert("Nenegatīvo mainīgo sarakstā ir ieviesusies kļūda!");
							return;
						} else {
							if (index < 1) {
								alert("Nenegatīvo mainīgo sarakstā ir ieklīdusi vērtība, kas mazāka par 1");
								return;
							}
							if (index > numberOfVariables) {
								alert("Pavisam ir " + numberOfVariables.toString() + " mainīgie. Sarakstā ir ieklīdusi vērtība, kas ir lielāka par mainīgo skaitu.");
								return;
							}
							if (nonnegativeVariables.indexOf(index - 1) < 0) {
								nonnegativeVariables.push(index - 1);
							}
						}
					}
				}
				nonnegativeVariables.sort();
				var LPP = new LinearProgrammingProblem(objective, constraints, nonnegativeVariables);
				inputFields["maxOrMin"].disabled = true;
				for (var i = 0; i < numberOfVariables; i++) {
					inputFields["objective"][i].disabled = true;
				}
				for (var i = 0; i < numberOfInequalities; i++) {
					for (var j = 0; j < numberOfVariables; j++) {
						inputFields["constraints"][i]["coeffs"][j].disabled = true;
					}
					inputFields["constraints"][i]["sign"].disabled = true;
					inputFields["constraints"][i]["B"].disabled = true;
				}
				buttons["final"].disabled = true;
				LPP.draw(place, new Fraction(200));
			}
		}
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
			objective = new LinearObjective(linexp, false);
			problem = new LinearProgrammingProblem(objective, this.constraints, this.nonnegativeVariables);
			solution = problem.toSimplexTable().solution();
			if (solution["phaseII"]["success"]) {
				t.push(solution["phaseII"]["objectiveValue"].opposite());
			} else {
				t.push(undefined);
				inf["bounded"] = false;
			}			
			objective = new LinearObjective(linexp);
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


function vectorSubstract(a, b) {
	return [a[0].substract(b[0]), a[1].substract(b[1])];
}
function vectorSquared(a) {
	return a[0].multiply(a[0]).add(a[1].multiply(a[1]));
}

function compareVectors(v1, v2) {
	var det = v1[0].multiply(v2[1]).substract(v1[1].multiply(v2[0]));
	var zero = new Fraction(0);
	if (det.lessThan(zero)) {
		return true;
	}
	if (zero.lessThan(det)) {
		return false;
	}
	return vectorSquared(v2).lessThan(vectorSquared(v1));
}

function sortPoints(arrayOfPoints) {
	var t = [arrayOfPoints[0][0], arrayOfPoints[0][1]];
	arrayOfPoints.sort((v1, v2) => compareVectors(vectorSubstract(v1, t), vectorSubstract(v2, t)));
}

function fractionToDecimal(f) {
	return (Number(f.numer * 1000000n / f.denom)/1000000);
}

Polytope.prototype.draw = function(place, width) {
	var info = this.information();
	if (info["nonempty"]) {
		if (info["bounded"]) {
			var x1 = info["boundaries"][0][0], x2 = info["boundaries"][0][1];
			var y1 = info["boundaries"][1][0], y2 = info["boundaries"][1][1];
			var k = width.divide(x2.substract(x1));
			var height = y2.substract(y1).multiply(k);
			var draw = SVG().addTo(place).size(fractionToDecimal(width), fractionToDecimal(height));
			var vertices = this.allVertices();
			sortPoints(vertices);
			vertices = vertices.map(x => [x[0].substract(x1).multiply(k), height.substract(x[1].substract(y1).multiply(k))]);
			vertices = vertices.map(x => [fractionToDecimal(x[0]), fractionToDecimal(x[1])]);
			draw.rect(fractionToDecimal(width), fractionToDecimal(height)).fill("none").stroke({width: 1, color: "black"});
			draw.polygon(vertices).fill('green'); //.stroke({width: 1, color: "black"});
		} else {
			throw("This polytope isn't bounded");
		}
	} else {
		throw("This polytope is empty");
	}
}

LinearProgrammingProblem.prototype.draw = function(place, width, padding = 5) {
	var numberOfVariables = this.objective.linexp.coeffs.length;
	if (numberOfVariables !== 2) {
		var paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Mainīgo skaits nav vienāds ar 2, tāpēc neko nezīmēšu."));
		place.appendChild(paragraph);
		return;
	}
	var info = this.polytope.information();
	if (info["nonempty"]) {
		if (info["bounded"]) {
			var x1 = info["boundaries"][0][0], x2 = info["boundaries"][0][1];
			var y1 = info["boundaries"][1][0], y2 = info["boundaries"][1][1];
			var k = width.divide(x2.substract(x1));
			var height = y2.substract(y1).multiply(k);
			var draw = SVG().addTo(place).size(fractionToDecimal(width), fractionToDecimal(height));
			var vertices = this.polytope.allVertices();
			sortPoints(vertices);
			var temp = [];
			for (var i = 0; i < vertices.length; i++) {
				var v1 = vertices[i];
				var v2 = vertices[(i+1)%vertices.length];
				if (!v1[0].equalTo(v2[0]) || !v1[1].equalTo(v2[1])) {
					temp.push(v1);
				}
			}
			vertices = temp;
			var verticesInSVG = vertices.map(x => [x[0].substract(x1).multiply(k), height.substract(x[1].substract(y1).multiply(k))]);
			verticesInSVG = verticesInSVG.map(x => [fractionToDecimal(x[0]), fractionToDecimal(x[1])]);
			draw.rect(fractionToDecimal(width), fractionToDecimal(height)).fill("none").stroke({width: 1, color: "black"});
			draw.polygon(verticesInSVG).fill('green');
			for (var i = 0; i < vertices.length; i++) {
				draw.circle({cx: verticesInSVG[i][0], cy: verticesInSVG[i][1], r: 4}).fill("red").stroke({width: 1, color: "red"});
			}
		} else {
			var paragraph = document.createElement("p");
			paragraph.appendChild(textNode("Plānu kopa nav ierobežota, tāpēc neko nezīmēšu."));
			place.appendChild(paragraph);
			return;
		}
	} else {
		var paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Plānu kopa ir tukša jeb nesaderīga, tāpēc neko nezīmēšu."));
		place.appendChild(paragraph);
		return;
	}
}
